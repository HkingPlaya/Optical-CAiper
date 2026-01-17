import React, { useCallback } from 'react';
import { UploadCloud, X, FileImage } from 'lucide-react';
import { UploadedImage } from '../types';

interface ImageUploaderProps {
  images: UploadedImage[];
  setImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ images, setImages }) => {
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files) as File[];
      
      const newImages: UploadedImage[] = await Promise.all(
        filesArray.map(async (file) => {
          return new Promise<UploadedImage>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              // Extract base64 data without prefix for API
              const base64Data = result.split(',')[1];
              resolve({
                file,
                previewUrl: result,
                base64Data: base64Data,
                mimeType: file.type,
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );

      setImages((prev) => [...prev, ...newImages]);
    }
    // Reset the input value to allow re-uploading the same file if needed
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const isHeic = (mimeType: string) => {
    return mimeType === 'image/heic' || mimeType === 'image/heif';
  };

  return (
    <div className="space-y-4">
      <div className="relative border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
        <input
          type="file"
          multiple
          accept="image/png, image/jpeg, image/jpg, image/heic, image/heif"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileChange}
        />
        <div className="p-10 flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-blue-100 rounded-full mb-4 group-hover:bg-blue-200 transition-colors">
            <UploadCloud className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Click to upload images</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            PNG, JPG, HEIC (max 10MB each). Select multiple files to provide different angles.
          </p>
        </div>
      </div>

      {/* Thumbnails Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              {isHeic(img.mimeType) ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                  <FileImage className="w-8 h-8 text-slate-400 mb-1" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">HEIC</span>
                </div>
              ) : (
                <img
                  src={img.previewUrl}
                  alt={`upload-${index}`}
                  className="w-full h-full object-cover"
                />
              )}
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;