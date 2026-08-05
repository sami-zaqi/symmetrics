from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

ColumnType = Literal["numeric", "categorical", "datetime", "unknown"]

TestId = Literal[
    "descriptive_statistics",
    "independent_ttest",
    "paired_ttest",
    "mann_whitney",
    "wilcoxon",
    "oneway_anova",
    "kruskal_wallis",
    "pearson_correlation",
    "spearman_correlation",
    "simple_linear_regression",
    "chi_square",
    "cronbach_alpha",
]

MethodUsed = Literal["parametric", "nonparametric_fallback", "as_selected"]


# ---------- Upload / dataset ----------

class ColumnInfo(BaseModel):
    name: str
    dtype: ColumnType
    missing_count: int
    unique_count: int


class DatasetSummary(BaseModel):
    session_id: str
    row_count: int
    columns: list[ColumnInfo]
    preview_rows: list[dict[str, Any]]


# ---------- Wizard ----------

class WizardAnswers(BaseModel):
    tujuan: Literal["deskriptif", "bandingkan", "hubungan", "prediksi", "reliabilitas"]
    jumlah_kelompok: Literal["dua", "lebih_dari_dua"] | None = None
    desain: Literal["independen", "berpasangan"] | None = None
    tipe_dv: Literal["numerik", "kategorik"] | None = None
    tipe_variabel_hubungan: Literal["keduanya_numerik", "keduanya_kategorik", "campuran"] | None = None


class WizardRecommendation(BaseModel):
    recommended_test: TestId
    fallback_test: TestId | None = None
    required_variable_roles: list[str]
    reasoning: str


class VariableMapping(BaseModel):
    dependent: str | None = None
    independent: str | None = None
    grouping: str | None = None
    items: list[str] | None = None  # for cronbach_alpha (multiple questionnaire items)


# ---------- Assumptions ----------

class AssumptionCheckRequest(BaseModel):
    session_id: str
    test_id: TestId
    mapping: VariableMapping


class AssumptionTestOutcome(BaseModel):
    name: str
    statistic: float
    p_value: float
    passed: bool
    detail: str


class AssumptionResult(BaseModel):
    checked: bool
    outcomes: list[AssumptionTestOutcome] = Field(default_factory=list)
    recommended_test: TestId
    fallback_triggered: bool
    reason: str | None = None


# ---------- Test execution ----------

class RunTestRequest(BaseModel):
    session_id: str
    test_id: TestId
    mapping: VariableMapping
    method_used: MethodUsed = "as_selected"
    fallback_reason: str | None = None
    assumptions: "AssumptionResult | None" = None


class ChartRef(BaseModel):
    type: Literal["histogram", "boxplot", "scatter"]
    caption_id: str
    image_base64: str


class TestResult(BaseModel):
    result_id: str
    test_id: TestId
    test_name_id: str
    variables: dict[str, Any]
    assumptions: AssumptionResult | None = None
    descriptives: list[dict[str, Any]] = Field(default_factory=list)
    test_statistics: dict[str, Any]
    method_used: MethodUsed
    fallback_reason: str | None = None
    charts: list[ChartRef] = Field(default_factory=list)
    engine_version: str
    generated_at: datetime


# ---------- Narrative ----------

class NarrativeRequest(BaseModel):
    session_id: str
    result_id: str
    mode: Literal["auto", "ai", "template"] = "auto"


class NarrativeResponse(BaseModel):
    narrative_text: str
    flagged_causal_language: bool
    source: Literal["ai", "template"] = "ai"


# ---------- Export ----------

class ExportRequest(BaseModel):
    session_id: str
    result_id: str
    narrative_text: str | None = None
