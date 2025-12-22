import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({ // Removed mode parameter as it's no longer needed
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ].filter(Boolean), // filter(Boolean) can be removed if no other conditional plugins exist
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      // Break up the vendor bundle so no single chunk breaches the 500 kB warning
      output: {
        manualChunks: {
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          react: ["react", "react-dom", "react-router-dom"],
          ui: ["@tanstack/react-query", "lucide-react"],
        },
      },
    },
  },
});