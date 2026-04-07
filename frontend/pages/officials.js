import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout/Layout";
import {
  Save,
  Users,
  UserCog,
  Shield,
  Award,
  Edit2,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Building,
  Crop,
  Camera,
  Layout as LayoutIcon,
  Eye,
  EyeOff,
  Trash2,
  Activity,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";

const API_URL = "/api";

// Default officials data
const defaultOfficials = {
  chairman: "[CHAIRMAN NAME]",
  secretary: "[SECRETARY NAME]",
  treasurer: "[TREASURER NAME]",
  skChairman: "[SK CHAIRMAN NAME]",
  skSecretary: "",
  skTreasurer: "",
  skKagawads: ["", "", "", "", "", "", "", ""],
  councilors: [
    "[KAGAWAD 1]",
    "[KAGAWAD 2]",
    "[KAGAWAD 3]",
    "[KAGAWAD 4]",
    "[KAGAWAD 5]",
    "[KAGAWAD 6]",
    "[KAGAWAD 7]",
  ],
  administrator: "[ADMINISTRATOR NAME]",
  assistantSecretary: "",
  assistantAdministrator: "",
  recordKeeper: "",
  clerk: "",

  officialImages: {
    chairman: "",
    secretary: "",
    treasurer: "",
    skChairman: "",
    skSecretary: "",
    skTreasurer: "",
    skKagawads: Array(8).fill(""),
    councilors: Array(7).fill(""),
    administrator: "",
    assistantSecretary: "",
    assistantAdministrator: "",
    recordKeeper: "",
    clerk: "",
  },
  descriptions: {
    chairman: "Punong Barangay",
    secretary: "Barangay Secretary",
    treasurer: "Barangay Treasurer",
    skChairman: "Sangguniang Kabataan Chairman",
    skSecretary: "SK Secretary",
    skTreasurer: "SK Treasurer",
    councilors: Array(7).fill("Brgy. Kagawad"),
    skKagawads: Array(8).fill("SK Kagawad"),
    administrator: "Barangay Administrator",
    assistantSecretary: "Assistant Secretary",
    assistantAdministrator: "Assistant Administrator",
    recordKeeper: "Record Keeper",
    clerk: "Barangay Clerk",
  },
  committees: {
    councilors: Array(7).fill("Unassigned Committee"),
    skKagawads: Array(8).fill("Youth Committee"),
  },
  contactInfo: {
    address: "[BARANGAY ADDRESS]",
    contactPerson: "[CONTACT PERSON]",
    telephone: "[TELEPHONE]",
    email: "[EMAIL ADDRESS]",
  },
  headerInfo: {
    country: "Republic of the Philippines",
    province: "[PROVINCE]",
    municipality: "[MUNICIPALITY]",
    barangayName: "BARANGAY [NAME]",
    officeName: "Office of the Punong Barangay",
  },
  // Logos
  logos: {
    leftLogo: "",
    rightLogo: "",
    logoSize: 115,
    captainImage: "",
  },
  // Header Style - General
  headerStyle: {
    bgColor: "#ffffff",
    borderColor: "#1e40af",
    fontFamily: "default",
  },
  // Individual Header Text Styles
  countryStyle: {
    color: "#4b5563",
    size: 12,
    fontWeight: "normal",
    fontFamily: "default",
  },
  provinceStyle: {
    color: "#4b5563",
    size: 12,
    fontWeight: "normal",
    fontFamily: "default",
  },
  municipalityStyle: {
    color: "#4b5563",
    size: 12,
    fontWeight: "normal",
    fontFamily: "default",
  },
  barangayNameStyle: {
    color: "#1e40af",
    size: 20,
    fontWeight: "bold",
    fontFamily: "default",
  },
  officeNameStyle: {
    color: "#6b7280",
    size: 11,
    fontWeight: "normal",
    fontFamily: "default",
  },
  // Sidebar Style
  sidebarStyle: {
    bgColor: "#1e40af",
    gradientEnd: "#1e3a8a",
    textColor: "#ffffff",
    labelColor: "#fde047",
    titleSize: 14,
    textSize: 11,
    fontFamily: "default",
  },
  // Body Style
  bodyStyle: {
    bgColor: "#ffffff",
    textColor: "#1f2937",
    titleColor: "#1e3a8a",
    titleSize: 24,
    textSize: 14,
    fontFamily: "default",
  },
  // Footer Style
  footerStyle: {
    bgColor: "#f9fafb",
    textColor: "#374151",
    borderColor: "#d1d5db",
    textSize: 9,
    fontFamily: "default",
  },
  heroSection: {
    title: "BARANGAY OFFICIALS",
    subtitle: "Meet our dedicated team",
    image: "",
  },
  vision: "Enter Barangay Vision here...",
  mission: "Enter Barangay Mission here...",
  siteContact: {
    address: "Calumpit, Bulacan",
    phone: "(044) 123-4567",
    email: "ibaoeste@calumpit.gov.ph",
    officeHours:
      "Monday - Friday: 8:00 AM - 5:00 PM\nSaturday: 8:00 AM - 12:00 PM\nSunday: Closed",
    hotlines: [
      { name: "Barangay Emergency", number: "(044) 123-4567" },
      { name: "Police Station", number: "911" },
      { name: "Fire Department", number: "(044) 765-4321" },
      { name: "Medical Emergency", number: "(044) 987-6543" },
    ],
  },
  portalBranding: {
    portalName: "IBA O' ESTE PORTAL",
    shortName: "Iba O' Este",
    subtitle: "Calumpit, Bulacan",
    logoUrl: "/logo.png",
    primaryColor: "#004700",
    secondaryColor: "#001a00",
  },
  missionGoals: {
    barangayMission: "",
    barangayGoal:
      "To deliver dedicated public service through innovative social programs, sustainable infrastructure, and community-driven initiatives that uplift the dignity and prosperity of every resident.",
    barangayVision:
      "A model community that is progressive, peaceful, and disaster-resilient, where empowered citizens live in harmony with nature and participate in transparent local governance.",
    skMission: "",
    skGoal:
      "To empower the youth through comprehensive development programs in leadership, environment, and wellness, ensuring every young resident has the opportunity to contribute to our barangay's future.",
    skVision:
      "An inspired youth community that is actively involved in community building, advocating for education, sports, and social responsibility while maintaining the highest level of integrity.",
  },
  visibility: {
    section: true,
    chairman: true,
    secretary: true,
    treasurer: true,
    skChairman: true,
    skSecretary: true,
    skTreasurer: true,
    skKagawads: Array(8).fill(true),
    councilors: Array(7).fill(true),
    administrator: true,
    assistantSecretary: true,
    assistantAdministrator: true,
    recordKeeper: true,
    clerk: true,
  },
};

export default function OfficialsPage() {
  const [officials, setOfficials] = useState(defaultOfficials);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [croppingImg, setCroppingImg] = useState(null);
  const [targetField, setTargetField] = useState(null);
  const [activeTab, setActiveTab] = useState("officials");

  const tabs = [
    { id: "officials", label: "Officials & Vision", icon: Users },
    { id: "branding", label: "Branding & Header", icon: LayoutIcon },
    { id: "appearance", label: "Appearance & Themes", icon: Award },
    { id: "portal", label: "Portal Branding", icon: Shield },
    { id: "mission", label: "Mission & Goals", icon: MapPin },
    { id: "contact", label: "Contact & Hotlines", icon: Phone },
  ];

  useEffect(() => {
    // Fetch from API
    const fetchConfig = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_URL}/officials/config`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (data.success && data.data) {
          // Merge API data with defaults to ensure all fields exist
          setOfficials((prev) => ({
            ...prev,
            ...data.data,
            // Deep merge essential nested objects if they exist in data.data
            contactInfo: {
              ...prev.contactInfo,
              ...(data.data.contactInfo || {}),
            },
            headerInfo: { ...prev.headerInfo, ...(data.data.headerInfo || {}) },
            logos: { ...prev.logos, ...(data.data.logos || {}) },
            headerStyle: {
              ...prev.headerStyle,
              ...(data.data.headerStyle || {}),
            },
            sidebarStyle: {
              ...prev.sidebarStyle,
              ...(data.data.sidebarStyle || {}),
            },
            bodyStyle: { ...prev.bodyStyle, ...(data.data.bodyStyle || {}) },
            footerStyle: {
              ...prev.footerStyle,
              ...(data.data.footerStyle || {}),
            },
            portalBranding: {
              ...prev.portalBranding,
              ...(data.data.portalBranding || {}),
            },
            missionGoals: {
              ...prev.missionGoals,
              ...(data.data.missionGoals || {}),
            },
            siteContact: {
              ...prev.siteContact,
              ...(data.data.siteContact || {}),
              hotlines:
                data.data.siteContact?.hotlines?.length > 0
                  ? data.data.siteContact.hotlines
                  : prev.siteContact?.hotlines,
            },
          }));
        }
      } catch (error) {
        console.error("Failed to load officials config", error);
        // Fallback to local storage if API fails
        const saved = localStorage.getItem("barangayOfficials");
        if (saved) {
          setOfficials((prev) => ({ ...prev, ...JSON.parse(saved) }));
        }
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const startEditing = (field, value, type = "name") => {
    setEditingField({ field, type });
    setTempValue(value || "");
  };
  const cancelEditing = () => {
    setEditingField(null);
    setTempValue("");
  };

  const saveField = (fieldInfo) => {
    const { field, type } = fieldInfo;
    const value = tempValue.trim();

    // Descriptions
    if (type === "description") {
      if (field.startsWith("councilor_")) {
        const index = parseInt(field.split("_")[1]);
        const newDesc = [...officials.descriptions.councilors];
        newDesc[index] = value;
        setOfficials({
          ...officials,
          descriptions: { ...officials.descriptions, councilors: newDesc },
        });
      } else if (field.startsWith("skKagawad_")) {
        const index = parseInt(field.split("_")[1]);
        const newDesc = [...officials.descriptions.skKagawads];
        newDesc[index] = value;
        setOfficials({
          ...officials,
          descriptions: { ...officials.descriptions, skKagawads: newDesc },
        });
      } else {
        setOfficials({
          ...officials,
          descriptions: { ...officials.descriptions, [field]: value },
        });
      }
    }
    // Committees
    else if (type === "committee") {
      if (field.startsWith("councilor_")) {
        const index = parseInt(field.split("_")[1]);
        const newComm = [...officials.committees.councilors];
        newComm[index] = value;
        setOfficials({
          ...officials,
          committees: { ...officials.committees, councilors: newComm },
        });
      } else if (field.startsWith("skKagawad_")) {
        const index = parseInt(field.split("_")[1]);
        const newComm = [...officials.committees.skKagawads];
        newComm[index] = value;
        setOfficials({
          ...officials,
          committees: { ...officials.committees, skKagawads: newComm },
        });
      }
    }
    // Names and others
    else {
      if (field.startsWith("councilor_")) {
        const index = parseInt(field.split("_")[1]);
        const newCouncilors = [...officials.councilors];
        newCouncilors[index] = value.toUpperCase();
        setOfficials({ ...officials, councilors: newCouncilors });
      } else if (field.startsWith("skKagawad_")) {
        const index = parseInt(field.split("_")[1]);
        const newSkKagawads = [...officials.skKagawads];
        newSkKagawads[index] = value.toUpperCase();
        setOfficials({ ...officials, skKagawads: newSkKagawads });
      } else if (field.startsWith("contact_")) {
        setOfficials({
          ...officials,
          contactInfo: {
            ...officials.contactInfo,
            [field.replace("contact_", "")]: value,
          },
        });
      } else if (field.startsWith("header_")) {
        setOfficials({
          ...officials,
          headerInfo: {
            ...officials.headerInfo,
            [field.replace("header_", "")]: value,
          },
        });
      } else if (field.startsWith("hero_")) {
        setOfficials({
          ...officials,
          heroSection: {
            ...officials.heroSection,
            [field.replace("hero_", "")]: value,
          },
        });
      } else if (field === "vision" || field === "mission") {
        setOfficials({ ...officials, [field]: value });
      } else {
        setOfficials({ ...officials, [field]: value.toUpperCase() });
      }
    }

    setEditingField(null);
    setTempValue("");
    setHasChanges(true);
    setNotification({ type: "success", message: "Field updated" });
  };

  const handleHeroImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCroppingImg(reader.result);
        setTargetField("hero_image");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOfficialImageUpload = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCroppingImg(reader.result);
        setTargetField(field);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCrop = (croppedBase64) => {
    const field = targetField;
    const base64 = croppedBase64;
    const newOfficials = { ...officials };

    if (field.startsWith("councilor_")) {
      const index = parseInt(field.split("_")[1]);
      const newImgs = [...officials.officialImages.councilors];
      newImgs[index] = base64;
      newOfficials.officialImages = {
        ...officials.officialImages,
        councilors: newImgs,
      };
    } else if (field.startsWith("skKagawad_")) {
      const index = parseInt(field.split("_")[1]);
      const newImgs = [...officials.officialImages.skKagawads];
      newImgs[index] = base64;
      newOfficials.officialImages = {
        ...officials.officialImages,
        skKagawads: newImgs,
      };
    } else if (field === "hero_image") {
      newOfficials.heroSection = { ...officials.heroSection, image: base64 };
    } else {
      newOfficials.officialImages = {
        ...officials.officialImages,
        [field]: base64,
      };
    }

    setOfficials(newOfficials);
    setHasChanges(true);
    setCroppingImg(null);
    setTargetField(null);
    setNotification({
      type: "success",
      message:
        "Official photo optimized and applied. Click Save All to finalize.",
    });
  };

  const updateStyle = (section, field, value) => {
    setOfficials({
      ...officials,
      [section]: { ...officials[section], [field]: value },
    });
    setHasChanges(true);
  };

  const toggleVisibility = (field) => {
    const newVisibility = { ...officials.visibility };

    if (field.startsWith("councilor_")) {
      const idx = parseInt(field.split("_")[1]);
      const arr = [...newVisibility.councilors];
      arr[idx] = !arr[idx];
      newVisibility.councilors = arr;
    } else if (field.startsWith("skKagawad_")) {
      const idx = parseInt(field.split("_")[1]);
      const arr = [...newVisibility.skKagawads];
      arr[idx] = !arr[idx];
      newVisibility.skKagawads = arr;
    } else if (field === "section") {
      newVisibility.section = !newVisibility.section;
    } else {
      newVisibility[field] = !newVisibility[field];
    }

    setOfficials({ ...officials, visibility: newVisibility });
    setHasChanges(true);
    setNotification({
      type: "success",
      message: `${field === "section" ? "Section" : "Official"} visibility ${newVisibility[field === "section" ? "section" : field] ? "enabled" : "disabled"}`,
    });
  };

  const ImageCropperModal = ({
    src,
    onApply,
    onCancel,
    cropWidth = 600,
    cropHeight = 600,
    modalTitle = "CROP PROFILE PHOTO",
    modalSubtitle = "2x2 Official Resolution",
    outputFormat = "image/png",
    quality,
  }) => {
    const canvasRef = useRef(null);
    const [zoom, setZoom] = useState(1.2);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);

    useEffect(() => {
      const img = new Image();
      img.src = src;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageRef.current = img;
        draw();
      };
    }, [src, cropWidth, cropHeight]);

    useEffect(() => {
      if (imageRef.current) draw();
    }, [zoom, offset, cropWidth, cropHeight]);

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas || !imageRef.current) return;
      const ctx = canvas.getContext("2d");
      const img = imageRef.current;

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      ctx.clearRect(0, 0, cropWidth, cropHeight);

      // Calculate scale to cover the canvas
      const scaleX = cropWidth / img.width;
      const scaleY = cropHeight / img.height;
      const baseScale = Math.max(scaleX, scaleY); // Ensure we cover the area
      const scale = baseScale * zoom;

      const w = img.width * scale;
      const h = img.height * scale;

      const x = (cropWidth - w) / 2 + offset.x;
      const y = (cropHeight - h) / 2 + offset.y;

      ctx.drawImage(img, x, y, w, h);
    };

    const handleMouseDown = (e) => {
      setIsDragging(true);
      setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setOffset({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    return (
      <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50 shrink-0">
            <div>
              <h3 className="font-black text-xl text-gray-900 tracking-tight flex items-center gap-2">
                <Crop className="w-6 h-6 text-blue-600" /> {modalTitle}
              </h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                {modalSubtitle}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8 overflow-y-auto flex-1">
            <div
              className="relative w-full rounded-2xl overflow-hidden shadow-inner border-4 border-gray-100 cursor-move bg-white"
              style={{
                aspectRatio: cropWidth / cropHeight,
                backgroundImage:
                  "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <canvas ref={canvasRef} className="w-full h-full relative z-10" />

              <div className="absolute top-4 left-4 bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-full backdrop-blur-md font-bold uppercase tracking-tighter z-20">
                Drag to Position Card
              </div>
            </div>

            <div className="mt-10 space-y-8">
              <div className="px-2">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Adjust Magnification
                  </span>
                  <span className="text-2xl font-black text-blue-600 tabular-nums">
                    {(zoom * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600 border border-gray-200"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={onCancel}
                  className="flex-1 py-4 px-6 border-2 border-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-sm"
                >
                  Discard
                </button>
                <button
                  onClick={() =>
                    onApply(canvasRef.current.toDataURL(outputFormat, quality))
                  }
                  className="flex-[2] py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black rounded-2xl hover:shadow-xl hover:shadow-blue-200 transition-all active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" /> Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleLogoUpload = (side, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        let fieldName = "";
        if (side === "left") fieldName = "leftLogo";
        else if (side === "right") fieldName = "rightLogo";
        else if (side === "captain") fieldName = "captainImage";

        updateStyle("logos", fieldName, reader.result);
        setNotification({
          type: "success",
          message: `${side.charAt(0).toUpperCase() + side.slice(1)} image uploaded`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = (side) => {
    let fieldName = "";
    if (side === "left") fieldName = "leftLogo";
    else if (side === "right") fieldName = "rightLogo";
    else if (side === "captain") fieldName = "captainImage";

    updateStyle("logos", fieldName, "");
    setNotification({
      type: "success",
      message: `${side.charAt(0).toUpperCase() + side.slice(1)} image removed`,
    });
  };

  const saveAllChanges = async () => {
    setIsSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/officials/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(officials),
      });
      const data = await res.json();
      if (data.success) {
        setHasChanges(false);
        setNotification({
          type: "success",
          message: "All changes saved to database!",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Failed to save", error);
      setNotification({ type: "error", message: "Failed to save changes" });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = () => {
    if (confirm("Are you sure? This will revert all changes.")) {
      setOfficials(defaultOfficials);
      setHasChanges(true);
      setNotification({
        type: "success",
        message: "Reset to default values. Click Save to apply.",
      });
    }
  };

  const EditableField = ({
    label,
    field,
    value,
    icon: Icon,
    placeholder = "",
    showDescription = true,
    showCommittee = false,
  }) => {
    const isEditingName =
      editingField?.field === field && editingField?.type === "name";
    const isEditingDesc =
      editingField?.field === field && editingField?.type === "description";
    const isEditingComm =
      editingField?.field === field && editingField?.type === "committee";

    // Get image, description, and committee for this field
    let imageUrl = "";
    let description = "";
    let committee = "";
    let isVisible = true;

    if (field.startsWith("councilor_")) {
      const idx = parseInt(field.split("_")[1]);
      imageUrl = officials.officialImages.councilors[idx];
      description = officials.descriptions?.councilors[idx] || "";
      committee = officials.committees?.councilors[idx] || "";
      isVisible = officials.visibility?.councilors[idx];
    } else if (field.startsWith("skKagawad_")) {
      const idx = parseInt(field.split("_")[1]);
      imageUrl = officials.officialImages.skKagawads[idx];
      description = officials.descriptions?.skKagawads[idx] || "";
      committee = officials.committees?.skKagawads[idx] || "";
      isVisible = officials.visibility?.skKagawads[idx];
    } else {
      imageUrl = officials.officialImages[field];
      description = officials.descriptions?.[field] || "";
      isVisible = officials.visibility?.[field] ?? true;
    }

    return (
      <div
        className={`bg-white rounded-xl border ${isVisible ? "border-gray-200" : "border-red-200 bg-red-50/30"} p-4 hover:shadow-md transition-all group flex flex-col h-full relative`}
      >
        {/* Visibility Toggle */}
        <button
          onClick={() => toggleVisibility(field)}
          title={
            isVisible ? "Visible on Public Portal" : "Hidden from Public Portal"
          }
          className={`absolute -top-2 -left-2 z-10 p-2 rounded-full shadow-lg border transition-all ${isVisible ? "bg-green-600 border-green-700 text-white" : "bg-red-600 border-red-700 text-white"}`}
        >
          {isVisible ? (
            <Eye className="w-3 h-3" />
          ) : (
            <EyeOff className="w-3 h-3" />
          )}
        </button>
        {/* Header: Label & Photo */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-1.5 rounded-lg">
              <Icon className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">{label}</span>
          </div>

          <div className="relative group/photo">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center text-gray-400">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Official Photo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-8 h-8 opacity-20" />
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleOfficialImageUpload(field, e)}
              />
              <Edit2 className="w-3 h-3" />
            </label>
          </div>
        </div>

        {/* Name Field */}
        <div className="mb-3">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveField({ field, type: "name" });
                  if (e.key === "Escape") cancelEditing();
                }}
              />
              <button
                onClick={() => saveField({ field, type: "name" })}
                className="p-2 bg-green-100 text-green-600 rounded-lg"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between group/edit">
              <span
                className={`text-base font-bold truncate pr-2 ${value ? "text-gray-900" : "text-gray-400 italic"}`}
              >
                {value || "(Name not set)"}
              </span>
              <button
                onClick={() => startEditing(field, value, "name")}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover/edit:opacity-100 transition-opacity"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Committee Field (Optional) */}
        {showCommittee && (
          <div className="mb-2">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Committee
            </label>
            {isEditingComm ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-blue-300 rounded text-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      saveField({ field, type: "committee" });
                    if (e.key === "Escape") cancelEditing();
                  }}
                />
                <button
                  onClick={() => saveField({ field, type: "committee" })}
                  className="p-1 px-2 bg-green-100 text-green-600 rounded"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between group/comm mt-0.5">
                <span
                  className={`text-xs font-medium ${committee ? "text-blue-700" : "text-gray-400 italic"}`}
                >
                  {committee || "No committee assigned"}
                </span>
                <button
                  onClick={() => startEditing(field, committee, "committee")}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded opacity-0 group-hover/comm:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Description Field (Optional) */}
        {showDescription && (
          <div className="mt-auto pt-2 border-t border-gray-100">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Description
            </label>
            {isEditingDesc ? (
              <div className="flex flex-col gap-2 mt-1">
                <textarea
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full px-2 py-1.5 border border-blue-300 rounded text-xs resize-none"
                  rows={2}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault(); // Prevent newline
                      saveField({ field, type: "description" });
                    }
                    if (e.key === "Escape") cancelEditing();
                  }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelEditing}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveField({ field, type: "description" })}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between group/desc mt-0.5 relative">
                <p
                  className={`text-xs leading-relaxed line-clamp-2 ${description ? "text-gray-600" : "text-gray-400 italic"}`}
                >
                  {description || "No description added"}
                </p>
                <button
                  onClick={() =>
                    startEditing(field, description, "description")
                  }
                  className="absolute bottom-0 right-0 bg-white shadow-sm p-1 text-gray-400 hover:text-blue-600 border border-gray-200 rounded opacity-0 group-hover/desc:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const ColorPicker = ({ label, value, onChange, section, field }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <label className="text-xs font-medium text-gray-600 block mb-2">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(section, field, e.target.value)}
          className="w-10 h-8 rounded cursor-pointer border-0"
        />
        <span className="text-xs font-mono text-gray-500">{value}</span>
      </div>
    </div>
  );

  const SizeSlider = ({
    label,
    value,
    onChange,
    section,
    field,
    min = 8,
    max = 32,
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <label className="text-xs font-medium text-gray-600 block mb-2">
        {label}: {value}px
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(section, field, parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );

  const FontSelect = ({ label, value, onChange, section, field }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <label className="text-xs font-medium text-gray-600 block mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(section, field, e.target.value)}
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
      >
        <option value="default">Default</option>
        <option value="serif">Serif</option>
        <option value="sans">Sans-serif</option>
        <option value="mono">Monospace</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Barangay Configuration
          </h1>
          <p className="text-gray-600 mt-1">
            Manage officials, branding, and certificate appearance
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetToDefault}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-mediumTransition-all hover:scale-105"
          >
            Reset Values
          </button>
          <button
            onClick={saveAllChanges}
            disabled={!hasChanges || isSaving}
            className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
              !hasChanges
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : isSaving
                  ? "bg-blue-600/80 text-white cursor-wait"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 active:scale-95"
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save All
              </>
            )}
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${notification.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span className="text-amber-800 font-medium">
            Unsaved changes detected. Remember to click "Save All" before
            leaving.
          </span>
        </div>
      )}

      {/* Tab Content: Officials & Vision */}
      {activeTab === "officials" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-emerald-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                    <LayoutIcon className="w-6 h-6 text-emerald-300" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest">
                    Officials Section Settings
                  </h3>
                </div>

                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-2 px-4 rounded-2xl border border-white/20">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">
                      Portal Visibility
                    </span>
                    <span className="text-xs font-bold">
                      {officials.visibility?.section
                        ? "SHOW SECTION"
                        : "HIDE SECTION"}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleVisibility("section")}
                    className={`w-14 h-8 rounded-full relative transition-all duration-300 ${officials.visibility?.section ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]" : "bg-gray-600"}`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${officials.visibility?.section ? "left-7" : "left-1"}`}
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-2 block">
                      Hero Title
                    </label>
                    {editingField === "hero_title" ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="flex-1 bg-white/10 border border-emerald-400/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          autoFocus
                        />
                        <button
                          onClick={() =>
                            saveField({ field: "hero_title", type: "name" })
                          }
                          className="p-3 bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-colors"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 group">
                        <span className="text-xl font-bold">
                          {officials.heroSection?.title || "BARANGAY OFFICIALS"}
                        </span>
                        <button
                          onClick={() =>
                            startEditing(
                              "hero_title",
                              officials.heroSection?.title,
                            )
                          }
                          className="p-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-2 block">
                      Hero Subtitle
                    </label>
                    {editingField === "hero_subtitle" ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="flex-1 bg-white/10 border border-emerald-400/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          autoFocus
                        />
                        <button
                          onClick={() =>
                            saveField({ field: "hero_subtitle", type: "name" })
                          }
                          className="p-3 bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-colors"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 group">
                        <span className="text-emerald-50/70">
                          {officials.heroSection?.subtitle ||
                            "Meet our dedicated team serving Iba O' Este"}
                        </span>
                        <button
                          onClick={() =>
                            startEditing(
                              "hero_subtitle",
                              officials.heroSection?.subtitle,
                            )
                          }
                          className="p-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-2 block">
                    Hero Sidebar Photo
                  </label>
                  <div className="relative group aspect-video bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                    <img
                      src={officials.heroSection?.image || ""}
                      alt="Hero Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                      <label className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold cursor-pointer hover:bg-emerald-400 hover:scale-105 transition-all shadow-xl flex items-center gap-2">
                        <Camera className="w-5 h-5" /> Change Hero Image
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleHeroImageUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EditableField
              label="Punong Barangay"
              field="chairman"
              value={officials.chairman}
              icon={Shield}
            />
            <div className="bg-white rounded-3xl p-6 border border-blue-50 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase">
                  Vision & Mission Statements
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1 block">
                    Our Vision
                  </label>
                  {editingField?.field === "vision" ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1 bg-gray-100 rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            saveField({ field: "vision", type: "name" })
                          }
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex justify-between items-start group/edit hover:bg-gray-50 p-2 rounded-xl transition-all cursor-pointer"
                      onClick={() => startEditing("vision", officials.vision)}
                    >
                      <p className="text-xs text-gray-600 leading-relaxed italic pr-8">
                        "{officials.vision}"
                      </p>
                      <Edit2 className="w-3 h-3 text-gray-300 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1 block">
                    Our Mission
                  </label>
                  {editingField?.field === "mission" ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1 bg-gray-100 rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            saveField({ field: "mission", type: "name" })
                          }
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex justify-between items-start group/edit hover:bg-gray-50 p-2 rounded-xl transition-all cursor-pointer"
                      onClick={() => startEditing("mission", officials.mission)}
                    >
                      <p className="text-xs text-gray-600 leading-relaxed pr-8">
                        {officials.mission}
                      </p>
                      <Edit2 className="w-3 h-3 text-gray-300 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-tight">
              <Users className="w-5 h-5 text-blue-600" />
              Sangguniang Barangay (Kagawad)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {officials.councilors.map((c, i) => (
                <EditableField
                  key={i}
                  label="Brgy. Kagawad"
                  field={`councilor_${i}`}
                  value={c}
                  icon={UserCog}
                  showCommittee={true}
                />
              ))}
            </div>
          </div>

          <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100">
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-tight">
              <Award className="w-5 h-5 text-orange-600" />
              SK Council (Kabataan)
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditableField
                  label="SK Chairman"
                  field="skChairman"
                  value={officials.skChairman}
                  icon={Shield}
                />
                <EditableField
                  label="SK Secretary"
                  field="skSecretary"
                  value={officials.skSecretary}
                  icon={UserCog}
                />
                <EditableField
                  label="SK Treasurer"
                  field="skTreasurer"
                  value={officials.skTreasurer}
                  icon={Award}
                />
              </div>

              <div className="border-t border-orange-200/50 pt-4">
                <h4 className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-[0.2em]">
                  Sangguniang Kabataan Kagawad
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {officials.skKagawads.map((c, i) => (
                    <EditableField
                      key={i}
                      label={`SK Kagawad ${i + 1}`}
                      field={`skKagawad_${i}`}
                      value={c}
                      icon={Users}
                      showCommittee={true}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-tight">
              <Building className="w-5 h-5 text-blue-600" />
              Administrative Staff
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EditableField
                label="Brgy. Secretary"
                field="secretary"
                value={officials.secretary}
                icon={UserCog}
              />
              <EditableField
                label="Brgy. Treasurer"
                field="treasurer"
                value={officials.treasurer}
                icon={Award}
              />
              <EditableField
                label="Brgy. Administrator"
                field="administrator"
                value={officials.administrator}
                icon={UserCog}
              />
              <EditableField
                label="Asst. Brgy. Secretary"
                field="assistantSecretary"
                value={officials.assistantSecretary}
                icon={UserCog}
              />
              <EditableField
                label="Asst. Brgy. Administrator"
                field="assistantAdministrator"
                value={officials.assistantAdministrator}
                icon={UserCog}
              />
              <EditableField
                label="Brgy. Record Keeper"
                field="recordKeeper"
                value={officials.recordKeeper}
                icon={UserCog}
              />
              <EditableField
                label="Brgy. Clerk"
                field="clerk"
                value={officials.clerk}
                icon={UserCog}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Branding & Header */}
      {activeTab === "branding" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-indigo-100 p-2 rounded-xl">
                <LayoutIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-widest text-gray-900">
                  Certificate Header Configuration
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                  Global metadata for official documents
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Country / Republic", field: "country" },
                { label: "Province Name", field: "province" },
                { label: "Municipality / City", field: "municipality" },
                { label: "Barangay Name", field: "barangayName" },
                { label: "Primary Office Name", field: "officeName" },
              ].map((item) => (
                <div key={item.field} className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    {item.label}
                  </label>
                  <input
                    type="text"
                    value={officials.headerInfo[item.field]}
                    onChange={(e) =>
                      setOfficials({
                        ...officials,
                        headerInfo: {
                          ...officials.headerInfo,
                          [item.field]: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                id: "left",
                label: "Primary Left Seal",
                field: "leftLogo",
                desc: "Main Barangay Logo",
              },
              {
                id: "right",
                label: "Secondary Right Seal",
                field: "rightLogo",
                desc: "Municipal/Provincial Logo",
              },
              {
                id: "captain",
                label: "Signatory Signature Image",
                field: "captainImage",
                desc: "Used for auto-signing documents",
              },
            ].map((logo) => (
              <div
                key={logo.id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg flex flex-col items-center"
              >
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  {logo.label}
                </div>
                <div className="relative group/logo w-40 h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden mb-4">
                  {officials.logos[logo.field] ? (
                    <>
                      <img
                        src={officials.logos[logo.field]}
                        className="max-w-[80%] max-h-[80%] object-contain"
                        alt={logo.label}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/logo:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm gap-3">
                        <button
                          onClick={() => removeLogo(logo.id)}
                          className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <Image className="w-12 h-12 text-gray-200" />
                  )}
                </div>
                <p className="text-[10px] text-gray-400 text-center px-4 mb-4">
                  {logo.desc}
                </p>
                <label className="w-full">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(logo.id, e)}
                  />
                  <div className="w-full py-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase text-center cursor-pointer hover:bg-gray-100 tracking-widest">
                    Update Asset
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Appearance & Themes */}
      {activeTab === "appearance" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-100 p-2 rounded-xl">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest text-gray-900">
                Visual Theme Configuration
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">
                  Document Header Styles
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker
                    label="Header Background"
                    value={officials.headerStyle.bgColor}
                    onChange={updateStyle}
                    section="headerStyle"
                    field="bgColor"
                  />
                  <ColorPicker
                    label="Accent Border"
                    value={officials.headerStyle.borderColor}
                    onChange={updateStyle}
                    section="headerStyle"
                    field="borderColor"
                  />
                </div>
                <FontSelect
                  label="Global Interface Font"
                  value={officials.headerStyle.fontFamily}
                  onChange={updateStyle}
                  section="headerStyle"
                  field="fontFamily"
                />

                <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Barangay Name Branding
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <ColorPicker
                      label="Brand Color"
                      value={officials.barangayNameStyle.color}
                      onChange={updateStyle}
                      section="barangayNameStyle"
                      field="color"
                    />
                    <SizeSlider
                      label="Font Size"
                      value={officials.barangayNameStyle.size}
                      onChange={updateStyle}
                      section="barangayNameStyle"
                      field="size"
                      min={16}
                      max={32}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">
                  Sidebar & UI Elements
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker
                    label="Sidebar Start"
                    value={officials.sidebarStyle.bgColor}
                    onChange={updateStyle}
                    section="sidebarStyle"
                    field="bgColor"
                  />
                  <ColorPicker
                    label="Sidebar End"
                    value={officials.sidebarStyle.gradientEnd}
                    onChange={updateStyle}
                    section="sidebarStyle"
                    field="gradientEnd"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker
                    label="Accent Text"
                    value={officials.sidebarStyle.labelColor}
                    onChange={updateStyle}
                    section="sidebarStyle"
                    field="labelColor"
                  />
                  <SizeSlider
                    label="Label Scaling"
                    value={officials.sidebarStyle.titleSize}
                    onChange={updateStyle}
                    section="sidebarStyle"
                    field="titleSize"
                    min={10}
                    max={20}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-3xl p-8 flex items-center justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3">
                <img
                  src={officials.logos.leftLogo || "/iba-o-este.png"}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">
                  Branding Engine Preview
                </div>
                <h3
                  className="text-2xl font-black text-white uppercase tracking-tight"
                  style={{ color: officials.barangayNameStyle.color }}
                >
                  {officials.headerInfo.barangayName}
                </h3>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
                  {officials.headerInfo.province} •{" "}
                  {officials.headerInfo.municipality}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portal Branding Tab */}
      {activeTab === "portal" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Live Preview */}
          <div
            className="rounded-3xl p-6 flex items-center gap-4 overflow-hidden relative"
            style={{
              background: `linear-gradient(to right, ${officials.portalBranding?.primaryColor || "#004700"}, ${officials.portalBranding?.secondaryColor || "#001a00"})`,
            }}
          >
            <img
              src={officials.portalBranding?.logoUrl || "/logo.png"}
              alt="Portal Logo"
              className="h-16 w-16 object-contain bg-white rounded-full p-1 shrink-0"
            />
            <div>
              <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-0.5">
                Live Preview
              </div>
              <h2 className="text-xl font-extrabold text-white">
                {officials.portalBranding?.portalName || "PORTAL NAME"}
              </h2>
              <p className="text-white/70 text-sm">
                {officials.portalBranding?.subtitle || "Subtitle"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2 rounded-xl">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">
                Portal Identity
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                  Portal Name (Header Title)
                </label>
                <input
                  type="text"
                  value={officials.portalBranding?.portalName || ""}
                  onChange={(e) => {
                    setOfficials({
                      ...officials,
                      portalBranding: {
                        ...officials.portalBranding,
                        portalName: e.target.value,
                      },
                    });
                    setHasChanges(true);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. IBA O' ESTE PORTAL"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                  Short Name
                </label>
                <input
                  type="text"
                  value={officials.portalBranding?.shortName || ""}
                  onChange={(e) => {
                    setOfficials({
                      ...officials,
                      portalBranding: {
                        ...officials.portalBranding,
                        shortName: e.target.value,
                      },
                    });
                    setHasChanges(true);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. Iba O' Este"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                  Subtitle (Municipality, Province)
                </label>
                <input
                  type="text"
                  value={officials.portalBranding?.subtitle || ""}
                  onChange={(e) => {
                    setOfficials({
                      ...officials,
                      portalBranding: {
                        ...officials.portalBranding,
                        subtitle: e.target.value,
                      },
                    });
                    setHasChanges(true);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. Calumpit, Bulacan"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={officials.portalBranding?.primaryColor || "#004700"}
                    onChange={(e) => {
                      setOfficials({
                        ...officials,
                        portalBranding: {
                          ...officials.portalBranding,
                          primaryColor: e.target.value,
                        },
                      });
                      setHasChanges(true);
                    }}
                    className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1"
                  />
                  <input
                    type="text"
                    value={officials.portalBranding?.primaryColor || "#004700"}
                    onChange={(e) => {
                      setOfficials({
                        ...officials,
                        portalBranding: {
                          ...officials.portalBranding,
                          primaryColor: e.target.value,
                        },
                      });
                      setHasChanges(true);
                    }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={
                      officials.portalBranding?.secondaryColor || "#001a00"
                    }
                    onChange={(e) => {
                      setOfficials({
                        ...officials,
                        portalBranding: {
                          ...officials.portalBranding,
                          secondaryColor: e.target.value,
                        },
                      });
                      setHasChanges(true);
                    }}
                    className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1"
                  />
                  <input
                    type="text"
                    value={
                      officials.portalBranding?.secondaryColor || "#001a00"
                    }
                    onChange={(e) => {
                      setOfficials({
                        ...officials,
                        portalBranding: {
                          ...officials.portalBranding,
                          secondaryColor: e.target.value,
                        },
                      });
                      setHasChanges(true);
                    }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">
                Portal Logo
              </label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden">
                  {officials.portalBranding?.logoUrl ? (
                    <img
                      src={officials.portalBranding.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 text-center px-2">
                      No logo
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                    <Camera className="w-4 h-4" />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setOfficials({
                            ...officials,
                            portalBranding: {
                              ...officials.portalBranding,
                              logoUrl: reader.result,
                            },
                          });
                          setHasChanges(true);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {officials.portalBranding?.logoUrl && (
                    <button
                      onClick={() => {
                        setOfficials({
                          ...officials,
                          portalBranding: {
                            ...officials.portalBranding,
                            logoUrl: "",
                          },
                        });
                        setHasChanges(true);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  )}
                  <p className="text-xs text-gray-400">
                    PNG or SVG recommended. Will appear in the portal header.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mission & Goals Tab */}
      {activeTab === "mission" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Barangay Vision */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <Eye className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">
                  Barangay Vision
                </h3>
              </div>
              <textarea
                rows={6}
                value={officials.missionGoals?.barangayVision || ""}
                onChange={(e) => {
                  setOfficials({
                    ...officials,
                    missionGoals: {
                      ...officials.missionGoals,
                      barangayVision: e.target.value,
                    },
                  });
                  setHasChanges(true);
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Enter the barangay's vision statement..."
              />
            </div>

            {/* Barangay Mission */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-xl">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">
                  Barangay Mission
                </h3>
              </div>
              <textarea
                rows={6}
                value={officials.missionGoals?.barangayMission || ""}
                onChange={(e) => {
                  setOfficials({
                    ...officials,
                    missionGoals: {
                      ...officials.missionGoals,
                      barangayMission: e.target.value,
                    },
                  });
                  setHasChanges(true);
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Enter the barangay's mission statement..."
              />
            </div>

            {/* Barangay Goal */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">
                  Barangay Goal
                </h3>
              </div>
              <textarea
                rows={4}
                value={officials.missionGoals?.barangayGoal || ""}
                onChange={(e) => {
                  setOfficials({
                    ...officials,
                    missionGoals: {
                      ...officials.missionGoals,
                      barangayGoal: e.target.value,
                    },
                  });
                  setHasChanges(true);
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter the barangay's goal..."
              />
            </div>

            {/* Divider */}
            <div className="lg:col-span-2 border-t border-gray-100 pt-2">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Sangguniang Kabataan
              </p>
            </div>

            {/* SK Vision */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-xl">
                  <Eye className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">
                  SK Vision
                </h3>
              </div>
              <textarea
                rows={6}
                value={officials.missionGoals?.skVision || ""}
                onChange={(e) => {
                  setOfficials({
                    ...officials,
                    missionGoals: {
                      ...officials.missionGoals,
                      skVision: e.target.value,
                    },
                  });
                  setHasChanges(true);
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                placeholder="Enter the SK's vision statement..."
              />
            </div>

            {/* SK Mission */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-xl">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">
                  SK Mission
                </h3>
              </div>
              <textarea
                rows={6}
                value={officials.missionGoals?.skMission || ""}
                onChange={(e) => {
                  setOfficials({
                    ...officials,
                    missionGoals: {
                      ...officials.missionGoals,
                      skMission: e.target.value,
                    },
                  });
                  setHasChanges(true);
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Enter the SK's mission statement..."
              />
            </div>

            {/* SK Goal */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-xl">
                  <Award className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">
                  SK Goal
                </h3>
              </div>
              <textarea
                rows={4}
                value={officials.missionGoals?.skGoal || ""}
                onChange={(e) => {
                  setOfficials({
                    ...officials,
                    missionGoals: {
                      ...officials.missionGoals,
                      skGoal: e.target.value,
                    },
                  });
                  setHasChanges(true);
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                placeholder="Enter the SK's goal..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Contact & Hotlines Tab */}
      {activeTab === "contact" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Contact Info */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-xl">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">
                Contact Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                  Address
                </label>
                <input
                  type="text"
                  value={officials.siteContact?.address || ""}
                  onChange={(e) => {
                    setOfficials({
                      ...officials,
                      siteContact: {
                        ...officials.siteContact,
                        address: e.target.value,
                      },
                    });
                    setHasChanges(true);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Barangay address"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                  Phone
                </label>
                <input
                  type="text"
                  value={officials.siteContact?.phone || ""}
                  onChange={(e) => {
                    setOfficials({
                      ...officials,
                      siteContact: {
                        ...officials.siteContact,
                        phone: e.target.value,
                      },
                    });
                    setHasChanges(true);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(044) 123-4567"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                  Email
                </label>
                <input
                  type="text"
                  value={officials.siteContact?.email || ""}
                  onChange={(e) => {
                    setOfficials({
                      ...officials,
                      siteContact: {
                        ...officials.siteContact,
                        email: e.target.value,
                      },
                    });
                    setHasChanges(true);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="email@barangay.gov.ph"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                Office Hours
              </label>
              <textarea
                rows={4}
                value={officials.siteContact?.officeHours || ""}
                onChange={(e) => {
                  setOfficials({
                    ...officials,
                    siteContact: {
                      ...officials.siteContact,
                      officeHours: e.target.value,
                    },
                  });
                  setHasChanges(true);
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder={
                  "Monday - Friday: 8:00 AM - 5:00 PM\nSaturday: 8:00 AM - 12:00 PM\nSunday: Closed"
                }
              />
            </div>
          </div>

          {/* Emergency Hotlines */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">
                  Emergency Hotlines
                </h3>
              </div>
              <button
                onClick={() => {
                  const newHotlines = [
                    ...(officials.siteContact?.hotlines || []),
                    { name: "", number: "" },
                  ];
                  setOfficials({
                    ...officials,
                    siteContact: {
                      ...officials.siteContact,
                      hotlines: newHotlines,
                    },
                  });
                  setHasChanges(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              >
                + Add Hotline
              </button>
            </div>
            <div className="space-y-3">
              {(officials.siteContact?.hotlines || []).map((hotline, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={hotline.name}
                    onChange={(e) => {
                      const h = [...officials.siteContact.hotlines];
                      h[i] = { ...h[i], name: e.target.value };
                      setOfficials({
                        ...officials,
                        siteContact: { ...officials.siteContact, hotlines: h },
                      });
                      setHasChanges(true);
                    }}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="e.g. Barangay Emergency"
                  />
                  <input
                    type="text"
                    value={hotline.number}
                    onChange={(e) => {
                      const h = [...officials.siteContact.hotlines];
                      h[i] = { ...h[i], number: e.target.value };
                      setOfficials({
                        ...officials,
                        siteContact: { ...officials.siteContact, hotlines: h },
                      });
                      setHasChanges(true);
                    }}
                    className="w-48 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="(044) 123-4567"
                  />
                  <button
                    onClick={() => {
                      const h = officials.siteContact.hotlines.filter(
                        (_, idx) => idx !== i,
                      );
                      setOfficials({
                        ...officials,
                        siteContact: { ...officials.siteContact, hotlines: h },
                      });
                      setHasChanges(true);
                    }}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {croppingImg && (
        <ImageCropperModal
          src={croppingImg}
          onApply={handleApplyCrop}
          onCancel={() => {
            setCroppingImg(null);
            setTargetField(null);
          }}
          cropWidth={targetField === "hero_image" ? 1920 : 600}
          cropHeight={targetField === "hero_image" ? 900 : 600}
          modalTitle={
            targetField === "hero_image"
              ? "CROP HERO BANNER"
              : "CROP PROFILE PHOTO"
          }
          modalSubtitle={
            targetField === "hero_image"
              ? "1920x900 Header Resolution"
              : "2x2 Official Resolution"
          }
          outputFormat={
            targetField === "hero_image" ? "image/jpeg" : "image/png"
          }
          quality={targetField === "hero_image" ? 0.85 : undefined}
        />
      )}
    </div>
  );
}

OfficialsPage.getLayout = (page) => (
  <Layout
    title="Barangay Officials"
    subtitle="BARANGAY LEADERSHIP & ORGANIZATIONAL STRUCTURE"
  >
    {page}
  </Layout>
);
