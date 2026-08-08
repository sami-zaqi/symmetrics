"use client";

import { useState } from "react";
import CopyDataTableButton from "@/components/CopyDataTableButton";
import { useLanguage } from "@/lib/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

type ChecklistType = "cross_sectional" | "case_control";
type Answer = "ya" | "tidak" | "tidak_jelas" | "tidak_berlaku" | "";

const CHECKLISTS: Record<ChecklistType, { labelKey: TranslationKey; itemKeys: TranslationKey[] }> = {
  cross_sectional: {
    labelKey: "checklist_cross_sectional_label",
    itemKeys: ["cs_item_1", "cs_item_2", "cs_item_3", "cs_item_4", "cs_item_5", "cs_item_6", "cs_item_7", "cs_item_8"],
  },
  case_control: {
    labelKey: "checklist_case_control_label",
    itemKeys: [
      "cc_item_1",
      "cc_item_2",
      "cc_item_3",
      "cc_item_4",
      "cc_item_5",
      "cc_item_6",
      "cc_item_7",
      "cc_item_8",
      "cc_item_9",
      "cc_item_10",
    ],
  },
};

const ANSWER_LABEL_KEY: Record<Exclude<Answer, "">, TranslationKey> = {
  ya: "answer_ya",
  tidak: "answer_tidak",
  tidak_jelas: "answer_tidak_jelas",
  tidak_berlaku: "answer_tidak_berlaku",
};

interface StudyAppraisal {
  id: string;
  judul: string;
  checklist: ChecklistType;
  answers: Answer[];
}

function emptyAppraisal(): StudyAppraisal {
  return {
    id: crypto.randomUUID(),
    judul: "",
    checklist: "cross_sectional",
    answers: Array(CHECKLISTS.cross_sectional.itemKeys.length).fill(""),
  };
}

function score(a: StudyAppraisal): { ya: number; berlaku: number; belumDijawab: number } {
  const ya = a.answers.filter((x) => x === "ya").length;
  const berlaku = a.answers.filter((x) => x !== "tidak_berlaku").length;
  const belumDijawab = a.answers.filter((x) => x === "").length;
  return { ya, berlaku, belumDijawab };
}

