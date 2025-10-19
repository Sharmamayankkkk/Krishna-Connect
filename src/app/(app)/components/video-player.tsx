
'use client';

import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };
  
  const handleFullScreen = () => {
      if (videoRef.current?.requestFullscreen) {
          videoRef.current.requestFullscreen();
      }
  }

  return (
    <div className="relative w-full h-full group bg-black" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        muted={isMuted}
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Button variant="ghost" size="icon" className="h-16 w-16 text-white hover:bg-white/20">
          {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 fill-white" />}
        </Button>
      </div>

      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); toggleMute();}} className="h-8 w-8 text-white hover:bg-white/20">
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
        <div className="relative h-1 flex-1 bg-white/30 rounded-full">
            <div className="absolute h-1 bg-white rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); handleFullScreen();}} className="h-8 w-8 text-white hover:bg-white/20">
            <Maximize className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
