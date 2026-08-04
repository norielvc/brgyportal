import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Plus,
  Send,
  Phone,
  MapPin,
  Mail,
  Clock,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Users,
  FileText,
  Award,
  Building2,
  Heart,
  Baby,
  AlertTriangle,
  Shield,
  Home,
  Calendar,
  TrendingUp,
  CheckCircle,
  GraduationCap,
  User,
  Store,
  Briefcase,
  Stethoscope,
  Fingerprint,
  UserPlus,
  Flower2,
  Search,
  Star,
  Leaf,
  Laptop,
  Trophy,
  Target,
  Quote,
  Navigation,
  MessageCircle,
  HeadphonesIcon,
  Image as ImageIcon,
} from "lucide-react";
import BarangayClearanceModal from "@/components/Forms/BarangayClearanceModal";
import IndigencyCertificateModal from "@/components/Forms/IndigencyCertificateModal";
import ResidencyCertificateModal from "@/components/Forms/ResidencyCertificateModal";
import BusinessPermitModal from "@/components/Forms/BusinessPermitModal";
import EducationalAssistanceModal from "@/components/Forms/EducationalAssistanceModal";
import NaturalDeathCertificateModal from "@/components/Forms/NaturalDeathCertificateModal";
import GuardianshipCertificateModal from "@/components/Forms/GuardianshipCertificateModal";
import CohabitationCertificateModal from "@/components/Forms/CohabitationCertificateModal";
import MedicoLegalModal from "@/components/Forms/MedicoLegalModal";
import SamePersonCertificateModal from "@/components/Forms/SamePersonCertificateModal";

