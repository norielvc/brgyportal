import React from "react";

/**
 * Utility functions for handling signature images
 */

/**
 * Convert a data URL to a blob URL
 * This can help with CSP issues and large data URLs
 */
export function dataURLToBlobURL(dataURL) {
  try {
    if (!dataURL || !dataURL.startsWith("data:image/")) {
      throw new Error("Invalid data URL");
    }

    const [header, base64Data] = dataURL.split("base64,");
    if (!base64Data) {
      throw new Error("Invalid base64 data");
    }

    const mimeType = header.split(":")[1].split(";")[0];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error converting data URL to blob URL:", error);
    return null;
  }
}

/**
 * Validate if a data URL is properly formatted
 */
export function validateDataURL(dataURL) {
  if (!dataURL || typeof dataURL !== "string") {
    return { valid: false, error: "No data URL provided" };
  }

  if (!dataURL.startsWith("data:image/")) {
    return { valid: false, error: "Not a valid image data URL" };
  }

  if (!dataURL.includes("base64,")) {
    return { valid: false, error: "Not a base64 encoded data URL" };
  }

  const base64Data = dataURL.split("base64,")[1];
  if (!base64Data || base64Data.length === 0) {
    return { valid: false, error: "No base64 data found" };
  }

  // Check if base64 length is valid (should be multiple of 4)
  if (base64Data.length % 4 !== 0) {
    return { valid: false, error: "Invalid base64 length" };
  }

  // Check if base64 format is valid
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64Data)) {
    return { valid: false, error: "Invalid base64 format" };
  }

  return { valid: true, error: null };
}

/**
 * React hook for handling signature images with fallbacks
 */
export function useSignatureImage(signatureData) {
  const [imageUrl, setImageUrl] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!signatureData) {
      setImageUrl(null);
      setError("No signature data");
      setLoading(false);
      return;
    }

    // Validate the data URL
    const validation = validateDataURL(signatureData);
    if (!validation.valid) {
      setError(validation.error);
      setLoading(false);
      return;
    }

    // Try to use the data URL directly first
    setImageUrl(signatureData);
    setError(null);
    setLoading(false);

    // Clean up blob URLs when component unmounts
    return () => {
      if (imageUrl && imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [signatureData]);

  const handleImageError = React.useCallback(() => {
    console.warn("Data URL failed, trying blob URL fallback");

    const blobUrl = dataURLToBlobURL(signatureData);
    if (blobUrl) {
      setImageUrl(blobUrl);
      setError(null);
    } else {
      setError("Failed to load image");
    }
  }, [signatureData]);

  return { imageUrl, error, loading, handleImageError };
}
