import { useEffect, useState, useCallback } from "react";
import { ambilStatistik } from "../services/api";

const LABEL_GEJALA = {
  demam:             "Demam & Menggigil",
  menggigil:         "Menggigil",
  batuk:             "Batuk Kering",
  kelelahan:         "Kelelahan Akut",
  sakit_tenggorokan: "Sakit Tenggorokan",
  nyeri_otot:        "Nyeri Otot",
  sakit_kepala:      "Sakit Kepala",
  pilek:             "Pilek / Hidung Tersumbat",
  mual_muntah:       "Mual / Muntah",
  sesak_napas:       "Sesak Napas",
};

function formatAngka(n) {
  if (n == null) return "—";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

function waktuLalu(detik) {
  if (detik < 60)   return "baru saja";
  if (detik < 3600) return `${Math.floor(detik / 60)} menit yang lalu`;
  return `${Math.floor(detik / 3600)} jam yang lalu`;
}

function indeksLabel(indeks) {
  if (indeks >= 7.5) return { teks: "KRITIS",  warna: "#ef4444" };
  if (indeks >= 5.5) return { teks: "TINGGI",   warna: "#f97316" };
  if (indeks >= 3)   return { teks: "SEDANG",   warna: "#eab308" };
  return                    { teks: "RENDAH",   warna: "#22c55e" };
}

function statusWilayah(kasus48j) {
  if (kasus48j >= 25) return "STATUS: WABAH INFLUENZA";
  if (kasus48j >= 11) return "STATUS: WASPADA FLU INFLUENZA";
  if (kasus48j >= 3)  return "STATUS: AKTIVITAS MENINGKAT";
  return                     "STATUS: NORMAL";
}

/* ── Kartu stat kecil ─────────────────────────────────── */
function KartuStat({ label, nilai, sub, trend, warnaTrend, badge, badgeWarna }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: "#0d1627", border: "1px solid #1a2744" }}>
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#475569" }}>{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-white">{nilai}</p>
        {trend !== undefined && (
          <span className="text-xs font-semibold mb-0.5" style={{ color: warnaTrend }}>
            {trend >= 0 ? `↑ +${trend}%` : `↓ ${trend}%`}
          </span>
        )}
        {badge && (
          <span className="text-xs font-bold px-2 py-0.5 rounded mb-0.5"
            style={{ background: badgeWarna + "22", color: badgeWarna, border: `1px solid ${badgeWarna}44` }}>
            {badge}
          </span>
        )}
      </div>
      {sub && <p className="text-xs" style={{ color: "#475569" }}>{sub}</p>}
    </div>
  );
}

