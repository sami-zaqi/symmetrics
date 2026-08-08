export type ColumnType = "numeric" | "categorical" | "datetime" | "unknown";

export interface ColumnInfo {
  name: string;
  dtype: ColumnType;
  missing_count: number;
  unique_count: number;
}

export interface OutlierInfo {
  column: string;
  count: number;
  lower_bound: number;
  upper_bound: number;
}

export type VariableScale = "nominal" | "ordinal" | "interval" | "rasio";

export interface CategoryCode {
  label: string;
  value: number;
}

export interface VariableDef {
  name: string;
  label: string;
  scale: VariableScale;
  categories?: CategoryCode[] | null;
}

export interface ConstructDef {
  name: string;
  items: string[];
}

export interface DataSchema {
  variables: VariableDef[];
  constructs: ConstructDef[];
  missing_value_symbol: string;
}

export interface DatasetSummary {
  session_id: string;
  row_count: number;
  columns: ColumnInfo[];
  preview_rows: Record<string, unknown>[];
  outliers: OutlierInfo[];
  constructs: ConstructDef[];
}

export type CleaningStrategy = "listwise_deletion" | "mean_mode_imputation" | "knn_imputation" | "mice_imputation";

export interface ValueCount {
  value: string;
  count: number;
}

export type Tujuan =
  | "deskriptif"
  | "bandingkan"
  | "hubungan"
  | "prediksi"
  | "reliabilitas"
  | "faktor_risiko"
  | "evaluasi_diagnostik"
  | "akurasi_prediksi"
  | "kelangsungan_hidup";

export interface WizardAnswers {
  tujuan: Tujuan;
  jumlah_kelompok?: "dua" | "lebih_dari_dua";
  desain?: "independen" | "berpasangan";
  tipe_dv?: "numerik" | "kategorik";
  tipe_variabel_hubungan?: "keduanya_numerik" | "keduanya_kategorik" | "campuran";
}

export type TestId =
  | "descriptive_statistics"
  | "independent_ttest"
  | "paired_ttest"
  | "mann_whitney"
  | "wilcoxon"
  | "oneway_anova"
  | "kruskal_wallis"
  | "pearson_correlation"
  | "spearman_correlation"
  | "simple_linear_regression"
  | "chi_square"
  | "cronbach_alpha"
  | "logistic_regression"
  | "diagnostic_test"
  | "roc_analysis"
  | "survival_analysis";

export interface WizardRecommendation {
  recommended_test: TestId;
  fallback_test: TestId | null;
  required_variable_roles: string[];
  reasoning: string;
}

export interface VariableMapping {
  dependent?: string | null;
  independent?: string | null;
  grouping?: string | null;
  items?: string[] | null;
  independents?: string[] | null;
  event_col?: string | null;
}

export interface AssumptionTestOutcome {
  name: string;
  statistic: number | null;
  p_value: number | null;
  passed: boolean;
  detail: string;
}

export interface AssumptionResult {
  checked: boolean;
  outcomes: AssumptionTestOutcome[];
  recommended_test: TestId;
  fallback_triggered: boolean;
  reason: string | null;
}

export interface ChartRef {
  type: "histogram" | "boxplot" | "scatter" | "roc_curve" | "km_curve";
  caption_id: string;
  image_base64: string;
}

export type MethodUsed = "parametric" | "nonparametric_fallback" | "as_selected";

export interface TestResult {
  result_id: string;
  test_id: TestId;
  test_name_id: string;
  variables: Record<string, unknown>;
  assumptions: AssumptionResult | null;
  descriptives: Record<string, unknown>[];
  test_statistics: Record<string, unknown>;
  method_used: MethodUsed;
  fallback_reason: string | null;
  charts: ChartRef[];
  engine_version: string;
  generated_at: string;
}

export interface NarrativeResponse {
  narrative_text: string;
  flagged_causal_language: boolean;
  source: "ai" | "template";
}

// ---------- SEM-PLS ----------

export interface SemConstruct {
  name: string;
  indicators: string[];
}

export interface SemPath {
  source: string;
  target: string;
}

export interface SemPlsResult {
  result_id: string;
  n: number;
  constructs: SemConstruct[];
  paths: SemPath[];
  loadings: Record<string, unknown>[];
  reliability: Record<string, unknown>[];
  path_coefficients: Record<string, unknown>[];
  r_squared: Record<string, unknown>[];
  effects: Record<string, unknown>[];
  discriminant_validity: Record<string, unknown>[];
  bootstrap: Record<string, unknown>[] | null;
  generated_at: string;
}
