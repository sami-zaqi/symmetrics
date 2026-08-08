import json
import os
import threading
from datetime import date
from pathlib import Path


class DailyRateLimiter:
    """In-memory per-key daily counter, optionally persisted to a small local
    JSON file. Persistence closes the trivial bypass of simply restarting the
    app to reset today's AI-narrative quota back to zero -- the in-memory-only
    version reset on every process restart by design. This file holds nothing
    but a usage counter (no respondent data), so it doesn't touch the
    no-persistence privacy guarantee that applies to uploaded datasets."""

    def __init__(self, limit: int, persist_path: Path | None = None):
        self.limit = limit
        self._lock = threading.Lock()
        self._persist_path = persist_path
        self._counts: dict[str, tuple[date, int]] = self._load()

    def _load(self) -> dict[str, tuple[date, int]]:
        if self._persist_path is None or not self._persist_path.exists():
            return {}
        try:
            raw = json.loads(self._persist_path.read_text(encoding="utf-8"))
            return {key: (date.fromisoformat(iso), count) for key, (iso, count) in raw.items()}
        except (OSError, ValueError, json.JSONDecodeError):
            # Corrupt or unreadable state file -- fail open to an empty counter
            # rather than blocking narrative generation entirely.
            return {}

    def _save(self) -> None:
        if self._persist_path is None:
            return
        try:
            self._persist_path.parent.mkdir(parents=True, exist_ok=True)
            payload = {key: (d.isoformat(), count) for key, (d, count) in self._counts.items()}
            tmp_path = self._persist_path.with_suffix(".tmp")
            tmp_path.write_text(json.dumps(payload), encoding="utf-8")
            os.replace(tmp_path, self._persist_path)
        except OSError:
            # Best-effort persistence -- an unwritable disk shouldn't break
            # narrative generation, it just falls back to in-memory-only.
            pass

    def allow(self, key: str) -> bool:
        today = date.today()
        with self._lock:
            last_date, count = self._counts.get(key, (today, 0))
            if last_date != today:
                count = 0
            if count >= self.limit:
                self._counts[key] = (last_date, count)
                self._save()
                return False
            self._counts[key] = (today, count + 1)
            self._save()
            return True
