import { useState, useEffect } from 'react';
import Head from 'next/head';
import CameraOverlay from '../components/CameraOverlay';

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <Head>
        <title>AR Tracing App</title> {/* Updated title */}
        <meta name="description" content="Overlay images on camera for tracing and drawing" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" /> {/* For PWA-like feel; add to home screen */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      <main className="min-h-screen bg-black">
        {isClient ? (
          <CameraOverlay />
        ) : (
          <div className="flex items-center justify-center min-h-screen text-white">
            <div className="animate-pulse">Loading camera...</div>
          </div>
        )}
      </main>
    </>
  );
}