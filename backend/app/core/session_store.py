import threading
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

import pandas as pd

from app.config import settings
from app.core.schemas import ColumnType, DataSchema


@dataclass
class SessionData:
    df: pd.DataFrame
    wizard_answers: dict[str, Any] | None = None
    results: dict[str, Any] = field(default_factory=dict)
    narrative_cache: dict[str, tuple[str, bool, str]] = field(default_factory=dict)
    schema: DataSchema | None = None
    type_overrides: dict[str, ColumnType] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_accessed: datetime = field(default_factory=datetime.utcnow)


class SessionStore:
    """In-memory, process-local session store. Respondent-level data never touches disk
    and is evicted after an idle TTL, per the product's no-persistence privacy guarantee."""

    def __init__(self) -> None:
        self._sessions: dict[str, SessionData] = {}
        self._lock = threading.Lock()

    def create(self, df: pd.DataFrame) -> str:
        session_id = str(uuid.uuid4())
        with self._lock:
            self._sessions[session_id] = SessionData(df=df)
        return session_id

    def create_from_schema(self, schema: DataSchema) -> str:
        session_id = str(uuid.uuid4())
        empty_df = pd.DataFrame(columns=[v.name for v in schema.variables])
        with self._lock:
            self._sessions[session_id] = SessionData(df=empty_df, schema=schema)
        return session_id

    def get(self, session_id: str) -> SessionData | None:
        with self._lock:
            self._sweep_expired()
            session = self._sessions.get(session_id)
            if session:
                session.last_accessed = datetime.utcnow()
            return session

    def delete(self, session_id: str) -> bool:
        with self._lock:
            return self._sessions.pop(session_id, None) is not None

    def store_result(self, session_id: str, result_id: str, result: Any) -> None:
        with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                raise KeyError(session_id)
            session.results[result_id] = result
            session.last_accessed = datetime.utcnow()

    def _sweep_expired(self) -> None:
        cutoff = datetime.utcnow() - timedelta(minutes=settings.session_ttl_minutes)
        expired = [sid for sid, s in self._sessions.items() if s.last_accessed < cutoff]
        for sid in expired:
            self._sessions.pop(sid, None)


session_store = SessionStore()
