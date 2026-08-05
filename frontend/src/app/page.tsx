"use client";

import Link from "next/link";
import { useSession } from "@/lib/SessionContext";
import { LogoMark } from "@/components/Logo";

const MENU = [
  {
    href: "/upload",
    icon: "📁",
    title: "1. Unggah Data",
    desc: "Unggah file CSV atau Excel data penelitian Anda.",
    style: "card-duo-yellow",
  },
  {
    href: "/wizard",
    icon: "🧭",
    title: "2. Pilih Uji",
    desc: "Jawab beberapa pertanyaan buat nemuin uji statistik yang tepat.",
    style: "card-duo-purple",
  },
  {
    href: "/assumptions",
    icon: "✅",
    title: "3. Cek Asumsi",
    desc: "Normalitas & homogenitas dicek otomatis, plus saran uji non-parametrik.",
    style: "card-duo-green",
  },
  {
    href: "/results",
    icon: "🏆",
    title: "4. Hasil & Ekspor",
    desc: "Lihat hasil uji, grafik, narasi interpretasi, lalu unduh ke Word.",
    style: "card-duo-blue",
  },
];

export default function Home() {
  const { dataset, currentResult, recommendation } = useSession();

  return (
    <div className="flex flex-col gap-8">
      <div className="card-duo-blue flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-duo-blue-dark bg-white">
          <LogoMark size={40} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-duo-blue-dark">
            Olah Data Skripsi, Dibimbing AI!
          </h1>
          <p className="mt-1 text-sm font-semibold text-duo-gray leading-relaxed">
            Bukan chatbot yang cuma ngobrolin statistik — ini mesin statistik asli (Python) yang
            dipandu AI dari unggah data sampai kalimat interpretasi Bab IV siap tempel. Cocok
            buat mahasiswa kedokteran, keperawatan, farmasi, kesehatan masyarakat, kebidanan &amp; gizi.
          </p>
        </div>
      </div>

      <div className="card-duo">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-duo-gray">
          ⚡ Status Sesi Kamu
        </h2>
        {dataset ? (
          <div className="flex flex-col gap-2 text-sm font-semibold text-duo-gray">
            <p className="flex items-center gap-2">
              <span className="badge-duo bg-duo-green-light text-duo-green-dark">✔ Data</span>
              {dataset.row_count} baris, {dataset.columns.length} kolom aktif
            </p>
            {recommendation && (
              <p className="flex items-center gap-2">
                <span className="badge-duo bg-duo-purple-light text-duo-purple-dark">✔ Uji</span>
                {recommendation.recommended_test.replaceAll("_", " ")}
              </p>
            )}
            {currentResult && (
              <p className="flex items-center gap-2">
                <span className="badge-duo bg-duo-yellow-light text-duo-yellow-dark">✔ Hasil</span>
                {currentResult.test_name_id}
              </p>
            )}
            <Link
              href={currentResult ? "/results" : recommendation ? "/assumptions" : "/wizard"}
              className="btn-duo-green btn-duo-sm mt-2 w-fit"
            >
              Lanjutkan →
            </Link>
          </div>
        ) : (
          <p className="text-sm font-semibold text-duo-gray-soft">
            Belum ada data diunggah nih. Yuk mulai dari &quot;Unggah Data&quot; di bawah! 👇
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-black text-duo-gray">🗺️ Menu</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`${m.style} flex flex-col gap-1 transition-transform hover:-translate-y-0.5`}
            >
              <span className="text-3xl">{m.icon}</span>
              <span className="font-black text-duo-gray">{m.title}</span>
              <span className="text-xs font-semibold text-duo-gray-soft">{m.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
