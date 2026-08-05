from fastapi import APIRouter, HTTPException, Response

from app.core.schemas import ExportRequest
from app.core.session_store import session_store
from app.export.docx_builder import build_bab_iv_docx

router = APIRouter(prefix="/api/export", tags=["export"])


@router.post("/docx")
def export_docx(req: ExportRequest):
    session = session_store.get(req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan atau sudah kedaluwarsa.")
    result = session.results.get(req.result_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Hasil uji tidak ditemukan.")

    doc_bytes = build_bab_iv_docx(result, req.narrative_text)
    filename = f"Hasil_{result.test_id}.docx"
    return Response(
        content=doc_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
