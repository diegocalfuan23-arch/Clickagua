import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Por defecto una acción de servidor acepta 1 MB: un padrón en PDF o Excel
    // puede pasarlo. 4 MB es lo máximo que Vercel deja pasar en una petición.
    serverActions: { bodySizeLimit: "4mb" },
  },
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        // El service worker no debe quedar en caché del navegador: si lo
        // estuviera, un arreglo tardaría días en llegar al teléfono del técnico.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
