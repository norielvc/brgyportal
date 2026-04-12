import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Save,
  AlertCircle,
  CheckCircle,
  Lock,
  Bell,
  Shield,
  Database,
  Pen,
  Upload,
  Eye,
  EyeOff,
  Trash2,
  Download,
  CheckCircle2,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import Layout from "@/components/Layout/Layout";
import { getUserData, logout, getAuthToken, isAdmin } from "@/lib/auth";
import SignatureInput from "@/components/UI/SignatureInput";
import SignatureImage from "@/components/UI/SignatureImage";
import SignatureDebugger from "@/components/UI/SignatureDebugger";

export default function Settings() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    setUser(getUserData());
  }, []);
  const [activeTab, setActiveTab] = useState("general");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Signature management state
  const [signatures, setSignatures] = useState([]);
  const [newSignature, setNewSignature] = useState(null);
  const [defaultSignatureId, setDefaultSignatureId] = useState(null);
  const [loadingSignatures, setLoadingSignatures] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);
  const [showPreview, setShowPreview] = useState({});

  // Data Import state
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // API Configuration - uses internal Next.js /api route
  const API_URL = "/api";

  const [settings, setSettings] = useState({
    // General
    companyName: "Barangay Iba O' Este",
    companyEmail: "admin@iba-o-este.gov.ph",
    timezone: "UTC",
    language: "en",

    // Security
    sessionTimeout: "30",
    passwordExpiry: "90",
    twoFactorAuth: false,
    ipWhitelist: false,

    // Notifications
    emailNotifications: true,
    loginAlerts: true,
    securityAlerts: true,
    weeklyReports: true,

    // Data
    autoBackup: true,
    backupFrequency: "daily",
    dataRetention: "365",
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    setSuccessMessage("Settings saved successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Signature management functions
  const fetchSignatures = async () => {
    if (!user) {
      console.log("No user found, skipping signature fetch");
      return;
    }

    setLoadingSignatures(true);
    try {
      const token = getAuthToken();
      console.log(
        "Fetching signatures with token:",
        token ? "Token exists" : "No token",
      );

      const response = await fetch(`${API_URL}/user/signatures`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Fetch signatures response status:", response.status);
      const data = await response.json();
      console.log("Fetch signatures response data:", data);

      if (data.success) {
        setSignatures(data.signatures || []);
        setDefaultSignatureId(data.defaultSignatureId);
        setSuccessMessage(`Loaded ${data.signatures?.length || 0} signatures`);
        setTimeout(() => setSuccessMessage(""), 3000);

        // Debug: Log signature data to check structure
        console.log("Loaded signatures:", data.signatures);
        if (data.signatures && data.signatures.length > 0) {
          console.log("First signature structure:", data.signatures[0]);
          console.log(
            "Signature data field:",
            data.signatures[0].signature_data ? "Present" : "Missing",
          );

          // Validate signature data format
          data.signatures.forEach((sig, index) => {
            if (sig.signature_data) {
              const isValidDataURL =
                sig.signature_data.startsWith("data:image/");
              const hasBase64 = sig.signature_data.includes("base64,");
              console.log(`Signature ${index + 1} validation:`, {
                name: sig.name,
                dataLength: sig.signature_data.length,
                isValidDataURL,
                hasBase64,
                dataStart: sig.signature_data.substring(0, 50),
              });
            }
          });
        }
      } else {
        setErrorMessage(data.message || "Failed to load signatures");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error fetching signatures:", error);
      setErrorMessage(`Network error: ${error.message}`);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoadingSignatures(false);
    }
  };

  const saveSignature = async () => {
    if (!newSignature) {
      setErrorMessage("Please create a signature first");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    console.log("Saving signature, user:", user);
    console.log("Signature data length:", newSignature.length);

    setSavingSignature(true);
    try {
      const token = getAuthToken();
      console.log(
        "Save signature with token:",
        token ? "Token exists" : "No token",
      );

      const response = await fetch(`${API_URL}/user/signatures`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signatureData: newSignature,
          name: `Signature ${signatures.length + 1}`,
          isDefault: signatures.length === 0,
        }),
      });

      console.log("Save signature response status:", response.status);
      const data = await response.json();
      console.log("Save signature response data:", data);

      if (data.success) {
        setNewSignature(null);
        fetchSignatures();
        setSuccessMessage("Signature saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(data.message || "Failed to save signature");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error saving signature:", error);
      setErrorMessage(`Network error: ${error.message}`);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSavingSignature(false);
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
        setSuccessMessage("Signature deleted successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(data.message || "Failed to delete signature");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error deleting signature:", error);
      setErrorMessage("Failed to delete signature");
      setTimeout(() => setErrorMessage(""), 3000);
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
        setSuccessMessage("Default signature updated!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error setting default signature:", error);
      setErrorMessage("Failed to update default signature");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const togglePreview = (signatureId) => {
    setShowPreview((prev) => ({
      ...prev,
      [signatureId]: !prev[signatureId],
    }));
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      // Fetch ALL residents without pagination for export
      const response = await fetch(
        `${API_URL}/residents/search?name=&page=1&limit=100000`,
      );
      const data = await response.json();

      if (data.success && data.residents.length > 0) {
        // Prepare data for Excel
        const exportData = data.residents.map((r) => ({
          "Last Name": r.last_name || "",
          "First Name": r.first_name || "",
          "Middle Name": r.middle_name || "",
          Suffix: r.suffix || "",
          Age: r.age || "",
          Gender: r.gender || "",
          "Civil Status": r.civil_status || "",
          "Birth Date": r.date_of_birth || "",
          "Birth Place": r.place_of_birth || "",
          Address: r.residential_address || "",
          "Contact Number": r.contact_number || "",
          "Pending Case": r.pending_case ? "YES" : "NO",
          "Case History": r.case_record_history || "",
        }));

        // Create Worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Residents");

        // Save File
        XLSX.writeFile(
          wb,
          `Residents_Database_Export_${new Date().toISOString().split("T")[0]}.xlsx`,
        );
        setSuccessMessage("Database exported successfully!");
      } else {
        setErrorMessage("No data found to export");
      }
    } catch (error) {
      console.error("Export error:", error);
      setErrorMessage("Failed to export database");
    } finally {
      setIsExporting(false);
      setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 3000);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "last_name",
      "first_name",
      "middle_name",
      "suffix",
      "age",
      "gender",
      "civil_status",
      "date_of_birth",
      "place_of_birth",
      "residential_address",
      "contact_number",
    ];
    const sampleData =
      "SALAZAR,CARLO,PADILLA,IV,57,FEMALE,SEPARATED,1968-04-19,BAGUIO,House No. 810C,09171234567";
    const csvContent = headers.join(",") + "\n" + sampleData;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "residents_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    setSuccessMessage("Sample template downloaded!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Load signatures when signatures tab is active
  useEffect(() => {
    if (activeTab === "signatures" && user) {
      fetchSignatures();
    }
  }, [activeTab, user]);

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "security", label: "Security", icon: Lock },
    { id: "signatures", label: "Signatures", icon: Pen },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data & Backup", icon: Database },
  ];

  if (isAdmin()) {
    tabs.push({ id: "import", label: "Import & Export", icon: Database });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage system configuration and preferences
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <div className="flex gap-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? "border-[#03254c] text-[#03254c]"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="label">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) =>
                    handleSettingChange("companyName", e.target.value)
                  }
                  className="input"
                />
              </div>

              <div>
                <label className="label">Company Email</label>
                <input
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) =>
                    handleSettingChange("companyEmail", e.target.value)
                  }
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) =>
                      handleSettingChange("timezone", e.target.value)
                    }
                    className="input"
                  >
                    <option>UTC</option>
                    <option>EST</option>
                    <option>CST</option>
                    <option>MST</option>
                    <option>PST</option>
                  </select>
                </div>

                <div>
                  <label className="label">Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) =>
                      handleSettingChange("language", e.target.value)
                    }
                    className="input"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="label">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) =>
                    handleSettingChange("sessionTimeout", e.target.value)
                  }
                  className="input"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Automatically log out users after this period of inactivity
                </p>
              </div>

              <div>
                <label className="label">Password Expiry (days)</label>
                <input
                  type="number"
                  value={settings.passwordExpiry}
                  onChange={(e) =>
                    handleSettingChange("passwordExpiry", e.target.value)
                  }
                  className="input"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Force users to change password after this period
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    Two-Factor Authentication
                  </p>
                  <p className="text-sm text-gray-600">
                    Require 2FA for all users
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorAuth}
                    onChange={(e) =>
                      handleSettingChange("twoFactorAuth", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">IP Whitelist</p>
                  <p className="text-sm text-gray-600">
                    Restrict access to specific IP addresses
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.ipWhitelist}
                    onChange={(e) =>
                      handleSettingChange("ipWhitelist", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* Signatures Settings */}
          {activeTab === "signatures" && (
            <div className="space-y-6">
              {/* Create New Signature */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Create New Signature
                </h3>

                <SignatureInput
                  onSignatureChange={setNewSignature}
                  label="Your Digital Signature"
                  required={false}
                />

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={saveSignature}
                    disabled={!newSignature || savingSignature}
                    className="flex items-center gap-2 px-4 py-2 bg-[#03254c] text-white rounded-lg hover:bg-[#02203d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingSignature ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {savingSignature ? "Saving..." : "Save Signature"}
                  </button>
                </div>
              </div>

              {/* Saved Signatures */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Saved Signatures ({signatures.length})
                </h3>

                {loadingSignatures ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#03254c]"></div>
                  </div>
                ) : signatures.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <Pen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No signatures saved yet</p>
                    <p className="text-sm">Create your first signature above</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {signatures.map((signature) => (
                      <div
                        key={signature.id}
                        className={`border rounded-lg p-4 ${
                          signature.id === defaultSignatureId
                            ? "border-[#03254c] bg-blue-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {/* Always show a small preview */}
                              <div className="w-24 h-12 border border-gray-200 rounded bg-white overflow-hidden">
                                <SignatureImage
                                  signatureData={signature.signature_data}
                                  alt={`Signature: ${signature.name}`}
                                  className="w-full h-full"
                                  onLoadSuccess={() =>
                                    console.log(
                                      "✅ Signature loaded:",
                                      signature.name,
                                    )
                                  }
                                  onLoadError={() =>
                                    console.error(
                                      "❌ Signature failed:",
                                      signature.name,
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {signature.name}
                                {signature.id === defaultSignatureId && (
                                  <span className="ml-2 px-2 py-1 text-xs bg-[#03254c] text-white rounded-full">
                                    Default
                                  </span>
                                )}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Created{" "}
                                {new Date(
                                  signature.created_at,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => togglePreview(signature.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                              title={
                                showPreview[signature.id]
                                  ? "Hide large preview"
                                  : "Show large preview"
                              }
                            >
                              {showPreview[signature.id] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>

                            {signature.id !== defaultSignatureId && (
                              <button
                                onClick={() =>
                                  setDefaultSignature(signature.id)
                                }
                                className="px-3 py-1 text-sm text-[#03254c] hover:bg-blue-50 rounded transition-colors"
                              >
                                Set Default
                              </button>
                            )}

                            <button
                              onClick={() => deleteSignature(signature.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete signature"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Large preview when toggled */}
                        {showPreview[signature.id] &&
                          signature.signature_data && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                Large Preview:
                              </h5>
                              <div className="border border-gray-300 rounded bg-white p-4 inline-block">
                                <SignatureImage
                                  signatureData={signature.signature_data}
                                  alt={`Large preview: ${signature.name}`}
                                  className="max-w-md max-h-32"
                                  onLoadSuccess={() =>
                                    console.log(
                                      "✅ Large preview loaded:",
                                      signature.name,
                                    )
                                  }
                                  onLoadError={() =>
                                    console.error(
                                      "❌ Large preview failed:",
                                      signature.name,
                                    )
                                  }
                                />
                              </div>

                              {/* Debug information */}
                              <div className="mt-4">
                                <SignatureDebugger
                                  signatureData={signature.signature_data}
                                  name={signature.name}
                                />
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <h4 className="font-semibold mb-1">
                      About Digital Signatures
                    </h4>
                    <ul className="space-y-1 text-blue-700">
                      <li>
                        • Your signatures are securely stored and encrypted
                      </li>
                      <li>
                        • Default signature will be used automatically in forms
                      </li>
                      <li>
                        • You can create multiple signatures for different
                        purposes
                      </li>
                      <li>
                        • Signatures are legally binding for barangay documents
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-4 max-w-2xl">
              {[
                {
                  key: "emailNotifications",
                  label: "Email Notifications",
                  desc: "Receive email notifications",
                },
                {
                  key: "loginAlerts",
                  label: "Login Alerts",
                  desc: "Alert on new login attempts",
                },
                {
                  key: "securityAlerts",
                  label: "Security Alerts",
                  desc: "Alert on security events",
                },
                {
                  key: "weeklyReports",
                  label: "Weekly Reports",
                  desc: "Receive weekly system reports",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[item.key]}
                      onChange={(e) =>
                        handleSettingChange(item.key, e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Data & Backup Settings */}
          {activeTab === "data" && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Automatic Backup</p>
                  <p className="text-sm text-gray-600">
                    Automatically backup system data
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoBackup}
                    onChange={(e) =>
                      handleSettingChange("autoBackup", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div>
                <label className="label">Backup Frequency</label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) =>
                    handleSettingChange("backupFrequency", e.target.value)
                  }
                  className="input"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="label">Data Retention (days)</label>
                <input
                  type="number"
                  value={settings.dataRetention}
                  onChange={(e) =>
                    handleSettingChange("dataRetention", e.target.value)
                  }
                  className="input"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Automatically delete data older than this period
                </p>
              </div>

              <button className="btn-secondary">Backup Now</button>
            </div>
          )}

          {/* Import & Export Settings */}
          {activeTab === "import" && (
            <div className="space-y-8 max-w-2xl">
              {/* Section 1: Export Database */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">
                      Database Export
                    </h3>
                    <p className="text-sm text-gray-500">
                      Download the entire resident directory as an Excel file
                      for backup or reporting.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-3 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-100 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                >
                  {isExporting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {isExporting
                    ? "PREPARING EXCEL FILE..."
                    : "DOWNLOAD RESIDENTS DIRECTORY (XLSX)"}
                </button>
              </div>

              {/* Section 2: Import Records */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-extrabold text-gray-900 leading-none">
                        Bulk Import Migration
                      </h3>
                      <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md transition-colors"
                        title="Download sample CSV format"
                      >
                        <Download className="w-3 h-3" /> Sample Template
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Quickly upload multiple resident records using a formatted
                      CSV file.
                    </p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center bg-gray-50/50 mb-6 transition-all hover:border-blue-400 hover:bg-blue-50/30 group">
                  <input
                    type="file"
                    id="csvUpload"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImportFile(file);
                        Papa.parse(file, {
                          header: true,
                          skipEmptyLines: true,
                          complete: (results) =>
                            setImportPreview(results.data.slice(0, 5)),
                        });
                      }
                    }}
                  />
                  <label
                    htmlFor="csvUpload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="h-14 w-14 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-sm font-black text-gray-900 uppercase tracking-tight">
                      {importFile ? importFile.name : "Select CSV Data Source"}
                    </span>
                    <span className="text-xs text-gray-500 mt-2 font-medium">
                      Drag and drop file here or click to browse
                    </span>
                  </label>
                </div>

                {importPreview.length > 0 && (
                  <div className="mb-6 space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                        Data Structure Preview
                      </h4>
                      <button
                        onClick={() => {
                          setImportFile(null);
                          setImportPreview([]);
                        }}
                        className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear selected file
                      </button>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-[9px] font-black text-gray-500 uppercase tracking-tight">
                              First Name
                            </th>
                            <th className="px-4 py-2.5 text-left text-[9px] font-black text-gray-500 uppercase tracking-tight">
                              Last Name
                            </th>
                            <th className="px-4 py-2.5 text-left text-[9px] font-black text-gray-500 uppercase tracking-tight">
                              Gender
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                          {importPreview.map((row, i) => (
                            <tr
                              key={i}
                              className="hover:bg-blue-50/50 transition-colors"
                            >
                              <td className="px-4 py-2.5 font-bold uppercase">
                                {row.first_name || row["First Name"] || "-"}
                              </td>
                              <td className="px-4 py-2.5 font-bold uppercase">
                                {row.last_name || row["Last Name"] || "-"}
                              </td>
                              <td className="px-4 py-2.5">
                                {row.gender || row.Gender || row.sex || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (!importFile) return;
                    setIsImporting(true);
                    Papa.parse(importFile, {
                      header: true,
                      skipEmptyLines: true,
                      complete: async (results) => {
                        try {
                          const mappedData = results.data.map((row) => ({
                            last_name:
                              row.last_name || row["Last Name"] || row.lastName,
                            first_name:
                              row.first_name ||
                              row["First Name"] ||
                              row.firstName,
                            middle_name:
                              row.middle_name || row["Middle Name"] || "",
                            suffix: row.suffix || row.Suffix || "",
                            age: parseInt(row.age || row.Age) || null,
                            gender: (
                              row.gender ||
                              row.Gender ||
                              row.sex ||
                              ""
                            ).toUpperCase(),
                            civil_status: (
                              row.civil_status ||
                              row["Civil Status"] ||
                              ""
                            ).toUpperCase(),
                            date_of_birth:
                              row.date_of_birth || row["Date of Birth"],
                            place_of_birth:
                              row.place_of_birth || row["Place of Birth"],
                            residential_address:
                              row.residential_address ||
                              row["Residential Address"] ||
                              row.address,
                            contact_number:
                              row.contact_number || row["Contact Number"] || "",
                          }));

                          const res = await fetch(
                            `${API_URL}/residents/bulk-insert`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ residents: mappedData }),
                            },
                          );

                          const data = await res.json();
                          if (data.success) {
                            setSuccessMessage(data.message);
                            setImportFile(null);
                            setImportPreview([]);
                          } else {
                            setErrorMessage(data.message);
                          }
                        } catch (err) {
                          setErrorMessage("Import failed: " + err.message);
                        } finally {
                          setIsImporting(false);
                          setTimeout(() => {
                            setSuccessMessage("");
                            setErrorMessage("");
                          }, 5000);
                        }
                      },
                    });
                  }}
                  disabled={!importFile || isImporting}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-blue-100 flex justify-center items-center gap-3 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:bg-gray-400"
                >
                  {isImporting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  {isImporting
                    ? "EXECUTING MIGRATION..."
                    : "FINALIZE & COMMENCE IMPORT"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

Settings.getLayout = (page) => (
  <Layout
    title="Settings"
    subtitle="Manage system configuration and preferences"
  >
    {page}
  </Layout>
);
