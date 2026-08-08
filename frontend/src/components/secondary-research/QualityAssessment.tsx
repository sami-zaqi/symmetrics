"use client";

import { useState } from "react";
import CopyDataTableButton from "@/components/CopyDataTableButton";

type ChecklistType = "cross_sectional" | "case_control";
type Answer = "ya" | "tidak" | "tidak_jelas" | "tidak_berlaku" | "";

const CHECKLISTS: Record<ChecklistType, { label: string; items: string[] }> = {
  cross_sectional: {
    label: "JBI - Studi Cross-Sectional Analitik",
    items: [
      "Apakah kriteria inklusi sampel didefinisikan dengan jelas?",
      "Apakah subjek penelitian dan lokasi penelitian dijelaskan secara rinci?",
      "Apakah paparan (exposure) diukur dengan cara yang valid dan reliabel?",
      "Apakah kriteria objektif dan standar digunakan untuk mengukur kondisi/penyakit?",
      "Apakah faktor perancu (confounding factors) diidentifikasi?",
      "Apakah strategi untuk mengatasi faktor perancu dinyatakan?",
      "Apakah outcome diukur dengan cara yang valid dan reliabel?",
      "Apakah analisis statistik yang digunakan sudah tepat?",
    ],
  },
  case_control: {
    label: "JBI - Studi Case-Control",
    items: [
      "Apakah kelompok kasus dan kontrol sebanding, kecuali pada status penyakitnya?",
      "Apakah kasus dan kontrol dipadankan (matched) secara tepat?",
      "Apakah kriteria yang sama digunakan untuk mengidentifikasi kasus dan kontrol?",
      "Apakah paparan diukur dengan cara yang standar, valid, dan reliabel?",
      "Apakah paparan diukur dengan cara yang sama pada kasus dan kontrol?",
      "Apakah faktor perancu (confounding factors) diidentifikasi?",
      "Apakah strategi untuk mengatasi faktor perancu dinyatakan?",
      "Apakah outcome dinilai dengan cara yang standar, valid, dan reliabel pada kasus dan kontrol?",
      "Apakah periode paparan yang diteliti cukup panjang untuk bermakna secara klinis?",
      "Apakah analisis statistik yang digunakan sudah tepat?",
    ],
  },
};

const ANSWER_LABEL: Record<Exclude<Answer, "">, string> = {
  ya: "Ya",
  tidak: "Tidak",
  tidak_jelas: "Tidak Jelas",
  tidak_berlaku: "T/B",
};

interface StudyAppraisal {
  id: string;
  judul: string;
  checklist: ChecklistType;
  answers: Answer[];
}

function emptyAppraisal(): StudyAppraisal {
  return {
    id: crypto.randomUUID(),
    judul: "",
    checklist: "cross_sectional",
    answers: Array(CHECKLISTS.cross_sectional.items.length).fill(""),
  };
}

function score(a: StudyAppraisal): { ya: number; berlaku: number; belumDijawab: number } {
  const ya = a.answers.filter((x) => x === "ya").length;
  const berlaku = a.answers.filter((x) => x !== "tidak_berlaku").length;
  const belumDijawab = a.answers.filter((x) => x === "").length;
  return { ya, berlaku, belumDijawab };
}

