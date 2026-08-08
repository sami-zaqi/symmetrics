"use client";

import { useRef, useState } from "react";
import { downloadSvgAsPng } from "@/lib/exportUtils";

interface PrismaCounts {
  identifiedDatabase: number;
  identifiedOther: number;
  duplicatesRemoved: number;
  excludedScreening: number;
  excludedFulltext: number;
  includedQuantitative: number;
}

const DEFAULT_COUNTS: PrismaCounts = {
  identifiedDatabase: 0,
  identifiedOther: 0,
  duplicatesRemoved: 0,
  excludedScreening: 0,
  excludedFulltext: 0,
  includedQuantitative: 0,
};

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-bold text-duo-gray">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="input-duo"
      />
    </label>
  );
}

function Box({ x, y, w, h, lines }: { x: number; y: number; w: number; h: number; lines: string[] }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill="white" stroke="#e5e5e5" strokeWidth={2} />
      {lines.map((line, i) => (
        <text
          key={i}
          x={x + w / 2}
          y={y + h / 2 - ((lines.length - 1) * 13) / 2 + i * 13 + 5}
          textAnchor="middle"
          fontSize={11.5}
          fontWeight={i === 0 ? 700 : 500}
          fill="#4b4b4b"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

export default function PrismaDiagram() {
  const [c, setC] = useState<PrismaCounts>(DEFAULT_COUNTS);
  const svgRef = useRef<SVGSVGElement>(null);
  const [downloadError, setDownloadError] = useState(false);

  async function handleDownload() {
    if (!svgRef.current) return;
    try {
      await downloadSvgAsPng(svgRef.current, "diagram_prisma");
      setDownloadError(false);
    } catch {
      setDownloadError(true);
    }
  }

  function update(patch: Partial<PrismaCounts>) {
    setC((prev) => ({ ...prev, ...patch }));
  }

  const totalIdentified = c.identifiedDatabase + c.identifiedOther;
  const screened = Math.max(0, totalIdentified - c.duplicatesRemoved);
  const fulltextAssessed = Math.max(0, screened - c.excludedScreening);
  const includedQualitative = Math.max(0, fulltextAssessed - c.excludedFulltext);

  const W = 760;
  const mainW = 300;
  const mainX = 40;
  const sideW = 280;
  const sideX = mainX + mainW + 60;
  const rowH = 78;
  const gap = 26;

  const rows = [
    { y: 10, h: 62 },
    { y: 10 + 62 + gap, h: rowH },
    { y: 10 + 62 + gap + rowH + gap, h: rowH },
    { y: 10 + 62 + gap + rowH + gap + rowH + gap, h: rowH },
    { y: 10 + 62 + gap + rowH + gap + rowH + gap + rowH + gap, h: rowH },
  ];
  const totalH = rows[4].y + rows[4].h + 10;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label="Rekaman ditemukan dari basis data"
          value={c.identifiedDatabase}
          onChange={(v) => update({ identifiedDatabase: v })}
        />
        <NumberField
          label="Rekaman ditemukan dari sumber lain (registri, sitasi, dll.)"
          value={c.identifiedOther}
          onChange={(v) => update({ identifiedOther: v })}
        />
        <NumberField
          label="Duplikat dihapus sebelum skrining"
          value={c.duplicatesRemoved}
          onChange={(v) => update({ duplicatesRemoved: v })}
        />
        <NumberField
          label="Dikecualikan saat skrining judul/abstrak"
          value={c.excludedScreening}
          onChange={(v) => update({ excludedScreening: v })}
        />
        <NumberField
          label="Dikecualikan setelah full-text dinilai"
          value={c.excludedFulltext}
          onChange={(v) => update({ excludedFulltext: v })}
        />
        <NumberField
          label="Dimasukkan ke sintesis kuantitatif (meta-analisis)"
          value={c.includedQuantitative}
          onChange={(v) => update({ includedQuantitative: v })}
        />
      </div>

      {c.includedQuantitative > includedQualitative && (
        <p className="text-xs font-bold text-duo-red-dark">
          ⚠ Jumlah sintesis kuantitatif tidak boleh lebih besar dari jumlah studi yang lolos penilaian kelayakan (
          {includedQualitative}).
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl bg-slate-50 p-4">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${totalH}`} width="100%" style={{ minWidth: 640 }}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#777777" />
            </marker>
          </defs>

          <text x={mainX} y={0} fontSize={12} fontWeight={800} fill="#777777">
            IDENTIFIKASI
          </text>
          <Box x={mainX} y={rows[0].y} w={mainW} h={rows[0].h} lines={["Total rekaman diidentifikasi", `n = ${totalIdentified}`]} />

          <line x1={mainX + mainW / 2} y1={rows[0].y + rows[0].h} x2={mainX + mainW / 2} y2={rows[1].y} stroke="#777777" strokeWidth={1.5} markerEnd="url(#arrow)" />
          <text x={mainX} y={rows[1].y - 4} fontSize={12} fontWeight={800} fill="#777777">
            SKRINING
          </text>
          <Box x={mainX} y={rows[1].y} w={mainW} h={rows[1].h} lines={["Rekaman diskrining (judul/abstrak)", `n = ${screened}`]} />
          <line x1={mainX + mainW} y1={rows[1].y + rows[1].h / 2} x2={sideX} y2={rows[1].y + rows[1].h / 2} stroke="#777777" strokeWidth={1.5} markerEnd="url(#arrow)" />
          <Box x={sideX} y={rows[1].y} w={sideW} h={rows[1].h} lines={["Dikecualikan (judul/abstrak)", `n = ${c.excludedScreening}`]} />

          <line x1={mainX + mainW / 2} y1={rows[1].y + rows[1].h} x2={mainX + mainW / 2} y2={rows[2].y} stroke="#777777" strokeWidth={1.5} markerEnd="url(#arrow)" />
          <text x={mainX} y={rows[2].y - 4} fontSize={12} fontWeight={800} fill="#777777">
            KELAYAKAN
          </text>
          <Box x={mainX} y={rows[2].y} w={mainW} h={rows[2].h} lines={["Full-text dinilai kelayakannya", `n = ${fulltextAssessed}`]} />
          <line x1={mainX + mainW} y1={rows[2].y + rows[2].h / 2} x2={sideX} y2={rows[2].y + rows[2].h / 2} stroke="#777777" strokeWidth={1.5} markerEnd="url(#arrow)" />
          <Box x={sideX} y={rows[2].y} w={sideW} h={rows[2].h} lines={["Dikecualikan (full-text)", `n = ${c.excludedFulltext}`]} />

          <line x1={mainX + mainW / 2} y1={rows[2].y + rows[2].h} x2={mainX + mainW / 2} y2={rows[3].y} stroke="#777777" strokeWidth={1.5} markerEnd="url(#arrow)" />
          <text x={mainX} y={rows[3].y - 4} fontSize={12} fontWeight={800} fill="#777777">
            TERMASUK
          </text>
          <Box x={mainX} y={rows[3].y} w={mainW} h={rows[3].h} lines={["Studi termasuk sintesis kualitatif", `n = ${includedQualitative}`]} />

          <line x1={mainX + mainW / 2} y1={rows[3].y + rows[3].h} x2={mainX + mainW / 2} y2={rows[4].y} stroke="#777777" strokeWidth={1.5} markerEnd="url(#arrow)" />
          <Box x={mainX} y={rows[4].y} w={mainW} h={rows[4].h} lines={["Studi termasuk sintesis kuantitatif (meta-analisis)", `n = ${c.includedQuantitative}`]} />
        </svg>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleDownload} className="btn-duo-outline btn-duo-sm w-fit">
          ⬇ Unduh Diagram (PNG)
        </button>
        {downloadError && <span className="text-xs font-bold text-duo-red-dark">⚠ Gagal mengunduh gambar.</span>}
      </div>
      <p className="text-xs font-semibold text-duo-gray-soft">
        Diadaptasi dari diagram alur PRISMA 2020. Angka tahap "skrining", "kelayakan", dan "termasuk (kualitatif)"
        dihitung otomatis dari angka yang Anda masukkan.
      </p>
    </div>
  );
}
