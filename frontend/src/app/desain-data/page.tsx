"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/SessionContext";
import type { ConstructDef, VariableDef } from "@/lib/types";
import VariableEditor from "@/components/data-builder/VariableEditor";
import ConstructEditor from "@/components/data-builder/ConstructEditor";
import DataGrid, { type GridRow } from "@/components/data-builder/DataGrid";

function rowsToCsv(variables: VariableDef[], rows: GridRow[]): string {
  const headers = variables.map((v) => v.name);
  const escape = (val: string) => (/[",\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val);
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    if (headers.every((h) => !row[h]?.trim())) continue; // skip fully-empty rows
    lines.push(headers.map((h) => escape(row[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

const STEPS = ["Variabel", "Konstruk (opsional)", "Selesai"];

export default function DesainDataPage() {
  const router = useRouter();
  const { setDataset, reset } = useSession();
  const [step, setStep] = useState(0);
  const [variables, setVariables] = useState<VariableDef[]>([]);
  const [constructs, setConstructs] = useState<ConstructDef[]>([]);
  const [missingSymbol, setMissingSymbol] = useState("-99");
  const [schemaSessionId, setSchemaSessionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submittingGrid, setSubmittingGrid] = useState(false);
  const [gridRows, setGridRows] = useState<GridRow[]>([]);
  const [showGrid, setShowGrid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleCreateSchema() {
    setError(null);
    if (variables.length === 0) {
      setError("Tambahkan minimal satu variabel dulu.");
      return;
    }
    setCreating(true);
    try {
      const res = await api.createSchema({ variables, constructs, missing_value_symbol: missingSymbol });
      setSchemaSessionId(res.session_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat skema.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDownloadTemplate() {
    if (!schemaSessionId) return;
    setDownloading(true);
    setError(null);
    try {
      const blob = await api.downloadTemplate(schemaSessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_symmetrics.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunduh template.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleUploadFilled(file: File) {
    if (!schemaSessionId) return;
    setUploading(true);
    setError(null);
    try {
      reset();
      const summary = await api.upload(file, schemaSessionId);
      setDataset(summary);
      router.push("/wizard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmitGrid() {
    if (!schemaSessionId) return;
    const csv = rowsToCsv(variables, gridRows);
    if (csv.split("\n").length <= 1) {
      setError("Grid masih kosong, isi minimal satu baris data dulu.");
      return;
    }
    setSubmittingGrid(true);
    setError(null);
    try {
      const file = new File([csv], "grid_data.csv", { type: "text/csv" });
      reset();
      const summary = await api.upload(file, schemaSessionId);
      setDataset(summary);
      router.push("/wizard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengirim data.");
    } finally {
      setSubmittingGrid(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-duo-gray">🧩 Desain Struktur Data</h1>
      <p className="-mt-3 text-sm font-semibold text-duo-gray-soft">
        Rancang variabel & instrumen sebelum mulai mengumpulkan data — biar tidak berantakan di belakang.
      </p>

      <div className="flex gap-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            onClick={() => setStep(i)}
            disabled={i === 1 && variables.length === 0}
            className={`rounded-full px-4 py-1.5 text-xs font-black transition-colors disabled:opacity-40 ${
              step === i ? "bg-duo-blue text-white" : "bg-white text-duo-gray-soft border-2 border-duo-gray-light"
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {error && <p className="card-duo-red text-sm font-bold text-duo-red-dark">⚠ {error}</p>}

      {step === 0 && (
        <>
          <VariableEditor variables={variables} onChange={setVariables} />
          <button
            onClick={() => setStep(1)}
            disabled={variables.length === 0}
            className="btn-duo-blue w-fit disabled:opacity-40"
          >
            Lanjut →
          </button>
        </>
      )}

      {step === 1 && (
        <>
          <ConstructEditor variables={variables} constructs={constructs} onChange={setConstructs} />
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-duo-outline">
              ← Kembali
            </button>
            <button onClick={() => setStep(2)} className="btn-duo-blue">
              Lanjut →
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          {!schemaSessionId ? (
            <div className="card-duo">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-bold text-duo-gray">Simbol Data Kosong/Hilang</span>
                <input
                  value={missingSymbol}
                  onChange={(e) => setMissingSymbol(e.target.value)}
                  placeholder="mis. -99 (kosongkan jika mau pakai sel kosong biasa)"
                  className="input-duo"
                />
              </label>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-duo-gray-soft">
                <p className="mb-1 font-black text-duo-gray">Ringkasan:</p>
                <p>{variables.length} variabel didefinisikan.</p>
                <p>{constructs.length} konstruk kuesioner didefinisikan.</p>
              </div>

              <div className="mt-4 flex gap-3">
                <button onClick={() => setStep(1)} className="btn-duo-outline">
                  ← Kembali
                </button>
                <button onClick={handleCreateSchema} disabled={creating} className="btn-duo-green">
                  {creating ? "⏳ Membuat..." : "✔ Buat Skema"}
                </button>
              </div>
            </div>
          ) : (
            <div className="card-duo-green flex flex-col gap-4">
              <p className="text-sm font-bold text-duo-green-dark">✔ Skema berhasil dibuat!</p>

              <div>
                <p className="mb-2 text-sm font-black text-duo-gray">1. Unduh template, lalu isi datanya</p>
                <button onClick={handleDownloadTemplate} disabled={downloading} className="btn-duo-blue btn-duo-sm">
                  {downloading ? "⏳ Menyiapkan..." : "⬇ Unduh Template (.xlsx)"}
                </button>
              </div>

              <div>
                <p className="mb-2 text-sm font-black text-duo-gray">2. Sudah diisi? Unggah kembali di sini</p>
                <div
                  onClick={() => inputRef.current?.click()}
                  className="cursor-pointer rounded-2xl border-4 border-dashed border-duo-gray-light bg-white p-6 text-center"
                >
                  <span className="mb-1 block text-2xl">📄</span>
                  <p className="text-xs font-bold text-duo-gray-soft">
                    {uploading ? "⏳ Mengunggah..." : "Klik untuk pilih file template yang sudah diisi"}
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadFilled(file);
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-black text-duo-gray">
                  Atau, 3. Isi langsung di sini (tanpa Excel)
                </p>
                {!showGrid ? (
                  <button onClick={() => setShowGrid(true)} className="btn-duo-purple btn-duo-sm">
                    🧮 Buka Tabel Input
                  </button>
                ) : (
                  <div className="flex flex-col gap-3 rounded-2xl bg-white p-3">
                    <DataGrid variables={variables} onRowsChange={setGridRows} />
                    <button
                      onClick={handleSubmitGrid}
                      disabled={submittingGrid}
                      className="btn-duo-purple btn-duo-sm w-fit"
                    >
                      {submittingGrid ? "⏳ Mengirim..." : "✔ Kirim Data Ini"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
