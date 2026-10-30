"""
Feature handlers. Each one declares the actions it accepts, calls the Live API, and pushes state
from Live's listeners (add_<property>_listener). Listeners are removed on disconnect.
"""

from . import protocol


class Handler(object):
    actions = ()

    def __init__(self, surface):
        self.surface = surface
        self.song = surface.song
        self._listeners = []
        self.add_listeners()

    def add_listeners(self):
        pass

    def handle(self, action, params):
        raise NotImplementedError

    def send_initial_state(self, connection):
        pass

    def listen(self, target, prop, callback):
        getattr(target, "add_%s_listener" % prop)(callback)
        self._listeners.append((target, prop, callback))

    def remove_listeners(self):
        for target, prop, callback in self._listeners:
            try:
                getattr(target, "remove_%s_listener" % prop)(callback)
            except Exception:
                pass  # the object may already be gone (a deleted track)
        self._listeners = []


class TransportHandler(Handler):
    actions = ("play", "stop", "set_tempo")

    def add_listeners(self):
        self.listen(self.song, "is_playing", lambda: self.surface.broadcast("is_playing", self.song.is_playing))
        self.listen(self.song, "tempo", lambda: self.surface.broadcast("tempo", self.song.tempo))

    def handle(self, action, params):
        if action == "play":
            self.song.start_playing()
        elif action == "stop":
            self.song.stop_playing()
        elif action == "set_tempo":
            tempo = float(params["value"])
            if not 20.0 <= tempo <= 999.0:  # Live's own range; validate before touching the song
                raise ValueError("tempo out of range")
            self.song.tempo = tempo

    def send_initial_state(self, connection):
        connection.send_text(protocol.encode_state("is_playing", self.song.is_playing))
        connection.send_text(protocol.encode_state("tempo", self.song.tempo))


HANDLERS = [TransportHandler]
