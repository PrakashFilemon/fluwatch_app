/**
 * FormKuesioner — Modal kuesioner identifikasi influenza
 * Mengajukan 10 pertanyaan gejala + detail tambahan.
 * Setelah submit, data + lokasi GPS dikirim ke backend.
 */
import { useState } from "react";
import toast from "react-hot-toast";
import { kirimLaporan } from "../../services/api";

/* ── Daftar pertanyaan gejala ──────────────────────────── */
const PERTANYAAN_GEJALA = [
  {
    field: "demam",
    tanya: "Apakah Anda mengalami demam (suhu tubuh di atas 38°C)?",
    ikon: "🌡️",
    bobot: 25,
  },
  {
    field: "menggigil",
    tanya:
      "Apakah Anda mengalami menggigil atau merasa kedinginan secara tiba-tiba?",
    ikon: "🥶",
    bobot: 15,
  },
  {
    field: "nyeri_otot",
    tanya: "Apakah Anda merasakan nyeri otot atau badan terasa sangat pegal?",
    ikon: "💢",
    bobot: 15,
  },
  {
    field: "kelelahan",
    tanya: "Apakah Anda mengalami kelelahan atau lemas yang tidak biasa?",
    ikon: "😴",
    bobot: 10,
  },
  {
    field: "batuk",
    tanya: "Apakah Anda mengalami batuk (kering maupun berdahak)?",
    ikon: "😮‍💨",
    bobot: 10,
  },
  {
    field: "sakit_kepala",
    tanya: "Apakah Anda mengalami sakit kepala?",
    ikon: "🤕",
    bobot: 8,
  },
  {
    field: "sakit_tenggorokan",
    tanya: "Apakah Anda merasakan sakit atau nyeri di tenggorokan?",
    ikon: "🫁",
    bobot: 7,
  },
  {
    field: "pilek",
    tanya: "Apakah Anda mengalami pilek atau hidung tersumbat?",
    ikon: "🤧",
    bobot: 5,
  },
  {
    field: "mual_muntah",
    tanya: "Apakah Anda mengalami mual atau muntah?",
    ikon: "🤢",
    bobot: 3,
  },
  {
    field: "sesak_napas",
    tanya: "Apakah Anda mengalami sesak napas atau kesulitan bernapas?",
    ikon: "😤",
    bobot: 2,
  },
];

const USIA_PILIHAN = [
  { nilai: "anak", label: "Anak-anak (< 12 thn)" },
  { nilai: "remaja", label: "Remaja (12–17 thn)" },
  { nilai: "dewasa", label: "Dewasa (18–59 thn)" },
  { nilai: "lansia", label: "Lansia (≥ 60 thn)" },
];

const AWAL = {
  gejala: {}, // { field: true/false }
  nama_wilayah: "",
  durasi_hari: "",
  tingkat_keparahan: 5,
  sudah_vaksin: null,
  kelompok_usia: "dewasa",
};

/* ── Hitung skor preview (client-side) ─────────────────── */
function hitungSkorPreview(gejala) {
  return Math.min(
    PERTANYAAN_GEJALA.reduce(
      (acc, p) => acc + (gejala[p.field] ? p.bobot : 0),
      0,
    ),
    100,
  );
}

function warnaSkor(skor) {
  if (skor < 30) return "text-green-400";
  if (skor < 55) return "text-yellow-400";
  if (skor < 75) return "text-orange-400";
  return "text-red-400";
}

