import threading
from datetime import date


class DailyRateLimiter:
    """Simple in-memory per-key daily counter -- not distributed/persistent,
    acceptable for a single-process MVP. Resets on process restart, which is
    fine since this is an abuse-prevention backstop on AI spend, not precise
    billing control."""

    def __init__(self, limit: int):
        self.limit = limit
        self._lock = threading.Lock()
        self._counts: dict[str, tuple[date, int]] = {}

    def allow(self, key: str) -> bool:
        today = date.today()
        with self._lock:
            last_date, count = self._counts.get(key, (today, 0))
            if last_date != today:
                count = 0
            if count >= self.limit:
                self._counts[key] = (last_date, count)
                return False
            self._counts[key] = (today, count + 1)
            return True
