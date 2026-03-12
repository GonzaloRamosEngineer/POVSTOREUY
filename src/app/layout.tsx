import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/index.css';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import WhatsAppButton from '@/components/common/WhatsAppButton'; // <-- NUEVA IMPORTACIÓN DEL BOTÓN

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'POV Store Uruguay',
  description: 'Cámaras POV mini 4K profesionales.',
  icons: {
    icon: '/icon.png', 
    shortcut: '/favicon.ico', 
    apple: '/icon.png', 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/* CAMBIO A MODO CLARO: bg-[#F9F9F9] y texto oscuro */}
      <body className="bg-[#F9F9F9] text-gray-900 min-h-screen flex flex-col font-sans">
        <Header />
        
        <main className="flex-grow pt-16">
            {children}
        </main>

        <Footer />
        
        {/* <-- AGREGAMOS EL BOTÓN FLOTANTE AQUÍ --> */}
        <WhatsAppButton />
      </body>
    </html>
  );
}