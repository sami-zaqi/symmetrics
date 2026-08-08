"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/SessionContext";
import { useLanguage } from "@/lib/LanguageContext";
import ConstructBuilder from "@/components/sem-pls/ConstructBuilder";
import PathBuilder from "@/components/sem-pls/PathBuilder";
import { DescriptivesTable } from "@/components/ResultTables";
import type { SemConstruct, SemPath, SemPlsResult } from "@/lib/types";

export default function SemPlsPage() {
  const { t } = useLanguage();
  const { dataset } = useSession();
  const [constructs, setConstructs] = useState<SemConstruct[]>([]);
  const [paths, setPaths] = useState<SemPath[]>([]);
  const [result, setResult] = useState<SemPlsResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapIterations, setBootstrapIterations] = useState(300);
  const [bootstrapRunning, setBootstrapRunning] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  if (!dataset) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-black text-duo-gray">🧬 SEM-PLS</h1>
        <div className="card-duo-yellow">
          <p className="font-bold text-duo-gray">
            {t("wizard_no_data_pre")}{" "}
            <a href="/upload" className="underline text-duo-blue-dark">
              {t("wizard_no_data_link")}
            </a>{" "}
            {t("wizard_no_data_post")}
          </p>
        </div>
      </div>
    );
  }

  const numericCols = dataset.columns.filter((c) => c.dtype === "numeric").map((c) => c.name);
  const constructNames = constructs.map((c) => c.name.trim()).filter(Boolean);

  async function runModel() {
    if (!dataset) return;
    setError(null);
    setRunning(true);
    setResult(null);
    try {
      const res = await api.runSemPls(dataset.session_id, constructs, paths);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("sem_error_run"));
    } finally {
      setRunning(false);
    }
  }

  async function runBootstrap() {
    if (!dataset || !result) return;
    setBootstrapError(null);
    setBootstrapRunning(true);
    try {
      const res = await api.runSemBootstrap(dataset.session_id, result.result_id, bootstrapIterations);
      setResult(res);
    } catch (e) {
      setBootstrapError(e instanceof Error ? e.message : t("sem_error_bootstrap"));
    } finally {
      setBootstrapRunning(false);
    }
  }

  const readyToRun =
    constructs.length >= 2 &&
    constructs.every((c) => c.name.trim() && c.indicators.length >= 2) &&
    new Set(constructNames).size === constructNames.length &&
    paths.length >= 1;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-duo-gray">{t("sem_title")}</h1>
      <p className="-mt-3 text-sm font-semibold text-duo-gray-soft">{t("sem_subtitle")}</p>

      <div className="card-duo flex flex-col gap-3">
        <h2 className="text-sm font-black text-duo-gray">{t("sem_step1_title")}</h2>
        <ConstructBuilder constructs={constructs} numericCols={numericCols} onChange={setConstructs} />
      </div>

      {constructNames.length >= 2 && (
        <div className="card-duo flex flex-col gap-3">
          <h2 className="text-sm font-black text-duo-gray">{t("sem_step2_title")}</h2>
          <PathBuilder constructNames={constructNames} paths={paths} onChange={setPaths} />
        </div>
      )}

      {readyToRun && (
        <button onClick={runModel} disabled={running} className="btn-duo-green w-fit">
          {running ? t("sem_running") : t("sem_run_btn")}
        </button>
      )}
      {error && <p className="card-duo-red text-sm font-bold text-duo-red-dark">⚠ {error}</p>}

      {result && (
        <div className="flex flex-col gap-5">
          <div className="card-duo-green text-center">
            <span className="text-4xl">🎉</span>
            <h2 className="mt-1 font-black text-duo-green-dark">{t("sem_done_title")}</h2>
            <p className="text-xs font-bold text-duo-gray-soft">{t("sem_n_respondents").replace("{n}", String(result.n))}</p>
          </div>

          <div className="card-duo">
            <h3 className="mb-2 text-sm font-black text-duo-gray">{t("sem_section_outer_model")}</h3>
            <DescriptivesTable rows={result.loadings} />
          </div>

          <div className="card-duo">
            <h3 className="mb-2 text-sm font-black text-duo-gray">{t("sem_section_reliability")}</h3>
            <DescriptivesTable rows={result.reliability} />
            <p className="mt-2 text-xs font-semibold text-duo-gray-soft">{t("sem_reliability_note")}</p>
          </div>

          <div className="card-duo">
            <h3 className="mb-2 text-sm font-black text-duo-gray">{t("sem_section_discriminant")}</h3>
            <DescriptivesTable rows={result.discriminant_validity} />
            <p className="mt-2 text-xs font-semibold text-duo-gray-soft">{t("sem_discriminant_note")}</p>
          </div>

          <div className="card-duo">
            <h3 className="mb-2 text-sm font-black text-duo-gray">{t("sem_section_r2")}</h3>
            <DescriptivesTable rows={result.r_squared} />
          </div>

          <div className="card-duo">
            <h3 className="mb-2 text-sm font-black text-duo-gray">{t("sem_section_path_coef")}</h3>
            <DescriptivesTable rows={result.path_coefficients} />
            <p className="mt-2 text-xs font-semibold text-duo-gray-soft">{t("sem_path_coef_note")}</p>
          </div>

          <div className="card-duo">
            <h3 className="mb-2 text-sm font-black text-duo-gray">{t("sem_section_effects")}</h3>
            <DescriptivesTable rows={result.effects} />
          </div>

          <div className="card-duo">
            <h3 className="mb-2 text-sm font-black text-duo-gray">{t("sem_section_bootstrap")}</h3>
            <p className="mb-2 text-xs font-semibold text-duo-gray-soft">{t("sem_bootstrap_note")}</p>
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-bold text-duo-gray">{t("sem_bootstrap_iter_label")}</span>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={bootstrapIterations}
                  onChange={(e) => setBootstrapIterations(Math.max(100, Number(e.target.value) || 300))}
                  className="input-duo"
                />
              </label>
              <button onClick={runBootstrap} disabled={bootstrapRunning} className="btn-duo-purple">
                {bootstrapRunning ? t("sem_bootstrap_running") : t("sem_bootstrap_run_btn")}
              </button>
            </div>
            {bootstrapError && <p className="text-sm font-bold text-duo-red-dark">⚠ {bootstrapError}</p>}
            {result.bootstrap && <DescriptivesTable rows={result.bootstrap} />}
          </div>
        </div>
      )}
    </div>
  );
}
