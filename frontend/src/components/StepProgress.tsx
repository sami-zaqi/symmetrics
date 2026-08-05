"use client";

import Link from "next/link";

const STEPS = [
  { href: "/upload", label: "Unggah", icon: "📁" },
  { href: "/wizard", label: "Pilih Uji", icon: "🧭" },
  { href: "/assumptions", label: "Cek Asumsi", icon: "✅" },
  { href: "/results", label: "Hasil", icon: "🏆" },
];

export default function StepProgress({ current }: { current: number }) {
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
                {step.label}
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
