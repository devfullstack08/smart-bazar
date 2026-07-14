import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Wagmi / viem ship as ESM; transpiling avoids occasional Turbopack/Webpack resolution issues.
  transpilePackages: ["wagmi", "viem", "@walletconnect/ethereum-provider"],
};

export default nextConfig;
