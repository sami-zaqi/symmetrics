import base64
import io

from docx import Document
from docx.shared import Inches, Pt

from app.core.schemas import TestResult

DISCLAIMER = (
    "Catatan: Narasi ini adalah draf bantuan interpretasi otomatis dan wajib ditinjau serta "
    "direvisi oleh mahasiswa bersama dosen pembimbing sebelum digunakan sebagai bagian final skripsi."
)


def _add_dict_table(doc: Document, rows: list[dict]) -> None:
    if not rows:
        return
    keys = list(rows[0].keys())
    table = doc.add_table(rows=1, cols=len(keys))
    table.style = "Light Grid Accent 1"
    hdr_cells = table.rows[0].cells
    for i, k in enumerate(keys):
        hdr_cells[i].text = str(k)
    for row in rows:
        cells = table.add_row().cells
        for i, k in enumerate(keys):
            cells[i].text = "" if row.get(k) is None else str(row.get(k))


def build_bab_iv_docx(result: TestResult, narrative_text: str | None) -> bytes:
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(12)

    doc.add_heading(result.test_name_id, level=1)

    doc.add_heading("Statistik Deskriptif", level=2)
    _add_dict_table(doc, result.descriptives)

    if result.assumptions and result.assumptions.checked:
        doc.add_heading("Uji Asumsi", level=2)
        outcome_rows = [
            {
                "Uji": o.name,
                "Statistik": o.statistic,
                "p-value": o.p_value,
                "Kesimpulan": o.detail,
            }
            for o in result.assumptions.outcomes
        ]
        _add_dict_table(doc, outcome_rows)

    doc.add_heading("Hasil Uji", level=2)
    stat_rows = [{"Parameter": k, "Nilai": v} for k, v in result.test_statistics.items()]
    _add_dict_table(doc, stat_rows)

    if result.charts:
        doc.add_heading("Visualisasi", level=2)
        for chart in result.charts:
            image_bytes = base64.b64decode(chart.image_base64)
            doc.add_picture(io.BytesIO(image_bytes), width=Inches(5))

    doc.add_heading("Interpretasi", level=2)
    text = narrative_text or "(Narasi belum dibuat.)"
    if DISCLAIMER not in text:
        text = text.rstrip() + "\n\n" + DISCLAIMER
    for paragraph in text.split("\n\n"):
        if paragraph.strip():
            doc.add_paragraph(paragraph.strip())

    doc.add_heading("Catatan Metodologis", level=2)
    audit_lines = [
        f"Metode: {result.method_used}",
        f"Alasan penyesuaian metode: {result.fallback_reason}" if result.fallback_reason else None,
        f"Mesin statistik: {result.engine_version}",
        f"Waktu pembuatan: {result.generated_at.isoformat()}",
    ]
    for line in audit_lines:
        if line:
            doc.add_paragraph(line, style="Intense Quote")

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()
