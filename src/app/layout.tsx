import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/index.css';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import WhatsAppButton from '@/components/common/WhatsAppButton'; 

// <-- AGREGAMOS LA IMPORTACIÓN DEL TOASTER AQUÍ -->
import { Toaster } from 'react-hot-toast';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://povstore.uy'),
  title: 'POV Store Uruguay',
  description: 'Cámaras POV mini 4K profesionales.',
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'POV Store Uruguay',
    locale: 'es_UY',
    url: 'https://povstore.uy',
    title: 'POV Store Uruguay',
    description: 'Cámaras POV mini 4K profesionales.',
    images: [{ url: '/icon.png', width: 512, height: 512, alt: 'POV Store Uruguay' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POV Store Uruguay',
    description: 'Cámaras POV mini 4K profesionales.',
    images: ['/icon.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-[#F9F9F9] text-gray-900 min-h-screen flex flex-col font-sans">
        <Header />
        
        <main className="flex-grow pt-16">
            {children}
        </main>

        <Footer />
        
        {/* <-- AGREGAMOS EL COMPONENTE TOASTER AQUÍ --> */}
        <Toaster position="bottom-right" />
        
        <WhatsAppButton />
      </body>
    </html>
  );
}