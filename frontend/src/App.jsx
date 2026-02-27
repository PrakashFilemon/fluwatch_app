import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import PetaHeatmap from "./components/PetaHeatmap";
import FormKuesioner from "./components/FormKuesioner";
import DashboardStats from "./components/DashboardStats";
import AnalisisAI from "./components/AnalisisAI";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import LupaPasswordModal from "./components/LupaPasswordModal";
import ResetPassword from "./components/ResetPassword";
import LandingPage from "./LandingPage";
import AdminApp from "./admin/AdminApp";
import { useAuth } from "./contexts/AuthContext";
import { riwayatSayaAPI } from "./services/api";

// ── Cek path khusus (dievaluasi sekali saat module load) ─────────────────
const _params     = new URLSearchParams(window.location.search);
const _resetToken = _params.get("token");
const _isReset    = window.location.pathname === "/reset-password" && !!_resetToken;
const _isAdmin    = window.location.pathname === "/admin";

const TAB = [
  { id: "peta",      icon: "▦",  label: "Peta"       },
  { id: "analisis",  icon: "◎",  label: "AI"         },
  { id: "riwayat",   icon: "☰",  label: "Riwayat"   },
  { id: "statistik", icon: "↗",  label: "Statistik"  },
];

const WAKTU     = ["24 Jam", "7 Hari", "30 Hari"];
const WAKTU_JAM = { "24 Jam": 24, "7 Hari": 168, "30 Hari": 720 };

