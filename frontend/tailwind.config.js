/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#000000",
        surface: "#0A0A0A",
        elevated: "#111111",
      },
      borderColor: {
        subtle: "rgba(255,255,255,0.08)",
        hover: "rgba(255,255,255,0.15)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
      },
      maxWidth: {
        shell: "1180px",
      },
    },
  },
  plugins: [],
};
