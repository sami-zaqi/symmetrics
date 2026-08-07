"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DatasetSummary, ValueCount } from "@/lib/types";

export default function CategoryMapper({
  sessionId,
  column,
  onClose,
  onRemapped,
}: {
  sessionId: string;
  column: string;
  onClose: () => void;
  onRemapped: (summary: DatasetSummary) => void;
}) {
  const [values, setValues] = useState<ValueCount[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const v = await api.getColumnValues(sessionId, column);
      setValues(v);
      setSelected([]);
      setTarget("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat nilai unik.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(v: string) {
    setSelected((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  async function applyMerge() {
    if (selected.length < 2 || !target.trim()) {
      setError("Pilih minimal 2 nilai yang mau digabung, dan isi nama hasil gabungannya.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const mapping: Record<string, string> = {};
      for (const v of selected) mapping[v] = target.trim();
      const summary = await api.remapValues(sessionId, column, mapping);
      onRemapped(summary);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menggabungkan nilai.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-duo-yellow mt-2">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-black text-duo-gray">🔍 Nilai Unik: {column}</h4>
        <button onClick={onClose} className="text-xs font-bold text-duo-gray-soft hover:underline">
          Tutup
        </button>
      </div>
      <p className="mb-2 text-xs font-semibold text-duo-gray">
        Kalau ada label yang seharusnya sama tapi tertulis beda (mis. &quot;L&quot;, &quot;laki2&quot;, &quot;Laki-laki&quot;), pilih semuanya lalu gabungkan jadi satu.
      </p>

      {loading && !values && <p className="text-xs font-semibold text-duo-gray-soft">Memuat...</p>}
      {error && <p className="mb-2 text-xs font-bold text-duo-red-dark">⚠ {error}</p>}

      {values && (
        <>
          <div className="flex flex-wrap gap-2">
            {values.map((v) => (
              <button
                key={v.value}
                onClick={() => toggle(v.value)}
                className={`rounded-xl border-2 px-3 py-1.5 text-xs font-bold ${
                  selected.includes(v.value)
                    ? "border-duo-yellow-dark bg-duo-yellow text-duo-gray"
                    : "border-duo-gray-light bg-white text-duo-gray-soft"
                }`}
              >
                {v.value} <span className="opacity-60">({v.count})</span>
              </button>
            ))}
          </div>

          {values.length > 1 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-duo-gray">Gabungkan yang dipilih jadi:</span>
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="mis. Laki-laki"
                className="input-duo w-40"
              />
              <button onClick={applyMerge} disabled={loading} className="btn-duo-outline btn-duo-sm">
                {loading ? "⏳..." : "Gabungkan"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