export default function App() {
  const { pengguna, sudahLogin, isAdmin, logout, loading: authLoading } = useAuth();

  // ── ALL hooks FIRST (before any conditional returns) ─────────────────────
  const [tab,                setTab]                = useState("peta");
  const [tampilForm,         setTampilForm]         = useState(false);
  const [tampilLogin,        setTampilLogin]        = useState(false);
  const [tampilRegister,     setTampilRegister]     = useState(false);
  const [tampilLupaPassword, setTampilLupaPassword] = useState(false);
  const [tampilDropdown,     setTampilDropdown]     = useState(false);
  const [lokasi,             setLokasi]             = useState(null);
  const [namaLokasi,         setNamaLokasi]         = useState("LOKASI ANDA");
  const [waktuAktif,         setWaktuAktif]         = useState("24 Jam");
  const [refreshKey,         setRefreshKey]         = useState(0);
  const [riwayatLaporan,     setRiwayatLaporan]     = useState([]);
  const [loadingRiwayat,     setLoadingRiwayat]     = useState(false);

  /* ── Geolokasi + reverse geocoding ── */
  const mintaLokasi = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLokasi({ lat, lng });
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "id" } },
          );
          const d = await r.json();
          const nama =
            d.address?.suburb || d.address?.city_district ||
            d.address?.county || d.address?.city || "LOKASI ANDA";
          setNamaLokasi(nama.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase()));
        } catch {
          setNamaLokasi("LOKASI ANDA");
        }
      },
      () => { toast.error("Akses lokasi ditolak."); },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  useEffect(() => { mintaLokasi(); }, [mintaLokasi]);

  const fetchRiwayat = useCallback(() => {
    if (!sudahLogin) return;
    setLoadingRiwayat(true);
    riwayatSayaAPI()
      .then(data => setRiwayatLaporan(data.laporan || []))
      .catch(() => {})
      .finally(() => setLoadingRiwayat(false));
  }, [sudahLogin]);

  useEffect(() => {
    if (tab === "riwayat") fetchRiwayat();
  }, [tab, fetchRiwayat]);

  // ── Loading screen (auth masih divalidasi) ───────────────────────────────
  if (authLoading) {
    return (
      <div style={{
        width: "100vw", height: "100vh",
        background: "#080d1a",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          border: "3px solid #1e3a5f", borderTopColor: "#3b82f6",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Panel Admin ──────────────────────────────────────────────────────────
  if (_isAdmin) return <AdminApp />;

  // ── Halaman Reset Password ────────────────────────────────────────────────
  if (_isReset) {
    return (
      <ResetPassword
        token={_resetToken}
        onSelesai={() => {
          window.history.replaceState({}, "", "/");
          window.location.reload();
        }}
      />
    );
  }

  // ── Landing Page (belum login) ────────────────────────────────────────────
  if (!sudahLogin) {
    return (
      <>
        <LandingPage
          onEnterApp={() => setTampilLogin(true)}
          onLoginClick={() => setTampilLogin(true)}
        />
        {tampilLogin && (
          <LoginModal
            onTutup={() => setTampilLogin(false)}
            onBukaRegister={() => { setTampilLogin(false); setTampilRegister(true); }}
            onBukaLupaPassword={() => { setTampilLogin(false); setTampilLupaPassword(true); }}
            onSelesai={() => setTampilLogin(false)}
          />
        )}
        {tampilRegister && (
          <RegisterModal
            onTutup={() => setTampilRegister(false)}
            onBukaMasuk={() => { setTampilRegister(false); setTampilLogin(true); }}
            onSelesai={() => setTampilRegister(false)}
          />
        )}
        {tampilLupaPassword && (
          <LupaPasswordModal
            onTutup={() => setTampilLupaPassword(false)}
            onBukaLogin={() => { setTampilLupaPassword(false); setTampilLogin(true); }}
          />
        )}
      </>
    );
  }

  const setelahLaporan = () => {
    setRefreshKey((k) => k + 1);
    if (tab === "riwayat") fetchRiwayat();
  };

  const bukaFormLaporan = () => {
    if (!sudahLogin) setTampilLogin(true);
    else setTampilForm(true);
  };

  const jendela = WAKTU_JAM[waktuAktif];

  return (
    <div className="flex flex-col h-screen overflow-hidden"
      style={{ background: "#080d1a", color: "#f1f5f9" }}>

      {/* ══ NAVBAR ══════════════════════════════════════════════ */}
      <header className="flex-shrink-0 z-50"
        style={{ background: "#0a1020", borderBottom: "1px solid #1a2744" }}>

        {/* Baris utama */}
        <div className="flex items-center justify-between px-4 py-2.5 gap-2">

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}>
              🦠
            </div>
            <span className="font-bold text-sm tracking-tight">
              FluWatch<span style={{ color: "#f97316" }}>.AI</span>
            </span>
          </div>

          {/* Lokasi — tablet ke atas */}
          <button onClick={mintaLokasi}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{ background: "#0f172a", border: "1px solid #1e3a5f", color: "#93c5fd" }}>
            <span style={{ color: "#ef4444" }}>📍</span>
            <span className="max-w-[120px] truncate">{namaLokasi}</span>
          </button>

          {/* Filter waktu — selalu tampil, ringkas di mobile */}
          <div className="flex items-center gap-0.5 rounded-lg p-1 flex-shrink-0"
            style={{ background: "#0f172a" }}>
            {WAKTU.map((w) => (
              <button key={w} onClick={() => setWaktuAktif(w)}
                className="px-2 py-1 rounded-md text-xs font-semibold transition"
                style={waktuAktif === w
                  ? { background: "#1e3a5f", color: "#93c5fd" }
                  : { color: "#475569" }}>
                {/* Mobile: singkat | Desktop: lengkap */}
                <span className="sm:hidden">
                  {w === "24 Jam" ? "24j" : w === "7 Hari" ? "7h" : "30h"}
                </span>
                <span className="hidden sm:inline">{w}</span>
              </button>
            ))}
          </div>

          {/* Aksi kanan */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Tombol Laporan */}
            <button onClick={bukaFormLaporan}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition"
              style={{ background: "#dc2626", color: "#fff" }}>
              <span>⚠</span>
              <span className="hidden sm:inline">Laporkan Gejala</span>
            </button>

            {/* User */}
            {sudahLogin ? (
              <div className="relative">
                <button onClick={() => setTampilDropdown((d) => !d)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: "#111827", border: "1px solid #1e3a5f", color: "#93c5fd" }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ background: "#1e3a5f" }}>
                    {pengguna.username[0].toUpperCase()}
                  </span>
                  <span className="hidden md:inline">{pengguna.username}</span>
                  <span style={{ color: "#475569" }}>▾</span>
                </button>
                {tampilDropdown && (
                  <div className="absolute right-0 mt-1 w-44 rounded-xl py-1 z-50"
                    style={{ background: "#0d1627", border: "1px solid #1e3a5f" }}
                    onMouseLeave={() => setTampilDropdown(false)}>
                    {isAdmin && (
                      <a href="/admin"
                        className="block px-4 py-2 text-xs font-medium transition hover:bg-blue-900/30"
                        style={{ color: "#93c5fd" }}>
                        ⚙ Panel Admin
                      </a>
                    )}
                    <button
                      onClick={() => { logout(); setTampilDropdown(false); toast.success("Berhasil keluar."); }}
                      className="w-full text-left px-4 py-2 text-xs font-medium transition hover:bg-red-900/30"
                      style={{ color: "#ef4444" }}>
                      ⏏ Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setTampilLogin(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                style={{ background: "#0f172a", border: "1px solid #1e3a5f", color: "#93c5fd" }}>
                Masuk
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ══ TAB BAR ═════════════════════════════════════════════ */}
      <div className="flex-shrink-0 px-4 overflow-x-auto"
        style={{ background: "#0a1020", borderBottom: "1px solid #1a2744" }}>
        <div className="flex min-w-max">
          {TAB.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap"
              style={tab === t.id
                ? { borderColor: "#3b82f6", color: "#f1f5f9" }
                : { borderColor: "transparent", color: "#475569" }}>
              <span style={{ fontSize: "12px" }}>{t.icon}</span>
              <span className="hidden xs:inline sm:inline">{t.label}</span>
            </button>
          ))}

          {/* Info refresh — tampil di tab bar sebelah kanan */}
          <div className="ml-auto flex items-center pr-2">
            <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg"
              style={{ color: "#334155" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#22c55e", flexShrink: 0 }} />
              <span className="hidden sm:inline">Heatmap diperbarui tiap 5 menit</span>
              <span className="sm:hidden">Auto 5 mnt</span>
            </span>
          </div>
        </div>
      </div>

      {/* ══ KONTEN UTAMA ════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Panel Kiri (penuh di mobile, flex-1 di desktop) ── */}
        <div className="flex-1 overflow-hidden relative min-w-0">
          {tab === "peta" && (
            <div className="h-full p-2">
              <div className="relative w-full h-full rounded-xl overflow-hidden"
                style={{ border: "1px solid #1e3a5f" }}>
                <PetaHeatmap
                  key={`peta-${refreshKey}`}
                  lokasi={lokasi}
                  jendela={jendela}
                  refreshKey={refreshKey}
                  onBukaAI={() => setTab("analisis")}
                  onLapor={bukaFormLaporan}
                />
              </div>
            </div>
          )}

          {tab === "analisis" && (
            <div className="h-full p-3 sm:p-4">
              <AnalisisAI lokasi={lokasi} />
            </div>
          )}

          {tab === "riwayat" && (
            <div className="h-full overflow-y-auto p-3 sm:p-4">
              {!sudahLogin ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center px-6 py-10 rounded-2xl max-w-xs w-full"
                    style={{ background: "#0d1627", border: "1px solid #1a2744" }}>
                    <div className="text-4xl mb-4">🔒</div>
                    <h3 className="text-base font-bold text-gray-200 mb-2">
                      Masuk untuk Melihat Riwayat
                    </h3>
                    <p className="text-xs text-gray-500 mb-5">
                      Riwayat laporan gejala Anda akan muncul di sini setelah masuk.
                    </p>
                    <button
                      onClick={() => setTampilLogin(true)}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold transition hover:brightness-110"
                      style={{ background: "#1e3a5f", color: "#93c5fd", border: "1px solid #2d5a8e" }}>
                      Masuk Sekarang
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                      ☰ Riwayat Laporan Saya
                    </h2>
                    <button
                      onClick={fetchRiwayat}
                      disabled={loadingRiwayat}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:brightness-110 disabled:opacity-50"
                      style={{ background: "#0f172a", border: "1px solid #1e3a5f", color: "#93c5fd" }}>
                      {loadingRiwayat ? "Memuat…" : "🔄 Muat"}
                    </button>
                  </div>

                  {/* Konten */}
                  {loadingRiwayat ? (
                    <div className="flex justify-center py-12">
                      <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    </div>
                  ) : riwayatLaporan.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-3xl mb-3">📋</div>
                      <p className="text-sm text-gray-500">Belum ada laporan yang dikirim.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {riwayatLaporan.map((l) => {
                        const skor = l.skor_influenza ?? 0;
                        const keparahanLabel =
                          skor >= 75 ? "Kritis" :
                          skor >= 55 ? "Tinggi" :
                          skor >= 35 ? "Sedang" : "Rendah";
                        const keparahanWarna =
                          skor >= 75 ? "#ef4444" :
                          skor >= 55 ? "#f97316" :
                          skor >= 35 ? "#eab308" : "#22c55e";
                        const barWidth = Math.min(skor, 100);
                        return (
                          <div key={l.id}
                            className="rounded-xl p-4"
                            style={{ background: "#0d1627", border: "1px solid #1a2744" }}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-sm font-semibold text-gray-200">
                                📍 {l.nama_wilayah || "Lokasi tidak diketahui"}
                              </span>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {new Date(l.timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                              <span className="text-gray-500">Gejala: </span>
                              {(l.gejala || []).join(", ") || "—"}
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                                style={{ background: "#1a2744" }}>
                                <div className="h-full rounded-full transition-all"
                                  style={{ width: `${barWidth}%`, background: keparahanWarna }} />
                              </div>
                              <span className="text-xs font-bold flex-shrink-0"
                                style={{ color: keparahanWarna }}>
                                {keparahanLabel}
                              </span>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                Skor {skor}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "statistik" && (
            <div className="h-full overflow-y-auto">
              {/* Mobile: tampilkan DashboardStats langsung */}
              <div className="lg:hidden">
                <DashboardStats
                  key={`stat-mob-${refreshKey}`}
                  refreshKey={refreshKey}
                  onBukaAI={() => setTab("analisis")}
                />
              </div>

              {/* Desktop: kerangka risiko & tentang sistem */}
              <div className="hidden lg:block p-5 space-y-4">
                <h2 className="text-lg font-bold">Statistik Surveilans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Kerangka risiko */}
                  <div className="rounded-xl p-5"
                    style={{ background: "#0d1627", border: "1px solid #1a2744" }}>
                    <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">
                      Kerangka Tingkat Risiko
                    </h3>
                    <div className="space-y-2">
                      {[
                        { dot: "#22c55e", level: "Aman (Normal)",     urai: "0 kasus aktif" },
                        { dot: "#84cc16", level: "Waspada (Rendah)",  urai: "1–2 kasus"     },
                        { dot: "#f97316", level: "Siaga (Moderat)",   urai: "3–10 kasus"    },
                        { dot: "#ef4444", level: "Kritis (Tinggi)",   urai: "11+ kasus"     },
                      ].map((r) => (
                        <div key={r.level}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg"
                          style={{ background: "#111827" }}>
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: r.dot }} />
                          <span className="text-sm font-medium text-gray-200 flex-1">{r.level}</span>
                          <span className="text-xs text-gray-500">{r.urai}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tentang sistem */}
                  <div className="rounded-xl p-5"
                    style={{ background: "#0d1627", border: "1px solid #1a2744" }}>
                    <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">
                      Tentang Sistem
                    </h3>
                    <div className="space-y-3 text-xs text-gray-400">
                      <p>
                        <span className="text-gray-200 font-semibold">🦠 Pengumpulan Data</span><br />
                        Laporan gejala dengan koordinat GPS disimpan ke PostgreSQL secara real-time.
                      </p>
                      <p>
                        <span className="text-gray-200 font-semibold">📐 Skor Influenza</span><br />
                        Setiap laporan mendapat skor 0–100 berdasarkan bobot gejala klinis WHO.
                      </p>
                      <p>
                        <span className="text-gray-200 font-semibold">🤖 AI Berbasis Data</span><br />
                        Haversine filter mencari kasus terdekat, lalu konteks database dikirim ke LLM.
                      </p>
                      <p>
                        <span className="text-gray-200 font-semibold">🗺️ Pembaruan Peta</span><br />
                        Heatmap diperbarui otomatis setiap <strong className="text-gray-200">5 menit</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Panel Kanan — Stats (desktop only) ── */}
        <div className="hidden lg:flex flex-col w-[320px] xl:w-[360px] flex-shrink-0 overflow-y-auto"
          style={{ background: "#080d1a", borderLeft: "1px solid #1a2744" }}>
          <DashboardStats
            key={`stat-${refreshKey}`}
            refreshKey={refreshKey}
            onBukaAI={() => setTab("analisis")}
          />
        </div>
      </div>

      {/* ══ MODAL ═══════════════════════════════════════════════ */}
      {tampilForm && (
        <FormKuesioner
          lokasi={lokasi}
          namaLokasi={namaLokasi}
          onTutup={() => setTampilForm(false)}
          onSelesai={setelahLaporan}
        />
      )}
      {tampilLogin && (
        <LoginModal
          onTutup={() => setTampilLogin(false)}
          onBukaRegister={() => setTampilRegister(true)}
          onBukaLupaPassword={() => setTampilLupaPassword(true)}
          onSelesai={() => setTampilForm(true)}
        />
      )}
      {tampilRegister && (
        <RegisterModal
          onTutup={() => setTampilRegister(false)}
          onBukaMasuk={() => setTampilLogin(true)}
          onSelesai={() => setTampilForm(true)}
        />
      )}
      {tampilLupaPassword && (
        <LupaPasswordModal
          onTutup={() => setTampilLupaPassword(false)}
          onBukaLogin={() => setTampilLogin(true)}
        />
      )}
    </div>
  );
}
