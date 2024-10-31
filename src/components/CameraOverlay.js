import { useState, useRef, useEffect } from 'react';

const CameraOverlay = () => {
  const [stream, setStream] = useState(null);
  const [opacity, setOpacity] = useState(0.5);
  const videoRef = useRef(null);
  const [imageUrl, setImageUrl] = useState('/api/placeholder/400/600');

  useEffect(() => {
    // Request camera access when component mounts
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Use back camera
          audio: false
        });
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }

    setupCamera();

    // Cleanup function to stop camera when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  return (
    <div className="relative h-screen w-full bg-black">
      {/* Camera Feed */}
      <video 
        ref={videoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />
      
      {/* Overlay Image */}
      <img 
        src={imageUrl}
        alt="Overlay"
        className="absolute top-0 left-0 w-full h-full object-cover"
        style={{ opacity: opacity }}
      />

      {/* Controls */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-4 p-4 bg-black/50">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full text-white"
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default CameraOverlay;