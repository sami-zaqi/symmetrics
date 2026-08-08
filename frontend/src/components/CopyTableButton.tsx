"use client";

import { useState } from "react";
import { copyTableToClipboard } from "@/lib/exportUtils";

export default function CopyTableButton({ tableRef }: { tableRef: React.RefObject<HTMLTableElement | null> }) {
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  async function handleCopy() {
    if (!tableRef.current) return;
    const ok = await copyTableToClipboard(tableRef.current);
    setCopied(ok ? "ok" : "fail");
    setTimeout(() => setCopied("idle"), 2000);
  }

  return (
    <button onClick={handleCopy} className="btn-duo-outline btn-duo-sm w-fit">
      {copied === "ok" ? "✔ Tersalin!" : copied === "fail" ? "⚠ Gagal menyalin" : "📋 Salin sebagai Tabel (untuk Word)"}
    </button>
  );
}
