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
    "logistic_regression",
    "diagnostic_test",
    "roc_analysis",
    "survival_analysis",
]

MethodUsed = Literal["parametric", "nonparametric_fallback", "as_selected"]


# ---------- Upload / dataset ----------

class ColumnInfo(BaseModel):
    name: str
    dtype: ColumnType
    missing_count: int
    unique_count: int


class OutlierInfo(BaseModel):
    column: str
    count: int
    lower_bound: float
    upper_bound: float


class CleanDataRequest(BaseModel):
    session_id: str
    strategy: Literal["listwise_deletion", "mean_mode_imputation", "knn_imputation", "mice_imputation"]


class ColumnValuesRequest(BaseModel):
    session_id: str
    column: str


class ValueCount(BaseModel):
    value: str
    count: int


class RemapValuesRequest(BaseModel):
    session_id: str
    column: str
    mapping: dict[str, str]


class SetColumnTypeRequest(BaseModel):
    session_id: str
    column: str
    dtype: ColumnType


# ---------- Data schema (prospective data design / "Data Entry Builder") ----------

VariableScale = Literal["nominal", "ordinal", "interval", "rasio"]


class CategoryCode(BaseModel):
    label: str
    value: int


class VariableDef(BaseModel):
    name: str
    label: str
    scale: VariableScale
    categories: list[CategoryCode] | None = None


class ConstructDef(BaseModel):
    name: str
    items: list[str]


class DataSchema(BaseModel):
    variables: list[VariableDef]
    constructs: list[ConstructDef] = Field(default_factory=list)
    missing_value_symbol: str = ""


class DatasetSummary(BaseModel):
    session_id: str
    row_count: int
    columns: list[ColumnInfo]
    preview_rows: list[dict[str, Any]]
    outliers: list[OutlierInfo] = Field(default_factory=list)
    constructs: list[ConstructDef] = Field(default_factory=list)


# ---------- Wizard ----------

class WizardAnswers(BaseModel):
    tujuan: Literal[
        "deskriptif", "bandingkan", "hubungan", "prediksi", "reliabilitas",
        "faktor_risiko", "evaluasi_diagnostik",
        "akurasi_prediksi", "kelangsungan_hidup",
    ]
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
    independents: list[str] | None = None  # for logistic_regression (multiple predictors)
    event_col: str | None = None  # for survival_analysis (event/censoring indicator)


# ---------- Assumptions ----------

class AssumptionCheckRequest(BaseModel):
    session_id: str
    test_id: TestId
    mapping: VariableMapping


class AssumptionTestOutcome(BaseModel):
    name: str
    statistic: float
    p_value: float | None = None
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
    type: Literal["histogram", "boxplot", "scatter", "roc_curve", "km_curve"]
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
    force_regenerate: bool = False


class NarrativeResponse(BaseModel):
    narrative_text: str
    flagged_causal_language: bool
    source: Literal["ai", "template"] = "ai"


# ---------- Export ----------

class ExportRequest(BaseModel):
    session_id: str
    result_id: str
    narrative_text: str | None = None


# ---------- SEM-PLS ----------
# Structural Equation Modeling via Partial Least Squares. This doesn't fit the
# single-test_id wizard pattern above (a construct/path model, not a "pick 2
# columns" test), so it gets its own dedicated request/result shape.

class SemConstruct(BaseModel):
    name: str
    indicators: list[str]


class SemPath(BaseModel):
    source: str
    target: str


class SemPlsRequest(BaseModel):
    session_id: str
    constructs: list[SemConstruct]
    paths: list[SemPath]


class SemPlsResult(BaseModel):
    result_id: str
    n: int
    constructs: list[SemConstruct]
    paths: list[SemPath]
    loadings: list[dict[str, Any]]
    reliability: list[dict[str, Any]]
    path_coefficients: list[dict[str, Any]]
    r_squared: list[dict[str, Any]]
    effects: list[dict[str, Any]]
    discriminant_validity: list[dict[str, Any]]
    bootstrap: list[dict[str, Any]] | None = None
    generated_at: datetime


class SemBootstrapRequest(BaseModel):
    session_id: str
    result_id: str
    iterations: int = 300
