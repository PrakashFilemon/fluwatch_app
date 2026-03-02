/**
 * PetaHeatmap — Peta Leaflet yang diperkaya dengan:
 *   • Layer heatmap (leaflet.heat) berbobot skor influenza
 *   • CircleMarker individual berwarna per tingkat keparahan
 *   • Pulse ring untuk laporan < 2 jam (terbaru)
 *   • Auto-fit bounds saat data pertama kali dimuat
 *   • Toggle tampilan: Panas | Titik | Keduanya
 *   • Zoom control custom bergaya gelap
 *   • Legenda gradient bar
 *   • Popup detail per laporan
 */
import { useEffect, useRef, useCallback, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ambilDataPeta, ambilStatistik } from "../../services/api";

/* ── Warna marker berdasarkan keparahan ───────────────── */
function warnaKeparahan(k) {
  if (k >= 9) return "#dc2626"; // merah tua  — sangat parah
  if (k >= 7) return "#ef4444"; // merah
  if (k >= 5) return "#f97316"; // oranye
  if (k >= 3) return "#eab308"; // kuning
  return "#22c55e"; // hijau      — ringan
}

function labelKeparahan(k) {
  if (k >= 9) return "Sangat Berat";
  if (k >= 7) return "Berat";
  if (k >= 5) return "Sedang";
  if (k >= 3) return "Ringan";
  return "Sangat Ringan";
}

/* ── Format waktu relatif ─────────────────────────────── */
function waktuRelatif(isoStr) {
  const delta = (Date.now() - new Date(isoStr)) / 60000; // menit
  if (delta < 60) return `${Math.floor(delta)} menit lalu`;
  if (delta < 1440) return `${Math.floor(delta / 60)} jam lalu`;
  return `${Math.floor(delta / 1440)} hari lalu`;
}

const LABEL_GEJALA = {
  demam: "Demam",
  batuk: "Batuk",
  sakit_tenggorokan: "Sakit Tenggorokan",
  pilek: "Pilek",
  nyeri_otot: "Nyeri Otot",
  sakit_kepala: "Sakit Kepala",
  kelelahan: "Kelelahan",
  menggigil: "Menggigil",
  mual_muntah: "Mual/Muntah",
  sesak_napas: "Sesak Napas",
};

/* ── Layer Heatmap ────────────────────────────────────── */
function LayerHeatmap({ titik, aktif }) {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    if (!aktif) {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
      return;
    }
    import("leaflet.heat").then(() => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
      if (!titik?.length) return;
      heatRef.current = L.heatLayer(
        titik.map((t) => [t.lat, t.lng, Math.max(t.bobot, 0.15)]),
        {
          radius: 35,
          blur: 25,
          maxZoom: 16,
          max: 1.0,
          minOpacity: 0.45,
          gradient: {
            0.0: "#1d4ed8", // biru   — sangat rendah
            0.2: "#22c55e", // hijau  — rendah
            0.45: "#facc15", // kuning — sedang
            0.7: "#f97316", // oranye — tinggi
            1.0: "#ef4444", // merah  — kritis
          },
        },
      ).addTo(map);
    });
    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
    };
  }, [map, titik, aktif]);
  return null;
}

/* ── Auto-fit bounds ──────────────────────────────────── */
function AutoFit({ titik, sudahFit, setSudahFit }) {
  const map = useMap();
  useEffect(() => {
    if (sudahFit || !titik?.length) return;
    const bounds = L.latLngBounds(titik.map((t) => [t.lat, t.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true });
      setSudahFit(true);
    }
  }, [map, titik, sudahFit, setSudahFit]);
  return null;
}

