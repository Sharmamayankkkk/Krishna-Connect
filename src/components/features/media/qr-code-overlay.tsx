'use client';

import * as React from 'react';
import { ExternalLink, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QrOverlayProps {
  imageUrl: string;
  className?: string;
}

/**
 * QR Code overlay for images.
 * When a user hovers over an image that may contain a QR code,
 * it attempts to detect and decode the QR code using the browser's
 * BarcodeDetector API (if available), and shows a redirect button.
 */
export function QrCodeOverlay({ imageUrl, className }: QrOverlayProps) {
  const [decodedUrl, setDecodedUrl] = React.useState<string | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [hasScanned, setHasScanned] = React.useState(false);

  const handleMouseEnter = React.useCallback(async () => {
    if (hasScanned || isScanning) return;

    // Check if BarcodeDetector is available
    if (!('BarcodeDetector' in window)) return;

    setIsScanning(true);
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
      });

      // @ts-ignore - BarcodeDetector may not be in TS types yet
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const barcodes = await detector.detect(img);

      if (barcodes.length > 0) {
        const rawValue = barcodes[0].rawValue;
        // Check if the decoded value is a URL
        try {
          const url = new URL(rawValue);
          if (['http:', 'https:'].includes(url.protocol)) {
            setDecodedUrl(rawValue);
          }
        } catch {
          // Not a URL - could still display it but we only handle URLs
        }
      }
    } catch {
      // BarcodeDetector not supported or image couldn't be loaded
    } finally {
      setIsScanning(false);
      setHasScanned(true);
    }
  }, [imageUrl, hasScanned, isScanning]);

  if (!decodedUrl) {
    return (
      <div className={cn("absolute inset-0", className)} onMouseEnter={handleMouseEnter} />
    );
  }

  return (
    <div className={cn("absolute inset-0 group/qr", className)} onMouseEnter={handleMouseEnter}>
      {/* QR detected overlay - shown on hover */}
      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover/qr:opacity-100 transition-opacity duration-200 z-10">
        <a
          href={decodedUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 bg-black/80 backdrop-blur-sm text-white rounded-lg px-3 py-2.5 hover:bg-black/90 transition-colors w-full"
        >
          <QrCode className="h-4 w-4 flex-shrink-0 text-primary" />
          <span className="text-xs truncate flex-1">{decodedUrl}</span>
          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
        </a>
      </div>
    </div>
  );
}
