"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/SessionContext";
import StepProgress from "@/components/StepProgress";
import type { TestId, VariableMapping, WizardAnswers } from "@/lib/types";

const NEEDS_GROUPING: TestId[] = ["independent_ttest", "oneway_anova"];
const NEEDS_PAIR: TestId[] = ["paired_ttest"];
const NEEDS_XY: TestId[] = [
  "pearson_correlation",
  "spearman_correlation",
  "simple_linear_regression",
  "chi_square",
];
const NEEDS_ITEMS: TestId[] = ["cronbach_alpha", "descriptive_statistics"];
const NEEDS_LOGISTIC: TestId[] = ["logistic_regression"];
const NEEDS_DIAGNOSTIC: TestId[] = ["diagnostic_test"];

export default function WizardPage() {
  const router = useRouter();
  const { dataset, recommendation, setRecommendation, setWizardAnswers, mapping, setMapping, setActiveTestId } =
    useSession();
  const [answers, setAnswers] = useState<Partial<WizardAnswers>>({});
  const [error, setError] = useState<string | null>(null);

  if (!dataset) {
    return (
      <div className="flex flex-col gap-6">
        <StepProgress current={2} />
        <div className="card-duo-yellow">
          <p className="font-bold text-duo-gray">
            Belum ada data nih. Yuk{" "}
            <a href="/upload" className="underline text-duo-blue-dark">
              unggah data
            </a>{" "}
            dulu sebelum lanjut ke sini.
          </p>
        </div>
      </div>
    );
  }

  const columns = dataset.columns;
  const numericCols = columns.filter((c) => c.dtype === "numeric").map((c) => c.name);
  const categoricalCols = columns.filter((c) => c.dtype === "categorical").map((c) => c.name);

  async function submitAnswers(a: WizardAnswers) {
    setError(null);
    try {
      const rec = await api.wizardRecommend(a);
      setWizardAnswers(a);
      setRecommendation(rec);
      setActiveTestId(rec.recommended_test);
      setMapping({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat rekomendasi.");
    }
  }

  function update(patch: Partial<WizardAnswers>) {
    setAnswers((prev) => ({ ...prev, ...patch }));
  }

  function updateMapping(patch: Partial<VariableMapping>) {
    setMapping({ ...mapping, ...patch });
  }

  const testId = recommendation?.recommended_test ?? null;

  return (
    <div className="flex flex-col gap-6">
      <StepProgress current={2} />
      <h1 className="text-xl font-black text-duo-gray">🧭 Pilih Uji yang Tepat</h1>

      {!recommendation && (
        <div className="card-duo flex flex-col gap-5">
          <Question
            label="Apa tujuan analisis kamu?"
            value={answers.tujuan}
            options={[
              { value: "deskriptif", label: "Deskriptif saja" },
              { value: "bandingkan", label: "Membandingkan kelompok" },
              { value: "hubungan", label: "Melihat hubungan antar variabel" },
              { value: "prediksi", label: "Memprediksi nilai" },
              { value: "reliabilitas", label: "Menguji reliabilitas kuesioner" },
              { value: "faktor_risiko", label: "Faktor-faktor yang berhubungan dengan suatu kejadian" },
              { value: "evaluasi_diagnostik", label: "Evaluasi alat/uji diagnostik" },
            ]}
            onChange={(v) => update({ tujuan: v as WizardAnswers["tujuan"] })}
          />

          {answers.tujuan === "bandingkan" && (
            <Question
              label="Berapa kelompok yang dibandingkan?"
              value={answers.jumlah_kelompok}
              options={[
                { value: "dua", label: "2 kelompok" },
                { value: "lebih_dari_dua", label: "Lebih dari 2 kelompok" },
              ]}
              onChange={(v) => update({ jumlah_kelompok: v as WizardAnswers["jumlah_kelompok"] })}
            />
          )}

          {answers.tujuan === "bandingkan" && answers.jumlah_kelompok === "dua" && (
            <Question
              label="Desain kelompoknya?"
              value={answers.desain}
              options={[
                { value: "independen", label: "Independen (subjek berbeda)" },
                { value: "berpasangan", label: "Berpasangan (subjek sama, 2 waktu)" },
              ]}
              onChange={(v) => update({ desain: v as WizardAnswers["desain"] })}
            />
          )}

          {answers.tujuan === "hubungan" && (
            <Question
              label="Tipe kedua variabel?"
              value={answers.tipe_variabel_hubungan}
              options={[
                { value: "keduanya_numerik", label: "Keduanya numerik" },
                { value: "keduanya_kategorik", label: "Keduanya kategorik" },
              ]}
              onChange={(v) => update({ tipe_variabel_hubungan: v as WizardAnswers["tipe_variabel_hubungan"] })}
            />
          )}

          {isReady(answers) && (
            <button onClick={() => submitAnswers(answers as WizardAnswers)} className="btn-duo-green w-fit">
              Dapatkan Rekomendasi ✨
            </button>
          )}
          {error && <p className="text-sm font-bold text-duo-red-dark">⚠ {error}</p>}
        </div>
      )}

      {recommendation && testId && (
        <div className="card-duo-blue flex flex-col gap-4">
          <p className="text-sm font-semibold text-duo-gray">{recommendation.reasoning}</p>
          <p className="font-black text-duo-blue-dark">
            🎯 Uji direkomendasikan: {testId.replaceAll("_", " ")}
          </p>
          <ul className="flex flex-col gap-1 text-xs font-semibold text-duo-gray-soft">
            {recommendation.required_variable_roles.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>

          <div className="grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2">
            {(NEEDS_GROUPING.includes(testId) || testId === "independent_ttest") && (
              <>
                <Select label="Variabel Dependen (numerik)" options={numericCols} value={mapping.dependent ?? ""} onChange={(v) => updateMapping({ dependent: v })} />
                <Select label="Variabel Pengelompokan" options={categoricalCols} value={mapping.grouping ?? ""} onChange={(v) => updateMapping({ grouping: v })} />
              </>
            )}
            {NEEDS_PAIR.includes(testId) && (
              <>
                <Select label="Kolom Pengukuran 1" options={numericCols} value={mapping.items?.[0] ?? ""} onChange={(v) => updateMapping({ items: [v, mapping.items?.[1] ?? ""] })} />
                <Select label="Kolom Pengukuran 2" options={numericCols} value={mapping.items?.[1] ?? ""} onChange={(v) => updateMapping({ items: [mapping.items?.[0] ?? "", v] })} />
              </>
            )}
            {NEEDS_XY.includes(testId) && (
              <>
                <Select
                  label={testId === "chi_square" ? "Variabel Kategorik 1" : "Variabel Independen (X)"}
                  options={testId === "chi_square" ? categoricalCols : numericCols}
                  value={mapping.independent ?? ""}
                  onChange={(v) => updateMapping({ independent: v })}
                />
                <Select
                  label={testId === "chi_square" ? "Variabel Kategorik 2" : "Variabel Dependen (Y)"}
                  options={testId === "chi_square" ? categoricalCols : numericCols}
                  value={mapping.dependent ?? ""}
                  onChange={(v) => updateMapping({ dependent: v })}
                />
              </>
            )}
            {testId === "cronbach_alpha" && dataset.constructs.length > 0 && (
              <div className="sm:col-span-2">
                <p className="mb-1 text-sm font-bold text-duo-gray">Pilih dari Konstruk yang Sudah Dirancang</p>
                <div className="flex flex-wrap gap-2">
                  {dataset.constructs.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => updateMapping({ items: c.items })}
                      className="rounded-xl border-2 border-duo-yellow-dark bg-duo-yellow-light px-3 py-1.5 text-xs font-bold text-duo-gray"
                    >
                      🧩 {c.name} ({c.items.length} item)
                    </button>
                  ))}
                </div>
              </div>
            )}
            {NEEDS_ITEMS.includes(testId) && (
              <MultiSelect
                label={testId === "cronbach_alpha" ? "Item Kuesioner" : "Variabel"}
                options={testId === "cronbach_alpha" ? [...numericCols, ...categoricalCols] : numericCols}
                value={mapping.items ?? []}
                onChange={(v) => updateMapping({ items: v })}
              />
            )}
            {NEEDS_LOGISTIC.includes(testId) && (
              <>
                <Select
                  label="Variabel Dependen (kejadian, biner)"
                  options={categoricalCols}
                  value={mapping.dependent ?? ""}
                  onChange={(v) => updateMapping({ dependent: v })}
                />
                <MultiSelect
                  label="Variabel Independen (faktor risiko/prediktor)"
                  options={[...numericCols, ...categoricalCols]}
                  value={mapping.independents ?? []}
                  onChange={(v) => updateMapping({ independents: v })}
                />
              </>
            )}
            {NEEDS_DIAGNOSTIC.includes(testId) && (
              <>
                <Select
                  label="Hasil Uji Diagnostik (biner)"
                  options={categoricalCols}
                  value={mapping.independent ?? ""}
                  onChange={(v) => updateMapping({ independent: v })}
                />
                <Select
                  label="Status Penyakit (baku emas, biner)"
                  options={categoricalCols}
                  value={mapping.dependent ?? ""}
                  onChange={(v) => updateMapping({ dependent: v })}
                />
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setRecommendation(null)} className="btn-duo-outline">
              ↺ Ulangi
            </button>
            <button onClick={() => router.push("/assumptions")} className="btn-duo-green">
              Lanjut ke Cek Asumsi →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function isReady(a: Partial<WizardAnswers>): boolean {
  if (!a.tujuan) return false;
  if (a.tujuan === "bandingkan") {
    if (!a.jumlah_kelompok) return false;
    if (a.jumlah_kelompok === "dua" && !a.desain) return false;
  }
  if (a.tujuan === "hubungan" && !a.tipe_variabel_hubungan) return false;
  return true;
}

function Question({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-black text-duo-gray">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={
              value === o.value
                ? "rounded-2xl border-2 border-b-4 border-duo-blue-dark bg-duo-blue px-4 py-2 text-sm font-bold text-white"
                : "rounded-2xl border-2 border-b-4 border-duo-gray-light bg-white px-4 py-2 text-sm font-bold text-duo-gray-soft hover:bg-slate-50"
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-bold text-duo-gray">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-duo">
        <option value="">-- pilih kolom --</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(col: string) {
    if (value.includes(col)) onChange(value.filter((v) => v !== col));
    else onChange([...value, col]);
  }
  return (
    <div className="sm:col-span-2">
      <p className="mb-1 text-sm font-bold text-duo-gray">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => toggle(o)}
            className={
              value.includes(o)
                ? "rounded-xl border-2 border-duo-purple-dark bg-duo-purple px-3 py-1.5 text-xs font-bold text-white"
                : "rounded-xl border-2 border-duo-gray-light bg-white px-3 py-1.5 text-xs font-bold text-duo-gray-soft"
            }
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
