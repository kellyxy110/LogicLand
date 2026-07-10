import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@logicland/ui",
    "@logicland/auth",
    "@logicland/shared",
    "@logicland/database",
  ],
  // In a pnpm monorepo, Next.js's output-file tracing fails to copy Prisma's
  // native query-engine (`libquery_engine-*.so.node`) into the serverless
  // bundle, so every DB call throws PrismaClientInitializationError in prod.
  // This plugin copies the engine next to each server bundle. Server-only.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};
export default nextConfig;
