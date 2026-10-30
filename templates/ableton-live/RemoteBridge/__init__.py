"""Entry point Live calls when the script is selected as a Control Surface."""

try:
    from .surface import Surface
except ImportError:  # outside Live (unit tests) the ableton package does not exist
    Surface = None


def create_instance(c_instance):
    return Surface(c_instance)
