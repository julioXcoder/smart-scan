
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { VideoCameraIcon, CameraIcon, TrashIcon, CropIcon } from './Icons';
import { Spinner } from './Spinner';
import { CropModal } from './CropModal';

interface CameraScannerProps {
  onProcess: (base64Images: string[]) => Promise<void>;
  isProcessing: boolean;
}

interface CapturedImage {
    id: string;
    thumbnail: string;
    original: string;
}

export const RealtimeScanner: React.FC<CameraScannerProps> = ({ onProcess, isProcessing }) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [imageToRecrop, setImageToRecrop] = useState<CapturedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraOn(false);
    }
  }, []);

  const startCamera = async () => {
    stopCamera(); 
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
          } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
          setError('Camera permission denied. Please enable it in your browser settings.');
      } else {
          setError('Could not start camera. Is it used by another app or not supported?');
      }
    }
  };

  const handleTakePicture = () => {
    if (!videoRef.current) return;
    setError(null);

    const video = videoRef.current;
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = video.videoWidth;
    fullCanvas.height = video.videoHeight;
    const fullCtx = fullCanvas.getContext('2d');
    fullCtx?.drawImage(video, 0, 0, fullCanvas.width, fullCanvas.height);
    const originalImage = fullCanvas.toDataURL('image/jpeg', 0.95);

    // Auto-crop to the frame guide
    const frameCanvas = document.createElement('canvas');
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    const cropWidth = videoWidth * 0.9;
    const cropHeight = videoHeight * 0.8;
    const cropX = (videoWidth - cropWidth) / 2;
    const cropY = (videoHeight - cropHeight) / 2;

    frameCanvas.width = cropWidth;
    frameCanvas.height = cropHeight;

    const frameCtx = frameCanvas.getContext('2d');
    frameCtx?.drawImage(
      video,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    const croppedImage = frameCanvas.toDataURL('image/jpeg', 0.9);

    setCapturedImages(prev => [...prev, { id: crypto.randomUUID(), thumbnail: croppedImage, original: originalImage }]);
  };

  const handleCropConfirm = (croppedImage: string) => {
    if (!imageToRecrop) return;
    setCapturedImages(prev => prev.map(img => 
        img.id === imageToRecrop.id ? { ...img, thumbnail: croppedImage } : img
    ));
    setImageToRecrop(null);
  };

  const handleCropCancel = () => {
    setImageToRecrop(null);
  };

  const handleDeleteImage = (id: string) => {
    setCapturedImages(prev => prev.filter((img) => img.id !== id));
  };

  const handleProcessImages = async () => {
    if (capturedImages.length === 0) {
      setError("No images captured to process.");
      return;
    }
    setError(null);
    const imagesToProcess = capturedImages.map(img => img.thumbnail);
    await onProcess(imagesToProcess);
    setCapturedImages([]);
  };
  
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <>
    {imageToRecrop && (
      <CropModal
        imageSrc={imageToRecrop.original}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    )}
    <div className="space-y-4">
      <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-900/50 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isCameraOn ? 'block' : 'hidden'}`}></video>
        
        {isCameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                <div className="w-[90%] h-[80%] border-4 border-dashed border-white/70 rounded-lg shadow-lg"></div>
                <p className="absolute bottom-6 text-white font-semibold bg-black/50 px-3 py-1 rounded-md text-sm sm:text-base">Position sheet in frame</p>
            </div>
        )}

        {!isCameraOn && !isProcessing && (
          <div className="text-center p-4">
            <VideoCameraIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500"/>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Camera is off</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      
      <div className="flex">
        {!isCameraOn ? (
          <button onClick={startCamera} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors">
            <VideoCameraIcon className="w-5 h-5" />
            <span>Start Camera</span>
          </button>
        ) : (
            <button onClick={handleTakePicture} disabled={isProcessing} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed">
                <CameraIcon className="w-6 h-6"/>
                <span className="text-lg">Take Picture</span>
            </button>
        )}
      </div>
      
      {capturedImages.length > 0 && (
        <div className="space-y-3 pt-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Captured Sheets ({capturedImages.length})</h3>
            <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-2">
                <ul className="flex gap-3 overflow-x-auto pb-2">
                    {capturedImages.map((img) => (
                        <li key={img.id} className="relative flex-shrink-0 rounded-md overflow-hidden shadow-md group">
                            <img src={img.thumbnail} alt={`Capture ${img.id}`} className="h-24 w-auto object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => setImageToRecrop(img)}
                                    className="bg-white/80 text-gray-800 rounded-full p-2 hover:bg-white transition-colors"
                                    aria-label="Edit crop"
                                >
                                    <CropIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteImage(img.id)} 
                                    className="bg-white/80 text-red-600 rounded-full p-2 hover:bg-white transition-colors"
                                    aria-label="Delete image"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <button
              onClick={handleProcessImages}
              disabled={isProcessing}
              className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-green-800 disabled:cursor-not-allowed flex items-center justify-center transition-colors mt-2"
            >
              {isProcessing ? <Spinner /> : `Process ${capturedImages.length} Captured Image(s)`}
            </button>
        </div>
      )}
    </div>
    </>
  );
};
