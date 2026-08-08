"use client";

import { useState } from "react";
import PrismaDiagram from "@/components/secondary-research/PrismaDiagram";
import StudySelectionTable from "@/components/secondary-research/StudySelectionTable";
import QualityAssessment from "@/components/secondary-research/QualityAssessment";
import { useLanguage } from "@/lib/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

const TABS: { id: "prisma" | "seleksi" | "kualitas"; labelKey: TranslationKey }[] = [
  { id: "prisma", labelKey: "rs_tab_prisma" },
  { id: "seleksi", labelKey: "rs_tab_seleksi" },
  { id: "kualitas", labelKey: "rs_tab_kualitas" },
];

type TabId = (typeof TABS)[number]["id"];

export default function RisetSekunderPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<TabId>("prisma");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-duo-gray">{t("rs_title")}</h1>
      <p className="-mt-3 text-sm font-semibold text-duo-gray-soft">{t("rs_subtitle")}</p>

      <div className="flex gap-2">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={
              tab === tb.id
                ? "rounded-full border-2 border-duo-blue-dark bg-duo-blue px-4 py-1.5 text-xs font-black text-white"
                : "rounded-full border-2 border-duo-gray-light bg-white px-4 py-1.5 text-xs font-black text-duo-gray-soft"
            }
          >
            {t(tb.labelKey)}
          </button>
        ))}
      </div>

      <div className="card-duo">
        {tab === "prisma" && <PrismaDiagram />}
        {tab === "seleksi" && <StudySelectionTable />}
        {tab === "kualitas" && <QualityAssessment />}
      </div>
    </div>
  );
}
