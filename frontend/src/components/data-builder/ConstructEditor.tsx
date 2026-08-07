"use client";

import { useState } from "react";
import type { ConstructDef, VariableDef } from "@/lib/types";

export default function ConstructEditor({
  variables,
  constructs,
  onChange,
}: {
  variables: VariableDef[];
  constructs: ConstructDef[];
  onChange: (c: ConstructDef[]) => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggle(varName: string) {
    setSelected((prev) => (prev.includes(varName) ? prev.filter((n) => n !== varName) : [...prev, varName]));
  }

  function addConstruct() {
    setError(null);
    if (!name.trim()) {
      setError("Nama konstruk wajib diisi.");
      return;
    }
    if (selected.length < 2) {
      setError("Pilih minimal 2 item untuk membentuk satu konstruk.");
      return;
    }
    onChange([...constructs, { name: name.trim(), items: selected }]);
    setName("");
    setSelected([]);
  }

  function removeConstruct(idx: number) {
    onChange(constructs.filter((_, i) => i !== idx));
  }

  if (variables.length === 0) {
    return <p className="text-sm font-semibold text-duo-gray-soft">Tambahkan variabel dulu di langkah sebelumnya.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {constructs.length > 0 && (
        <div className="flex flex-col gap-2">
          {constructs.map((c, i) => (
            <div
              key={c.name}
              className="flex items-center justify-between rounded-2xl border-2 border-duo-gray-light bg-white px-4 py-2.5"
            >
              <div>
                <span className="font-black text-duo-gray">{c.name}</span>
                <span className="ml-2 text-xs font-semibold text-duo-gray-soft">{c.items.join(", ")}</span>
              </div>
              <button onClick={() => removeConstruct(i)} className="text-xs font-bold text-duo-red hover:underline">
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card-duo-purple">
        <h3 className="mb-3 text-sm font-black text-duo-gray">+ Kelompokkan Item Jadi Konstruk</h3>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-duo-gray">Nama Konstruk</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mis. Kualitas Tidur"
            className="input-duo"
          />
        </label>

        <p className="mt-3 mb-1 text-sm font-bold text-duo-gray">Pilih Item</p>
        <div className="flex flex-wrap gap-2">
          {variables.map((v) => (
            <button
              key={v.name}
              onClick={() => toggle(v.name)}
              className={`rounded-xl border-2 px-3 py-1.5 text-xs font-bold ${
                selected.includes(v.name)
                  ? "border-duo-purple-dark bg-duo-purple text-white"
                  : "border-duo-gray-light bg-white text-duo-gray-soft"
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>

        {error && <p className="mt-2 text-xs font-bold text-duo-red-dark">⚠ {error}</p>}
        <button onClick={addConstruct} className="btn-duo-purple btn-duo-sm mt-3">
          + Buat Konstruk
        </button>
      </div>
    </div>
  );
}
