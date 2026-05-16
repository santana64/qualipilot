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
};

export default nextConfig;
