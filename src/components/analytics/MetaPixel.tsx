'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { FB_PIXEL_ID, pageview } from '@/lib/analytics/metaPixel';

/**
 * Meta Pixel base. Inyecta el snippet oficial (init + primer PageView) vía
 * next/script con strategy afterInteractive, y refire PageView en cada
 * navegación client-side del App Router (el snippet base sólo cuenta el load
 * inicial; las navegaciones SPA no recargan la página).
 *
 * No renderiza nada si NEXT_PUBLIC_FB_PIXEL_ID no está seteado (fail-safe:
 * en local sin la env var el sitio funciona igual, sin pixel).
 */
export default function MetaPixel() {
  const pathname = usePathname();
  // El snippet base ya dispara el PageView del load inicial; salteamos el
  // primer run de este efecto para no contarlo dos veces.
  const initialLoad = useRef(true);

  useEffect(() => {
    if (!FB_PIXEL_ID) return;
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    pageview();
  }, [pathname]);

  if (!FB_PIXEL_ID) return null;

  return (
    <>
      <Script id="fb-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${FB_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
