/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "8002d4938b63d45290e9963164b4e90f.r2.cloudflarestorage.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "workyt.8002d4938b63d45290e9963164b4e90f.r2.cloudflarestorage.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "utfs.io",
                pathname: "/**",
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
    // Exclure pdf-parse du bundling serveur (nécessite le worker pdf.js en natif)
    // + @uploadthing/mime-types pour éviter les erreurs de build sur ses fichiers .md
    serverExternalPackages: ["pdf-parse", "@uploadthing/mime-types"],
    // Transpile @uploadthing — Turbopack (Next 16) bute sinon sur les .d.cts qui
    // contiennent du ESM alors que leur extension annonce CommonJS.
    // Note : @uploadthing/mime-types reste en serverExternalPackages (plus haut),
    // ne pas le remettre ici (conflit au build webpack).
    transpilePackages: [
        "@uploadthing/react",
        "@uploadthing/shared",
        "uploadthing",
    ],
    // Turbopack : ignorer les README.md et fichiers markdown embarqués dans certains
    // packages (@uploadthing/mime-types, @uploadthing/react) — ils n'ont pas à être
    // bundlés côté client.
    turbopack: {
        rules: {
            "*.md": {
                loaders: [{ loader: "raw-loader" }],
                as: "*.js",
            },
        },
    },
    // Configuration pour le SEO
    experimental: {
        optimizeCss: true,
    },
    // Headers de sécurité
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://code.tidio.co https://*.tidio.co https://www.googletagmanager.com https://www.google-analytics.com https://cdn.cookie-script.com https://chimpstatic.com https://*.list-manage.com https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https: http:; connect-src 'self' blob: https: wss:; frame-src 'self' blob: https://www.google.com https://td.doubleclick.net; media-src 'self' https:; object-src 'none'; worker-src 'self' blob:; base-uri 'self'; form-action 'self';",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
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
