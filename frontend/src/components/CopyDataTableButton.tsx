"use client";

import { useState } from "react";
import { copyHtmlTableToClipboard } from "@/lib/exportUtils";
import { useLanguage } from "@/lib/LanguageContext";

export default function CopyDataTableButton({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  async function handleCopy() {
    const ok = await copyHtmlTableToClipboard(headers, rows);
    setCopied(ok ? "ok" : "fail");
    setTimeout(() => setCopied("idle"), 2000);
  }

  return (
    <button onClick={handleCopy} className="btn-duo-outline btn-duo-sm w-fit">
      {copied === "ok" ? t("copy_table_copied") : copied === "fail" ? t("copy_table_failed") : t("copy_table_button")}
    </button>
  );
}
