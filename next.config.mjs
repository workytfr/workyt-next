/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "workyt.8002d4938b63d45290e9963164b4e90f.r2.cloudflarestorage.com",
                pathname: "/**", // Autorise toutes les images de ce domaine
            },
            {
                protocol: "https",
                hostname: "utfs.io",
                pathname: "/**", // Autorise toutes les images de ce domaine
            },
        ],
    },
};

export default nextConfig;
