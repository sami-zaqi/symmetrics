"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/SessionContext";
import Logo from "@/components/Logo";

type NavColor = "blue" | "yellow" | "purple" | "green" | "gray";

const COLOR_STYLES: Record<NavColor, { icon: string; activeBg: string; activeBorder: string; activeText: string }> = {
  blue: { icon: "text-duo-blue", activeBg: "bg-duo-blue-light", activeBorder: "border-duo-blue-dark", activeText: "text-duo-blue-dark" },
  yellow: { icon: "text-duo-yellow-dark", activeBg: "bg-duo-yellow-light", activeBorder: "border-duo-yellow-dark", activeText: "text-duo-yellow-dark" },
  purple: { icon: "text-duo-purple", activeBg: "bg-duo-purple-light", activeBorder: "border-duo-purple-dark", activeText: "text-duo-purple-dark" },
  green: { icon: "text-duo-green", activeBg: "bg-duo-green-light", activeBorder: "border-duo-green-dark", activeText: "text-duo-green-dark" },
  gray: { icon: "text-duo-gray-soft", activeBg: "bg-slate-100", activeBorder: "border-duo-gray-light", activeText: "text-duo-gray" },
};

type NavItem = { href: string; label: string; icon: string; color: NavColor };

// Grouped so the sidebar can visually separate the primary-research flow
// (upload -> wizard -> results) from the secondary-research tools, without
// changing each item's own icon/text/active color.
const NAV_GROUPS: { key: string; groupBg?: string; items: NavItem[] }[] = [
  {
    key: "top",
    items: [{ href: "/", label: "Beranda", icon: "🏠", color: "blue" }],
  },
  {
    key: "primer",
    groupBg: "bg-duo-green-light",
    items: [
      { href: "/desain-data", label: "Desain Data", icon: "🧩", color: "yellow" },
      { href: "/upload", label: "Unggah Data", icon: "📁", color: "yellow" },
      { href: "/wizard", label: "Pilih Uji", icon: "🧭", color: "purple" },
      { href: "/assumptions", label: "Cek Asumsi", icon: "✅", color: "green" },
      { href: "/results", label: "Hasil & Ekspor", icon: "🏆", color: "blue" },
    ],
  },
  {
    key: "sekunder",
    groupBg: "bg-duo-yellow-light",
    items: [{ href: "/riset-sekunder", label: "Riset Sekunder", icon: "📚", color: "purple" }],
  },
  {
    key: "bottom",
    items: [{ href: "/pengaturan", label: "Pengaturan", icon: "⚙️", color: "gray" }],
  },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { dataset, reset } = useSession();
  const [confirmExit, setConfirmExit] = useState(false);

  async function handleExit() {
    if (dataset?.session_id) {
      try {
        await api.deleteSession(dataset.session_id);
      } catch {
        // session may already be gone server-side; ignore
      }
    }
    reset();
    setConfirmExit(false);
    router.push("/");
  }

  return (
    <nav className="flex w-full flex-col gap-1 border-duo-gray-light bg-white p-3 md:h-full md:w-60 md:border-r-2">
      <div className="mb-3 px-2 py-1">
        <Logo size={30} textClassName="text-xl" />
        {dataset && (
          <p className="mt-0.5 text-xs font-bold text-duo-gray-soft">{dataset.row_count} baris aktif ⚡</p>
        )}
      </div>

      <div className="flex flex-row flex-wrap gap-1.5 md:flex-col">
        {NAV_GROUPS.map((group) => (
          <div
            key={group.key}
            className={`flex flex-row flex-wrap gap-1.5 md:flex-col ${
              group.groupBg ? `rounded-2xl p-1.5 ${group.groupBg}` : ""
            }`}
          >
            {group.items.map((item) => {
              const active = pathname === item.href;
              const c = COLOR_STYLES[item.color];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-extrabold tracking-tight transition-all ${
                    active ? `border-2 ${c.activeBorder} ${c.activeBg} ${c.activeText}` : "text-duo-gray-soft hover:bg-slate-50"
                  }`}
                >
                  <span className={`text-xl ${active ? "" : c.icon}`} aria-hidden>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-3 md:border-t-2 md:border-duo-gray-light">
        {!confirmExit ? (
          <button onClick={() => setConfirmExit(true)} className="btn-duo-red btn-duo-sm w-full">
            🚪 Keluar
          </button>
        ) : (
          <div className="rounded-2xl border-2 border-duo-red bg-duo-red-light p-3">
            <p className="mb-2 text-xs font-bold text-duo-red-dark">
              Hapus data &amp; hasil dari sesi ini?
            </p>
            <div className="flex gap-2">
              <button onClick={handleExit} className="btn-duo-red btn-duo-sm flex-1">
                Ya
              </button>
              <button onClick={() => setConfirmExit(false)} className="btn-duo-outline btn-duo-sm flex-1">
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
