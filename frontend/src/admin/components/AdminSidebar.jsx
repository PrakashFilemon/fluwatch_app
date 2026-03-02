import { IconHome, IconUsers, IconClipboard } from "../shared/adminUI";

const NAV_ITEMS = [
  { id: "dashboard", Icon: IconHome, label: "Dashboard" },
  { id: "pengguna", Icon: IconUsers, label: "Data Pengguna" },
  { id: "laporan", Icon: IconClipboard, label: "Data Laporan" },
];

// Chevron icon — points left when expanded, right when collapsed
function IconChevron({ expanded }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: "transform 0.2s ease",
        transform: expanded ? "rotate(0deg)" : "rotate(180deg)",
      }}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export default function AdminSidebar({
  view,
  onNavigate,
  expanded,
  onToggle,
  mobileOpen,
  isMobile,
  pengguna,
}) {
  if (isMobile && !mobileOpen) return null;

  const showLabel = expanded || isMobile;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-30" onClick={onToggle} />
      )}

      <aside
        className="relative flex flex-col flex-shrink-0 bg-white border-r border-gray-100"
        style={{
          width: isMobile ? 240 : expanded ? 240 : 72,
          transition: isMobile ? "none" : "width 0.2s ease",
          position: isMobile ? "fixed" : "sticky",
          top: 0,
          left: 0,
          height: "100dvh",
          zIndex: 40,
          overflow: "visible",
          boxShadow: "2px 0 8px 0 rgba(0,0,0,0.04)",
        }}
      >
        {/* ── Desktop toggle button — floats on the right edge ── */}
        {!isMobile && (
          <button
            onClick={onToggle}
            title={expanded ? "Ciutkan sidebar" : "Perluas sidebar"}
            className="absolute flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md cursor-pointer transition-all duration-150 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            style={{
              width: 26,
              height: 26,
              top: 24,
              right: -13,
              zIndex: 50,
            }}
          >
            <IconChevron expanded={expanded} />
          </button>
        )}

        {/* Logo area */}
        <div
          className="flex items-center gap-3 w-full overflow-hidden"
          style={{ padding: "20px 16px" }}
        >
          <div
            className="flex items-center justify-center rounded-xl text-lg flex-shrink-0 w-10 h-10"
            style={{ background: "#D8E8E6" }}
          >
            🦠
          </div>

          {showLabel && (
            <div className="text-left overflow-hidden flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight whitespace-nowrap text-gray-800">
                FluWatch Admin
              </p>
              <p className="text-xs leading-tight whitespace-nowrap text-gray-400">
                Panel Administrator
              </p>
            </div>
          )}

          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={onToggle}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs text-gray-500 bg-gray-100 border-none cursor-pointer hover:bg-gray-200"
            >
              ✕
            </button>
          )}
        </div>

        <div className="h-px mx-4 bg-gray-100" />

        {/* Nav items */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(({ id, Icon, label }) => {
            const active = view === id;
            return (
              <div key={id} className="relative px-3 py-0.5 group">
                <button
                  onClick={() => onNavigate(id)}
                  className="w-full flex items-center rounded-xl transition-all duration-150 border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  style={{
                    gap: showLabel ? "12px" : "0",
                    padding: showLabel ? "10px 12px" : "10px",
                    justifyContent: showLabel ? "flex-start" : "center",
                    minWidth: 0,
                    width: "100%",
                    background: active ? "#3A8E85" : "transparent",
                    color: active ? "#ffffff" : "#6B7280",
                    fontWeight: active ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "#D8E8E6";
                      e.currentTarget.style.color = "#3A8E85";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#6B7280";
                    }
                  }}
                >
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    <Icon />
                  </span>

                  {showLabel && (
                    <span className="text-sm truncate leading-none">
                      {label}
                    </span>
                  )}
                </button>

                {/* Tooltip — desktop icon-only mode */}
                {!expanded && !isMobile && (
                  <div
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-white shadow-lg"
                    style={{ background: "#1a2e2c" }}
                  >
                    {label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="h-px mx-4 bg-gray-100" />

        {/* User info */}
        <div
          className="flex items-center gap-3 overflow-hidden"
          style={{ padding: "14px 16px" }}
        >
          <div
            className="rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white w-10 h-10"
            style={{ background: "#3A8E85" }}
          >
            {pengguna.username[0].toUpperCase()}
          </div>

          {showLabel && (
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-gray-800">
                {pengguna.username}
              </p>
              <p className="text-xs truncate text-gray-400">Administrator</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
