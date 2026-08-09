/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Linting is handled separately from the production build so that a
  // fresh checkout without an ESLint config never blocks `next build`.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
