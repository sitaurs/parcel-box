import { useState, useEffect } from 'react';
import { generateBlurPlaceholder, getOptimizedImageUrl, loadImage } from '../lib/imageOptimization';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Progressive Image Component
 * Loads images with blur-up effect and WebP optimization
 */
export function ProgressiveImage({ 
  src, 
  alt, 
  className = '', 
  onLoad,
  onError 
}: ProgressiveImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(generateBlurPlaceholder());
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadOptimizedImage = async () => {
      try {
        // Get WebP version if supported
        const optimizedSrc = getOptimizedImageUrl(src);
        
        // Preload image
        await loadImage(optimizedSrc);
        
        if (isMounted) {
          setImageSrc(optimizedSrc);
          setImageLoaded(true);
          onLoad?.();
        }
      } catch (error) {
        console.error('Image load error:', error);
        
        // Fallback to original if WebP fails
        if (isMounted) {
          try {
            await loadImage(src);
            setImageSrc(src);
            setImageLoaded(true);
            onLoad?.();
          } catch (fallbackError) {
            setImageError(true);
            onError?.();
          }
        }
      }
    };

    loadOptimizedImage();

    return () => {
      isMounted = false;
    };
  }, [src, onLoad, onError]);

  if (imageError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-200 dark:bg-gray-700`}>
        <span className="text-gray-400 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} transition-opacity duration-300 ${
        imageLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        filter: imageLoaded ? 'none' : 'blur(10px)',
        transition: 'filter 0.3s ease-out, opacity 0.3s ease-out'
      }}
    />
  );
}
