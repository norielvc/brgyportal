import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout/Layout";
import SignatureInput from "@/components/UI/SignatureInput";
import {
  Save,
  Trash2,
  Eye,
  EyeOff,
  User,
  Shield,
  CheckCircle,
  AlertCircle,
  Info,
  Pen,
} from "lucide-react";
import { getAuthToken, getUserData } from "@/lib/auth";

// API Configuration
const API_URL = "/api";

export default function SignatureSettings() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [newSignature, setNewSignature] = useState(null);
  const [defaultSignatureId, setDefaultSignatureId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showPreview, setShowPreview] = useState({});

  useEffect(() => {
    const user = getUserData();
    if (!user) {
      router.push("/login");
      return;
    }
    setCurrentUser(user);
    fetchSignatures();
  }, []);

  const fetchSignatures = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/user/signatures`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        setSignatures(data.signatures || []);
        setDefaultSignatureId(data.defaultSignatureId);
      }
    } catch (error) {
      console.error("Error fetching signatures:", error);
      setNotification({
        type: "error",
        title: "Error",
        message: "Failed to load signatures",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSignature = async () => {
    if (!newSignature) {
      setNotification({
        type: "error",
        title: "No Signature",
        message: "Please create a signature first",
      });
      return;
    }

    setSaving(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/user/signatures`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signatureData: newSignature,
          name: `Signature ${signatures.length + 1}`,
          isDefault: signatures.length === 0, // First signature becomes default
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewSignature(null);
        fetchSignatures();
        setNotification({
          type: "success",
          title: "Success",
          message: "Signature saved successfully",
        });
      } else {
        setNotification({
          type: "error",
          title: "Error",
          message: data.message || "Failed to save signature",
        });
      }
    } catch (error) {
      console.error("Error saving signature:", error);
      setNotification({
        type: "error",
        title: "Error",
        message: "Failed to save signature",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteSignature = async (signatureId) => {
    if (!confirm("Are you sure you want to delete this signature?")) return;

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/user/signatures/${signatureId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        fetchSignatures();
        setNotification({
          type: "success",
          title: "Success",
          message: "Signature deleted successfully",
        });
      } else {
        setNotification({
          type: "error",
          title: "Error",
          message: data.message || "Failed to delete signature",
        });
      }
    } catch (error) {
      console.error("Error deleting signature:", error);
      setNotification({
        type: "error",
        title: "Error",
        message: "Failed to delete signature",
      });
    }
  };

  const setDefaultSignature = async (signatureId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/user/signatures/${signatureId}/default`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setDefaultSignatureId(signatureId);
        setNotification({
          type: "success",
          title: "Success",
          message: "Default signature updated",
        });
      }
    } catch (error) {
      console.error("Error setting default signature:", error);
      setNotification({
        type: "error",
        title: "Error",
        message: "Failed to update default signature",
      });
    }
  };

  const togglePreview = (signatureId) => {
    setShowPreview((prev) => ({
      ...prev,
      [signatureId]: !prev[signatureId],
    }));
  };

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Notification */}
      {notification && (
        <div
          className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : notification.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" && (
              <CheckCircle className="w-5 h-5 shrink-0 text-green-600" />
            )}
            {notification.type === "error" && (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            )}
            {notification.type === "info" && <Info className="w-5 h-5 shrink-0 text-blue-600" />}
            <div>
              <h4 className="font-bold text-xs sm:text-sm">{notification.title}</h4>
              <p className="text-xs">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create New Signature Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-3.5 sm:mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
              <Pen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                Create Digital Signature
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-500">
                Upload official PNG/JPG signature
              </p>
            </div>
          </div>
        </div>

        <SignatureInput
          onSignatureChange={setNewSignature}
          label="Your Digital Signature"
          required={false}
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={saveSignature}
            disabled={!newSignature || saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? "Saving..." : "Save Signature"}</span>
          </button>
        </div>
      </div>

      {/* Saved Signatures List */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3.5 sm:mb-4">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            Saved Signatures ({signatures.length})
          </h2>
          {signatures.length > 0 && (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {signatures.length === 1 ? "1 Signature" : `${signatures.length} Signatures`}
            </span>
          )}
        </div>

        {signatures.length === 0 ? (
          <div className="text-center py-8 text-gray-500 space-y-1">
            <Pen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-xs sm:text-sm font-semibold text-gray-700">No signatures saved yet</p>
            <p className="text-[11px] text-gray-400">Upload your signature above to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {signatures.map((signature) => (
              <div
                key={signature.id}
                className={`border rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all ${
                  signature.id === defaultSignatureId
                    ? "border-blue-300 bg-blue-50/50 ring-1 ring-blue-200"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">
                      {showPreview[signature.id] ? (
                        <img
                          src={signature.signatureData}
                          alt="Signature"
                          className="w-20 h-10 sm:w-24 sm:h-12 object-contain border border-gray-200 rounded-lg bg-white p-1"
                        />
                      ) : (
                        <div className="w-20 h-10 sm:w-24 sm:h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                          <Pen className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                          {signature.name}
                        </h3>
                        {signature.id === defaultSignatureId && (
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-blue-100 text-blue-800 rounded-full shrink-0">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                        Added {new Date(signature.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <button
                      onClick={() => togglePreview(signature.id)}
                      className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title={showPreview[signature.id] ? "Hide preview" : "Show preview"}
                    >
                      {showPreview[signature.id] ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Preview</span>
                        </>
                      )}
                    </button>

                    {signature.id !== defaultSignatureId && (
                      <button
                        onClick={() => setDefaultSignature(signature.id)}
                        className="px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100/60 bg-blue-50 rounded-lg transition-colors"
                      >
                        Set Default
                      </button>
                    )}

                    <button
                      onClick={() => deleteSignature(signature.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete signature"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-blue-900">
            <h4 className="font-bold mb-1 text-blue-950">About Official Digital Signatures</h4>
            <ul className="space-y-1 text-blue-800 text-[11px] sm:text-xs">
              <li>• Your signatures are securely stored and encrypted</li>
              <li>• Default signature is automatically embedded when generating barangay certificates</li>
              <li>• Signatures are legally certified for barangay document releases</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

SignatureSettings.getLayout = (page) => (
  <Layout title="Signature Settings" subtitle="Manage your digital signatures for document signing">
    {page}
  </Layout>
);
