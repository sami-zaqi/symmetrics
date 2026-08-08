"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

const STEPS: { href: string; labelKey: TranslationKey; icon: string }[] = [
  { href: "/upload", labelKey: "step_upload", icon: "📁" },
  { href: "/wizard", labelKey: "step_wizard", icon: "🧭" },
  { href: "/assumptions", labelKey: "step_assumptions", icon: "✅" },
  { href: "/results", labelKey: "step_results", icon: "🏆" },
];

export default function StepProgress({ current }: { current: number }) {
  const { t } = useLanguage();
  return (
    <div className="mb-2 flex items-center">
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={step.href} className="flex flex-1 items-center last:flex-none">
            <Link href={step.href} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 text-lg font-black transition-all ${
                  done
                    ? "border-duo-green-dark bg-duo-green text-white"
                    : active
                      ? "border-duo-blue-dark bg-duo-blue-light text-duo-blue-dark scale-110"
                      : "border-duo-gray-light bg-white text-duo-gray-soft"
                }`}
              >
                {done ? "✓" : step.icon}
              </div>
              <span
                className={`text-[11px] font-extrabold ${
                  active ? "text-duo-blue-dark" : done ? "text-duo-green-dark" : "text-duo-gray-soft"
                }`}
              >
                {t(step.labelKey)}
              </span>
            </Link>
            {stepNum < STEPS.length && (
              <div className={`mx-1 mb-4 h-1 flex-1 rounded-full ${done ? "bg-duo-green" : "bg-duo-gray-light"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
