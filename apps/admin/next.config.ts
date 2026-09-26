import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@family/core", "@family/data", "@family/i18n", "@family/tree", "@family/ui"],
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui"],
    // Allow importing larger family files through server actions.
    serverActions: { bodySizeLimit: "10mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
