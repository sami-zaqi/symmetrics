"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/SessionContext";
import StepProgress from "@/components/StepProgress";

export default function AssumptionsPage() {
  const router = useRouter();
  const {
    dataset,
    recommendation,
    mapping,
    activeTestId,
    setActiveTestId,
    assumptionResult,
    setAssumptionResult,
    setMethodUsed,
    setFallbackReason,
  } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataset || !recommendation || !activeTestId) return;
    setLoading(true);
    setError(null);
    api
      .assumptionsCheck(dataset.session_id, activeTestId, mapping)
      .then(setAssumptionResult)
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memeriksa asumsi."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, recommendation, activeTestId]);

  if (!dataset || !recommendation) {
    return (
      <div className="flex flex-col gap-6">
        <StepProgress current={3} />
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

  function acceptFallback() {
    if (!assumptionResult) return;
    setActiveTestId(assumptionResult.recommended_test);
    setMethodUsed("nonparametric_fallback");
    setFallbackReason(assumptionResult.reason);
    router.push("/results");
  }

  function keepOriginal() {
    setMethodUsed(assumptionResult?.checked ? "parametric" : "as_selected");
    setFallbackReason(null);
    router.push("/results");
  }

  return (
    <div className="flex flex-col gap-6">
      <StepProgress current={3} />
      <h1 className="text-xl font-black text-duo-gray">✅ Pemeriksaan Asumsi</h1>

      {loading && <p className="text-sm font-bold text-duo-blue-dark">⏳ Memeriksa normalitas &amp; homogenitas data...</p>}
      {error && <p className="card-duo-red text-sm font-bold text-duo-red-dark">⚠ {error}</p>}

      {assumptionResult && !assumptionResult.checked && (
        <div className="card-duo">
          <p className="text-sm font-semibold text-duo-gray">
            Uji ini nggak butuh pemeriksaan asumsi normalitas/homogenitas.
          </p>
          <button onClick={keepOriginal} className="btn-duo-green mt-4">
            Lanjut ke Hasil Uji →
          </button>
        </div>
      )}

      {assumptionResult && assumptionResult.checked && (
        <div className="flex flex-col gap-4">
          <div className="card-duo">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-duo-gray-light">
                  <th className="px-2 py-1.5 font-black text-duo-gray">Uji</th>
                  <th className="px-2 py-1.5 font-black text-duo-gray">Statistik</th>
                  <th className="px-2 py-1.5 font-black text-duo-gray">p-value</th>
                  <th className="px-2 py-1.5 font-black text-duo-gray">Hasil</th>
                </tr>
              </thead>
              <tbody>
                {assumptionResult.outcomes.map((o, i) => (
                  <tr key={i} className="border-b border-duo-gray-light/50">
                    <td className="px-2 py-1.5 font-semibold text-duo-gray-soft">{o.name}</td>
                    <td className="px-2 py-1.5 font-semibold text-duo-gray-soft">{o.statistic?.toFixed(3) ?? "-"}</td>
                    <td className="px-2 py-1.5 font-semibold text-duo-gray-soft">{o.p_value?.toFixed(3) ?? "-"}</td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`badge-duo ${
                          o.passed ? "bg-duo-green-light text-duo-green-dark" : "bg-duo-yellow-light text-duo-yellow-dark"
                        }`}
                      >
                        {o.passed ? "✔ Terpenuhi" : "⚠ Tidak terpenuhi"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {assumptionResult.fallback_triggered ? (
            <div className="card-duo-yellow">
              <p className="text-sm font-bold text-duo-gray">⚠ {assumptionResult.reason}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={acceptFallback} className="btn-duo-yellow">
                  Gunakan {assumptionResult.recommended_test.replaceAll("_", " ")}
                </button>
                <button onClick={keepOriginal} className="btn-duo-outline">
                  Tetap Pakai Uji Semula
                </button>
              </div>
            </div>
          ) : (
            <div className="card-duo-green">
              <p className="text-sm font-bold text-duo-green-dark">✔ {assumptionResult.reason}</p>
              <button onClick={keepOriginal} className="btn-duo-green mt-4">
                Lanjut ke Hasil Uji →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
