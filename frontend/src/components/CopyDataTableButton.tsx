"use client";

import { useState } from "react";
import { copyHtmlTableToClipboard } from "@/lib/exportUtils";

export default function CopyDataTableButton({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  async function handleCopy() {
    const ok = await copyHtmlTableToClipboard(headers, rows);
    setCopied(ok ? "ok" : "fail");
    setTimeout(() => setCopied("idle"), 2000);
  }

  return (
    <button onClick={handleCopy} className="btn-duo-outline btn-duo-sm w-fit">
      {copied === "ok" ? "✔ Tersalin!" : copied === "fail" ? "⚠ Gagal menyalin" : "📋 Salin sebagai Tabel (untuk Word)"}
    </button>
  );
}
