import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_BASE lets the GitHub Pages build serve under /reign/ while local dev
// stays at /.
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  server: {
    port: 5173,
  },
});
