"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";
import type { CategoryCode, VariableDef, VariableScale } from "@/lib/types";

const SCALE_OPTIONS: { value: VariableScale; labelKey: TranslationKey; needsCategories: boolean }[] = [
  { value: "nominal", labelKey: "ve_scale_nominal", needsCategories: true },
  { value: "ordinal", labelKey: "ve_scale_ordinal", needsCategories: true },
  { value: "interval", labelKey: "ve_scale_interval", needsCategories: false },
  { value: "rasio", labelKey: "ve_scale_rasio", needsCategories: false },
];

export default function VariableEditor({
  variables,
  onChange,
}: {
  variables: VariableDef[];
  onChange: (v: VariableDef[]) => void;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [scale, setScale] = useState<VariableScale>("rasio");
  const [categories, setCategories] = useState<CategoryCode[]>([]);
  const [catLabel, setCatLabel] = useState("");
  const [catValue, setCatValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const needsCategories = SCALE_OPTIONS.find((s) => s.value === scale)?.needsCategories ?? false;

  function addCategory() {
    if (!catLabel.trim() || catValue === "") return;
    setCategories([...categories, { label: catLabel.trim(), value: Number(catValue) }]);
    setCatLabel("");
    setCatValue("");
  }

  function removeCategory(idx: number) {
    setCategories(categories.filter((_, i) => i !== idx));
  }

  function addVariable() {
    setError(null);
    const trimmedName = name.trim().replace(/\s+/g, "_");
    if (!trimmedName || !label.trim()) {
      setError(t("ve_error_required"));
      return;
    }
    if (variables.some((v) => v.name === trimmedName)) {
      setError(t("ve_error_duplicate_name"));
      return;
    }
    if (needsCategories && categories.length < 2) {
      setError(t("ve_error_min_categories"));
      return;
    }
    const newVar: VariableDef = {
      name: trimmedName,
      label: label.trim(),
      scale,
      categories: needsCategories ? categories : null,
    };
    onChange([...variables, newVar]);
    setName("");
    setLabel("");
    setScale("rasio");
    setCategories([]);
  }

  function removeVariable(idx: number) {
    onChange(variables.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-4">
      {variables.length > 0 && (
        <div className="flex flex-col gap-2">
          {variables.map((v, i) => (
            <div
              key={v.name}
              className="flex items-center justify-between rounded-2xl border-2 border-duo-gray-light bg-white px-4 py-2.5"
            >
              <div>
                <span className="font-black text-duo-gray">{v.name}</span>
                <span className="ml-2 text-xs font-semibold text-duo-gray-soft">
                  {v.label} · {v.scale}
                  {v.categories ? ` · ${v.categories.map((c) => `${c.value}=${c.label}`).join(", ")}` : ""}
                </span>
              </div>
              <button onClick={() => removeVariable(i)} className="text-xs font-bold text-duo-red hover:underline">
                {t("ve_remove")}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card-duo">
        <h3 className="mb-3 text-sm font-black text-duo-gray">{t("ve_add_variable_title")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-duo-gray">{t("ve_col_name_label")}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("ve_col_name_placeholder")} className="input-duo" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-duo-gray">{t("ve_label_label")}</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("ve_label_placeholder")}
              className="input-duo"
            />
          </label>
        </div>

        <div className="mt-3">
          <p className="mb-1 text-sm font-bold text-duo-gray">{t("ve_scale_title")}</p>
          <div className="flex flex-col gap-1.5">
            {SCALE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 p-2.5 text-xs ${
                  scale === opt.value ? "border-duo-blue-dark bg-duo-blue-light" : "border-duo-gray-light bg-white"
                }`}
              >
                <input
                  type="radio"
                  checked={scale === opt.value}
                  onChange={() => setScale(opt.value)}
                  className="mt-0.5 accent-duo-blue"
                />
                <span className="font-semibold text-duo-gray">{t(opt.labelKey)}</span>
              </label>
            ))}
          </div>
        </div>

        {needsCategories && (
          <div className="mt-3 rounded-2xl bg-duo-yellow-light p-3">
            <p className="mb-2 text-xs font-black text-duo-gray">{t("ve_category_codes_title")}</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c, i) => (
                <span key={i} className="badge-duo bg-white text-duo-gray-soft">
                  {c.value} = {c.label}
                  <button onClick={() => removeCategory(i)} className="ml-1 font-black text-duo-red">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                value={catLabel}
                onChange={(e) => setCatLabel(e.target.value)}
                placeholder={t("ve_category_label_placeholder")}
                className="input-duo min-w-[140px] flex-1"
              />
              <input
                value={catValue}
                onChange={(e) => setCatValue(e.target.value)}
                type="number"
                placeholder={t("ve_category_code_placeholder")}
                className="input-duo w-24"
              />
              <button onClick={addCategory} className="btn-duo-outline btn-duo-sm">
                {t("ve_add_code_btn")}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-xs font-bold text-duo-red-dark">⚠ {error}</p>}
        <button onClick={addVariable} className="btn-duo-green btn-duo-sm mt-3">
          {t("ve_add_variable_title")}
        </button>
      </div>
    </div>
  );
}
