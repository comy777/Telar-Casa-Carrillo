import type { NextConfig } from "next";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const isDev = process.env.NODE_ENV !== "production";

// Wompi carga su widget y sus pantallas desde sus dominios; Cloudinary sirve las imágenes.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://checkout.wompi.co${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://res.cloudinary.com ${api}`,
  "font-src 'self'",
  `connect-src 'self' ${api} https://*.wompi.co${isDev ? " ws:" : ""}`,
  "frame-src https://checkout.wompi.co https://*.wompi.co",
  "form-action 'self' https://checkout.wompi.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const config: NextConfig = {
  transpilePackages: ["@telar/ui", "@telar/api-client"],
  poweredByHeader: false,
  images: {
    remotePatterns: [
      new URL("https://res.cloudinary.com/**"),
      // Desarrollo: la API sirve las imágenes locales en /media.
      ...(isDev ? [new URL(`${api}/media/**`)] : []),
    ],
    // Solo en desarrollo: la API local resuelve a una IP privada.
    dangerouslyAllowLocalIP: isDev,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default config;
