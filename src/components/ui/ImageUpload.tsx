//src/components/ui/ImageUpload.tsx

import React, { useCallback, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

function ImagePreviewItem({
  file,
  index,
  onRemove,
  formatFileSize,
}: {
  file: File;
  index: number;
  onRemove: () => void;
  formatFileSize: (bytes: number) => string;
}) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const url = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  const showImg = file.type.startsWith('image/') && url && !previewFailed;

  return (
    <div className="relative group">
      <div className="aspect-square rounded-lg overflow-hidden border border-border bg-secondary">
        {showImg ? (
          <img
            src={url}
            alt={`Preview ${index + 1}`}
            className="w-full h-full object-cover"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
            <ImageIcon className="w-8 h-8 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground text-center leading-tight">
              Preview unavailable
            </span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-7 h-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-sm"
      >
        <X className="w-3 h-3" />
      </button>
      <p className="mt-1 text-xs text-muted-foreground truncate">
        {file.name} ({formatFileSize(file.size)})
      </p>
    </div>
  );
}

interface ImageUploadProps {
  onImagesChange: (images: File[]) => void;
  images: File[];
  maxImages?: number;
  maxSizeBytes?: number;
  className?: string;
  disabled?: boolean;
}

function isHeic(file: File): boolean {
  const t = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return t === 'image/heic' || t === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif');
}

/** Convert HEIC/HEIF to JPEG. Read file into memory first. Retry once for Photos "recent" files that may not be ready immediately. */
async function convertHeicToJpeg(file: File, retried = false): Promise<File | null> {
  try {
    let buf: ArrayBuffer;
    try {
      buf = await file.arrayBuffer();
    } catch {
      if (!retried) {
        await new Promise((r) => setTimeout(r, 400));
        return convertHeicToJpeg(file, true);
      }
      return null;
    }
    if (buf.byteLength === 0) {
      if (!retried) {
        await new Promise((r) => setTimeout(r, 400));
        return convertHeicToJpeg(file, true);
      }
      return null;
    }
    const blob = new Blob([buf], { type: file.type || 'image/heic' });
    let result: Blob | Blob[];
    try {
      const { default: heic2any } = await import('heic2any');
      result = await heic2any({ blob, toType: 'image/jpeg', quality: 0.9 });
    } catch {
      if (!retried) {
        await new Promise((r) => setTimeout(r, 400));
        return convertHeicToJpeg(file, true);
      }
      return null;
    }
    const jpegBlob = Array.isArray(result) ? result[0] : result;
    if (!jpegBlob || !(jpegBlob instanceof Blob)) return null;
    const baseName = file.name.replace(/\.[^.]+$/i, '') || 'image';
    return new File([jpegBlob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch {
    return null;
  }
}

/** Mac Photos: files can report size 0 or no type. Read bytes and replace with a real File so preview/analyze work. */
async function materializeFile(file: File): Promise<File | null> {
  const needsRead = file.size === 0 || !file.type;
  if (!needsRead) return file;
  try {
    const buf = await file.arrayBuffer();
    if (buf.byteLength === 0) return null;
    const baseName = file.name.replace(/\.[^.]+$/i, '') || 'image';
    const type = file.type || 'image/jpeg';
    return new File([buf], type.startsWith('image/') ? file.name : `${baseName}.jpg`, { type: type || 'image/jpeg' });
  } catch {
    return null;
  }
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
  const [isConverting, setIsConverting] = useState(false);

  const validateFiles = useCallback((files: FileList | File[]): File[] => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of fileArray) {
      if (file.type && !file.type.startsWith('image/')) {
        setError('Please upload only image files');
        continue;
      }
      // Allow size 0 / no type so we can try to materialize (e.g. Mac Photos drag)
      
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

  const addFiles = useCallback(async (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setError('');
    setIsConverting(true);
    const out: File[] = [];
    try {
      for (const file of newFiles) {
        let f: File | null;
        if (isHeic(file)) {
          f = await convertHeicToJpeg(file);
        } else {
          f = await materializeFile(file);
        }
        if (f && f.size > 0) out.push(f);
      }
      if (out.length === 0 && newFiles.length > 0) {
        setError('Couldn’t read this photo (common with the newest photos in Photos). Try Copy (⌘C) in Photos then Paste (⌘V) here, or try another photo.');
        return;
      }
      if (out.length > 0) {
        onImagesChange([...images, ...out]);
      }
    } finally {
      setIsConverting(false);
    }
  }, [images, onImagesChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const validFiles = validateFiles(files);
    e.target.value = '';
    if (validFiles.length > 0) addFiles(validFiles);
  }, [validateFiles, addFiles]);

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
    <div className={`space-y-3 ${className}`}>
      {/* Upload Area */}
      <div
        className="relative"
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (disabled || images.length >= maxImages || isConverting) return;
          const files = e.dataTransfer?.files;
          if (!files?.length) return;
          const validFiles = validateFiles(files);
          if (validFiles.length > 0) addFiles(validFiles);
        }}
      >
        <input
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          onChange={handleFileSelect}
          disabled={disabled || images.length >= maxImages || isConverting}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className={`border border-dashed rounded-lg p-4 sm:p-5 text-center transition-colors ${
          disabled || images.length >= maxImages || isConverting
            ? 'border-border bg-secondary/50 cursor-not-allowed'
            : 'border-border bg-card/70 hover:border-primary hover:bg-secondary cursor-pointer'
        }`}>
          {isConverting ? (
            <>
              <Loader2 className="mx-auto h-8 w-8 text-primary animate-spin" />
              <p className="mt-2 text-sm text-foreground">
                Converting HEIC to JPEG…
              </p>
              <p className="text-xs text-muted-foreground">
                This may take a few seconds
              </p>
            </>
          ) : (
            <>
              <Upload className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-2 text-sm font-medium text-foreground">
                {images.length >= maxImages 
                  ? `Maximum ${maxImages} images reached`
                  : 'Drop images here or click to select'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxImages} images, up to {Math.round(maxSizeBytes / 1024 / 1024)}MB each
              </p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                If the newest photos don’t work when dragged, Copy (⌘C) in Photos then Paste (⌘V) here
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((file, index) => (
            <ImagePreviewItem
              key={index}
              file={file}
              index={index}
              onRemove={() => removeImage(index)}
              formatFileSize={formatFileSize}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
