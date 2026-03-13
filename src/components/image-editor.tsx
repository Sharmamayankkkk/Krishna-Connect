'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RotateCcw,
  RotateCw,
  Check,
  X,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Sliders,
  Sparkles,
  Download,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  Maximize2,
  Square,
  Monitor,
  Tv2,
  Smartphone,
  RefreshCw,
  Sun,
  Contrast,
  Droplets,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';

interface ImageEditorProps {
  open: boolean;
  onClose: () => void;
  image: string;
  onSave: (newImage: string) => void;
}

interface FlipState {
  horizontal: boolean;
  vertical: boolean;
}

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  filter: string;
}

interface EditorState {
  rotation: number;
  zoom: number;
  flip: FlipState;
  brightness: number;
  contrast: number;
  saturation: number;
  activeFilter: string;
}

interface AspectRatio {
  name: string;
  value: number | null;
  icon: React.ReactNode;
}

interface FilterPreset {
  name: string;
  filter: string;
}

// Image processing utilities
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  rotation: number = 0,
  flip: FlipState = { horizontal: false, vertical: false },
  adjustments: Adjustments = { brightness: 100, contrast: 100, saturation: 100, filter: '' }
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  const nw = image.naturalWidth;
  const nh = image.naturalHeight;

  // Compute the axis-aligned bounding box of the rotated image so nothing gets clipped
  const rad = (rotation * Math.PI) / 180;
  const absCos = Math.abs(Math.cos(rad));
  const absSin = Math.abs(Math.sin(rad));
  const canvasW = Math.round(nw * absCos + nh * absSin);
  const canvasH = Math.round(nw * absSin + nh * absCos);

  canvas.width = canvasW;
  canvas.height = canvasH;

  const { brightness, contrast, saturation, filter } = adjustments;
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)${filter ? ` ${filter}` : ''}`;

  // Rotate & flip around the canvas centre, then draw image centred
  ctx.translate(canvasW / 2, canvasH / 2);
  ctx.rotate(rad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.drawImage(image, -nw / 2, -nh / 2, nw, nh);

  return canvas.toDataURL('image/jpeg', 0.95);
};

// Filter presets — no emojis
const filterPresets: FilterPreset[] = [
  { name: 'None', filter: '' },
  { name: 'Grayscale', filter: 'grayscale(100%)' },
  { name: 'Sepia', filter: 'sepia(100%)' },
  { name: 'Vintage', filter: 'sepia(50%) contrast(110%) brightness(90%)' },
  { name: 'Cool', filter: 'hue-rotate(180deg) saturate(150%)' },
  { name: 'Warm', filter: 'sepia(30%) saturate(150%) hue-rotate(-10deg)' },
  { name: 'Dramatic', filter: 'contrast(160%) saturate(120%) brightness(90%)' },
  { name: 'Fade', filter: 'contrast(85%) brightness(110%) saturate(80%)' },
];

// Aspect ratios — Lucide icons
const aspectRatios: AspectRatio[] = [
  { name: 'Free', value: null, icon: <Maximize2 className="h-4 w-4" /> },
  { name: '1:1', value: 1, icon: <Square className="h-4 w-4" /> },
  { name: '4:3', value: 4 / 3, icon: <Monitor className="h-4 w-4" /> },
  { name: '16:9', value: 16 / 9, icon: <Tv2 className="h-4 w-4" /> },
  { name: '9:16', value: 9 / 16, icon: <Smartphone className="h-4 w-4" /> },
];

export function ImageEditor({ open, onClose, image, onSave }: ImageEditorProps) {
  const { t } = useTranslation();

  const [rotation, setRotation] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null); // UI selection only
  const [zoom, setZoom] = useState<number>(1);
  const [flip, setFlip] = useState<FlipState>({ horizontal: false, vertical: false });
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('crop');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const saveToHistory = useCallback(() => {
    const state: EditorState = { rotation, zoom, flip, brightness, contrast, saturation, activeFilter };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [rotation, zoom, flip, brightness, contrast, saturation, activeFilter, history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setRotation(prev.rotation); setZoom(prev.zoom);
      setFlip(prev.flip); setBrightness(prev.brightness); setContrast(prev.contrast);
      setSaturation(prev.saturation); setActiveFilter(prev.activeFilter);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setRotation(next.rotation); setZoom(next.zoom);
      setFlip(next.flip); setBrightness(next.brightness); setContrast(next.contrast);
      setSaturation(next.saturation); setActiveFilter(next.activeFilter);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleReset = () => {
    setRotation(0); setZoom(1);
    setFlip({ horizontal: false, vertical: false });
    setBrightness(100); setContrast(100); setSaturation(100);
    setActiveFilter(''); setAspectRatio(null);
  };

  const handleSave = async () => {
    try {
      setIsProcessing(true); setError('');
      const adj: Adjustments = { brightness, contrast, saturation, filter: activeFilter };
      const result = await getCroppedImg(image, rotation, flip, adj);
      onSave(result); onClose();
    } catch {
      setError('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsProcessing(true);
      const adj: Adjustments = { brightness, contrast, saturation, filter: activeFilter };
      const result = await getCroppedImg(image, rotation, flip, adj);
      const link = document.createElement('a');
      link.download = `edited-image-${Date.now()}.jpg`;
      link.href = result;
      link.click();
    } catch {
      setError('Failed to download image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getImageStyle = (): React.CSSProperties => ({
    transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flip.horizontal ? -1 : 1}) scaleY(${flip.vertical ? -1 : 1})`,
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${activeFilter}`,
    transition: 'transform 0.2s ease, filter 0.2s ease',
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-full sm:max-w-6xl h-[100dvh] sm:h-[90vh] flex flex-col p-0 gap-0 rounded-none sm:rounded-xl overflow-hidden">

        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-base sm:text-lg font-semibold">{t('common.editImage')}</DialogTitle>
            <DialogDescription className="sr-only">{t('common.editorToCropAdjustAndApply')}</DialogDescription>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={historyIndex <= 0} title={t('common.undo')}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={historyIndex >= history.length - 1} title={t('common.redo')}>
                <Redo className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset} title={t('common.resetAll')}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mx-4 sm:mx-6 mt-3 flex-shrink-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Body */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">

          {/* Preview */}
          <div
            ref={containerRef}
            className="h-52 sm:h-auto sm:flex-1 bg-muted/30 flex items-center justify-center overflow-hidden border-b sm:border-b-0 sm:border-r"
          >
            <img
              ref={imageRef}
              src={image}
              alt={t('common.editPreview')}
              style={getImageStyle()}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Controls */}
          <div className="w-full sm:w-80 flex flex-col min-h-0 bg-background overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">

              <TabsList className="flex-shrink-0 w-full grid grid-cols-3 rounded-none h-11 border-b">
                <TabsTrigger value="crop" className="gap-1.5 text-xs sm:text-sm">
                  <Crop className="h-3.5 w-3.5" />{t('common.crop')}</TabsTrigger>
                <TabsTrigger value="adjust" className="gap-1.5 text-xs sm:text-sm">
                  <Sliders className="h-3.5 w-3.5" />{t('common.adjust')}</TabsTrigger>
                <TabsTrigger value="filters" className="gap-1.5 text-xs sm:text-sm">
                  <Sparkles className="h-3.5 w-3.5" />{t('common.filters')}</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-5">

                  {/* CROP */}
                  <TabsContent value="crop" className="mt-0 space-y-5">

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('common.aspectRatio')}</Label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {aspectRatios.map((ratio) => (
                          <Button
                            key={ratio.name}
                            variant={aspectRatio === ratio.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAspectRatio(ratio.value)}
                            className="flex flex-col h-auto py-2 px-1 gap-1"
                          >
                            {ratio.icon}
                            <span className="text-[10px] leading-none">{ratio.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('common.zoom')}</Label>
                        <span className="text-xs tabular-nums text-muted-foreground">{zoom.toFixed(1)}×</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                          onClick={() => setZoom(Math.max(0.5, parseFloat((zoom - 0.1).toFixed(1))))}>
                          <ZoomOut className="h-3.5 w-3.5" />
                        </Button>
                        <Slider value={[zoom]} min={0.5} max={3} step={0.1}
                          onValueChange={(val) => setZoom(val[0])} className="flex-1" />
                        <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                          onClick={() => setZoom(Math.min(3, parseFloat((zoom + 0.1).toFixed(1))))}>
                          <ZoomIn className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('common.rotation')}</Label>
                        <span className="text-xs tabular-nums text-muted-foreground">{rotation}°</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                          onClick={() => setRotation((rotation - 90) % 360)} title="Rotate left 90°">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Slider value={[rotation]} min={-180} max={180} step={1}
                          onValueChange={(val) => setRotation(val[0])} className="flex-1" />
                        <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                          onClick={() => setRotation((rotation + 90) % 360)} title="Rotate right 90°">
                          <RotateCw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('common.flip')}</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={flip.horizontal ? 'default' : 'outline'}
                          className="flex-1 gap-2 h-9 text-sm"
                          onClick={() => setFlip(prev => ({ ...prev, horizontal: !prev.horizontal }))}
                        >
                          <FlipHorizontal className="h-4 w-4" />{t('common.horizontal')}</Button>
                        <Button
                          variant={flip.vertical ? 'default' : 'outline'}
                          className="flex-1 gap-2 h-9 text-sm"
                          onClick={() => setFlip(prev => ({ ...prev, vertical: !prev.vertical }))}
                        >
                          <FlipVertical className="h-4 w-4" />{t('common.vertical')}</Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ADJUST */}
                  <TabsContent value="adjust" className="mt-0 space-y-5">

                    {[
                      { label: 'Brightness', icon: <Sun className="h-3.5 w-3.5 text-muted-foreground" />, value: brightness, min: 50, max: 200, onChange: setBrightness },
                      { label: 'Contrast', icon: <Contrast className="h-3.5 w-3.5 text-muted-foreground" />, value: contrast, min: 50, max: 200, onChange: setContrast },
                      { label: 'Saturation', icon: <Droplets className="h-3.5 w-3.5 text-muted-foreground" />, value: saturation, min: 0, max: 200, onChange: setSaturation },
                    ].map(({ label, icon, value, min, max, onChange }) => (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {icon}
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
                          </div>
                          <span className="text-xs tabular-nums text-muted-foreground">{value}%</span>
                        </div>
                        <Slider value={[value]} min={min} max={max} step={1}
                          onValueChange={(val) => onChange(val[0])} />
                      </div>
                    ))}

                    <Button variant="outline" size="sm" className="w-full gap-2"
                      onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}>
                      <RefreshCw className="h-3.5 w-3.5" />{t('common.resetAdjustments')}</Button>
                  </TabsContent>

                  {/* FILTERS */}
                  <TabsContent value="filters" className="mt-0">
                    <div className="grid grid-cols-2 gap-2">
                      {filterPresets.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => setActiveFilter(preset.filter)}
                          className={cn(
                            "flex flex-col rounded-lg overflow-hidden border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            activeFilter === preset.filter
                              ? "border-primary ring-1 ring-primary/30"
                              : "border-transparent hover:border-border"
                          )}
                        >
                          <div
                            className="w-full aspect-video bg-cover bg-center"
                            style={{ backgroundImage: `url(${image})`, filter: preset.filter || 'none' }}
                          />
                          <div className={cn(
                            "px-2 py-1.5 text-xs font-medium text-center transition-colors",
                            activeFilter === preset.filter
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/40 text-muted-foreground"
                          )}>
                            {preset.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                </div>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 px-4 sm:px-6 py-3 border-t bg-background">
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload} disabled={isProcessing}>
              <Download className="h-4 w-4" />{t('media.download')}</Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-2" onClick={onClose} disabled={isProcessing}>
                <X className="h-4 w-4" />{t('common.cancel')}</Button>
              <Button size="sm" className="flex-1 sm:flex-none gap-2" onClick={handleSave} disabled={isProcessing}>
                {isProcessing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
                ) : (
                  <><Check className="h-4 w-4" />{t('common.applySave')}</>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}