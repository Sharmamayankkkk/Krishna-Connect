'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function HareKrishnaTrigger() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    setIsPlaying(true);

    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ((video as any).mozRequestFullScreen) { /* Firefox */
      (video as any).mozRequestFullScreen();
    } else if ((video as any).webkitRequestFullscreen) { /* Chrome, Safari & Opera */
      (video as any).webkitRequestFullscreen();
    } else if ((video as any).msRequestFullscreen) { /* IE/Edge */
      (video as any).msRequestFullscreen();
    }
    video.play();
  };

  const handleVideoEnd = () => {
    const video = videoRef.current;
    if (document.fullscreenElement && video) {
      document.exitFullscreen();
    }
    setIsPlaying(false);
  };
  
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
        video.addEventListener('ended', handleVideoEnd);
    }
    
    // Cleanup
    return () => {
        if (video) {
            video.removeEventListener('ended', handleVideoEnd);
        }
    }
  }, []);

  return (
    <>
      <span
        onClick={handlePlayVideo}
        className="hare-krishna-trigger"
      >
        Hare Krishna
      </span>
      <video
        ref={videoRef}
        src="/text/krishna.mp4"
        className={cn(
            'fixed top-0 left-0 w-full h-full object-cover pointer-events-none transition-opacity',
            isPlaying ? 'z-[1000] opacity-100' : '-z-10 opacity-0'
        )}
        playsInline
      />
    </>
  );
}
