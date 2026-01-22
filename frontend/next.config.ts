import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverPort: 3001,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
