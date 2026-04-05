import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // COEP/COOP only on ZK proof pages — needed for SharedArrayBuffer (Noir.js WASM).
        source: "/dashboard/solvency/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
      {
        source: "/verify/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  transpilePackages: [
    "@privy-io/react-auth",
  ],
  turbopack: {},
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

    // Skip heavy ZK WASM packages during SSR build (only needed client-side at runtime)
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : []),
        "@aztec/bb.js",
        "@noir-lang/noir_js",
      ];
    }

    // Don't parse WASM files — they load themselves via fetch() + WebAssembly.instantiate()
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
