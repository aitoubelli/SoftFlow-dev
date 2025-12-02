const nextConfig = {
    env: {
        // NEXT_PUBLIC_BACKEND_URL is used by client-side code (browser)
        // Must use localhost since browser can't access Docker internal URLs
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
    },
    async rewrites() {
        // Rewrites run server-side and can use Docker internal URLs
        return [
            {
                source: "/api/:path*",
                destination: `${process.env.BACKEND_URL || "http://localhost:8000"}/api/:path*`,
            },
        ];
    },
    /* config options here */
};

module.exports = nextConfig;
