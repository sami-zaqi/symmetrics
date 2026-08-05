"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/SessionContext";
import StepProgress from "@/components/StepProgress";

export default function UploadPage() {
  const router = useRouter();
  const { dataset, setDataset, reset } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
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
          <button onClick={() => router.push("/wizard")} className="btn-duo-green mt-4">
            Lanjut ke Pemilihan Uji →
          </button>
        </div>
      )}
    </div>
  );
}
