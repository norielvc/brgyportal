import { useState } from "react";
import Layout from "@/components/Layout/Layout";
import SignatureInput from "@/components/UI/SignatureInput";
import { Save, Eye, EyeOff } from "lucide-react";

export default function TestSignature() {
  const [signature, setSignature] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = () => {
    if (signature) {
      console.log("Signature data:", signature);
      alert("Signature saved! Check console for data.");
    } else {
      alert("Please create a signature first.");
    }
  };

  return (
    <Layout title="Test Signature" subtitle="Test the signature functionality">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Test Signature Component
          </h2>

          <SignatureInput
            onSignatureChange={setSignature}
            label="Test Your Signature"
            required={true}
          />

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={!signature}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Signature
            </button>

            {signature && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {showPreview ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            )}
          </div>

          {signature && showPreview && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Signature Preview:
              </h3>
              <img
                src={signature}
                alt="Signature preview"
                className="border border-gray-300 rounded bg-white max-w-md"
              />
              <p className="text-xs text-gray-500 mt-2">
                Data size: {Math.round(signature.length / 1024)} KB
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              Instructions:
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Choose between drawing or uploading a signature</li>
              <li>• For drawing: Use your mouse or finger to sign</li>
              <li>• For uploading: Select a PNG or JPEG image file</li>
              <li>• Click "Save Signature" to test the functionality</li>
              <li>• Check the browser console for signature data</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
