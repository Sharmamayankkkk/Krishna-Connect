
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isEnded, setIsEnded] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (!entry.isIntersecting || entry.intersectionRatio < 0.5) {
        videoElement.pause();
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, { threshold: 0.5 });
    observerRef.current.observe(videoElement);

    const handlePlay = () => { setIsPlaying(true); setIsEnded(false); };
    const handlePause = () => { setIsPlaying(false); setShowControls(true); };
    const handleEnded = () => { setIsEnded(true); setIsPlaying(false); setShowControls(true); };
    const handleLoadedMetadata = () => {
      if (isFinite(videoElement.duration)) setDuration(videoElement.duration);
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      if (observerRef.current && videoElement) observerRef.current.unobserve(videoElement);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  useEffect(() => { scheduleHideControls(); }, [isPlaying, scheduleHideControls]);

  const safePlay = () => { videoRef.current?.play().catch(() => {}); };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isEnded) {
      videoRef.current.currentTime = 0;
      safePlay();
    } else if (videoRef.current.paused) {
      safePlay();
    } else {
      videoRef.current.pause();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || isSeeking) return;
    const dur = videoRef.current.duration;
    if (isFinite(dur) && dur > 0) {
      setProgress((videoRef.current.currentTime / dur) * 100);
      setCurrentTime(videoRef.current.currentTime);
      setDuration(dur);
    }
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * videoRef.current.duration;
    setProgress(pos * 100);
  };

  const handleFullScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleContainerClick = () => {
    setShowControls(true);
    scheduleHideControls();
  };

  return (
    <div className="relative w-full h-full group bg-black" onClick={handleContainerClick}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        muted={isMuted}
        loop={false}
        playsInline
        poster={poster}
      />

      {/* Center play/pause/replay overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 cursor-pointer ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
        onClick={togglePlay}
      >
        {(!isPlaying || isEnded) && (
          <div className="bg-black/50 backdrop-blur-sm p-4 rounded-full transition-transform active:scale-90">
            {isEnded ? (
              <RotateCcw className="h-8 w-8 text-white" />
            ) : (
              <Play className="h-8 w-8 text-white fill-white" />
            )}
          </div>
        )}
      </div>

      {/* Bottom controls bar */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-2 px-3 transition-opacity duration-200 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-1 w-full bg-white/30 rounded-full cursor-pointer group/progress mb-2"
          onClick={handleProgressClick}
          onMouseDown={() => setIsSeeking(true)}
          onMouseUp={() => setIsSeeking(false)}
        >
          <div className="absolute h-full bg-white rounded-full transition-[width] duration-100" style={{ width: `${progress}%` }} />
          <div
            className="absolute top-1/2 h-3 w-3 bg-white rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="p-1 text-white hover:text-white/80 transition-colors" aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white" />}
          </button>

          <button onClick={toggleMute} className="p-1 text-white hover:text-white/80 transition-colors" aria-label={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <span className="text-white/80 text-xs font-mono tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          <button onClick={handleFullScreen} className="p-1 text-white hover:text-white/80 transition-colors" aria-label="Fullscreen">
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

