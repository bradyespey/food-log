//src/components/ui/ImageUpload.tsx

import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImagesChange: (images: File[]) => void;
  images: File[];
  maxImages?: number;
  maxSizeBytes?: number;
  className?: string;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImagesChange, 
  images, 
  maxImages = 5, 
  maxSizeBytes = 10 * 1024 * 1024, 
  className = '', 
  disabled = false 
}) => {
  const [error, setError] = useState<string>('');

  const validateFiles = useCallback((files: FileList | File[]): File[] => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload only image files');
        continue;
      }
      
      if (file.size > maxSizeBytes) {
        setError(`File ${file.name} is too large. Maximum size is ${Math.round(maxSizeBytes / 1024 / 1024)}MB`);
        continue;
      }
      
      if (images.length + validFiles.length >= maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        break;
      }
      
      validFiles.push(file);
    }
    
    return validFiles;
  }, [images.length, maxImages, maxSizeBytes]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setError('');
    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      onImagesChange([...images, ...validFiles]);
    }
    
    // Reset input
    e.target.value = '';
  }, [images, onImagesChange, validateFiles]);

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    setError('');
  }, [images, onImagesChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div className="relative">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled || images.length >= maxImages}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          disabled || images.length >= maxImages
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
        }`}>
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {images.length >= maxImages 
              ? `Maximum ${maxImages} images reached`
              : 'Drop images here or click to select'
            }
          </p>
          <p className="text-xs text-gray-500">
            Max {maxImages} images, up to {Math.round(maxSizeBytes / 1024 / 1024)}MB each
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                {file.type.startsWith('image/') ? (
                  <img
                    src={(file as any).preview || URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
              <p className="mt-1 text-xs text-gray-500 truncate">
                {file.name} ({formatFileSize(file.size)})
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;