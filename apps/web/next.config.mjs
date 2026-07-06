/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@logicland/ui",
    "@logicland/auth",
    "@logicland/shared",
    "@logicland/database",
  ],
};
export default nextConfig;
