"use client";

import { useLanguage } from "@/lib/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return <footer className="py-4 text-center text-xs font-semibold text-duo-gray-soft">{t("footer_disclaimer")}</footer>;
}
