import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the committed dashboard JSON is bundled with the API route handlers
  // so they can read public/data/*.json at runtime on Vercel (no Python needed).
  outputFileTracingIncludes: {
    "/api/**": ["./public/data/**"],
  },
};

export default nextConfig;
