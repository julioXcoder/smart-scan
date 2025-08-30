
import React, { useCallback } from 'react';
import { UploadIcon, TrashIcon } from './Icons';

interface ImageUploaderProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ files, setFiles }) => {

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(event.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  const onDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if(event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        setFiles(prevFiles => [...prevFiles, ...Array.from(event.dataTransfer.files)]);
        event.dataTransfer.clearData();
    }
  }, [setFiles]);

  const onDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
  };

  return (
    <div className="space-y-4">
        <label 
            htmlFor="file-upload" 
            className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-500"
            onDrop={onDrop}
            onDragOver={onDragOver}
        >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadIcon className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 text-center"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, or WEBP</p>
            </div>
            <input id="file-upload" type="file" multiple accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleFileChange} />
        </label>
        
        {files.length > 0 && (
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Files:</h4>
                <ul className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 p-2 rounded-lg">
                            <div className="flex items-center space-x-2 overflow-hidden">
                                <img src={URL.createObjectURL(file)} alt={file.name} className="w-10 h-10 object-cover rounded-md flex-shrink-0" />
                                <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{file.name}</span>
                            </div>
                            <button onClick={() => removeFile(index)} className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
  );
};
