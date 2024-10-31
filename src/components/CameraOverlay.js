import { useState, useRef, useEffect } from 'react';

const CameraOverlay = () => {
  const [stream, setStream] = useState(null);
  const [opacity, setOpacity] = useState(0.5);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const [imageUrl, setImageUrl] = useState('/api/placeholder/400/600');

  useEffect(() => {
    async function setupCamera() {
      try {
        console.log("Requesting camera access...");
        
        // Check if navigator.mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API not available in your browser");
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        
        console.log("Camera access granted:", mediaStream.getTracks());
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          
          // Add loadedmetadata event listener to ensure video is playing
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            videoRef.current.play()
              .then(() => console.log("Video playback started"))
              .catch(e => console.error("Video playback failed:", e));
          };
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError(err.message);
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        console.log("Cleaning up camera stream");
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">Camera Error: {error}</p>
          <p className="text-sm">Please ensure you have:
            <br />1. Granted camera permissions
            <br />2. Are using HTTPS (required for camera access)
            <br />3. Are using a supported browser
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black">
      {/* Debug info */}
      <div className="absolute top-0 left-0 right-0 bg-black/50 text-white text-xs p-2 z-10">
        Stream active: {stream ? 'Yes' : 'No'}
      </div>
      
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