export default function FormKuesioner({
  lokasi,
  namaLokasi,
  onTutup,
  onSelesai,
}) {
  const [form, setForm] = useState({ ...AWAL, nama_wilayah: namaLokasi || "" });
  const [halaman, setHalaman] = useState(0); // 0 = gejala, 1 = detail
  const [mengirim, setMengirim] = useState(false);

  const totalHalaman = 2;
  const skor = hitungSkorPreview(form.gejala);

  const setGejala = (field, val) =>
    setForm((p) => ({ ...p, gejala: { ...p.gejala, [field]: val } }));

  const handleKirim = async () => {
    if (!lokasi) {
      toast.error(
        "Lokasi belum tersedia. Izinkan akses lokasi di browser Anda.",
      );
      return;
    }
    setMengirim(true);
    try {
      const payload = {
        lat: lokasi.lat,
        lng: lokasi.lng,
        nama_wilayah: form.nama_wilayah.trim() || undefined,
        ...Object.fromEntries(
          PERTANYAAN_GEJALA.map((p) => [
            p.field,
            form.gejala[p.field] ?? false,
          ]),
        ),
        durasi_hari: form.durasi_hari ? parseInt(form.durasi_hari) : undefined,
        tingkat_keparahan: form.tingkat_keparahan,
        sudah_vaksin: form.sudah_vaksin,
        kelompok_usia: form.kelompok_usia,
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
    <div className="fixed inset-0 z-[1000] bg-black/75 flex items-center justify-center p-4">
      <div
        className="rounded-md w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl anim-fade-up"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(58,142,133,0.15)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center rounded-md justify-between px-6 py-4 flex-shrink-0"
          style={{
            borderBottom: "1px solid rgba(58,142,133,0.12)",
            background: "#f0faf9",
          }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: "#1a2e2c" }}>
              Kuesioner Identifikasi Influenza
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              Halaman {halaman + 1} dari {totalHalaman}
            </p>
          </div>
          <button
            onClick={onTutup}
            className="text-2xl leading-none"
            style={{ color: "#64748b" }}
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div
          className="h-1 flex-shrink-0"
          style={{ background: "rgba(58,142,133,0.10)" }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((halaman + 1) / totalHalaman) * 100}%`,
              background: "#3A8E85",
            }}
          />
        </div>

        {/* Konten */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          {/* Halaman 1: Pertanyaan Gejala */}
          {halaman === 0 && (
            <div className="space-y-3">
              <p className="text-sm mb-4" style={{ color: "#64748b" }}>
                Jawab pertanyaan berikut dengan{" "}
                <strong style={{ color: "#1a2e2c" }}>Ya</strong> atau{" "}
                <strong style={{ color: "#1a2e2c" }}>Tidak</strong> sesuai
                kondisi Anda saat ini.
              </p>

              {/* Skor preview */}
              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between mb-4"
                style={{
                  background: "#f0faf9",
                  border: "1px solid rgba(58,142,133,0.12)",
                }}
              >
                <span className="text-xs" style={{ color: "#64748b" }}>
                  Skor Risiko Influenza
                </span>
                <span className={`text-2xl font-bold ${warnaSkor(skor)}`}>
                  {skor}
                  <span className="text-sm" style={{ color: "#94a3b8" }}>
                    /100
                  </span>
                </span>
              </div>

              {PERTANYAAN_GEJALA.map(({ field, tanya, ikon }) => {
                const val = form.gejala[field];
                return (
                  <div
                    key={field}
                    className="rounded-xl p-4 sm:p-5"
                    style={{
                      background: "rgba(58,142,133,0.04)",
                      border: "1px solid rgba(58,142,133,0.12)",
                    }}
                  >
                    <p
                      className="text-sm mb-3 flex gap-2"
                      style={{ color: "#1a2e2c" }}
                    >
                      <span className="flex-shrink-0">{ikon}</span>
                      <span>{tanya}</span>
                    </p>
                    <div className="flex flex-col xs:flex-row gap-2">
                      {[
                        { val: true, label: "Ya" },
                        { val: false, label: "Tidak" },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={() => setGejala(field, btn.val)}
                          className="flex-1 py-2 rounded-lg border text-sm font-medium transition"
                          style={
                            btn.val === true
                              ? val === true
                                ? {
                                    background: "#3A8E85",
                                    borderColor: "#3A8E85",
                                    color: "#fff",
                                  }
                                : {
                                    background: "#f8fffe",
                                    borderColor: "rgba(58,142,133,0.20)",
                                    color: "#64748b",
                                  }
                              : val === false
                                ? {
                                    background: "#64748b",
                                    borderColor: "#64748b",
                                    color: "#fff",
                                  }
                                : {
                                    background: "#f8fffe",
                                    borderColor: "rgba(58,142,133,0.20)",
                                    color: "#64748b",
                                  }
                          }
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
              <p className="text-sm" style={{ color: "#64748b" }}>
                Lengkapi informasi tambahan untuk meningkatkan akurasi analisis.
              </p>

              {/* Tempat Tinggal */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "#1a2e2c" }}
                >
                  Tempat Tinggal
                </label>
                <input
                  type="text"
                  value={form.nama_wilayah}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nama_wilayah: e.target.value }))
                  }
                  placeholder="Contoh: Kebayoran Baru, Menteng…"
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition"
                  style={{
                    background: "#f8fffe",
                    border: "1px solid rgba(58,142,133,0.25)",
                    color: "#374151",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#3A8E85")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(58,142,133,0.25)")
                  }
                />
                <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                  Diisi otomatis dari GPS, bisa diubah jika perlu.
                </p>
              </div>

              {/* Durasi */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "#1a2e2c" }}
                >
                  Sudah berapa hari Anda merasakan gejala ini?
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={form.durasi_hari}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, durasi_hari: e.target.value }))
                  }
                  placeholder="Contoh: 2"
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition"
                  style={{
                    background: "#f8fffe",
                    border: "1px solid rgba(58,142,133,0.25)",
                    color: "#374151",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#3A8E85")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(58,142,133,0.25)")
                  }
                />
              </div>

              {/* Keparahan */}
              <div>
                <label
                  className="flex justify-between text-sm font-semibold mb-2"
                  style={{ color: "#1a2e2c" }}
                >
                  <span>Seberapa parah kondisi Anda secara keseluruhan?</span>
                  <span
                    className={`font-bold ${form.tingkat_keparahan <= 3 ? "text-green-500" : form.tingkat_keparahan <= 6 ? "text-yellow-500" : "text-red-500"}`}
                  >
                    {form.tingkat_keparahan}/10
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={form.tingkat_keparahan}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      tingkat_keparahan: +e.target.value,
                    }))
                  }
                  className="w-full accent-teal-600"
                  style={{ accentColor: "#3A8E85" }}
                />
                <div
                  className="flex justify-between text-xs mt-1"
                  style={{ color: "#94a3b8" }}
                >
                  <span>Ringan (1)</span>
                  <span>Sedang (5)</span>
                  <span>Berat (10)</span>
                </div>
              </div>

              {/* Kelompok usia */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "#1a2e2c" }}
                >
                  Kelompok usia Anda?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {USIA_PILIHAN.map((u) => (
                    <button
                      key={u.nilai}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({ ...p, kelompok_usia: u.nilai }))
                      }
                      className="py-2.5 rounded-lg border text-sm transition"
                      style={
                        form.kelompok_usia === u.nilai
                          ? {
                              background: "#3A8E85",
                              borderColor: "#3A8E85",
                              color: "#fff",
                            }
                          : {
                              background: "#f8fffe",
                              borderColor: "rgba(58,142,133,0.20)",
                              color: "#374151",
                            }
                      }
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vaksin */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "#1a2e2c" }}
                >
                  Sudah menerima vaksin influenza tahun ini?
                </label>
                <div className="flex gap-2">
                  {[
                    { val: true, label: "Sudah" },
                    { val: false, label: "Belum" },
                    { val: null, label: "Tidak Tahu" },
                  ].map((v) => (
                    <button
                      key={String(v.val)}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({ ...p, sudah_vaksin: v.val }))
                      }
                      className="flex-1 py-2.5 rounded-lg border text-sm transition"
                      style={
                        form.sudah_vaksin === v.val
                          ? {
                              background: "#3A8E85",
                              borderColor: "#3A8E85",
                              color: "#fff",
                            }
                          : {
                              background: "#f8fffe",
                              borderColor: "rgba(58,142,133,0.20)",
                              color: "#374151",
                            }
                      }
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lokasi indicator */}
              <div
                className="flex items-center gap-2.5 text-xs px-3 py-2.5 rounded-xl"
                style={
                  lokasi
                    ? {
                        background: "#f0fdf4",
                        border: "1px solid #86efac",
                        color: "#15803d",
                      }
                    : {
                        background: "#fff7ed",
                        border: "1px solid #fdba74",
                        color: "#c2410c",
                      }
                }
              >
                <span className="text-base flex-shrink-0">
                  {lokasi ? "📍" : "⚠️"}
                </span>
                <span className="font-medium">
                  {lokasi
                    ? `Lokasi terdeteksi: ${lokasi.lat.toFixed(5)}, ${lokasi.lng.toFixed(5)}`
                    : "Lokasi belum tersedia — izinkan akses lokasi di browser"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tombol navigasi */}
        <div
          className="px-6 py-4 flex gap-3 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(58,142,133,0.12)" }}
        >
          {halaman > 0 && (
            <button
              onClick={() => setHalaman((h) => h - 1)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(58,142,133,0.25)",
                color: "#64748b",
              }}
            >
              ← Kembali
            </button>
          )}

          {halaman < totalHalaman - 1 ? (
            <button
              onClick={() => setHalaman((h) => h + 1)}
              className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition"
              style={{ background: "linear-gradient(135deg,#3A8E85,#006B5F)" }}
            >
              Lanjut →
            </button>
          ) : (
            <button
              onClick={handleKirim}
              disabled={mengirim || !lokasi}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
              style={
                mengirim || !lokasi
                  ? { background: "rgba(58,142,133,0.15)", color: "#94a3b8" }
                  : {
                      background: "linear-gradient(135deg,#3A8E85,#006B5F)",
                      color: "#fff",
                    }
              }
            >
              {mengirim ? "Mengirim..." : "🦠 Kirim Laporan"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
