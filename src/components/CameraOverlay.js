import { useState, useRef, useEffect } from 'react';

const CameraOverlay = () => {
  const [stream, setStream] = useState(null);
  const [opacity, setOpacity] = useState(0.5);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState('/api/placeholder/400/600');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotate, setRotate] = useState(0);
  const [mirror, setMirror] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [initialPinchDist, setInitialPinchDist] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [showDebug, setShowDebug] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API not supported in this browser. Try Safari on iOS over HTTPS.");
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(e => console.error("Video playback failed:", e));
          };
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError(err.message || "Failed to access camera. Ensure HTTPS, permissions, and Safari.");
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
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const imageRatio = img.height / img.width;
        const viewportRatio = viewportHeight / viewportWidth;

        let fitScale = 1;
        if (imageRatio > viewportRatio) {
          fitScale = viewportHeight / img.height;
        } else {
          fitScale = viewportWidth / img.width;
        }

        setImageSize({ width: img.width, height: img.height });
        setScale(fitScale);
        setPosition({ x: 0, y: 0 });
        setRotate(0);
        setMirror(false);
        setImageUrl(url);

        // Trigger full-screen after image load
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().then(() => {
            setIsFullscreen(true);
          }).catch(err => {
            console.error("Fullscreen request failed:", err);
          });
        }
      };
      img.src = url;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Fullscreen request failed:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error("Exit fullscreen failed:", err);
      });
    }
  };

  const calculatePinchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      setIsPinching(true);
      setIsDragging(false);
      setInitialPinchDist(calculatePinchDistance(e.touches));
      setInitialScale(scale);
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setIsPinching(false);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (isPinching && e.touches.length === 2) {
      const currentDist = calculatePinchDistance(e.touches);
      const newScale = initialScale * (currentDist / initialPinchDist);
      setScale(Math.max(0.1, Math.min(5, newScale)));
    } else if (isDragging && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPinching(false);
    setIsDragging(false);
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotate(0);
    setMirror(false);
    setOpacity(0.5);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">Camera Error: {error}</p>
          <p className="text-sm">Troubleshooting:
            <br />- Use HTTPS (deploy to Vercel or use ngrok for local)
            <br />- Grant camera permissions in iOS Settings > Safari
            <br />- Use Safari (not Chrome/Firefox on iOS)
            <br />- Reload and try again
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-screen bg-black overflow-hidden touch-none">
      {showDebug && (
        <div className="absolute top-0 left-0 right-0 bg-black/50 text-white text-xs p-2 z-20 flex justify-between">
          <span>Stream: {stream ? 'Active' : 'Inactive'} | Scale: {scale.toFixed(2)}x | Rotate: {rotate}° | Mirror: {mirror ? 'On' : 'Off'}</span>
          <button onClick={() => setShowDebug(false)} className="text-blue-300">Hide</button>
        </div>
      )}

      <video 
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute top-0 left-0 h-[100dvh] w-full object-cover"
      />
      
      <div 
        ref={overlayRef}
        className="absolute top-0 left-0 w-full h-[100dvh]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          src={imageUrl}
          alt="Overlay"
          className="absolute origin-center"
          style={{
            opacity,
            transform: `translate(${position.x}px, ${position.y}px) rotate(${rotate}deg) scale(${scale}) ${mirror ? 'scaleX(-1)' : ''}`,
            width: `${imageSize.width}px`,
            height: `${imageSize.height}px`,
          }}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-2 p-4 bg-black/60 z-10">
        <div className="w-3/4 flex gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="grow text-white bg-gray-800 p-2 rounded"
          />
          <button
            onClick={toggleFullscreen}
            className="bg-gray-800 text-white p-2 rounded text-xs"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Go Fullscreen'}
          </button>
        </div>
        <div className="w-3/4 grid grid-cols-2 gap-2 text-white text-xs">
          <label>Opacity</label>
          <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} />
          
          <label>Scale</label>
          <input type="range" min="0.1" max="5" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} />
          
          <label>Rotate</label>
          <input type="range" min="-180" max="180" step="5" value={rotate} onChange={(e) => setRotate(parseFloat(e.target.value))} />
          
          <label>Mirror</label>
          <button onClick={() => setMirror(!mirror)} className="bg-gray-800 p-2 rounded">
            {mirror ? 'On' : 'Off'}
          </button>
        </div>
        <button onClick={handleReset} className="bg-blue-500 text-white p-2 rounded w-3/4">
          Reset Overlay
        </button>
      </div>
    </div>
  );
};

export default CameraOverlay;