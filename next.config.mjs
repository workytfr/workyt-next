/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "s3.eu-central-003.backblazeb2.com",
                pathname: "/**", // Autoriser toutes les URL de ce domaine
            },
        ],
    },
};

export default nextConfig;
