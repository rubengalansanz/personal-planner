import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "web-push"],
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
