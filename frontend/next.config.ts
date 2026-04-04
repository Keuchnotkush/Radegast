import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@dynamic-labs/sdk-react-core",
    "@dynamic-labs/ethereum",
    "@dynamic-labs/ethers-v6",
  ],
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      layers: true,
    };
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    // wasm-bindgen .wasm files load themselves via fetch() + WebAssembly.instantiate()
    // Prevent webpack from parsing them as WebAssembly modules (which fails on "wbg" imports)
    config.module.rules.unshift({
      test: /\.wasm$/,
      type: "asset/resource",
      generator: { filename: "static/wasm/[name].[hash][ext]" },
    });
    // Remove any existing wasm rules that would conflict
    config.module.rules = config.module.rules.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rule: any) => !(rule.test?.toString?.() === "/\\.wasm$/" && rule.type?.includes?.("webassembly"))
    );
    return config;
  },
};

export default nextConfig;
