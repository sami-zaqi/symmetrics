"use client";

import { useRef } from "react";
import CopyTableButton from "@/components/CopyTableButton";
import { useLanguage } from "@/lib/LanguageContext";
import type { Language, TranslationKey } from "@/lib/i18n";

const LABEL_OVERRIDES_ID: Record<string, string> = {
  group: "Kelompok",
  variable: "Variabel",
  n: "Jumlah Sampel (n)",
  mean: "Rata-rata",
  sd: "Simpangan Baku (SD)",
  median: "Median",
  statistic_name: "Jenis Statistik",
  statistic_value: "Nilai Statistik",
  statistic: "Nilai Statistik",
  df: "Derajat Bebas (df)",
  p_value: "Nilai p",
  effect_size: "Ukuran Efek (Effect Size)",
  confidence_interval: "Interval Kepercayaan 95%",
  power: "Power Statistik",
  interpretation: "Interpretasi",
  validity_note: "Catatan Validitas",
  n_items: "Jumlah Item",
  r_item_total: "Korelasi Item-Total",
  valid: "Valid",
  keterangan_validitas: "Keterangan Validitas",
  equation: "Persamaan Regresi",
  r_squared: "R-Squared",
  slope: "Slope (Kemiringan)",
  intercept: "Intercept",
  or_rr: "Odds Ratio & Relative Risk",
  odds_ratio: "Odds Ratio (OR)",
  relative_risk: "Relative Risk (RR)",
  or_ci95: "OR - Interval Kepercayaan 95%",
  rr_ci95: "RR - Interval Kepercayaan 95%",
  row_variable: "Variabel Baris",
  row_reference: "Kategori Referensi (Baris)",
  row_compared: "Kategori Dibandingkan (Baris)",
  col_variable: "Variabel Kolom",
  col_reference: "Kategori Referensi (Kolom)",
  col_event: "Kategori Kejadian (Kolom)",
  note: "Catatan",
  coef: "Koefisien",
  ci_lower: "Batas Bawah CI 95%",
  ci_upper: "Batas Atas CI 95%",
  encoding: "Pengkodean Kategori",
  pseudo_r2: "Pseudo R-Squared",
  log_likelihood: "Log-Likelihood",
  llr_p_value: "Nilai p Uji Model (LR Test)",
  dependent_encoding: "Pengkodean Variabel Dependen",
  tp: "True Positive (TP)",
  fp: "False Positive (FP)",
  fn: "False Negative (FN)",
  tn: "True Negative (TN)",
  sensitivity: "Sensitivitas",
  specificity: "Spesifisitas",
  ppv: "Nilai Duga Positif (PPV)",
  npv: "Nilai Duga Negatif (NPV)",
  accuracy: "Akurasi",
  positive_likelihood_ratio: "Rasio Kemungkinan Positif (LR+)",
  negative_likelihood_ratio: "Rasio Kemungkinan Negatif (LR-)",
  test_encoding: "Pengkodean Hasil Uji",
  disease_encoding: "Pengkodean Status Penyakit",
  auc: "AUC (Area Under Curve)",
  auc_ci95: "AUC - Interval Kepercayaan 95%",
  auc_interpretation: "Interpretasi AUC",
  n_positive: "Jumlah Kasus Positif",
  n_negative: "Jumlah Kasus Negatif",
  optimal_cutoff: "Titik Potong Optimal",
  sensitivity_at_cutoff: "Sensitivitas pada Titik Potong",
  specificity_at_cutoff: "Spesifisitas pada Titik Potong",
  youden_index: "Indeks Youden",
  outcome_encoding: "Pengkodean Outcome",
  roc_curve_points: "Titik Kurva ROC",
  log_rank: "Uji Log-Rank",
  group_variable: "Variabel Kelompok",
  groups: "Daftar Kelompok",
  curves: "Kurva per Kelompok",
  median_survival: "Median Waktu Bertahan",
  n_events: "Jumlah Kejadian",
  jumlah_kejadian: "Jumlah Kejadian",
  kelompok: "Kelompok",
  passed: "Terpenuhi",
  group_compared: "Kelompok Dibandingkan",
  observed_events: "Kejadian Teramati",
  expected_events: "Kejadian Ekspektasi",
  construct: "Konstruk",
  indicator: "Indikator",
  loading: "Nilai Loading",
  communality: "Communality",
  cronbach_alpha: "Cronbach's Alpha",
  composite_reliability: "Reliabilitas Komposit (CR)",
  ave: "AVE (Average Variance Extracted)",
  source: "Dari (Konstruk)",
  target: "Ke (Konstruk)",
  coefficient: "Koefisien Jalur",
  std_error: "Standard Error",
  t_value: "Nilai t",
  significant: "Signifikan (α=0.05)",
  type: "Tipe Konstruk",
  direct: "Efek Langsung",
  indirect: "Efek Tidak Langsung",
  total: "Efek Total",
  sqrt_ave: "√AVE",
  max_correlation_with_other: "Korelasi Maks. dgn Konstruk Lain",
  passes: "Lolos Validitas Diskriminan",
  correlations: "Korelasi Antar Konstruk",
  original: "Nilai Asli (Sampel Penuh)",
};

