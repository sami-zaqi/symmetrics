"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/SessionContext";

export default function PengaturanPage() {
  const router = useRouter();
  const { dataset, narrativeMode, setNarrativeMode, reset } = useSession();
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
      <h1 className="text-xl font-black text-duo-gray">⚙️ Pengaturan</h1>

      <div className="card-duo">
        <h2 className="mb-1 text-sm font-black text-duo-gray">✨ Mode Narasi Default</h2>
        <p className="mb-3 text-xs font-semibold text-duo-gray-soft">
          Menentukan tombol utama &quot;Buat Narasi&quot; di halaman Hasil pakai sumber apa.
        </p>
        <div className="flex flex-col gap-2">
          {(
            [
              { value: "auto", label: "🔀 Otomatis", desc: "Coba AI dulu, otomatis pakai Template kalau AI gagal/saldo habis." },
              { value: "ai", label: "🤖 AI (Claude) saja", desc: "Selalu pakai AI. Butuh saldo Anthropic aktif." },
              { value: "template", label: "📝 Template saja", desc: "Selalu pakai template gratis, tanpa panggilan AI sama sekali." },
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
                <span className="block font-black text-duo-gray">{opt.label}</span>
                <span className="block text-xs font-semibold text-duo-gray-soft">{opt.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="card-duo">
        <h2 className="mb-2 text-sm font-black text-duo-gray">🔌 Status Backend</h2>
        <div className="flex items-center gap-3">
          <button onClick={checkBackend} disabled={checking} className="btn-duo-outline btn-duo-sm">
            {checking ? "Memeriksa..." : "Cek Status Server"}
          </button>
          {backendStatus === "ok" && (
            <span className="badge-duo bg-duo-green-light text-duo-green-dark">✔ Terhubung</span>
          )}
          {backendStatus === "down" && (
            <span className="badge-duo bg-duo-red-light text-duo-red-dark">✘ Tidak terhubung</span>
          )}
        </div>
      </div>

      <div className="card-duo-blue">
        <h2 className="mb-2 text-sm font-black text-duo-blue-dark">🔒 Privasi Data</h2>
        <p className="text-xs font-semibold text-duo-gray leading-relaxed">
          Data yang kamu unggah hanya disimpan sementara di memori server selama sesi berjalan
          (tidak ditulis ke database atau disk) dan otomatis terhapus setelah tidak aktif. Kamu
          juga bisa menghapusnya kapan saja secara manual di bawah ini.
        </p>
      </div>

      <div className="card-duo-red">
        <h2 className="mb-2 text-sm font-black text-duo-red-dark">⚠ Zona Berbahaya</h2>
        <p className="mb-3 text-xs font-semibold text-duo-gray">
          Menghapus sesi akan menghilangkan data yang diunggah, hasil uji, dan narasi yang belum diunduh.
        </p>
        <button onClick={clearSession} className="btn-duo-red">
          🗑 Hapus Sesi &amp; Mulai Ulang
        </button>
      </div>
    </div>
  );
}
