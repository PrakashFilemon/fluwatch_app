/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      colors: {
        brand: { 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c" },
      },
    },
  },
  plugins: [],
};