const LABEL_OVERRIDES_EN: Record<string, string> = {
  group: "Group",
  variable: "Variable",
  n: "Sample Size (n)",
  mean: "Mean",
  sd: "Standard Deviation (SD)",
  median: "Median",
  statistic_name: "Statistic Type",
  statistic_value: "Statistic Value",
  statistic: "Statistic Value",
  df: "Degrees of Freedom (df)",
  p_value: "p-value",
  effect_size: "Effect Size",
  confidence_interval: "95% Confidence Interval",
  power: "Statistical Power",
  interpretation: "Interpretation",
  validity_note: "Validity Note",
  n_items: "Number of Items",
  r_item_total: "Item-Total Correlation",
  valid: "Valid",
  keterangan_validitas: "Validity Note",
  equation: "Regression Equation",
  r_squared: "R-Squared",
  slope: "Slope",
  intercept: "Intercept",
  or_rr: "Odds Ratio & Relative Risk",
  odds_ratio: "Odds Ratio (OR)",
  relative_risk: "Relative Risk (RR)",
  or_ci95: "OR - 95% Confidence Interval",
  rr_ci95: "RR - 95% Confidence Interval",
  row_variable: "Row Variable",
  row_reference: "Reference Category (Row)",
  row_compared: "Compared Category (Row)",
  col_variable: "Column Variable",
  col_reference: "Reference Category (Column)",
  col_event: "Event Category (Column)",
  note: "Note",
  coef: "Coefficient",
  ci_lower: "95% CI Lower Bound",
  ci_upper: "95% CI Upper Bound",
  encoding: "Category Encoding",
  pseudo_r2: "Pseudo R-Squared",
  log_likelihood: "Log-Likelihood",
  llr_p_value: "Model Test p-value (LR Test)",
  dependent_encoding: "Dependent Variable Encoding",
  tp: "True Positive (TP)",
  fp: "False Positive (FP)",
  fn: "False Negative (FN)",
  tn: "True Negative (TN)",
  sensitivity: "Sensitivity",
  specificity: "Specificity",
  ppv: "Positive Predictive Value (PPV)",
  npv: "Negative Predictive Value (NPV)",
  accuracy: "Accuracy",
  positive_likelihood_ratio: "Positive Likelihood Ratio (LR+)",
  negative_likelihood_ratio: "Negative Likelihood Ratio (LR-)",
  test_encoding: "Test Result Encoding",
  disease_encoding: "Disease Status Encoding",
  auc: "AUC (Area Under Curve)",
  auc_ci95: "AUC - 95% Confidence Interval",
  auc_interpretation: "AUC Interpretation",
  n_positive: "Number of Positive Cases",
  n_negative: "Number of Negative Cases",
  optimal_cutoff: "Optimal Cutoff Point",
  sensitivity_at_cutoff: "Sensitivity at Cutoff",
  specificity_at_cutoff: "Specificity at Cutoff",
  youden_index: "Youden's Index",
  outcome_encoding: "Outcome Encoding",
  roc_curve_points: "ROC Curve Points",
  log_rank: "Log-Rank Test",
  group_variable: "Group Variable",
  groups: "Group List",
  curves: "Curves per Group",
  median_survival: "Median Survival Time",
  n_events: "Number of Events",
  jumlah_kejadian: "Number of Events",
  kelompok: "Group",
  passed: "Passed",
  group_compared: "Group Compared",
  observed_events: "Observed Events",
  expected_events: "Expected Events",
  construct: "Construct",
  indicator: "Indicator",
  loading: "Loading Value",
  communality: "Communality",
  cronbach_alpha: "Cronbach's Alpha",
  composite_reliability: "Composite Reliability (CR)",
  ave: "AVE (Average Variance Extracted)",
  source: "From (Construct)",
  target: "To (Construct)",
  coefficient: "Path Coefficient",
  std_error: "Standard Error",
  t_value: "t-value",
  significant: "Significant (α=0.05)",
  type: "Construct Type",
  direct: "Direct Effect",
  indirect: "Indirect Effect",
  total: "Total Effect",
  sqrt_ave: "√AVE",
  max_correlation_with_other: "Max. Correlation w/ Other Construct",
  passes: "Passes Discriminant Validity",
  correlations: "Inter-Construct Correlations",
  original: "Original Value (Full Sample)",
};

