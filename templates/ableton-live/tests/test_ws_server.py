"""Tests that run without Live: protocol, frame codec, and a real socket round trip."""

import base64
import json
import os
import socket
import struct
import sys
import time
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from RemoteBridge import protocol, ws_server  # noqa: E402


def masked_frame(payload, opcode=ws_server.TEXT, fin=True, declared=None):
    data = payload.encode() if isinstance(payload, str) else payload
    mask = os.urandom(4)
    n = len(data) if declared is None else declared
    if n < 126:
        header = struct.pack("!BB", (0x80 if fin else 0) | opcode, 0x80 | n)
    elif n < 1 << 16:
        header = struct.pack("!BBH", (0x80 if fin else 0) | opcode, 0x80 | 126, n)
    else:
        header = struct.pack("!BBQ", (0x80 if fin else 0) | opcode, 0x80 | 127, n)
    return header + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(data))


class Client(object):
    def __init__(self, port):
        self.sock = socket.create_connection(("127.0.0.1", port), timeout=2)
        key = base64.b64encode(os.urandom(16)).decode()
        self.sock.sendall(("GET / HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                           "Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n" % key).encode())
        self.expected_accept = ws_server.accept_key(key)
        self.buffer = b""

    def read_until(self, server, predicate, timeout=2.0):
        end = time.time() + timeout
        self.sock.setblocking(False)
        events = []
        while time.time() < end:
            events += server.poll()
            try:
                self.buffer += self.sock.recv(65536)
            except BlockingIOError:
                pass
            except OSError:
                break
            if predicate(self.buffer):
                break
            time.sleep(0.01)
        return events


class ProtocolTest(unittest.TestCase):
    def test_decode_command(self):
        self.assertEqual(protocol.decode_command('{"type":"command","action":"play","id":"1"}'),
                         {"action": "play", "params": {}, "id": "1"})
        for bad in ["nope", "[]", '{"type":"state"}', '{"type":"command","action":""}', '{"type":"command","action":"x","params":[]}']:
            self.assertIsNone(protocol.decode_command(bad), bad)

    def test_encode(self):
        self.assertEqual(json.loads(protocol.encode_response("1", False, "boom")), {"type": "response", "id": "1", "ok": False, "error": "boom"})
        self.assertEqual(json.loads(protocol.encode_state("tempo", 120.0)), {"type": "state", "topic": "tempo", "value": 120.0})


class CodecTest(unittest.TestCase):
    def test_accept_key_rfc_example(self):
        self.assertEqual(ws_server.accept_key("dGhlIHNhbXBsZSBub25jZQ=="), "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=")

    def test_roundtrip_sizes(self):
        for size in (0, 125, 126, 70000 // 2):
            frame = masked_frame("a" * size)
            fin, opcode, payload, consumed = ws_server.decode_frame(bytearray(frame))
            self.assertEqual((fin, opcode, len(payload), consumed), (True, ws_server.TEXT, size, len(frame)))

    def test_partial_frame_waits(self):
        frame = masked_frame("hello")
        self.assertIsNone(ws_server.decode_frame(bytearray(frame[:-1])))

    def test_rejects_unmasked_and_oversized(self):
        with self.assertRaises(ws_server.ProtocolError):
            ws_server.decode_frame(bytearray(ws_server.encode_frame("x")))
        with self.assertRaises(ws_server.ProtocolError):
            ws_server.decode_frame(bytearray(masked_frame(b"", declared=2 ** 40)[:14]))

    def test_rejects_non_websocket_request(self):
        with self.assertRaises(ws_server.ProtocolError):
            ws_server.parse_handshake(bytearray(b"GET / HTTP/1.1\r\nHost: x\r\n\r\n"))


class ServerTest(unittest.TestCase):
    def setUp(self):
        self.server = ws_server.WebSocketServer(host="127.0.0.1", port=0)

    def tearDown(self):
        self.server.close()

    def test_handshake_message_ping_close(self):
        client = Client(self.server.port)
        events = client.read_until(self.server, lambda b: b"\r\n\r\n" in b)
        self.assertIn(("Sec-WebSocket-Accept: %s" % client.expected_accept).encode(), client.buffer)
        self.assertEqual([e[0] for e in events], ["open"])
        client.buffer = b""

        client.sock.sendall(masked_frame('{"type":"command","action":"play"}') + masked_frame(b"hi", ws_server.PING))
        events = client.read_until(self.server, lambda b: len(b) >= 4)
        self.assertEqual([(e[0], e[2]) for e in events], [("message", '{"type":"command","action":"play"}')])
        self.assertEqual(client.buffer[:4], ws_server.encode_frame(b"hi", ws_server.PONG))

        self.server.broadcast("state")
        client.buffer = b""
        client.read_until(self.server, lambda b: len(b) >= 7)
        self.assertEqual(client.buffer, ws_server.encode_frame("state"))

        client.sock.sendall(masked_frame(struct.pack("!H", 1000), ws_server.CLOSE))
        events = client.read_until(self.server, lambda b: False, timeout=0.3)
        self.assertIn("close", [e[0] for e in events])
        self.assertEqual(self.server.connections, [])
        client.sock.close()

    def test_oversized_message_closes_connection(self):
        client = Client(self.server.port)
        client.read_until(self.server, lambda b: b"\r\n\r\n" in b)
        client.sock.sendall(masked_frame(b"", declared=ws_server.MAX_MESSAGE_BYTES + 1)[:14])  # header + mask, no payload
        events = client.read_until(self.server, lambda b: False, timeout=0.3)
        self.assertIn("close", [e[0] for e in events])
        client.sock.close()


if __name__ == "__main__":
    unittest.main()
