/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        pitch: {
          950: "#060b14",
          900: "#0a101d",
          850: "#101827",
          800: "#172234",
          700: "#243248",
          500: "#3a4d68",
        },
        electric: {
          500: "#3b82f6",
          400: "#60a5fa",
        },
        grass: {
          500: "#16a34a",
          400: "#22c55e",
        },
        warning: {
          500: "#f59e0b",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(59, 130, 246, 0.2), 0 18px 60px rgba(3, 7, 18, 0.45)",
      },
    },
  },
  plugins: [],
};
