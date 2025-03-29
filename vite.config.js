// @ts-check

import { defineConfig, send } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import fs from "fs"
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    fallback(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/mojira-table/",
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "index.html"),
        404: path.resolve(__dirname, "404.html"),
      }
    }
  },
})

function fallback() {
  /** @type {import("vite").PluginOption} */
  const option = {
    name: "fallback",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const originalUrl = req.originalUrl ?? ""
        const fileName = decodeURIComponent(path.join(server.config.root, path.relative(server.config.base, originalUrl)))
        if (
          req.headers.accept !== "*/*" &&
          originalUrl.startsWith(server.config.base) &&
          !fs.existsSync(fileName)
        ) {
          let html = fs.readFileSync("./404.html", "utf-8");
          html = await server.transformIndexHtml(req.url ?? "", html, req.originalUrl);
          return send(req, res, html, "html", {
            headers: server.config.server.headers,
          })
        } else {
          next()
        }
      })
    },
  }
  return option
}
