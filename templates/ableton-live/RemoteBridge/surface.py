"""
Control Surface that bridges Live to WebSocket clients.

- One ~100 ms tick via schedule_message polls the socket server; no threads (Live hangs if a script starts one)
- Features live in handlers: each maps actions to Live API calls and pushes state from Live listeners
- Status bar messages vanish after a few seconds, so important ones are repeated for a while
"""

import logging
import socket

from ableton.v2.control_surface import ControlSurface

from . import protocol
from .handlers import HANDLERS
from .ws_server import WebSocketServer

logger = logging.getLogger("remote_bridge")

NAME = "RemoteBridge"  # shown in messages; the folder name is what Live lists under Control Surface
PORT = 8080
ANNOUNCE_TIMES = 10
ANNOUNCE_EVERY_TICKS = 20  # about 2 s, shorter than the status bar's own timeout


def local_ip():
    # Connecting a UDP socket sends nothing; it only asks the OS which interface would be used
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("192.0.2.1", 80))  # TEST-NET address: never routed, no traffic leaves
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


class Surface(ControlSurface):
    def __init__(self, c_instance):
        ControlSurface.__init__(self, c_instance)
        self.server = None
        self.handlers = []
        self._announcement = None
        self._announce_left = 0
        try:
            self.server = WebSocketServer(port=PORT)
        except OSError as error:
            self._announce("%s: port %d is in use (%s)" % (NAME, PORT, error))
            return
        with self.component_guard():
            self.handlers = [cls(self) for cls in HANDLERS]
        self._announce("%s: listening on %s:%d" % (NAME, local_ip(), PORT))
        self.schedule_message(1, self._tick)

    # ---- status bar

    def _announce(self, text):
        logger.info(text)
        self._announcement, self._announce_left = text, ANNOUNCE_TIMES
        self._announce_again()

    def _announce_again(self):
        self.show_message(self._announcement)
        self._announce_left -= 1
        if self._announce_left > 0:
            self.schedule_message(ANNOUNCE_EVERY_TICKS, self._announce_again)

    # ---- networking

    def _tick(self):
        if self.server is None:
            return
        try:
            for kind, connection, payload in self.server.poll():
                if kind == "open":
                    for handler in self.handlers:
                        handler.send_initial_state(connection)
                elif kind == "message":
                    self._on_message(connection, payload)
        except Exception:
            logger.exception("%s: tick failed" % NAME)  # never let one bad message stop the loop
        self.schedule_message(1, self._tick)

    def _on_message(self, connection, raw):
        command = protocol.decode_command(raw)
        if command is None:
            return
        action, params, request_id = command["action"], command["params"], command["id"]
        if action == "ping":  # lets clients tell this server apart from anything else on the port
            ok, error = True, None
        else:
            handler = next((h for h in self.handlers if action in h.actions), None)
            ok, error = (False, "unknown action") if handler is None else (True, None)
            if handler is not None:
                try:
                    handler.handle(action, params)
                except Exception as exc:
                    ok, error = False, str(exc)
        if request_id is not None:
            connection.send_text(protocol.encode_response(request_id, ok, error))

    def broadcast(self, topic, value, **extra):
        if self.server is not None:
            self.server.broadcast(protocol.encode_state(topic, value, **extra))

    def disconnect(self):
        for handler in self.handlers:
            handler.remove_listeners()
        if self.server is not None:
            self.server.close()
        ControlSurface.disconnect(self)
