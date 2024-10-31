import { useState, useEffect } from 'react';
import Head from 'next/head';
import CameraOverlay from '../components/CameraOverlay';

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  // This ensures we only render the camera component on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <Head>
        <title>Camera Overlay App</title>
        <meta name="description" content="Camera overlay application" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <main className="min-h-screen bg-black">
        {isClient ? (
          <CameraOverlay />
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-white">Loading camera...</p>
          </div>
        )}
      </main>
    </>
  );
}