from pathlib import Path

from fastapi import APIRouter, HTTPException, Request

from app.ai import template_narrative
from app.ai.narrative import generate_narrative
from app.config import settings
from app.core.rate_limiter import DailyRateLimiter
from app.core.schemas import NarrativeRequest, NarrativeResponse
from app.core.session_store import session_store

router = APIRouter(prefix="/api/narrative", tags=["narrative"])

_RATE_LIMIT_STATE_PATH = Path(__file__).resolve().parent.parent.parent / ".local_state" / "narrative_rate_limit.json"
_ai_rate_limiter = DailyRateLimiter(settings.narrative_ai_daily_limit, persist_path=_RATE_LIMIT_STATE_PATH)


@router.post("/generate", response_model=NarrativeResponse)
def narrative_generate(body: NarrativeRequest, request: Request):
    session = session_store.get(body.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan atau sudah kedaluwarsa.")
    result = session.results.get(body.result_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Hasil uji tidak ditemukan.")

    # Serve from cache unless the user explicitly asked to regenerate --
    # avoids re-spending paid API tokens on page reloads / repeat views.
    if not body.force_regenerate and body.result_id in session.narrative_cache:
        text, flagged, source = session.narrative_cache[body.result_id]
        return NarrativeResponse(narrative_text=text, flagged_causal_language=flagged, source=source)

    if body.mode == "template":
        text, flagged = template_narrative.generate(result)
        session.narrative_cache[body.result_id] = (text, flagged, "template")
        return NarrativeResponse(narrative_text=text, flagged_causal_language=flagged, source="template")

    client_key = request.client.host if request.client else "unknown"
    if not _ai_rate_limiter.allow(client_key):
        if body.mode == "ai":
            raise HTTPException(
                status_code=429,
                detail=f"Batas harian pembuatan narasi AI ({settings.narrative_ai_daily_limit}x) sudah tercapai. Coba lagi besok atau gunakan mode Template Gratis.",
            )
        # auto mode: quota exhausted -- fall back to the free template generator
        text, flagged = template_narrative.generate(result)
        session.narrative_cache[body.result_id] = (text, flagged, "template")
        return NarrativeResponse(narrative_text=text, flagged_causal_language=flagged, source="template")

    try:
        text, flagged = generate_narrative(result)
        session.narrative_cache[body.result_id] = (text, flagged, "ai")
        return NarrativeResponse(narrative_text=text, flagged_causal_language=flagged, source="ai")
    except Exception as exc:
        if body.mode == "ai":
            raise HTTPException(status_code=502, detail=f"Gagal menghubungi layanan AI: {exc}") from exc
        # auto mode: AI unavailable (e.g. billing/quota) -- fall back to the free template generator
        text, flagged = template_narrative.generate(result)
        session.narrative_cache[body.result_id] = (text, flagged, "template")
        return NarrativeResponse(narrative_text=text, flagged_causal_language=flagged, source="template")