/* ── Zoom control bergaya gelap ───────────────────────── */
function ZoomControl() {
  const map = useMap();
  return (
    <div
      className="absolute z-[999] flex flex-col gap-1"
      style={{ bottom: "80px", right: "12px" }}
    >
      {[
        { label: "+", aksi: () => map.zoomIn(), title: "Perbesar" },
        { label: "−", aksi: () => map.zoomOut(), title: "Perkecil" },
      ].map((b) => (
        <button
          key={b.label}
          onClick={b.aksi}
          title={b.title}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold shadow-lg transition hover:scale-105 active:scale-95"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(58,142,133,0.25)",
            color: "#3A8E85",
          }}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

/* ── Pusat ke lokasi pengguna ─────────────────────────── */
function TombolPusat({ posisi }) {
  const map = useMap();
  if (!posisi) return null;
  return (
    <button
      onClick={() => map.setView(posisi, 14, { animate: true })}
      title="Lokasi Saya"
      className="absolute z-[999] w-9 h-9 rounded-lg flex items-center justify-center shadow-lg transition hover:scale-105"
      style={{
        bottom: "12px",
        right: "12px",
        background: "#ffffff",
        border: "1px solid rgba(58,142,133,0.25)",
        color: "#3A8E85",
      }}
    >
      ◎
    </button>
  );
}

/* ── Marker lokasi pengguna ───────────────────────────── */
function MarkerPengguna({ posisi }) {
  if (!posisi) return null;
  return (
    <CircleMarker
      center={posisi}
      radius={8}
      pathOptions={{
        color: "#ffffff",
        fillColor: "#3A8E85",
        fillOpacity: 1,
        weight: 3,
      }}
    >
      <Popup>
        <div style={{ minWidth: "120px" }}>
          <p style={{ fontWeight: 700, marginBottom: 2 }}>📍 Lokasi Anda</p>
          <p style={{ fontSize: 11, color: "#64748b" }}>
            {posisi[0].toFixed(5)}, {posisi[1].toFixed(5)}
          </p>
        </div>
      </Popup>
    </CircleMarker>
  );
}

/* ── Layer Marker individual ──────────────────────────── */
function LayerMarkers({ markers, aktif }) {
  if (!aktif || !markers?.length) return null;

  return markers.map((m, i) => {
    const warna = warnaKeparahan(m.keparahan);
    const radius = Math.max(5, Math.min(m.keparahan + 2, 12));
    const gejalaStr =
      (m.gejala || []).map((g) => LABEL_GEJALA[g] || g).join(", ") ||
      "Tidak ada data";

    return (
      <CircleMarker
        key={i}
        center={[m.lat, m.lng]}
        radius={radius}
        pathOptions={{
          color: warna,
          fillColor: warna,
          fillOpacity: m.baru ? 0.95 : 0.65,
          weight: m.baru ? 2.5 : 1.5,
        }}
      >
        <Popup maxWidth={240}>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {/* Header */}
            <div
              style={{
                background: warna + "22",
                border: `1px solid ${warna}55`,
                borderRadius: 8,
                padding: "6px 10px",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: warna,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 700, color: "#111827" }}>
                {labelKeparahan(m.keparahan)}
              </span>
              {m.baru && (
                <span
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: 4,
                  }}
                >
                  BARU
                </span>
              )}
            </div>

            {/* Detail */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              {[
                ["📍 Wilayah", m.wilayah],
                ["⚡ Keparahan", `${m.keparahan}/10`],
                ["🎯 Skor Risiko", `${m.skor}/100`],
                ["👤 Usia", m.usia],
                ["🤒 Gejala", gejalaStr],
                ["🕐 Dilaporkan", waktuRelatif(m.timestamp)],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td
                    style={{
                      color: "#64748b",
                      paddingRight: 8,
                      paddingBottom: 3,
                      whiteSpace: "nowrap",
                      fontSize: 11,
                    }}
                  >
                    {k}
                  </td>
                  <td
                    style={{ color: "#111827", fontWeight: 500, fontSize: 11 }}
                  >
                    {v}
                  </td>
                </tr>
              ))}
            </table>
          </div>
        </Popup>
      </CircleMarker>
    );
  });
}

/* ══ Komponen utama ═══════════════════════════════════════ */
export default function PetaHeatmap({
  lokasi,
  jendela = 48,
  refreshKey = 0,
  onBukaAI,
  onLapor,
}) {
  const [titik, setTitik] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [jumlah, setJumlah] = useState(0);
  const [stat, setStat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sudahFit, setSudahFit] = useState(false);
  const [layer, setLayer] = useState("keduanya"); // "panas" | "titik" | "keduanya"
  const [legendExpanded, setLegendExpanded] = useState(false);

  const pusatPeta = lokasi ? [lokasi.lat, lokasi.lng] : [-6.2615, 106.8106];

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const [dataPeta, dataStat] = await Promise.all([
        ambilDataPeta({ jam: jendela }),
        ambilStatistik(),
      ]);
      setTitik(dataPeta.titik || []);
      setMarkers(dataPeta.markers || []);
      setJumlah(dataPeta.jumlah || 0);
      setStat(dataStat);
      setSudahFit(false); // reset agar auto-fit jalan saat data baru
    } catch {
      setTitik([]);
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  }, [jendela, refreshKey]);

  useEffect(() => {
    muat();
    const id = setInterval(muat, 300_000); // refresh tiap 5 menit
    return () => clearInterval(id);
  }, [muat]);

  /* Hitung status & indeks dari data */
  const kasus = stat?.kasus_48jam ?? 0;
  const indeks = stat?.indeks_risiko ?? 0;
  const statusTeks =
    kasus >= 25
      ? "WABAH INFLUENZA"
      : kasus >= 11
        ? "WASPADA FLU INFLUENZA"
        : kasus >= 3
          ? "AKTIVITAS MENINGKAT"
          : "NORMAL";
  const { teks: indeksTeks, warna: indeksWarna } =
    indeks >= 7.5
      ? { teks: "KRITIS", warna: "#ef4444" }
      : indeks >= 5.5
        ? { teks: "TINGGI", warna: "#f97316" }
        : indeks >= 3
          ? { teks: "SEDANG", warna: "#eab308" }
          : { teks: "RENDAH", warna: "#22c55e" };

  const jumlahBaru = markers.filter((m) => m.baru).length;

  return (
    <div className="relative w-full h-full">
      {/* ════ OVERLAY ATAS — Status + Kontrol Layer (unified card) ════ */}
      <div className="absolute top-3 left-3 right-3 z-[9]">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: "rgba(216,232,230,0.92)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(58,142,133,0.25)",
            boxShadow: "0 2px 16px rgba(58,142,133,0.12)",
          }}
        >
          {/* Dot indikator */}
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
            style={{ background: indeksWarna, boxShadow: `0 0 6px ${indeksWarna}` }}
          />

          {/* Status teks */}
          <div className="flex-1 min-w-0 pointer-events-none">
            <p
              className="hidden sm:block text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5"
              style={{ color: "#5A8A84" }}
            >
              Status Wilayah
            </p>
            <p
              className="text-xs sm:text-sm font-bold truncate leading-tight"
              style={{ color: "#1a2e2c" }}
            >
              {statusTeks}
            </p>
          </div>

          {/* Divider */}
          <div
            className="w-px self-stretch flex-shrink-0"
            style={{ background: "rgba(58,142,133,0.25)" }}
          />

          {/* Indeks risiko */}
          <div className="flex-shrink-0 text-right pointer-events-none">
            <p
              className="hidden sm:block text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5"
              style={{ color: "#5A8A84" }}
            >
              Indeks Risiko
            </p>
            <p
              className="text-xs sm:text-sm font-bold leading-tight"
              style={{ color: indeksWarna }}
            >
              {indeksTeks}
              <span className="text-[10px] font-normal ml-1" style={{ color: "#94a3b8" }}>
                {indeks}/10
              </span>
            </p>
          </div>

          {/* Divider */}
          <div
            className="w-px self-stretch flex-shrink-0"
            style={{ background: "rgba(58,142,133,0.25)" }}
          />

          {/* Toggle Layer */}
          <div className="flex gap-0.5 flex-shrink-0">
            {[
              { id: "panas", label: "🔥", title: "Heatmap saja" },
              { id: "keduanya", label: "◉", title: "Heatmap + Titik" },
              { id: "titik", label: "⬤", title: "Titik saja" },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => setLayer(l.id)}
                title={l.title}
                className="w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all"
                style={
                  layer === l.id
                    ? {
                        background: "#3A8E85",
                        color: "#fff",
                        boxShadow: "0 1px 4px rgba(58,142,133,0.35)",
                      }
                    : {
                        background: "rgba(58,142,133,0.10)",
                        color: "#374151",
                      }
                }
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════ LEGENDA — Kiri bawah (collapsible) ════ */}
      {legendExpanded ? (
        <div
          className="absolute z-[999] rounded-xl overflow-hidden"
          style={{
            bottom: 12,
            left: 12,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(58,142,133,0.15)",
            boxShadow: "0 2px 12px rgba(58,142,133,0.10)",
            minWidth: 160,
          }}
        >
          <div className="px-3 pt-2.5 pb-1">
            {/* Header dengan tombol tutup */}
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#64748b" }}
              >
                Legenda Risiko
              </p>
              <button
                onClick={() => setLegendExpanded(false)}
                className="text-xs leading-none rounded px-1 py-0.5 transition hover:bg-teal-50"
                style={{ color: "#64748b" }}
                title="Sembunyikan legenda"
              >
                ✕
              </button>
            </div>

            {/* Gradient bar */}
            <div className="rounded overflow-hidden mb-2" style={{ height: 8 }}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(90deg, #22c55e, #facc15, #f97316, #ef4444)",
                }}
              />
            </div>
            <div
              className="flex justify-between text-xs mb-2"
              style={{ color: "#64748b" }}
            >
              <span>Aman</span>
              <span>Sedang</span>
              <span>Kritis</span>
            </div>

            {/* Item legenda */}
            {[
              { warna: "#ef4444", label: "Kritis  (≥ 9)" },
              { warna: "#f97316", label: "Tinggi  (7–8)" },
              { warna: "#eab308", label: "Sedang  (5–6)" },
              { warna: "#22c55e", label: "Rendah  (≤ 4)" },
            ].map(({ warna, label }) => (
              <div key={label} className="flex items-center gap-2 mb-1">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: warna, boxShadow: `0 0 4px ${warna}88` }}
                />
                <span className="text-xs" style={{ color: "#374151" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Counter */}
          <div
            className="px-3 py-2 mt-1"
            style={{ borderTop: "1px solid rgba(58,142,133,0.12)" }}
          >
            <div className="flex justify-between text-xs">
              <span style={{ color: "#64748b" }}>Total laporan</span>
              <span className="font-bold" style={{ color: "#1a2e2c" }}>
                {jumlah}
              </span>
            </div>
            {jumlahBaru > 0 && (
              <div className="flex justify-between text-xs mt-0.5">
                <span style={{ color: "#64748b" }}>Terbaru (&lt;2j)</span>
                <span className="font-bold" style={{ color: "#ef4444" }}>
                  {jumlahBaru} baru
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs mt-0.5">
              <span style={{ color: "#64748b" }}>Jendela waktu</span>
              <span className="font-bold" style={{ color: "#374151" }}>
                {jendela}h
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 mt-2 pt-2"
              style={{ borderTop: "1px solid rgba(58,142,133,0.10)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                style={{ background: "#22c55e" }}
              />
              <span className="text-xs" style={{ color: "#64748b" }}>
                Auto 5 mnt
              </span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setLegendExpanded(true)}
          className="absolute z-[999] flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
          style={{
            bottom: 12,
            left: 12,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(58,142,133,0.15)",
            boxShadow: "0 2px 12px rgba(58,142,133,0.08)",
            color: "#64748b",
          }}
          title="Tampilkan legenda"
        >
          📊 Legenda ▾
        </button>
      )}

      {/* ════ FAB — Kanan bawah ════ */}
      <div
        className="absolute z-[999] flex flex-col gap-2"
        style={{ bottom: 130, right: 12 }}
      >
        <button
          onClick={onLapor}
          title="Laporkan Gejala"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-xl transition hover:scale-110 active:scale-95"
          style={{
            background: "#3A8E85",
            color: "#fff",
            boxShadow: "0 4px 15px rgba(58,142,133,0.35)",
          }}
        >
          +
        </button>
        <button
          onClick={onBukaAI}
          title="Analisis AI"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-base shadow-xl transition hover:scale-110 active:scale-95"
          style={{
            background: "rgba(58,142,133,0.10)",
            border: "1px solid rgba(58,142,133,0.25)",
            color: "#3A8E85",
            boxShadow: "0 4px 15px rgba(58,142,133,0.15)",
            backdropFilter: "blur(4px)",
          }}
        >
          🤖
        </button>
      </div>

      {/* ════ Loading overlay ════ */}
      {loading && (
        <div
          className="absolute inset-0 z-[998] flex items-center justify-center"
          style={{
            background: "rgba(216,232,230,0.75)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(58,142,133,0.15)",
              boxShadow: "0 2px 16px rgba(58,142,133,0.10)",
            }}
          >
            <div
              className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderColor: "rgba(58,142,133,0.20)",
                borderTopColor: "#3A8E85",
              }}
            />
            <span className="text-sm" style={{ color: "#374151" }}>
              Memuat data peta...
            </span>
          </div>
        </div>
      )}

      {/* ════ PETA LEAFLET ════ */}
      <MapContainer
        center={pusatPeta}
        zoom={10}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        {/* Tile layer — CartoDB Positron (light) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          maxZoom={19}
        />

        {/* Heatmap layer */}
        <LayerHeatmap
          titik={titik}
          aktif={layer === "panas" || layer === "keduanya"}
        />

        {/* Marker individual */}
        <LayerMarkers
          markers={markers}
          aktif={layer === "titik" || layer === "keduanya"}
        />

        {/* Marker lokasi pengguna */}
        <MarkerPengguna posisi={lokasi ? [lokasi.lat, lokasi.lng] : null} />

        {/* Auto-fit bounds */}
        <AutoFit titik={titik} sudahFit={sudahFit} setSudahFit={setSudahFit} />

        {/* Zoom + center controls */}
        <ZoomControl />
        <TombolPusat posisi={lokasi ? [lokasi.lat, lokasi.lng] : null} />
      </MapContainer>
    </div>
  );
}
