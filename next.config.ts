import type { NextConfig } from "next";
const config: NextConfig = {
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};
export default config;
