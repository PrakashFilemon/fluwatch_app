import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { adminLaporan, adminHapusLaporan } from "../../services/api";
import { PER_HAL, skorWarna, skorLabel } from "../shared/adminHelpers";
import { Badge, Btn, Paginasi, EmptyState, SkeletonRow } from "../shared/adminUI";
import ModalKonfirmasi from "./ModalKonfirmasi";
import ModalDetailLaporan from "./ModalDetailLaporan";

const KELOMPOK_USIA_OPTIONS = [
  { value: "",        label: "Semua Usia" },
  { value: "anak",    label: "Anak" },
  { value: "remaja",  label: "Remaja" },
  { value: "dewasa",  label: "Dewasa" },
  { value: "lansia",  label: "Lansia" },
];

function FilterSelect({ icon, value, onChange, children }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl border"
      style={{
        background: "#f8fffe",
        borderColor: value ? "#3A8E85" : "rgba(58,142,133,0.25)",
      }}
    >
      <span className="text-sm flex-shrink-0">{icon}</span>
      <select value={value} onChange={onChange} className="text-sm outline-none bg-transparent" style={{ color: "#374151" }}>
        {children}
      </select>
    </div>
  );
}

export default function TabLaporan() {
  const [data,          setData]          = useState(null);
  const [halaman,       setHalaman]       = useState(1);
  const [jam,           setJam]           = useState("");
  const [wilayah,       setWilayah]       = useState("");
  const [wilayahAktif,  setWilayahAktif]  = useState("");
  const [kelompokUsia,  setKelompokUsia]  = useState("");
  const [loading,       setLoading]       = useState(false);
  const [detailLaporan, setDetailLaporan] = useState(null);
  const [konfirmasi,    setKonfirmasi]    = useState(null);

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const params = { halaman, per_halaman: PER_HAL };
      if (jam)          params.jam           = jam;
      if (wilayahAktif) params.wilayah       = wilayahAktif;
      if (kelompokUsia) params.kelompok_usia = kelompokUsia;
      const res = await adminLaporan(params);
      setData(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [halaman, jam, wilayahAktif, kelompokUsia]);

  const jalankanCariWilayah = useCallback(() => {
    setWilayahAktif(wilayah.trim());
    setHalaman(1);
  }, [wilayah]);

  const handleWilayahChange = (e) => {
    const val = e.target.value;
    setWilayah(val);
    if (val === "") { setWilayahAktif(""); setHalaman(1); }
  };

  useEffect(() => { muat(); }, [muat]);

  const hapus = (id) => {
    setKonfirmasi({
      judul: "Hapus Laporan",
      pesan: "Data laporan gejala ini akan dihapus permanen dari sistem.",
      onOk: async () => {
        setKonfirmasi(null);
        try {
          await adminHapusLaporan(id);
          toast.success("Laporan berhasil dihapus");
          setDetailLaporan(null);
          muat();
        } catch (err) { toast.error(err.message); }
      },
    });
  };

  const adaFilter = wilayahAktif || kelompokUsia || jam;

  return (
    <>
      {konfirmasi && (
        <ModalKonfirmasi judul={konfirmasi.judul} pesan={konfirmasi.pesan} onOk={konfirmasi.onOk} onBatal={() => setKonfirmasi(null)} />
      )}
      {detailLaporan && (
        <ModalDetailLaporan laporan={detailLaporan} onTutup={() => setDetailLaporan(null)} onHapus={hapus} />
      )}

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-end flex-wrap">
          {/* Cari Wilayah */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>Wilayah</label>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:flex-none">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#3A8E85" }}>📍</span>
                <input
                  value={wilayah}
                  onChange={handleWilayahChange}
                  onKeyDown={(e) => e.key === "Enter" && jalankanCariWilayah()}
                  placeholder="Cari nama wilayah..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition sm:w-48"
                  style={{
                    background: "#f8fffe",
                    color: "#374151",
                    border: `1px solid ${wilayahAktif ? "#3A8E85" : "rgba(58,142,133,0.25)"}`,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#3A8E85")}
                  onBlur={(e) => (e.target.style.borderColor = wilayahAktif ? "#3A8E85" : "rgba(58,142,133,0.25)")}
                />
              </div>
              <Btn onClick={jalankanCariWilayah} variant="default">Cari</Btn>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3 flex-wrap items-end">
            {/* Filter Kelompok Usia */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>Kelompok Usia</label>
              <FilterSelect icon="👤" value={kelompokUsia} onChange={(e) => { setKelompokUsia(e.target.value); setHalaman(1); }}>
                {KELOMPOK_USIA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </FilterSelect>
            </div>

            {/* Filter Waktu */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>Waktu</label>
              <FilterSelect icon="🕐" value={jam} onChange={(e) => { setJam(e.target.value); setHalaman(1); }}>
                <option value="">Semua Waktu</option>
                <option value="24">24 Jam Terakhir</option>
                <option value="48">48 Jam Terakhir</option>
                <option value="168">7 Hari Terakhir</option>
              </FilterSelect>
            </div>

            {/* Aksi */}
            <div className="flex items-center gap-2 pb-0.5">
              <Btn onClick={muat} variant="ghost">Muat Ulang</Btn>
              {adaFilter && (
                <Btn
                  onClick={() => {
                    setWilayah(""); setWilayahAktif("");
                    setKelompokUsia(""); setJam(""); setHalaman(1);
                  }}
                  variant="ghost"
                >
                  ✕ Reset
                </Btn>
              )}
              {data && (
                <span className="text-sm font-semibold" style={{ color: "#64748b" }}>{data.total} laporan</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabel */}
        <div
          className="rounded-2xl overflow-hidden border"
          style={{ borderColor: "rgba(58,142,133,0.15)", boxShadow: "0 2px 16px rgba(58,142,133,0.08)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 600 }}>
              <thead>
                <tr style={{ background: "#f0faf9" }}>
                  {[
                    { label: "Wilayah",       cls: "" },
                    { label: "Gejala Utama",  cls: "hidden md:table-cell" },
                    { label: "Skor",          cls: "" },
                    { label: "Keparahan",     cls: "hidden sm:table-cell" },
                    { label: "Kelompok Usia", cls: "hidden sm:table-cell" },
                    { label: "Waktu",         cls: "" },
                    { label: "Aksi",          cls: "" },
                  ].map(({ label, cls }) => (
                    <th key={label} className={`px-3 sm:px-5 py-4 text-left text-xs font-bold uppercase tracking-wider ${cls}`} style={{ color: "#64748b" }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRow cols={7} />
                ) : !data?.laporan?.length ? (
                  <EmptyState icon="📋" teks="Tidak ada laporan ditemukan" />
                ) : (
                  data.laporan.map((r, i) => {
                    const warna = skorWarna(r.skor_influenza);
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setDetailLaporan(r)}
                        className="cursor-pointer transition-colors"
                        style={{ borderTop: "1px solid rgba(58,142,133,0.08)", background: i % 2 === 0 ? "#ffffff" : "rgba(58,142,133,0.02)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(58,142,133,0.04)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#ffffff" : "rgba(58,142,133,0.02)")}
                      >
                        {/* Wilayah */}
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          <p className="text-sm font-semibold" style={{ color: "#374151" }}>{r.nama_wilayah || "—"}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                            {r.user_id ? `ID: ${r.user_id.slice(0, 8)}…` : "Anonim"}
                          </p>
                        </td>

                        {/* Gejala — hidden mobile */}
                        <td className="px-3 sm:px-5 py-3 sm:py-4 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {r.gejala?.slice(0, 2).map((g) => (
                              <span key={g} className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: "rgba(58,142,133,0.08)", color: "#374151" }}>
                                {g.replace(/_/g, " ")}
                              </span>
                            ))}
                            {r.gejala?.length > 2 && (
                              <span className="px-2 py-0.5 rounded text-xs" style={{ color: "#94a3b8" }}>+{r.gejala.length - 2}</span>
                            )}
                          </div>
                        </td>

                        {/* Skor */}
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-base font-bold" style={{ color: warna.text }}>{r.skor_influenza}</span>
                            <Badge bg={warna.bg} text={warna.text}>{skorLabel(r.skor_influenza)}</Badge>
                          </div>
                        </td>

                        {/* Keparahan — hidden mobile */}
                        <td className="px-3 sm:px-5 py-3 sm:py-4 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 10 }).map((_, idx) => (
                                <div
                                  key={idx}
                                  className="w-1.5 h-3 rounded-sm"
                                  style={{ background: idx < r.tingkat_keparahan ? warna.text : "rgba(58,142,133,0.12)" }}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-bold ml-1" style={{ color: "#94a3b8" }}>{r.tingkat_keparahan}/10</span>
                          </div>
                        </td>

                        {/* Kelompok Usia — hidden mobile */}
                        <td className="px-3 sm:px-5 py-3 sm:py-4 hidden sm:table-cell">
                          <span className="text-sm capitalize" style={{ color: "#64748b" }}>{r.kelompok_usia || "—"}</span>
                        </td>

                        {/* Waktu */}
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          <p className="text-sm" style={{ color: "#374151" }}>
                            {r.timestamp ? new Date(r.timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                            {r.timestamp ? new Date(r.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
                          </p>
                        </td>

                        {/* Aksi */}
                        <td className="px-3 sm:px-5 py-3 sm:py-4" onClick={(e) => e.stopPropagation()}>
                          <Btn onClick={() => hapus(r.id)} variant="danger">Hapus</Btn>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {data && data.total > 0 && (
          <Paginasi
            halaman={halaman}
            total={data.total}
            onSebelum={() => setHalaman((h) => h - 1)}
            onBerikut={() => setHalaman((h) => h + 1)}
          />
        )}
      </div>
    </>
  );
}
