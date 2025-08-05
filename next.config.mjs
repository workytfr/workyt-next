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
    async redirects() {
        return [
            {
                source: "/:path*",
                has: [{ type: "host", value: "www.workyt.fr" }],
                destination: "https://workyt.fr/:path*",
                permanent: true,
            },
        ];
    },
    // Configuration pour le SEO
    experimental: {
        optimizeCss: true,
    },
    // Headers pour améliorer le SEO
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "X-XSS-Protection",
                        value: "1; mode=block",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                ],
            },
            {
                source: "/robots.txt",
                headers: [
                    {
                        key: "Content-Type",
                        value: "text/plain",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
