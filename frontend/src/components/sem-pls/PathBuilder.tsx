"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import type { SemPath } from "@/lib/types";

export default function PathBuilder({
  constructNames,
  paths,
  onChange,
}: {
  constructNames: string[];
  paths: SemPath[];
  onChange: (paths: SemPath[]) => void;
}) {
  const { t } = useLanguage();
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");

  function addPath() {
    if (!source || !target || source === target) return;
    if (paths.some((p) => p.source === source && p.target === target)) return;
    onChange([...paths, { source, target }]);
    setSource("");
    setTarget("");
  }

  function removePath(i: number) {
    onChange(paths.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-duo-gray">{t("pb_from_construct")}</span>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="input-duo">
            <option value="">{t("pb_select_placeholder")}</option>
            {constructNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="pb-2.5 text-lg text-duo-gray-soft">→</span>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-duo-gray">{t("pb_to_construct")}</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="input-duo">
            <option value="">{t("pb_select_placeholder")}</option>
            {constructNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button onClick={addPath} disabled={!source || !target || source === target} className="btn-duo-outline btn-duo-sm">
          {t("pb_add_path")}
        </button>
      </div>

      {paths.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {paths.map((p, i) => (
            <span key={i} className="badge-duo flex items-center gap-2 bg-duo-blue-light text-duo-blue-dark">
              {p.source} → {p.target}
              <button onClick={() => removePath(i)} className="font-black hover:text-duo-red-dark">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-xs font-semibold text-duo-gray-soft">{t("pb_mediation_example")}</p>
    </div>
  );
}
