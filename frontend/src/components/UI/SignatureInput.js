import { useState } from "react";
import { Upload, Check } from "lucide-react";
import SignatureUpload from "./SignatureUpload";

export default function SignatureInput({
  onSignatureChange,
  required = false,
  label = "Digital Signature",
}) {
  const [signature, setSignature] = useState(null);

  const handleSignatureChange = (signatureData) => {
    setSignature(signatureData);
    onSignatureChange(signatureData);
  };

  return (
    <div className="signature-input-container">
      {/* Signature Input Component */}
      <div className="signature-input-area">
        <SignatureUpload
          onSignatureChange={handleSignatureChange}
          required={required}
          label=""
          maxSize={1024 * 1024} // 1MB
        />
      </div>

      {/* Status Indicator */}
      {signature && (
        <div className="mt-3 flex items-center gap-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl animate-fade-in shadow-2xs">
          <div className="bg-emerald-500 rounded-full p-0.5 shadow-2xs">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
          <span>Digital Signature Loaded Successfully</span>
        </div>
      )}
    </div>
  );
}
