import { useState } from "react";
import { Pen, Upload, Check } from "lucide-react";
import SignaturePad from "./SignaturePad";
import SignatureUpload from "./SignatureUpload";

export default function SignatureInput({
  onSignatureChange,
  required = false,
  label = "Digital Signature",
  defaultMethod = "draw", // 'draw' or 'upload'
}) {
  const [method, setMethod] = useState(defaultMethod);
  const [signature, setSignature] = useState(null);

  const handleSignatureChange = (signatureData) => {
    setSignature(signatureData);
    onSignatureChange(signatureData);
  };

  const switchMethod = (newMethod) => {
    setMethod(newMethod);
    setSignature(null);
    onSignatureChange(null);
  };

  return (
    <div className="signature-input-container">
      <div className="mb-4">
        <label className="block text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em] mb-4">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {/* Method Selection Tabs - Premium Nature Style */}
        <div className="flex bg-emerald-900/5 rounded-2xl p-1.5 w-full sm:w-fit border border-emerald-900/5">
          <button
            type="button"
            onClick={() => switchMethod("draw")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              method === "draw"
                ? "bg-white text-emerald-700 shadow-md ring-1 ring-emerald-900/5"
                : "text-emerald-900/40 hover:text-emerald-900"
            }`}
          >
            <Pen className="w-3.5 h-3.5" />
            Manual Drawing
          </button>
          <button
            type="button"
            onClick={() => switchMethod("upload")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              method === "upload"
                ? "bg-white text-emerald-700 shadow-md ring-1 ring-emerald-900/5"
                : "text-emerald-900/40 hover:text-emerald-900"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            File Upload
          </button>
        </div>
      </div>

      {/* Signature Input Component */}
      <div className="signature-input-area">
        {method === "draw" ? (
          <SignaturePad
            onSignatureChange={handleSignatureChange}
            width={400}
            height={200}
            required={required}
            label=""
          />
        ) : (
          <SignatureUpload
            onSignatureChange={handleSignatureChange}
            required={required}
            label=""
            maxSize={1024 * 1024} // 1MB
          />
        )}
      </div>

      {/* Status Indicator */}
      {signature && (
        <div className="mt-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl animate-fade-in shadow-sm">
          <div className="bg-emerald-500 rounded-full p-0.5 shadow-sm">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span>Digital Identity Verified Successfully</span>
        </div>
      )}
    </div>
  );
}
