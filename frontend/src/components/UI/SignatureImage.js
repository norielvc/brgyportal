import React, { useState, useEffect, useCallback } from "react";
import { Pen } from "lucide-react";
import { dataURLToBlobURL, validateDataURL } from "@/lib/imageUtils";

export default function SignatureImage({
  signatureData,
  alt = "Signature",
  className = "",
  onLoadSuccess,
  onLoadError,
  showFallback = true,
}) {
  const [imageUrl, setImageUrl] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Initialize image URL when signatureData changes
  useEffect(() => {
    if (!signatureData) {
      setImageUrl(null);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    // Validate the data URL first
    const validation = validateDataURL(signatureData);
    if (!validation.valid) {
      console.error("Invalid signature data:", validation.error);
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Start with the original data URL
    setImageUrl(signatureData);
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
  }, [signatureData]);

  const handleImageLoad = useCallback(() => {
    console.log("✅ Signature image loaded successfully");
    setIsLoading(false);
    setHasError(false);
    if (onLoadSuccess) {
      onLoadSuccess();
    }
  }, [onLoadSuccess]);

  const handleImageError = useCallback(() => {
    console.warn("❌ Signature image failed to load, retry count:", retryCount);

    // Try blob URL fallback on first error
    if (retryCount === 0 && signatureData && !imageUrl?.startsWith("blob:")) {
      console.log("🔄 Trying blob URL fallback...");
      const blobUrl = dataURLToBlobURL(signatureData);
      if (blobUrl) {
        setImageUrl(blobUrl);
        setRetryCount(1);
        return; // Don't set error yet, let the blob URL try to load
      }
    }

    // If blob URL also fails or we can't create it, show error
    console.error("❌ All image loading attempts failed");
    setIsLoading(false);
    setHasError(true);
    if (onLoadError) {
      onLoadError();
    }
  }, [signatureData, imageUrl, retryCount, onLoadError]);

  // Show loading state
  if (isLoading && signatureData) {
    return showFallback ? (
      <div
        className={`flex items-center justify-center text-gray-400 ${className}`}
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
      </div>
    ) : null;
  }

  // Show empty state
  if (!signatureData) {
    return showFallback ? (
      <div
        className={`flex items-center justify-center text-gray-400 ${className}`}
      >
        <Pen className="w-4 h-4" />
      </div>
    ) : null;
  }

  // Show error state
  if (hasError) {
    return showFallback ? (
      <div
        className={`flex items-center justify-center text-red-500 text-xs ${className}`}
      >
        <div className="text-center">
          <div>❌</div>
          <div className="text-xs">Failed</div>
        </div>
      </div>
    ) : null;
  }

  // Show the image
  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading="eager"
      decoding="sync"
      style={{
        objectFit: "contain",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
    />
  );
}
