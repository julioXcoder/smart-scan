
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { CheckIcon, CloseIcon } from './Icons';
import { Spinner } from './Spinner';


const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); 
    image.src = url;
  });


async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg', 0.95);
}


interface CropModalProps {
  imageSrc: string;
  onConfirm: (croppedImage: string) => void;
  onCancel: () => void;
}

export const CropModal: React.FC<CropModalProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsCropping(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(croppedImage);
    } catch (e) {
      console.error(e);
      // Optionally show an error to the user
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex flex-col items-center justify-center z-50 p-4" aria-modal="true" role="dialog" aria-labelledby="crop-dialog-title">
        <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h2 id="crop-dialog-title" className="text-xl font-bold text-white">Adjust Crop</h2>
                <button onClick={onCancel} className="p-2 rounded-full text-gray-400 hover:bg-gray-700">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="relative flex-grow min-h-0 bg-black">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    style={{
                      containerStyle: { width: '100%', height: '100%', backgroundColor: '#000' },
                    }}
                />
            </div>

            <div className="p-4 space-y-2 border-t border-gray-700">
                <p className="text-center text-sm text-gray-400">
                    Use mouse wheel or pinch gesture to zoom and pan.
                </p>
            </div>

             <div className="p-4 bg-gray-800/50 rounded-b-2xl flex justify-end gap-3">
                <button 
                    onClick={onCancel} 
                    className="px-6 py-2 border border-gray-600 rounded-lg text-gray-200 bg-gray-700 hover:bg-gray-600 font-semibold"
                    disabled={isCropping}
                >
                  Cancel
                </button>
                <button 
                    onClick={handleConfirm}
                    disabled={isCropping}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:bg-indigo-400 disabled:cursor-wait flex items-center justify-center space-x-2"
                >
                  {isCropping ? <Spinner size="sm"/> : <CheckIcon className="w-5 h-5"/>}
                  <span>{isCropping ? 'Saving...' : 'Save Crop'}</span>
                </button>
            </div>

        </div>
    </div>
  );
};
