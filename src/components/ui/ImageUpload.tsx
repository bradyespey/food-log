import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

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
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
  className,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select only image files';
    }
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${Math.round(maxSizeBytes / (1024 * 1024))}MB`;
    }
    return null;
  }, [maxSizeBytes]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        setError(error);
        return;
      }
      
      if (images.length + validFiles.length >= maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        break;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      onImagesChange([...images, ...validFiles]);
    }
  }, [images, maxImages, onImagesChange, validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [disabled, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer',
          isDragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-300 bg-red-50'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && document.getElementById('image-input')?.click()}
      >
        <input
          id="image-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <Upload className={cn(
            'mx-auto h-8 w-8',
            isDragOver ? 'text-primary-600' : 'text-gray-400'
          )} />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, WebP up to {Math.round(maxSizeBytes / (1024 * 1024))}MB each (max {maxImages} photos)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((file, index) => (
            <ImagePreview
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => removeImage(index)}
              formatFileSize={formatFileSize}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
  formatFileSize: (bytes: number) => string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ file, onRemove, formatFileSize }) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative group animate-fade-in">
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Remove Button */}
      <Button
        variant="danger"
        size="sm"
        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
      
      {/* File Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
        <div className="truncate">{formatFileSize(file.size)}</div>
      </div>
    </div>
  );
};

export default ImageUpload;
