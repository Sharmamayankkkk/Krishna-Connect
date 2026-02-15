'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Image as ImageIcon, Video, X, Type, Music,
  Send, Camera, Palette, ChevronLeft, Sparkles, Lock
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface CreateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusCreated: () => void;
}

const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00',
  '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55',
];

const BG_GRADIENTS = [
  'from-purple-600 to-pink-500',
  'from-blue-600 to-cyan-400',
  'from-orange-500 to-red-500',
  'from-green-500 to-teal-400',
  'from-indigo-600 to-purple-500',
  'from-pink-500 to-rose-400',
];

type StoryMode = 'select' | 'photo' | 'video' | 'text';

export function CreateStatusDialog({ open, onOpenChange, onStatusCreated }: CreateStatusDialogProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<StoryMode>('select');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [bgGradient, setBgGradient] = useState(BG_GRADIENTS[0]);
  const [textContent, setTextContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isVideo = selectedFile.type.startsWith('video/');
    if (isVideo && selectedFile.size > 50 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Video must be under 50MB' });
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setMode(isVideo ? 'video' : 'photo');
  }, [toast]);

  const resetState = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setCaption('');
    setIsLoading(false);
    setMode('select');
    setShowCaptionInput(false);
    setTextContent('');
    setTextColor('#FFFFFF');
    setBgGradient(BG_GRADIENTS[0]);
  }, [preview]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (mode === 'text') {
      if (!textContent.trim()) return;
      setIsLoading(true);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not supported');

        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        const gradClass = bgGradient;
        const colors: Record<string, [string, string]> = {
          'from-purple-600 to-pink-500': ['#9333ea', '#ec4899'],
          'from-blue-600 to-cyan-400': ['#2563eb', '#22d3ee'],
          'from-orange-500 to-red-500': ['#f97316', '#ef4444'],
          'from-green-500 to-teal-400': ['#22c55e', '#2dd4bf'],
          'from-indigo-600 to-purple-500': ['#4f46e5', '#a855f7'],
          'from-pink-500 to-rose-400': ['#ec4899', '#fb7185'],
        };
        const [c1, c2] = colors[gradClass] || ['#9333ea', '#ec4899'];
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = textColor;
        ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const words = textContent.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (ctx.measureText(testLine).width > canvas.width - 160) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);

        const lineHeight = 80;
        const startY = (canvas.height - lines.length * lineHeight) / 2;
        lines.forEach((line, i) => {
          ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
        });

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed to create image')), 'image/png');
        });

        const textFile = new File([blob], 'text-story.png', { type: 'image/png' });
        const formData = new FormData();
        formData.append('file', textFile);
        formData.append('caption', textContent);
        formData.append('mediaType', 'image');

        const response = await fetch('/api/status', { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to post story');

        toast({ title: 'Story posted', description: 'Your story is now live for 24 hours.' });
        onStatusCreated();
        handleOpenChange(false);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!file) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', caption);
      formData.append('mediaType', file.type.startsWith('video/') ? 'video' : 'image');

      const response = await fetch('/api/status', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to post story');

      toast({ title: 'Story posted', description: 'Your story is now live for 24 hours.' });
      onStatusCreated();
      handleOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-black border-none sm:rounded-2xl">
        <DialogTitle className="sr-only">Create Story</DialogTitle>
        <DialogDescription className="sr-only">Create a new story to share with your followers</DialogDescription>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          {mode !== 'select' ? (
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => { setMode('select'); setFile(null); setPreview(null); }}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : (
            <div className="w-16" />
          )}
          <h2 className="text-white font-semibold text-base">Create Story</h2>
          {(mode === 'photo' || mode === 'video' || mode === 'text') ? (
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4"
              onClick={handleSubmit}
              disabled={isLoading || (mode === 'text' ? !textContent.trim() : !file)}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Share
            </Button>
          ) : (
            <div className="w-16" />
          )}
        </div>

        {/* Content */}
        <div className="relative aspect-[9/16] max-h-[70vh] bg-neutral-950">
          {/* Mode: Select */}
          {mode === 'select' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
              <div className="text-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-white text-lg font-semibold">Add to Your Story</h3>
                <p className="text-white/60 text-sm mt-1">Share a moment that disappears in 24h</p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-white text-xs font-medium">Photo</span>
                </button>

                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <Video className="h-5 w-5 text-pink-400" />
                  </div>
                  <span className="text-white text-xs font-medium">Video</span>
                </button>

                <button
                  onClick={() => setMode('text')}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Type className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-white text-xs font-medium">Text</span>
                </button>

                <button
                  disabled
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 opacity-50 cursor-not-allowed relative"
                >
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Music className="h-5 w-5 text-green-400" />
                  </div>
                  <span className="text-white text-xs font-medium">Music</span>
                  <Badge variant="secondary" className="absolute -top-1 -right-1 text-[9px] px-1.5 py-0 bg-amber-500/90 text-white border-none">
                    Soon
                  </Badge>
                </button>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {/* Mode: Photo/Video Preview */}
          {(mode === 'photo' || mode === 'video') && preview && (
            <div className="absolute inset-0 flex flex-col">
              <div className="relative flex-1">
                {mode === 'photo' ? (
                  <Image src={preview} alt="Story preview" fill className="object-contain" />
                ) : (
                  <video src={preview} className="w-full h-full object-contain" autoPlay muted loop playsInline />
                )}
              </div>

              {/* Caption overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                {showCaptionInput ? (
                  <div className="flex items-end gap-2">
                    <Textarea
                      placeholder="Write a caption..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none text-sm rounded-xl min-h-[40px] max-h-[100px]"
                      rows={2}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/10 shrink-0"
                      onClick={() => setShowCaptionInput(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCaptionInput(true)}
                      className="flex-1 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm text-white/70 text-sm text-left border border-white/10"
                    >
                      {caption || 'Add a caption...'}
                    </button>
                  </div>
                )}
              </div>

              {/* Side tools */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white border border-white/10 hover:bg-white/10 transition-colors">
                  <Sparkles className="h-4 w-4" />
                </button>
                <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white border border-white/10 hover:bg-white/10 transition-colors">
                  <Type className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Mode: Text Story */}
          {mode === 'text' && (
            <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} flex flex-col items-center justify-center p-8`}>
              <Textarea
                placeholder="Type your story..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="bg-transparent border-none text-center text-2xl font-bold resize-none focus-visible:ring-0 shadow-none placeholder:text-white/40 max-h-[60%]"
                style={{ color: textColor }}
                rows={4}
                autoFocus
              />

              {/* Text color picker */}
              <div className="absolute bottom-4 left-0 right-0 px-4">
                <div className="flex items-center gap-2 justify-center mb-3">
                  <Palette className="h-4 w-4 text-white/60" />
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setTextColor(color)}
                      className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor: textColor === color ? 'white' : 'rgba(255,255,255,0.3)',
                        transform: textColor === color ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  {BG_GRADIENTS.map((grad) => (
                    <button
                      key={grad}
                      onClick={() => setBgGradient(grad)}
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} border-2 transition-transform hover:scale-110 ${bgGradient === grad ? 'border-white scale-110' : 'border-white/30'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Privacy note */}
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 border-t border-white/10">
          <Lock className="h-3 w-3 text-white/40" />
          <span className="text-white/40 text-xs">Your story will be visible for 24 hours</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}