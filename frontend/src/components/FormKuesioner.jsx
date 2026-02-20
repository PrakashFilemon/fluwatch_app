/**
 * FormKuesioner — Modal kuesioner identifikasi influenza
 * Mengajukan 10 pertanyaan gejala + detail tambahan.
 * Setelah submit, data + lokasi GPS dikirim ke backend.
 */
import { useState } from "react";
import toast from "react-hot-toast";
import { kirimLaporan } from "../services/api";

/* ── Daftar pertanyaan gejala ──────────────────────────── */
const PERTANYAAN_GEJALA = [
  {
    field: "demam",
    tanya: "Apakah Anda mengalami demam (suhu tubuh di atas 38°C)?",
    ikon:  "🌡️",
    bobot: 25,
  },
  {
    field: "menggigil",
    tanya: "Apakah Anda mengalami menggigil atau merasa kedinginan secara tiba-tiba?",
    ikon:  "🥶",
    bobot: 15,
  },
  {
    field: "nyeri_otot",
    tanya: "Apakah Anda merasakan nyeri otot atau badan terasa sangat pegal?",
    ikon:  "💢",
    bobot: 15,
  },
  {
    field: "kelelahan",
    tanya: "Apakah Anda mengalami kelelahan atau lemas yang tidak biasa?",
    ikon:  "😴",
    bobot: 10,
  },
  {
    field: "batuk",
    tanya: "Apakah Anda mengalami batuk (kering maupun berdahak)?",
    ikon:  "😮‍💨",
    bobot: 10,
  },
  {
    field: "sakit_kepala",
    tanya: "Apakah Anda mengalami sakit kepala?",
    ikon:  "🤕",
    bobot: 8,
  },
  {
    field: "sakit_tenggorokan",
    tanya: "Apakah Anda merasakan sakit atau nyeri di tenggorokan?",
    ikon:  "🫁",
    bobot: 7,
  },
  {
    field: "pilek",
    tanya: "Apakah Anda mengalami pilek atau hidung tersumbat?",
    ikon:  "🤧",
    bobot: 5,
  },
  {
    field: "mual_muntah",
    tanya: "Apakah Anda mengalami mual atau muntah?",
    ikon:  "🤢",
    bobot: 3,
  },
  {
    field: "sesak_napas",
    tanya: "Apakah Anda mengalami sesak napas atau kesulitan bernapas?",
    ikon:  "😤",
    bobot: 2,
  },
];

const USIA_PILIHAN = [
  { nilai: "anak",   label: "Anak-anak (< 12 thn)" },
  { nilai: "remaja", label: "Remaja (12–17 thn)"   },
  { nilai: "dewasa", label: "Dewasa (18–59 thn)"    },
  { nilai: "lansia", label: "Lansia (≥ 60 thn)"     },
];

const AWAL = {
  gejala:           {},     // { field: true/false }
  nama_wilayah:     "",
  durasi_hari:      "",
  tingkat_keparahan: 5,
  sudah_vaksin:     null,
  kelompok_usia:    "dewasa",
};

/* ── Hitung skor preview (client-side) ─────────────────── */
function hitungSkorPreview(gejala) {
  return Math.min(
    PERTANYAAN_GEJALA.reduce((acc, p) => acc + (gejala[p.field] ? p.bobot : 0), 0),
    100
  );
}

function warnaSkor(skor) {
  if (skor < 30) return "text-green-400";
  if (skor < 55) return "text-yellow-400";
  if (skor < 75) return "text-orange-400";
  return "text-red-400";
}

