import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { adminPengguna, adminUbahPengguna, adminHapusPengguna } from "../../services/api";
import { PER_HAL } from "../shared/adminHelpers";
import { Badge, Btn, Paginasi, EmptyState, SkeletonRow } from "../shared/adminUI";
import ModalKonfirmasi from "./ModalKonfirmasi";

export default function TabPengguna({ adminId }) {
  const [data,       setData]       = useState(null);
  const [halaman,    setHalaman]    = useState(1);
  const [cari,       setCari]       = useState("");
  const [cariAktif,  setCariAktif]  = useState("");
  const [loading,    setLoading]    = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(null);

  const jalankanCari = useCallback(() => {
    setCariAktif(cari.trim());
    setHalaman(1);
  }, [cari]);

  const handleChange = (e) => {
    const val = e.target.value;
    setCari(val);
    if (val === "") { setCariAktif(""); setHalaman(1); }
  };

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminPengguna({ halaman, per_halaman: PER_HAL, cari: cariAktif });
      setData(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [halaman, cariAktif]);

  useEffect(() => { muat(); }, [muat]);

  const ubahRole = async (id, role) => {
    try {
      await adminUbahPengguna(id, { role });
      toast.success("Role berhasil diperbarui");
      muat();
    } catch (err) { toast.error(err.message); }
  };

  const toggleAktif = async (id, is_active) => {
    try {
      await adminUbahPengguna(id, { is_active: !is_active });
      toast.success(is_active ? "Akun dinonaktifkan" : "Akun diaktifkan");
      muat();
    } catch (err) { toast.error(err.message); }
  };

  const hapus = (id, username) => {
    setKonfirmasi({
      judul: "Hapus Pengguna",
      pesan: `Akun "${username}" akan dihapus permanen beserta seluruh datanya.`,
      onOk: async () => {
        setKonfirmasi(null);
        try {
          await adminHapusPengguna(id);
          toast.success("Pengguna berhasil dihapus");
          muat();
        } catch (err) { toast.error(err.message); }
      },
    });
  };

  return (
    <>
      {konfirmasi && (
        <ModalKonfirmasi
          judul={konfirmasi.judul}
          pesan={konfirmasi.pesan}
          onOk={konfirmasi.onOk}
          onBatal={() => setKonfirmasi(null)}
        />
      )}
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center flex-wrap">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 sm:max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#3A8E85" }}>🔍</span>
              <input
                value={cari}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && jalankanCari()}
                placeholder="Cari username atau email..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition"
                style={{
                  background: "#f8fffe",
                  color: "#374151",
                  border: `1px solid ${cariAktif ? "#3A8E85" : "rgba(58,142,133,0.25)"}`,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3A8E85")}
                onBlur={(e) => (e.target.style.borderColor = cariAktif ? "#3A8E85" : "rgba(58,142,133,0.25)")}
              />
            </div>
            <Btn onClick={jalankanCari} variant="default">Cari</Btn>
          </div>
          <div className="flex items-center gap-3">
            <Btn onClick={muat} variant="ghost">Muat Ulang</Btn>
            {data && (
              <span className="text-sm font-semibold" style={{ color: "#64748b" }}>
                {cariAktif ? `${data.total} hasil untuk "${cariAktif}"` : `${data.total} pengguna`}
              </span>
            )}
          </div>
        </div>

        {/* Tabel */}
        <div
          className="rounded-2xl overflow-hidden border"
          style={{ borderColor: "rgba(58,142,133,0.15)", boxShadow: "0 2px 16px rgba(58,142,133,0.08)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 640 }}>
              <thead>
                <tr style={{ background: "#f0faf9" }}>
                  {[
                    { label: "Pengguna",  cls: "" },
                    { label: "Email",     cls: "hidden sm:table-cell" },
                    { label: "Role",      cls: "" },
                    { label: "Status",    cls: "" },
                    { label: "Bergabung", cls: "hidden md:table-cell" },
                    { label: "Aksi",      cls: "" },
                  ].map(({ label, cls }) => (
                    <th
                      key={label}
                      className={`px-3 sm:px-5 py-4 text-left text-xs font-bold uppercase tracking-wider ${cls}`}
                      style={{ color: "#64748b" }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRow cols={6} />
                ) : !data?.pengguna?.length ? (
                  <EmptyState icon="👤" teks="Tidak ada pengguna ditemukan" />
                ) : (
                  data.pengguna.map((p, i) => (
                    <tr
                      key={p.id}
                      className="transition-colors"
                      style={{ borderTop: "1px solid rgba(58,142,133,0.08)", background: i % 2 === 0 ? "#ffffff" : "rgba(58,142,133,0.02)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(58,142,133,0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#ffffff" : "rgba(58,142,133,0.02)")}
                    >
                      {/* Avatar + username */}
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={
                              p.role === "admin"
                                ? { background: "rgba(58,142,133,0.15)", color: "#006B5F" }
                                : { background: "#f1f5f9", color: "#475569" }
                            }
                          >
                            {p.username[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "#374151" }}>{p.username}</p>
                            {p.id === adminId && <p className="text-xs text-orange-500">Anda</p>}
                          </div>
                        </div>
                      </td>

                      {/* Email — hidden on mobile */}
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm hidden sm:table-cell" style={{ color: "#64748b" }}>
                        <span className="truncate block max-w-[160px]">{p.email}</span>
                      </td>

                      {/* Role */}
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <Badge
                          bg={p.role === "admin" ? "rgba(58,142,133,0.12)" : "rgba(100,116,139,0.10)"}
                          text={p.role === "admin" ? "#006B5F" : "#475569"}
                        >
                          {p.role === "admin" ? "⭐ Admin" : "Pengguna"}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <Badge
                          bg={p.is_active ? "#f0fdf4" : "#fff1f2"}
                          text={p.is_active ? "#16a34a" : "#be123c"}
                        >
                          {p.is_active ? "● Aktif" : "○ Nonaktif"}
                        </Badge>
                      </td>

                      {/* Bergabung — hidden on mobile */}
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm hidden md:table-cell" style={{ color: "#64748b" }}>
                        {p.created_at
                          ? new Date(p.created_at).toLocaleDateString("id-ID", {
                              day: "numeric", month: "short", year: "numeric",
                            })
                          : "—"}
                      </td>

                      {/* Aksi */}
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        {p.id !== adminId ? (
                          <div className="flex gap-1.5 flex-wrap">
                            <Btn
                              onClick={() => ubahRole(p.id, p.role === "admin" ? "pengguna" : "admin")}
                              variant={p.role === "admin" ? "warning" : "default"}
                            >
                              {p.role === "admin" ? "Turunkan" : "Admin"}
                            </Btn>
                            <Btn onClick={() => toggleAktif(p.id, p.is_active)} variant={p.is_active ? "warning" : "success"}>
                              {p.is_active ? "Nonaktif" : "Aktifkan"}
                            </Btn>
                            <Btn onClick={() => hapus(p.id, p.username)} variant="danger">Hapus</Btn>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
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
