"use client";

import { useLanguage } from "@/lib/LanguageContext";
import type { SemConstruct } from "@/lib/types";

export default function ConstructBuilder({
  constructs,
  numericCols,
  onChange,
}: {
  constructs: SemConstruct[];
  numericCols: string[];
  onChange: (constructs: SemConstruct[]) => void;
}) {
  const { t } = useLanguage();
  function addConstruct() {
    onChange([...constructs, { name: `Konstruk${constructs.length + 1}`, indicators: [] }]);
  }

  function removeConstruct(i: number) {
    onChange(constructs.filter((_, idx) => idx !== i));
  }

  function updateName(i: number, name: string) {
    onChange(constructs.map((c, idx) => (idx === i ? { ...c, name } : c)));
  }

  function toggleIndicator(i: number, col: string) {
    onChange(
      constructs.map((c, idx) => {
        if (idx !== i) return c;
        const has = c.indicators.includes(col);
        return { ...c, indicators: has ? c.indicators.filter((x) => x !== col) : [...c.indicators, col] };
      })
    );
  }

  // A column already used by another construct can't be reused -- each
  // indicator belongs to exactly one construct in a reflective PLS model.
  const usedElsewhere = (i: number) =>
    new Set(constructs.flatMap((c, idx) => (idx === i ? [] : c.indicators)));

  return (
    <div className="flex flex-col gap-4">
      {constructs.map((c, i) => {
        const taken = usedElsewhere(i);
        return (
          <div key={i} className="card-duo flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                value={c.name}
                onChange={(e) => updateName(i, e.target.value)}
                placeholder={t("cb_construct_name_placeholder")}
                className="input-duo flex-1"
              />
              <button onClick={() => removeConstruct(i)} className="btn-duo-outline btn-duo-sm" title={t("cb_remove_construct_title")}>
                🗑
              </button>
            </div>
            <p className="text-xs font-bold text-duo-gray-soft">
              {t("cb_indicators_label").replace("{n}", String(c.indicators.length))}
            </p>
            <div className="flex flex-wrap gap-2">
              {numericCols.map((col) => {
                const disabled = taken.has(col);
                const active = c.indicators.includes(col);
                return (
                  <button
                    key={col}
                    disabled={disabled}
                    onClick={() => toggleIndicator(i, col)}
                    title={disabled ? t("cb_indicator_used_title") : undefined}
                    className={
                      active
                        ? "rounded-xl border-2 border-duo-purple-dark bg-duo-purple px-3 py-1.5 text-xs font-bold text-white"
                        : "rounded-xl border-2 border-duo-gray-light bg-white px-3 py-1.5 text-xs font-bold text-duo-gray-soft disabled:opacity-30"
                    }
                  >
                    {col}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <button onClick={addConstruct} className="btn-duo-outline btn-duo-sm w-fit">
        {t("cb_add_construct")}
      </button>
    </div>
  );
}
