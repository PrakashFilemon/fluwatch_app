/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      colors: {
        brand: { 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c" },
        // ── Admin panel palette ─────────────────────────────────────────────
        admin: {
          DEFAULT: "#3A8E85", // primary teal  → bg-admin, text-admin, border-admin
          dark:    "#006B5F", // dark teal      → bg-admin-dark, text-admin-dark
          bg:      "#EAF2F1", // page bg        → bg-admin-bg
          card:    "#f0faf9", // thead / toolbar bg → bg-admin-card
          input:   "#f8fffe", // input bg       → bg-admin-input
          ink:     "#1a2e2c", // heading text   → text-admin-ink
        },
      },
      boxShadow: {
        card:  "0 2px 16px rgba(58,142,133,0.08)",
        card2: "0 2px 12px rgba(58,142,133,0.08)",
        modal: "0 32px 64px rgba(58,142,133,0.15)",
      },
    },
  },
  plugins: [],
};
