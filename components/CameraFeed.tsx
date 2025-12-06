import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon, VideoCameraSlashIcon } from '@heroicons/react/24/outline';

export const CameraFeed: React.FC = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
        let message = "Camera access failed.";
        if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
                message = "Camera permission denied by user.";
            } else if (err.name === 'NotFoundError') {
                message = "No camera found on this device.";
            } else if (err.name === 'NotReadableError') {
                message = "Camera is in use or unreadable.";
            } else if (err.message && err.message.toLowerCase().includes('timeout')) {
                message = "Timeout starting camera. It may be busy or disconnected.";
            } else {
                message = err.message || "An unknown error occurred.";
            }
        }
        setCameraError(message);
        setIsCameraActive(false);
      }
    } else {
      setCameraError("Camera not supported by this browser.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    streamRef.current = null;
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopCamera();
      }
    };
  }, []);

  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div className="absolute inset-0 bg-surfaceHighlight/30 rounded-2xl border border-white/5 p-1.5 backdrop-blur-sm flex flex-col">
      <div className="flex-1 flex flex-col bg-background/50 rounded-xl border border-white/5 relative overflow-hidden">
        {/* Header */}
        <div className="h-12 border-b border-white/5 bg-surface/50 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${isCameraActive ? 'bg-green-500 shadow-green-500/60 animate-pulse' : 'bg-gray-600 shadow-gray-600/60'}`}></div>
            <h2 className="text-sm font-tech font-bold text-white tracking-widest uppercase">
              LIVE FIELD SURVEILLANCE
            </h2>
          </div>
          <button
            onClick={handleToggleCamera}
            className={`flex items-center gap-2 px-3 py-1 rounded text-[10px] font-mono font-bold border transition-all uppercase tracking-wider ${isCameraActive ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
          >
            {isCameraActive ? <VideoCameraSlashIcon className="w-3 h-3" /> : <CameraIcon className="w-3 h-3" />}
            {isCameraActive ? 'Deactivate' : 'Activate Feed'}
          </button>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative flex items-center justify-center bg-[#08090d] shadow-inner overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover transition-opacity duration-500 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
          />

          {!isCameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10">
              {cameraError ? (
                <div className="text-red-400 font-mono text-sm space-y-2">
                  <p>ERROR: {cameraError}</p>
                  <p className="text-xs text-gray-500">Please check your camera connection and browser permissions.</p>
                </div>
              ) : (
                <div className="text-center text-gray-600">
                  <CameraIcon className="w-16 h-16 mx-auto mb-4" />
                  <p className="font-mono uppercase tracking-widest">Camera Feed Offline</p>
                </div>
              )}
            </div>
          )}

          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none z-20 animate-in fade-in duration-500 p-2">
              {/* Mock CV Overlay */}
              <div className="absolute w-1/3 h-1/4 top-[20%] left-[15%] border-2 border-accent rounded animate-pulse-glow">
                <span className="absolute -top-5 left-0 bg-accent text-black text-[10px] font-mono px-1.5 py-0.5 rounded">PERSON: 96.2%</span>
              </div>
              <div className="absolute w-1/4 h-1/3 top-[50%] left-[60%] border-2 border-saffron rounded animate-pulse-glow" style={{ animationDelay: '0.5s' }}>
                <span className="absolute -top-5 left-0 bg-saffron text-black text-[10px] font-mono px-1.5 py-0.5 rounded">VEHICLE: 88.1%</span>
              </div>

              {/* HUD Elements */}
              <div className="absolute top-2 left-2 text-[10px] font-mono text-green-400 bg-black/50 px-2 py-1 rounded-md">
                ANALYZING STREAM...
              </div>
              <div className="absolute bottom-2 right-2 text-[10px] font-mono text-red-400 bg-black/50 px-2 py-1 rounded-md">
                REC ●
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};