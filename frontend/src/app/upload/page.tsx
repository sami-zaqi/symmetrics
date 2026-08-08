"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/SessionContext";
import { useLanguage } from "@/lib/LanguageContext";
import StepProgress from "@/components/StepProgress";
import CategoryMapper from "@/components/data-cleaner/CategoryMapper";
import type { CleaningStrategy, ColumnType } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();
  const { t } = useLanguage();
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
      setError(e instanceof Error ? e.message : t("upload_error_file"));
    } finally {
      setLoading(false);
    }
  }

  async function handleClean(strategy: CleaningStrategy) {
    if (!dataset) return;
    setCleaning(true);
    setError(null);
    try {
      const summary = await api.cleanData(dataset.session_id, strategy);
      setDataset(summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("upload_error_clean"));
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
      setError(e instanceof Error ? e.message : t("upload_error_type"));
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
      <h1 className="text-xl font-black text-duo-gray">{t("upload_title")}</h1>
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
        <p className="font-bold text-duo-gray">{t("upload_dropzone_text")}</p>
        <p className="mt-1 text-xs font-semibold text-duo-gray-soft">{t("upload_dropzone_format")}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.sav"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {loading && <p className="text-sm font-bold text-duo-blue-dark">{t("upload_loading")}</p>}
      {error && <p className="card-duo-red text-sm font-bold text-duo-red-dark">⚠ {error}</p>}

      {dataset && (
        <div className="card-duo-green">
          <p className="mb-2 text-sm font-bold text-duo-green-dark">
            {t("upload_success").replace("{rows}", String(dataset.row_count)).replace("{cols}", String(dataset.columns.length))}
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
          <h3 className="mb-1 text-sm font-black text-duo-gray">{t("upload_review_title")}</h3>
          <p className="mb-3 text-xs font-semibold text-duo-gray-soft">{t("upload_review_desc")}</p>
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
                        {reviewColumn === c.name ? t("upload_hide") : t("upload_unique_values").replace("{n}", String(c.unique_count))}
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
          <h3 className="mb-2 text-sm font-black text-duo-gray">{t("upload_quality_title")}</h3>
          {hasMissing && (
            <p className="text-xs font-semibold text-duo-gray">
              {t("upload_missing_found").replace(
                "{list}",
                missingColumns.map((c) => `${c.name} (${c.missing_count} sel)`).join(", ")
              )}
            </p>
          )}
          {hasOutliers && (
            <p className="mt-1 text-xs font-semibold text-duo-gray">
              {t("upload_outliers_found").replace(
                "{list}",
                dataset!.outliers.map((o) => `${o.column} (${o.count} nilai)`).join(", ")
              )}
            </p>
          )}
          {hasMissing && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => handleClean("listwise_deletion")}
                disabled={cleaning}
                className="btn-duo-yellow btn-duo-sm"
              >
                {cleaning ? t("upload_processing") : t("upload_btn_delete_missing")}
              </button>
              <button
                onClick={() => handleClean("mean_mode_imputation")}
                disabled={cleaning}
                className="btn-duo-outline btn-duo-sm"
              >
                {cleaning ? t("upload_processing") : t("upload_btn_mean_mode")}
              </button>
              <button
                onClick={() => handleClean("knn_imputation")}
                disabled={cleaning}
                className="btn-duo-outline btn-duo-sm"
                title={t("upload_btn_knn_title")}
              >
                {cleaning ? t("upload_processing") : t("upload_btn_knn")}
              </button>
              <button
                onClick={() => handleClean("mice_imputation")}
                disabled={cleaning}
                className="btn-duo-outline btn-duo-sm"
                title={t("upload_btn_mice_title")}
              >
                {cleaning ? t("upload_processing") : t("upload_btn_mice")}
              </button>
            </div>
          )}
        </div>
      )}

      {dataset && (
        <button onClick={() => router.push("/wizard")} className="btn-duo-green w-fit">
          {t("upload_continue")}
        </button>
      )}
    </div>
  );
}
