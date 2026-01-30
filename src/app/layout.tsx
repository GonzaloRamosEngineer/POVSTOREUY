import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/index.css';
import Header from '@/components/common/Header'; // ✅ Header Global
import Footer from '@/components/common/Footer'; // ✅ Footer Global

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'POV Store Uruguay',
  description: 'Cámaras POV mini 4K profesionales.',
  icons: {
    icon: '/icon.png', // Esto usa tu PNG de alta calidad
    shortcut: '/favicon.ico', // Para navegadores viejos
    apple: '/icon.png', // Para iPhone/iPad
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-black min-h-screen flex flex-col">
        {/* HEADER GLOBAL: Aparece en todas las páginas */}
        <Header />
        
        {/* CONTENIDO PRINCIPAL: Ocupa el espacio disponible */}
        <main className="flex-grow pt-16"> {/* pt-16 para compensar el header fijo */}
            {children}
        </main>

        {/* FOOTER GLOBAL: Aparece en todas las páginas */}
        <Footer />
      </body>
    </html>
  );
}