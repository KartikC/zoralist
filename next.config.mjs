/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["zoralist.vercel.app", "img.reservoir.tools"], // Add your external domain here
  },
};

export default nextConfig;
