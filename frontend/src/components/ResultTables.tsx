"use client";

import { useRef } from "react";
import CopyTableButton from "@/components/CopyTableButton";

const LABEL_OVERRIDES: Record<string, string> = {
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

function prettifyKey(key: string): string {
  return LABEL_OVERRIDES[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 1000) / 1000);
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "-";
  if (typeof v === "number") return formatNumber(v);
  if (typeof v === "boolean") return v ? "Ya" : "Tidak";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    if (v.length === 0) return "-";
    if (v.length === 2 && v.every((x) => typeof x === "number")) {
      return `${formatNumber(v[0])} - ${formatNumber(v[1])}`;
    }
    if (v.length > 5 && v.every((x) => typeof x === "object" && x !== null)) {
      return `(${v.length} titik data -- lihat grafik di atas)`;
    }
    return v.map(formatValue).join(", ");
  }
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if ("name" in obj && "value" in obj && Object.keys(obj).length === 2) {
      return `${obj.name} = ${formatValue(obj.value)}`;
    }
    return Object.entries(obj)
      .map(([k, val]) => `${prettifyKey(k)}: ${formatValue(val)}`)
      .join(" | ");
  }
  return String(v);
}

export function DescriptivesTable({ rows }: { rows: Record<string, unknown>[] }) {
  const tableRef = useRef<HTMLTableElement>(null);
  if (!rows || rows.length === 0) {
    return <p className="text-xs font-semibold text-duo-gray-soft">Tidak ada data deskriptif.</p>;
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
                  {prettifyKey(k)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-duo-gray-light/50">
                {keys.map((k) => (
                  <td key={k} className="px-2 py-1.5 font-semibold text-duo-gray-soft">
                    {formatValue(row[k])}
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
  const tableRef = useRef<HTMLTableElement>(null);
  const entries = Object.entries(stats);
  if (entries.length === 0) {
    return <p className="text-xs font-semibold text-duo-gray-soft">Tidak ada hasil uji.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full text-left text-xs">
          <tbody>
            {entries.map(([k, v]) => (
              <tr key={k} className="border-b border-duo-gray-light/50">
                <td className="px-2 py-1.5 font-black text-duo-gray whitespace-nowrap align-top">{prettifyKey(k)}</td>
                <td className="px-2 py-1.5 font-semibold text-duo-gray-soft">{formatValue(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CopyTableButton tableRef={tableRef} />
    </div>
  );
}
