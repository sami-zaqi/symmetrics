"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/SessionContext";
import { useLanguage } from "@/lib/LanguageContext";
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
const NEEDS_ROC: TestId[] = ["roc_analysis"];
const NEEDS_SURVIVAL: TestId[] = ["survival_analysis"];

export default function WizardPage() {
  const router = useRouter();
  const { t } = useLanguage();
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
            {t("wizard_no_data_pre")}{" "}
            <a href="/upload" className="underline text-duo-blue-dark">
              {t("wizard_no_data_link")}
            </a>{" "}
            {t("wizard_no_data_post")}
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
      setError(e instanceof Error ? e.message : t("wizard_error_recommend"));
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
      <h1 className="text-xl font-black text-duo-gray">{t("wizard_title")}</h1>

      {!recommendation && (
        <div className="card-duo flex flex-col gap-5">
          <Question
            label={t("wizard_q_tujuan")}
            value={answers.tujuan}
            options={[
              { value: "deskriptif", label: t("wizard_opt_deskriptif") },
              { value: "bandingkan", label: t("wizard_opt_bandingkan") },
              { value: "hubungan", label: t("wizard_opt_hubungan") },
              { value: "prediksi", label: t("wizard_opt_prediksi") },
              { value: "reliabilitas", label: t("wizard_opt_reliabilitas") },
              { value: "faktor_risiko", label: t("wizard_opt_faktor_risiko") },
              { value: "evaluasi_diagnostik", label: t("wizard_opt_evaluasi_diagnostik") },
              { value: "akurasi_prediksi", label: t("wizard_opt_akurasi_prediksi") },
              { value: "kelangsungan_hidup", label: t("wizard_opt_kelangsungan_hidup") },
            ]}
            onChange={(v) => update({ tujuan: v as WizardAnswers["tujuan"] })}
          />

          {answers.tujuan === "bandingkan" && (
            <Question
              label={t("wizard_q_jumlah_kelompok")}
              value={answers.jumlah_kelompok}
              options={[
                { value: "dua", label: t("wizard_opt_dua") },
                { value: "lebih_dari_dua", label: t("wizard_opt_lebih_dari_dua") },
              ]}
              onChange={(v) => update({ jumlah_kelompok: v as WizardAnswers["jumlah_kelompok"] })}
            />
          )}

          {answers.tujuan === "bandingkan" && answers.jumlah_kelompok === "dua" && (
            <Question
              label={t("wizard_q_desain")}
              value={answers.desain}
              options={[
                { value: "independen", label: t("wizard_opt_independen") },
                { value: "berpasangan", label: t("wizard_opt_berpasangan") },
              ]}
              onChange={(v) => update({ desain: v as WizardAnswers["desain"] })}
            />
          )}

          {answers.tujuan === "hubungan" && (
            <Question
              label={t("wizard_q_tipe_variabel")}
              value={answers.tipe_variabel_hubungan}
              options={[
                { value: "keduanya_numerik", label: t("wizard_opt_keduanya_numerik") },
                { value: "keduanya_kategorik", label: t("wizard_opt_keduanya_kategorik") },
                { value: "campuran", label: t("wizard_opt_campuran") },
              ]}
              onChange={(v) => update({ tipe_variabel_hubungan: v as WizardAnswers["tipe_variabel_hubungan"] })}
            />
          )}

          {answers.tujuan === "hubungan" && answers.tipe_variabel_hubungan === "campuran" && (
            <Question
              label={t("wizard_q_jumlah_kelompok_campuran")}
              value={answers.jumlah_kelompok}
              options={[
                { value: "dua", label: t("wizard_opt_dua") },
                { value: "lebih_dari_dua", label: t("wizard_opt_lebih_dari_dua") },
              ]}
              onChange={(v) => update({ jumlah_kelompok: v as WizardAnswers["jumlah_kelompok"] })}
            />
          )}

          {isReady(answers) && (
            <button onClick={() => submitAnswers(answers as WizardAnswers)} className="btn-duo-green w-fit">
              {t("wizard_get_recommendation")}
            </button>
          )}
          {error && <p className="text-sm font-bold text-duo-red-dark">⚠ {error}</p>}
        </div>
      )}

      {recommendation && testId && (
        <div className="card-duo-blue flex flex-col gap-4">
          <p className="text-sm font-semibold text-duo-gray">{recommendation.reasoning}</p>
          <p className="font-black text-duo-blue-dark">
            {t("wizard_recommended_test").replace("{test}", testId.replaceAll("_", " "))}
          </p>
          <ul className="flex flex-col gap-1 text-xs font-semibold text-duo-gray-soft">
            {recommendation.required_variable_roles.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>

          <div className="grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2">
            {(NEEDS_GROUPING.includes(testId) || testId === "independent_ttest") && (
              <>
                <Select label={t("wizard_map_dependent_numeric")} options={numericCols} value={mapping.dependent ?? ""} onChange={(v) => updateMapping({ dependent: v })} />
                <Select label={t("wizard_map_grouping")} options={categoricalCols} value={mapping.grouping ?? ""} onChange={(v) => updateMapping({ grouping: v })} />
              </>
            )}
            {NEEDS_PAIR.includes(testId) && (
              <>
                <Select label={t("wizard_map_measure1")} options={numericCols} value={mapping.items?.[0] ?? ""} onChange={(v) => updateMapping({ items: [v, mapping.items?.[1] ?? ""] })} />
                <Select label={t("wizard_map_measure2")} options={numericCols} value={mapping.items?.[1] ?? ""} onChange={(v) => updateMapping({ items: [mapping.items?.[0] ?? "", v] })} />
              </>
            )}
            {NEEDS_XY.includes(testId) && (
              <>
                <Select
                  label={testId === "chi_square" ? t("wizard_map_categorical1") : t("wizard_map_independent_x")}
                  options={testId === "chi_square" ? categoricalCols : numericCols}
                  value={mapping.independent ?? ""}
                  onChange={(v) => updateMapping({ independent: v })}
                />
                <Select
                  label={testId === "chi_square" ? t("wizard_map_categorical2") : t("wizard_map_dependent_y")}
                  options={testId === "chi_square" ? categoricalCols : numericCols}
                  value={mapping.dependent ?? ""}
                  onChange={(v) => updateMapping({ dependent: v })}
                />
              </>
            )}
            {testId === "cronbach_alpha" && dataset.constructs.length > 0 && (
              <div className="sm:col-span-2">
                <p className="mb-1 text-sm font-bold text-duo-gray">{t("wizard_map_pick_construct")}</p>
                <div className="flex flex-wrap gap-2">
                  {dataset.constructs.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => updateMapping({ items: c.items })}
                      className="rounded-xl border-2 border-duo-yellow-dark bg-duo-yellow-light px-3 py-1.5 text-xs font-bold text-duo-gray"
                    >
                      🧩 {c.name} ({c.items.length} {t("wizard_map_item_unit")})
                    </button>
                  ))}
                </div>
              </div>
            )}
            {NEEDS_ITEMS.includes(testId) && (
              <MultiSelect
                label={testId === "cronbach_alpha" ? t("wizard_map_questionnaire_items") : t("wizard_map_variable")}
                options={testId === "cronbach_alpha" ? [...numericCols, ...categoricalCols] : numericCols}
                value={mapping.items ?? []}
                onChange={(v) => updateMapping({ items: v })}
              />
            )}
            {NEEDS_LOGISTIC.includes(testId) && (
              <>
                <Select
                  label={t("wizard_map_dependent_binary")}
                  options={categoricalCols}
                  value={mapping.dependent ?? ""}
                  onChange={(v) => updateMapping({ dependent: v })}
                />
                <MultiSelect
                  label={t("wizard_map_independent_predictors")}
                  options={[...numericCols, ...categoricalCols]}
                  value={mapping.independents ?? []}
                  onChange={(v) => updateMapping({ independents: v })}
                />
              </>
            )}
            {NEEDS_DIAGNOSTIC.includes(testId) && (
              <>
                <Select
                  label={t("wizard_map_diagnostic_result")}
                  options={categoricalCols}
                  value={mapping.independent ?? ""}
                  onChange={(v) => updateMapping({ independent: v })}
                />
                <Select
                  label={t("wizard_map_disease_status")}
                  options={categoricalCols}
                  value={mapping.dependent ?? ""}
                  onChange={(v) => updateMapping({ dependent: v })}
                />
              </>
            )}
            {NEEDS_ROC.includes(testId) && (
              <>
                <Select
                  label={t("wizard_map_score_predictor")}
                  options={numericCols}
                  value={mapping.independent ?? ""}
                  onChange={(v) => updateMapping({ independent: v })}
                />
                <Select
                  label={t("wizard_map_outcome_gold")}
                  options={categoricalCols}
                  value={mapping.dependent ?? ""}
                  onChange={(v) => updateMapping({ dependent: v })}
                />
              </>
            )}
            {NEEDS_SURVIVAL.includes(testId) && (
              <>
                <Select
                  label={t("wizard_map_duration")}
                  options={numericCols}
                  value={mapping.dependent ?? ""}
                  onChange={(v) => updateMapping({ dependent: v })}
                />
                <Select
                  label={t("wizard_map_event_status")}
                  options={categoricalCols}
                  value={mapping.event_col ?? ""}
                  onChange={(v) => updateMapping({ event_col: v })}
                />
                <Select
                  label={t("wizard_map_group_optional")}
                  options={categoricalCols}
                  value={mapping.grouping ?? ""}
                  onChange={(v) => updateMapping({ grouping: v || null })}
                />
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setRecommendation(null)} className="btn-duo-outline">
              {t("wizard_redo")}
            </button>
            <button onClick={() => router.push("/assumptions")} className="btn-duo-green">
              {t("wizard_continue_assumptions")}
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
  if (a.tujuan === "hubungan") {
    if (!a.tipe_variabel_hubungan) return false;
    if (a.tipe_variabel_hubungan === "campuran" && !a.jumlah_kelompok) return false;
  }
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
  const { t } = useLanguage();
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-bold text-duo-gray">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-duo">
        <option value="">{t("wizard_select_placeholder")}</option>
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
