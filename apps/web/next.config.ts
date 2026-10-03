import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@family/core", "@family/data", "@family/i18n", "@family/tree", "@family/ui"],
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui"],
  },
};

export default nextConfig;
