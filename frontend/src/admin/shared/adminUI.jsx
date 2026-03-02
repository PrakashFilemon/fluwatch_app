import { PER_HAL } from "./adminHelpers";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
export function IconHome({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  );
}

export function IconUsers({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

export function IconClipboard({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

export function IconLogout({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────────
// Karena warna Badge bersifat dinamis (dari props), tetap pakai style inline untuk bg & color.
// Jika warnanya terbatas/tetap, bisa diganti dengan variant map seperti Btn.
export function Badge({ children, bg, text }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: bg, color: text }}
    >
      {children}
    </span>
  );
}

// ── Btn ────────────────────────────────────────────────────────────────────────
// Catatan: Tailwind tidak mendukung arbitrary value seperti rgba() secara default.
// Solusi terbaik: gunakan Tailwind CSS v3+ dengan arbitrary values [value],
// atau tambahkan warna kustom di tailwind.config.js.
// Di bawah ini menggunakan arbitrary values Tailwind untuk mempertahankan warna asli.

const BTN_VARIANTS = {
  default:
    "bg-[rgba(58,142,133,0.12)] text-[#006B5F] border border-[rgba(58,142,133,0.25)]",
  danger:
    "bg-red-500/30 text-red-600 hover:bg-[#7f1d1d] hover:text-white border-none",
  success: "bg-[rgba(34,197,94,0.10)] text-green-600",
  warning: "bg-[rgba(234,179,8,0.10)] text-yellow-800",
  ghost:
    "bg-[rgba(58,142,133,0.06)] text-slate-500 border border-[rgba(58,142,133,0.15)]",
};

export function Btn({
  onClick,
  disabled,
  children,
  variant = "default",
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 whitespace-nowrap ${BTN_VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ── Paginasi ──────────────────────────────────────────────────────────────────
export function Paginasi({ halaman, total, onSebelum, onBerikut }) {
  const totalHal = Math.ceil(total / PER_HAL);
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2">
      <p className="text-sm text-slate-500">
        Menampilkan{" "}
        <span className="text-slate-800 font-semibold">
          {Math.min((halaman - 1) * PER_HAL + 1, total)}–
          {Math.min(halaman * PER_HAL, total)}
        </span>{" "}
        dari <span className="text-slate-800 font-semibold">{total}</span> data
      </p>
      <div className="flex items-center gap-2">
        <Btn onClick={onSebelum} disabled={halaman === 1} variant="ghost">
          ← Sebelumnya
        </Btn>
        <span className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap bg-[rgba(58,142,133,0.08)] text-[#006B5F] border border-[rgba(58,142,133,0.20)]">
          {halaman} / {totalHal}
        </span>
        <Btn onClick={onBerikut} disabled={halaman >= totalHal} variant="ghost">
          Berikutnya →
        </Btn>
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, teks }) {
  return (
    <tr>
      <td colSpan={99} className="py-10 sm:py-16 text-center">
        <div className="text-3xl sm:text-4xl mb-3">{icon}</div>
        <p className="text-sm font-medium text-slate-500">{teks}</p>
      </td>
    </tr>
  );
}

// ── SkeletonRow ───────────────────────────────────────────────────────────────
export function SkeletonRow({ cols }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="border-t border-[rgba(58,142,133,0.08)]">
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-3 sm:px-4 py-3">
          <div
            className={`h-4 rounded animate-pulse bg-[rgba(58,142,133,0.08)] ${j === 0 ? "w-[70%]" : "w-[50%]"}`}
          />
        </td>
      ))}
    </tr>
  ));
}
