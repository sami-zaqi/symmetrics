"use client";

import { useState } from "react";
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
          <span className="font-bold text-duo-gray">Dari Konstruk</span>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="input-duo">
            <option value="">-- pilih --</option>
            {constructNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="pb-2.5 text-lg text-duo-gray-soft">→</span>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-duo-gray">Ke Konstruk</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="input-duo">
            <option value="">-- pilih --</option>
            {constructNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button onClick={addPath} disabled={!source || !target || source === target} className="btn-duo-outline btn-duo-sm">
          + Tambah Jalur
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
      <p className="text-xs font-semibold text-duo-gray-soft">
        Contoh mediasi: X → M lalu M → Y (tanpa X → Y langsung) berarti M memediasi penuh hubungan X dan Y.
      </p>
    </div>
  );
}
