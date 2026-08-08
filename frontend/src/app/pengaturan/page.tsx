"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/SessionContext";
import { useLanguage } from "@/lib/LanguageContext";

export default function PengaturanPage() {
  const router = useRouter();
  const { dataset, narrativeMode, setNarrativeMode, reset } = useSession();
  const { language, setLanguage, t } = useLanguage();
  const [checking, setChecking] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"unknown" | "ok" | "down">("unknown");

  async function checkBackend() {
    setChecking(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/health`);
      setBackendStatus(res.ok ? "ok" : "down");
    } catch {
      setBackendStatus("down");
    } finally {
      setChecking(false);
    }
  }

  async function clearSession() {
    if (dataset?.session_id) {
      try {
        await api.deleteSession(dataset.session_id);
      } catch {
        // ignore -- session may already be gone
      }
    }
    reset();
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-duo-gray">⚙️ {t("settings_title")}</h1>

      <div className="card-duo">
        <h2 className="mb-1 text-sm font-black text-duo-gray">🌐 {t("settings_language_title")}</h2>
        <p className="mb-3 text-xs font-semibold text-duo-gray-soft">{t("settings_language_desc")}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage("id")}
            className={language === "id" ? "btn-duo-blue btn-duo-sm" : "btn-duo-outline btn-duo-sm"}
          >
            🇮🇩 Bahasa Indonesia
          </button>
          <button
            onClick={() => setLanguage("en")}
            className={language === "en" ? "btn-duo-blue btn-duo-sm" : "btn-duo-outline btn-duo-sm"}
          >
            🇬🇧 English
          </button>
        </div>
      </div>

      <div className="card-duo">
        <h2 className="mb-1 text-sm font-black text-duo-gray">✨ {t("settings_narrative_mode_title")}</h2>
        <p className="mb-3 text-xs font-semibold text-duo-gray-soft">{t("settings_narrative_mode_desc")}</p>
        <div className="flex flex-col gap-2">
          {(
            [
              { value: "auto", icon: "🔀", labelKey: "settings_narrative_auto", descKey: "settings_narrative_auto_desc" },
              { value: "ai", icon: "🤖", labelKey: "settings_narrative_ai", descKey: "settings_narrative_ai_desc" },
              { value: "template", icon: "📝", labelKey: "settings_narrative_template", descKey: "settings_narrative_template_desc" },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3 text-sm transition-colors ${
                narrativeMode === opt.value ? "border-duo-blue-dark bg-duo-blue-light" : "border-duo-gray-light bg-white"
              }`}
            >
              <input
                type="radio"
                name="narrativeMode"
                checked={narrativeMode === opt.value}
                onChange={() => setNarrativeMode(opt.value)}
                className="mt-1 accent-duo-blue"
              />
              <span>
                <span className="block font-black text-duo-gray">
                  {opt.icon} {t(opt.labelKey)}
                </span>
                <span className="block text-xs font-semibold text-duo-gray-soft">{t(opt.descKey)}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="card-duo">
        <h2 className="mb-2 text-sm font-black text-duo-gray">🔌 {t("settings_backend_status_title")}</h2>
        <div className="flex items-center gap-3">
          <button onClick={checkBackend} disabled={checking} className="btn-duo-outline btn-duo-sm">
            {checking ? t("settings_checking") : t("settings_check_backend")}
          </button>
          {backendStatus === "ok" && (
            <span className="badge-duo bg-duo-green-light text-duo-green-dark">✔ {t("settings_connected")}</span>
          )}
          {backendStatus === "down" && (
            <span className="badge-duo bg-duo-red-light text-duo-red-dark">✘ {t("settings_disconnected")}</span>
          )}
        </div>
      </div>

      <div className="card-duo-blue">
        <h2 className="mb-2 text-sm font-black text-duo-blue-dark">🔒 {t("settings_privacy_title")}</h2>
        <p className="text-xs font-semibold text-duo-gray leading-relaxed">{t("settings_privacy_desc")}</p>
      </div>

      <div className="card-duo-red">
        <h2 className="mb-2 text-sm font-black text-duo-red-dark">⚠ {t("settings_danger_title")}</h2>
        <p className="mb-3 text-xs font-semibold text-duo-gray">{t("settings_danger_desc")}</p>
        <button onClick={clearSession} className="btn-duo-red">
          🗑 {t("settings_clear_session")}
        </button>
      </div>
    </div>
  );
}
