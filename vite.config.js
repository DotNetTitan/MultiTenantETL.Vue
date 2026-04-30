import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const backendTarget = process.env.VITE_API_BASE_URL || "https://localhost:7288";

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/" : "/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      "/auth": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      "/connect": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      "/bff": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      "/css": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      "/images": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      "/browserLink": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      "/aspnetcore-browser-refresh.js": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
