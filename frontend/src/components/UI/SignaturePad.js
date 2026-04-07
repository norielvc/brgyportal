import { useRef, useEffect, useState } from "react";
import { Pen, RotateCcw, Check, X, Info } from "lucide-react";

export default function SignaturePad({
  onSignatureChange,
  width = 400,
  height = 200,
  penColor = "#112e1f",
  backgroundColor = "#ffffff",
  required = false,
  label = "Digital Signature",
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [width, height, penColor, backgroundColor]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches[0]) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    setLastPoint(coords);

    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    const ctx = canvasRef.current.getContext("2d");

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setLastPoint(coords);
    setHasSignature(true);
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Convert canvas to base64 and notify parent
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL("image/png");
    onSignatureChange(signatureData);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    setHasSignature(false);
    onSignatureChange(null);
  };

  return (
    <div className="signature-pad-container space-y-4">
      {label && (
        <label className="block text-[10px] font-black text-emerald-900/60 uppercase tracking-[0.2em] ml-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative bg-white rounded-3xl border-2 border-dashed border-emerald-900/10 p-5 group transition-all hover:border-emerald-500/30 hover:bg-emerald-50/10">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-auto bg-white rounded-2xl cursor-crosshair touch-none shadow-sm ring-1 ring-emerald-900/5 transition-all outline-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ maxWidth: "100%", height: "auto" }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-3 bg-emerald-900/5 px-4 py-2.5 rounded-xl border border-emerald-900/5">
            <Pen className="w-4 h-4 text-emerald-700" />
            <span className="text-[10px] font-black text-emerald-900/60 uppercase tracking-widest leading-none">
              Sign clearly using mouse or touch
            </span>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={clearSignature}
              className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                hasSignature
                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed opacity-50"
              }`}
              disabled={!hasSignature}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Pad
            </button>

            {hasSignature && (
              <div className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 rounded-xl animate-scale-in">
                <Check className="w-4 h-4" />
                Captured
              </div>
            )}
          </div>
        </div>

        {required && !hasSignature && (
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-600 mt-4 ml-1">
            <Info className="w-3.5 h-3.5" />
            Signature is required for verification
          </p>
        )}
      </div>

      <style jsx>{`
        .animate-scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
      `}</style>
    </div>
  );
}
