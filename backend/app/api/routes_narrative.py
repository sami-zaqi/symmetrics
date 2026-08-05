from fastapi import APIRouter, HTTPException

from app.ai import template_narrative
from app.ai.narrative import generate_narrative
from app.core.schemas import NarrativeRequest, NarrativeResponse
from app.core.session_store import session_store

router = APIRouter(prefix="/api/narrative", tags=["narrative"])


@router.post("/generate", response_model=NarrativeResponse)
def narrative_generate(req: NarrativeRequest):
    session = session_store.get(req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan atau sudah kedaluwarsa.")
    result = session.results.get(req.result_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Hasil uji tidak ditemukan.")

    if req.mode == "template":
        text, flagged = template_narrative.generate(result)
        return NarrativeResponse(narrative_text=text, flagged_causal_language=flagged, source="template")

    try:
        text, flagged = generate_narrative(result)
        return NarrativeResponse(narrative_text=text, flagged_causal_language=flagged, source="ai")
    except Exception as exc:
        if req.mode == "ai":
            raise HTTPException(status_code=502, detail=f"Gagal menghubungi layanan AI: {exc}") from exc
        # auto mode: AI unavailable (e.g. billing/quota) -- fall back to the free template generator
        text, flagged = template_narrative.generate(result)
        return NarrativeResponse(narrative_text=text, flagged_causal_language=flagged, source="template")
