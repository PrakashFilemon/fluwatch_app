import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import PetaHeatmap from "./components/PetaHeatmap";
import FormKuesioner from "./components/FormKuesioner";
import DashboardStats from "./components/DashboardStats";
import AnalisisAI from "./components/AnalisisAI";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import { useAuth } from "./contexts/AuthContext";

const TAB = [
  { id: "peta", icon: "▦", label: "Peta Heatmap" },
  { id: "analisis", icon: "◎", label: "Analisis AI" },
  { id: "statistik", icon: "↗", label: "Statistik" },
];

const WAKTU = ["24 Jam", "7 Hari", "30 Hari"];
const WAKTU_JAM = { "24 Jam": 24, "7 Hari": 168, "30 Hari": 720 };

export default function App() {
  const { pengguna, sudahLogin, isAdmin, logout } = useAuth();

  const [tab, setTab] = useState("peta");
  const [tampilForm, setTampilForm] = useState(false);
  const [tampilLogin, setTampilLogin] = useState(false);
  const [tampilRegister, setTampilRegister] = useState(false);
  const [tampilDropdown, setTampilDropdown] = useState(false);
  const [lokasi, setLokasi] = useState(null);
  const [namaLokasi, setNamaLokasi] = useState("LOKASI ANDA");
  const [statusGeo, setStatusGeo] = useState("menunggu");
  const [waktuAktif, setWaktuAktif] = useState("24 Jam");
  const [refreshKey, setRefreshKey] = useState(0);

  /* ── Geolokasi + reverse geocoding (Nominatim gratis) ── */
  const mintaLokasi = useCallback(() => {
    if (!navigator.geolocation) {
      setStatusGeo("tolak");
      return;
    }
    setStatusGeo("menunggu");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLokasi({ lat, lng });
        setStatusGeo("izin");
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "id" } },
          );
          const d = await r.json();
          const nama =
            d.address?.suburb ||
            d.address?.city_district ||
            d.address?.county ||
            d.address?.city ||
            "LOKASI ANDA";
          setNamaLokasi(
            nama.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase()),
          );
        } catch {
          setNamaLokasi("LOKASI ANDA");
        }
      },
      () => {
        setStatusGeo("tolak");
        toast.error("Akses lokasi ditolak.");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  useEffect(() => {
    mintaLokasi();
  }, [mintaLokasi]);

  const setelahLaporan = () => {
    setRefreshKey((k) => k + 1);
  };

  const bukaFormLaporan = () => {
    if (!sudahLogin) {
      setTampilLogin(true);
    } else {
      setTampilForm(true);
    }
  };

  const jendela = WAKTU_JAM[waktuAktif];

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "#080d1a", color: "#f1f5f9" }}
    >
      {/* ══ NAVBAR ══════════════════════════════════════════════ */}
      <header
        style={{ background: "#0a1020", borderBottom: "1px solid #1a2744" }}
        className="flex items-center justify-between px-5 py-2.5 flex-shrink-0 z-50"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}
          >
            🦠
          </div>
          <span className="font-bold text-base tracking-tight">
            FluWatch<span style={{ color: "#f97316" }}>.AI</span>
          </span>
        </div>

        {/* Lokasi dropdown */}
        <button
          onClick={mintaLokasi}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          style={{
            background: "#0f172a",
            border: "1px solid #1e3a5f",
            color: "#93c5fd",
          }}
        >
          <span style={{ color: "#ef4444" }}>📍</span>
          <span>{namaLokasi}, ID</span>
          <span style={{ color: "#475569" }}>▾</span>
        </button>

        {/* Time selectors */}
        <div
          className="flex items-center gap-1 rounded-lg p-1"
          style={{ background: "#0f172a" }}
        >
          {WAKTU.map((w) => (
            <button
              key={w}
              onClick={() => setWaktuAktif(w)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition"
              style={
                waktuAktif === w
                  ? { background: "#1e3a5f", color: "#93c5fd" }
                  : { color: "#475569" }
              }
            >
              {w}
            </button>
          ))}
        </div>

        {/* Laporan + User */}
        <div className="flex items-center gap-2">
          <button
            onClick={bukaFormLaporan}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition"
            style={{ background: "#dc2626", color: "#fff" }}
          >
            <span>⚠</span> Laporkan Gejala
          </button>

          {sudahLogin ? (
            /* Avatar dropdown */
            <div className="relative">
              <button
                onClick={() => setTampilDropdown((d) => !d)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition"
                style={{
                  background: "#111827",
                  border: "1px solid #1e3a5f",
                  color: "#93c5fd",
                }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ background: "#1e3a5f" }}
                >
                  {pengguna.username[0].toUpperCase()}
                </span>
                <span className="hidden sm:inline">{pengguna.username}</span>
                <span style={{ color: "#475569" }}>▾</span>
              </button>

              {tampilDropdown && (
                <div
                  className="absolute right-0 mt-1 w-44 rounded-xl py-1 z-50"
                  style={{ background: "#0d1627", border: "1px solid #1e3a5f" }}
                  onMouseLeave={() => setTampilDropdown(false)}
                >
                  {isAdmin && (
                    <a
                      href="/admin.html"
                      className="block px-4 py-2 text-xs font-medium transition hover:bg-blue-900/30"
                      style={{ color: "#93c5fd" }}
                    >
                      ⚙ Panel Admin
                    </a>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setTampilDropdown(false);
                      toast.success("Berhasil keluar.");
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium transition hover:bg-red-900/30"
                    style={{ color: "#ef4444" }}
                  >
                    ⏏ Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Tombol Masuk */
            <button
              onClick={() => setTampilLogin(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              style={{
                background: "#0f172a",
                border: "1px solid #1e3a5f",
                color: "#93c5fd",
              }}
            >
              Masuk
            </button>
          )}
        </div>
      </header>

      {/* ══ TAB BAR ═════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 px-5"
        style={{ background: "#0a1020", borderBottom: "1px solid #1a2744" }}
      >
        <div className="flex">
          {TAB.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition"
              style={
                tab === t.id
                  ? { borderColor: "#3b82f6", color: "#f1f5f9" }
                  : { borderColor: "transparent", color: "#475569" }
              }
            >
              <span style={{ fontSize: "12px" }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ KONTEN UTAMA — 2 PANEL ══════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Panel Kiri (Peta / AI / Statistik) ── */}
        <div className="flex-1 overflow-hidden relative">
          {tab === "peta" && (
            <PetaHeatmap
              key={`peta-${refreshKey}`}
              lokasi={lokasi}
              jendela={jendela}
              refreshKey={refreshKey}
              onBukaAI={() => setTab("analisis")}
              onLapor={bukaFormLaporan}
            />
          )}

          {tab === "analisis" && (
            <div className="h-full p-4">
              <AnalisisAI lokasi={lokasi} />
            </div>
          )}

          {tab === "statistik" && (
            <div className="h-full overflow-y-auto p-5 space-y-4">
              <h2 className="text-lg font-bold">Statistik Surveilans</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kerangka risiko */}
                <div
                  className="rounded-xl p-5"
                  style={{ background: "#0d1627", border: "1px solid #1a2744" }}
                >
                  <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">
                    Kerangka Tingkat Risiko
                  </h3>
                  <div className="space-y-2">
                    {[
                      {
                        dot: "#22c55e",
                        level: "Aman (Normal)",
                        urai: "0 kasus aktif",
                      },
                      {
                        dot: "#84cc16",
                        level: "Waspada (Rendah)",
                        urai: "1–2 kasus",
                      },
                      {
                        dot: "#f97316",
                        level: "Siaga (Moderat)",
                        urai: "3–10 kasus",
                      },
                      {
                        dot: "#ef4444",
                        level: "Kritis (Tinggi)",
                        urai: "11+ kasus",
                      },
                    ].map((r) => (
                      <div
                        key={r.level}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg"
                        style={{ background: "#111827" }}
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: r.dot }}
                        />
                        <span className="text-sm font-medium text-gray-200 w-40">
                          {r.level}
                        </span>
                        <span className="text-xs text-gray-500">{r.urai}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tentang sistem */}
                <div
                  className="rounded-xl p-5"
                  style={{ background: "#0d1627", border: "1px solid #1a2744" }}
                >
                  <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">
                    Tentang Sistem
                  </h3>
                  <div className="space-y-3 text-xs text-gray-400">
                    <p>
                      <span className="text-gray-200 font-semibold">
                        🦠 Pengumpulan Data
                      </span>
                      <br />
                      Laporan gejala dengan koordinat GPS disimpan ke PostgreSQL
                      secara real-time.
                    </p>
                    <p>
                      <span className="text-gray-200 font-semibold">
                        📐 Skor Influenza
                      </span>
                      <br />
                      Setiap laporan mendapat skor 0–100 berdasarkan bobot
                      gejala klinis WHO (demam=25, menggigil=15, dst).
                    </p>
                    <p>
                      <span className="text-gray-200 font-semibold">
                        🤖 AI Berbasis Data
                      </span>
                      <br />
                      Haversine filter mencari kasus terdekat, lalu konteks
                      database dikirim ke LLM untuk analisis lokal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Panel Kanan — Stats (selalu terlihat) ── */}
        <div
          className="w-[360px] flex-shrink-0 overflow-y-auto"
          style={{ background: "#080d1a", borderLeft: "1px solid #1a2744" }}
        >
          <DashboardStats
            key={`stat-${refreshKey}`}
            refreshKey={refreshKey}
            onBukaAI={() => setTab("analisis")}
          />
        </div>
      </div>

      {/* ══ MODAL FORM ══════════════════════════════════════════ */}
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
    </div>
  );
}
