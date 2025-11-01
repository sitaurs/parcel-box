import { useState, useEffect } from 'react';
import { X, Download, Calendar, MapPin, Grid3x3, Image as ImageIcon, Share2 } from 'lucide-react';
import { getPackages, type Package } from '../lib/api';
import { getImageUrl, getPlaceholderImage } from '../lib/images';

export function Gallery() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Package | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    try {
      setLoading(true);
      const data = await getPackages({ limit: 200 });
      const withImages = data.filter(pkg => pkg.photoUrl || pkg.thumbUrl);
      setPackages(withImages);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(pkg: Package) {
    if (!pkg.photoUrl) return;
    
    try {
      const imageUrl = getImageUrl(pkg.photoUrl);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `package-${pkg.id}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image');
    }
  }

  async function handleShare(pkg: Package) {
    if (!pkg.photoUrl) {
      alert('No image available to share');
      return;
    }

    try {
      console.log('📤 Attempting to share image:', pkg.photoUrl);
      
      // Check if Web Share API is available
      if (navigator.share) {
        const imageUrl = getImageUrl(pkg.photoUrl);
        console.log('🌐 Fetching image from:', imageUrl);
        
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log('📦 Image blob size:', blob.size, 'bytes');
        
        const file = new File([blob], `package-${pkg.id}.jpg`, { type: blob.type });

        console.log('📤 Sharing via Web Share API...');
        await navigator.share({
          title: 'Smart Parcel Box - Package Photo',
          text: `Package detected on ${new Date(pkg.tsDetected).toLocaleString()}`,
          files: [file],
        });
        console.log('✅ Share successful');
      } else {
        // Fallback: Copy image URL to clipboard
        console.log('📋 Web Share API not available, copying URL to clipboard');
        const imageUrl = getImageUrl(pkg.photoUrl);
        await navigator.clipboard.writeText(imageUrl);
        alert('Image URL copied to clipboard!');
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        console.error('❌ Error sharing image:', error);
        alert(`Failed to share image: ${error.message}`);
      } else {
        console.log('ℹ️ Share cancelled by user');
      }
    }
  }

  function handleNext() {
    if (selectedIndex < packages.length - 1) {
      const nextIndex = selectedIndex + 1;
      setSelectedIndex(nextIndex);
      setSelectedImage(packages[nextIndex]);
    }
  }

  function handlePrev() {
    if (selectedIndex > 0) {
      const prevIndex = selectedIndex - 1;
      setSelectedIndex(prevIndex);
      setSelectedImage(packages[prevIndex]);
    }
  }

  function openImage(pkg: Package, index: number) {
    setSelectedImage(pkg);
    setSelectedIndex(index);
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-6 md:p-8 lg:p-10 animate-fade-in-down">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 animate-slide-in-left">
                Gallery
              </h1>
              <p className="text-white/90 text-sm md:text-base flex items-center animate-fade-in-up stagger-1">
                <ImageIcon className="w-4 h-4 mr-2 animate-bounce-slow" />
                {packages.length} photos captured
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-scale-in-center hover:animate-wiggle">
              <Grid3x3 className="w-8 h-8 text-white animate-rotate-in" />
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
              <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl shimmer" />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <ImageIcon className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 animate-fade-in-up stagger-1">No Photos Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm animate-fade-in-up stagger-2">
              Package photos will appear here once they are captured by your IoT devices
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {packages.map((pkg, index) => (
              <div
                key={pkg.id}
                onClick={() => openImage(pkg, index)}
                className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-800 shadow-sm animate-fade-in-up stagger-${(index % 8) + 1} hover:scale-105 hover:shadow-2xl hover-glow active:scale-95 transition-all duration-300`}
              >
                <img
                  src={getImageUrl(pkg.thumbUrl || pkg.photoUrl)}
                  alt="Package"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback jika gambar error
                    (e.target as HTMLImageElement).src = getPlaceholderImage();
                  }}
                />
                {/* Overlay on hover/press */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center space-x-2 text-xs mb-1">
                      <MapPin className="w-3 h-3 animate-bounce-slow" />
                      <span className="font-medium truncate">{pkg.deviceId}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs opacity-80">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(pkg.tsDetected).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black z-50 flex flex-col animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm animate-slide-in-down">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-all ripple hover:scale-110 active:scale-95 hover:rotate-90 duration-300"
            >
              <X className="w-5 h-5 text-white animate-rotate-in" />
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(selectedImage);
                }}
                className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-all ripple hover:scale-110 active:scale-95 animate-fade-in stagger-1"
              >
                <Download className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(selectedImage);
                }}
                className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-all ripple hover:scale-110 active:scale-95 animate-fade-in stagger-2"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center p-4 animate-scale-in-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageUrl(selectedImage.photoUrl || selectedImage.thumbUrl)}
              alt="Package"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                // Fallback to thumb if full photo fails
                const thumbUrl = getImageUrl(selectedImage.thumbUrl);
                if (thumbUrl && (e.target as HTMLImageElement).src !== thumbUrl) {
                  (e.target as HTMLImageElement).src = thumbUrl;
                } else {
                  (e.target as HTMLImageElement).src = getPlaceholderImage();
                }
              }}
            />
          </div>

          {/* Navigation Arrows */}
          {packages.length > 1 && (
            <>
              {selectedIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all ripple hover:scale-110 active:scale-95 animate-slide-in-left"
                >
                  <svg className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {selectedIndex < packages.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all ripple hover:scale-110 active:scale-95 animate-slide-in-right"
                >
                  <svg className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm font-medium animate-fade-in-up stagger-1 shadow-lg">
            {selectedIndex + 1} / {packages.length}
          </div>

          {/* Bottom Info Panel - Mobile */}
          <div className="md:hidden bg-black/50 backdrop-blur-sm p-4 space-y-3 animate-slide-in-up">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">Package ID</p>
                <p className="text-sm font-mono font-bold text-white truncate">
                  {selectedImage.id}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Device</p>
                  <p className="text-sm font-medium text-white truncate">{selectedImage.deviceId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="text-sm font-medium text-white truncate">
                    {new Date(selectedImage.tsDetected).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Info Panel - Desktop */}
          <div className="hidden md:block absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-2xl p-4 max-w-sm">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Package ID</p>
                <p className="text-sm font-mono font-bold text-white break-all">
                  {selectedImage.id}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Device</p>
                  <p className="text-sm font-medium text-white">{selectedImage.deviceId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <p className="text-sm font-medium text-white capitalize">{selectedImage.status}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Captured</p>
                <p className="text-sm font-medium text-white">
                  {new Date(selectedImage.tsDetected).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
