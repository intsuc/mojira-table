// @ts-check

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/mojira/",
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "index.html"),
        404: path.resolve(__dirname, "404.html"),
      }
    }
  }
})
