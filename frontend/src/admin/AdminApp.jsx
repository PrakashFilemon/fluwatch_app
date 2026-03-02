import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import AdminSidebar from "./components/AdminSidebar";
import TabDashboard from "./components/TabDashboard";
import TabPengguna from "./components/TabPengguna";
import TabLaporan from "./components/TabLaporan";
import { IconLogout } from "./shared/adminUI";

const PAGE_TITLE = {
  dashboard: "Dashboard",
  pengguna: "Manajemen Pengguna",
  laporan: "Data Laporan",
};

const PAGE_DESC = {
  dashboard: "Ringkasan dan statistik sistem",
  pengguna: "Kelola akun, role, dan status pengguna",
  laporan: "Pantau laporan gejala yang masuk",
};

export default function AdminApp() {
  const { pengguna, isAdmin, loading, logout } = useAuth();
  const [view, setView] = useState("dashboard");
  const [expanded, setExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-[#1a2e2c]" style={{ background: "#D8E8E6" }}>
        <div className="w-10 h-10 rounded-full border-2 border-teal-100 border-t-teal-500 animate-spin" />
        <p className="text-sm text-slate-500">Memuat panel admin…</p>
      </div>
    );
  }

  if (!isAdmin) {
    window.location.href = "/";
    return null;
  }

  const handleNavigate = (id) => {
    setView(id);
    if (isMobile) setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen" style={{ background: "#D8E8E6" }}>
      {/* Mobile backdrop */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <AdminSidebar
        view={view}
        onNavigate={handleNavigate}
        expanded={isMobile ? true : expanded}
        onToggle={
          isMobile
            ? () => setMobileMenuOpen(false)
            : () => setExpanded((e) => !e)
        }
        mobileOpen={mobileMenuOpen}
        isMobile={isMobile}
        pengguna={pengguna}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-20 flex-shrink-0 bg-white border-b border-teal-100 shadow-[0_1px_4px_rgba(58,142,133,0.06)]">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex-shrink-0 w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-teal-100 bg-teal-50"
              >
                <span className="block w-4 h-0.5 rounded bg-teal-600" />
                <span className="block w-4 h-0.5 rounded bg-teal-600" />
                <span className="block w-3 h-0.5 rounded bg-teal-600" />
              </button>
            )}

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold truncate text-[#1a2e2c]">
                {PAGE_TITLE[view]}
              </h1>
              <p className="text-xs mt-0.5 hidden sm:block truncate text-slate-500">
                {PAGE_DESC[view]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="/"
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border border-teal-100 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
            >
              <span className="hidden sm:inline">←</span> Aplikasi
            </a>
            <button
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              <IconLogout />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-3 sm:p-6 overflow-auto">
          {view === "dashboard" && <TabDashboard />}

          {view === "pengguna" && (
            <div className="rounded-2xl p-4 sm:p-6 bg-white border border-teal-100 shadow-sm">
              <TabPengguna adminId={pengguna.id} />
            </div>
          )}

          {view === "laporan" && (
            <div className="rounded-2xl p-4 sm:p-6 bg-white border border-teal-100 shadow-sm">
              <TabLaporan />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
