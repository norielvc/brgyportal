import React, { useState, useEffect } from "react";

export default function SignatureDebugger({
  signatureData,
  name = "Test Signature",
}) {
  const [debugInfo, setDebugInfo] = useState({});
  const [imageLoadStatus, setImageLoadStatus] = useState("loading");

  useEffect(() => {
    if (!signatureData) {
      setDebugInfo({ error: "No signature data provided" });
      return;
    }

    // Analyze the signature data
    const info = {
      dataLength: signatureData.length,
      startsWithDataImage: signatureData.startsWith("data:image/"),
      hasBase64: signatureData.includes("base64,"),
      mimeType: signatureData.split(";")[0].replace("data:", ""),
      base64Length: signatureData.split("base64,")[1]?.length || 0,
      firstChars: signatureData.substring(0, 50),
      lastChars: signatureData.substring(signatureData.length - 50),
    };

    setDebugInfo(info);
    setImageLoadStatus("loading");
  }, [signatureData]);

  const handleImageLoad = () => {
    console.log("✅ Debug image loaded successfully for:", name);
    setImageLoadStatus("success");
  };

  const handleImageError = (e) => {
    console.error("❌ Debug image failed to load for:", name, e);
    setImageLoadStatus("error");
  };

  if (!signatureData) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h4 className="font-bold text-red-800">❌ No Signature Data</h4>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded text-sm">
      <h4 className="font-bold text-gray-800 mb-2">🔍 Debug: {name}</h4>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h5 className="font-semibold">Data Analysis:</h5>
          <ul className="text-xs space-y-1">
            <li>Length: {debugInfo.dataLength} chars</li>
            <li>
              Valid data URL: {debugInfo.startsWithDataImage ? "✅" : "❌"}
            </li>
            <li>Has base64: {debugInfo.hasBase64 ? "✅" : "❌"}</li>
            <li>MIME type: {debugInfo.mimeType}</li>
            <li>Base64 length: {debugInfo.base64Length}</li>
          </ul>
        </div>

        <div>
          <h5 className="font-semibold">Image Load Test:</h5>
          <div className="border border-gray-300 p-2 bg-white">
            {signatureData && (
              <img
                src={signatureData}
                alt={`Debug: ${name}`}
                style={{ maxWidth: "150px", maxHeight: "75px" }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
          </div>
          <p
            className={`text-xs mt-1 ${
              imageLoadStatus === "success"
                ? "text-green-600"
                : imageLoadStatus === "error"
                  ? "text-red-600"
                  : "text-blue-600"
            }`}
          >
            Status:{" "}
            {imageLoadStatus === "success"
              ? "✅ Loaded"
              : imageLoadStatus === "error"
                ? "❌ Failed"
                : "🔄 Loading..."}
          </p>
        </div>
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-blue-600">
          Show Raw Data
        </summary>
        <div className="mt-2 p-2 bg-white border rounded font-mono text-xs break-all">
          <div>
            <strong>Start:</strong> {debugInfo.firstChars}...
          </div>
          <div>
            <strong>End:</strong> ...{debugInfo.lastChars}
          </div>
        </div>
      </details>
    </div>
  );
}
