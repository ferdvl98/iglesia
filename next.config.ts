import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // La aplicación no usa next/image en ningún lado, así que el optimizador
    // solo aportaba superficie: su endpoint es público y arrastra las
    // vulnerabilidades de sharp/libvips al procesar imágenes de terceros.
    unoptimized: true,
  },
};

export default nextConfig;
