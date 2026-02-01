'use client';

import { useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

interface ScreenshotViewerProps {
  screenshotUrl: string;
  alt?: string;
  className?: string;
}

export function ScreenshotViewer({
  screenshotUrl,
  alt = 'Screenshot',
  className,
}: ScreenshotViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = screenshotUrl;
    link.download = 'screenshot.png';
    link.click();
  };

  return (
    <>
      {/* Thumbnail View */}
      <div
        className={cn(
          'relative group rounded-lg overflow-hidden border cursor-pointer',
          className
        )}
        onClick={() => setIsFullscreen(true)}
      >
        <Image
          src={screenshotUrl}
          alt={alt}
          width={800}
          height={600}
          className="w-full h-auto object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-background/90 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm">
              <Maximize2 className="h-4 w-4" />
              <span>Click to expand</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            {/* Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetZoom();
                }}
              >
                {Math.round(zoom * 100)}%
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-2" />
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreen(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Image */}
            <motion.div
              className="overflow-auto max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                src={screenshotUrl}
                alt={alt}
                className="cursor-move"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                drag
                dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