export default function QualityAssessment() {
  const [studies, setStudies] = useState<StudyAppraisal[]>([emptyAppraisal()]);

  function addStudy() {
    setStudies((prev) => [...prev, emptyAppraisal()]);
  }

  function removeStudy(id: string) {
    setStudies((prev) => prev.filter((s) => s.id !== id));
  }

  function setChecklist(id: string, checklist: ChecklistType) {
    setStudies((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, checklist, answers: Array(CHECKLISTS[checklist].items.length).fill("") } : s
      )
    );
  }

  function setJudul(id: string, judul: string) {
    setStudies((prev) => prev.map((s) => (s.id === id ? { ...s, judul } : s)));
  }

  function setAnswer(id: string, itemIndex: number, value: Answer) {
    setStudies((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const answers = [...s.answers];
        answers[itemIndex] = value;
        return { ...s, answers };
      })
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {studies.map((s) => {
        const def = CHECKLISTS[s.checklist];
        const { ya, berlaku, belumDijawab } = score(s);
        return (
          <div key={s.id} className="card-duo flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-1 min-w-[200px] flex-col gap-1 text-sm">
                <span className="font-bold text-duo-gray">Judul Studi</span>
                <input
                  value={s.judul}
                  onChange={(e) => setJudul(s.id, e.target.value)}
                  placeholder="Judul studi yang dinilai"
                  className="input-duo"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-bold text-duo-gray">Jenis Checklist</span>
                <select
                  value={s.checklist}
                  onChange={(e) => setChecklist(s.id, e.target.value as ChecklistType)}
                  className="input-duo"
                >
                  <option value="cross_sectional">Cross-Sectional</option>
                  <option value="case_control">Case-Control</option>
                </select>
              </label>
              <button onClick={() => removeStudy(s.id)} className="btn-duo-outline btn-duo-sm" title="Hapus studi">
                🗑
              </button>
            </div>

            <p className="text-xs font-bold text-duo-gray-soft">{def.label}</p>

            <div className="flex flex-col gap-2">
              {def.items.map((item, i) => (
                <div key={i} className="flex flex-col gap-1.5 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-duo-gray">
                    {i + 1}. {item}
                  </p>
                  <div className="flex gap-1.5">
                    {(["ya", "tidak", "tidak_jelas", "tidak_berlaku"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAnswer(s.id, i, opt)}
                        className={
                          s.answers[i] === opt
                            ? "rounded-xl border-2 border-duo-blue-dark bg-duo-blue px-2.5 py-1 text-[11px] font-bold text-white"
                            : "rounded-xl border-2 border-duo-gray-light bg-white px-2.5 py-1 text-[11px] font-bold text-duo-gray-soft"
                        }
                      >
                        {ANSWER_LABEL[opt]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-duo w-fit bg-duo-green-light text-duo-green-dark">
                Skor: {ya} / {berlaku} item terpenuhi (dari yang berlaku)
              </span>
              {belumDijawab > 0 && (
                <span className="badge-duo w-fit bg-duo-yellow-light text-duo-yellow-dark">
                  ⚠ {belumDijawab} item belum dijawab
                </span>
              )}
            </div>
            <CopyDataTableButton
              headers={["No", "Pertanyaan", "Jawaban"]}
              rows={def.items.map((item, i) => [String(i + 1), item, s.answers[i] ? ANSWER_LABEL[s.answers[i] as Exclude<Answer, "">] : "(belum dijawab)"])}
            />
          </div>
        );
      })}

      <button onClick={addStudy} className="btn-duo-outline btn-duo-sm w-fit">
        + Tambah Studi untuk Dinilai
      </button>

      {studies.length > 1 && (
        <div className="card-duo">
          <h3 className="mb-2 text-sm font-black text-duo-gray">Ringkasan Penilaian Kualitas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-duo-gray-light">
                  <th className="px-2 py-1.5 font-black text-duo-gray">Studi</th>
                  <th className="px-2 py-1.5 font-black text-duo-gray">Checklist</th>
                  <th className="px-2 py-1.5 font-black text-duo-gray">Skor</th>
                </tr>
              </thead>
              <tbody>
                {studies.map((s) => {
                  const { ya, berlaku, belumDijawab } = score(s);
                  return (
                    <tr key={s.id} className="border-b border-duo-gray-light/50">
                      <td className="px-2 py-1.5 font-semibold text-duo-gray-soft">{s.judul || "(belum diisi)"}</td>
                      <td className="px-2 py-1.5 font-semibold text-duo-gray-soft">{CHECKLISTS[s.checklist].label}</td>
                      <td className="px-2 py-1.5 font-semibold text-duo-gray-soft">
                        {ya} / {berlaku}
                        {belumDijawab > 0 && <span className="text-duo-yellow-dark"> (⚠ {belumDijawab} belum dijawab)</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2">
            <CopyDataTableButton
              headers={["Studi", "Checklist", "Skor"]}
              rows={studies.map((s) => {
                const { ya, berlaku, belumDijawab } = score(s);
                const skorText = belumDijawab > 0 ? `${ya} / ${berlaku} (${belumDijawab} belum dijawab)` : `${ya} / ${berlaku}`;
                return [s.judul || "(belum diisi)", CHECKLISTS[s.checklist].label, skorText];
              })}
            />
          </div>
        </div>
      )}

      <p className="text-xs font-semibold text-duo-gray-soft">
        Diadaptasi dari JBI Critical Appraisal Checklist (Joanna Briggs Institute). "T/B" = Tidak Berlaku, dikeluarkan
        dari perhitungan skor.
      </p>
    </div>
  );
}
