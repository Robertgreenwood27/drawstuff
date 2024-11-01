import { useState, useRef, useEffect } from 'react';

const CameraOverlay = () => {
  const [stream, setStream] = useState(null);
  const [opacity, setOpacity] = useState(0.5);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState('/api/placeholder/400/600');
  const videoRef = useRef(null);
  
  // New state for zoom and pan
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    async function setupCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API not available in your browser");
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
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
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        // Calculate scale to fit image to screen
        const screenRatio = window.innerHeight / window.innerWidth;
        const imageRatio = img.height / img.width;
        
        let newScale = 1;
        if (imageRatio > screenRatio) {
          // Image is taller than screen ratio
          newScale = window.innerHeight / img.height;
        } else {
          // Image is wider than screen ratio
          newScale = window.innerWidth / img.width;
        }
        
        setImageSize({ width: img.width, height: img.height });
        setScale(newScale);
        setPosition({ x: 0, y: 0 });
        setImageUrl(url);
      };
      img.src = url;
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
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
    <div className="relative h-screen w-full bg-black overflow-hidden">
      <div className="absolute top-0 left-0 right-0 bg-black/50 text-white text-xs p-2 z-10">
        Stream active: {stream ? 'Yes' : 'No'} | Scale: {scale.toFixed(2)}x
      </div>
      
      <video 
        ref={videoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />
      
      <div 
        className="absolute top-0 left-0 w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          src={imageUrl}
          alt="Overlay"
          className="absolute origin-center object-contain"
          style={{
            opacity,
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            width: imageSize.width || '100%',
            height: imageSize.height || '100%',
          }}
        />
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-4 p-4 bg-black/50">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full text-white"
        />
        <div className="w-full flex flex-col gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default CameraOverlay;