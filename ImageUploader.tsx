import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Crop, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ImageUploaderProps {
  onImageUpload: (base64: string) => void;
  currentImage?: string;
  maxSize?: number; // بالميجابايت
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, currentImage, maxSize = 5 }) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isCropping, setIsCropping] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropData, setCropData] = useState({ x: 0, y: 0, width: 200, height: 200 });

  // معالجة اختيار الملف
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من حجم الملف
    if (file.size > maxSize * 1024 * 1024) {
      setMessage({ type: 'error', text: `حجم الملف يجب أن يكون أقل من ${maxSize}MB` });
      return;
    }

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'يجب أن تختار صورة' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreview(result);
      setIsCropping(true);
      setMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // ضغط الصورة
  const compressImage = (base64: string, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // حساب الأبعاد الجديدة
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = base64;
    });
  };

  // حفظ الصورة المقصوصة
  const saveCroppedImage = async () => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cropData.width;
    canvas.height = cropData.height;

    ctx.drawImage(
      imageRef.current,
      cropData.x,
      cropData.y,
      cropData.width,
      cropData.height,
      0,
      0,
      cropData.width,
      cropData.height
    );

    const croppedImage = canvas.toDataURL('image/jpeg');
    const compressedImage = await compressImage(croppedImage);
    
    onImageUpload(compressedImage);
    setIsCropping(false);
    setMessage({ type: 'success', text: 'تم رفع الصورة بنجاح' });
  };

  // تحميل الصورة
  const downloadImage = () => {
    if (!preview) return;
    const link = document.createElement('a');
    link.href = preview;
    link.download = `image-${Date.now()}.jpg`;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* رسالة التنبيه */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span className="text-sm font-bold">{message.text}</span>
        </motion.div>
      )}

      {/* منطقة الرفع */}
      {!preview ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto mb-3 text-slate-400" size={32} />
          <p className="font-bold text-slate-700 dark:text-slate-300">اسحب الصورة هنا أو انقر للاختيار</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">الحد الأقصى للحجم: {maxSize}MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>
      ) : !isCropping ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
            <img src={preview} alt="Preview" className="w-full h-auto max-h-96 object-contain" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPreview(null)}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <X size={18} />
              حذف
            </button>
            <button
              onClick={() => setIsCropping(true)}
              className="flex-1 px-4 py-2 bg-accent hover:bg-accent/90 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Crop size={18} />
              قص
            </button>
            <button
              onClick={downloadImage}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} />
              تحميل
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
            <img
              ref={imageRef}
              src={preview}
              alt="Crop"
              className="w-full h-auto max-h-96 object-contain"
            />
            <div
              className="absolute border-2 border-accent cursor-move"
              style={{
                left: `${cropData.x}px`,
                top: `${cropData.y}px`,
                width: `${cropData.width}px`,
                height: `${cropData.height}px`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
              }}
              onMouseDown={(e) => {
                const startX = e.clientX - cropData.x;
                const startY = e.clientY - cropData.y;
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  setCropData(prev => ({
                    ...prev,
                    x: Math.max(0, moveEvent.clientX - startX),
                    y: Math.max(0, moveEvent.clientY - startY)
                  }));
                };
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                });
              }}
            />
          </div>

          {/* أدوات التحكم في القص */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">العرض</label>
              <input
                type="number"
                value={cropData.width}
                onChange={(e) => setCropData(prev => ({ ...prev, width: Math.max(50, parseInt(e.target.value)) }))}
                className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الارتفاع</label>
              <input
                type="number"
                value={cropData.height}
                onChange={(e) => setCropData(prev => ({ ...prev, height: Math.max(50, parseInt(e.target.value)) }))}
                className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsCropping(false)}
              className="flex-1 px-4 py-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-white font-bold rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={saveCroppedImage}
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors"
            >
              حفظ
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </div>
  );
};

export default ImageUploader;
