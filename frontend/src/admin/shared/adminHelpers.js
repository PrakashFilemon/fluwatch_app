// ── Pure helper functions & constants ────────────────────────────────────────

export function skorWarna(skor) {
  if (skor >= 70)
    return {
      bg: "#fee2e2", // merah muda lembut
      text: "#991b1b", // merah tua
      border: "#fca5a5", // border merah
      badge: "#dc2626", // badge solid
      badgeText: "#ffffff",
    };
  if (skor >= 40)
    return {
      bg: "#ffedd5", // oranye muda lembut
      text: "#9a3412", // oranye tua
      border: "#fdba74", // border oranye
      badge: "#ea580c",
      badgeText: "#ffffff",
    };
  return {
    bg: "#dcfce7", // hijau muda lembut
    text: "#166534", // hijau tua
    border: "#86efac", // border hijau
    badge: "#16a34a",
    badgeText: "#ffffff",
  };
}

export function skorLabel(skor) {
  if (skor >= 70) return "Kritis";
  if (skor >= 40) return "Sedang";
  return "Rendah";
}

export function timeAgo(isoString) {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} hari lalu`;
}

export const PER_HAL = 10;

export const SEMUA_GEJALA = [
  { key: "demam", label: "Demam", icon: "🌡️" },
  { key: "menggigil", label: "Menggigil", icon: "🥶" },
  { key: "nyeri_otot", label: "Nyeri Otot", icon: "💪" },
  { key: "kelelahan", label: "Kelelahan", icon: "😴" },
  { key: "batuk", label: "Batuk", icon: "🤧" },
  { key: "sakit_kepala", label: "Sakit Kepala", icon: "🤕" },
  { key: "sakit_tenggorokan", label: "Sakit Tenggorokan", icon: "😮" },
  { key: "pilek", label: "Pilek", icon: "🤧" },
  { key: "mual_muntah", label: "Mual / Muntah", icon: "🤢" },
  { key: "sesak_napas", label: "Sesak Napas", icon: "😮‍💨" },
];
