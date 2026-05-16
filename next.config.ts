import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // turbopack uniquement en dev — build standard pour Vercel
  ...(process.env.NODE_ENV === "development"
    ? { turbopack: { root: process.cwd() } }
    : {}),

  // Images externes autorisées
  images: {
    remotePatterns: [],
  },

  // Variables d'env publiques obligatoires
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "",
  },

  // pdfkit charge ses polices AFM via fs.readFileSync — Vercel doit les bundler
  outputFileTracingIncludes: {
    "/**": ["./node_modules/pdfkit/js/data/**/*"],
  },
};

export default nextConfig;
