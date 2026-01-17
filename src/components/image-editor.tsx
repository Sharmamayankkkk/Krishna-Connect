'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
} from 'lucide-react';

interface ImageEditorProps {
  open: boolean;
  onClose: () => void;
  image: string;
  onSave: (newImage: string) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
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
  cropArea: CropArea;
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
  icon: string;
}

interface FilterPreset {
  name: string;
  filter: string;
  preview: string;
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
  cropArea: CropArea,
  rotation: number = 0,
  flip: FlipState = { horizontal: false, vertical: false },
  adjustments: Adjustments = { brightness: 100, contrast: 100, saturation: 100, filter: '' }
): Promise<string> => {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    const { brightness, contrast, saturation, filter } = adjustments;

    // Calculate dimensions
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const cropWidth = cropArea.width * scaleX;
    const cropHeight = cropArea.height * scaleY;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Apply rotation
    const rotRad = (rotation * Math.PI) / 180;
    ctx.translate(cropWidth / 2, cropHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-cropWidth / 2, -cropHeight / 2);

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${filter}`;

    // Draw image
    ctx.drawImage(
      image,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (error) {
    console.error('Error cropping image:', error);
    throw error;
  }
};

// Filter presets
const filterPresets: FilterPreset[] = [
  { name: 'None', filter: '', preview: '🎨' },
  { name: 'Grayscale', filter: 'grayscale(100%)', preview: '⚫' },
  { name: 'Sepia', filter: 'sepia(100%)', preview: '🟤' },
  { name: 'Vintage', filter: 'sepia(50%) contrast(110%) brightness(90%)', preview: '📷' },
  { name: 'Cool', filter: 'hue-rotate(180deg) saturate(150%)', preview: '🧊' },
  { name: 'Warm', filter: 'sepia(30%) saturate(150%) hue-rotate(-10deg)', preview: '🔥' },
  { name: 'Dramatic', filter: 'contrast(160%) saturate(120%) brightness(90%)', preview: '⚡' },
  { name: 'Fade', filter: 'contrast(85%) brightness(110%) saturate(80%)', preview: '🌫️' },
];

// Aspect ratio presets
const aspectRatios: AspectRatio[] = [
  { name: 'Free', value: null, icon: '🆓' },
  { name: 'Square', value: 1, icon: '⬛' },
  { name: '4:3', value: 4/3, icon: '📺' },
  { name: '16:9', value: 16/9, icon: '🖥️' },
  { name: '9:16', value: 9/16, icon: '📱' },
];

export function ImageEditor({ open, onClose, image, onSave }: ImageEditorProps) {
  // Crop state
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  
  // Transform state
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [flip, setFlip] = useState<FlipState>({ horizontal: false, vertical: false });
  
  // Adjustment state
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [activeFilter, setActiveFilter] = useState<string>('');
  
  // UI state
  const [activeTab, setActiveTab] = useState<string>('crop');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Save state to history
  const saveToHistory = useCallback(() => {
    const state: EditorState = {
      cropArea,
      rotation,
      zoom,
      flip,
      brightness,
      contrast,
      saturation,
      activeFilter
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [cropArea, rotation, zoom, flip, brightness, contrast, saturation, activeFilter, history, historyIndex]);

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setCropArea(prevState.cropArea);
      setRotation(prevState.rotation);
      setZoom(prevState.zoom);
      setFlip(prevState.flip);
      setBrightness(prevState.brightness);
      setContrast(prevState.contrast);
      setSaturation(prevState.saturation);
      setActiveFilter(prevState.activeFilter);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setCropArea(nextState.cropArea);
      setRotation(nextState.rotation);
      setZoom(nextState.zoom);
      setFlip(nextState.flip);
      setBrightness(nextState.brightness);
      setContrast(nextState.contrast);
      setSaturation(nextState.saturation);
      setActiveFilter(nextState.activeFilter);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Reset all
  const handleReset = () => {
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
    setRotation(0);
    setZoom(1);
    setFlip({ horizontal: false, vertical: false });
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setActiveFilter('');
    setAspectRatio(null);
  };

  // Save edited image
  const handleSave = async () => {
    try {
      setIsProcessing(true);
      setError('');

      const adjustments: Adjustments = {
        brightness,
        contrast,
        saturation,
        filter: activeFilter
      };

      const croppedImage = await getCroppedImg(
        image,
        cropArea,
        rotation,
        flip,
        adjustments
      );

      onSave(croppedImage);
      onClose();
    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error('Error saving image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download image
  const handleDownload = async () => {
    try {
      setIsProcessing(true);
      const adjustments: Adjustments = {
        brightness,
        contrast,
        saturation,
        filter: activeFilter
      };

      const croppedImage = await getCroppedImg(
        image,
        cropArea,
        rotation,
        flip,
        adjustments
      );

      const link = document.createElement('a');
      link.download = `edited-image-${Date.now()}.jpg`;
      link.href = croppedImage;
      link.click();
    } catch (err) {
      setError('Failed to download image.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Transform image style
  const getImageStyle = (): React.CSSProperties => {
    return {
      transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flip.horizontal ? -1 : 1}) scaleY(${flip.vertical ? -1 : 1})`,
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${activeFilter}`,
      transition: 'transform 0.2s ease, filter 0.2s ease'
    };
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Image Editor</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                title="Reset All"
              >
                Reset
              </Button>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mx-6 mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 flex min-h-0">
          {/* Preview Area */}
          <div className="flex-1 bg-muted/30 p-6 flex items-center justify-center overflow-hidden" ref={containerRef}>
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <img
                ref={imageRef}
                src={image}
                alt="Edit preview"
                style={getImageStyle()}
                className="max-w-full max-h-[calc(90vh-300px)] object-contain"
              />
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-80 border-l bg-background overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="w-full grid grid-cols-3 rounded-none">
                <TabsTrigger value="crop" className="gap-2">
                  <Crop className="h-4 w-4" />
                  Crop
                </TabsTrigger>
                <TabsTrigger value="adjust" className="gap-2">
                  <Sliders className="h-4 w-4" />
                  Adjust
                </TabsTrigger>
                <TabsTrigger value="filters" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Filters
                </TabsTrigger>
              </TabsList>

              <div className="p-4 space-y-6">
                <TabsContent value="crop" className="mt-0 space-y-4">
                  <div className="space-y-3">
                    <Label>Aspect Ratio</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {aspectRatios.map((ratio) => (
                        <Button
                          key={ratio.name}
                          variant={aspectRatio === ratio.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAspectRatio(ratio.value)}
                          className="flex flex-col h-auto p-2"
                        >
                          <span className="text-lg">{ratio.icon}</span>
                          <span className="text-xs mt-1">{ratio.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Zoom ({zoom.toFixed(1)}x)</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Slider
                        value={[zoom]}
                        min={0.5}
                        max={3}
                        step={0.1}
                        onValueChange={(val) => setZoom(val[0])}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rotation ({rotation}°)</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setRotation((rotation - 90) % 360)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Slider
                        value={[rotation]}
                        min={-180}
                        max={180}
                        step={1}
                        onValueChange={(val) => setRotation(val[0])}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setRotation((rotation + 90) % 360)}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Flip</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={flip.horizontal ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setFlip(prev => ({ ...prev, horizontal: !prev.horizontal }))}
                      >
                        <FlipHorizontal className="h-4 w-4 mr-2" />
                        Horizontal
                      </Button>
                      <Button
                        variant={flip.vertical ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setFlip(prev => ({ ...prev, vertical: !prev.vertical }))}
                      >
                        <FlipVertical className="h-4 w-4 mr-2" />
                        Vertical
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="adjust" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Brightness</Label>
                      <span className="text-sm text-muted-foreground">{brightness}%</span>
                    </div>
                    <Slider
                      value={[brightness]}
                      min={50}
                      max={200}
                      step={1}
                      onValueChange={(val) => setBrightness(val[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Contrast</Label>
                      <span className="text-sm text-muted-foreground">{contrast}%</span>
                    </div>
                    <Slider
                      value={[contrast]}
                      min={50}
                      max={200}
                      step={1}
                      onValueChange={(val) => setContrast(val[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Saturation</Label>
                      <span className="text-sm text-muted-foreground">{saturation}%</span>
                    </div>
                    <Slider
                      value={[saturation]}
                      min={0}
                      max={200}
                      step={1}
                      onValueChange={(val) => setSaturation(val[0])}
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setBrightness(100);
                      setContrast(100);
                      setSaturation(100);
                    }}
                  >
                    Reset Adjustments
                  </Button>
                </TabsContent>

                <TabsContent value="filters" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {filterPresets.map((preset) => (
                      <Button
                        key={preset.name}
                        variant={activeFilter === preset.filter ? 'default' : 'outline'}
                        className="h-auto flex flex-col p-3"
                        onClick={() => setActiveFilter(preset.filter)}
                      >
                        <div
                          className="w-full h-16 rounded mb-2 bg-cover bg-center border"
                          style={{
                            backgroundImage: `url(${image})`,
                            filter: preset.filter,
                          }}
                        />
                        <span className="text-xs">{preset.preview} {preset.name}</span>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={handleDownload} disabled={isProcessing}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isProcessing}>
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Apply & Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}