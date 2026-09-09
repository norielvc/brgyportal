import { useState, useRef } from "react";
import {
  Upload,
  X,
  Check,
  Image as ImageIcon,
  Info,
  AlertCircle,
} from "lucide-react";

export default function SignatureUpload({
  onSignatureChange,
  required = false,
  label = "Upload Signature",
  maxSize = 1024 * 1024, // 1MB default
  acceptedFormats = ["image/png", "image/jpeg", "image/jpg"],
}) {
  const [signature, setSignature] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return false;

    // Check file size
    if (file.size > maxSize) {
      setError(
        `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
      );
      return false;
    }

    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      setError("Please upload a PNG or JPEG image");
      return false;
    }

    setError("");
    return true;
  };

  const handleFileSelect = (file) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      setSignature(file);
      setPreview(result);
      onSignatureChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeSignature = () => {
    setSignature(null);
    setPreview(null);
    setError("");
    onSignatureChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="signature-upload-container space-y-4">
      {label && (
        <label className="block text-[10px] font-black text-emerald-900/60 uppercase tracking-[0.2em] ml-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        onChange={handleFileInput}
        className="hidden"
      />

      {!preview ? (
        <div
          className={`relative border-2 border-dashed rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center cursor-pointer transition-all duration-300 group overflow-hidden ${
            isDragging
              ? "border-emerald-500 bg-emerald-100/50 shadow-emerald-900/10"
              : "border-emerald-900/10 hover:border-emerald-500/40 bg-emerald-50/20 hover:bg-emerald-50/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          {/* Decorative element */}
          <div
            className={`absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl transition-transform duration-700 ${isDragging ? "scale-150" : "group-hover:scale-110"}`}
          ></div>

          <div className="flex flex-col items-center gap-3 sm:gap-4 relative z-10">
            <div
              className={`w-11 h-11 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm border border-emerald-900/5 transition-all duration-500 ${isDragging ? "rotate-12 scale-110" : "group-hover:-translate-y-0.5 group-hover:shadow-md"}`}
            >
              <Upload
                className={`w-5 h-5 sm:w-6 sm:h-6 ${isDragging ? "text-emerald-600" : "text-emerald-900/40 group-hover:text-emerald-600"}`}
              />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wider leading-tight">
                {isDragging ? "RELEASE TO STORE" : "ATTACH SIGNATURE ASSET"}
              </p>
              <p className="text-[9px] sm:text-[10px] text-emerald-800/50 font-bold uppercase tracking-wider mt-1">
                PNG, JPG or JPEG • MAX {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-emerald-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-emerald-50/30 animate-scale-in relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative z-10">
            <div className="relative group/preview shrink-0">
              <img
                src={preview}
                alt="Signature preview"
                className="w-28 h-16 sm:w-32 sm:h-20 object-contain border border-emerald-900/5 rounded-xl bg-white shadow-sm p-2 transition-transform duration-500 group-hover/preview:scale-105"
              />
              <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg border-2 border-white">
                <Check className="w-3 h-3" />
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 leading-none">
                  ASSET VERIFIED
                </span>
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-sm"></div>
              </div>
              <p className="text-xs font-black text-emerald-950 truncate uppercase tracking-tight">
                {signature?.name}
              </p>
              <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest mt-1">
                MEM: {signature && `${Math.round(signature.size / 1024)} KB`}
              </p>
            </div>

            <button
              type="button"
              onClick={removeSignature}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white border-2 border-rose-100 text-rose-300 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-sm active:scale-90 shrink-0"
              title="Remove signature"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-4 py-3 rounded-xl animate-shake">
          <AlertCircle className="w-4 h-4" />
          <span className="uppercase tracking-widest">{error}</span>
        </div>
      )}

      {required && !preview && (
        <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 ml-1 mt-1 opacity-60">
          <Info className="w-3.5 h-3.5" />
          FILE UPLOAD IS MANDATORY
        </div>
      )}

      <style jsx>{`
        .animate-scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes shake {
          10%,
          90% {
            transform: translate3d(-1px, 0, 0);
          }
          20%,
          80% {
            transform: translate3d(2px, 0, 0);
          }
          30%,
          50%,
          70% {
            transform: translate3d(-4px, 0, 0);
          }
          40%,
          60% {
            transform: translate3d(4px, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}
