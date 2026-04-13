import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark server-only packages (pg, redis, etc.) so they are not bundled for client
  serverExternalPackages: ['pg', 'redis', 'bcryptjs', 'jsonwebtoken', 'exceljs', 'p-limit'],
};

export default nextConfig;
