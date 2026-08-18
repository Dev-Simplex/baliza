import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Em desenvolvimento o Next bloqueia recursos vindos de origem diferente da
  // que ele serve. Sem isto, abrir por 127.0.0.1 ou pelo IP da rede carrega o
  // HTML mas não hidrata — a página parece pronta e nada responde ao clique.
  allowedDevOrigins: ["127.0.0.1", "192.168.8.98"],

  experimental: {
    // O @react-pdf/renderer e o exceljs são pesados e só rodam no servidor:
    // mantê-los fora do bundle do cliente encurta o carregamento das telas.
    serverActions: { bodySizeLimit: "8mb" },
  },

  serverExternalPackages: ["@react-pdf/renderer", "bcryptjs"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
