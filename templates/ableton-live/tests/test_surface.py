"""Runs the Control Surface against a fake Live API, so dispatch and listeners are tested without Live."""

import json
import os
import sys
import types
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


class FakeSong(object):
    def __init__(self):
        self.is_playing = False
        self._tempo = 120.0
        self.listeners = {"is_playing": [], "tempo": []}

    def _notify(self, prop):
        for callback in list(self.listeners[prop]):
            callback()

    @property
    def tempo(self):
        return self._tempo

    @tempo.setter
    def tempo(self, value):
        self._tempo = value
        self._notify("tempo")

    def start_playing(self):
        self.is_playing = True
        self._notify("is_playing")

    def stop_playing(self):
        self.is_playing = False
        self._notify("is_playing")

    def add_is_playing_listener(self, cb):
        self.listeners["is_playing"].append(cb)

    def remove_is_playing_listener(self, cb):
        self.listeners["is_playing"].remove(cb)

    def add_tempo_listener(self, cb):
        self.listeners["tempo"].append(cb)

    def remove_tempo_listener(self, cb):
        self.listeners["tempo"].remove(cb)


class FakeControlSurface(object):
    def __init__(self, c_instance):
        self.song = FakeSong()
        self.scheduled = []
        self.messages = []

    def schedule_message(self, ticks, callback):
        self.scheduled.append(callback)

    def show_message(self, text):
        self.messages.append(text)

    def component_guard(self):
        import contextlib

        return contextlib.nullcontext()

    def disconnect(self):
        pass


module = types.ModuleType("ableton.v2.control_surface")
module.ControlSurface = FakeControlSurface
for name in ("ableton", "ableton.v2"):
    sys.modules.setdefault(name, types.ModuleType(name))
sys.modules["ableton.v2.control_surface"] = module

from RemoteBridge import surface as surface_module  # noqa: E402


class FakeConnection(object):
    def __init__(self):
        self.sent = []

    def send_text(self, text):
        self.sent.append(json.loads(text))


class SurfaceTest(unittest.TestCase):
    def setUp(self):
        surface_module.PORT = 0
        self.surface = surface_module.Surface(None)
        self.connection = FakeConnection()
        self.broadcasts = []
        self.surface.server.broadcast = lambda text: self.broadcasts.append(json.loads(text))

    def tearDown(self):
        self.surface.disconnect()

    def send(self, **message):
        self.surface._on_message(self.connection, json.dumps(dict(type="command", **message)))
        return self.connection.sent[-1] if self.connection.sent else None

    def test_announces_and_schedules_tick(self):
        self.assertTrue(self.surface.messages[0].startswith("RemoteBridge: listening on"))
        self.assertIn(self.surface._tick, self.surface.scheduled)

    def test_ping_and_unknown_action(self):
        self.assertEqual(self.send(action="ping", id="d"), {"type": "response", "id": "d", "ok": True})
        self.assertEqual(self.send(action="nope", id="u")["error"], "unknown action")

    def test_command_changes_song_and_listener_pushes_state(self):
        self.assertTrue(self.send(action="play", id="1")["ok"])
        self.assertEqual(self.broadcasts[-1], {"type": "state", "topic": "is_playing", "value": True})

    def test_handler_error_is_reported(self):
        response = self.send(action="set_tempo", params={"value": 5000}, id="t")
        self.assertEqual((response["ok"], response["error"]), (False, "tempo out of range"))

    def test_initial_state_and_listener_cleanup(self):
        self.surface.handlers[0].send_initial_state(self.connection)
        self.assertEqual([m["topic"] for m in self.connection.sent], ["is_playing", "tempo"])
        song = self.surface.song
        self.surface.disconnect()
        self.assertEqual(song.listeners, {"is_playing": [], "tempo": []})


if __name__ == "__main__":
    unittest.main()