export default function QualityAssessment() {
  const { t } = useLanguage();
  const [studies, setStudies] = useState<StudyAppraisal[]>([emptyAppraisal()]);

  function addStudy() {
    setStudies((prev) => [...prev, emptyAppraisal()]);
  }

  function removeStudy(id: string) {
    setStudies((prev) => prev.filter((s) => s.id !== id));
  }

  function setChecklist(id: string, checklist: ChecklistType) {
    setStudies((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, checklist, answers: Array(CHECKLISTS[checklist].itemKeys.length).fill("") } : s
      )
    );
  }

  function setJudul(id: string, judul: string) {
    setStudies((prev) => prev.map((s) => (s.id === id ? { ...s, judul } : s)));
  }

  function setAnswer(id: string, itemIndex: number, value: Answer) {
    setStudies((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const answers = [...s.answers];
        answers[itemIndex] = value;
        return { ...s, answers };
      })
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {studies.map((s) => {
        const def = CHECKLISTS[s.checklist];
        const items = def.itemKeys.map((k) => t(k));
        const { ya, berlaku, belumDijawab } = score(s);
        return (
          <div key={s.id} className="card-duo flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-1 min-w-[200px] flex-col gap-1 text-sm">
                <span className="font-bold text-duo-gray">{t("qa_study_title_label")}</span>
                <input
                  value={s.judul}
                  onChange={(e) => setJudul(s.id, e.target.value)}
                  placeholder={t("qa_study_title_placeholder")}
                  className="input-duo"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-bold text-duo-gray">{t("qa_checklist_type_label")}</span>
                <select
                  value={s.checklist}
                  onChange={(e) => setChecklist(s.id, e.target.value as ChecklistType)}
                  className="input-duo"
                >
                  <option value="cross_sectional">{t("qa_checklist_opt_cross_sectional")}</option>
                  <option value="case_control">{t("qa_checklist_opt_case_control")}</option>
                </select>
              </label>
              <button onClick={() => removeStudy(s.id)} className="btn-duo-outline btn-duo-sm" title={t("qa_remove_study_title")}>
                🗑
              </button>
            </div>

            <p className="text-xs font-bold text-duo-gray-soft">{t(def.labelKey)}</p>

            <div className="flex flex-col gap-2">
              {items.map((item, i) => (
                <div key={i} className="flex flex-col gap-1.5 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-duo-gray">
                    {i + 1}. {item}
                  </p>
                  <div className="flex gap-1.5">
                    {(["ya", "tidak", "tidak_jelas", "tidak_berlaku"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAnswer(s.id, i, opt)}
                        className={
                          s.answers[i] === opt
                            ? "rounded-xl border-2 border-duo-blue-dark bg-duo-blue px-2.5 py-1 text-[11px] font-bold text-white"
                            : "rounded-xl border-2 border-duo-gray-light bg-white px-2.5 py-1 text-[11px] font-bold text-duo-gray-soft"
                        }
                      >
                        {t(ANSWER_LABEL_KEY[opt])}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-duo w-fit bg-duo-green-light text-duo-green-dark">
                {t("qa_score_badge").replace("{ya}", String(ya)).replace("{berlaku}", String(berlaku))}
              </span>
              {belumDijawab > 0 && (
                <span className="badge-duo w-fit bg-duo-yellow-light text-duo-yellow-dark">
                  {t("qa_unanswered_badge").replace("{n}", String(belumDijawab))}
                </span>
              )}
            </div>
            <CopyDataTableButton
              headers={[t("qa_col_no"), t("qa_col_question"), t("qa_col_answer")]}
              rows={items.map((item, i) => [
                String(i + 1),
                item,
                s.answers[i] ? t(ANSWER_LABEL_KEY[s.answers[i] as Exclude<Answer, "">]) : t("qa_not_answered_text"),
              ])}
            />
          </div>
        );
      })}

      <button onClick={addStudy} className="btn-duo-outline btn-duo-sm w-fit">
        {t("qa_add_study")}
      </button>

      {studies.length > 1 && (
        <div className="card-duo">
          <h3 className="mb-2 text-sm font-black text-duo-gray">{t("qa_summary_title")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-duo-gray-light">
                  <th className="px-2 py-1.5 font-black text-duo-gray">{t("qa_summary_col_study")}</th>
                  <th className="px-2 py-1.5 font-black text-duo-gray">{t("qa_summary_col_checklist")}</th>
                  <th className="px-2 py-1.5 font-black text-duo-gray">{t("qa_summary_col_score")}</th>
                </tr>
              </thead>
              <tbody>
                {studies.map((s) => {
                  const { ya, berlaku, belumDijawab } = score(s);
                  return (
                    <tr key={s.id} className="border-b border-duo-gray-light/50">
                      <td className="px-2 py-1.5 font-semibold text-duo-gray-soft">{s.judul || t("qa_not_filled")}</td>
                      <td className="px-2 py-1.5 font-semibold text-duo-gray-soft">{t(CHECKLISTS[s.checklist].labelKey)}</td>
                      <td className="px-2 py-1.5 font-semibold text-duo-gray-soft">
                        {ya} / {berlaku}
                        {belumDijawab > 0 && (
                          <span className="text-duo-yellow-dark"> {t("qa_not_answered_paren").replace("{n}", String(belumDijawab))}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2">
            <CopyDataTableButton
              headers={[t("qa_summary_col_study"), t("qa_summary_col_checklist"), t("qa_summary_col_score")]}
              rows={studies.map((s) => {
                const { ya, berlaku, belumDijawab } = score(s);
                const skorText =
                  belumDijawab > 0
                    ? `${ya} / ${berlaku} ${t("qa_not_answered_paren").replace("{n}", String(belumDijawab))}`
                    : `${ya} / ${berlaku}`;
                return [s.judul || t("qa_not_filled"), t(CHECKLISTS[s.checklist].labelKey), skorText];
              })}
            />
          </div>
        </div>
      )}

      <p className="text-xs font-semibold text-duo-gray-soft">{t("qa_footer_note")}</p>
    </div>
  );
}