export default function FormKuesioner({ lokasi, namaLokasi, onTutup, onSelesai }) {
  const [form,       setForm]       = useState({ ...AWAL, nama_wilayah: namaLokasi || "" });
  const [halaman,    setHalaman]    = useState(0);   // 0 = gejala, 1 = detail
  const [mengirim,   setMengirim]   = useState(false);

  const totalHalaman = 2;
  const skor         = hitungSkorPreview(form.gejala);

  const setGejala = (field, val) =>
    setForm(p => ({ ...p, gejala: { ...p.gejala, [field]: val } }));

  const handleKirim = async () => {
    if (!lokasi) {
      toast.error("Lokasi belum tersedia. Izinkan akses lokasi di browser Anda.");
      return;
    }
    setMengirim(true);
    try {
      const payload = {
        lat: lokasi.lat,
        lng: lokasi.lng,
        nama_wilayah:      form.nama_wilayah.trim() || undefined,
        ...Object.fromEntries(
          PERTANYAAN_GEJALA.map(p => [p.field, form.gejala[p.field] ?? false])
        ),
        durasi_hari:       form.durasi_hari ? parseInt(form.durasi_hari) : undefined,
        tingkat_keparahan: form.tingkat_keparahan,
        sudah_vaksin:      form.sudah_vaksin,
        kelompok_usia:     form.kelompok_usia,
      };
      await kirimLaporan(payload);
      toast.success("Laporan berhasil dikirim! Terima kasih.");
      onSelesai?.();
      onTutup?.();
    } catch (err) {
      toast.error(err.message || "Gagal mengirim laporan.");
    } finally {
      setMengirim(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl anim-fade-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Kuesioner Identifikasi Influenza</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Halaman {halaman + 1} dari {totalHalaman}
            </p>
          </div>
          <button onClick={onTutup} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-800 flex-shrink-0">
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${((halaman + 1) / totalHalaman) * 100}%` }}
          />
        </div>

        {/* Konten */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Halaman 1: Pertanyaan Gejala */}
          {halaman === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 mb-4">
                Jawab pertanyaan berikut dengan <strong className="text-white">Ya</strong> atau <strong className="text-white">Tidak</strong> sesuai kondisi Anda saat ini.
              </p>

              {/* Skor preview */}
              <div className="bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400">Skor Risiko Influenza</span>
                <span className={`text-2xl font-bold ${warnaSkor(skor)}`}>{skor}<span className="text-sm text-gray-500">/100</span></span>
              </div>

              {PERTANYAAN_GEJALA.map(({ field, tanya, ikon }) => {
                const val = form.gejala[field];
                return (
                  <div key={field} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-200 mb-3 flex gap-2">
                      <span className="flex-shrink-0">{ikon}</span>
                      <span>{tanya}</span>
                    </p>
                    <div className="flex gap-2">
                      {[
                        { val: true,  label: "Ya",    cls: val === true  ? "bg-red-600 border-red-500 text-white"  : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-400" },
                        { val: false, label: "Tidak", cls: val === false ? "bg-gray-600 border-gray-500 text-white" : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-400" },
                      ].map(btn => (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={() => setGejala(field, btn.val)}
                          className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${btn.cls}`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Halaman 2: Detail Tambahan */}
          {halaman === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-400">Lengkapi informasi tambahan untuk meningkatkan akurasi analisis.</p>

              {/* Tempat Tinggal */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Tempat Tinggal
                </label>
                <input
                  type="text"
                  value={form.nama_wilayah}
                  onChange={e => setForm(p => ({ ...p, nama_wilayah: e.target.value }))}
                  placeholder="Contoh: Kebayoran Baru, Menteng…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Diisi otomatis dari GPS, bisa diubah jika perlu.</p>
              </div>

              {/* Durasi */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Sudah berapa hari Anda merasakan gejala ini?
                </label>
                <input
                  type="number" min="1" max="30"
                  value={form.durasi_hari}
                  onChange={e => setForm(p => ({ ...p, durasi_hari: e.target.value }))}
                  placeholder="Contoh: 2"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Keparahan */}
              <div>
                <label className="flex justify-between text-sm font-semibold text-gray-300 mb-2">
                  <span>Seberapa parah kondisi Anda secara keseluruhan?</span>
                  <span className={`font-bold ${form.tingkat_keparahan <= 3 ? "text-green-400" : form.tingkat_keparahan <= 6 ? "text-yellow-400" : "text-red-400"}`}>
                    {form.tingkat_keparahan}/10
                  </span>
                </label>
                <input
                  type="range" min="1" max="10" step="1"
                  value={form.tingkat_keparahan}
                  onChange={e => setForm(p => ({ ...p, tingkat_keparahan: +e.target.value }))}
                  className="w-full accent-red-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Ringan (1)</span><span>Sedang (5)</span><span>Berat (10)</span>
                </div>
              </div>

              {/* Kelompok usia */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Kelompok usia Anda?</label>
                <div className="grid grid-cols-2 gap-2">
                  {USIA_PILIHAN.map(u => (
                    <button
                      key={u.nilai}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, kelompok_usia: u.nilai }))}
                      className={`py-2.5 rounded-lg border text-sm transition ${
                        form.kelompok_usia === u.nilai
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vaksin */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Sudah menerima vaksin influenza tahun ini?
                </label>
                <div className="flex gap-2">
                  {[
                    { val: true,  label: "Sudah" },
                    { val: false, label: "Belum" },
                    { val: null,  label: "Tidak Tahu" },
                  ].map(v => (
                    <button
                      key={String(v.val)}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, sudah_vaksin: v.val }))}
                      className={`flex-1 py-2.5 rounded-lg border text-sm transition ${
                        form.sudah_vaksin === v.val
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lokasi indicator */}
              <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                lokasi
                  ? "bg-green-950/40 border-green-800 text-green-400"
                  : "bg-red-950/40 border-red-800 text-red-400"
              }`}>
                <span>{lokasi ? "📍" : "⚠️"}</span>
                <span>
                  {lokasi
                    ? `Lokasi terdeteksi: ${lokasi.lat.toFixed(5)}, ${lokasi.lng.toFixed(5)}`
                    : "Lokasi belum tersedia — izinkan akses lokasi di browser"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tombol navigasi */}
        <div className="px-6 py-4 border-t border-gray-700 flex gap-3 flex-shrink-0">
          {halaman > 0 && (
            <button
              onClick={() => setHalaman(h => h - 1)}
              className="flex-1 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 text-sm font-medium transition"
            >
              ← Kembali
            </button>
          )}

          {halaman < totalHalaman - 1 ? (
            <button
              onClick={() => setHalaman(h => h + 1)}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Lanjut →
            </button>
          ) : (
            <button
              onClick={handleKirim}
              disabled={mengirim || !lokasi}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2.5 rounded-xl text-sm font-semibold transition"
            >
              {mengirim ? "Mengirim..." : "🦠 Kirim Laporan"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
