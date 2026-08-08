"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/SessionContext";
import { useLanguage } from "@/lib/LanguageContext";
import { TEST_NAMES_EN } from "@/lib/i18n";
import StepProgress from "@/components/StepProgress";
import { DescriptivesTable, StatSummary } from "@/components/ResultTables";
import { downloadBase64Png } from "@/lib/exportUtils";

export default function ResultsPage() {
  const { language, t } = useLanguage();
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
      .catch((e) => setError(e instanceof Error ? e.message : t("results_error_run")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, activeTestId]);

  if (!dataset || !activeTestId) {
    return (
      <div className="flex flex-col gap-6">
        <StepProgress current={4} />
        <div className="card-duo-yellow">
          <p className="font-bold text-duo-gray">
            {t("results_no_test_pre")}{" "}
            <a href="/wizard" className="underline text-duo-blue-dark">
              {t("results_no_test_link")}
            </a>{" "}
            {t("results_no_test_post")}
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
      setNarrativeError(e instanceof Error ? e.message : t("results_error_narrative"));
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
      setNarrativeError(e instanceof Error ? e.message : t("results_error_export"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <StepProgress current={4} />
      <h1 className="text-xl font-black text-duo-gray">{t("results_title")}</h1>

      {loading && <p className="text-sm font-bold text-duo-blue-dark">{t("results_loading")}</p>}
      {error && <p className="card-duo-red text-sm font-bold text-duo-red-dark">⚠ {error}</p>}

      {currentResult && (
        <div className="flex flex-col gap-5">
          <div className="card-duo-green text-center">
            <span className="text-4xl">🎉</span>
            <h2 className="mt-1 font-black text-duo-green-dark">
              {language === "en" ? TEST_NAMES_EN[currentResult.test_id] : currentResult.test_name_id}
            </h2>
            {currentResult.method_used === "nonparametric_fallback" && (
              <p className="mt-1 text-xs font-bold text-duo-yellow-dark">{t("results_nonparametric_warning")}</p>
            )}
          </div>

          <div className="card-duo">
            <h3 className="mb-2 text-sm font-black text-duo-gray">{t("results_descriptives_title")}</h3>
            <DescriptivesTable rows={currentResult.descriptives} />

            <h3 className="mt-4 mb-2 text-sm font-black text-duo-gray">{t("results_test_results_title")}</h3>
            <StatSummary stats={currentResult.test_statistics} />
          </div>

          {currentResult.charts.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {currentResult.charts.map((c) => (
                <div key={c.caption_id} className="flex flex-col gap-2">
                  <img
                    src={`data:image/png;base64,${c.image_base64}`}
                    alt={c.caption_id}
                    className="rounded-3xl border-2 border-duo-gray-light bg-white p-2"
                  />
                  <button
                    onClick={() => downloadBase64Png(c.image_base64, `${currentResult.test_id}_${c.caption_id}`)}
                    className="btn-duo-outline btn-duo-sm w-fit"
                  >
                    {t("results_download_png")}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="card-duo">
            <h3 className="mb-2 text-sm font-black text-duo-gray">{t("results_narrative_title")}</h3>
            {!narrativeText && (
              <>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => generateNarrative(narrativeMode)}
                    disabled={narrativeLoading}
                    className="btn-duo-purple"
                  >
                    {narrativeLoading
                      ? t("results_narrative_loading")
                      : `✨ ${t("results_narrative_btn").replace(
                          "{mode}",
                          narrativeMode === "ai" ? t("results_mode_ai") : narrativeMode === "template" ? t("results_mode_template") : t("results_mode_auto")
                        )}`}
                  </button>
                  {narrativeMode !== "template" && (
                    <button
                      onClick={() => generateNarrative("template")}
                      disabled={narrativeLoading}
                      className="btn-duo-outline"
                    >
                      {t("results_narrative_free_template_btn")}
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs font-semibold text-duo-gray-soft">
                  {t("results_narrative_settings_pre")}{" "}
                  <a href="/pengaturan" className="underline text-duo-blue-dark">
                    {t("nav_pengaturan")}
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
                  {narrativeSource === "template" ? t("results_narrative_from_template") : t("results_narrative_from_ai")}
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
                  {narrativeLoading ? t("results_narrative_regenerating") : t("results_narrative_regenerate")}
                </button>
              </>
            )}
          </div>

          <button onClick={downloadDocx} disabled={exporting} className="btn-duo-blue w-fit">
            {exporting ? t("results_preparing_file") : t("results_download_docx")}
          </button>
        </div>
      )}
    </div>
  );
}
