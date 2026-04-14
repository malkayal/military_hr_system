import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Camera, X, CheckCircle2, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';

interface BarcodeScannerProps {
  onScan: (data: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, isOpen, onClose }) => {
  const [scanMode, setScanMode] = useState<'camera' | 'manual' | 'generate'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [generatedQR, setGeneratedQR] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // بدء كاميرا الجهاز
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setScanMode('camera');
    } catch (err) {
      setMessage({ type: 'error', text: 'لم يتمكن من الوصول إلى الكاميرا' });
    }
  };

  // إيقاف الكاميرا
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // معالجة المدخل اليدوي
  const handleManualScan = () => {
    if (manualInput.trim()) {
      onScan(manualInput);
      setManualInput('');
      setMessage({ type: 'success', text: 'تم المسح بنجاح' });
      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 1500);
    }
  };

  // توليد رمز QR
  const generateQRCode = async (data: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setGeneratedQR(qrDataUrl);
      setMessage({ type: 'success', text: 'تم توليد رمز QR بنجاح' });
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل توليد رمز QR' });
    }
  };

  // تحميل رمز QR
  const downloadQRCode = () => {
    if (generatedQR) {
      const link = document.createElement('a');
      link.href = generatedQR;
      link.download = `qrcode-${Date.now()}.png`;
      link.click();
    }
  };

  // التقاط صورة من الكاميرا
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/png');
        // هنا يمكن إرسال الصورة إلى خادم لقراءة الباركود
        setMessage({ type: 'success', text: 'تم التقاط الصورة بنجاح' });
      }
    }
  };

  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, scanMode]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl"
      >
        {/* رأس الحوار */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <QrCode className="text-accent" size={24} />
            <h2 className="text-xl font-black text-slate-800 dark:text-white">ماسح الباركود</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* رسالة التنبيه */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg mb-4 flex items-center gap-2 ${
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

        {/* علامات التبويب */}
        <div className="flex gap-2 mb-6 border-b dark:border-slate-700">
          {(['camera', 'manual', 'generate'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setScanMode(mode)}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
                scanMode === mode
                  ? 'border-accent text-accent'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {mode === 'camera' && 'الكاميرا'}
              {mode === 'manual' && 'إدخال يدوي'}
              {mode === 'generate' && 'توليد'}
            </button>
          ))}
        </div>

        {/* محتوى الكاميرا */}
        {scanMode === 'camera' && (
          <div className="space-y-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-black rounded-lg object-cover"
            />
            <canvas ref={canvasRef} className="hidden" width={640} height={480} />
            <button
              onClick={captureImage}
              className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Camera size={20} />
              التقاط صورة
            </button>
          </div>
        )}

        {/* محتوى الإدخال اليدوي */}
        {scanMode === 'manual' && (
          <div className="space-y-4">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
              placeholder="أدخل رقم الباركود أو معرف الفرد"
              className="w-full px-4 py-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              autoFocus
            />
            <button
              onClick={handleManualScan}
              className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 rounded-lg transition-colors"
            >
              تأكيد المسح
            </button>
          </div>
        )}

        {/* محتوى التوليد */}
        {scanMode === 'generate' && (
          <div className="space-y-4">
            <input
              type="text"
              onChange={(e) => generateQRCode(e.target.value)}
              placeholder="أدخل البيانات المراد تحويلها إلى QR"
              className="w-full px-4 py-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            />
            {generatedQR && (
              <div className="flex flex-col items-center gap-4">
                <img src={generatedQR} alt="QR Code" className="w-48 h-48 border-2 border-accent rounded-lg p-2" />
                <button
                  onClick={downloadQRCode}
                  className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  تحميل الصورة
                </button>
              </div>
            )}
          </div>
        )}

        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 border dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          إغلاق
        </button>
      </motion.div>
    </motion.div>
  );
};

export default BarcodeScanner;
