'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Image as ImageIcon, Video, X, Type, Music,
  Send, Camera, Palette, ChevronLeft, Lock, Users,
  Pencil, StickerIcon, AtSign, Hash, Clock, Link2, Timer,
  Undo2, Redo2, Eraser, Circle, AlignLeft, AlignCenter, AlignRight,
  Bold
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useAppContext } from '@/providers/app-provider';

interface CreateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusCreated: () => void;
}

// --- Constants ---
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

const GRADIENT_CSS: Record<string, [string, string]> = {
  'from-purple-600 to-pink-500': ['#9333ea', '#ec4899'],
  'from-blue-600 to-cyan-400': ['#2563eb', '#22d3ee'],
  'from-orange-500 to-red-500': ['#f97316', '#ef4444'],
  'from-green-500 to-teal-400': ['#22c55e', '#2dd4bf'],
  'from-indigo-600 to-purple-500': ['#4f46e5', '#a855f7'],
  'from-pink-500 to-rose-400': ['#ec4899', '#fb7185'],
};

const BRUSH_SIZES = [3, 6, 12];
const FONTS = ['system-ui', 'Georgia, serif', 'ui-monospace, monospace', 'cursive'];
const FONT_LABELS = ['Sans', 'Serif', 'Mono', 'Script'];
const MAX_VIDEO_SIZE_MB = 50;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

type StoryMode = 'select' | 'photo' | 'video' | 'text';
type Tool = 'none' | 'sticker' | 'draw' | 'text-add';

interface StickerItem {
  id: string;
  type: 'mention' | 'hashtag' | 'time' | 'link' | 'countdown';
  data: Record<string, string>;
  x: number;
  y: number;
  scale: number;
}

interface DrawAction {
  points: { x: number; y: number }[];
  color: string;
  size: number;
  isEraser: boolean;
}

interface TextBlock {
  id: string;
  text: string;
  color: string;
  font: number;
  align: 'left' | 'center' | 'right';
  hasBg: boolean;
  x: number;
  y: number;
}

