import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
    resolveAlias: {
      // @react-pdf/renderer uses Node.js APIs (canvas, fs, etc.) that
      // Turbopack cannot bundle for the browser. The real library is only
      // ever loaded at runtime via dynamic(..., { ssr: false }), so we
      // point client-side imports to a no-op stub so Turbopack can resolve
      // the module graph without panicking.
      "@react-pdf/renderer": {
        browser: "./lib/react-pdf-stub.ts",
      },
    },
  },
};

export default nextConfig;
