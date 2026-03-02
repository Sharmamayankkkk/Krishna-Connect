'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X, Download, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { PostType } from '@/lib/types';
import { VideoPlayer } from './video-player';

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: PostType['media'];
  startIndex: number;
}

export function ImageViewerDialog({
  open,
  onOpenChange,
  media = [],
  startIndex = 0
}: ImageViewerDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex, open]);

  const resetTransforms = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
    resetTransforms();
  }, [media.length, resetTransforms]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    resetTransforms();
  }, [media.length, resetTransforms]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = async () => {
    const currentItem = media[currentIndex];
    if (!currentItem) return;

    try {
      const response = await fetch(currentItem.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = currentItem.url.split('/').pop() || 'media';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(currentItem.url, '_blank');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      resetTransforms();
    }, 200);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleClose]);

  const currentItem = media[currentIndex];
  if (!currentItem) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent hideClose className="max-w-[95vw] max-h-[95vh] w-auto h-auto bg-black/95 border-none shadow-2xl p-0 flex flex-col">
        <DialogTitle className="sr-only">Media Viewer</DialogTitle>
        <DialogDescription className="sr-only">Viewing media in full screen. Use controls to navigate, zoom, rotate, or download.</DialogDescription>

        <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-b border-white/10">
          <div className="flex-1 text-white/80 text-sm">
            <span>{currentIndex + 1} / {media.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            {currentItem.type === 'image' && (
              <>
                <button onClick={handleZoomOut} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" title="Zoom Out"><ZoomOut size={18} /></button>
                <span className="text-white/70 text-sm min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={handleZoomIn} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" title="Zoom In"><ZoomIn size={18} /></button>
                <button onClick={handleRotate} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" title="Rotate"><RotateCw size={18} /></button>
              </>
            )}
            <button onClick={handleDownload} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" title="Download"><Download size={18} /></button>
            <button onClick={handleClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" title="Close"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
          {media.length > 1 && (
            <Button onClick={handlePrev} variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white bg-black/30 hover:bg-black/50">
              <ChevronLeft size={24} />
            </Button>
          )}
          <div
            className="transition-transform duration-200 ease-out flex items-center justify-center"
            style={currentItem.type === 'image' ? { transform: `scale(${zoom}) rotate(${rotation}deg)` } : {}}
          >
            {currentItem.type === 'image' ? (
              <Image
                src={currentItem.url}
                alt={`Post media ${currentIndex + 1}`}
                width={1920}
                height={1080}
                className="max-w-[80vw] max-h-[70vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                priority
              />
            ) : (
              <div className="w-[80vw] h-[70vh]">
                <VideoPlayer src={currentItem.url} />
              </div>
            )}
          </div>
          {media.length > 1 && (
            <Button onClick={handleNext} variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white bg-black/30 hover:bg-black/50">
              <ChevronRight size={24} />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
