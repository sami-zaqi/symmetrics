"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/SessionContext";
import StepProgress from "@/components/StepProgress";
import { DescriptivesTable, StatSummary } from "@/components/ResultTables";

export default function ResultsPage() {
  const {
    dataset,
    activeTestId,
    mapping,
    methodUsed,
    fallbackReason,
    assumptionResult,
    currentResult,
    setCurrentResult,
    narrativeText,
    setNarrativeText,
    narrativeMode,
  } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeError, setNarrativeError] = useState<string | null>(null);
  const [narrativeSource, setNarrativeSource] = useState<"ai" | "template" | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!dataset || !activeTestId) return;
    setLoading(true);
    setError(null);
    api
      .runTest(dataset.session_id, activeTestId, mapping, methodUsed, fallbackReason, assumptionResult)
      .then(setCurrentResult)
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal menjalankan uji."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, activeTestId]);

  if (!dataset || !activeTestId) {
    return (
      <div className="flex flex-col gap-6">
        <StepProgress current={4} />
        <div className="card-duo-yellow">
          <p className="font-bold text-duo-gray">
            Selesaikan langkah{" "}
            <a href="/wizard" className="underline text-duo-blue-dark">
              wizard
            </a>{" "}
            dulu ya.
          </p>
        </div>
      </div>
    );
  }

  async function generateNarrative(mode: "auto" | "ai" | "template" = "auto", forceRegenerate = false) {
    if (!dataset || !currentResult) return;
    setNarrativeLoading(true);
    setNarrativeError(null);
    try {
      const res = await api.generateNarrative(dataset.session_id, currentResult.result_id, mode, forceRegenerate);
      setNarrativeText(res.narrative_text);
      setNarrativeSource(res.source);
    } catch (e) {
      setNarrativeError(e instanceof Error ? e.message : "Gagal membuat narasi.");
    } finally {
      setNarrativeLoading(false);
    }
  }

  async function downloadDocx() {
    if (!dataset || !currentResult) return;
    setExporting(true);
    try {
      const blob = await api.exportDocx(dataset.session_id, currentResult.result_id, narrativeText || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Hasil_${currentResult.test_id}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setNarrativeError(e instanceof Error ? e.message : "Gagal mengekspor dokumen.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <StepProgress current={4} />
      <h1 className="text-xl font-black text-duo-gray">🏆 Hasil Uji</h1>

      {loading && <p className="text-sm font-bold text-duo-blue-dark">⏳ Menjalankan uji statistik...</p>}
      {error && <p className="card-duo-red text-sm font-bold text-duo-red-dark">⚠ {error}</p>}

      {currentResult && (
        <div className="flex flex-col gap-5">
          <div className="card-duo-green text-center">
            <span className="text-4xl">🎉</span>
            <h2 className="mt-1 font-black text-duo-green-dark">{currentResult.test_name_id}</h2>
            {currentResult.method_used === "nonparametric_fallback" && (
              <p className="mt-1 text-xs font-bold text-duo-yellow-dark">
                ⚠ Uji non-parametrik dipakai karena asumsi data tidak terpenuhi.
              </p>
            )}
          </div>

          <div className="card-duo">
            <h3 className="mb-2 text-sm font-black text-duo-gray">📋 Statistik Deskriptif</h3>
            <DescriptivesTable rows={currentResult.descriptives} />

            <h3 className="mt-4 mb-2 text-sm font-black text-duo-gray">📈 Hasil Uji</h3>
            <StatSummary stats={currentResult.test_statistics} />
          </div>

          {currentResult.charts.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {currentResult.charts.map((c) => (
                <img
                  key={c.caption_id}
                  src={`data:image/png;base64,${c.image_base64}`}
                  alt={c.caption_id}
                  className="rounded-3xl border-2 border-duo-gray-light bg-white p-2"
                />
              ))}
            </div>
          )}

          <div className="card-duo">
            <h3 className="mb-2 text-sm font-black text-duo-gray">💬 Narasi Interpretasi (Bahasa Indonesia)</h3>
            {!narrativeText && (
              <>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => generateNarrative(narrativeMode)}
                    disabled={narrativeLoading}
                    className="btn-duo-purple"
                  >
                    {narrativeLoading
                      ? "⏳ Membuat narasi..."
                      : `✨ Buat Narasi (${narrativeMode === "ai" ? "AI" : narrativeMode === "template" ? "Template" : "Otomatis"})`}
                  </button>
                  {narrativeMode !== "template" && (
                    <button
                      onClick={() => generateNarrative("template")}
                      disabled={narrativeLoading}
                      className="btn-duo-outline"
                    >
                      📝 Template Gratis
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs font-semibold text-duo-gray-soft">
                  Ubah preferensi mode narasi di halaman{" "}
                  <a href="/pengaturan" className="underline text-duo-blue-dark">
                    Pengaturan
                  </a>
                  .
                </p>
              </>
            )}
            {narrativeError && <p className="mt-2 text-sm font-bold text-duo-red-dark">⚠ {narrativeError}</p>}
            {narrativeText && (
              <>
                <span
                  className={`badge-duo ${
                    narrativeSource === "template"
                      ? "bg-duo-yellow-light text-duo-yellow-dark"
                      : "bg-duo-purple-light text-duo-purple-dark"
                  }`}
                >
                  {narrativeSource === "template" ? "📝 Dibuat dari template gratis" : "✨ Dibuat oleh Claude AI"}
                </span>
                <textarea
                  value={narrativeText}
                  onChange={(e) => setNarrativeText(e.target.value)}
                  rows={10}
                  className="input-duo mt-2 leading-relaxed"
                />
                <button
                  onClick={() => generateNarrative(narrativeMode, true)}
                  disabled={narrativeLoading}
                  className="mt-2 text-xs font-bold text-duo-gray-soft underline disabled:opacity-50"
                >
                  {narrativeLoading ? "⏳ Membuat ulang..." : "↺ Buat ulang (panggilan baru)"}
                </button>
              </>
            )}
          </div>

          <button onClick={downloadDocx} disabled={exporting} className="btn-duo-blue w-fit">
            {exporting ? "⏳ Menyiapkan file..." : "⬇ Unduh Word (.docx)"}
          </button>
        </div>
      )}
    </div>
  );
}
