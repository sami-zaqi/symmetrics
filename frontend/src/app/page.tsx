"use client";

import Link from "next/link";
import { useSession } from "@/lib/SessionContext";
import { useLanguage } from "@/lib/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";
import { LogoMark } from "@/components/Logo";

const MENU: { href: string; icon: string; titleKey: TranslationKey; descKey: TranslationKey; style: string }[] = [
  {
    href: "/desain-data",
    icon: "🧩",
    titleKey: "home_menu_desain_data_title",
    descKey: "home_menu_desain_data_desc",
    style: "card-duo-yellow",
  },
  {
    href: "/upload",
    icon: "📁",
    titleKey: "home_menu_upload_title",
    descKey: "home_menu_upload_desc",
    style: "card-duo-yellow",
  },
  {
    href: "/wizard",
    icon: "🧭",
    titleKey: "home_menu_wizard_title",
    descKey: "home_menu_wizard_desc",
    style: "card-duo-purple",
  },
  {
    href: "/assumptions",
    icon: "✅",
    titleKey: "home_menu_assumptions_title",
    descKey: "home_menu_assumptions_desc",
    style: "card-duo-green",
  },
  {
    href: "/results",
    icon: "🏆",
    titleKey: "home_menu_results_title",
    descKey: "home_menu_results_desc",
    style: "card-duo-blue",
  },
];

export default function Home() {
  const { dataset, currentResult, recommendation } = useSession();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-8">
      <div className="card-duo-blue flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-duo-blue-dark bg-white">
          <LogoMark size={40} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-duo-blue-dark">{t("home_title")}</h1>
          <p className="mt-1 text-sm font-semibold text-duo-gray leading-relaxed">{t("home_subtitle")}</p>
        </div>
      </div>

      <div className="card-duo">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-duo-gray">
          ⚡ {t("home_session_status")}
        </h2>
        {dataset ? (
          <div className="flex flex-col gap-2 text-sm font-semibold text-duo-gray">
            <p className="flex items-center gap-2">
              <span className="badge-duo bg-duo-green-light text-duo-green-dark">✔ {t("home_status_data")}</span>
              {dataset.row_count} {t("home_status_data_desc").replace("{n}", String(dataset.columns.length))}
            </p>
            {recommendation && (
              <p className="flex items-center gap-2">
                <span className="badge-duo bg-duo-purple-light text-duo-purple-dark">✔ {t("home_status_test")}</span>
                {recommendation.recommended_test.replaceAll("_", " ")}
              </p>
            )}
            {currentResult && (
              <p className="flex items-center gap-2">
                <span className="badge-duo bg-duo-yellow-light text-duo-yellow-dark">✔ {t("home_status_result")}</span>
                {currentResult.test_name_id}
              </p>
            )}
            <Link
              href={currentResult ? "/results" : recommendation ? "/assumptions" : "/wizard"}
              className="btn-duo-green btn-duo-sm mt-2 w-fit"
            >
              {t("home_continue")}
            </Link>
          </div>
        ) : (
          <p className="text-sm font-semibold text-duo-gray-soft">{t("home_no_data")}</p>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-black text-duo-gray">🗺️ {t("home_menu_title")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`${m.style} flex flex-col gap-1 transition-transform hover:-translate-y-0.5`}
            >
              <span className="text-3xl">{m.icon}</span>
              <span className="font-black text-duo-gray">{t(m.titleKey)}</span>
              <span className="text-xs font-semibold text-duo-gray-soft">{t(m.descKey)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
