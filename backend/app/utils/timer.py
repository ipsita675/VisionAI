import time


class Timer:
    """Simple context manager for measuring elapsed time."""

    def __init__(self):
        self.elapsed_ms = 0.0

    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        end = time.perf_counter()
        self.elapsed_ms = (end - self.start) * 1000