/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // ── Monochrome intelligence palette ──
        // White is the only color. Everything else is white at varying opacity.
        bg: "#000000",
        surface: "#080808",
        border: "rgba(255,255,255,0.07)",
        text: "#FFFFFF",
        dim: "rgba(255,255,255,0.35)",
        // Legacy accent tokens are all collapsed to white so existing
        // class names (text-gold, bg-danger, text-safe, …) restyle automatically.
        gold: "#FFFFFF",
        danger: "#FFFFFF",
        safe: "#FFFFFF",
        warn: "#FFFFFF",
      },
      fontFamily: {
        // JetBrains Mono everywhere — headings, labels, data, navigation.
        sans: ["JetBrains Mono", "ui-monospace", "monospace"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        label: "0.15em",
      },
      borderRadius: {
        // Sharp corners everywhere. Neutralise every rounded-* utility.
        none: "0",
        sm: "0",
        DEFAULT: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        "3xl": "0",
        full: "0",
      },
    },
  },
  plugins: [],
};
