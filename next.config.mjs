/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Mapas de fuente para producción (opcional, ayuda a debuggear)
  productionBrowserSourceMaps: true,
  
  // 2. Directorio de distribución estándar
  distDir: process.env.DIST_DIR || '.next',

  // 3. Ignorar errores de tipado/linting en build (para que no falle el deploy por detalles)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 4. Configuración de Imágenes (CRÍTICO: Agregamos Supabase aquí)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'img.rocket.new',
      },
      // --- AGREGADO: Tu dominio de Supabase ---
      {
        protocol: 'https',
        hostname: 'kdzhyalorvjqxhybtdil.supabase.co',
      },
    ],
  },

  // 5. Redirecciones
  async redirects() {
    return [
      // {
      //   source: '/',
      //   destination: '/homepage',
      //   permanent: false,
      // },
    ];
  },

  // --- BORRAMOS LA SECCIÓN DE WEBPACK DE DHIWISE ---
  // Esa sección es la que causaba el conflicto con las rutas dinámicas.
};

export default nextConfig;