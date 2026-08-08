"use client";

import { useState } from "react";
import CopyDataTableButton from "@/components/CopyDataTableButton";

type Decision = "belum" | "include" | "exclude";

interface StudyRow {
  id: string;
  judul: string;
  penulisTahun: string;
  tahap: "judul_abstrak" | "full_text";
  keputusan: Decision;
  alasan: string;
}

function emptyRow(): StudyRow {
  return {
    id: crypto.randomUUID(),
    judul: "",
    penulisTahun: "",
    tahap: "judul_abstrak",
    keputusan: "belum",
    alasan: "",
  };
}

const DECISION_STYLE: Record<Decision, string> = {
  belum: "bg-slate-100 text-duo-gray-soft",
  include: "bg-duo-green-light text-duo-green-dark",
  exclude: "bg-duo-red-light text-duo-red-dark",
};

const DECISION_LABEL: Record<Decision, string> = {
  belum: "Belum diputuskan",
  include: "✔ Include",
  exclude: "✘ Exclude",
};

export default function StudySelectionTable() {
  const [rows, setRows] = useState<StudyRow[]>([emptyRow()]);

  function update(id: string, patch: Partial<StudyRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const included = rows.filter((r) => r.keputusan === "include").length;
  const excluded = rows.filter((r) => r.keputusan === "exclude").length;

  const tableHeaders = ["Judul Studi", "Penulis (Tahun)", "Tahap Skrining", "Keputusan", "Alasan (jika exclude)"];
  const tableRows = rows.map((r) => [
    r.judul,
    r.penulisTahun,
    r.tahap === "judul_abstrak" ? "Judul/Abstrak" : "Full-text",
    DECISION_LABEL[r.keputusan],
    r.alasan,
  ]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <span className="badge-duo bg-duo-blue-light text-duo-blue-dark">{rows.length} studi dicatat</span>
        <span className="badge-duo bg-duo-green-light text-duo-green-dark">{included} include</span>
        <span className="badge-duo bg-duo-red-light text-duo-red-dark">{excluded} exclude</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b-2 border-duo-gray-light">
              <th className="px-2 py-1.5 font-black text-duo-gray">Judul Studi</th>
              <th className="px-2 py-1.5 font-black text-duo-gray">Penulis (Tahun)</th>
              <th className="px-2 py-1.5 font-black text-duo-gray">Tahap Skrining</th>
              <th className="px-2 py-1.5 font-black text-duo-gray">Keputusan</th>
              <th className="px-2 py-1.5 font-black text-duo-gray">Alasan (jika exclude)</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-duo-gray-light/50 align-top">
                <td className="px-2 py-1.5">
                  <input
                    value={r.judul}
                    onChange={(e) => update(r.id, { judul: e.target.value })}
                    placeholder="Judul studi"
                    className="input-duo"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={r.penulisTahun}
                    onChange={(e) => update(r.id, { penulisTahun: e.target.value })}
                    placeholder="mis. Sari dkk. (2023)"
                    className="input-duo"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <select
                    value={r.tahap}
                    onChange={(e) => update(r.id, { tahap: e.target.value as StudyRow["tahap"] })}
                    className="input-duo"
                  >
                    <option value="judul_abstrak">Judul/Abstrak</option>
                    <option value="full_text">Full-text</option>
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex flex-col gap-1">
                    <span className={`badge-duo w-fit ${DECISION_STYLE[r.keputusan]}`}>{DECISION_LABEL[r.keputusan]}</span>
                    <select
                      value={r.keputusan}
                      onChange={(e) => update(r.id, { keputusan: e.target.value as Decision })}
                      className="input-duo"
                    >
                      <option value="belum">Belum diputuskan</option>
                      <option value="include">Include</option>
                      <option value="exclude">Exclude</option>
                    </select>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={r.alasan}
                    onChange={(e) => update(r.id, { alasan: e.target.value })}
                    placeholder="mis. Desain bukan cross-sectional"
                    disabled={r.keputusan !== "exclude"}
                    className="input-duo disabled:opacity-40"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button onClick={() => removeRow(r.id)} className="btn-duo-outline btn-duo-sm" title="Hapus baris">
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={addRow} className="btn-duo-outline btn-duo-sm w-fit">
          + Tambah Studi
        </button>
        <CopyDataTableButton headers={tableHeaders} rows={tableRows} />
      </div>
    </div>
  );
}