export default function DashboardStats({ refreshKey = 0, onBukaAI }) {
  const [stat,    setStat]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tUpdate, setTUpdate] = useState(Date.now());
  const [lokasi,  setLokasi]  = useState(null); // { lat, lng } lokasi user

  // Minta lokasi browser sekali saat mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLokasi({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()    => { /* user tolak izin — tetap tampil statistik global */ },
      { timeout: 8000, maximumAge: 300_000 }
    );
  }, []);

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const params = lokasi ? { lat: lokasi.lat, lng: lokasi.lng, radius_km: 10 } : undefined;
      const d = await ambilStatistik(params);
      setStat(d);
      setTUpdate(Date.now());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [refreshKey, lokasi]);

  useEffect(() => {
    muat();
    const id = setInterval(muat, 30_000);
    return () => clearInterval(id);
  }, [muat]);

  const detikLalu = Math.floor((Date.now() - tUpdate) / 1000);
  const indeks    = stat?.indeks_risiko ?? 0;
  const badge     = indeksLabel(indeks);
  const statusTeks = statusWilayah(stat?.kasus_48jam ?? 0);

  /* ── Skeleton ── */
  if (loading && !stat) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        <div className="h-5 w-40 rounded" style={{ background: "#1a2744" }} />
        {[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-xl" style={{ background: "#0d1627" }} />)}
      </div>
    );
  }

  /* ── Insight teks otomatis ── */
  const trend = stat?.trend_persen ?? 0;
  const kasus = stat?.kasus_48jam ?? 0;
  let insightTeks = "";
  if (kasus >= 25)
    insightTeks = `Terdeteksi ${kasus} kasus aktif dalam 48 jam terakhir. Tingkat penyebaran sangat tinggi di area pemantauan. Segera kurangi aktivitas di luar ruangan.`;
  else if (trend > 20)
    insightTeks = `Prediksi menunjukkan potensi lonjakan kasus ${trend}% berdasarkan tren pelaporan terkini. Pantau perkembangan secara berkala dan terapkan protokol kesehatan.`;
  else if (kasus >= 10)
    insightTeks = `Terdeteksi ${kasus} kasus aktif. Gejala dominan: ${stat?.gejala_dominan?.[0]
      ? LABEL_GEJALA[stat.gejala_dominan[0].gejala] || stat.gejala_dominan[0].gejala
      : "demam"}. Waspadai potensi penyebaran lebih lanjut.`;
  else
    insightTeks = `Aktivitas influenza dalam batas normal dengan ${kasus} laporan dalam 48 jam terakhir. Tetap terapkan protokol kebersihan untuk pencegahan.`;

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: "1px solid #1a2744" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
            Ringkasan Statistik
          </h2>
          <span className="text-xs" style={{ color: "#334155" }}>
            Pembaruan: {waktuLalu(detikLalu)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        {/* ── Status wilayah banner ── */}
        <div className="rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ background: "#0d1627", border: `1px solid ${badge.warna}44` }}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: badge.warna }} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#64748b" }}>Status Wilayah</p>
              <p className="text-sm font-bold text-white">{statusTeks}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#64748b" }}>Indeks Risiko</p>
            <p className="text-base font-bold" style={{ color: badge.warna }}>
              {badge.teks} <span className="text-xs text-gray-500">({indeks}/10)</span>
            </p>
          </div>
        </div>

        {/* ── 4 Kartu Stat ── */}
        <div className="grid grid-cols-2 gap-2">
          <KartuStat
            label="Kasus Aktif"
            nilai={formatAngka(stat?.kasus_aktif)}
            trend={stat?.trend_persen}
            warnaTrend={(stat?.trend_persen ?? 0) >= 0 ? "#ef4444" : "#22c55e"}
          />
          <KartuStat
            label="Pemulihan"
            nilai={formatAngka(stat?.kasus_ringan)}
            trend={stat?.trend_persen != null ? -(stat.trend_persen) : undefined}
            warnaTrend={(stat?.trend_persen ?? 0) <= 0 ? "#22c55e" : "#ef4444"}
          />
          <KartuStat
            label="Laju Gejala"
            nilai={`${stat?.laju_per_jam ?? 0}`}
            sub="/jam"
            badge={(stat?.trend_persen ?? 0) > 10 ? "Meningkat" : (stat?.trend_persen ?? 0) < -10 ? "Menurun" : "Stabil"}
            badgeWarna={(stat?.trend_persen ?? 0) > 10 ? "#ef4444" : (stat?.trend_persen ?? 0) < -10 ? "#22c55e" : "#3b82f6"}
          />
          <KartuStat
            label="Skrining"
            nilai={formatAngka(stat?.kasus_total)}
            sub="Total"
          />
        </div>

        {/* ── Statistik Area User ── */}
        {stat?.area && (
          <div className="rounded-xl p-4" style={{ background: "#0d1627", border: "1px solid #1a2744" }}>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: 14 }}>📍</span>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>
                Area Sekitarmu ({stat.area.radius_km} km)
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg px-3 py-3 text-center" style={{ background: "#111827", border: "1px solid #1e293b" }}>
                <p className="text-xl font-bold text-white">{stat.area.kasus_48jam}</p>
                <p className="text-xs mt-0.5" style={{ color: "#475569" }}>Laporan 48j</p>
              </div>
              <div className="rounded-lg px-3 py-3 text-center" style={{ background: "#111827", border: "1px solid #1e293b" }}>
                <p className="text-xl font-bold text-white">{stat.area.kasus_total}</p>
                <p className="text-xs mt-0.5" style={{ color: "#475569" }}>Total Laporan</p>
              </div>
              <div className="rounded-lg px-3 py-3 text-center" style={{ background: "#111827", border: "1px solid #1e293b" }}>
                <p className="text-xl font-bold" style={{ color: "#93c5fd" }}>{stat.area.pengguna_unik}</p>
                <p className="text-xs mt-0.5" style={{ color: "#475569" }}>Pelapor Unik</p>
              </div>
            </div>
            {stat.area.kasus_48jam === 0 && (
              <p className="text-xs mt-2 text-center" style={{ color: "#334155" }}>
                Belum ada laporan di area ini dalam 48 jam terakhir
              </p>
            )}
          </div>
        )}

        {/* ── Frekuensi Gejala ── */}
        {stat?.gejala_dominan?.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: "#0d1627", border: "1px solid #1a2744" }}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#64748b" }}>
              Frekuensi Gejala Dilaporkan
            </h3>
            <div className="space-y-3">
              {stat.gejala_dominan.map(({ gejala, persen }) => (
                <div key={gejala}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 font-medium">
                      {LABEL_GEJALA[gejala] || gejala}
                    </span>
                    <span style={{ color: "#64748b" }}>{persen}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1a2744" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${persen}%`,
                        background: persen >= 70
                          ? "linear-gradient(90deg,#dc2626,#ef4444)"
                          : persen >= 40
                          ? "linear-gradient(90deg,#ea580c,#f97316)"
                          : "linear-gradient(90deg,#d97706,#fbbf24)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Wawasan AI ── */}
        <div className="rounded-xl p-4"
          style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderLeft: "3px solid #3b82f6" }}>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: "#3b82f6" }}>✦</span>
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#3b82f6" }}>
              Wawasan AI
            </h3>
          </div>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            "{insightTeks}"
          </p>
          <button
            onClick={onBukaAI}
            className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition"
            style={{ background: "#1e3a5f", color: "#93c5fd", border: "1px solid #2d5a8e" }}
          >
            Tanya AI Lebih Lanjut
          </button>
        </div>

        {/* ── Peringatan Terbaru ── */}
        {stat?.peringatan?.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>
              Peringatan Terbaru
            </h3>
            <div className="space-y-2">
              {stat.peringatan.map((p, i) => {
                const dotWarna = p.keparahan >= 7 ? "#ef4444" : p.keparahan >= 5 ? "#f97316" : "#eab308";
                const waktuTs  = new Date(p.timestamp);
                const jamStr   = waktuTs.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                const judulMap = {
                  high:   "Klaster Baru Terdeteksi",
                  medium: "Peningkatan Kasus",
                  low:    "Laporan Baru Masuk",
                };
                const judul = p.keparahan >= 7 ? judulMap.high : p.keparahan >= 5 ? judulMap.medium : judulMap.low;
                return (
                  <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: "#0d1627", border: "1px solid #1a2744" }}>
                    <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: dotWarna }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{judul}</p>
                      <p className="text-xs" style={{ color: "#475569" }}>
                        {p.wilayah} • {jamStr} WIB
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-center pb-2" style={{ color: "#1e293b" }}>
          Diperbarui otomatis tiap 30 detik
        </p>
      </div>
    </div>
  );
}
