"use client";

import { useState } from "react";
import PrismaDiagram from "@/components/secondary-research/PrismaDiagram";
import StudySelectionTable from "@/components/secondary-research/StudySelectionTable";
import QualityAssessment from "@/components/secondary-research/QualityAssessment";

const TABS = [
  { id: "prisma", label: "🗂 Diagram PRISMA" },
  { id: "seleksi", label: "🔍 Seleksi Studi" },
  { id: "kualitas", label: "⭐ Penilaian Kualitas" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function RisetSekunderPage() {
  const [tab, setTab] = useState<TabId>("prisma");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-duo-gray">📚 Riset Sekunder (Systematic Review)</h1>
      <p className="-mt-3 text-sm font-semibold text-duo-gray-soft">
        Alat bantu untuk tahap systematic review sebelum meta-analisis: diagram PRISMA, seleksi studi, dan penilaian
        kualitas. Bagian ini terpisah dari alur uji statistik data primer di menu lain.
      </p>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? "rounded-full border-2 border-duo-blue-dark bg-duo-blue px-4 py-1.5 text-xs font-black text-white"
                : "rounded-full border-2 border-duo-gray-light bg-white px-4 py-1.5 text-xs font-black text-duo-gray-soft"
            }
          >
            {t.label}
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