export function CreateStatusDialog({ open, onOpenChange, onStatusCreated }: CreateStatusDialogProps) {
  const { toast } = useToast();
  const { loggedInUser } = useAppContext();
  const supabase = createClient();

  // Core state
  const [mode, setMode] = useState<StoryMode>('select');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCaptionInput, setShowCaptionInput] = useState(false);

  // Text story state
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [bgGradient, setBgGradient] = useState(BG_GRADIENTS[0]);
  const [textContent, setTextContent] = useState('');

  // Tool state
  const [activeTool, setActiveTool] = useState<Tool>('none');
  const [stickerPanel, setStickerPanel] = useState<string | null>(null);

  // Stickers
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [stickerInput, setStickerInput] = useState('');
  const [draggingSticker, setDraggingSticker] = useState<string | null>(null);

  // Drawing
  const [drawActions, setDrawActions] = useState<DrawAction[]>([]);
  const [redoStack, setRedoStack] = useState<DrawAction[]>([]);
  const [drawColor, setDrawColor] = useState('#FF3B30');
  const [brushSize, setBrushSize] = useState(1);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentDrawRef = useRef<DrawAction | null>(null);

  // Text blocks (for media stories)
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [blockFont, setBlockFont] = useState(0);
  const [blockAlign, setBlockAlign] = useState<'left' | 'center' | 'right'>('center');
  const [blockHasBg, setBlockHasBg] = useState(false);

  // Sharing
  const [visibility, setVisibility] = useState<'public' | 'close_friends'>('public');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- File handling ---
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const isVideo = selectedFile.type.startsWith('video/');
    if (isVideo && selectedFile.size > MAX_VIDEO_SIZE_BYTES) {
      toast({ variant: 'destructive', title: 'File too large', description: `Video must be under ${MAX_VIDEO_SIZE_MB}MB` });
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setMode(isVideo ? 'video' : 'photo');
  }, [toast]);

  const resetState = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null); setCaption('');
    setIsLoading(false); setMode('select'); setShowCaptionInput(false);
    setTextContent(''); setTextColor('#FFFFFF'); setBgGradient(BG_GRADIENTS[0]);
    setActiveTool('none'); setStickerPanel(null);
    setStickers([]); setStickerInput('');
    setDrawActions([]); setRedoStack([]);
    setTextBlocks([]); setEditingBlock(null);
    setVisibility('public');
  }, [preview]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  // --- Drawing ---
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const action of drawActions) {
      ctx.beginPath();
      ctx.strokeStyle = action.isEraser ? 'rgba(0,0,0,0)' : action.color;
      ctx.lineWidth = action.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (action.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      action.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }, [drawActions]);

  useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (activeTool !== 'draw') return;
    const coords = getCanvasCoords(e);
    currentDrawRef.current = {
      points: [coords],
      color: drawColor,
      size: BRUSH_SIZES[brushSize],
      isEraser,
    };
    setIsDrawing(true);
  };

  const continueDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentDrawRef.current) return;
    const coords = getCanvasCoords(e);
    currentDrawRef.current.points.push(coords);
    // Live preview
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pts = currentDrawRef.current.points;
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : drawColor;
    ctx.lineWidth = BRUSH_SIZES[brushSize];
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    const p1 = pts[pts.length - 2];
    const p2 = pts[pts.length - 1];
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };

  const endDraw = () => {
    if (currentDrawRef.current && currentDrawRef.current.points.length > 0) {
      setDrawActions(prev => [...prev, currentDrawRef.current!]);
      setRedoStack([]);
    }
    currentDrawRef.current = null;
    setIsDrawing(false);
  };

  const undoDraw = () => {
    setDrawActions(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack(r => [...r, last]);
      return prev.slice(0, -1);
    });
  };

  const redoDraw = () => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setDrawActions(d => [...d, last]);
      return prev.slice(0, -1);
    });
  };

  // --- Stickers ---
  const addSticker = (type: StickerItem['type'], data: Record<string, string>) => {
    const newSticker: StickerItem = {
      id: `sticker-${Date.now()}`,
      type,
      data,
      x: 50,
      y: 50,
      scale: 1,
    };
    setStickers(prev => [...prev, newSticker]);
    setStickerPanel(null);
    setStickerInput('');
  };

  const removeSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
  };

  const handleStickerDrag = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setDraggingSticker(id);
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (draggingSticker && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setStickers(prev => prev.map(s =>
        s.id === draggingSticker ? { ...s, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : s
      ));
    }
  };

  const handleContainerMouseUp = () => { setDraggingSticker(null); };

  // --- Text Blocks ---
  const addTextBlock = () => {
    const block: TextBlock = {
      id: `text-${Date.now()}`,
      text: '',
      color: '#FFFFFF',
      font: blockFont,
      align: blockAlign,
      hasBg: blockHasBg,
      x: 50,
      y: 50,
    };
    setTextBlocks(prev => [...prev, block]);
    setEditingBlock(block.id);
    setActiveTool('none');
  };

  const updateTextBlock = (id: string, updates: Partial<TextBlock>) => {
    setTextBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  // --- Submit ---
  const handleSubmit = async () => {
    if (mode === 'text') {
      if (!textContent.trim()) return;
      setIsLoading(true);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas rendering is not supported in your browser');

        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        const [c1, c2] = GRADIENT_CSS[bgGradient] || ['#9333ea', '#ec4899'];
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
          } else { currentLine = testLine; }
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
        formData.append('visibility', visibility);

        const response = await fetch('/api/status', { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to post story');

        toast({ title: 'Story posted', description: visibility === 'close_friends' ? 'Shared with Close Friends.' : 'Your story is now live for 24 hours.' });
        onStatusCreated();
        handleOpenChange(false);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally { setIsLoading(false); }
      return;
    }

    if (!file) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', caption);
      formData.append('mediaType', file.type.startsWith('video/') ? 'video' : 'image');
      formData.append('visibility', visibility);

      const response = await fetch('/api/status', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to post story');

      // Save stickers to DB
      if (stickers.length > 0 && result.id) {
        const stickerRows = stickers.map(s => ({
          status_id: result.id,
          sticker_type: s.type,
          data: s.data,
          position_x: s.x,
          position_y: s.y,
          scale: s.scale,
        }));
        await supabase.from('story_stickers').insert(stickerRows);
      }

      toast({ title: 'Story posted', description: visibility === 'close_friends' ? 'Shared with Close Friends.' : 'Your story is now live for 24 hours.' });
      onStatusCreated();
      handleOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally { setIsLoading(false); }
  };

  // --- Sticker Render Helper ---
  const renderStickerContent = (sticker: StickerItem) => {
    switch (sticker.type) {
      case 'mention':
        return <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-sm font-semibold">@{sticker.data.username}</span>;
      case 'hashtag':
        return <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-sm font-semibold">#{sticker.data.tag}</span>;
      case 'time':
        return <span className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
      case 'link':
        return <span className="bg-white/90 px-3 py-1.5 rounded-lg text-black text-xs font-medium flex items-center gap-1"><Link2 className="h-3 w-3" />{sticker.data.label || 'Link'}</span>;
      case 'countdown':
        return <span className="bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 rounded-lg text-white text-xs font-bold">{sticker.data.label || 'Countdown'}</span>;
      default:
        return null;
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
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => { setMode('select'); setFile(null); setPreview(null); setStickers([]); setDrawActions([]); setTextBlocks([]); setActiveTool('none'); }}>
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
        <div
          ref={containerRef}
          className="relative aspect-[9/16] max-h-[70vh] bg-neutral-950"
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
        >
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
                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center"><ImageIcon className="h-5 w-5 text-blue-400" /></div>
                  <span className="text-white text-xs font-medium">Photo</span>
                </button>
                <button onClick={() => videoInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center"><Video className="h-5 w-5 text-pink-400" /></div>
                  <span className="text-white text-xs font-medium">Video</span>
                </button>
                <button onClick={() => setMode('text')} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center"><Type className="h-5 w-5 text-purple-400" /></div>
                  <span className="text-white text-xs font-medium">Text</span>
                </button>
                <button disabled className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 opacity-50 cursor-not-allowed relative">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center"><Music className="h-5 w-5 text-green-400" /></div>
                  <span className="text-white text-xs font-medium">Music</span>
                  <Badge variant="secondary" className="absolute -top-1 -right-1 text-[9px] px-1.5 py-0 bg-amber-500/90 text-white border-none">Soon</Badge>
                </button>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {/* Mode: Photo/Video Preview with Drawing Canvas + Stickers */}
          {(mode === 'photo' || mode === 'video') && preview && (
            <div className="absolute inset-0 flex flex-col">
              <div className="relative flex-1">
                {mode === 'photo' ? (
                  <Image src={preview} alt="Story preview" fill className="object-contain" />
                ) : (
                  <video src={preview} className="w-full h-full object-contain" autoPlay muted loop playsInline aria-label="Story preview video" />
                )}

                {/* Drawing canvas overlay */}
                <canvas
                  ref={canvasRef}
                  width={1080}
                  height={1920}
                  className={`absolute inset-0 w-full h-full ${activeTool === 'draw' ? 'cursor-crosshair z-20' : 'pointer-events-none z-10'}`}
                  onMouseDown={startDraw}
                  onMouseMove={continueDraw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={continueDraw}
                  onTouchEnd={endDraw}
                />

                {/* Stickers overlay */}
                {stickers.map(sticker => (
                  <div
                    key={sticker.id}
                    className="absolute z-30 cursor-move select-none group"
                    style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, transform: `translate(-50%, -50%) scale(${sticker.scale})` }}
                    onMouseDown={(e) => handleStickerDrag(sticker.id, e)}
                  >
                    {renderStickerContent(sticker)}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeSticker(sticker.id); }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Text blocks overlay */}
                {textBlocks.map(block => (
                  <div
                    key={block.id}
                    className="absolute z-30 cursor-move"
                    style={{ left: `${block.x}%`, top: `${block.y}%`, transform: 'translate(-50%, -50%)', fontFamily: FONTS[block.font], textAlign: block.align }}
                  >
                    {editingBlock === block.id ? (
                      <input
                        autoFocus
                        value={block.text}
                        onChange={(e) => updateTextBlock(block.id, { text: e.target.value })}
                        onBlur={() => {
                          if (!block.text.trim()) {
                            setTextBlocks(prev => prev.filter(b => b.id !== block.id));
                          }
                          setEditingBlock(null);
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') setEditingBlock(null); }}
                        className="bg-transparent border-none outline-none text-white text-xl font-bold text-center min-w-[100px]"
                        style={{ color: block.color }}
                      />
                    ) : (
                      <div
                        onClick={() => setEditingBlock(block.id)}
                        className={`px-3 py-1 text-xl font-bold ${block.hasBg ? 'bg-black/50 rounded-lg' : ''}`}
                        style={{ color: block.color }}
                      >
                        {block.text || 'Tap to edit'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Side tools */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
                <button
                  onClick={() => setActiveTool(activeTool === 'sticker' ? 'none' : 'sticker')}
                  className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center text-white border transition-colors ${activeTool === 'sticker' ? 'bg-primary border-primary' : 'bg-black/40 border-white/10 hover:bg-white/10'}`}
                >
                  <StickerIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setActiveTool(activeTool === 'draw' ? 'none' : 'draw'); setIsEraser(false); }}
                  className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center text-white border transition-colors ${activeTool === 'draw' ? 'bg-primary border-primary' : 'bg-black/40 border-white/10 hover:bg-white/10'}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={addTextBlock}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Type className="h-4 w-4" />
                </button>
              </div>

              {/* Drawing toolbar */}
              {activeTool === 'draw' && (
                <div className="absolute top-14 left-0 right-0 flex items-center justify-center gap-2 z-40 px-4">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5">
                    {TEXT_COLORS.slice(0, 8).map(c => (
                      <button key={c} onClick={() => { setDrawColor(c); setIsEraser(false); }} className="w-5 h-5 rounded-full border-2 transition-transform" style={{ backgroundColor: c, borderColor: drawColor === c && !isEraser ? 'white' : 'transparent', transform: drawColor === c && !isEraser ? 'scale(1.3)' : 'scale(1)' }} />
                    ))}
                    <div className="w-px h-5 bg-white/20 mx-1" />
                    {BRUSH_SIZES.map((_, i) => (
                      <button key={i} onClick={() => setBrushSize(i)} className={`rounded-full border-2 transition-all ${brushSize === i ? 'border-white' : 'border-white/30'}`}>
                        <Circle className="text-white" style={{ width: 8 + i * 6, height: 8 + i * 6 }} fill={brushSize === i ? 'white' : 'transparent'} />
                      </button>
                    ))}
                    <div className="w-px h-5 bg-white/20 mx-1" />
                    <button onClick={() => setIsEraser(!isEraser)} className={`p-1 rounded ${isEraser ? 'bg-white/20' : ''}`}>
                      <Eraser className="h-4 w-4 text-white" />
                    </button>
                    <button onClick={undoDraw} disabled={drawActions.length === 0} className="p-1 disabled:opacity-30">
                      <Undo2 className="h-4 w-4 text-white" />
                    </button>
                    <button onClick={redoDraw} disabled={redoStack.length === 0} className="p-1 disabled:opacity-30">
                      <Redo2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* Sticker panel */}
              {activeTool === 'sticker' && !stickerPanel && (
                <div className="absolute bottom-20 left-4 right-4 z-40">
                  <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                    <p className="text-white/60 text-xs text-center mb-3">Add to your story</p>
                    <div className="grid grid-cols-5 gap-3">
                      <button onClick={() => setStickerPanel('mention')} className="flex flex-col items-center gap-1.5">
                        <div className="w-11 h-11 rounded-full bg-blue-500/20 flex items-center justify-center"><AtSign className="h-5 w-5 text-blue-400" /></div>
                        <span className="text-white/70 text-[10px]">Mention</span>
                      </button>
                      <button onClick={() => setStickerPanel('hashtag')} className="flex flex-col items-center gap-1.5">
                        <div className="w-11 h-11 rounded-full bg-purple-500/20 flex items-center justify-center"><Hash className="h-5 w-5 text-purple-400" /></div>
                        <span className="text-white/70 text-[10px]">Hashtag</span>
                      </button>
                      <button onClick={() => addSticker('time', {})} className="flex flex-col items-center gap-1.5">
                        <div className="w-11 h-11 rounded-full bg-amber-500/20 flex items-center justify-center"><Clock className="h-5 w-5 text-amber-400" /></div>
                        <span className="text-white/70 text-[10px]">Time</span>
                      </button>
                      <button onClick={() => setStickerPanel('link')} className="flex flex-col items-center gap-1.5">
                        <div className="w-11 h-11 rounded-full bg-green-500/20 flex items-center justify-center"><Link2 className="h-5 w-5 text-green-400" /></div>
                        <span className="text-white/70 text-[10px]">Link</span>
                      </button>
                      <button onClick={() => setStickerPanel('countdown')} className="flex flex-col items-center gap-1.5">
                        <div className="w-11 h-11 rounded-full bg-pink-500/20 flex items-center justify-center"><Timer className="h-5 w-5 text-pink-400" /></div>
                        <span className="text-white/70 text-[10px]">Countdown</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sticker input panels */}
              {stickerPanel && (
                <div className="absolute bottom-20 left-4 right-4 z-40">
                  <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={() => setStickerPanel(null)} className="text-white/60 text-sm"><ChevronLeft className="h-4 w-4 inline" /> Back</button>
                      <span className="text-white text-sm font-semibold capitalize">{stickerPanel}</span>
                      <div className="w-12" />
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={stickerInput}
                        onChange={(e) => setStickerInput(e.target.value)}
                        placeholder={stickerPanel === 'mention' ? '@username' : stickerPanel === 'hashtag' ? '#hashtag' : stickerPanel === 'link' ? 'https://...' : 'Label'}
                        className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white text-sm placeholder:text-white/40 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && stickerInput.trim()) {
                            if (stickerPanel === 'mention') addSticker('mention', { username: stickerInput.replace('@', '') });
                            else if (stickerPanel === 'hashtag') addSticker('hashtag', { tag: stickerInput.replace('#', '') });
                            else if (stickerPanel === 'link') {
                              try { addSticker('link', { url: stickerInput, label: new URL(stickerInput).hostname || 'Link' }); } catch { addSticker('link', { url: stickerInput, label: 'Link' }); }
                            }
                            else if (stickerPanel === 'countdown') addSticker('countdown', { label: stickerInput });
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (!stickerInput.trim()) return;
                          if (stickerPanel === 'mention') addSticker('mention', { username: stickerInput.replace('@', '') });
                          else if (stickerPanel === 'hashtag') addSticker('hashtag', { tag: stickerInput.replace('#', '') });
                          else if (stickerPanel === 'link') {
                            try { addSticker('link', { url: stickerInput, label: new URL(stickerInput).hostname }); } catch { addSticker('link', { url: stickerInput, label: 'Link' }); }
                          }
                          else if (stickerPanel === 'countdown') addSticker('countdown', { label: stickerInput });
                        }}
                        className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Caption overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 z-30">
                {showCaptionInput ? (
                  <div className="flex items-end gap-2">
                    <Textarea
                      placeholder="Write a caption..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none text-sm rounded-xl min-h-[40px] max-h-[100px]"
                      rows={2}
                    />
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 shrink-0" onClick={() => setShowCaptionInput(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button onClick={() => setShowCaptionInput(true)} className="w-full px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm text-white/70 text-sm text-left border border-white/10">
                    {caption || 'Add a caption...'}
                  </button>
                )}
              </div>

              {/* Text block editing toolbar */}
              {editingBlock && (
                <div className="absolute top-14 left-0 right-0 flex items-center justify-center gap-2 z-40 px-4">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5">
                    {FONT_LABELS.map((label, i) => (
                      <button key={label} onClick={() => { setBlockFont(i); updateTextBlock(editingBlock, { font: i }); }} className={`px-2 py-0.5 rounded text-xs text-white ${blockFont === i ? 'bg-white/20' : ''}`} style={{ fontFamily: FONTS[i] }}>{label}</button>
                    ))}
                    <div className="w-px h-4 bg-white/20" />
                    <button onClick={() => { const a = blockAlign === 'left' ? 'center' : blockAlign === 'center' ? 'right' : 'left'; setBlockAlign(a); updateTextBlock(editingBlock, { align: a }); }}>
                      {blockAlign === 'left' ? <AlignLeft className="h-4 w-4 text-white" /> : blockAlign === 'center' ? <AlignCenter className="h-4 w-4 text-white" /> : <AlignRight className="h-4 w-4 text-white" />}
                    </button>
                    <button onClick={() => { setBlockHasBg(!blockHasBg); updateTextBlock(editingBlock, { hasBg: !blockHasBg }); }} className={`p-1 rounded ${blockHasBg ? 'bg-white/20' : ''}`}>
                      <Bold className="h-4 w-4 text-white" />
                    </button>
                    {TEXT_COLORS.slice(0, 6).map(c => (
                      <button key={c} onClick={() => updateTextBlock(editingBlock, { color: c })} className="w-4 h-4 rounded-full border" style={{ backgroundColor: c, borderColor: 'rgba(255,255,255,0.3)' }} />
                    ))}
                  </div>
                </div>
              )}
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

              <div className="absolute bottom-4 left-0 right-0 px-4">
                <div className="flex items-center gap-2 justify-center mb-3">
                  <Palette className="h-4 w-4 text-white/60" />
                  {TEXT_COLORS.map((color) => (
                    <button key={color} onClick={() => setTextColor(color)} className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110" style={{ backgroundColor: color, borderColor: textColor === color ? 'white' : 'rgba(255,255,255,0.3)', transform: textColor === color ? 'scale(1.2)' : 'scale(1)' }} />
                  ))}
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  {BG_GRADIENTS.map((grad) => (
                    <button key={grad} onClick={() => setBgGradient(grad)} className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} border-2 transition-transform hover:scale-110 ${bgGradient === grad ? 'border-white scale-110' : 'border-white/30'}`} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom sharing panel */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/10">
          {mode !== 'select' ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVisibility('public')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${visibility === 'public' ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                >
                  <Lock className="h-3 w-3" /> Your Story
                </button>
                <button
                  onClick={() => setVisibility('close_friends')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${visibility === 'close_friends' ? 'bg-green-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                >
                  <Users className="h-3 w-3" /> Close Friends
                </button>
              </div>
              <span className="text-white/30 text-[10px]">24h</span>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full justify-center">
              <Lock className="h-3 w-3 text-white/40" />
              <span className="text-white/40 text-xs">Your story will be visible for 24 hours</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
