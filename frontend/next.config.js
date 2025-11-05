const nextConfig = {
    env: {
        NEXT_PUBLIC_BACKEND_URL: "http://localhost:8000",
    },
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "http://localhost:8000/api/:path*",
            },
        ];
    },
    /* config options here */
};

module.exports = nextConfig;