const LABEL_OVERRIDES: Record<Language, Record<string, string>> = { id: LABEL_OVERRIDES_ID, en: LABEL_OVERRIDES_EN };

function prettifyKey(key: string, lang: Language): string {
  return LABEL_OVERRIDES[lang][key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 1000) / 1000);
}

function formatValue(v: unknown, lang: Language, t: (key: TranslationKey) => string): string {
  if (v === null || v === undefined) return "-";
  if (typeof v === "number") return formatNumber(v);
  if (typeof v === "boolean") return v ? t("common_yes") : t("common_no");
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    if (v.length === 0) return "-";
    if (v.length === 2 && v.every((x) => typeof x === "number")) {
      return `${formatNumber(v[0])} - ${formatNumber(v[1])}`;
    }
    if (v.length > 5 && v.every((x) => typeof x === "object" && x !== null)) {
      return t("results_chart_points_note").replace("{n}", String(v.length));
    }
    return v.map((x) => formatValue(x, lang, t)).join(", ");
  }
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if ("name" in obj && "value" in obj && Object.keys(obj).length === 2) {
      return `${obj.name} = ${formatValue(obj.value, lang, t)}`;
    }
    return Object.entries(obj)
      .map(([k, val]) => `${prettifyKey(k, lang)}: ${formatValue(val, lang, t)}`)
      .join(" | ");
  }
  return String(v);
}

export function DescriptivesTable({ rows }: { rows: Record<string, unknown>[] }) {
  const { language, t } = useLanguage();
  const tableRef = useRef<HTMLTableElement>(null);
  if (!rows || rows.length === 0) {
    return <p className="text-xs font-semibold text-duo-gray-soft">{t("results_no_descriptives")}</p>;
  }
  const keys = Object.keys(rows[0]);
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full text-left text-xs">
          <thead>
            <tr className="border-b-2 border-duo-gray-light">
              {keys.map((k) => (
                <th key={k} className="px-2 py-1.5 font-black text-duo-gray whitespace-nowrap">
                  {prettifyKey(k, language)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-duo-gray-light/50">
                {keys.map((k) => (
                  <td key={k} className="px-2 py-1.5 font-semibold text-duo-gray-soft">
                    {formatValue(row[k], language, t)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CopyTableButton tableRef={tableRef} />
    </div>
  );
}

export function StatSummary({ stats }: { stats: Record<string, unknown> }) {
  const { language, t } = useLanguage();
  const tableRef = useRef<HTMLTableElement>(null);
  const entries = Object.entries(stats);
  if (entries.length === 0) {
    return <p className="text-xs font-semibold text-duo-gray-soft">{t("results_no_stats")}</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full text-left text-xs">
          <tbody>
            {entries.map(([k, v]) => (
              <tr key={k} className="border-b border-duo-gray-light/50">
                <td className="px-2 py-1.5 font-black text-duo-gray whitespace-nowrap align-top">{prettifyKey(k, language)}</td>
                <td className="px-2 py-1.5 font-semibold text-duo-gray-soft">{formatValue(v, language, t)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CopyTableButton tableRef={tableRef} />
    </div>
  );
}