export default function PortalPageContent({ initialTenantId }) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState((initialTenantId || "ibaoeste").toLowerCase());

  // Version Check Log
  useEffect(() => {
    console.log("🚀 Barangay Portal Loaded: Version 2.7 (Dynamic Themes)");
  }, []);

  const [tenantConfig, setTenantConfig] = useState({
    name: "BARANGAY",
    shortName: "Barangay",
    subtitle: "Public Information and Service Center",
    logo: "/logo.png",
    colorStyle: {
      background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
    },
    primaryColor: "#059669",
    primaryHover: "#047857",
    accentColor: "#10b981",
    secondaryColor: "#34d399",
    cardBackground: "#064e3b",
    darkBackground: "from-[#064e3b] to-[#022c22]",
    darkHeader: "from-[#022c22] via-[#064e3b] to-[#022c22]",
  });

  // Resilient API URL Discovery - uses internal Next.js /api route
  const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL)
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
    return "/api";
  };

  const API_URL = getApiUrl().replace(/\/$/, "");

  useEffect(() => {
    if (initialTenantId) setTenantId(initialTenantId.toLowerCase());
  }, [initialTenantId]);

  // Default color palette for non-demo tenants
  const defaultColors = {
    primaryColor: "#059669",
    primaryHover: "#047857",
    accentColor: "#10b981",
    secondaryColor: "#34d399",
    cardBackground: "#064e3b",
    colorStyle: {
      background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
    },
    darkBackground: "from-[#064e3b] to-[#022c22]",
    darkHeader: "from-[#022c22] via-[#064e3b] to-[#022c22]",
  };

  useEffect(() => {
    if (tenantId === "demo") {
      setTenantConfig({
        tenant_id: "demo",
        name: "DEMO BARANGAY",
        shortName: "Demo Barangay",
        subtitle: "Sample Municipality, Philippines",
        logo: "/images/bdlogo.png",
        colorStyle: {
          background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
        },
        primaryColor: "#111111",
        primaryHover: "#222222",
        accentColor: "#C9A84C",
        secondaryColor: "#333333",
        cardBackground: "#111111",
        darkBackground: "from-black to-zinc-900",
        darkHeader: "from-black via-zinc-950 to-black",
      });
      return;
    }

    // Fetch tenant info from DB
    let cancelled = false;
    const fetchTenantInfo = async () => {
      try {
        const res = await fetch("/api/portal/tenant-info", {
          headers: { "x-tenant-id": tenantId },
        });
        const json = await res.json();
        if (cancelled) return;

        const tenant = json.data;
        const displayName = tenant?.name || "BARANGAY";
        const shortName = displayName
          .toLowerCase()
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        const subtitle = tenant?.domain || "Official Barangay Portal";

        setTenantConfig({
          tenant_id: tenantId,
          name: displayName.toUpperCase(),
          shortName,
          subtitle,
          logo: "/logo.png",
          ...defaultColors,
        });
      } catch {
        if (cancelled) return;
        setTenantConfig({
          tenant_id: tenantId,
          name: "BARANGAY",
          shortName: "Barangay",
          subtitle: "Official Barangay Portal",
          logo: "/logo.png",
          ...defaultColors,
        });
      }
    };
    fetchTenantInfo();
    return () => { cancelled = true; };
  }, [tenantId]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showHotlines, setShowHotlines] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [weatherInfo, setWeatherInfo] = useState({
    icon: Sun,
    text: "Loading...",
    color: "text-yellow-400",
  });
  const [showClearanceModal, setShowClearanceModal] = useState(false);
  const [showIndigencyModal, setShowIndigencyModal] = useState(false);
  const [showResidencyModal, setShowResidencyModal] = useState(false);
  const [showBusinessPermitModal, setShowBusinessPermitModal] = useState(false);
  const [showEducationalAssistanceModal, setShowEducationalAssistanceModal] =
    useState(false);
  const [showNaturalDeathModal, setShowNaturalDeathModal] = useState(false);
  const [showGuardianshipModal, setShowGuardianshipModal] = useState(false);
  const [showCohabitationModal, setShowCohabitationModal] = useState(false);
  const [showMedicoLegalModal, setShowMedicoLegalModal] = useState(false);
  const [showSamePersonModal, setShowSamePersonModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [selectedNewsItem, setSelectedNewsItem] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [currentFormSlide, setCurrentFormSlide] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [itemsPerView, setItemsPerView] = useState(4);
  const [heroCarouselIndex, setHeroCarouselIndex] = useState(0);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilityImageIndex, setFacilityImageIndex] = useState(0);

  const [subscription, setSubscription] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lockedFeature, setLockedFeature] = useState(null);

  // Fetch subscription info for this tenant to handle feature gating
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!tenantId) return;
      try {
        // Residents can see public subscription status (plan name/features)
        const res = await fetch(`/api/subscription/usage?tenantId=${tenantId}`);
        // Guard: only parse JSON if the response is actually JSON (not a 404 HTML page)
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) {
          console.warn("Subscription API unavailable, skipping feature gating.");
          return;
        }
        const data = await res.json();
        if (data.success) {
          setSubscription(data.data);
        }
      } catch (e) {
        console.error("Subscription fetch error:", e);
      }
    };
    fetchSubscription();
  }, [tenantId]);

  const isFeatureLocked = (featureKey) => {
    if (!subscription) return false; // Still loading
    
    // Pro plan bypass - all features unlocked
    if (subscription.planId === 'pro' || subscription.requests?.total === -1) {
      return false;
    }
    
    // Standard plan - basic 3 certificates + portal sections always unlocked
    const basicCertificates = ['barangay_clearance', 'certificate_of_indigency', 'barangay_residency'];
    const standardFeatures = ['facilities', 'programs', 'achievements'];
    
    if (subscription.planId === 'standard') {
      if (basicCertificates.includes(featureKey) || standardFeatures.includes(featureKey)) {
        return false;
      }
    }
    
    // Check if featureKey is in the allowed list from database
    return subscription.features && !subscription.features.includes(featureKey);
  };

  const handleFeatureClick = (featureKey, featureTitle, openModalAction) => {
    if (isFeatureLocked(featureKey)) {
      setLockedFeature(featureTitle);
      setShowUpgradeModal(true);
      return;
    }
    openModalAction(true);
  };

  const forms = useMemo(
    () => [
      {
        id: "barangay_clearance",
        title: "Barangay Clearance",
        description:
          "Official clearance for employment, business permits, and other legal purposes.",
        icon: Shield,
        color: "blue",
        features: ["Employment", "Business", "Legal"],
        locked: isFeatureLocked("barangay_clearance"),
        onClick: () => handleFeatureClick("barangay_clearance", "Barangay Clearance", setShowClearanceModal),
      },
      {
        id: "certificate_of_indigency",
        title: "Certificate of Indigency",
        description:
          "Proof of financial status for medical, educational, and social assistance programs.",
        icon: FileText,
        color: "green",
        features: ["Medical", "Education", "Assistance"],
        locked: isFeatureLocked("certificate_of_indigency"),
        onClick: () => handleFeatureClick("certificate_of_indigency", "Certificate of Indigency", setShowIndigencyModal),
      },
      {
        id: "barangay_residency",
        title: "Barangay Residency",
        description: `Certificate confirming your residence in ${tenantConfig.shortName} for various requirements.`,
        icon: Home,
        color: "orange",
        features: ["Proof", "Enrollment", "ID"],
        locked: isFeatureLocked("barangay_residency"),
        onClick: () => handleFeatureClick("barangay_residency", "Barangay Residency", setShowResidencyModal),
      },
      {
        id: "business_permit",
        title: "Business Permit",
        description: `Official permit to operate a business within ${tenantConfig.shortName} barangay jurisdiction.`,
        icon: Building2,
        color: "purple",
        features: ["New Business", "Renewal", "Transfer"],
        locked: isFeatureLocked("business_permit"),
        onClick: () => handleFeatureClick("business_permit", "Business Permit", setShowBusinessPermitModal),
      },
      {
        id: "business_closure",
        title: "Business Closure",
        description:
          "Official notice to cease business operations within the barangay.",
        icon: Briefcase,
        color: "blue",
        features: ["Liquidation", "Permit Exit", "Tax Clearance"],
        locked: isFeatureLocked("business_permit"), // Grouped with business
        onClick: () => handleFeatureClick("business_permit", "Business Closure", setShowComingSoonModal),
      },
      {
        id: "barangay_cohabitation",
        title: "Co-habitation",
        description:
          "Certification for couples living together without formal marriage.",
        icon: Heart,
        color: "green",
        features: ["Live-in", "Relationship", "Proof"],
        locked: isFeatureLocked("barangay_cohabitation"),
        onClick: () => handleFeatureClick("barangay_cohabitation", "Co-habitation", setShowCohabitationModal),
      },
      {
        id: "medico_legal",
        title: "Medico-legal",
        description:
          "Official document for cases requiring medical and legal coordination.",
        icon: Stethoscope,
        color: "orange",
        features: ["Accident", "Legal Case", "Medical Report"],
        locked: isFeatureLocked("medico_legal"),
        onClick: () => handleFeatureClick("medico_legal", "Medico-legal", setShowMedicoLegalModal),
      },
      {
        id: "certification_same_person",
        title: "Certification of Same Person",
        description:
          "Certification that differences in name records refer to the same individual.",
        icon: Fingerprint,
        color: "purple",
        features: ["ID Match", "Affidavit", "Verification"],
        locked: isFeatureLocked("certification_same_person"),
        onClick: () => handleFeatureClick("certification_same_person", "Certification of Same Person", setShowSamePersonModal),
      },
      {
        id: "barangay_guardianship",
        title: "Guardianship",
        description:
          "Legal certification for designated guardians of minors or dependents.",
        icon: UserPlus,
        color: "blue",
        features: ["Legal Guardian", "Minor Support", "Custody"],
        locked: isFeatureLocked("barangay_guardianship"),
        onClick: () => handleFeatureClick("barangay_guardianship", "Guardianship", setShowGuardianshipModal),
      },
      {
        id: "natural_death",
        title: "Natural Death",
        description:
          "Official certification for natural death recording and burial requirements.",
        icon: Flower2,
        color: "green",
        features: ["Certified", "Family Record", "Cemetery"],
        locked: isFeatureLocked("natural_death"),
        onClick: () => handleFeatureClick("natural_death", "Natural Death", setShowNaturalDeathModal),
      },
      {
        id: "educational_assistance",
        title: "Educational Assistance",
        description:
          "Apply for scholarship and financial support for studying residents.",
        icon: GraduationCap,
        color: "blue",
        features: ["Scholarship", "Allowance", "Education"],
        locked: isFeatureLocked("educational_assistance"),
        onClick: () => handleFeatureClick("educational_assistance", "Educational Assistance", setShowEducationalAssistanceModal),
      },
    ],
    [
      setShowClearanceModal,
      setShowIndigencyModal,
      setShowResidencyModal,
      setShowBusinessPermitModal,
      setShowGuardianshipModal,
      setShowComingSoonModal,
      setShowNaturalDeathModal,
      setShowCohabitationModal,
      setShowMedicoLegalModal,
      setShowSamePersonModal,
      setShowEducationalAssistanceModal,
      tenantConfig.shortName,
      subscription, // Important: re-memo if subscription data changes
    ],
  );

  // Responsive items per view for forms carousel
  useEffect(() => {
    const handleResize = () => {
      let newItemsPerView;
      if (window.innerWidth < 768) {
        newItemsPerView = 1;
      } else if (window.innerWidth < 1024) {
        newItemsPerView = 2;
      } else {
        newItemsPerView = 4;
      }
      setItemsPerView(newItemsPerView);
      setCurrentFormSlide((prev) =>
        Math.min(prev, forms.length - (newItemsPerView - 1)),
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [forms.length]);

  // Events load from DB per tenant - no hardcoded defaults
  const [newsItems, setNewsItems] = useState([]);

  // Facilities load from DB per tenant - no hardcoded defaults
  const [facilities, setFacilities] = useState([]);
  const [officials, setOfficials] = useState([]);
  const [visibilitySettings, setVisibilitySettings] = useState(null);

  const [achievements, setAchievements] = useState([]);

  const [programs, setPrograms] = useState([]);
  const [tourismDestinations, setTourismDestinations] = useState([]);
  const [heroSettings, setHeroSettings] = useState({
    title: "BARANGAY OFFICIALS",
    subtitle: "Meet our dedicated team serving our community",
    image: "", // No default image - upload via management page
  });

  // Helper function to map icon names to components
  const getIconComponent = (iconName) => {
    const iconMap = {
      Heart: Heart,
      Building2: Building2,
      Baby: Baby,
      Home: Home,
      Award: Award,
    };
    return iconMap[iconName] || Building2;
  };

  // Touch/swipe handling for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    const currentFacilityIndex = facilityImageSlides["main"] || 0;
    const facility = facilities[currentFacilityIndex];
    const currentImageIndex = facilityImageSlides[currentFacilityIndex] || 0;

    console.log("Swipe detected:", {
      distance,
      isLeftSwipe,
      isRightSwipe,
      currentImageIndex,
      totalImages: facility.images.length,
    });

    if (isLeftSwipe && facility.images.length > 1) {
      // Swipe left - next image in current facility
      const nextIndex = (currentImageIndex + 1) % facility.images.length;
      console.log("Swiping to next image:", nextIndex);
      setFacilityImageSlides((prev) => ({
        ...prev,
        [currentFacilityIndex]: nextIndex,
      }));
    }
    if (isRightSwipe && facility.images.length > 1) {
      // Swipe right - previous image in current facility
      const prevIndex =
        (currentImageIndex - 1 + facility.images.length) %
        facility.images.length;
      console.log("Swiping to previous image:", prevIndex);
      setFacilityImageSlides((prev) => ({
        ...prev,
        [currentFacilityIndex]: prevIndex,
      }));
    }

    // Reset touch values
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Load events from API
  useEffect(() => {
    const fetchEvents = async () => {
      if (!tenantId) return;
      try {
        console.log(
          `📡 Fetching events from resilient Next.js API for tenant: ${tenantId}`,
        );
        const response = await fetch(`/api/portal/events`, {
          headers: { "x-tenant-id": tenantId },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          console.log("✅ Setting events from API:", data.data);
          setNewsItems(data.data);
        } else {
          throw new Error("API results empty - falling back");
        }
      } catch (error) {
        console.error(
          "❌ Events API failed - no fallback data will be shown",
          error.message,
        );
        // Don't show fake data - leave empty
        setNewsItems([]);
      }
    };

    fetchEvents();
  }, [tenantId]);

  // SELF-HEALING: Reset currentSlide if it becomes NaN or out of bounds when data arrives
  useEffect(() => {
    if (
      newsItems.length > 0 &&
      (isNaN(currentSlide) || currentSlide >= newsItems.length)
    ) {
      console.log(
        "🔄 Self-healing: Resetting currentSlide from",
        currentSlide,
        "to 0",
      );
      setCurrentSlide(0);
    }
  }, [newsItems, currentSlide]);

  // Load facilities from API
  useEffect(() => {
    const fetchFacilities = async () => {
      if (!tenantId) return;
      try {
        console.log(
          `📡 Fetching facilities from resilient Next.js API for tenant: ${tenantId}`,
        );
        const response = await fetch(`/api/portal/facilities`, {
          headers: { "x-tenant-id": tenantId },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          // Map icon names to actual components
          const facilitiesWithIcons = data.data.map((facility) => ({
            ...facility,
            icon: getIconComponent(facility.icon),
          }));
          console.log("✅ Setting facilities from API:", facilitiesWithIcons);
          setFacilities(facilitiesWithIcons);
        } else {
          throw new Error("API results empty - falling back");
        }
      } catch (error) {
        console.error(
          "❌ Facilities API failed - no fallback data will be shown",
          error.message,
        );
        // Don't show fake data - leave empty
        setFacilities([]);
      }
    };

    fetchFacilities();
  }, [tenantId]);

  // Set up 5-second interval for hero carousel auto transition
  useEffect(() => {
    const totalImages =
      facilities
        .flatMap((f) => f.images || [])
        .filter((img, i, arr) => arr.indexOf(img) === i).length || 1;
    // Don't setup interval if there aren't multiple images to flip through
    if (totalImages <= 1) return;

    const timer = setInterval(() => {
      setHeroCarouselIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(timer);
  }, [facilities]);

  // Fetch local government details and achievements
  useEffect(() => {
    const fetchData = async () => {
      if (!tenantId) return;
      console.log(
        `🌐 BRGY PORTAL [V2.5]: Fetching dynamic content for tenant: ${tenantId}`,
      );

      try {
        // Fetch Officials via resilient Next.js API
        const officialsRes = await fetch(`/api/portal/officials`, {
          headers: { "x-tenant-id": tenantId },
        });

        if (!officialsRes.ok) {
          const errorText = await officialsRes.text();
          throw new Error(`API error ${officialsRes.status}: ${errorText}`);
        }

        const officialsData = await officialsRes.json();
        if (officialsData.success && Array.isArray(officialsData.data)) {
          setOfficials(officialsData.data);
        }
      } catch (err) {
        console.error(
          "❌ Officials API failed - no fallback data will be shown",
          err.message,
        );
        // Don't show fake data - leave empty
        setOfficials([]);
      }

      try {
        const configRes = await fetch(`${API_URL}/officials/config`, {
          headers: { "x-tenant-id": tenantId },
        });
        if (configRes.ok) {
          const settingsData = await configRes.json();
          if (settingsData.success && settingsData.data) {
            if (settingsData.data.heroSection)
              setHeroSettings(settingsData.data.heroSection);
            if (settingsData.data.visibility)
              setVisibilitySettings(settingsData.data.visibility);
          }
        }
      } catch (err) {
        console.warn("📡 API Fallback: Config skipped");
      }

      try {
        const achievementsRes = await fetch(`/api/portal/achievements`, {
          headers: { "x-tenant-id": tenantId },
        });

        if (achievementsRes.ok) {
          const achievementsData = await achievementsRes.json();
          if (
            achievementsData.success &&
            Array.isArray(achievementsData.data)
          ) {
            setAchievements(
              achievementsData.data.map((ach) => ({
                ...ach,
                colorClass: ach.color_class || "bg-blue-600",
                textColor: ach.text_color || "blue-400",
              })),
            );
          }
        }
      } catch (err) {
        console.error("❌ Achievements API failed - no fallback data will be shown", err.message);
        // Don't show fake data - leave empty
        setAchievements([]);
      }

      try {
        // Fetch Programs via resilient Next.js API
        const programsRes = await fetch(`/api/portal/programs`, {
          headers: { "x-tenant-id": tenantId },
        });
        if (programsRes.ok) {
          const programsData = await programsRes.json();
          if (programsData.success && Array.isArray(programsData.data)) {
            setPrograms(programsData.data);
          }
        }
      } catch (error) {
        console.error("❌ Programs API failed - no fallback data will be shown", error.message);
        // Don't show fake data - leave empty
        setPrograms([]);
      }

      try {
        // Fetch Tourism via resilient Next.js API
        const tourismRes = await fetch(`/api/portal/tourism`, {
          headers: { "x-tenant-id": tenantId },
        });
        if (tourismRes.ok) {
          const tourismData = await tourismRes.json();
          if (tourismData.success && Array.isArray(tourismData.data)) {
            const mapped = tourismData.data.map((d) => ({
              id: d.id,
              name: d.name,
              image: d.image || "",
              description: d.description || "",
              directions: d.directions_url || `https://maps.google.com/?q=${encodeURIComponent(d.name)}`,
            }));
            setTourismDestinations(mapped);
          }
        }
      } catch (error) {
        console.error("❌ Tourism API failed:", error.message);
      }

      try {
        // Fetch Website Config (Hero, Visibility, Contact, Branding)
        const configRes = await fetch(`/api/portal/config`, {
          headers: { "x-tenant-id": tenantId },
        });
        if (configRes.ok) {
          const settingsData = await configRes.json();
          if (settingsData.success && settingsData.data) {
            const data = settingsData.data;
            if (data.heroSection) setHeroSettings(data.heroSection);
            if (data.visibility) setVisibilitySettings(data.visibility);
            // ... Handle branding merge here if needed
          }
        }
      } catch (err) {
        console.warn("📡 API Fallback: Config skipped");
      }
    };

    fetchData();
  }, [tenantId]);

  // Update time and weather every second
  useEffect(() => {
    const updateTimeAndWeather = () => {
      const now = new Date();
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
      };
      setCurrentTime(now.toLocaleDateString("en-PH", options));

      // Get current hour for weather logic
      const hour = now.getHours();

      // Dynamic weather based on time of day
      let weather;
      if (hour >= 6 && hour < 12) {
        // Morning (6 AM - 12 PM)
        weather = {
          icon: Sun,
          text: "Morning, 28°C",
          color: "text-yellow-400",
        };
      } else if (hour >= 12 && hour < 18) {
        // Afternoon (12 PM - 6 PM)
        weather = {
          icon: Sun,
          text: "Afternoon, 31°C",
          color: "text-orange-400",
        };
      } else if (hour >= 18 && hour < 21) {
        // Evening (6 PM - 9 PM)
        weather = {
          icon: Cloud,
          text: "Evening, 26°C",
          color: "text-blue-300",
        };
      } else {
        // Night (9 PM - 6 AM)
        weather = {
          icon: Moon,
          text: "Night, 24°C",
          color: "text-blue-200",
        };
      }

      setWeatherInfo(weather);
    };

    updateTimeAndWeather();
    const interval = setInterval(updateTimeAndWeather, 1000);
    return () => clearInterval(interval);
  }, []);

  // Hero news carousel auto-slide with NaN guard
  useEffect(() => {
    if (newsItems.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % newsItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [newsItems.length]);

  // State for facility image slides
  const [facilityImageSlides, setFacilityImageSlides] = useState({});

  // Initialize facility slides
  useEffect(() => {
    const initial = {};
    facilities.forEach((_, index) => {
      initial[index] = 0;
    });
    setFacilityImageSlides(initial);
  }, [facilities]);

  // Forms carousel auto-slide removed as per user request

  // Facilities auto-transition
  useEffect(() => {
    const interval = setInterval(() => {
      setFacilityImageSlides((prev) => {
        const updated = { ...prev };
        const currentFacilityIndex = updated["main"] || 0;
        const currentFacility = facilities[currentFacilityIndex];
        // Safety check
        if (!currentFacility) return prev;

        const currentImageIndex = updated[currentFacilityIndex] || 0;
        const images = currentFacility.images || [];

        // Check if current facility has multiple images
        if (images.length > 1) {
          // If not at last image of current facility, go to next image
          if (currentImageIndex < images.length - 1) {
            updated[currentFacilityIndex] = currentImageIndex + 1;
          } else {
            // At last image of current facility, move to next facility
            const nextFacilityIndex =
              (currentFacilityIndex + 1) % facilities.length;
            updated["main"] = nextFacilityIndex;
            updated[nextFacilityIndex] = 0; // Start from first image of next facility
          }
        } else {
          // Current facility has only one image, move to next facility
          const nextFacilityIndex =
            (currentFacilityIndex + 1) % facilities.length;
          updated["main"] = nextFacilityIndex;
          updated[nextFacilityIndex] = 0; // Start from first image of next facility
        }

        return updated;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [facilities]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: [0, 0.1], // Trigger as soon as even 1px is visible
      rootMargin: "0px 0px 100px 0px", // Load 100px before it enters the viewport
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, observerOptions);

    const animatableElements = document.querySelectorAll(".animate-on-scroll");
    
    // Check if we should immediately activate based on hash or immediate visibility
    const currentHash = window.location.hash;
    animatableElements.forEach((el) => {
      if (currentHash && el.id && currentHash === `#${el.id}`) {
        el.classList.add("active");
      }
      observer.observe(el);
    });

    return () => {
      animatableElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const stats = [
    { label: "Total Population", value: "12,847", icon: Users },
    { label: "Active Programs", value: "24", icon: TrendingUp },
    { label: "Forms Processed This Month", value: "1,256", icon: FileText },
  ];

  const hotlines = [
    { name: "Barangay Emergency", number: "(044) 123-4567" },
    { name: "Police Station", number: "911" },
    { name: "Fire Department", number: "(044) 765-4321" },
    { name: "Medical Emergency", number: "(044) 987-6543" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Message sent successfully! We will get back to you soon.");
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: "",
    });
  };

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
    >
      <Head>
        <title>{tenantConfig.shortName} — Official Barangay Portal</title>
        <meta name="description" content={`Official online portal of ${tenantConfig.name}, ${tenantConfig.subtitle}. Request certificates, track requests, and access barangay services online.`} />
        <meta name="keywords" content="barangay, portal, certificate, clearance, permit, online services, Philippines, local government" />
        <meta name="author" content={tenantConfig.name} />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${tenantConfig.shortName} — Official Barangay Portal`} />
        <meta property="og:description" content={`Official online portal of ${tenantConfig.name}, ${tenantConfig.subtitle}. Request certificates, track requests, and access barangay services online.`} />
        <meta property="og:image" content={tenantConfig.logo} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${tenantConfig.shortName} — Official Barangay Portal`} />
        <meta name="twitter:description" content={`Official online portal of ${tenantConfig.name}, ${tenantConfig.subtitle}.`} />

        {/* Theme Color */}
        <meta name="theme-color" content={tenantConfig.primaryColor} />

        {/* Canonical */}
        <link rel="canonical" href={`https://brgydesk.vercel.app/${tenantId}`} />
      </Head>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap");

        * {
          font-family: "Outfit", "Inter", sans-serif !important;
          scroll-behavior: smooth;
        }

        .glass-nav {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        }

        .nav-link {
          position: relative;
          font-weight: 600;
          letter-spacing: -0.01em;
          transition: all 0.3s ease;
        }

        .nav-link::after {
          content: "";
          position: absolute;
          bottom: -4px;
          left: 50%;
          width: 0;
          height: 2px;
          background: ${tenantConfig.accentColor};
          transition: all 0.3s ease;
          transform: translateX(-50%);
          border-radius: 2px;
        }

        .nav-link:hover::after {
          width: 20px;
        }

        .premium-shadow {
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
        }

        .animate-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }

        .animate-on-scroll.active {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 768px) {
          .animate-on-scroll {
            transition-duration: 0.4s;
            transform: translateY(15px);
          }
        }

        .hero-gradient {
          background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.85) 0%,
            rgba(0, 0, 0, 0.4) 100%
          );
        }

        nav a:hover {
          color: ${tenantConfig.accentColor} !important;
        }
        .mobile-nav-link:hover {
          color: ${tenantConfig.accentColor} !important;
        }
        .program-card:hover .program-title {
          color: ${tenantConfig.accentColor} !important;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
          .animate-on-scroll {
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
      {/* Skip to Content — Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:rounded-lg focus:shadow-xl focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>

      {/* RP Government Masthead */}
      <div className="bg-gray-900 text-white/90 py-1.5 px-4 text-center text-[10px] sm:text-xs font-medium tracking-wide border-b border-white/10">
        <span className="hidden sm:inline">Republic of the Philippines</span>
        <span className="hidden sm:inline mx-2 text-white/30">|</span>
        <span>{tenantConfig.subtitle}</span>
        <span className="hidden sm:inline mx-2 text-white/30">|</span>
        <span className="hidden sm:inline">Official Barangay Portal</span>
      </div>

      {/* Portal Header */}
      <div
        className="py-3 md:py-4 relative overflow-hidden"
        style={tenantConfig.colorStyle}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent blur-3xl animate-pulse"></div>
        </div>

        <div className="max-w-[1800px] mx-auto flex items-center justify-between px-4 lg:px-8 relative z-10">
          {/* Left Side - Logo and Title */}
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 bg-white/20 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
              <img
                loading="eager"
                src={tenantConfig.logo}
                alt="Barangay Logo"
                className="relative h-14 w-14 md:h-16 md:w-16 lg:h-24 lg:w-24 object-contain drop-shadow-2xl brightness-110"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-xl leading-tight">
                {tenantConfig.name}
              </h1>
              <p className="text-[11px] sm:text-xs md:text-sm lg:text-base text-white/70 font-semibold uppercase tracking-[0.15em] mt-0.5">
                {tenantConfig.subtitle}
              </p>
            </div>
          </div>

          {/* Right Side - Date/Time and Weather — hidden on small mobile */}
          <div className="hidden sm:flex flex-col items-end gap-1.5 text-white">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
              <Clock className="w-3 h-3 text-white/80 shrink-0" />
              <span className="text-[10px] lg:text-xs font-bold tracking-wider truncate max-w-[200px] lg:max-w-none">
                {currentTime || "Loading..."}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
              {weatherInfo.icon &&
                React.createElement(weatherInfo.icon, {
                  className: `w-3 h-3 ${weatherInfo.color} shrink-0`,
                })}
              <span className="text-[10px] lg:text-xs font-bold tracking-wider uppercase">
                {weatherInfo.text}
              </span>
            </div>
          </div>

          {/* Mobile: show only weather icon + time compact */}
          <div className="flex sm:hidden items-center gap-2 text-white">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full border border-white/10">
              {weatherInfo.icon &&
                React.createElement(weatherInfo.icon, {
                  className: `w-3 h-3 ${weatherInfo.color}`,
                })}
              <span className="text-[9px] font-bold uppercase">{weatherInfo.text}</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="sticky top-0 z-50 glass-nav transition-all duration-500 py-3">
        <div className="max-w-[1800px] mx-auto px-6 sm:px-8">
          <div className="flex justify-end items-center h-12 gap-10">
            {/* Desktop Navigation - Right Side */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { href: "#news", label: "News & Updates" },
                { href: "#forms", label: "Barangay Forms" },
                { href: "#directory", label: "Facilities" },
                { href: "#tourism", label: "Tourism" },
                { href: "#achievements", label: "Achievements" },
                { href: "#officials", label: "Officials" },
                { href: "#contact", label: "Contact Us" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="nav-link text-gray-800 text-sm lg:text-[15px] transition-colors"
                  style={{ "--hover-color": tenantConfig.accentColor }}
                >
                  {link.label}
                </a>
              ))}
              {/* Track Request */}
              <a
                href="#track"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all hover:-translate-y-0.5"
                style={{ color: tenantConfig.primaryColor, borderColor: `${tenantConfig.primaryColor}40`, backgroundColor: `${tenantConfig.primaryColor}08` }}
              >
                <Search className="w-3.5 h-3.5" />
                Track Request
              </a>
              <button
                onClick={() => router.push("/login")}
                className="group relative px-7 py-2.5 rounded-full text-sm font-bold text-white overflow-hidden transition-all shadow-[0_10px_20px_-5px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_25px_-5px_rgba(0,0,0,0.2)] transform hover:-translate-y-0.5 active:scale-95 ml-2"
                style={{ backgroundColor: tenantConfig.primaryColor }}
              >
                <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-20deg] -translate-x-full group-hover:translate-x-[250%] transition-transform duration-700"></div>
                <span className="relative z-10">Login</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2.5 rounded-xl bg-gray-100/50 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-800" />
              ) : (
                <Menu className="w-6 h-6 text-gray-800" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 py-6 px-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
            {[
              { href: "#news", label: "News & Updates" },
              { href: "#forms", label: "Barangay Forms" },
              { href: "#directory", label: "Facilities" },
              { href: "#tourism", label: "Tourism & Lifestyle" },
              { href: "#achievements", label: "Achievements & Awards" },
              { href: "#officials", label: "Barangay Officials" },
              { href: "#contact", label: "Contact Us" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-gray-800 font-bold text-lg mobile-nav-link border-b border-gray-50 last:border-0"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#track"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-3 font-bold text-lg border-b border-gray-50"
              style={{ color: tenantConfig.primaryColor }}
            >
              <Search className="w-5 h-5" />
              Track My Request
            </a>
            <button
              onClick={() => router.push("/login")}
              className="w-full text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl mt-4"
              style={{ backgroundColor: tenantConfig.primaryColor }}
            >
              Access Login
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section with News Carousel - Trimmed Balanced Height */}
      <section
        id="news"
        aria-label="News and announcements carousel"
        tabIndex={-1}
        className="relative h-[360px] md:h-[420px] lg:h-[520px] xl:h-[580px] overflow-hidden bg-gray-900"
      >
        {/* Loading Skeleton */}
        {newsItems.length === 0 && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="w-full max-w-[1800px] px-4 md:px-8 space-y-4 animate-pulse">
              <div className="h-6 w-32 bg-white/10 rounded-full" />
              <div className="h-12 w-1/2 bg-white/20 rounded-lg" />
              <div className="h-20 w-3/4 bg-white/10 rounded-lg" />
              <div className="h-12 w-40 bg-white/30 rounded-lg" />
            </div>
          </div>
        )}
        {newsItems.map((item, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
              style={{
                backgroundImage: item.image
                  ? `url(${item.image})`
                  : `linear-gradient(135deg, ${tenantConfig.primaryColor} 0%, ${tenantConfig.cardBackground} 100%)`,
              }}
            />
            <div className="absolute inset-0 hero-gradient" />
            <div className="relative h-full max-w-[1800px] mx-auto px-8 sm:px-12 lg:px-16 flex items-center">
              <div className="max-w-2xl text-white">
                <span
                  className={`inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] mb-6 text-white shadow-2xl backdrop-blur-md border border-white/10`}
                  style={{ backgroundColor: `${tenantConfig.accentColor}cc` }}
                >
                  <Calendar className="w-3.5 h-3.5 mr-2" />
                  {item.date}
                </span>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 leading-[1.1] tracking-tight drop-shadow-2xl">
                  {item.title}
                </h2>
                <p className="text-sm md:text-lg text-white/80 mb-8 line-clamp-3 leading-relaxed font-medium max-w-xl">
                  {item.description}
                </p>
                <button
                  onClick={() => setSelectedNewsItem(item)}
                  className={`bg-white px-8 py-3.5 rounded-full font-bold transition-all transform hover:-translate-y-1 flex items-center gap-3 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.3)] text-sm md:text-base group`}
                  style={{ color: tenantConfig.primaryColor }}
                >
                  Read Full Announcement{" "}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Navigation with Integrated Arrows */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          {/* Left Arrow */}
          <button
            onClick={() =>
              setCurrentSlide(
                (prev) => (prev - 1 + newsItems.length) % newsItems.length,
              )
            }
            aria-label="Previous slide"
            className="bg-white/30 hover:bg-white/50 backdrop-blur-sm p-2 rounded-full transition-all touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>

          {/* Dots */}
          <div className="flex gap-3">
            {newsItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={currentSlide === index}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentSlide === index
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % newsItems.length)
            }
            aria-label="Next slide"
            className="bg-white/30 hover:bg-white/50 backdrop-blur-sm p-2 rounded-full transition-all touch-manipulation"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </section>

      {/* Quick Action Bar — Task-First Citizen Services */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 py-4">
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <a
              href="#forms"
              className="flex items-center gap-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${tenantConfig.primaryColor}15` }}
              >
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: tenantConfig.primaryColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">Request Certificate</p>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate hidden sm:block">Barangay clearance, permits, and more</p>
              </div>
            </a>
            <a
              href="#track"
              className="flex items-center gap-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${tenantConfig.accentColor}15` }}
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: tenantConfig.accentColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">Track Request</p>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate hidden sm:block">Check your certificate status</p>
              </div>
            </a>
            <a
              href="#contact"
              className="flex items-center gap-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${tenantConfig.secondaryColor}20` }}
              >
                <Phone className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: tenantConfig.secondaryColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">Contact Us</p>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate hidden sm:block">Hotlines and office hours</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Available Forms Section - Modern Design with Responsive Background */}
      <section
        id="forms"
        className="py-12 md:py-20 relative overflow-hidden animate-on-scroll"
      >
        {/* Modern Mesh Gradient Background */}
        <div className="absolute inset-0 bg-[#fdfdfd] z-0">
          <div
            className="absolute top-0 right-0 w-[50%] h-[50%] blur-[120px] rounded-full"
            style={{ backgroundColor: `${tenantConfig.accentColor}10` }}
          ></div>
          <div
            className="absolute bottom-0 left-0 w-[50%] h-[50%] blur-[120px] rounded-full"
            style={{ backgroundColor: `${tenantConfig.primaryColor}10` }}
          ></div>
        </div>

        {/* Barangay Logo Watermark - Refined */}
        <div
          className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[800px] h-[80%] bg-contain bg-right bg-no-repeat opacity-[0.03] pointer-events-none z-0 hidden lg:block"
          style={{
            backgroundImage: `url(${tenantConfig.logo})`,
            filter: "grayscale(100%)",
          }}
        />

        <div className="max-w-[1800px] mx-auto px-8 sm:px-12 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white premium-shadow border border-gray-100 rounded-full text-[11px] font-black tracking-[0.2em] text-gray-500 mb-6 uppercase">
              <div
                className="flex items-center justify-center w-6 h-6 rounded-full animate-pulse shadow-lg"
                style={{
                  backgroundColor: tenantConfig.accentColor,
                  shadowColor: `${tenantConfig.accentColor}40`,
                }}
              >
                <FileText className="w-3 h-3 text-white" />
              </div>
              Digital Services Center
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: tenantConfig.accentColor }}
              ></span>
              <span
                className="font-black"
                style={{ color: tenantConfig.accentColor }}
              >
                Online Now
              </span>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-6">
              Barangay{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: `linear-gradient(to right, ${tenantConfig.accentColor}, ${tenantConfig.primaryColor})`,
                }}
              >
                Online Services
              </span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
              Request official barangay certificates and permits online. Secure, paperless, and accessible anytime.
            </p>
          </div>

          {/* Forms Carousel */}
          <div className="relative mb-8">
            {(() => {
              const colorClasses = {
                blue: {
                  gradient: "from-blue-500 to-blue-600",
                  shadow: "shadow-blue-500/30",
                  bg: "bg-blue-100",
                  text: "text-blue-600",
                  button:
                    "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
                  buttonShadow:
                    "shadow-blue-500/25 group-hover:shadow-blue-500/40",
                  overlay: "from-blue-600/5 to-blue-600/10",
                  feature: "bg-blue-50 text-blue-600",
                },
                green: {
                  gradient:
                    tenantId === "demo"
                      ? "from-[#C9A84C] to-[#aa8c2c]"
                      : "from-green-500 to-green-600",
                  shadow:
                    tenantId === "demo"
                      ? "shadow-[#C9A84C]/30"
                      : "shadow-green-500/30",
                  bg: tenantId === "demo" ? "bg-[#C9A84C]/10" : "bg-green-100",
                  text:
                    tenantId === "demo" ? "text-[#C9A84C]" : "text-green-600",
                  button:
                    tenantId === "demo"
                      ? "from-[#C9A84C] to-[#aa8c2c] hover:from-[#aa8c2c] hover:to-amber-700"
                      : "from-green-600 to-green-700 hover:from-green-700 hover:to-green-800",
                  buttonShadow:
                    tenantId === "demo"
                      ? "shadow-[#C9A84C]/25 group-hover:shadow-[#C9A84C]/40"
                      : "shadow-green-500/25 group-hover:shadow-green-500/40",
                  overlay:
                    tenantId === "demo"
                      ? "from-[#C9A84C]/5 to-[#C9A84C]/10"
                      : "from-green-600/5 to-green-600/10",
                  feature:
                    tenantId === "demo"
                      ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                      : "bg-green-50 text-green-600",
                },
                gold: {
                  gradient: "from-[#C9A84C] to-[#aa8c2c]",
                  shadow: "shadow-[#C9A84C]/30",
                  bg: "bg-[#C9A84C]/10",
                  text: "text-[#C9A84C]",
                  button:
                    "from-[#C9A84C] to-[#aa8c2c] hover:from-[#aa8c2c] hover:to-amber-700",
                  buttonShadow:
                    "shadow-[#C9A84C]/25 group-hover:shadow-[#C9A84C]/40",
                  overlay: "from-[#C9A84C]/5 to-[#C9A84C]/10",
                  feature: "bg-[#C9A84C]/10 text-[#C9A84C]",
                },
                orange: {
                  gradient: "from-orange-500 to-orange-600",
                  shadow: "shadow-orange-500/30",
                  bg: "bg-orange-100",
                  text: "text-orange-600",
                  button:
                    "from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800",
                  buttonShadow:
                    "shadow-orange-500/25 group-hover:shadow-orange-500/40",
                  overlay: "from-orange-600/5 to-orange-600/10",
                  feature: "bg-orange-50 text-orange-600",
                },
                purple: {
                  gradient: "from-purple-500 to-purple-600",
                  shadow: "shadow-purple-500/30",
                  bg: "bg-purple-100",
                  text: "text-purple-600",
                  button:
                    "from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
                  buttonShadow:
                    "shadow-purple-500/25 group-hover:shadow-purple-500/40",
                  overlay: "from-purple-600/5 to-purple-600/10",
                  feature: "bg-purple-50 text-purple-600",
                },
              };

              return (
                <div className="relative">
                  {/* Container with Background - Adjusted for 3 items */}
                  <div className="relative max-w-[1400px] mx-auto overflow-hidden">
                    <div
                      className="flex transition-transform duration-500 ease-in-out"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={() => {
                        if (!touchStart || !touchEnd) return;
                        const distance = touchStart - touchEnd;
                        const maxSlide = Math.max(
                          0,
                          forms.length - itemsPerView,
                        );
                        if (distance > 50) {
                          setCurrentFormSlide(
                            (prev) => (prev + 1) % (maxSlide + 1),
                          );
                        } else if (distance < -50) {
                          setCurrentFormSlide(
                            (prev) =>
                              (prev - 1 + (maxSlide + 1)) % (maxSlide + 1),
                          );
                        }
                        setTouchStart(null);
                        setTouchEnd(null);
                      }}
                      style={{
                        transform: `translateX(-${currentFormSlide * (100 / forms.length)}%)`,
                        width: `${(forms.length / itemsPerView) * 100}%`,
                      }}
                    >
                      {forms.map((form, formIndex) => {
                        const Icon = form.icon;
                        const isPrimary = formIndex % 2 === 0;

                        return (
                          <div
                            key={formIndex}
                            className="w-full flex-shrink-0 flex items-center justify-center p-4 md:p-6"
                            style={{ width: `${100 / forms.length}%` }}
                          >
                            <div
                              className="group relative bg-white rounded-[2rem] p-8 md:p-10 transition-all duration-500 overflow-hidden w-full max-w-[420px] mx-auto border border-gray-100 premium-shadow hover:-translate-y-2 hover:shadow-2xl"
                              style={{
                                boxShadow: `0 20px 40px -15px ${tenantConfig.accentColor}10`,
                              }}
                            >
                              {/* Decorative Background Icon */}
                              <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                <Icon size={200} />
                              </div>

                              {/* Icon Header */}
                              <div className="relative mb-8 flex justify-between items-start">
                                <div
                                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}
                                  style={{
                                    background: `linear-gradient(135deg, ${tenantConfig.primaryColor}, ${tenantConfig.accentColor})`,
                                  }}
                                >
                                  <Icon className="w-8 h-8 text-white" />
                                </div>
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                  Form {String(formIndex + 1).padStart(2, "0")}
                                </span>
                              </div>

                              {/* Content */}
                              <div className="relative">
                                <h3
                                  className="text-xl md:text-2xl font-black text-gray-900 mb-3 leading-tight transition-colors flex items-center flex-wrap"
                                  style={{
                                    groupHover: {
                                      color: tenantConfig.accentColor,
                                    },
                                  }}
                                >
                                  {form.title}
                                  {form.locked && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black bg-gray-100 text-gray-400 border border-gray-200 uppercase tracking-tighter">
                                      <Shield className="w-2.5 h-2.5 mr-1" /> Locked
                                    </span>
                                  )}
                                </h3>
                                <p className={`text-gray-500 mb-8 leading-relaxed text-sm md:text-base font-medium ${form.locked ? 'opacity-40' : ''}`}>
                                  {form.description}
                                </p>

                                {/* Features */}
                                <div className="flex flex-wrap gap-2 mb-8">
                                  {form.features
                                    .slice(0, 2)
                                    .map((feature, idx) => (
                                      <span
                                        key={idx}
                                        className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-full border border-gray-100 uppercase tracking-wider"
                                      >
                                        {feature}
                                      </span>
                                    ))}
                                </div>

                                {/* Premium Button */}
                                <button
                                  onClick={form.onClick}
                                  disabled={form.locked}
                                  className={`w-full py-4 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-3 shadow-lg group/btn overflow-hidden relative ${form.locked ? 'grayscale opacity-40 cursor-not-allowed' : ''}`}
                                  style={{
                                    backgroundColor: form.locked ? '#9ca3af' : tenantConfig.primaryColor,
                                  }}
                                >
                                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                  <span className="relative z-10">
                                    {form.locked ? 'Locked (Upgrade Needed)' : 'Request Certificate'}
                                  </span>
                                  {form.locked ? (
                                    <Shield className="w-5 h-5 relative z-10" />
                                  ) : (
                                    <Plus className="w-5 h-5 relative z-10 group-hover/btn:rotate-90 transition-transform" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Navigation Arrows */}
                    <button
                      onClick={() => {
                        const maxSlide = Math.max(0, forms.length - itemsPerView);
                        setCurrentFormSlide((prev) => (prev - 1 + (maxSlide + 1)) % (maxSlide + 1));
                      }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 backdrop-blur-sm shadow-xl rounded-full flex items-center justify-center transition-all z-20 border opacity-80 hover:opacity-100"
                      style={{
                        backgroundColor: tenantConfig.primaryColor,
                        borderColor: `${tenantConfig.accentColor}40`,
                      }}
                    >
                      <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </button>
                    <button
                      onClick={() => {
                        const maxSlide = Math.max(0, forms.length - itemsPerView);
                        setCurrentFormSlide((prev) => (prev + 1) % (maxSlide + 1));
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 backdrop-blur-sm shadow-xl rounded-full flex items-center justify-center transition-all z-20 border opacity-80 hover:opacity-100"
                      style={{
                        backgroundColor: tenantConfig.primaryColor,
                        borderColor: `${tenantConfig.accentColor}40`,
                      }}
                    >
                      <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </button>
                  </div>

                  {/* Dots Navigation */}
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: Math.max(0, forms.length - (itemsPerView - 1)) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentFormSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all ${currentFormSlide === index ? "w-8 shadow-lg" : "bg-gray-400 hover:bg-gray-500"}`}
                        style={{ backgroundColor: currentFormSlide === index ? tenantConfig.primaryColor : undefined }}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Track Your Request Section */}
      <section id="track" className="py-16 md:py-20 w-full border-t border-gray-100" style={{ background: `linear-gradient(135deg, ${tenantConfig.primaryColor}08 0%, ${tenantConfig.accentColor}05 100%)` }}>
        <div className="max-w-[1600px] mx-auto px-8 md:px-12 lg:px-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-4 border" style={{ color: tenantConfig.primaryColor, borderColor: `${tenantConfig.primaryColor}30`, backgroundColor: `${tenantConfig.primaryColor}08` }}>
              <Search className="w-3.5 h-3.5" />
              Request Tracker
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3">
              Track Your <span style={{ color: tenantConfig.accentColor }}>Request</span>
            </h2>
            <p className="text-gray-500 text-base mb-8">Enter your reference number to check the current status of your certificate request.</p>
            <TrackRequestWidget tenantId={tenantId} tenantConfig={tenantConfig} />
          </div>
        </div>
      </section>

      {/* Programs Section */}
      {!isFeatureLocked('programs') && (
        <section className="py-20 md:py-32 bg-white w-full border-t border-gray-100">
          <div className="max-w-[1600px] mx-auto px-8 md:px-12 lg:px-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="max-w-2xl">
                <div
                  className="h-1 w-12 mb-6 rounded-full"
                  style={{ backgroundColor: tenantConfig.accentColor }}
                ></div>
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                  Community{" "}
                  <span style={{ color: tenantConfig.accentColor }}>
                    Programs
                  </span>{" "}
                  & Initiatives
                </h2>
              </div>
              <p className="text-gray-500 text-lg md:text-xl font-medium max-w-sm">
                Empowering our residents through sustainable and inclusive
                programs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
              {programs.map((program, idx) => (
                <div
                  key={program.id || idx}
                  className="flex flex-col group cursor-pointer h-full program-card"
                  onClick={() => setSelectedProgram(program)}
                >
                  <div className="w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden mb-6 bg-gray-100 premium-shadow transition-all duration-700 group-hover:-translate-y-2">
                    <img
                      loading="lazy"
                      src={program.image || "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800"}
                      alt={program.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex flex-col flex-1 px-2">
                    <p
                      className="text-[10px] font-black uppercase tracking-[0.3em] mb-3"
                      style={{ color: tenantConfig.accentColor }}
                    >
                      {program.category}
                    </p>
                    <h3
                      className="text-gray-900 text-xl font-black mb-3 leading-snug transition-colors"
                    >
                      {program.title}
                    </h3>
                    <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-4 flex-1 font-medium">
                      {program.description}
                    </p>
                    <div
                      className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: tenantConfig.accentColor }}
                    >
                      View Impact <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Facilities Section */}
      {!isFeatureLocked('facilities') && (
        <section id="directory" className="relative bg-gray-50 overflow-hidden">
          <div className="relative w-full h-[60vh] min-h-[500px] lg:h-[70vh] bg-gray-950 overflow-hidden">
            {facilities.flatMap((f) => f.images || []).length > 0 ? (
              facilities.flatMap((f) => f.images || []).filter((img, i, arr) => arr.indexOf(img) === i).map((img, index) => (
                <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${heroCarouselIndex === index ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}>
                  <img 
                    src={img} 
                    alt={`Slide ${index}`} 
                    className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-[2000ms]"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
              ))
            ) : (
              <div className="absolute inset-0 bg-gray-900 animate-pulse"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
            <div className="absolute inset-0 z-20 flex items-center px-8 sm:px-12 lg:px-24">
              <div className="max-w-4xl text-left">
                <h2 className="text-4xl md:text-7xl lg:text-8xl font-black text-white leading-[1] mb-8 tracking-tighter uppercase">
                  Community<br/>
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, #fff, ${tenantConfig.accentColor})` }}>
                    Facilities
                  </span>
                </h2>
              </div>
            </div>
          </div>
          
          {/* Facilities Grid */}
          <div className="py-20 max-w-[1600px] mx-auto px-8 lg:px-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {facilities.map((facility, index) => (
                <div
                  key={index}
                  className="group relative flex flex-col cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  onClick={() => setSelectedFacility(facility)}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img 
                      src={facility.images?.[0]} 
                      alt={facility.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6 text-left">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{facility.name}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{facility.description}</p>
                    <span className="flex items-center gap-1 text-xs font-bold uppercase" style={{ color: tenantConfig.accentColor }}>
                      View Photos <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tourism and Lifestyle Section */}
      {tourismDestinations.length > 0 && (
      <section id="tourism" className="py-20 md:py-28 bg-white relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-5">
              Tourism and Lifestyle
            </h2>
            <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Discover exciting destinations and lifestyle spots in our barangay. Click on any card to get directions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {tourismDestinations.map((destination) => (
              <div
                key={destination.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)] border border-gray-100 hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <a
                    href={destination.directions}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-all"
                    aria-label={`Get directions to ${destination.name}`}
                  >
                    <Navigation className="w-5 h-5" style={{ color: tenantConfig.primaryColor }} />
                  </a>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {destination.name}
                  </h3>
                  <a
                    href={destination.directions}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-bold hover:gap-2.5 transition-all"
                    style={{ color: tenantConfig.primaryColor }}
                  >
                    <MapPin className="w-4 h-4" />
                    Get Directions
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Barangay Achievement and Awards Section */}
      {!isFeatureLocked('achievements') && (
        <section
          id="achievements"
          className="py-20 md:py-32 bg-gray-950 relative overflow-hidden animate-on-scroll"
        >
          {/* Cinematic Gradient Overlays */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(to right, transparent, ${tenantConfig.accentColor}80, transparent)`,
            }}
          ></div>
          <div
            className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"
            style={{ backgroundColor: `${tenantConfig.accentColor}10` }}
          ></div>
          <div
            className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"
            style={{ backgroundColor: `${tenantConfig.primaryColor}10` }}
          ></div>

          <div className="relative z-10 max-w-[1800px] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20 md:mb-24">
              <div className="max-w-3xl">
                <div
                  className="inline-flex items-center gap-3 px-4 py-1.5 border rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8"
                  style={{
                    backgroundColor: `${tenantConfig.accentColor}20`,
                    borderColor: `${tenantConfig.accentColor}30`,
                    color: tenantConfig.accentColor,
                  }}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  Community Milestones
                </div>
                <h2 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-[1.05]">
                  Our Legacy of
                  <br />
                  <span
                    className="text-transparent bg-clip-text"
                    style={{
                      backgroundImage: `linear-gradient(to right, #fff, ${tenantConfig.accentColor})`,
                    }}
                  >
                    Excellence
                  </span>
                </h2>
              </div>
              <div className="lg:max-w-sm">
                <p className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed italic">
                  "Recognizing the hard work and dedication of our community in
                  building a brighter, better {tenantConfig.shortName}."
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {achievements.map((achievement, idx) => (
                <div
                  key={achievement.id || idx}
                  onClick={() => setSelectedAchievement(achievement)}
                  className={`group relative bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden cursor-pointer transition-all duration-500 ${tenantId === "demo" ? "hover:border-[#C9A84C]/30 hover:bg-white/[0.04]" : "hover:border-emerald-500/30 hover:bg-white/[0.04]"}`}
                >
                  <div className="aspect-[4/5] relative overflow-hidden">
                    <img
                      loading="lazy"
                      src={
                        achievement.image ||
                        "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800"
                      }
                      alt={achievement.title}
                      className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 scale-[1.05] group-hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent"></div>

                    {/* Card Content Overlay */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                      <span
                        className="text-[10px] font-black tracking-[0.3em] mb-3 uppercase"
                        style={{ color: tenantConfig.accentColor }}
                      >
                        {achievement.year} Award
                      </span>
                      <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-4">
                        {achievement.title}
                      </h3>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-0.5 transition-all duration-500 group-hover:w-20"
                          style={{ backgroundColor: tenantConfig.accentColor }}
                        ></div>
                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                          Detail View
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Achievement Modal */}
      {selectedAchievement && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md"
          onClick={() => setSelectedAchievement(null)}
        >
          <div
            className="bg-[#0a1f12] border border-[#d4af37]/20 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedAchievement(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-red-500 transition-colors backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative h-64 sm:h-80 lg:h-[450px] w-full group overflow-hidden">
              <div className="absolute inset-0 bg-[#113821]/20 z-10"></div>
              <img
                loading="lazy"
                src={selectedAchievement.image}
                alt={selectedAchievement.title}
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#081a0f] to-transparent z-10"></div>
              <div
                className={`absolute top-6 left-6 z-20 bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#0a1f12] text-white text-sm md:text-base font-bold px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-md`}
              >
                <Award className="w-5 h-5" />
                {selectedAchievement.year}
              </div>
            </div>
            <div className="p-8 md:p-10 relative z-20 -mt-10 md:-mt-16 bg-[#0a1f12]/90 backdrop-blur-xl border-t border-[#d4af37]/30">
              <div className="mb-4">
                <p
                  className={` text-sm md:text-base font-bold tracking-widest uppercase mb-2`}
                >
                  {selectedAchievement.category}
                </p>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                  {selectedAchievement.title}
                </h3>
              </div>
              <p className="text-[#ebd78c]/90 leading-relaxed text-lg md:text-xl mt-6 lg:mt-8">
                {selectedAchievement.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Program Detail Modal */}
      {selectedProgram && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedProgram(null)}
        >
          <div
            className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden relative transform transition-all flex flex-col md:flex-row h-full max-h-[90vh] md:max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Column: Fixed Image on Desktop */}
            <div className="relative w-full md:w-[45%] h-64 md:h-full group overflow-hidden shrink-0">
              <img
                loading="lazy"
                src={selectedProgram.image}
                alt={selectedProgram.title}
                className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

              {/* Floating Category Badge */}
              <div className="absolute top-6 left-6 z-20 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl uppercase tracking-[0.2em]">
                <Target
                  className="w-4 h-4"
                  style={{ color: tenantConfig.accentColor }}
                />
                {selectedProgram.category}
              </div>

              {/* Mobile Close Button */}
              <button
                onClick={() => setSelectedProgram(null)}
                className="md:hidden absolute top-4 right-4 z-30 w-10 h-10 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Right Column: Scrollable Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 text-left">
              {/* Desktop Close Button */}
              <button
                onClick={() => setSelectedProgram(null)}
                className="hidden md:flex absolute top-6 right-6 z-30 w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-red-500 rounded-2xl items-center justify-center transition-all shadow-sm border border-gray-200"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex-1 overflow-y-auto p-8 md:p-12">
                <div className="space-y-8">
                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-8 h-1 rounded-full"
                        style={{ backgroundColor: tenantConfig.accentColor }}
                      ></div>
                      <p
                        className="font-black text-[10px] tracking-[0.4em] uppercase"
                        style={{ color: tenantConfig.accentColor }}
                      >
                        PROGRAM PORTFOLIO
                      </p>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight">
                      {selectedProgram.title}
                    </h2>
                  </div>

                  {/* Body Text */}
                  <div className="max-w-none">
                    <p className="text-gray-600 leading-relaxed font-medium text-lg md:text-xl italic">
                      "{selectedProgram.description}"
                    </p>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-8 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 gap-6">
                    <button
                      onClick={() => setSelectedProgram(null)}
                      className={`w-full sm:w-auto px-10 py-4 ${tenantId === "demo" ? "bg-black" : "bg-[#112117]"} text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl ${tenantId === "demo" ? "hover:shadow-zinc-900/20" : "hover:shadow-green-900/20"} text-sm flex items-center justify-center gap-3 group`}
                    >
                      <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      BACK
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                          Authenticated by
                        </p>
                        <p className="text-xs font-black text-gray-900 uppercase">
                          Barangay Secretariat
                        </p>
                      </div>
                      <div
                        className={`w-10 h-10 ${tenantId === "demo" ? "bg-zinc-100" : "bg-green-50"} rounded-full flex items-center justify-center`}
                      >
                        <Shield
                          className={`w-5 h-5 ${tenantId === "demo" ? "text-zinc-600" : "text-green-600"}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barangay Clearance Modal */}
      <BarangayClearanceModal
        isOpen={showClearanceModal}
        onClose={() => setShowClearanceModal(false)}
        isDemo={tenantId === "demo"}
        tenantConfig={{ ...tenantConfig, tenant_id: tenantId }}
      />

      {/* Certificate of Indigency Modal */}
      <IndigencyCertificateModal
        isOpen={showIndigencyModal}
        onClose={() => setShowIndigencyModal(false)}
        isDemo={tenantId === "demo"}
        tenantConfig={{ ...tenantConfig, tenant_id: tenantId }}
      />

      {/* Barangay Residency Modal */}
      <ResidencyCertificateModal
        isOpen={showResidencyModal}
        onClose={() => setShowResidencyModal(false)}
        isDemo={tenantId === "demo"}
        tenantConfig={{ ...tenantConfig, tenant_id: tenantId }}
      />

      {/* Business Permit Modal */}
      <BusinessPermitModal
        isOpen={showBusinessPermitModal}
        onClose={() => setShowBusinessPermitModal(false)}
        isDemo={tenantId === "demo"}
        tenantConfig={{ ...tenantConfig, tenant_id: tenantId }}
      />

      {/* Educational Assistance Modal */}
      <EducationalAssistanceModal
        isOpen={showEducationalAssistanceModal}
        onClose={() => setShowEducationalAssistanceModal(false)}
        isDemo={tenantId === "demo"}
        tenantConfig={{ ...tenantConfig, tenant_id: tenantId }}
      />

      {/* Natural Death Certificate Modal */}
      <NaturalDeathCertificateModal
        isOpen={showNaturalDeathModal}
        onClose={() => setShowNaturalDeathModal(false)}
        isDemo={tenantId === "demo"}
        tenantConfig={{ ...tenantConfig, tenant_id: tenantId }}
      />
      <GuardianshipCertificateModal
        isOpen={showGuardianshipModal}
        onClose={() => setShowGuardianshipModal(false)}
        isDemo={tenantId === "demo"}
        tenantConfig={{ ...tenantConfig, tenant_id: tenantId }}
      />
      <CohabitationCertificateModal
        isOpen={showCohabitationModal}
        onClose={() => setShowCohabitationModal(false)}
        isDemo={tenantId === "demo"}
        tenantConfig={{ ...tenantConfig, tenant_id: tenantId }}
      />
      <MedicoLegalModal
        isOpen={showMedicoLegalModal}
        onClose={() => setShowMedicoLegalModal(false)}
        isDemo={tenantId === "demo"}
        tenantConfig={{ ...tenantConfig, tenant_id: tenantId }}
      />
      <SamePersonCertificateModal
        isOpen={showSamePersonModal}
        onClose={() => setShowSamePersonModal(false)}
        isDemo={tenantId === "demo"}
        tenantConfig={{ ...tenantConfig, tenant_id: tenantId }}
      />

      <UpgradeNeededModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={lockedFeature}
        tenantConfig={tenantConfig}
      />

      {/* Barangay Officials Section - Optimized */}
      {visibilitySettings?.section !== false && (
        <section
          id="officials"
          className={`relative overflow-hidden transition-colors duration-500 bg-gradient-to-br ${tenantId === "demo" ? "from-black via-gray-950 to-black" : "from-[#112e1f] via-[#1a3d29] to-[#0d1f14]"}`}
        >
          {/* Photo - Full visibility without overlay */}
          <div className="relative">
            <img
              loading="eager"
              src={heroSettings?.image || ""}
              alt={heroSettings?.title || "Barangay Officials"}
              className="w-full h-auto md:h-[400px] lg:h-[500px] xl:h-[600px] md:object-cover bg-gray-800"
              onError={(e) => {
                e.target.src = "";
              }}
            />
            {/* Edge Shadow Overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-10 hidden md:block"
              style={{
                boxShadow: `inset 0 0 150px 60px ${tenantId === "demo" ? "#000000" : "#112e1f"}`,
              }}
            ></div>
          </div>

          {/* Text Section - Professional Leadership Introduction */}
          <div
            className={`py-4 md:py-6 px-4 bg-gradient-to-br ${tenantId === "demo" ? "from-black via-gray-900 to-black" : "from-[#112117] via-[#2d5a3d] to-[#112e1f]"}`}
          >
            <div className="max-w-[1400px] mx-auto">
              {/* Leadership Header */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: tenantConfig.accentColor }}
                  ></div>
                  <span className="text-white font-semibold text-[10px] tracking-wide uppercase">
                    Leadership Team
                  </span>
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: tenantConfig.accentColor }}
                  ></div>
                </div>

                <h4 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 leading-none uppercase tracking-tight">
                  {tenantConfig.name}
                  <span
                    className="block text-transparent bg-clip-text"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${tenantConfig.accentColor}, #ebd78c, ${tenantConfig.accentColor})`,
                    }}
                  >
                    Leadership Team
                  </span>
                </h4>

                <div
                  className="w-24 h-1 mx-auto mb-3 rounded-full"
                  style={{
                    backgroundImage: `linear-gradient(to right, transparent, ${tenantConfig.accentColor}, transparent)`,
                  }}
                ></div>

                <p className="text-lg md:text-xl text-white/90 font-light leading-relaxed max-w-2xl mx-auto">
                  Working together for our community's progress and development
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 py-20 md:py-32 px-8 lg:px-16">
            <div className="max-w-[1400px] mx-auto text-center">
              {/* Section Header */}
              <div className="mb-20">
                <div className="h-1 w-12 bg-gray-900 mb-8 mx-auto rounded-full"></div>
                <h5 className="text-4xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-none uppercase">
                  Meet Our{" "}
                  <span
                    className="text-transparent bg-clip-text"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${tenantId === "demo" ? "#111" : "#064e3b"}, ${tenantConfig.accentColor})`,
                    }}
                  >
                    Council
                  </span>
                </h5>
                <p className="text-gray-400 text-sm md:text-base font-black max-w-2xl mx-auto uppercase tracking-[0.4em] leading-relaxed">
                  Empowered leaders serving {tenantConfig.shortName} with vision
                  and integrity.
                </p>
              </div>

              {/* Officials Segregated by Position */}
              {officials.length > 0 ? (
                <div className="space-y-8">
                  {(() => {
                    // Helper to filter by visibility
                    const filteredOfficials = officials.filter((o) => {
                      if (!visibilitySettings) return true;
                      const { position_type, position } = o;

                      if (position_type === "captain")
                        return visibilitySettings.chairman !== false;
                      if (position_type === "secretary")
                        return visibilitySettings.secretary !== false;
                      if (position_type === "treasurer")
                        return visibilitySettings.treasurer !== false;
                      if (position_type === "sk_chairman")
                        return visibilitySettings.skChairman !== false;
                      if (position_type === "sk_secretary")
                        return visibilitySettings.skSecretary !== false;
                      if (position_type === "sk_treasurer")
                        return visibilitySettings.skTreasurer !== false;

                      if (position_type === "sk_kagawad") {
                        const match = position.match(/SK Kagawad\s+(\d+)/i);
                        if (match) {
                          const idx = parseInt(match[1], 10) - 1;
                          return visibilitySettings.skKagawads?.[idx] !== false;
                        }
                      }

                      if (position_type === "kagawad") {
                        const match = position.match(/Kagawad\s+(\d+)/i);
                        if (match) {
                          const idx = parseInt(match[1], 10) - 1;
                          return visibilitySettings.councilors?.[idx] !== false;
                        }
                      }

                      if (position === "Administrator")
                        return visibilitySettings.administrator !== false;
                      if (position === "Assistant Secretary")
                        return visibilitySettings.assistantSecretary !== false;
                      if (position === "Assistant Administrator")
                        return (
                          visibilitySettings.assistantAdministrator !== false
                        );
                      if (
                        position === "Barangay Keeper" ||
                        position === "Record Keeper"
                      )
                        return visibilitySettings.recordKeeper !== false;
                      if (position === "Clerk")
                        return visibilitySettings.clerk !== false;

                      return true;
                    });

                    // Group officials by position type
                    const groupedOfficials = {
                      captain: filteredOfficials.filter(
                        (o) => o.position_type === "captain",
                      ),
                      kagawad: filteredOfficials.filter(
                        (o) => o.position_type === "kagawad",
                      ),
                      secretary: filteredOfficials.filter(
                        (o) => o.position_type === "secretary",
                      ),
                      treasurer: filteredOfficials.filter(
                        (o) => o.position_type === "treasurer",
                      ),
                      sk_chairman: filteredOfficials.filter(
                        (o) => o.position_type === "sk_chairman",
                      ),
                      sk_secretary: filteredOfficials.filter(
                        (o) => o.position_type === "sk_secretary",
                      ),
                      sk_treasurer: filteredOfficials.filter(
                        (o) => o.position_type === "sk_treasurer",
                      ),
                      sk_kagawad: filteredOfficials.filter(
                        (o) => o.position_type === "sk_kagawad",
                      ),
                      staff: filteredOfficials.filter(
                        (o) =>
                          ![
                            "captain",
                            "kagawad",
                            "secretary",
                            "treasurer",
                            "sk_chairman",
                            "sk_secretary",
                            "sk_treasurer",
                            "sk_kagawad",
                          ].includes(o.position_type),
                      ),
                    };

                    const sections = [
                      {
                        key: "captain",
                        title: "Barangay Captain",
                        subtitle: "Chief Executive Officer",
                        officials: groupedOfficials.captain,
                        bgColor:
                          tenantId === "demo"
                            ? "from-black to-gray-950"
                            : "from-[#112e1f] to-[#2d5a3d]",
                        icon: "👑",
                      },
                      {
                        key: "kagawad",
                        title: "Barangay Kagawad",
                        subtitle: "Council Members, Secretary, and Treasurer",
                        officials: [
                          ...groupedOfficials.kagawad,
                          ...groupedOfficials.secretary,
                          ...groupedOfficials.treasurer,
                        ],
                        bgColor:
                          tenantId === "demo"
                            ? "from-zinc-900 to-black"
                            : "from-zinc-600 to-zinc-700",
                        icon: "🏛️",
                      },
                      {
                        key: "sk_chairman",
                        title: "SK Chairman",
                        subtitle: "Youth Representative",
                        officials: groupedOfficials.sk_chairman,
                        bgColor:
                          tenantId === "demo"
                            ? "from-black to-zinc-800"
                            : "from-zinc-600 to-zinc-700",
                        icon: "🌟",
                      },
                      {
                        key: "sk_kagawad",
                        title: "SK Council",
                        subtitle:
                          "Youth Council Secretary, Treasurer, and Members",
                        officials: [], // Will be populated in the logic below
                        bgColor:
                          tenantId === "demo"
                            ? "from-gray-700 to-black"
                            : "from-orange-500 to-amber-600",
                        icon: "⚡",
                      },
                      {
                        key: "staff",
                        title: "Barangay Staff",
                        subtitle: "Administrative Team",
                        officials: groupedOfficials.staff,
                        bgColor:
                          tenantId === "demo"
                            ? "from-gray-600 to-gray-900"
                            : "from-teal-600 to-green-700",
                        icon: "👥",
                      },
                    ];

                    return sections.map((section) => {
                      // Special case for SK Council: Combine Secretary, Treasurer, and Kagawads
                      let displayOfficials = section.officials;
                      if (section.key === "sk_kagawad") {
                        displayOfficials = [
                          ...groupedOfficials.sk_kagawad,
                          ...groupedOfficials.sk_secretary,
                          ...groupedOfficials.sk_treasurer,
                        ];
                      }

                      if (displayOfficials.length === 0) return null;

                      return (
                        <div key={section.key} className="mb-10">
                          {section.key === "staff" && (
                            <div className="text-center mb-6">
                              <div
                                className={`inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r ${section.bgColor} text-white rounded-full mb-4 shadow-lg`}
                              >
                                <span className="text-2xl">{section.icon}</span>
                                <span className="font-bold text-lg tracking-wide">
                                  {section.title.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-gray-600 text-lg font-medium">
                                {section.subtitle}
                              </p>
                            </div>
                          )}

                          {/* Officials Layout Wrapper */}
                          <div
                            className={
                              section.key === "captain" ||
                              section.key === "sk_chairman"
                                ? "max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 px-4 mb-12"
                                : "grid grid-cols-2 lg:flex lg:flex-wrap gap-4 lg:gap-5 justify-center"
                            }
                          >
                            {section.key === "captain" ? (
                              <>
                                {/* Left Aligned Captain Card */}
                                <div className="w-full lg:w-[380px] flex-shrink-0 mx-auto">
                                  {displayOfficials.map((official, index) => {
                                    const colorClass =
                                      tenantId === "demo"
                                        ? "from-black to-gray-800"
                                        : "from-green-800 to-green-950";
                                    const initials = official.name
                                      .split(" ")
                                      .slice(0, 2)
                                      .map((n) => n[0])
                                      .join("");
                                    return (
                                      <div
                                        key={official.id || index}
                                        className={`bg-white rounded-[40px] shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 group w-full transform hover:-translate-y-2 ${tenantId === "demo" ? "hover:shadow-black/20" : "hover:shadow-green-900/20"}`}
                                      >
                                        <div className="relative aspect-[4/5] overflow-hidden group bg-white">
                                          {official.image_url ? (
                                            <img loading="lazy" src={official.image_url}
                                              alt={official.name}
                                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 relative z-10"
                                            />
                                          ) : (
                                            <div
                                              className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}
                                            >
                                              <span className="text-7xl font-bold text-white tracking-widest opacity-30 group-hover:opacity-50 transition-opacity font-serif">
                                                {initials}
                                              </span>
                                            </div>
                                          )}
                                          <div
                                            className="absolute inset-x-0 bottom-0 bg-gradient-to-t flex flex-col justify-end p-8 text-center z-20 h-1/2"
                                            style={{
                                              backgroundImage: `linear-gradient(to top, ${tenantId === "demo" ? "#000000" : "#112e1f"}, ${tenantId === "demo" ? "rgba(0,0,0,0.4)" : "rgba(17,46,31,0.4)"}, transparent)`,
                                            }}
                                          >
                                            <h3 className="text-white font-black text-2xl mb-1 drop-shadow-lg tracking-tight">
                                              Punong Barangay
                                            </h3>
                                          </div>
                                        </div>
                                        <div className="p-8 text-center bg-white">
                                          <h4 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                                            {official.name}
                                          </h4>
                                          <p className="text-gray-600 text-base font-medium leading-relaxed italic line-clamp-3">
                                            {official.description ||
                                              `Leading ${tenantConfig.shortName} with vision, integrity, and a heartfelt commitment to serve every constituent with excellence.`}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Right Aligned Plain Goal & Vision */}
                                <div className="flex-grow space-y-6">
                                  <div className="px-4 py-8">
                                    <div className="mb-6">
                                      <h3 className="text-3xl font-black text-gray-900 tracking-widest uppercase mb-3">
                                        Barangay Vision
                                      </h3>
                                      <p
                                        className="text-gray-700 text-xl font-medium leading-relaxed italic border-l-4 pl-6 py-2"
                                        style={{
                                          borderColor: tenantConfig.accentColor,
                                        }}
                                      >
                                        {`"A model community that is progressive, peaceful, and disaster-resilient, where empowered citizens live in harmony with nature and participate in transparent local governance."`}
                                      </p>
                                    </div>
                                    <div>
                                      <h3 className="text-3xl font-black text-gray-900 tracking-widest uppercase mb-3">
                                        Barangay Goal
                                      </h3>
                                      <p
                                        className="text-gray-700 text-xl font-medium leading-relaxed border-l-4 pl-6 py-2"
                                        style={{
                                          borderColor:
                                            tenantConfig.primaryColor,
                                        }}
                                      >
                                        {`"To deliver dedicated public service through innovative social programs, sustainable infrastructure, and community-driven initiatives that uplift the dignity and prosperity of every resident."`}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : section.key === "sk_chairman" ? (
                              <>
                                {/* Left Aligned Plain SK Goal & Vision */}
                                <div className="flex-grow space-y-6 order-2 lg:order-1">
                                  <div className="px-4 py-8">
                                    <div className="mb-6">
                                      <h3 className="text-3xl font-black text-gray-900 tracking-widest uppercase mb-3">
                                        SK Vision
                                      </h3>
                                      <p
                                        className="text-gray-700 text-xl font-medium leading-relaxed italic border-l-4 pl-6 py-2"
                                        style={{
                                          borderColor:
                                            tenantId === "demo"
                                              ? tenantConfig.accentColor
                                              : "#f97316",
                                        }}
                                      >
                                        {`"An inspired youth community of ${tenantConfig.shortName} that is actively involved in community building, advocating for education, sports, and social responsibility while maintaining the highest level of integrity."`}
                                      </p>
                                    </div>
                                    <div>
                                      <h3 className="text-3xl font-black text-gray-900 tracking-widest uppercase mb-3">
                                        SK Goal
                                      </h3>
                                      <p
                                        className="text-gray-700 text-xl font-medium leading-relaxed border-l-4 pl-6 py-2"
                                        style={{
                                          borderColor:
                                            tenantId === "demo"
                                              ? tenantConfig.primaryColor
                                              : "#ea580c",
                                        }}
                                      >
                                        {`"To empower the youth through comprehensive development programs in leadership, environment, and wellness, ensuring every young resident has the opportunity to contribute to our barangay's future."`}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Aligned SK Chairman Card */}
                                <div className="w-full lg:w-[380px] flex-shrink-0 order-1 lg:order-2">
                                  {displayOfficials.map((official, index) => {
                                    const colorClass =
                                      "from-orange-600 to-amber-700";
                                    const initials = official.name
                                      .split(" ")
                                      .slice(0, 2)
                                      .map((n) => n[0])
                                      .join("");
                                    return (
                                      <div
                                        key={official.id || index}
                                        className={`bg-white rounded-[40px] shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 group w-full transform hover:-translate-y-2 ${tenantId === "demo" ? "hover:shadow-black/20" : "hover:shadow-orange-900/20"}`}
                                      >
                                        <div className="relative aspect-[4/5] overflow-hidden group bg-white">
                                          {official.image_url ? (
                                            <img loading="lazy" src={official.image_url}
                                              alt={official.name}
                                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 relative z-10"
                                            />
                                          ) : (
                                            <div
                                              className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}
                                            >
                                              <span className="text-7xl font-bold text-white tracking-widest opacity-30 group-hover:opacity-50 transition-opacity font-serif">
                                                {initials}
                                              </span>
                                            </div>
                                          )}
                                          <div
                                            className="absolute inset-x-0 bottom-0 bg-gradient-to-t flex flex-col justify-end p-8 text-center z-20 h-1/2"
                                            style={{
                                              backgroundImage: `linear-gradient(to top, ${tenantId === "demo" ? "#000000" : "#831a1a"}, ${tenantId === "demo" ? "rgba(0,0,0,0.4)" : "rgba(131,26,26,0.4)"}, transparent)`,
                                            }}
                                          >
                                            <h3 className="text-white font-black text-2xl mb-1 drop-shadow-lg tracking-tight">
                                              SK Chairman
                                            </h3>
                                          </div>
                                        </div>
                                        <div className="p-8 text-center bg-white">
                                          <h4 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                                            {official.name}
                                          </h4>
                                          <p className="text-gray-600 text-base font-medium leading-relaxed italic line-clamp-3">
                                            {official.description ||
                                              `Empowering the youth of ${tenantConfig.shortName} through active participation, leadership development, and community-driven initiatives.`}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            ) : (
                              displayOfficials.map((official, index) => {
                                const colors =
                                  tenantId === "demo"
                                    ? [
                                        "from-gray-800 to-gray-900",
                                        "from-gray-700 to-gray-800",
                                        "from-gray-600 to-gray-700",
                                        "from-black to-gray-900",
                                        "from-gray-900 to-black",
                                        "from-gray-500 to-gray-600",
                                      ]
                                    : [
                                        "from-[#112e1f] to-[#2d5a3d]",
                                        "from-teal-900 to-zinc-900",
                                        "from-zinc-800 to-zinc-900",
                                        "from-[#2d5a3d] to-zinc-800",
                                        "from-zinc-900 to-zinc-950",
                                        "from-zinc-800 to-black",
                                        "from-[#112117] to-zinc-900",
                                        "from-zinc-800 to-zinc-900",
                                        "from-zinc-900 to-zinc-950",
                                        "from-[#2d5a3d] to-blue-900",
                                        "from-zinc-800 to-zinc-900",
                                        "from-zinc-900 to-zinc-950",
                                        "from-zinc-800 to-blue-900",
                                      ];
                                let colorClass;
                                if (section.key === "kagawad")
                                  colorClass = colors[index % colors.length];
                                else if (section.key === "sk_secretary")
                                  colorClass =
                                    tenantId === "demo"
                                      ? "from-gray-800 to-black"
                                      : "from-orange-500 to-amber-600";
                                else if (section.key === "sk_treasurer")
                                  colorClass =
                                    tenantId === "demo"
                                      ? "from-black to-gray-800"
                                      : "from-amber-600 to-orange-500";
                                else if (section.key === "sk_kagawad")
                                  colorClass =
                                    tenantId === "demo"
                                      ? "from-gray-700 to-gray-900"
                                      : "from-amber-500 to-orange-600";
                                else
                                  colorClass =
                                    colors[(index + 8) % colors.length];

                                const initials = official.name
                                  .split(" ")
                                  .slice(0, 2)
                                  .map((n) => n[0])
                                  .join("");
                                const widthClass =
                                  "w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)] lg:w-[calc(20%-1rem)]";
                                return (
                                  <div
                                    key={official.id || index}
                                    className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group ${widthClass}`}
                                  >
                                    <div className="relative aspect-square overflow-hidden group bg-white">
                                      {official.image_url ? (
                                        <img loading="lazy" src={official.image_url}
                                          alt={official.name}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 relative z-10"
                                        />
                                      ) : (
                                        <div
                                          className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}
                                        >
                                          <span className="text-5xl font-bold text-white tracking-widest opacity-30 group-hover:opacity-50 transition-opacity">
                                            {initials}
                                          </span>
                                        </div>
                                      )}
                                      <div
                                        className="absolute inset-0 bg-gradient-to-t flex flex-col justify-end p-6 text-center z-20"
                                        style={{
                                          backgroundImage: `linear-gradient(to top, ${tenantId === "demo" ? "#000000E6" : "#112e1fE6"}, ${tenantId === "demo" ? "#00000066" : "#112e1f66"}, transparent)`,
                                        }}
                                      >
                                        <h3 className="text-white font-bold text-xl mb-1 drop-shadow-lg">
                                          {(() => {
                                            const pos = official.position || "";
                                            if (pos.includes("SK Kagawad"))
                                              return "SK Kagawad";
                                            if (pos.includes("Kagawad"))
                                              return "Brgy. Kagawad";
                                            if (
                                              [
                                                "Secretary",
                                                "Treasurer",
                                                "Administrator",
                                                "Clerk",
                                                "Record Keeper",
                                              ].includes(pos)
                                            )
                                              return `Brgy. ${pos}`;
                                            if (pos === "Barangay Keeper")
                                              return "Brgy. Record Keeper";
                                            if (
                                              [
                                                "Assistant Secretary",
                                                "Assistant Administrator",
                                              ].includes(pos)
                                            )
                                              return pos.replace(
                                                "Assistant",
                                                "Asst. Brgy.",
                                              );
                                            return pos;
                                          })()}
                                        </h3>
                                        {official.committee && (
                                          <p
                                            className={`text-sm font-medium drop-shadow-md ${tenantId === "demo" ? "text-gray-300" : "text-green-300"}`}
                                          >
                                            {official.committee}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="p-6">
                                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                        {official.name}
                                      </h4>
                                      <p className="text-gray-600 text-sm leading-relaxed">
                                        {official.description}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Loading officials...</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section
        id="contact"
        className={`py-8 bg-gradient-to-br ${tenantConfig.darkBackground}`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-white mb-1">
              Contact the Barangay Office
            </h2>
            <p
              className={`text-base italic ${tenantId === "demo" ? "text-gray-400" : "text-green-400"}`}
            >
              For inquiries and assistance, please reach out to us
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-5 shadow-xl h-full">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      id="contact-firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Juan"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      id="contact-lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Dela Cruz"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email / Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="juan@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone / Numero ng Telepono
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="09XX XXX XXXX"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    placeholder="Your message here..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full text-white py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 transform hover:scale-105 shadow-lg"
                  style={{ backgroundColor: tenantConfig.primaryColor }}
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Info & Office Hours */}
            <div className="space-y-6 h-full flex flex-col">
              <div
                className={`backdrop-blur-sm rounded-2xl p-8 border flex-1 ${tenantId === "demo" ? "bg-black/80 border-white/10" : "bg-green-950/50 border-green-800/50"}`}
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: tenantConfig.primaryColor }}
                    >
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p
                        className={
                          tenantId === "demo"
                            ? "text-gray-300"
                            : "text-green-200"
                        }
                      >
                        {tenantConfig.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: tenantConfig.secondaryColor }}
                    >
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p
                        className={
                          tenantId === "demo"
                            ? "text-gray-300"
                            : "text-green-200"
                        }
                      >
                        (044) 123-4567
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: tenantConfig.secondaryColor }}
                    >
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Email</p>
                      <p
                        className={
                          tenantId === "demo"
                            ? "text-gray-300"
                            : "text-green-200"
                        }
                      >
                        {tenantId === "demo"
                          ? "contact@brgydesk.com"
                          : "ibaoeste@calumpit.gov.ph"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
                style={{ borderColor: `${tenantConfig.secondaryColor}40` }}
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  Office Hours
                </h3>
                <div
                  className={`space-y-2 ${tenantId === "demo" ? "text-gray-300" : "text-green-200"}`}
                >
                  <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                  <p>Saturday: 8:00 AM - 12:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Emergency Hotlines */}
            <div
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 h-full"
              style={{ borderColor: `${tenantConfig.secondaryColor}40` }}
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                Emergency Hotlines
              </h3>
              <div className="space-y-4">
                {hotlines.map((hotline, index) => (
                  <div key={index} className="flex items-start gap-4 group">
                    <div
                      className="p-3 rounded-lg group-hover:opacity-80 transition-colors"
                      style={{
                        backgroundColor:
                          tenantId === "demo" ? "#4a4a4a" : "#991b1b",
                      }}
                    >
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{hotline.name}</p>
                      <a
                        href={`tel:${hotline.number}`}
                        className={`transition-colors text-xl font-bold ${tenantId === "demo" ? "text-gray-300 hover:text-white" : "text-gray-200 hover:text-white"}`}
                      >
                        {hotline.number}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-white/10 rounded-xl text-center border border-white/10">
                <p
                  className={`${tenantId === "demo" ? "text-gray-400" : "text-green-300"} text-[10px] font-bold tracking-widest mb-1 uppercase`}
                >
                  Available 24/7
                </p>
                <p className="text-white font-bold">READY TO RESPOND</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Government Footer */}
      <footer className="bg-gray-900 text-white/70 py-10 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Official Identity */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex items-center gap-3">
                <img
                  loading="lazy"
                  src={tenantConfig.logo}
                  alt={`${tenantConfig.shortName} seal`}
                  className="h-14 w-14 object-contain opacity-80"
                />
                <div>
                  <p className="text-white font-bold text-sm leading-tight">{tenantConfig.name}</p>
                  <p className="text-white/50 text-xs mt-0.5">{tenantConfig.subtitle}</p>
                </div>
              </div>
              <p className="text-xs text-white/40 leading-relaxed text-center md:text-left max-w-xs">
                An official digital portal of the Barangay Government, providing transparent and accessible public services to our constituents.
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wider">Services</h4>
              <a href="#forms" className="text-xs text-white/50 hover:text-white transition-colors">Barangay Forms & Certificates</a>
              <a href="#track" className="text-xs text-white/50 hover:text-white transition-colors">Track Your Request</a>
              <a href="#directory" className="text-xs text-white/50 hover:text-white transition-colors">Facilities & Infrastructure</a>
              <a href="#tourism" className="text-xs text-white/50 hover:text-white transition-colors">Tourism & Lifestyle</a>
              <a href="#officials" className="text-xs text-white/50 hover:text-white transition-colors">Barangay Officials</a>
              <a href="#contact" className="text-xs text-white/50 hover:text-white transition-colors">Contact Us</a>
            </div>

            {/* Privacy & Compliance */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wider">Privacy & Compliance</h4>
              <p className="text-xs text-white/40 leading-relaxed">
                This portal collects and processes personal data in accordance with the <span className="text-white/60 font-medium">Data Privacy Act of 2012 (RA 10173)</span>. Information submitted through this platform is used solely for official barangay services and is protected under government data security standards.
              </p>
              <p className="text-xs text-white/40 leading-relaxed mt-1">
                © {new Date().getFullYear()} {tenantConfig.name}. All rights reserved. Powered by BrgyDesk.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-white/30 uppercase tracking-widest text-center sm:text-left">
              Republic of the Philippines · Local Government Unit · Barangay Portal
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-white/30">An LGU Digital Service</span>
            </div>
          </div>
        </div>
      </footer>
      {/* Floating Action Buttons — KapChat & Brgy Assistance */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
        <button
          onClick={() => router.push("/login")}
          className="group flex items-center gap-2 bg-white rounded-full shadow-xl border border-gray-100 px-4 py-3 hover:shadow-2xl transition-all"
          aria-label="KapChat — Chat with the Barangay"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${tenantConfig.primaryColor}15` }}
          >
            <MessageCircle className="w-4 h-4" style={{ color: tenantConfig.primaryColor }} />
          </div>
          <span className="text-sm font-bold text-gray-900 hidden sm:inline">KapChat</span>
        </button>
        <button
          onClick={() => router.push("/login")}
          className="group flex items-center gap-2 bg-white rounded-full shadow-xl border border-gray-100 px-4 py-3 hover:shadow-2xl transition-all"
          aria-label="Brgy Assistance"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${tenantConfig.accentColor}15` }}
          >
            <HeadphonesIcon className="w-4 h-4" style={{ color: tenantConfig.accentColor }} />
          </div>
          <span className="text-sm font-bold text-gray-900 hidden sm:inline">Brgy Assistance</span>
        </button>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        {showHotlines && (
          <div className="mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80 animate-fade-in">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Emergency Hotlines
            </h4>
            <div className="space-y-3">
              {hotlines.map((hotline, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {hotline.name}
                  </span>
                  <a
                    href={`tel:${hotline.number}`}
                    className={`font-semibold transition-colors ${tenantId === "demo" ? "text-gray-900 hover:text-[#C9A84C]" : "text-green-700 hover:text-green-800"}`}
                  >
                    {hotline.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowHotlines(!showHotlines)}
          className={`${
            showHotlines
              ? "bg-gray-600"
              : "bg-red-600 hover:bg-red-700 animate-pulse"
          } text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110`}
        >
          {showHotlines ? (
            <X className="w-6 h-6" />
          ) : (
            <Phone className="w-6 h-6" />
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-left {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-right {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes rotate-in {
          from {
            opacity: 0;
            transform: rotate(-10deg) scale(0.8);
          }
          to {
            opacity: 1;
            transform: rotate(0deg) scale(1);
          }
        }

        /* Base state for animated elements - RESTORED BUT ROBUST */
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition:
            opacity 0.8s ease-out,
            transform 0.8s ease-out;
          will-change: opacity, transform;
        }

        .animate-on-scroll.active {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes pulse-light {
          0%,
          100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.2;
          }
        }
        .animate-pulse {
          animation: pulse-light 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Animated states */
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        .animate-slide-up {
          animation: slide-up 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-slide-left {
          animation: slide-left 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-slide-right {
          animation: slide-right 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-rotate-in {
          animation: rotate-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* Staggered animations */
        .animate-on-scroll:nth-child(1) {
          transition-delay: 0.1s;
        }
        .animate-on-scroll:nth-child(2) {
          transition-delay: 0.2s;
        }
        .animate-on-scroll:nth-child(3) {
          transition-delay: 0.3s;
        }
        .animate-on-scroll:nth-child(4) {
          transition-delay: 0.4s;
        }
        .animate-on-scroll:nth-child(5) {
          transition-delay: 0.5s;
        }
        .animate-on-scroll:nth-child(6) {
          transition-delay: 0.6s;
        }
        .animate-on-scroll:nth-child(7) {
          transition-delay: 0.7s;
        }
        .animate-on-scroll:nth-child(8) {
          transition-delay: 0.8s;
        }
      `}</style>

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-white/20 relative overflow-hidden group">
            <div
              className="absolute top-0 left-0 w-full h-2"
              style={{
                backgroundImage: `linear-gradient(to right, ${tenantConfig.accentColor}, ${tenantConfig.primaryColor})`,
              }}
            ></div>

            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500"
              style={{ backgroundColor: `${tenantConfig.accentColor}20` }}
            >
              <Clock
                className="w-10 h-10 animate-pulse"
                style={{ color: tenantConfig.accentColor }}
              />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Coming Soon!
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              We are currently finalizing this online service to serve you
              better. Please visit the Barangay Hall for manual processing in
              the meantime.
            </p>

            <button
              onClick={() => setShowComingSoonModal(false)}
              className="w-full text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 group/btn"
              style={{ backgroundColor: tenantConfig.primaryColor }}
            >
              Got it!
              <CheckCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
            </button>

            {/* Decorative background circle */}
            <div
              className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full -z-10 opacity-50"
              style={{ backgroundColor: `${tenantConfig.accentColor}10` }}
            ></div>
          </div>
        </div>
      )}

      {/* Facility Photo Slider Modal */}
      {selectedFacility && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setSelectedFacility(null)}
          ></div>

          <div className="relative z-10 w-full max-w-5xl h-[80vh] flex flex-col bg-transparent rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(141,198,63,0.15)] animate-in zoom-in-95 duration-300">
            {/* Floating Close Button */}
            <button
              onClick={() => setSelectedFacility(null)}
              className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-red-500/80 rounded-full flex items-center justify-center text-white/90 transition-colors border border-white/20 backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Main Image Content */}
            <div className="relative flex-1 bg-transparent overflow-hidden flex items-center justify-center group">
              {(() => {
                const images = selectedFacility.images || ["/background.jpg"];
                return (
                  <>
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-500 ease-in-out flex items-center justify-center ${facilityImageIndex === idx ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                      >
                        <img loading="lazy" src={img}
                          alt={`${selectedFacility.name} image ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ))}

                    {/* Navigation Arrows (only if multiple images) */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFacilityImageIndex((prev) =>
                              prev === 0 ? images.length - 1 : prev - 1,
                            );
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 flex items-center justify-center text-white rounded-full backdrop-blur-sm transition-colors border border-white/20 opacity-0 group-hover:opacity-100 mx-2 z-50 cursor-pointer hover:opacity-100"
                          style={{
                            hover: {
                              backgroundColor: tenantConfig.accentColor,
                            },
                          }}
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFacilityImageIndex((prev) =>
                              prev === images.length - 1 ? 0 : prev + 1,
                            );
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 flex items-center justify-center text-white rounded-full backdrop-blur-sm transition-colors border border-white/20 opacity-0 group-hover:opacity-100 mx-2 z-50 cursor-pointer hover:opacity-100"
                          style={{
                            hover: {
                              backgroundColor: tenantConfig.accentColor,
                            },
                          }}
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>

                        {/* Image Counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1.5 rounded-full text-white/90 text-sm font-semibold tracking-widest border border-white/20 backdrop-blur-sm z-50">
                          {facilityImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* News Read More Modal */}
      {selectedNewsItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => setSelectedNewsItem(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-56 md:h-72">
              <img loading="lazy" src={selectedNewsItem.image || "/background.jpg"}
                alt={selectedNewsItem.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span
                className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow"
                style={{ backgroundColor: tenantConfig.secondaryColor }}
              >
                <Calendar className="w-3.5 h-3.5" />
                {selectedNewsItem.date}
              </span>
              <button
                onClick={() => setSelectedNewsItem(null)}
                className="absolute top-4 right-4 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 md:p-8 max-h-[55vh] overflow-y-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {selectedNewsItem.title}
              </h2>
              <p className="text-gray-700 leading-relaxed text-base whitespace-pre-line">
                {selectedNewsItem.body || selectedNewsItem.description}
              </p>
              <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Shield
                    className="w-4 h-4"
                    style={{ color: tenantConfig.accentColor }}
                  />
                  <span>
                    Barangay {tenantConfig.shortName} — Official Announcement
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNewsItem(null)}
                  className="px-5 py-2 text-white rounded-lg font-semibold text-sm transition-all shadow-md"
                  style={{ backgroundColor: tenantConfig.primaryColor }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Smooth scrolling for navigation */
        html {
          scroll-behavior: smooth;
        }

        /* Enhanced hover effects */
        .hover-lift {
          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
        }

        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}


// Track Request Widget Component
function TrackRequestWidget({ tenantId, tenantConfig }) {
  const [refNumber, setRefNumber] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');

  const statusConfig = {
    pending:          { label: 'Submitted',            color: 'bg-blue-100 text-blue-700',   step: 1 },
    submitted:        { label: 'Submitted',            color: 'bg-blue-100 text-blue-700',   step: 1 },
    staff_review:     { label: 'Under Review',         color: 'bg-blue-100 text-blue-700',   step: 2 },
    processing:       { label: 'Secretary Approval',   color: 'bg-purple-100 text-purple-700', step: 3 },
    secretary_approval: { label: 'Secretary Approval', color: 'bg-purple-100 text-purple-700', step: 3 },
    captain_approval: { label: 'Captain Approval',     color: 'bg-violet-100 text-violet-700', step: 4 },
    oic_review:       { label: 'Ready for Release',    color: 'bg-teal-100 text-teal-700',   step: 5 },
    ready:            { label: 'Ready for Pickup',     color: 'bg-green-100 text-green-700', step: 5 },
    ready_for_pickup: { label: 'Ready for Pickup',     color: 'bg-green-100 text-green-700', step: 5 },
    released:         { label: 'Released / Claimed',   color: 'bg-gray-100 text-gray-600',   step: 6 },
    rejected:         { label: 'Rejected',             color: 'bg-red-100 text-red-700',     step: 0 },
    returned:         { label: 'Returned for Revision', color: 'bg-orange-100 text-orange-700', step: 2 },
    cancelled:        { label: 'Cancelled',            color: 'bg-gray-100 text-gray-500',   step: 0 },
  };

  const steps = ['Submitted', 'Review', 'Secretary', 'Captain', 'Ready', 'Released'];

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!refNumber.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/portal/track?ref=${encodeURIComponent(refNumber.trim())}`, {
        headers: { 'x-tenant-id': tenantId }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setResult(data.data);
      } else {
        setError('Reference number not found. Please check and try again.');
      }
    } catch {
      setError('Unable to check status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? (statusConfig[result.status] || { label: result.status, color: 'bg-gray-100 text-gray-600', step: 1 }) : null;

  return (
    <div className="w-full">
      <form onSubmit={handleTrack} className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={refNumber}
            onChange={e => { setRefNumber(e.target.value); setError(''); setResult(null); }}
            placeholder="e.g. BC-2026-00001"
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent shadow-sm"
            style={{ '--tw-ring-color': tenantConfig.primaryColor }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !refNumber.trim()}
          className="px-6 py-3.5 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: tenantConfig.primaryColor }}
        >
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Checking...' : 'Track'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {result && cfg && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Status Header */}
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1">Reference Number</p>
              <p className="text-lg font-bold text-gray-900 font-mono">{result.reference_number}</p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
          </div>

          {/* Applicant Info */}
          <div className="px-6 py-4 border-b border-gray-50 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-medium tracking-wide mb-1">Applicant</p>
              <p className="text-sm font-semibold text-gray-800">{result.full_name || result.applicant_name || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-medium tracking-wide mb-1">Certificate Type</p>
              <p className="text-sm font-semibold text-gray-800 capitalize">{result.certificate_type?.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-medium tracking-wide mb-1">Date Submitted</p>
              <p className="text-sm font-semibold text-gray-800">{result.created_at ? new Date(result.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-medium tracking-wide mb-1">Last Updated</p>
              <p className="text-sm font-semibold text-gray-800">{result.updated_at ? new Date(result.updated_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</p>
            </div>
          </div>

          {/* Progress Steps */}
          {!['rejected', 'cancelled'].includes(result.status) && (
            <div className="px-6 py-5">
              <p className="text-[11px] text-gray-400 uppercase font-medium tracking-wide mb-4">Progress</p>
              <div className="flex items-center gap-0">
                {steps.map((step, i) => {
                  const stepNum = i + 1;
                  const isComplete = cfg.step > stepNum;
                  const isCurrent = cfg.step === stepNum || (stepNum === 1 && cfg.step >= 1);
                  const isActive = cfg.step >= stepNum;
                  return (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isComplete ? 'text-white' : isCurrent ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                          style={isActive ? { backgroundColor: tenantConfig.primaryColor } : {}}>
                          {isComplete ? '✓' : stepNum}
                        </div>
                        <p className={`text-[9px] font-medium mt-1.5 text-center w-14 leading-tight ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>{step}</p>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mb-5 mx-1 rounded-full transition-all`}
                          style={{ backgroundColor: cfg.step > stepNum ? tenantConfig.primaryColor : '#e5e7eb' }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {result.status === 'rejected' && (
            <div className="px-6 py-4 bg-red-50 border-t border-red-100">
              <p className="text-sm text-red-600 font-medium">Your request was not approved. Please visit the Barangay Hall for more information.</p>
            </div>
          )}
          {['ready', 'ready_for_pickup', 'oic_review'].includes(result.status) && (
            <div className="px-6 py-4 border-t border-gray-50" style={{ backgroundColor: `${tenantConfig.primaryColor}08` }}>
              <p className="text-sm font-semibold" style={{ color: tenantConfig.primaryColor }}>🎉 Your certificate is ready! Please visit the Barangay Hall to claim it. Bring a valid ID.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function UpgradeNeededModal({ isOpen, onClose, featureName, tenantConfig }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden relative transform transition-all p-8 md:p-12 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl"
          style={{ background: `linear-gradient(135deg, ${tenantConfig.primaryColor}, ${tenantConfig.accentColor})` }}
        >
          <div className="w-10 h-10 text-white flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          </div>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 tracking-tight">
          Premium Feature
        </h2>
        
        <p className="text-gray-500 text-base md:text-lg mb-8 leading-relaxed font-medium">
          The <span className="font-bold text-gray-900">{featureName}</span> request 
          is currently limited to specific subscription tiers. 
          Please contact our <span className="italic">Barangay Secretariat</span> for 
          manual processing or eligibility inquiries.
        </p>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg hover:-translate-y-1 hover:shadow-xl active:scale-95"
          style={{ backgroundColor: tenantConfig.primaryColor }}
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
