"""
Single-threaded, non-blocking WebSocket server using only the standard library (RFC 6455 subset).

Live's embedded Python has no pip and must not start threads, so the Control Surface calls
`poll()` once per tick from Live's main thread. Supported: text messages in one frame, ping/pong,
close. Not supported: fragmented messages, binary messages, extensions (compression).
"""

import base64
import hashlib
import socket
import struct

GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
MAX_HEADER_BYTES = 8 * 1024
MAX_MESSAGE_BYTES = 64 * 1024  # control messages are small; anything larger closes the connection
MAX_CLIENTS = 8

TEXT, CLOSE, PING, PONG = 0x1, 0x8, 0x9, 0xA


class ProtocolError(Exception):
    pass


def accept_key(client_key):
    return base64.b64encode(hashlib.sha1((client_key + GUID).encode("ascii")).digest()).decode("ascii")


def parse_handshake(data):
    """Return (headers, consumed) once the request headers are complete, else None."""
    end = data.find(b"\r\n\r\n")
    if end == -1:
        if len(data) > MAX_HEADER_BYTES:
            raise ProtocolError("handshake too large")
        return None
    lines = bytes(data[:end]).decode("latin-1").split("\r\n")
    if not lines[0].startswith("GET "):
        raise ProtocolError("not a GET request")
    headers = {}
    for line in lines[1:]:
        name, sep, value = line.partition(":")
        if sep:
            headers[name.strip().lower()] = value.strip()
    if "websocket" not in headers.get("upgrade", "").lower() or "sec-websocket-key" not in headers:
        raise ProtocolError("not a WebSocket upgrade")
    return headers, end + 4


def handshake_response(client_key):
    return (
        "HTTP/1.1 101 Switching Protocols\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        "Sec-WebSocket-Accept: %s\r\n\r\n" % accept_key(client_key)
    ).encode("ascii")


def encode_frame(payload, opcode=TEXT):
    """Server frames are never masked."""
    if isinstance(payload, str):
        payload = payload.encode("utf-8")
    n = len(payload)
    if n < 126:
        header = struct.pack("!BB", 0x80 | opcode, n)
    elif n < 1 << 16:
        header = struct.pack("!BBH", 0x80 | opcode, 126, n)
    else:
        header = struct.pack("!BBQ", 0x80 | opcode, 127, n)
    return header + payload


def decode_frame(data):
    """Return (fin, opcode, payload, consumed) for one complete frame, or None if more bytes are needed."""
    if len(data) < 2:
        return None
    b0, b1 = data[0], data[1]
    if not b1 & 0x80:
        raise ProtocolError("client frames must be masked")
    length, offset = b1 & 0x7F, 2
    if length == 126:
        if len(data) < 4:
            return None
        length, offset = struct.unpack("!H", bytes(data[2:4]))[0], 4
    elif length == 127:
        if len(data) < 10:
            return None
        length, offset = struct.unpack("!Q", bytes(data[2:10]))[0], 10
    # Check the declared length before buffering: a huge length would otherwise grow memory forever
    if length > MAX_MESSAGE_BYTES:
        raise ProtocolError("message too large")
    if len(data) < offset + 4 + length:
        return None
    mask = bytes(data[offset:offset + 4])
    start = offset + 4
    payload = bytes(b ^ mask[i % 4] for i, b in enumerate(data[start:start + length]))
    return bool(b0 & 0x80), b0 & 0x0F, payload, start + length


class Connection(object):
    def __init__(self, sock, address):
        self.sock = sock
        self.address = address
        self.open = False
        self.closed = False
        self._in = bytearray()
        self._out = bytearray()
        sock.setblocking(False)

    def send_text(self, text):
        if self.open and not self.closed:
            self._out += encode_frame(text)

    def _read(self):
        try:
            while True:
                chunk = self.sock.recv(4096)
                if not chunk:
                    self.closed = True
                    return
                self._in += chunk
        except (BlockingIOError, InterruptedError):
            pass
        except OSError:
            self.closed = True

    def _flush(self):
        try:
            while self._out:
                sent = self.sock.send(self._out)
                del self._out[:sent]
        except (BlockingIOError, InterruptedError):
            pass
        except OSError:
            self.closed = True

    def poll(self):
        """Read, parse, and write once. Returns a list of ("open" | "message" | "close", payload)."""
        events = []
        self._read()
        try:
            if not self.open and not self.closed:
                parsed = parse_handshake(self._in)
                if parsed:
                    headers, consumed = parsed
                    del self._in[:consumed]
                    self._out += handshake_response(headers["sec-websocket-key"])
                    self.open = True
                    events.append(("open", None))
            while self.open and not self.closed:
                frame = decode_frame(self._in)
                if frame is None:
                    break
                fin, opcode, payload, consumed = frame
                del self._in[:consumed]
                if opcode == TEXT and fin:
                    events.append(("message", payload.decode("utf-8", "replace")))
                elif opcode == PING:
                    self._out += encode_frame(payload, PONG)
                elif opcode == CLOSE:
                    self._out += encode_frame(payload[:2], CLOSE)
                    self.closed = True
                elif opcode == PONG:
                    pass
                else:
                    raise ProtocolError("unsupported frame (opcode %d, fin %s)" % (opcode, fin))
        except ProtocolError:
            self.closed = True
        self._flush()
        if self.closed:
            try:
                self.sock.close()
            except OSError:
                pass
            if self.open:
                events.append(("close", None))
        return events


class WebSocketServer(object):
    def __init__(self, host="0.0.0.0", port=8080):
        self.connections = []
        self._listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._listener.bind((host, port))  # raises OSError when the port is taken; report it to the user
        self._listener.listen(MAX_CLIENTS)
        self._listener.setblocking(False)

    @property
    def port(self):
        return self._listener.getsockname()[1]

    def poll(self):
        """Accept, read, and write without blocking. Returns [(kind, connection, payload)]."""
        try:
            while True:
                sock, address = self._listener.accept()
                if len(self.connections) >= MAX_CLIENTS:
                    sock.close()
                    continue
                self.connections.append(Connection(sock, address))
        except (BlockingIOError, InterruptedError):
            pass
        except OSError:
            pass
        events = []
        for connection in list(self.connections):
            for kind, payload in connection.poll():
                events.append((kind, connection, payload))
            if connection.closed:
                self.connections.remove(connection)
        return events

    def broadcast(self, text):
        for connection in self.connections:
            connection.send_text(text)

    def close(self):
        for connection in self.connections:
            try:
                connection.sock.close()
            except OSError:
                pass
        self.connections = []
        self._listener.close()
