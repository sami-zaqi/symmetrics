"use client";

import { useState } from "react";
import CopyDataTableButton from "@/components/CopyDataTableButton";
import { useLanguage } from "@/lib/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

type Decision = "belum" | "include" | "exclude";

interface StudyRow {
  id: string;
  judul: string;
  penulisTahun: string;
  tahap: "judul_abstrak" | "full_text";
  keputusan: Decision;
  alasan: string;
}

function emptyRow(): StudyRow {
  return {
    id: crypto.randomUUID(),
    judul: "",
    penulisTahun: "",
    tahap: "judul_abstrak",
    keputusan: "belum",
    alasan: "",
  };
}

const DECISION_STYLE: Record<Decision, string> = {
  belum: "bg-slate-100 text-duo-gray-soft",
  include: "bg-duo-green-light text-duo-green-dark",
  exclude: "bg-duo-red-light text-duo-red-dark",
};

const DECISION_LABEL_KEY: Record<Decision, TranslationKey> = {
  belum: "study_decision_undecided",
  include: "study_decision_include",
  exclude: "study_decision_exclude",
};

export default function StudySelectionTable() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<StudyRow[]>([emptyRow()]);

  function update(id: string, patch: Partial<StudyRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const included = rows.filter((r) => r.keputusan === "include").length;
  const excluded = rows.filter((r) => r.keputusan === "exclude").length;

  const tableHeaders = [
    t("study_col_title"),
    t("study_col_author_year"),
    t("study_col_stage"),
    t("study_col_decision"),
    t("study_col_reason"),
  ];
  const tableRows = rows.map((r) => [
    r.judul,
    r.penulisTahun,
    r.tahap === "judul_abstrak" ? t("study_stage_title_abstract") : t("study_stage_fulltext"),
    t(DECISION_LABEL_KEY[r.keputusan]),
    r.alasan,
  ]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <span className="badge-duo bg-duo-blue-light text-duo-blue-dark">{t("study_badge_count").replace("{n}", String(rows.length))}</span>
        <span className="badge-duo bg-duo-green-light text-duo-green-dark">{t("study_badge_include").replace("{n}", String(included))}</span>
        <span className="badge-duo bg-duo-red-light text-duo-red-dark">{t("study_badge_exclude").replace("{n}", String(excluded))}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b-2 border-duo-gray-light">
              <th className="px-2 py-1.5 font-black text-duo-gray">{t("study_col_title")}</th>
              <th className="px-2 py-1.5 font-black text-duo-gray">{t("study_col_author_year")}</th>
              <th className="px-2 py-1.5 font-black text-duo-gray">{t("study_col_stage")}</th>
              <th className="px-2 py-1.5 font-black text-duo-gray">{t("study_col_decision")}</th>
              <th className="px-2 py-1.5 font-black text-duo-gray">{t("study_col_reason")}</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-duo-gray-light/50 align-top">
                <td className="px-2 py-1.5">
                  <input
                    value={r.judul}
                    onChange={(e) => update(r.id, { judul: e.target.value })}
                    placeholder={t("study_placeholder_title")}
                    className="input-duo"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={r.penulisTahun}
                    onChange={(e) => update(r.id, { penulisTahun: e.target.value })}
                    placeholder={t("study_placeholder_author")}
                    className="input-duo"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <select
                    value={r.tahap}
                    onChange={(e) => update(r.id, { tahap: e.target.value as StudyRow["tahap"] })}
                    className="input-duo"
                  >
                    <option value="judul_abstrak">{t("study_stage_title_abstract")}</option>
                    <option value="full_text">{t("study_stage_fulltext")}</option>
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex flex-col gap-1">
                    <span className={`badge-duo w-fit ${DECISION_STYLE[r.keputusan]}`}>{t(DECISION_LABEL_KEY[r.keputusan])}</span>
                    <select
                      value={r.keputusan}
                      onChange={(e) => update(r.id, { keputusan: e.target.value as Decision })}
                      className="input-duo"
                    >
                      <option value="belum">{t("study_decision_undecided")}</option>
                      <option value="include">Include</option>
                      <option value="exclude">Exclude</option>
                    </select>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={r.alasan}
                    onChange={(e) => update(r.id, { alasan: e.target.value })}
                    placeholder={t("study_placeholder_reason")}
                    disabled={r.keputusan !== "exclude"}
                    className="input-duo disabled:opacity-40"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button onClick={() => removeRow(r.id)} className="btn-duo-outline btn-duo-sm" title={t("study_remove_row_title")}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={addRow} className="btn-duo-outline btn-duo-sm w-fit">
          {t("study_add_row")}
        </button>
        <CopyDataTableButton headers={tableHeaders} rows={tableRows} />
      </div>
    </div>
  );
}
