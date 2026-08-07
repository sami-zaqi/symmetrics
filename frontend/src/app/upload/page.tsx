"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/SessionContext";
import StepProgress from "@/components/StepProgress";
import CategoryMapper from "@/components/data-cleaner/CategoryMapper";
import type { ColumnType } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();
  const { dataset, setDataset, reset } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [reviewColumn, setReviewColumn] = useState<string | null>(null);
  const [changingType, setChangingType] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      reset();
      const summary = await api.upload(file);
      setDataset(summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah file.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClean(strategy: "listwise_deletion" | "mean_mode_imputation") {
    if (!dataset) return;
    setCleaning(true);
    setError(null);
    try {
      const summary = await api.cleanData(dataset.session_id, strategy);
      setDataset(summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membersihkan data.");
    } finally {
      setCleaning(false);
    }
  }

  async function handleTypeChange(column: string, dtype: ColumnType) {
    if (!dataset) return;
    setChangingType(column);
    setError(null);
    try {
      const summary = await api.setColumnType(dataset.session_id, column, dtype);
      setDataset(summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah tipe kolom.");
    } finally {
      setChangingType(null);
    }
  }

  const missingColumns = dataset?.columns.filter((c) => c.missing_count > 0) ?? [];
  const hasMissing = missingColumns.length > 0;
  const hasOutliers = (dataset?.outliers.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      <StepProgress current={1} />
      <h1 className="text-xl font-black text-duo-gray">📁 Unggah Data Kamu</h1>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-3xl border-4 border-dashed p-10 text-center transition-colors ${
          dragOver ? "border-duo-blue bg-duo-blue-light" : "border-duo-gray-light bg-white"
        }`}
      >
        <span className="mb-2 block text-4xl">{dragOver ? "📂" : "📄"}</span>
        <p className="font-bold text-duo-gray">
          Seret file CSV/Excel ke sini, atau klik untuk memilih file
        </p>
        <p className="mt-1 text-xs font-semibold text-duo-gray-soft">Format: .csv, .xlsx, .xls</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {loading && <p className="text-sm font-bold text-duo-blue-dark">⏳ Mengunggah dan membaca data...</p>}
      {error && <p className="card-duo-red text-sm font-bold text-duo-red-dark">⚠ {error}</p>}

      {dataset && (
        <div className="card-duo-green">
          <p className="mb-2 text-sm font-bold text-duo-green-dark">
            ✔ Berhasil! {dataset.row_count} baris, {dataset.columns.length} kolom
          </p>
          <div className="overflow-x-auto rounded-2xl border-2 border-duo-gray-light bg-white">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-duo-gray-light">
                  {dataset.columns.map((c) => (
                    <th key={c.name} className="px-3 py-2 font-black text-duo-gray">
                      {c.name}
                      <span className="ml-1 font-semibold text-duo-gray-soft">({c.dtype})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataset.preview_rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-duo-gray-light/50">
                    {dataset.columns.map((c) => (
                      <td key={c.name} className="px-3 py-2 font-semibold text-duo-gray-soft">
                        {String(row[c.name] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dataset && (
        <div className="card-duo">
          <h3 className="mb-1 text-sm font-black text-duo-gray">🔍 Tinjau Tipe Kolom &amp; Kategori</h3>
          <p className="mb-3 text-xs font-semibold text-duo-gray-soft">
            Cek apakah tipe tiap kolom sudah benar sebelum lanjut analisis. Untuk kolom kategorik, tinjau juga
            nilai uniknya siapa tahu ada label yang tidak konsisten.
          </p>
          <div className="flex flex-col gap-2">
            {dataset.columns.map((c) => (
              <div key={c.name} className="rounded-2xl border-2 border-duo-gray-light bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-black text-duo-gray">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={c.dtype}
                      onChange={(e) => handleTypeChange(c.name, e.target.value as ColumnType)}
                      disabled={changingType === c.name}
                      className="input-duo w-auto py-1.5 text-xs"
                    >
                      <option value="numeric">numeric</option>
                      <option value="categorical">categorical</option>
                      <option value="datetime">datetime</option>
                    </select>
                    {c.dtype === "categorical" && (
                      <button
                        onClick={() => setReviewColumn(reviewColumn === c.name ? null : c.name)}
                        className="btn-duo-outline btn-duo-sm"
                      >
                        {reviewColumn === c.name ? "Sembunyikan" : `🔎 Nilai Unik (${c.unique_count})`}
                      </button>
                    )}
                  </div>
                </div>
                {reviewColumn === c.name && (
                  <CategoryMapper
                    sessionId={dataset.session_id}
                    column={c.name}
                    onClose={() => setReviewColumn(null)}
                    onRemapped={(summary) => setDataset(summary)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {dataset && (hasMissing || hasOutliers) && (
        <div className="card-duo-yellow">
          <h3 className="mb-2 text-sm font-black text-duo-gray">⚠ Kualitas Data Perlu Diperhatikan</h3>
          {hasMissing && (
            <p className="text-xs font-semibold text-duo-gray">
              Data kosong ditemukan di: {missingColumns.map((c) => `${c.name} (${c.missing_count} sel)`).join(", ")}.
            </p>
          )}
          {hasOutliers && (
            <p className="mt-1 text-xs font-semibold text-duo-gray">
              Kemungkinan outlier (metode IQR) di: {dataset!.outliers.map((o) => `${o.column} (${o.count} nilai)`).join(", ")}.
              {" "}Ini hanya informasi — tidak dihapus otomatis, silakan tinjau sendiri kewajarannya.
            </p>
          )}
          {hasMissing && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => handleClean("listwise_deletion")}
                disabled={cleaning}
                className="btn-duo-yellow btn-duo-sm"
              >
                {cleaning ? "⏳ Memproses..." : "🗑 Hapus Baris Kosong"}
              </button>
              <button
                onClick={() => handleClean("mean_mode_imputation")}
                disabled={cleaning}
                className="btn-duo-outline btn-duo-sm"
              >
                {cleaning ? "⏳ Memproses..." : "🧮 Isi dengan Rata-rata/Modus"}
              </button>
            </div>
          )}
        </div>
      )}

      {dataset && (
        <button onClick={() => router.push("/wizard")} className="btn-duo-green w-fit">
          ✔ Data Sudah Oke, Lanjut ke Pemilihan Uji →
        </button>
      )}
    </div>
  );
}
