import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
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
  Headphones,
  HelpCircle,
  AlertCircle,
  Image as ImageIcon,
  RotateCcw,
  CheckCheck,
  Sparkles,
  RefreshCw,
  Bot,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Info,
  BookOpen,
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
import ResidentMobileActionBar from "@/components/Portal/ResidentMobileActionBar";
import InstallAppModal from "@/components/UI/InstallAppModal";
import usePwa from "@/lib/usePwa";
import useScrollLock from "@/lib/useScrollLock";
import { getPortalStrings, getPortalFormDefinitions, getKapchatPrompts } from "@/lib/portalLang";
import { blotterAPI, assistanceAPI, kapchatAPI } from "@/lib/api";

export default function PortalPageContent({ initialTenantId }) {
  const p = getPortalStrings();
  const router = useRouter();
  const [tenantId, setTenantId] = useState((initialTenantId || "ibaoeste").toLowerCase());
  const openESumbong = () => {
    router.push(`/${tenantId}/e-sumbong`);
  };

  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    showInstallModal,
    setShowInstallModal,
    promptInstall,
  } = usePwa();

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
        const subtitleParts = [
          tenant?.municipality,
          tenant?.region,
        ].filter(Boolean);
        const portalSuffix = getPortalStrings().pageTitleSuffix;
        const subtitle = subtitleParts.length > 0
          ? `${subtitleParts.join(", ")} · ${portalSuffix}`
          : portalSuffix;

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
          subtitle: getPortalStrings().pageTitleSuffix,
          logo: "/logo.png",
          ...defaultColors,
        });
      }
    };
    fetchTenantInfo();
    return () => { cancelled = true; };
  }, [tenantId]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navAtPageTop, setNavAtPageTop] = useState(true);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [navCommunityOpen, setNavCommunityOpen] = useState(false);
  const navCommunityRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const syncViewport = () => setIsDesktopViewport(mq.matches);
    syncViewport();
    mq.addEventListener("change", syncViewport);
    return () => mq.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    const updateNavBlend = () => {
      setNavAtPageTop(window.scrollY < 56);
    };
    updateNavBlend();
    window.addEventListener("scroll", updateNavBlend, { passive: true });
    return () => window.removeEventListener("scroll", updateNavBlend);
  }, []);

  const headerSolidBg = mobileMenuOpen || !navAtPageTop || isDesktopViewport;

  useEffect(() => {
    if (!navCommunityOpen) return;
    const close = (e) => {
      if (navCommunityRef.current && !navCommunityRef.current.contains(e.target)) {
        setNavCommunityOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [navCommunityOpen]);

  useScrollLock(mobileMenuOpen);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAssistance, setShowAssistance] = useState(false);
  const [assistanceMode, setAssistanceMode] = useState(null); // 'kapchat' | 'assistance' | null
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatUserInfo, setChatUserInfo] = useState({ name: "", contact: "" });
  const [chatStarted, setChatStarted] = useState(false);
  const [isChatSyncing, setIsChatSyncing] = useState(false);
  const chatMessagesEndRef = useRef(null);
  const [assistanceFormData, setAssistanceFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [assistanceSubmitting, setAssistanceSubmitting] = useState(false);
  const [assistanceSuccess, setAssistanceSuccess] = useState(false);
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
  const [activeProgramIdx, setActiveProgramIdx] = useState(0);
  const programSlideTouchStart = useRef(null);
  const facilitySlideTouchStart = useRef(null);
  const achievementSlideTouchStart = useRef(null);
  const tourismSlideTouchStart = useRef(null);
  const [activeAchievementIdx, setActiveAchievementIdx] = useState(0);
  const [activeTourismIdx, setActiveTourismIdx] = useState(0);
  const [programCategoryFilter, setProgramCategoryFilter] = useState("all");
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
  const [activeFacilityIdx, setActiveFacilityIdx] = useState(0);
  const [facilityImageIndex, setFacilityImageIndex] = useState(0);
  const [portalDataLoaded, setPortalDataLoaded] = useState(false);
  const [achievementModalMounted, setAchievementModalMounted] = useState(false);

  useEffect(() => {
    setAchievementModalMounted(true);
  }, []);

  const [subscription, setSubscription] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lockedFeature, setLockedFeature] = useState(null);

  const isAnyPortalModalOpen = Boolean(
    selectedAchievement ||
    selectedNewsItem ||
    selectedProgram ||
    selectedFacility ||
    showComingSoonModal ||
    showUpgradeModal
  );
  useScrollLock(isAnyPortalModalOpen);

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

  const forms = useMemo(() => {
    const copy = getPortalFormDefinitions(tenantConfig.shortName);
    const byId = Object.fromEntries(copy.map((f) => [f.id, f]));
    const pick = (id) => byId[id] || { title: id, description: "", features: [] };

    return [
      {
        ...pick("barangay_clearance"),
        icon: Shield,
        color: "blue",
        locked: isFeatureLocked("barangay_clearance"),
        onClick: () =>
          handleFeatureClick("barangay_clearance", pick("barangay_clearance").title, setShowClearanceModal),
      },
      {
        ...pick("certificate_of_indigency"),
        icon: FileText,
        color: "green",
        locked: isFeatureLocked("certificate_of_indigency"),
        onClick: () =>
          handleFeatureClick("certificate_of_indigency", pick("certificate_of_indigency").title, setShowIndigencyModal),
      },
      {
        ...pick("barangay_residency"),
        icon: Home,
        color: "orange",
        locked: isFeatureLocked("barangay_residency"),
        onClick: () =>
          handleFeatureClick("barangay_residency", pick("barangay_residency").title, setShowResidencyModal),
      },
      {
        ...pick("business_permit"),
        icon: Building2,
        color: "purple",
        locked: isFeatureLocked("business_permit"),
        onClick: () =>
          handleFeatureClick("business_permit", pick("business_permit").title, setShowBusinessPermitModal),
      },
      {
        ...pick("business_closure"),
        icon: Briefcase,
        color: "blue",
        locked: isFeatureLocked("business_permit"),
        onClick: () =>
          handleFeatureClick("business_permit", pick("business_closure").title, setShowComingSoonModal),
      },
      {
        ...pick("barangay_cohabitation"),
        icon: Heart,
        color: "green",
        locked: isFeatureLocked("barangay_cohabitation"),
        onClick: () =>
          handleFeatureClick("barangay_cohabitation", pick("barangay_cohabitation").title, setShowCohabitationModal),
      },
      {
        ...pick("medico_legal"),
        icon: Stethoscope,
        color: "orange",
        locked: isFeatureLocked("medico_legal"),
        onClick: () =>
          handleFeatureClick("medico_legal", pick("medico_legal").title, setShowMedicoLegalModal),
      },
      {
        ...pick("certification_same_person"),
        icon: Fingerprint,
        color: "purple",
        locked: isFeatureLocked("certification_same_person"),
        onClick: () =>
          handleFeatureClick(
            "certification_same_person",
            pick("certification_same_person").title,
            setShowSamePersonModal,
          ),
      },
      {
        ...pick("barangay_guardianship"),
        icon: UserPlus,
        color: "blue",
        locked: isFeatureLocked("barangay_guardianship"),
        onClick: () =>
          handleFeatureClick("barangay_guardianship", pick("barangay_guardianship").title, setShowGuardianshipModal),
      },
      {
        ...pick("natural_death"),
        icon: Flower2,
        color: "green",
        locked: isFeatureLocked("natural_death"),
        onClick: () =>
          handleFeatureClick("natural_death", pick("natural_death").title, setShowNaturalDeathModal),
      },
      {
        ...pick("educational_assistance"),
        icon: GraduationCap,
        color: "blue",
        locked: isFeatureLocked("educational_assistance"),
        onClick: () =>
          handleFeatureClick(
            "educational_assistance",
            pick("educational_assistance").title,
            setShowEducationalAssistanceModal,
          ),
      },
    ];
  }, [
    tenantConfig.shortName,
    subscription,
  ]);

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
        const response = await fetch(`/api/portal/events`, {
          headers: { "x-tenant-id": tenantId },
        });

        if (!response.ok) {
          throw new Error(`API error ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          setNewsItems(data.data);
        } else {
          setNewsItems([]);
        }
      } catch (error) {
        console.error("❌ Events API failed:", error.message);
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
      setCurrentSlide(0);
    }
  }, [newsItems, currentSlide]);

  // Load facilities from API
  useEffect(() => {
    const fetchFacilities = async () => {
      if (!tenantId) return;
      try {
        const response = await fetch(`/api/portal/facilities`, {
          headers: { "x-tenant-id": tenantId },
        });

        if (!response.ok) {
          throw new Error(`API error ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          const facilitiesWithIcons = data.data.map((facility) => ({
            ...facility,
            icon: getIconComponent(facility.icon),
          }));
          setFacilities(facilitiesWithIcons);
        } else {
          setFacilities([]);
        }
      } catch (error) {
        console.error("❌ Facilities API failed:", error.message);
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

  // Fetch officials, config, achievements, programs, tourism, and portal config in parallel
  useEffect(() => {
    const fetchData = async () => {
      if (!tenantId) return;

      const headers = { "x-tenant-id": tenantId };

      // Helper: safe fetch with error handling
      const safeFetch = async (url) => {
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) return null;
          const json = await res.json();
          return json.success ? json : null;
        } catch {
          return null;
        }
      };

      // Launch all fetches in parallel
      const [
        officialsResult,
        achievementsResult,
        programsResult,
        tourismResult,
        configResult,
      ] = await Promise.all([
        safeFetch(`/api/portal/officials`),
        safeFetch(`/api/portal/achievements`),
        safeFetch(`/api/portal/programs`),
        safeFetch(`/api/portal/tourism`),
        safeFetch(`/api/portal/config`),
      ]);

      // Officials
      if (officialsResult?.data && Array.isArray(officialsResult.data)) {
        setOfficials(officialsResult.data);
      }

      // Achievements
      if (achievementsResult?.data && Array.isArray(achievementsResult.data)) {
        setAchievements(
          achievementsResult.data.map((ach) => ({
            ...ach,
            colorClass: ach.color_class || "bg-blue-600",
            textColor: ach.text_color || "blue-400",
          })),
        );
      }

      // Programs
      if (programsResult?.data && Array.isArray(programsResult.data)) {
        setPrograms(programsResult.data);
      }

      // Tourism
      if (tourismResult?.data && Array.isArray(tourismResult.data)) {
        const mapped = tourismResult.data.map((d) => {
          const hasCoords = d.latitude != null && d.longitude != null;
          const directions = d.directions_url
            || (hasCoords
              ? `https://www.google.com/maps/search/?api=1&query=${d.latitude},${d.longitude}`
              : `https://maps.google.com/?q=${encodeURIComponent(d.name)}`);
          return {
            id: d.id,
            name: d.name,
            image: d.image || "",
            description: d.description || "",
            directions,
            latitude: d.latitude,
            longitude: d.longitude,
            hasCoords,
          };
        });
        setTourismDestinations(mapped);
      }

      // Config (hero + visibility) — single fetch replaces previous duplicate
      if (configResult?.data) {
        const data = configResult.data;
        if (data.heroSection) setHeroSettings(data.heroSection);
        if (data.visibility) setVisibilitySettings(data.visibility);
      }

      setPortalDataLoaded(true);
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
          text: "Umaga, 28°C",
          color: "text-yellow-400",
        };
      } else if (hour >= 12 && hour < 18) {
        // Afternoon (12 PM - 6 PM)
        weather = {
          icon: Sun,
          text: "Hapon, 31°C",
          color: "text-orange-400",
        };
      } else if (hour >= 18 && hour < 21) {
        // Evening (6 PM - 9 PM)
        weather = {
          icon: Cloud,
          text: "Gabi (hapon), 26°C",
          color: "text-blue-300",
        };
      } else {
        // Night (9 PM - 6 AM)
        weather = {
          icon: Moon,
          text: "Gabi, 24°C",
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
    { label: p.statPopulation, value: "12,847", icon: Users },
    { label: p.statPrograms, value: "24", icon: TrendingUp },
    { label: p.statForms, value: "1,256", icon: FileText },
  ];

  const hotlines = [
    { name: "Barangay Emergency", number: "(044) 123-4567" },
    { name: "Police Station", number: "911" },
    { name: "Fire Department", number: "(044) 765-4321" },
    { name: "Medical Emergency", number: "(044) 987-6543" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Naipadala ang mensahe! Makikipag-ugnayan kami sa inyo sa lalong madaling panahon.");
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: "",
    });
  };

  // Get the Barangay Captain from officials data
  const captain = officials.find((o) => o.position_type === "captain");
  const captainDisplayName = captain?.name || p.kapchatCaptainFallback;

  // Load saved KapChat identity from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("brgy_kapchat_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.name && parsed?.contact) {
          setChatUserInfo(parsed);
          setChatStarted(true);
        }
      }
    } catch (e) {
      console.error("Failed to load saved KapChat user:", e);
    }
  }, []);

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatMessagesEndRef.current && showAssistance && assistanceMode === "kapchat") {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showAssistance, assistanceMode]);

  // Fetch live chat messages for active contact
  const fetchLiveKapChatMessages = async (contactNum, isSilent = false) => {
    const contactToQuery = contactNum || chatUserInfo.contact;
    if (!contactToQuery) return;

    if (!isSilent) setIsChatSyncing(true);
    try {
      const res = await kapchatAPI.getMessages({ contact: contactToQuery });
      if (res?.messages) {
        const mapped = res.messages.map((m) => ({
          id: m.id,
          text: m.message,
          sender: m.is_admin ? "captain" : "user",
          sender_name: m.sender_name,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          created_at: m.created_at,
          status: m.status,
          is_admin: m.is_admin,
        }));
        setChatMessages(mapped);
      }
    } catch (err) {
      console.error("Error fetching live KapChat messages:", err);
    } finally {
      if (!isSilent) setIsChatSyncing(false);
    }
  };

  // Live polling for KapChat (every 3 seconds when open)
  useEffect(() => {
    if (!showAssistance || assistanceMode !== "kapchat" || !chatStarted || !chatUserInfo.contact) {
      return;
    }

    fetchLiveKapChatMessages(chatUserInfo.contact, false);

    const interval = setInterval(() => {
      fetchLiveKapChatMessages(chatUserInfo.contact, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [showAssistance, assistanceMode, chatStarted, chatUserInfo.contact]);

  const kapchatQuickPrompts = getKapchatPrompts();

  // KapChat — Start chat session handler
  const handleStartChat = (e) => {
    e.preventDefault();
    if (chatUserInfo.name.trim() && chatUserInfo.contact.trim()) {
      const cleanInfo = { name: chatUserInfo.name.trim(), contact: chatUserInfo.contact.trim() };
      setChatUserInfo(cleanInfo);
      setChatStarted(true);
      try {
        localStorage.setItem("brgy_kapchat_user", JSON.stringify(cleanInfo));
      } catch (err) {}
      fetchLiveKapChatMessages(cleanInfo.contact, false);
    }
  };

  // KapChat — Reset chat session handler
  const handleResetChatSession = () => {
    if (window.confirm("Switch user or start a fresh session?")) {
      try {
        localStorage.removeItem("brgy_kapchat_user");
      } catch (err) {}
      setChatUserInfo({ name: "", contact: "" });
      setChatMessages([]);
      setChatStarted(false);
    }
  };

  // KapChat — Send message (from input or quick prompt)
  const handleChatSend = async (e, customText = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const messageText = (customText || chatInput).trim();
    if (!messageText) return;

    if (!customText) {
      setChatInput("");
    }
    setChatSending(true);

    const optimisticMsg = {
      id: "temp-" + Date.now(),
      text: messageText,
      sender: "user",
      sender_name: chatUserInfo.name,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sending",
      created_at: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, optimisticMsg]);

    try {
      await kapchatAPI.send({
        name: chatUserInfo.name,
        contact: chatUserInfo.contact,
        message: messageText,
        is_admin: false,
      });
      // Re-fetch to sync DB timestamp & state
      await fetchLiveKapChatMessages(chatUserInfo.contact, true);
    } catch (error) {
      console.error("Error sending KapChat message:", error);
    } finally {
      setChatSending(false);
    }
  };

  // Brgy Assistance — Submit assistance request
  const handleAssistanceSubmit = async (e) => {
    e.preventDefault();
    setAssistanceSubmitting(true);

    try {
      await assistanceAPI.create({
        firstName: assistanceFormData.firstName,
        lastName: assistanceFormData.lastName,
        email: assistanceFormData.email,
        phone: assistanceFormData.phone,
        message: assistanceFormData.message,
      });

      setAssistanceSuccess(true);
      setAssistanceFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
      });

      setTimeout(() => {
        setAssistanceSuccess(false);
        setShowAssistance(false);
        setAssistanceMode(null);
      }, 2500);
    } catch (error) {
      console.error("Error submitting assistance inquiry:", error);
      alert("Failed to submit inquiry. Please try again.");
    } finally {
      setAssistanceSubmitting(false);
    }
  };

  // Open assistance widget in a specific mode
  const openAssistance = (mode) => {
    setAssistanceMode(mode);
    setShowAssistance(true);
  };

  // Close assistance widget and reset
  const closeAssistance = () => {
    setShowAssistance(false);
    setAssistanceMode(null);
    setChatMessages([]);
    setChatInput("");
    setChatStarted(false);
    setChatUserInfo({ name: "", contact: "" });
    setAssistanceSuccess(false);
  };

  return (
    <div
      className="min-h-screen bg-gray-50 pb-[calc(4.875rem+env(safe-area-inset-bottom,0px))] md:pb-0"
      style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
    >
      <Head>
        <meta httpEquiv="content-language" content="fil" />
        <title>{tenantConfig.shortName} — {p.pageTitleSuffix}</title>
        <meta name="description" content={`${tenantConfig.name}, ${tenantConfig.subtitle}. ${p.pageDescription}`} />
        <meta name="keywords" content="barangay, portal, certificate, clearance, permit, online services, Philippines, local government" />
        <meta name="author" content={tenantConfig.name} />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${tenantConfig.shortName} — ${p.pageTitleSuffix}`} />
        <meta property="og:description" content={`${tenantConfig.name}, ${tenantConfig.subtitle}. ${p.pageDescription}`} />
        <meta property="og:image" content={tenantConfig.logo} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${tenantConfig.shortName} — ${p.pageTitleSuffix}`} />
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
            rgba(0, 0, 0, 0.8) 0%,
            rgba(0, 0, 0, 0.3) 60%,
            rgba(0, 0, 0, 0.1) 100%
          );
        }

        @media (max-width: 767px) {
          .hero-gradient {
            background: linear-gradient(
              to top,
              rgba(0, 0, 0, 0.92) 0%,
              rgba(0, 0, 0, 0.55) 42%,
              rgba(0, 0, 0, 0.35) 100%
            );
          }
        }

        .hero-news-slide {
          transition: opacity 0.5s ease-in-out;
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

        @keyframes skeleton-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }
        .skeleton-dark {
          background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
      {/* Skip to Content — Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:rounded-lg focus:shadow-xl focus:text-sm focus:font-bold"
      >
        {p.skipToContent}
      </a>

      {/* Portal Header — Government Identity Bar */}
      <div
        className={`sticky top-0 z-[60] pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-2.5 md:pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] md:pb-3 md:py-4 relative transition-[background,backdrop-filter,border-color,box-shadow] duration-300 md:static md:z-auto md:overflow-hidden ${
          mobileMenuOpen ? "overflow-visible" : "overflow-x-hidden overflow-y-visible"
        } ${
          !headerSolidBg
            ? "border-transparent bg-black/25 backdrop-blur-md shadow-none"
            : "border-b border-white/10 shadow-sm"
        }`}
        style={headerSolidBg ? tenantConfig.colorStyle : undefined}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2 px-4 lg:px-8 relative z-10">
          {/* Left Side - Seal/Logo and Title */}
          <div className="flex items-center gap-2.5 md:gap-5 min-w-0 flex-1">
            <div className="shrink-0">
              <img
                loading="eager"
                src={tenantConfig.logo}
                alt="Barangay Seal"
                className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight truncate">
                {tenantConfig.name}
              </h1>
              <p className="hidden sm:block text-[10px] sm:text-xs md:text-sm text-white/60 font-medium uppercase tracking-[0.12em] mt-0.5 line-clamp-1">
                {tenantConfig.subtitle}
              </p>
            </div>
          </div>

          {/* Mobile menu */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? p.closeMenu : p.openMenu}
            aria-expanded={mobileMenuOpen}
            className="md:hidden shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 border border-white/25 text-white active:scale-95 transition-transform"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="text-xs font-bold uppercase tracking-wide">{p.navMenu}</span>
          </button>

          {/* Right Side - Date/Time and Weather */}
          <div className="hidden sm:flex flex-col items-end gap-1 text-white/80 shrink-0">
            <div className="flex items-center gap-2 text-[10px] lg:text-xs font-medium tracking-wide">
              <Clock className="w-3 h-3 text-white/60 shrink-0" />
              <span className="truncate max-w-[200px] lg:max-w-none">
                {currentTime || p.loading}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] lg:text-xs font-medium tracking-wide uppercase">
              {weatherInfo.icon &&
                React.createElement(weatherInfo.icon, {
                  className: `w-3 h-3 ${weatherInfo.color} shrink-0`,
                })}
              <span>{weatherInfo.text}</span>
            </div>
          </div>

        </div>

        {/* Mobile navigation drawer — fixed panel so it is not clipped by header overflow */}
        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label={p.closeMenu}
              className="md:hidden fixed inset-0 z-[54] bg-black/35 touch-manipulation"
              style={{
                top: "calc(env(safe-area-inset-top, 0px) + 4.25rem)",
              }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <div
              className="md:hidden fixed left-0 right-0 z-[55] border-t border-white/15 bg-[#022c22]/95 backdrop-blur-md overflow-y-auto overscroll-contain touch-pan-y animate-in slide-in-from-top-2 duration-200 shadow-xl"
              style={{
                top: "calc(env(safe-area-inset-top, 0px) + 4.25rem)",
                maxHeight:
                  "calc(100dvh - env(safe-area-inset-top, 0px) - 4.25rem - env(safe-area-inset-bottom, 0px))",
                WebkitOverflowScrolling: "touch",
              }}
            >
            <div className="px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] space-y-0.5">
              {[
                { href: "#news", label: p.navNews },
                { href: "#forms", label: p.navForms },
                { href: "#citizen-help", label: p.navHelp },
                { href: "#track", label: p.trackRequestShort },
                { href: "#officials", label: p.navOfficialsMobile },
                { href: "#contact", label: p.navContact },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-2 rounded-lg text-white font-semibold text-sm active:bg-white/10"
                >
                  {link.label}
                </a>
              ))}
              <p className="pt-2 pb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-white/50">
                {p.navCommunity}
              </p>
              {[
                { href: "#directory", label: p.navFacilities },
                { href: "#tourism", label: p.navTourismMobile },
                { href: "#achievements", label: p.navAchievementsMobile },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg text-white/90 text-sm font-medium active:bg-white/10"
                >
                  {link.label}
                </a>
              ))}
              {!isInstalled && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    promptInstall();
                  }}
                  className="w-full mt-2 py-3 px-3 rounded-lg text-sm font-semibold text-white bg-white/15 border border-white/25"
                >
                  {p.installAppMobile}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push("/login");
                }}
                className="w-full mt-2 py-3 rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: tenantConfig.accentColor || tenantConfig.primaryColor }}
              >
                {p.login}
              </button>
            </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation Bar — desktop only */}
      <nav
        className={`sticky top-0 z-50 hidden md:block transition-[background,backdrop-filter,border-color,box-shadow] duration-300 ${
          navAtPageTop
            ? "bg-black/15 backdrop-blur-md border-b border-white/15 shadow-none"
            : "bg-white/95 backdrop-blur-md border-b border-gray-200/90 shadow-sm"
        }`}
        aria-label="Pangunahing menu"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop — menu + login aligned right */}
          <div className="hidden md:flex items-center justify-end gap-2 lg:gap-3 min-h-[3rem] py-2 w-full">
            <div
              className="flex items-center flex-wrap justify-end gap-x-0.5 lg:gap-x-1 gap-y-1"
              role="menubar"
            >
              {[
                { href: "#news", short: p.navNewsShort, full: p.navNews },
                { href: "#forms", short: p.navFormsShort, full: p.navForms },
                { href: "#citizen-help", short: p.navHelpShort, full: p.navHelp },
                { href: "#officials", short: p.navOfficialsShort, full: p.navOfficials },
                { href: "#contact", short: p.navContactShort, full: p.navContact },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  title={link.full}
                  role="menuitem"
                  className={`nav-link px-2.5 lg:px-3 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${
                    navAtPageTop
                      ? "text-white/95 hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {link.short}
                </a>
              ))}

              <div className="relative shrink-0" ref={navCommunityRef}>
                <button
                  type="button"
                  onClick={() => setNavCommunityOpen((o) => !o)}
                  aria-expanded={navCommunityOpen}
                  aria-haspopup="true"
                  title={`${p.navFacilities}, ${p.navTourism}, ${p.navAchievements}`}
                  className={`nav-link flex items-center gap-0.5 px-2.5 lg:px-3 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${
                    navAtPageTop
                      ? "text-white/95 hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {p.navCommunity}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${navCommunityOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {navCommunityOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 py-1.5 bg-white rounded-lg border border-gray-200 shadow-lg z-[60] animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { href: "#directory", label: p.navFacilities },
                      { href: "#tourism", label: p.navTourism },
                      { href: "#achievements", label: p.navAchievements },
                    ].map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setNavCommunityOpen(false)}
                        className="block px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 ml-0.5 lg:ml-1"
              style={{ backgroundColor: tenantConfig.primaryColor }}
            >
              {p.login}
            </button>
          </div>

        </div>
      </nav>

      {/* Hero Section — News & Announcements */}
      <section
        id="news"
        aria-label={p.newsCarouselAria}
        tabIndex={-1}
        className="relative overflow-hidden bg-gray-900 scroll-mt-[4.5rem] md:scroll-mt-0 -mt-[calc(env(safe-area-inset-top,0px)+4.25rem)] pt-[calc(env(safe-area-inset-top,0px)+4.25rem)] md:mt-0 md:pt-0 md:-mt-[3.25rem] md:pt-[3.25rem] h-[min(100dvh,42rem)] min-h-[min(30rem,100dvh)] md:min-h-0 md:h-[420px] md:max-h-none lg:h-[480px]"
      >
        <span id="main-content" tabIndex={-1} className="sr-only">
          {p.skipToContent}
        </span>
        {/* Loading Skeleton */}
        {newsItems.length === 0 && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="w-full max-w-[1400px] px-6 md:px-12 space-y-4 animate-pulse">
              <div className="h-5 w-28 bg-white/10 rounded" />
              <div className="h-10 w-2/3 bg-white/15 rounded" />
              <div className="h-16 w-3/4 bg-white/10 rounded" />
              <div className="h-10 w-36 bg-white/20 rounded" />
            </div>
          </div>
        )}
        {newsItems.map((item, index) => (
          <div
            key={index}
            className={`hero-news-slide absolute inset-0 ${
              currentSlide === index
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {item.image ? (
              <img
                src={item.image}
                alt=""
                aria-hidden
                decoding={currentSlide === index ? "sync" : "async"}
                fetchpriority={currentSlide === index ? "high" : "low"}
                className="absolute inset-0 w-full h-full object-cover object-center"
                draggable={false}
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${tenantConfig.primaryColor} 0%, ${tenantConfig.cardBackground} 100%)`,
                }}
              />
            )}
            <div className="absolute inset-0 hero-gradient" aria-hidden />
            <div
              className="absolute inset-x-0 bottom-0 z-[1] h-[min(62%,22rem)] bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none md:hidden"
              aria-hidden
            />

            <div className="absolute inset-0 z-[2] flex flex-col justify-end max-w-[1400px] mx-auto w-full px-4 pb-[8.25rem] sm:pb-[8.75rem] md:px-12 md:pb-24 md:justify-center md:items-stretch">
              <div className="max-w-2xl text-white w-full">
                <span
                  className="inline-flex items-center px-3 py-1 rounded text-[10px] font-bold uppercase tracking-[0.15em] mb-2 md:mb-5 text-white"
                  style={{ backgroundColor: `${tenantConfig.accentColor}cc` }}
                >
                  <Calendar className="w-3 h-3 mr-1.5" />
                  {item.date}
                </span>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1.5 md:mb-3 leading-tight tracking-tight line-clamp-2 md:line-clamp-none">
                  {item.title}
                </h2>
                <p className="text-sm md:text-base text-white/90 mb-3 md:mb-6 line-clamp-2 md:line-clamp-3 leading-snug md:leading-relaxed max-w-xl">
                  {item.description}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedNewsItem(item)}
                  className="bg-white px-5 py-2.5 md:px-6 md:py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-90 inline-flex items-center gap-2 text-sm min-h-[44px] touch-manipulation"
                  style={{ color: tenantConfig.primaryColor }}
                >
                  {p.readFullAnnouncement}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Navigation */}
        {newsItems.length > 1 && (
          <div className="absolute bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))] md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 z-30">
            <button
              onClick={() =>
                setCurrentSlide(
                  (prev) => (prev - 1 + newsItems.length) % newsItems.length,
                )
              }
              aria-label={p.carouselPrev}
              className="bg-white/25 hover:bg-white/40 p-2.5 md:p-1.5 rounded-lg md:rounded transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 md:w-4 md:h-4 text-white" />
            </button>

            <div className="flex gap-2">
              {newsItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`${p.carouselGoTo} ${index + 1}`}
                  aria-current={currentSlide === index}
                  className={`h-1.5 rounded-full transition-all ${
                    currentSlide === index
                      ? "bg-white w-6"
                      : "bg-white/40 hover:bg-white/60 w-1.5"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev + 1) % newsItems.length)
              }
              aria-label={p.carouselNext}
              className="bg-white/25 hover:bg-white/40 p-2.5 md:p-1.5 rounded-lg md:rounded transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 md:w-4 md:h-4 text-white" />
            </button>
          </div>
        )}
      </section>

      {/* Available Forms Section - Modern Design with Responsive Background */}
      <section
        id="forms"
        className="py-10 md:py-16 relative overflow-hidden animate-on-scroll scroll-mt-[3.5rem] md:scroll-mt-0"
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

        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-8">
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
              {p.formsBadge}
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: tenantConfig.accentColor }}
              ></span>
              <span
                className="font-black"
                style={{ color: tenantConfig.accentColor }}
              >
                {p.formsBadgeLive}
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-6">
              Barangay{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: `linear-gradient(to right, ${tenantConfig.accentColor}, ${tenantConfig.primaryColor})`,
                }}
              >
                {p.formsTitle}
              </span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed">
              {p.formsSubtitle}
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
                              className="group relative bg-white rounded-2xl p-6 md:p-8 transition-all duration-500 overflow-hidden w-full max-w-[380px] mx-auto border border-gray-100 premium-shadow hover:-translate-y-2 hover:shadow-2xl"
                              style={{
                                boxShadow: `0 20px 40px -15px ${tenantConfig.accentColor}10`,
                              }}
                            >
                              {/* Decorative Background Icon */}
                              <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                <Icon size={120} />
                              </div>

                              {/* Icon Header */}
                              <div className="relative mb-8 flex justify-between items-start">
                                <div
                                  className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}
                                  style={{
                                    background: `linear-gradient(135deg, ${tenantConfig.primaryColor}, ${tenantConfig.accentColor})`,
                                  }}
                                >
                                  <Icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                  Form {String(formIndex + 1).padStart(2, "0")}
                                </span>
                              </div>

                              {/* Content */}
                              <div className="relative">
                                <h3
                                  className="text-lg md:text-xl font-black text-gray-900 mb-3 leading-tight transition-colors flex items-center flex-wrap"
                                  style={{
                                    groupHover: {
                                      color: tenantConfig.accentColor,
                                    },
                                  }}
                                >
                                  {form.title}
                                  {form.locked && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black bg-gray-100 text-gray-400 border border-gray-200 uppercase tracking-tighter">
                                      <Shield className="w-2.5 h-2.5 mr-1" /> {p.locked}
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
                                    {form.locked ? p.lockedUpgrade : p.requestCertificate}
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

      {/* Citizen Help Desk — KapChat, E-Sumbong, Brgy Assistance */}
      <section
        id="citizen-help"
        className="py-12 md:py-16 w-full border-t border-gray-200 relative overflow-hidden scroll-mt-[3.5rem] md:scroll-mt-0"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: "url(/images/community.jpg)" }}
          aria-hidden
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${tenantConfig.primaryColor}e6 0%, rgba(15, 23, 42, 0.88) 55%, rgba(0, 0, 0, 0.75) 100%)`,
          }}
          aria-hidden
        />

        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 relative z-10">
          <div className="text-center mb-8 md:mb-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] mb-4 border border-white/30 bg-white/15 text-white backdrop-blur-md">
              <Headphones className="w-3.5 h-3.5" />
              {p.helpDeskBadge}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-3 drop-shadow-sm">
              {p.helpDeskTitle}{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: `linear-gradient(to right, #ffffff, ${tenantConfig.accentColor})`,
                }}
              >
                {p.helpDeskTitleAccent}
              </span>
            </h2>
            <p className="text-white/85 text-sm md:text-base leading-relaxed font-medium drop-shadow-sm">
              {p.helpDeskSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 max-w-6xl mx-auto items-stretch">
            {/* KapChat */}
            <button
              type="button"
              onClick={() => openAssistance("kapchat")}
              className="group help-desk-card text-left h-full min-h-[15.5rem] md:min-h-[16.75rem] rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_24px_-6px_rgba(0,0,0,0.4)] hover:bg-white/[0.16] hover:border-white/35 transition-all duration-300 p-5 md:p-6 flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent overflow-hidden relative"
            >
              <div
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
                aria-hidden
              />
              <span className="text-[9px] font-black uppercase tracking-widest mb-3 min-h-[1.125rem] text-emerald-100/90">
                {p.kapchatLive}
              </span>
              <div className="flex items-center gap-3 mb-3 min-h-[2.75rem]">
                <div className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center bg-white/15 border border-white/20 group-hover:bg-white/20 transition-colors">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-black text-white leading-tight line-clamp-2">{p.kapchat}</h3>
              </div>
              <p className="text-sm text-white/75 leading-snug flex-1 min-h-[4.5rem] line-clamp-4 md:line-clamp-3">
                {p.kapchatDesc}
              </p>
              <span className="mt-4 inline-flex items-center justify-center gap-1.5 w-full min-h-[2.5rem] py-2.5 rounded-lg text-xs font-bold text-white border border-white/25 bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                {p.openKapchat}
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </span>
            </button>

            {/* E-Sumbong */}
            <button
              type="button"
              onClick={openESumbong}
              className="group help-desk-card text-left h-full min-h-[15.5rem] md:min-h-[16.75rem] rounded-2xl border border-red-200/25 bg-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_24px_-6px_rgba(0,0,0,0.4)] hover:bg-red-950/20 hover:border-red-200/40 transition-all duration-300 p-5 md:p-6 flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent overflow-hidden relative"
            >
              <div
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-300/60 to-transparent"
                aria-hidden
              />
              <span className="text-[9px] font-black uppercase tracking-widest mb-3 min-h-[1.125rem] text-red-100/90">
                {p.esumbongOfficial}
              </span>
              <div className="flex items-center gap-3 mb-3 min-h-[2.75rem]">
                <div className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center bg-red-500/20 border border-red-200/25">
                  <AlertCircle className="w-5 h-5 text-red-100" />
                </div>
                <h3 className="text-lg font-black text-white leading-tight line-clamp-2">{p.esumbong}</h3>
              </div>
              <p className="text-sm text-white/75 leading-snug flex-1 min-h-[4.5rem] line-clamp-4 md:line-clamp-3">
                {p.esumbongDesc}
              </p>
              <span className="mt-4 inline-flex items-center justify-center gap-1.5 w-full min-h-[2.5rem] py-2.5 rounded-lg text-xs font-bold text-white border border-red-200/35 bg-red-500/25 backdrop-blur-sm group-hover:bg-red-500/40 transition-all">
                {p.fileReport}
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </span>
            </button>

            {/* Brgy Assistance */}
            <button
              type="button"
              onClick={() => openAssistance("assistance")}
              className="group help-desk-card text-left h-full min-h-[15.5rem] md:min-h-[16.75rem] rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_24px_-6px_rgba(0,0,0,0.4)] hover:bg-white/[0.16] hover:border-white/35 transition-all duration-300 p-5 md:p-6 flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent overflow-hidden relative"
            >
              <div
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
                aria-hidden
              />
              <span className="text-[9px] font-black uppercase tracking-widest mb-3 min-h-[1.125rem] text-emerald-100/90">
                {p.brgyAssistGeneral}
              </span>
              <div className="flex items-center gap-3 mb-3 min-h-[2.75rem]">
                <div className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center bg-white/15 border border-white/20 group-hover:bg-white/20 transition-colors">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-black text-white leading-tight line-clamp-2">{p.brgyAssist}</h3>
              </div>
              <p className="text-sm text-white/75 leading-snug flex-1 min-h-[4.5rem] line-clamp-4 md:line-clamp-3">
                {p.brgyAssistDesc}
              </p>
              <span className="mt-4 inline-flex items-center justify-center gap-1.5 w-full min-h-[2.5rem] py-2.5 rounded-lg text-xs font-bold text-white border border-white/25 bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                {p.sendInquiry}
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Track Your Request Section */}
      <section id="track" className="py-12 md:py-16 w-full border-t border-gray-100" style={{ background: `linear-gradient(135deg, ${tenantConfig.primaryColor}08 0%, ${tenantConfig.accentColor}05 100%)` }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-4 border" style={{ color: tenantConfig.primaryColor, borderColor: `${tenantConfig.primaryColor}30`, backgroundColor: `${tenantConfig.primaryColor}08` }}>
              <Search className="w-3.5 h-3.5" />
              {p.trackBadge}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3">
              {p.trackTitle}{" "}
              <span style={{ color: tenantConfig.accentColor }}>{p.trackTitleAccent}</span>
            </h2>
            <p className="text-gray-500 text-base mb-8">{p.trackSubtitle}</p>
            <TrackRequestWidget tenantId={tenantId} tenantConfig={tenantConfig} labels={p} />
          </div>
        </div>
      </section>

      {/* Programs, Facilities & Legacy — one shared community background */}
      {(!isFeatureLocked("programs") ||
        !isFeatureLocked("facilities") ||
        !isFeatureLocked("achievements")) && (
        <section className="py-12 md:py-16 w-full border-t border-gray-200 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
            style={{ backgroundImage: "url(/images/community.jpg)" }}
            aria-hidden
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${tenantConfig.primaryColor}e6 0%, rgba(15, 23, 42, 0.88) 55%, rgba(0, 0, 0, 0.75) 100%)`,
            }}
            aria-hidden
          />

          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 relative z-10">
            {!isFeatureLocked("programs") && (
              <div
                id="programs"
                className={`scroll-mt-[3.5rem] md:scroll-mt-0 ${!isFeatureLocked("facilities") ? "pb-10 md:pb-12" : ""}`}
              >
            {/* Section Header — Programs */}
            <div className="mb-6 md:mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between max-w-3xl md:max-w-none">
              <div className="space-y-2.5 md:space-y-3 min-w-0 md:max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-[0.14em] md:tracking-[0.18em] border border-white/30 bg-white/15 text-white backdrop-blur-md max-w-full">
                  <Shield className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                  <span className="truncate">{p.programsBadge}</span>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl md:text-4xl font-black text-white tracking-tight leading-[1.15]">
                    {p.programsTitle}{" "}
                    <span
                      className="text-transparent bg-clip-text"
                      style={{
                        backgroundImage: `linear-gradient(to right, #ffffff, ${tenantConfig.accentColor})`,
                      }}
                    >
                      {p.programsTitleAccent}
                    </span>
                  </h2>
                  <p className="text-white/80 text-sm md:text-base mt-2 leading-relaxed font-medium max-w-2xl line-clamp-3 md:line-clamp-none">
                    {p.programsSubtitle}
                  </p>
                </div>
              </div>

              {/* Navigation — full-width row on mobile for easier tapping */}
              {portalDataLoaded && programs.length > 1 && (
                <div className="flex items-center justify-between gap-3 w-full md:w-auto md:justify-end shrink-0">
                  <span className="text-xs font-mono font-bold text-white/70 tabular-nums">
                    {String(activeProgramIdx + 1).padStart(2, "0")} / {String(programs.length).padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveProgramIdx((prev) => (prev > 0 ? prev - 1 : programs.length - 1))}
                      aria-label={p.prevProgram}
                      className="min-h-[44px] min-w-[44px] rounded-xl border border-white/25 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveProgramIdx((prev) => (prev < programs.length - 1 ? prev + 1 : 0))}
                      aria-label={p.nextProgram}
                      className="min-h-[44px] min-w-[44px] rounded-xl border border-white/25 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Loading Skeleton */}
            {!portalDataLoaded && (
              <>
                <div className="md:hidden max-w-6xl mx-auto rounded-xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-xl">
                  <div className="skeleton w-full aspect-[16/9] opacity-40" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-2.5 w-1/4 rounded opacity-40" />
                    <div className="skeleton h-4 w-3/4 rounded opacity-40" />
                  </div>
                </div>
                <div className="hidden md:block rounded-2xl p-5 sm:p-6 border border-white/20 bg-white/10 backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6 skeleton aspect-[16/10] rounded-xl opacity-40" />
                  <div className="lg:col-span-6 space-y-4">
                    <div className="skeleton h-4 w-1/3 rounded opacity-40" />
                    <div className="skeleton h-7 w-3/4 rounded-lg opacity-40" />
                    <div className="skeleton h-20 w-full rounded-xl opacity-40" />
                    <div className="skeleton h-10 w-full rounded-lg opacity-40 mt-4" />
                  </div>
                </div>
              </>
            )}

            {/* Empty State */}
            {portalDataLoaded && programs.length === 0 && (
              <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-white/30 bg-white/10 backdrop-blur-xl">
                <div className="w-14 h-14 rounded-xl bg-white/15 text-white flex items-center justify-center mx-auto mb-4 border border-white/20">
                  <Target className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-black text-white uppercase">
                  {p.noProgramsTitle}
                </h4>
                <p className="text-white/70 text-sm mt-1 max-w-md mx-auto leading-relaxed">
                  {p.noProgramsDesc}
                </p>
              </div>
            )}

            {/* Active Showcase */}
            {portalDataLoaded && programs.length > 0 && (() => {
              const activeProg = programs[activeProgramIdx] || programs[0];
              
              const getCategoryIcon = (cat = "") => {
                const lower = (cat || "").toLowerCase();
                if (lower.includes("health") || lower.includes("med")) return Heart;
                if (lower.includes("infra") || lower.includes("building")) return Building2;
                if (lower.includes("edu") || lower.includes("school") || lower.includes("scholar")) return GraduationCap;
                if (lower.includes("green") || lower.includes("environ") || lower.includes("tree")) return Leaf;
                if (lower.includes("youth") || lower.includes("social") || lower.includes("comm")) return Users;
                if (lower.includes("livelihood") || lower.includes("business")) return Store;
                return Award;
              };

              const CategoryIcon = getCategoryIcon(activeProg.category);

              const renderProgramCard = (prog, idx) => {
                const ProgIcon = getCategoryIcon(prog.category);
                return (
                  <button
                    key={prog.id || idx}
                    type="button"
                    onClick={() => {
                      setActiveProgramIdx(idx);
                      setSelectedProgram(prog);
                    }}
                    className="group text-left flex flex-col rounded-xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_24px_-6px_rgba(0,0,0,0.35)] hover:bg-white/[0.16] hover:border-white/35 transition-all duration-300 w-full touch-manipulation"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-black/30">
                      <img
                        loading="lazy"
                        src={
                          prog.image ||
                          "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800"
                        }
                        alt={prog.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-white/15 backdrop-blur-md border border-white/25">
                        <ProgIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[10rem]">
                          {prog.category || p.communityInitiative}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 p-4">
                      <p className="text-[9px] font-black uppercase tracking-wider text-white/60 mb-1">
                        {p.active} · {p.initiative} {String(idx + 1).padStart(2, "0")}
                      </p>
                      <h3 className="text-sm font-bold text-white leading-snug mb-1.5 line-clamp-2">
                        {prog.title}
                      </h3>
                      <p className="text-white/70 text-xs leading-relaxed line-clamp-3 flex-1">
                        {prog.description || p.defaultProgramDesc}
                      </p>
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/80 pt-3 mt-2 border-t border-white/15 group-hover:text-white min-h-[44px]">
                        {p.viewProgram}
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </button>
                );
              };

              const goPrevProgramSlide = () =>
                setActiveProgramIdx((prev) => (prev > 0 ? prev - 1 : programs.length - 1));
              const goNextProgramSlide = () =>
                setActiveProgramIdx((prev) => (prev < programs.length - 1 ? prev + 1 : 0));

              return (
                <div className="max-w-6xl mx-auto">
                  {/* Mobile — Parangal-style card carousel */}
                  <div className="md:hidden">
                    {programs.length > 1 ? (
                      <>
                        <div
                          className="overflow-hidden rounded-xl"
                          onTouchStart={(e) => {
                            programSlideTouchStart.current = e.touches[0]?.clientX ?? null;
                          }}
                          onTouchEnd={(e) => {
                            const start = programSlideTouchStart.current;
                            programSlideTouchStart.current = null;
                            if (start == null) return;
                            const end = e.changedTouches[0]?.clientX ?? start;
                            const dx = end - start;
                            if (Math.abs(dx) < 40) return;
                            if (dx < 0) goNextProgramSlide();
                            else goPrevProgramSlide();
                          }}
                        >
                          <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{ transform: `translateX(-${activeProgramIdx * 100}%)` }}
                          >
                            {programs.map((prog, idx) => (
                              <div key={prog.id || idx} className="w-full shrink-0 px-0.5">
                                {renderProgramCard(prog, idx)}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-3">
                          <button
                            type="button"
                            onClick={goPrevProgramSlide}
                            aria-label={p.prevProgram}
                            className="min-h-[40px] min-w-[40px] rounded-lg border border-white/25 bg-white/10 text-white flex items-center justify-center active:scale-95 touch-manipulation"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <div
                            className="flex flex-wrap items-center justify-center gap-1.5 max-w-[12rem]"
                            role="tablist"
                            aria-label={p.programsTitle}
                          >
                            {programs.map((prog, idx) => (
                              <button
                                key={prog.id || idx}
                                type="button"
                                role="tab"
                                aria-selected={activeProgramIdx === idx}
                                aria-label={`${p.initiative} ${idx + 1}: ${prog.title}`}
                                onClick={() => setActiveProgramIdx(idx)}
                                className={`h-2 rounded-full transition-all touch-manipulation ${
                                  activeProgramIdx === idx
                                    ? "w-6 bg-emerald-400"
                                    : "w-2 bg-white/35 hover:bg-white/55"
                                }`}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={goNextProgramSlide}
                            aria-label={p.nextProgram}
                            className="min-h-[40px] min-w-[40px] rounded-lg border border-white/25 bg-white/10 text-white flex items-center justify-center active:scale-95 touch-manipulation"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-white/45 font-medium text-center pt-1">
                          {p.programsSlideHint}
                        </p>
                      </>
                    ) : (
                      renderProgramCard(programs[0], 0)
                    )}
                  </div>

                  {/* Desktop — featured showcase + picker grid */}
                  <div className="hidden md:block space-y-6 max-w-5xl mx-auto">
                  <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_12px_40px_-8px_rgba(0,0,0,0.45)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all duration-300 relative">
                    <div
                      className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent z-20 pointer-events-none"
                      aria-hidden
                    />

                    {/* Photo */}
                    <div className="lg:col-span-5 relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[240px] sm:max-h-[280px] lg:max-h-none lg:aspect-auto lg:h-auto lg:min-h-[320px] bg-slate-900/50 overflow-hidden group">
                      <img
                        key={activeProg.id || activeProgramIdx}
                        src={
                          activeProg.image ||
                          "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1200"
                        }
                        alt={activeProg.title}
                        className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-105 animate-in fade-in"
                      />
                      <div
                        className="absolute inset-0 pointer-events-none hidden lg:block"
                        style={{
                          background: `linear-gradient(135deg, ${tenantConfig.primaryColor}99 0%, rgba(15, 23, 42, 0.55) 50%, rgba(0, 0, 0, 0.65) 100%)`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none lg:hidden" />

                      <div className="absolute top-2.5 left-2.5 z-10 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white bg-white/15 backdrop-blur-md border border-white/25 max-w-[calc(100%-1rem)]">
                        <CategoryIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{activeProg.category || p.communityInitiative}</span>
                      </div>

                      <div className="absolute bottom-2.5 right-2.5 z-10 hidden md:flex">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 border border-emerald-300/40 text-[9px] font-black uppercase tracking-wider text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          {p.active}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="lg:col-span-7 p-4 sm:p-6 lg:p-7 flex flex-col justify-between text-white relative">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white bg-white/15 border border-white/25 md:hidden">
                            <CategoryIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[12rem]">{activeProg.category || p.communityInitiative}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 border border-emerald-300/40 text-[9px] font-black uppercase tracking-wider md:hidden">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            {p.active}
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/70 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20 hidden md:inline-flex">
                            {p.initiative} {String(activeProgramIdx + 1).padStart(2, "0")} / {String(programs.length).padStart(2, "0")}
                          </span>
                          <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider hidden lg:inline ml-auto">
                            {p.sangguniangBarangay}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg md:text-xl font-black leading-snug tracking-tight line-clamp-3 md:line-clamp-2">
                          {activeProg.title}
                        </h3>

                        <p className="text-sm text-white/80 leading-relaxed line-clamp-4 md:line-clamp-3">
                          {activeProg.description || p.defaultProgramDesc}
                        </p>

                        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 pt-1">
                          <div className="rounded-lg p-2.5 border border-white/15 bg-white/10 backdrop-blur-sm">
                            <span className="text-[9px] font-black uppercase tracking-wider text-white/60 block mb-0.5">
                              {p.jurisdiction}
                            </span>
                            <span className="text-xs font-bold text-white truncate block">
                              {p.barangayWord} {tenantConfig.shortName || "Iba O' Este"}
                            </span>
                          </div>
                          <div className="rounded-lg p-2.5 border border-white/15 bg-white/10 backdrop-blur-sm">
                            <span className="text-[9px] font-black uppercase tracking-wider text-white/60 block mb-0.5">
                              {p.beneficiaries}
                            </span>
                            <span className="text-xs font-bold text-white truncate block">
                              {p.allQualifiedResidents}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-3 md:mt-4 border-t border-white/15">
                        <button
                          type="button"
                          onClick={() => setSelectedProgram(activeProg)}
                          className="w-full min-h-[44px] py-3 md:py-2.5 px-4 rounded-lg text-sm md:text-xs font-bold text-white border border-white/30 bg-white/15 backdrop-blur-sm hover:bg-white/25 hover:border-white/45 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] touch-manipulation"
                          style={{
                            boxShadow: `0 4px 20px -4px ${tenantConfig.primaryColor}80`,
                          }}
                        >
                          {p.viewProgram}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {programs.length > 1 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between px-0.5 gap-2">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="truncate">{p.selectInitiative}</span>
                        </h4>
                        <span className="text-[10px] text-white/50 font-bold shrink-0 tabular-nums">
                          {programs.length} {p.programsCount}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 lg:grid-cols-7 gap-2.5">
                        {programs.map((prog, idx) => {
                          const isActive = activeProgramIdx === idx;
                          const ProgIcon = getCategoryIcon(prog.category);
                          return (
                            <button
                              key={prog.id || idx}
                              type="button"
                              onClick={() => setActiveProgramIdx(idx)}
                              aria-current={isActive ? "true" : undefined}
                              className={`group text-left p-2.5 rounded-xl transition-all duration-200 flex flex-col border cursor-pointer backdrop-blur-md w-full ${
                                isActive
                                  ? "bg-white/20 border-white/40 ring-1 ring-white/30 shadow-md"
                                  : "bg-white/10 border-white/15 hover:bg-white/15 hover:border-white/25"
                              }`}
                            >
                              <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-black/30 mb-2">
                                <img
                                  src={
                                    prog.image ||
                                    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=400"
                                  }
                                  alt=""
                                  aria-hidden
                                  className="w-full h-full object-cover"
                                />
                                {isActive && (
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                                  </div>
                                )}
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-white/70">
                                  <ProgIcon className="w-2.5 h-2.5 flex-shrink-0" />
                                  <span className="truncate">{prog.category || p.initiative}</span>
                                </div>
                                <h5
                                  className={`text-xs font-bold line-clamp-2 leading-tight ${isActive ? "text-white" : "text-white/85"}`}
                                >
                                  {prog.title}
                                </h5>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              );
            })()}
              </div>
            )}

            {!isFeatureLocked("facilities") && (
              <div
                id="directory"
                className={!isFeatureLocked("programs") ? "pt-10 md:pt-12 border-t border-white/15" : undefined}
              >
            {/* Section Header — Facilities */}
            <div className="mb-6 md:mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between max-w-3xl md:max-w-none">
              <div className="space-y-2.5 md:space-y-3 min-w-0 md:max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-[0.14em] md:tracking-[0.18em] border border-white/30 bg-white/15 text-white backdrop-blur-md max-w-full">
                  <Building2 className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                  <span className="truncate">{p.facilitiesBadge}</span>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl md:text-4xl font-black text-white tracking-tight leading-[1.15]">
                    {p.facilitiesTitle}{" "}
                    <span
                      className="text-transparent bg-clip-text"
                      style={{
                        backgroundImage: `linear-gradient(to right, #ffffff, ${tenantConfig.accentColor})`,
                      }}
                    >
                      {p.facilitiesTitleAccent}
                    </span>
                  </h2>
                  <p className="text-white/80 text-sm md:text-base mt-2 leading-relaxed font-medium max-w-2xl line-clamp-3 md:line-clamp-none">
                    {p.facilitiesSubtitle}
                  </p>
                </div>
              </div>

              {portalDataLoaded && facilities.length > 1 && (
                <div className="flex items-center justify-between gap-3 w-full md:w-auto md:justify-end shrink-0">
                  <span className="text-xs font-mono font-bold text-white/70 tabular-nums">
                    {String(activeFacilityIdx + 1).padStart(2, "0")} / {String(facilities.length).padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveFacilityIdx((prev) => (prev > 0 ? prev - 1 : facilities.length - 1))}
                      aria-label={p.prevFacility}
                      className="min-h-[44px] min-w-[44px] rounded-xl border border-white/25 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFacilityIdx((prev) => (prev < facilities.length - 1 ? prev + 1 : 0))}
                      aria-label={p.nextFacility}
                      className="min-h-[44px] min-w-[44px] rounded-xl border border-white/25 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Loading Skeleton */}
            {!portalDataLoaded && (
              <>
                <div className="md:hidden max-w-6xl mx-auto rounded-xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-xl">
                  <div className="skeleton w-full aspect-[16/9] opacity-40" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-2.5 w-1/4 rounded opacity-40" />
                    <div className="skeleton h-4 w-3/4 rounded opacity-40" />
                  </div>
                </div>
                <div className="hidden md:block rounded-2xl p-5 sm:p-6 border border-white/20 bg-white/10 backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6 skeleton aspect-[16/10] rounded-xl opacity-40" />
                  <div className="lg:col-span-6 space-y-4">
                    <div className="skeleton h-4 w-1/3 rounded opacity-40" />
                    <div className="skeleton h-7 w-3/4 rounded-lg opacity-40" />
                    <div className="skeleton h-20 w-full rounded-xl opacity-40" />
                    <div className="skeleton h-10 w-full rounded-lg opacity-40 mt-4" />
                  </div>
                </div>
              </>
            )}

            {/* Empty State */}
            {portalDataLoaded && facilities.length === 0 && (
              <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-white/30 bg-white/10 backdrop-blur-xl">
                <div className="w-14 h-14 rounded-xl bg-white/15 text-white flex items-center justify-center mx-auto mb-4 border border-white/20">
                  <Building2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-black text-white uppercase">
                  {p.noFacilitiesTitle}
                </h4>
                <p className="text-white/70 text-sm mt-1 max-w-md mx-auto leading-relaxed">
                  {p.noFacilitiesDesc}
                </p>
              </div>
            )}

            {/* Active Facility Showcase */}
            {portalDataLoaded && facilities.length > 0 && (() => {
              const activeFac = facilities[activeFacilityIdx] || facilities[0];
              const FacilityIcon = activeFac.icon || Building2;
              const photoCount = (activeFac.images || []).length;
              const mainImage = activeFac.images?.[0] || "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=1200";

              const renderFacilityCard = (fac, idx) => {
                const FacIcon = fac.icon || Building2;
                const thumbImg =
                  fac.images?.[0] ||
                  "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=800";
                const photos = (fac.images || []).length;
                return (
                  <button
                    key={fac.id || idx}
                    type="button"
                    onClick={() => {
                      setActiveFacilityIdx(idx);
                      setFacilityImageIndex(0);
                      setSelectedFacility(fac);
                    }}
                    className="group text-left flex flex-col rounded-xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_24px_-6px_rgba(0,0,0,0.35)] hover:bg-white/[0.16] hover:border-white/35 transition-all duration-300 w-full touch-manipulation"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-black/30">
                      <img
                        loading="lazy"
                        src={thumbImg}
                        alt={fac.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-white/15 backdrop-blur-md border border-white/25">
                        <FacIcon className="w-3 h-3 shrink-0" />
                        {p.publicFacility}
                      </div>
                      {photos > 0 && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-white/15 backdrop-blur-md border border-white/25">
                          <ImageIcon className="w-3 h-3" />
                          {photos}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-4">
                      <p className="text-[9px] font-black uppercase tracking-wider text-white/60 mb-1">
                        {p.publicService} · {p.facilityLabel} {String(idx + 1).padStart(2, "0")}
                      </p>
                      <h3 className="text-sm font-bold text-white leading-snug mb-1.5 line-clamp-2">
                        {fac.name}
                      </h3>
                      <p className="text-white/70 text-xs leading-relaxed line-clamp-3 flex-1">
                        {fac.description || p.defaultFacilityDesc}
                      </p>
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/80 pt-3 mt-2 border-t border-white/15 group-hover:text-white min-h-[44px]">
                        {photos > 1 ? p.viewFacilityGallery : p.viewFacilityDetails}
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </button>
                );
              };

              const goPrevFacilitySlide = () =>
                setActiveFacilityIdx((prev) => (prev > 0 ? prev - 1 : facilities.length - 1));
              const goNextFacilitySlide = () =>
                setActiveFacilityIdx((prev) => (prev < facilities.length - 1 ? prev + 1 : 0));

              return (
                <div className="max-w-6xl mx-auto">
                  <div className="md:hidden">
                    {facilities.length > 1 ? (
                      <>
                        <div
                          className="overflow-hidden rounded-xl"
                          onTouchStart={(e) => {
                            facilitySlideTouchStart.current = e.touches[0]?.clientX ?? null;
                          }}
                          onTouchEnd={(e) => {
                            const start = facilitySlideTouchStart.current;
                            facilitySlideTouchStart.current = null;
                            if (start == null) return;
                            const end = e.changedTouches[0]?.clientX ?? start;
                            const dx = end - start;
                            if (Math.abs(dx) < 40) return;
                            if (dx < 0) goNextFacilitySlide();
                            else goPrevFacilitySlide();
                          }}
                        >
                          <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{ transform: `translateX(-${activeFacilityIdx * 100}%)` }}
                          >
                            {facilities.map((fac, idx) => (
                              <div key={fac.id || idx} className="w-full shrink-0 px-0.5">
                                {renderFacilityCard(fac, idx)}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-3">
                          <button
                            type="button"
                            onClick={goPrevFacilitySlide}
                            aria-label={p.prevFacility}
                            className="min-h-[40px] min-w-[40px] rounded-lg border border-white/25 bg-white/10 text-white flex items-center justify-center active:scale-95 touch-manipulation"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <div
                            className="flex flex-wrap items-center justify-center gap-1.5 max-w-[12rem]"
                            role="tablist"
                            aria-label={p.facilitiesTitle}
                          >
                            {facilities.map((fac, idx) => (
                              <button
                                key={fac.id || idx}
                                type="button"
                                role="tab"
                                aria-selected={activeFacilityIdx === idx}
                                aria-label={`${p.facilityLabel} ${idx + 1}: ${fac.name}`}
                                onClick={() => setActiveFacilityIdx(idx)}
                                className={`h-2 rounded-full transition-all touch-manipulation ${
                                  activeFacilityIdx === idx
                                    ? "w-6 bg-emerald-400"
                                    : "w-2 bg-white/35 hover:bg-white/55"
                                }`}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={goNextFacilitySlide}
                            aria-label={p.nextFacility}
                            className="min-h-[40px] min-w-[40px] rounded-lg border border-white/25 bg-white/10 text-white flex items-center justify-center active:scale-95 touch-manipulation"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-white/45 font-medium text-center pt-1">
                          {p.facilitiesSlideHint}
                        </p>
                      </>
                    ) : (
                      renderFacilityCard(facilities[0], 0)
                    )}
                  </div>

                  <div className="hidden md:block space-y-6 max-w-5xl mx-auto">
                  <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_12px_40px_-8px_rgba(0,0,0,0.45)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all duration-300 relative">
                    <div
                      className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent z-20 pointer-events-none"
                      aria-hidden
                    />

                    <div className="lg:col-span-5 relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[240px] sm:max-h-[280px] lg:max-h-none lg:aspect-auto lg:h-auto lg:min-h-[320px] bg-slate-900/50 overflow-hidden group">
                      <img
                        key={activeFac.id || activeFacilityIdx}
                        src={mainImage}
                        alt={activeFac.name}
                        className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-105 animate-in fade-in"
                      />
                      <div
                        className="absolute inset-0 pointer-events-none hidden lg:block"
                        style={{
                          background: `linear-gradient(135deg, ${tenantConfig.primaryColor}99 0%, rgba(15, 23, 42, 0.55) 50%, rgba(0, 0, 0, 0.65) 100%)`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none lg:hidden" />

                      <div className="absolute top-2.5 left-2.5 z-10 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white bg-white/15 backdrop-blur-md border border-white/25">
                        <FacilityIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{p.publicFacility}</span>
                      </div>

                      {photoCount > 0 && (
                        <div className="absolute top-2.5 right-2.5 z-10 hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-white/15 backdrop-blur-md border border-white/25">
                          <ImageIcon className="w-3 h-3" />
                          <span>{photoCount} {photoCount === 1 ? p.photo : p.photos}</span>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-7 p-4 sm:p-6 lg:p-7 flex flex-col justify-between text-white relative">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white bg-white/15 border border-white/25 md:hidden">
                            <FacilityIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{p.publicFacility}</span>
                          </span>
                          {photoCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-white/15 border border-white/25 md:hidden">
                              <ImageIcon className="w-3 h-3" />
                              <span>{photoCount} {photoCount === 1 ? p.photo : p.photos}</span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 border border-emerald-300/40 text-[9px] font-black uppercase tracking-wider md:hidden">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            {p.publicService}
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/70 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20 hidden md:inline-flex">
                            {p.facilityLabel} {String(activeFacilityIdx + 1).padStart(2, "0")} / {String(facilities.length).padStart(2, "0")}
                          </span>
                          <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider hidden lg:inline ml-auto">
                            {p.publicInfrastructure}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg md:text-xl font-black leading-snug tracking-tight line-clamp-3 md:line-clamp-2">
                          {activeFac.name}
                        </h3>

                        <p className="text-sm text-white/80 leading-relaxed line-clamp-4 md:line-clamp-3">
                          {activeFac.description || p.defaultFacilityDesc}
                        </p>

                        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 pt-1">
                          <div className="rounded-lg p-2.5 border border-white/15 bg-white/10 backdrop-blur-sm">
                            <span className="text-[9px] font-black uppercase tracking-wider text-white/60 block mb-0.5">
                              {p.jurisdiction}
                            </span>
                            <span className="text-xs font-bold text-white truncate block">
                              {p.barangayWord} {tenantConfig.shortName || "Iba O' Este"}
                            </span>
                          </div>
                          <div className="rounded-lg p-2.5 border border-white/15 bg-white/10 backdrop-blur-sm">
                            <span className="text-[9px] font-black uppercase tracking-wider text-white/60 block mb-0.5">
                              {p.accessUsage}
                            </span>
                            <span className="text-xs font-bold text-white truncate block">
                              {p.constituentAccess}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-3 md:mt-4 border-t border-white/15">
                        <button
                          type="button"
                          onClick={() => {
                            setFacilityImageIndex(0);
                            setSelectedFacility(activeFac);
                          }}
                          className="w-full min-h-[44px] py-3 md:py-2.5 px-4 rounded-lg text-sm md:text-xs font-bold text-white border border-white/30 bg-white/15 backdrop-blur-sm hover:bg-white/25 hover:border-white/45 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] touch-manipulation"
                          style={{
                            boxShadow: `0 4px 20px -4px ${tenantConfig.primaryColor}80`,
                          }}
                        >
                          {photoCount > 1 ? p.viewFacilityGallery : p.viewFacilityDetails}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {facilities.length > 1 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between px-0.5 gap-2">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="truncate">{p.selectFacility}</span>
                        </h4>
                        <span className="text-[10px] text-white/50 font-bold shrink-0 tabular-nums">
                          {facilities.length} {p.facilitiesCount}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 lg:grid-cols-6 gap-2.5">
                        {facilities.map((fac, idx) => {
                          const isActive = activeFacilityIdx === idx;
                          const FacIcon = fac.icon || Building2;
                          const thumbImg =
                            fac.images?.[0] ||
                            "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=400";
                          return (
                            <button
                              key={fac.id || idx}
                              type="button"
                              onClick={() => setActiveFacilityIdx(idx)}
                              aria-current={isActive ? "true" : undefined}
                              className={`group text-left p-2.5 rounded-xl transition-all duration-200 flex flex-col border cursor-pointer backdrop-blur-md w-full ${
                                isActive
                                  ? "bg-white/20 border-white/40 ring-1 ring-white/30 shadow-md"
                                  : "bg-white/10 border-white/15 hover:bg-white/15 hover:border-white/25"
                              }`}
                            >
                              <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-black/30 mb-2">
                                <img src={thumbImg} alt="" aria-hidden className="w-full h-full object-cover" />
                                {isActive && (
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                                  </div>
                                )}
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-white/70">
                                  <FacIcon className="w-2.5 h-2.5 flex-shrink-0" />
                                  <span className="truncate">{p.publicFacility}</span>
                                </div>
                                <h5
                                  className={`text-xs font-bold line-clamp-2 leading-tight ${isActive ? "text-white" : "text-white/85"}`}
                                >
                                  {fac.name}
                                </h5>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              );
            })()}
              </div>
            )}

            {!isFeatureLocked("achievements") && (
              <div
                id="achievements"
                className={
                  !isFeatureLocked("programs") || !isFeatureLocked("facilities")
                    ? "pt-10 md:pt-12 border-t border-white/15"
                    : undefined
                }
              >
                <div className="mb-6 md:mb-10 flex flex-col gap-4 md:gap-0 max-w-3xl">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-[0.14em] md:tracking-[0.18em] border border-white/30 bg-white/15 text-white backdrop-blur-md mb-3 md:mb-4">
                      <Award className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                      {p.achievementsBadge}
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-4xl font-black text-white tracking-tight leading-[1.15]">
                      {p.achievementsTitle}
                      {p.achievementsTitleAccent ? (
                        <>
                          {" "}
                          <span
                            className="text-transparent bg-clip-text"
                            style={{
                              backgroundImage: `linear-gradient(to right, #ffffff, ${tenantConfig.accentColor})`,
                            }}
                          >
                            {p.achievementsTitleAccent}
                          </span>
                        </>
                      ) : null}
                    </h2>
                    <p className="text-white/80 text-sm md:text-base mt-2 leading-relaxed font-medium max-w-2xl line-clamp-3 md:line-clamp-none">
                      {p.achievementsSubtitle}
                    </p>
                  </div>

                  {portalDataLoaded && achievements.length > 1 && (
                    <div className="flex items-center justify-between gap-3 w-full md:w-auto md:justify-end shrink-0">
                      <span className="text-xs font-mono font-bold text-white/70 tabular-nums">
                        {String(activeAchievementIdx + 1).padStart(2, "0")} /{" "}
                        {String(achievements.length).padStart(2, "0")}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveAchievementIdx((prev) =>
                              prev > 0 ? prev - 1 : achievements.length - 1,
                            )
                          }
                          aria-label={p.prevAchievement}
                          className="min-h-[44px] min-w-[44px] rounded-xl border border-white/25 bg-white/10 backdrop-blur-md text-white flex items-center justify-center active:scale-95 touch-manipulation md:min-h-[36px] md:min-w-[36px] md:rounded-lg"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveAchievementIdx((prev) =>
                              prev < achievements.length - 1 ? prev + 1 : 0,
                            )
                          }
                          aria-label={p.nextAchievement}
                          className="min-h-[44px] min-w-[44px] rounded-xl border border-white/25 bg-white/10 backdrop-blur-md text-white flex items-center justify-center active:scale-95 touch-manipulation md:min-h-[36px] md:min-w-[36px] md:rounded-lg"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="max-w-6xl mx-auto">
                  {!portalDataLoaded && (
                    <>
                      <div className="md:hidden rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-xl">
                        <div className="skeleton w-full aspect-[16/9] opacity-40" />
                        <div className="p-4 space-y-2">
                          <div className="skeleton h-2.5 w-1/4 rounded opacity-40" />
                          <div className="skeleton h-4 w-3/4 rounded opacity-40" />
                        </div>
                      </div>
                      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-xl"
                          >
                            <div className="skeleton w-full aspect-[16/9] opacity-40" />
                            <div className="p-4 space-y-2">
                              <div className="skeleton h-2.5 w-1/4 rounded opacity-40" />
                              <div className="skeleton h-4 w-3/4 rounded opacity-40" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {portalDataLoaded && achievements.length === 0 && (
                    <div className="text-center py-10 rounded-2xl border border-dashed border-white/30 bg-white/10 backdrop-blur-xl">
                      <Award className="w-10 h-10 text-white/50 mx-auto mb-3" />
                      <p className="text-white/70 text-sm">{p.achievementsEmpty}</p>
                    </div>
                  )}
                  {portalDataLoaded &&
                    achievements.length > 0 &&
                    (() => {
                      const renderAchievementCard = (achievement, idx) => (
                        <button
                          key={achievement.id || idx}
                          type="button"
                          onClick={() => {
                            setActiveAchievementIdx(idx);
                            setSelectedAchievement(achievement);
                          }}
                          className="group text-left flex flex-col rounded-xl md:rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_24px_-6px_rgba(0,0,0,0.35)] hover:bg-white/[0.16] hover:border-white/35 transition-all duration-300 w-full touch-manipulation"
                        >
                          <div className="relative aspect-[16/9] overflow-hidden bg-black/30">
                            <img
                              loading="lazy"
                              src={
                                achievement.image ||
                                "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800"
                              }
                              alt={achievement.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:from-black/70" />
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-white/15 backdrop-blur-md border border-white/25">
                              <Award className="w-3 h-3" />
                              {achievement.year}
                            </div>
                          </div>
                          <div className="flex flex-col flex-1 p-4">
                            <p className="text-[9px] font-black uppercase tracking-wider text-white/60 mb-1">
                              {achievement.category || p.award}
                            </p>
                            <h3 className="text-sm font-bold text-white leading-snug mb-1.5 line-clamp-2">
                              {achievement.title}
                            </h3>
                            {achievement.description && (
                              <p className="text-white/70 text-xs leading-relaxed line-clamp-3 md:line-clamp-2 flex-1">
                                {achievement.description}
                              </p>
                            )}
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/80 pt-3 mt-2 border-t border-white/15 group-hover:text-white min-h-[44px] md:min-h-0">
                              {p.viewDetails}
                              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </div>
                        </button>
                      );

                      const goPrevAchievement = () =>
                        setActiveAchievementIdx((prev) =>
                          prev > 0 ? prev - 1 : achievements.length - 1,
                        );
                      const goNextAchievement = () =>
                        setActiveAchievementIdx((prev) =>
                          prev < achievements.length - 1 ? prev + 1 : 0,
                        );

                      return (
                        <>
                          {achievements.length > 1 && (
                            <div
                              className="md:hidden overflow-hidden rounded-xl"
                              onTouchStart={(e) => {
                                achievementSlideTouchStart.current =
                                  e.touches[0]?.clientX ?? null;
                              }}
                              onTouchEnd={(e) => {
                                const start = achievementSlideTouchStart.current;
                                achievementSlideTouchStart.current = null;
                                if (start == null) return;
                                const end = e.changedTouches[0]?.clientX ?? start;
                                const dx = end - start;
                                if (Math.abs(dx) < 40) return;
                                if (dx < 0) goNextAchievement();
                                else goPrevAchievement();
                              }}
                            >
                              <div
                                className="flex transition-transform duration-300 ease-out"
                                style={{
                                  transform: `translateX(-${activeAchievementIdx * 100}%)`,
                                }}
                              >
                                {achievements.map((achievement, idx) => (
                                  <div key={achievement.id || idx} className="w-full shrink-0 px-0.5">
                                    {renderAchievementCard(achievement, idx)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {achievements.length === 1 && (
                            <div className="md:hidden">{renderAchievementCard(achievements[0], 0)}</div>
                          )}

                          {achievements.length > 1 && (
                            <div className="md:hidden flex items-center justify-center gap-3 pt-3">
                              <button
                                type="button"
                                onClick={goPrevAchievement}
                                aria-label={p.prevAchievement}
                                className="min-h-[40px] min-w-[40px] rounded-lg border border-white/25 bg-white/10 text-white flex items-center justify-center active:scale-95 touch-manipulation"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              <div
                                className="flex flex-wrap items-center justify-center gap-1.5 max-w-[12rem]"
                                role="tablist"
                                aria-label={p.achievementsTitle}
                              >
                                {achievements.map((achievement, idx) => (
                                  <button
                                    key={achievement.id || idx}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeAchievementIdx === idx}
                                    aria-label={`${p.award} ${idx + 1}: ${achievement.title}`}
                                    onClick={() => setActiveAchievementIdx(idx)}
                                    className={`h-2 rounded-full transition-all touch-manipulation ${
                                      activeAchievementIdx === idx
                                        ? "w-6 bg-emerald-400"
                                        : "w-2 bg-white/35 hover:bg-white/55"
                                    }`}
                                  />
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={goNextAchievement}
                                aria-label={p.nextAchievement}
                                className="min-h-[40px] min-w-[40px] rounded-lg border border-white/25 bg-white/10 text-white flex items-center justify-center active:scale-95 touch-manipulation"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </div>
                          )}

                          {achievements.length > 1 && (
                            <p className="text-[10px] text-white/45 font-medium text-center md:hidden pt-1">
                              {p.achievementsSlideHint}
                            </p>
                          )}

                          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                            {achievements.map((achievement, idx) =>
                              renderAchievementCard(achievement, idx),
                            )}
                          </div>
                        </>
                      );
                    })()}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tourism and Lifestyle Section — Government Directory */}
      {tourismDestinations.length > 0 && (
      <section id="tourism" className="bg-white border-t border-gray-100 scroll-mt-[3.5rem] md:scroll-mt-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-10 md:py-16">
          <div className="mb-6 md:mb-8 flex flex-col gap-4">
            <div>
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-1 h-8 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: tenantConfig.primaryColor }}
                />
                <div className="min-w-0">
                  <p
                    className="text-[10px] md:text-xs font-bold uppercase tracking-widest line-clamp-2"
                    style={{ color: tenantConfig.primaryColor }}
                  >
                    {p.tourismBadge}
                  </p>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight mt-1">
                    {p.tourismTitle}
                  </h2>
                </div>
              </div>
              <p className="text-gray-500 text-sm md:text-base max-w-2xl leading-relaxed pl-4 border-l-2 border-gray-200 line-clamp-4 md:line-clamp-none">
                {p.tourismSubtitle}
              </p>
            </div>

            {tourismDestinations.length > 1 && (
              <div className="flex items-center justify-between gap-3 md:hidden">
                <span className="text-xs font-mono font-bold text-gray-500 tabular-nums">
                  {String(activeTourismIdx + 1).padStart(2, "0")} /{" "}
                  {String(tourismDestinations.length).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTourismIdx((prev) =>
                        prev > 0 ? prev - 1 : tourismDestinations.length - 1,
                      )
                    }
                    aria-label={p.prevTourism}
                    className="min-h-[44px] min-w-[44px] rounded-xl border border-gray-200 bg-gray-50 text-gray-800 flex items-center justify-center active:scale-95 touch-manipulation"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTourismIdx((prev) =>
                        prev < tourismDestinations.length - 1 ? prev + 1 : 0,
                      )
                    }
                    aria-label={p.nextTourism}
                    className="min-h-[44px] min-w-[44px] rounded-xl border border-gray-200 bg-gray-50 text-gray-800 flex items-center justify-center active:scale-95 touch-manipulation"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {(() => {
            const renderTourismCard = (destination, idx) => (
              <div
                key={destination.id || idx}
                className="group flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-all duration-200 w-full"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <a
                    href={destination.directions}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-3 right-3 min-h-[44px] min-w-[44px] rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all touch-manipulation"
                    aria-label={`${p.getDirections}: ${destination.name}`}
                  >
                    <Navigation className="w-4 h-4" style={{ color: tenantConfig.primaryColor }} />
                  </a>
                </div>
                <div className="flex flex-col flex-1 p-4 md:p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug line-clamp-2">
                    {destination.name}
                  </h3>
                  {destination.description && (
                    <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-3 md:line-clamp-2 flex-1">
                      {destination.description}
                    </p>
                  )}
                  {destination.hasCoords && (
                    <p className="text-xs text-gray-400 mb-3 font-mono hidden sm:block">
                      {destination.latitude.toFixed(6)}, {destination.longitude.toFixed(6)}
                    </p>
                  )}
                  <a
                    href={destination.directions}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider pt-3 border-t border-gray-100 min-h-[44px] touch-manipulation"
                    style={{ color: tenantConfig.primaryColor }}
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {destination.hasCoords ? p.viewOnMaps : p.getDirections}
                  </a>
                </div>
              </div>
            );

            const goPrevTourism = () =>
              setActiveTourismIdx((prev) =>
                prev > 0 ? prev - 1 : tourismDestinations.length - 1,
              );
            const goNextTourism = () =>
              setActiveTourismIdx((prev) =>
                prev < tourismDestinations.length - 1 ? prev + 1 : 0,
              );

            return (
              <>
                {tourismDestinations.length > 1 && (
                  <div
                    className="md:hidden overflow-hidden"
                    onTouchStart={(e) => {
                      tourismSlideTouchStart.current = e.touches[0]?.clientX ?? null;
                    }}
                    onTouchEnd={(e) => {
                      const start = tourismSlideTouchStart.current;
                      tourismSlideTouchStart.current = null;
                      if (start == null) return;
                      const end = e.changedTouches[0]?.clientX ?? start;
                      const dx = end - start;
                      if (Math.abs(dx) < 40) return;
                      if (dx < 0) goNextTourism();
                      else goPrevTourism();
                    }}
                  >
                    <div
                      className="flex transition-transform duration-300 ease-out"
                      style={{ transform: `translateX(-${activeTourismIdx * 100}%)` }}
                    >
                      {tourismDestinations.map((destination, idx) => (
                        <div key={destination.id || idx} className="w-full shrink-0 px-0.5">
                          {renderTourismCard(destination, idx)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tourismDestinations.length === 1 && (
                  <div className="md:hidden">{renderTourismCard(tourismDestinations[0], 0)}</div>
                )}

                {tourismDestinations.length > 1 && (
                  <div className="md:hidden flex items-center justify-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={goPrevTourism}
                      aria-label={p.prevTourism}
                      className="min-h-[40px] min-w-[40px] rounded-lg border border-gray-200 bg-gray-50 text-gray-800 flex items-center justify-center active:scale-95 touch-manipulation"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div
                      className="flex flex-wrap items-center justify-center gap-1.5 max-w-[12rem]"
                      role="tablist"
                      aria-label={p.tourismTitle}
                    >
                      {tourismDestinations.map((destination, idx) => (
                        <button
                          key={destination.id || idx}
                          type="button"
                          role="tab"
                          aria-selected={activeTourismIdx === idx}
                          aria-label={`${idx + 1}: ${destination.name}`}
                          onClick={() => setActiveTourismIdx(idx)}
                          className={`h-2 rounded-full transition-all touch-manipulation ${
                            activeTourismIdx === idx
                              ? "w-6 bg-emerald-500"
                              : "w-2 bg-gray-300 hover:bg-gray-400"
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={goNextTourism}
                      aria-label={p.nextTourism}
                      className="min-h-[40px] min-w-[40px] rounded-lg border border-gray-200 bg-gray-50 text-gray-800 flex items-center justify-center active:scale-95 touch-manipulation"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {tourismDestinations.length > 1 && (
                  <p className="text-[10px] text-gray-400 font-medium text-center md:hidden pt-1">
                    {p.tourismSlideHint}
                  </p>
                )}

                <div className="hidden md:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {tourismDestinations.map((destination, idx) => renderTourismCard(destination, idx))}
                </div>
              </>
            );
          })()}
        </div>
      </section>
      )}

      {/* Achievement Modal — portaled, centered on all viewports */}
      {achievementModalMounted &&
        selectedAchievement &&
        createPortal(
          (() => {
          const foundAchievementIdx = achievements.findIndex(
            (a) =>
              (a.id != null && a.id === selectedAchievement.id) ||
              a.title === selectedAchievement.title,
          );
          const modalIndex =
            foundAchievementIdx >= 0 ? foundAchievementIdx : activeAchievementIdx;
          const modalAchievement = achievements[modalIndex] || selectedAchievement;
          const hasMultipleAchievements = achievements.length > 1;

          const goModalAchievement = (nextIdx) => {
            const idx =
              ((nextIdx % achievements.length) + achievements.length) % achievements.length;
            setActiveAchievementIdx(idx);
            setSelectedAchievement(achievements[idx]);
          };

          return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
              <button
                type="button"
                className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-default"
                aria-label={p.close}
                onClick={() => setSelectedAchievement(null)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="achievement-modal-title"
                className="relative z-[201] flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl h-auto max-h-[min(calc(100vh-2rem),720px)]"
                style={{
                  maxHeight:
                    "min(720px, calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2rem))",
                }}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => {
                  if (!hasMultipleAchievements) return;
                  achievementSlideTouchStart.current = e.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(e) => {
                  if (!hasMultipleAchievements) return;
                  const start = achievementSlideTouchStart.current;
                  achievementSlideTouchStart.current = null;
                  if (start == null) return;
                  const end = e.changedTouches[0]?.clientX ?? start;
                  const dx = end - start;
                  if (Math.abs(dx) < 50) return;
                  if (dx < 0) goModalAchievement(modalIndex + 1);
                  else goModalAchievement(modalIndex - 1);
                }}
              >
                <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5 sm:py-4 border-b border-gray-100 bg-white shrink-0">
                  <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${tenantConfig.primaryColor}12` }}
                    >
                      <Award className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: tenantConfig.primaryColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1 leading-snug"
                        style={{ color: tenantConfig.primaryColor }}
                      >
                        {modalAchievement.year} · {modalAchievement.category || p.award}
                      </p>
                      <h3
                        id="achievement-modal-title"
                        className="text-base sm:text-lg font-bold text-gray-900 leading-snug break-words"
                      >
                        {modalAchievement.title}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAchievement(null)}
                    aria-label={p.close}
                    className="min-h-[44px] min-w-[44px] bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 rounded-xl flex items-center justify-center transition-colors border border-gray-200 shrink-0 touch-manipulation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto overscroll-contain max-h-[min(50vh,360px)] sm:max-h-[420px]">
                  <div className="relative w-full aspect-[16/10] max-h-[36vh] sm:max-h-[240px] overflow-hidden bg-gray-100 shrink-0">
                    <img
                      loading="lazy"
                      src={
                        modalAchievement.image ||
                        "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1200"
                      }
                      alt={modalAchievement.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="px-4 py-4 sm:p-6 md:p-8">
                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                      {modalAchievement.description}
                    </p>
                  </div>
                </div>

                {hasMultipleAchievements && (
                  <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-gray-100 bg-white shrink-0 sm:hidden">
                    <button
                      type="button"
                      onClick={() => goModalAchievement(modalIndex - 1)}
                      aria-label={p.prevAchievement}
                      className="min-h-[44px] min-w-[44px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center touch-manipulation"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-800" />
                    </button>
                    <span className="text-xs font-mono font-bold text-gray-500 tabular-nums">
                      {String(modalIndex + 1).padStart(2, "0")} /{" "}
                      {String(achievements.length).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      onClick={() => goModalAchievement(modalIndex + 1)}
                      aria-label={p.nextAchievement}
                      className="min-h-[44px] min-w-[44px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center touch-manipulation"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-800" />
                    </button>
                  </div>
                )}

                <div className="px-4 py-3 sm:px-5 sm:py-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4">
                  <button
                    type="button"
                    onClick={() => setSelectedAchievement(null)}
                    className="w-full sm:w-auto min-h-[48px] px-5 py-3 sm:py-2.5 text-white rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 touch-manipulation"
                    style={{ backgroundColor: tenantConfig.primaryColor }}
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    {p.backToAwards}
                  </button>
                  <div className="flex items-center justify-center gap-2 py-1 sm:py-0">
                    <Shield className="w-4 h-4 shrink-0" style={{ color: tenantConfig.primaryColor }} />
                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                      {p.officialRecord}
                    </span>
                  </div>
                  {hasMultipleAchievements && (
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => goModalAchievement(modalIndex - 1)}
                        aria-label={p.prevAchievement}
                        className="min-h-[40px] min-w-[40px] rounded-lg border border-gray-200 bg-white flex items-center justify-center"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-xs font-mono font-bold text-gray-500 tabular-nums min-w-[3.5rem] text-center">
                        {String(modalIndex + 1).padStart(2, "0")} /{" "}
                        {String(achievements.length).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={() => goModalAchievement(modalIndex + 1)}
                        aria-label={p.nextAchievement}
                        className="min-h-[40px] min-w-[40px] rounded-lg border border-gray-200 bg-white flex items-center justify-center"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })(),
          document.body,
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
          {/* Leadership group photo */}
          <div className="relative">
            <img
              loading="eager"
              decoding="async"
              fetchpriority="high"
              src={heroSettings?.image || ""}
              alt={heroSettings?.title || "Barangay Officials"}
              className="w-full h-auto md:h-[320px] lg:h-[400px] xl:h-[480px] md:object-cover object-center bg-gray-800"
              onError={(e) => {
                e.target.src = "";
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none z-10 hidden md:block"
              style={{
                boxShadow: `inset 0 0 150px 60px ${tenantId === "demo" ? "#000000" : "#112e1f"}`,
              }}
            />
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
                    {p.leadershipTeam}
                  </span>
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: tenantConfig.accentColor }}
                  ></div>
                </div>

                <h4 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-3 leading-none uppercase tracking-tight">
                  {tenantConfig.name}
                  <span
                    className="block text-transparent bg-clip-text"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${tenantConfig.accentColor}, #ebd78c, ${tenantConfig.accentColor})`,
                    }}
                  >
                    {p.leadershipTeam}
                  </span>
                </h4>

                <div
                  className="w-24 h-1 mx-auto mb-3 rounded-full"
                  style={{
                    backgroundImage: `linear-gradient(to right, transparent, ${tenantConfig.accentColor}, transparent)`,
                  }}
                ></div>

                <p className="text-lg md:text-xl text-white/90 font-light leading-relaxed max-w-2xl mx-auto">
                  {p.officialsHeroTagline}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 py-10 md:py-24 px-4 sm:px-6 lg:px-12 scroll-mt-[3.5rem] md:scroll-mt-0">
            <div className="max-w-[1400px] mx-auto text-center">
              {/* Section Header */}
              <div className="mb-8 md:mb-12">
                <div className="h-1 w-12 bg-gray-900 mb-6 md:mb-8 mx-auto rounded-full"></div>
                <h5 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 mb-3 md:mb-5 tracking-tight leading-tight uppercase">
                  {p.meetCouncil}{" "}
                  <span
                    className="text-transparent bg-clip-text"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${tenantId === "demo" ? "#111" : "#064e3b"}, ${tenantConfig.accentColor})`,
                    }}
                  >
                    {p.council}
                  </span>
                </h5>
                <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-black max-w-2xl mx-auto uppercase tracking-[0.2em] md:tracking-[0.3em] leading-relaxed px-2">
                  {p.councilTagline.replace("{shortName}", tenantConfig.shortName)}
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
                          {(section.key === "staff" ||
                            section.key === "kagawad" ||
                            section.key === "sk_kagawad") && (
                            <div className="text-center mb-5 md:mb-6">
                              <div
                                className={`inline-flex items-center gap-2 md:gap-3 px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r ${section.bgColor} text-white rounded-full mb-2 md:mb-4 shadow-lg max-w-full`}
                              >
                                <span className="text-lg md:text-2xl shrink-0">{section.icon}</span>
                                <span className="font-bold text-xs sm:text-sm md:text-lg tracking-wide truncate">
                                  {section.title.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm md:text-lg font-medium px-2 leading-snug">
                                {section.subtitle}
                              </p>
                            </div>
                          )}

                          {/* Officials Layout Wrapper */}
                          <div
                            className={
                              section.key === "captain" ||
                              section.key === "sk_chairman"
                                ? "max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-8 px-2 sm:px-4 mb-10"
                                : section.key === "kagawad" ||
                                    section.key === "sk_kagawad" ||
                                    section.key === "staff"
                                  ? "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:flex lg:flex-wrap lg:gap-5 justify-center w-full"
                                  : "grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4 lg:gap-5 justify-center"
                            }
                          >
                            {section.key === "captain" ? (
                              <>
                                {/* Left Aligned Captain Card */}
                                <div className="w-full lg:w-[320px] flex-shrink-0 mx-auto">
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
                                        className={`bg-white rounded-2xl shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 group w-full transform hover:-translate-y-2 ${tenantId === "demo" ? "hover:shadow-black/20" : "hover:shadow-green-900/20"}`}
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
                                            className="absolute inset-x-0 bottom-0 bg-gradient-to-t flex flex-col justify-end p-6 text-center z-20 h-1/2"
                                            style={{
                                              backgroundImage: `linear-gradient(to top, ${tenantId === "demo" ? "#000000" : "#112e1f"}, ${tenantId === "demo" ? "rgba(0,0,0,0.4)" : "rgba(17,46,31,0.4)"}, transparent)`,
                                            }}
                                          >
                                            <h3 className="text-white font-black text-xl mb-1 drop-shadow-lg tracking-tight">
                                              Punong Barangay
                                            </h3>
                                          </div>
                                        </div>
                                        <div className="p-6 text-center bg-white">
                                          <h4 className="text-xl font-black text-gray-900 mb-2 tracking-tight">
                                            {official.name}
                                          </h4>
                                          <p className="text-gray-600 text-sm font-medium leading-relaxed italic line-clamp-3">
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
                                  <div className="px-4 py-6">
                                    <div className="mb-6">
                                      <h3 className="text-2xl font-black text-gray-900 tracking-widest uppercase mb-3">
                                        Barangay Vision
                                      </h3>
                                      <p
                                        className="text-gray-700 text-lg font-medium leading-relaxed italic border-l-4 pl-6 py-2"
                                        style={{
                                          borderColor: tenantConfig.accentColor,
                                        }}
                                      >
                                        {`"A model community that is progressive, peaceful, and disaster-resilient, where empowered citizens live in harmony with nature and participate in transparent local governance."`}
                                      </p>
                                    </div>
                                    <div>
                                      <h3 className="text-2xl font-black text-gray-900 tracking-widest uppercase mb-3">
                                        Barangay Goal
                                      </h3>
                                      <p
                                        className="text-gray-700 text-lg font-medium leading-relaxed border-l-4 pl-6 py-2"
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
                                  <div className="px-4 py-6">
                                    <div className="mb-6">
                                      <h3 className="text-2xl font-black text-gray-900 tracking-widest uppercase mb-3">
                                        SK Vision
                                      </h3>
                                      <p
                                        className="text-gray-700 text-lg font-medium leading-relaxed italic border-l-4 pl-6 py-2"
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
                                      <h3 className="text-2xl font-black text-gray-900 tracking-widest uppercase mb-3">
                                        SK Goal
                                      </h3>
                                      <p
                                        className="text-gray-700 text-lg font-medium leading-relaxed border-l-4 pl-6 py-2"
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
                                <div className="w-full lg:w-[320px] flex-shrink-0 order-1 lg:order-2">
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
                                        className={`bg-white rounded-2xl shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 group w-full transform hover:-translate-y-2 ${tenantId === "demo" ? "hover:shadow-black/20" : "hover:shadow-orange-900/20"}`}
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
                                            className="absolute inset-x-0 bottom-0 bg-gradient-to-t flex flex-col justify-end p-6 text-center z-20 h-1/2"
                                            style={{
                                              backgroundImage: `linear-gradient(to top, ${tenantId === "demo" ? "#000000" : "#831a1a"}, ${tenantId === "demo" ? "rgba(0,0,0,0.4)" : "rgba(131,26,26,0.4)"}, transparent)`,
                                            }}
                                          >
                                            <h3 className="text-white font-black text-xl mb-1 drop-shadow-lg tracking-tight">
                                              SK Chairman
                                            </h3>
                                          </div>
                                        </div>
                                        <div className="p-6 text-center bg-white">
                                          <h4 className="text-xl font-black text-gray-900 mb-2 tracking-tight">
                                            {official.name}
                                          </h4>
                                          <p className="text-gray-600 text-sm font-medium leading-relaxed italic line-clamp-3">
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
                                  section.key === "kagawad" ||
                                  section.key === "sk_kagawad" ||
                                  section.key === "staff"
                                    ? "w-full lg:w-[calc(20%-1rem)]"
                                    : "w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)] lg:w-[calc(20%-1rem)]";
                                const roleLabel = (() => {
                                  const pos = official.position || "";
                                  if (pos.includes("SK Kagawad")) return "SK Kagawad";
                                  if (pos.includes("Kagawad")) return "Brgy. Kagawad";
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
                                  if (pos === "Barangay Keeper") return "Brgy. Record Keeper";
                                  if (
                                    ["Assistant Secretary", "Assistant Administrator"].includes(
                                      pos,
                                    )
                                  )
                                    return pos.replace("Assistant", "Asst. Brgy.");
                                  return pos;
                                })();
                                return (
                                  <div
                                    key={official.id || index}
                                    className={`bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group ${widthClass}`}
                                  >
                                    <div className="relative aspect-[3/4] sm:aspect-square overflow-hidden bg-white">
                                      {official.image_url ? (
                                        <img
                                          loading="lazy"
                                          src={official.image_url}
                                          alt={official.name}
                                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 relative z-10"
                                        />
                                      ) : (
                                        <div
                                          className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}
                                        >
                                          <span className="text-4xl sm:text-5xl font-bold text-white tracking-widest opacity-30 group-hover:opacity-50 transition-opacity">
                                            {initials}
                                          </span>
                                        </div>
                                      )}
                                      <div
                                        className="absolute inset-0 bg-gradient-to-t flex flex-col justify-end p-2 sm:p-6 text-center z-20"
                                        style={{
                                          backgroundImage: `linear-gradient(to top, ${tenantId === "demo" ? "#000000E6" : "#112e1fE6"}, ${tenantId === "demo" ? "#00000066" : "#112e1f66"}, transparent)`,
                                        }}
                                      >
                                        <h3 className="text-white font-bold text-[10px] sm:text-xl mb-0.5 drop-shadow-lg leading-tight">
                                          {roleLabel}
                                        </h3>
                                        {official.committee && (
                                          <p
                                            className={`text-[9px] sm:text-sm font-medium drop-shadow-md line-clamp-2 leading-tight ${tenantId === "demo" ? "text-gray-300" : "text-green-300"}`}
                                          >
                                            {official.committee}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="p-2.5 sm:p-6 text-center">
                                      <h4 className="text-[11px] sm:text-lg font-black text-gray-900 mb-1 sm:mb-2 uppercase tracking-tight leading-snug">
                                        {official.name}
                                      </h4>
                                      {official.description && (
                                        <p className="text-gray-600 text-[10px] sm:text-sm leading-snug line-clamp-3 sm:line-clamp-none">
                                          {official.description}
                                        </p>
                                      )}
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
                <div className="space-y-8">
                  {/* Captain Skeleton */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                      <div className="skeleton w-full aspect-[4/5]" />
                      <div className="p-6 space-y-3">
                        <div className="skeleton h-5 w-2/3 rounded mx-auto" />
                        <div className="skeleton h-3 w-full rounded" />
                        <div className="skeleton h-3 w-4/5 rounded mx-auto" />
                      </div>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                      <div className="px-4 py-6 space-y-3">
                        <div className="skeleton h-5 w-1/3 rounded" />
                        <div className="skeleton h-3 w-full rounded" />
                        <div className="skeleton h-3 w-5/6 rounded" />
                      </div>
                      <div className="px-4 py-6 space-y-3">
                        <div className="skeleton h-5 w-1/3 rounded" />
                        <div className="skeleton h-3 w-full rounded" />
                        <div className="skeleton h-3 w-5/6 rounded" />
                      </div>
                    </div>
                  </div>
                  {/* Kagawad Skeletons */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 w-full">
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                        <div className="skeleton w-full aspect-[4/5]" />
                        <div className="p-3 space-y-2">
                          <div className="skeleton h-3 w-3/4 rounded mx-auto" />
                          <div className="skeleton h-2.5 w-1/2 rounded mx-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section
        id="contact"
        className="py-12 md:py-16 w-full border-t border-gray-200 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: "url(/images/community.jpg)" }}
          aria-hidden
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${tenantConfig.primaryColor}e6 0%, rgba(15, 23, 42, 0.88) 55%, rgba(0, 0, 0, 0.75) 100%)`,
          }}
          aria-hidden
        />

        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 relative z-10">
          {/* Section Header */}
          <div className="mb-8 md:mb-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] mb-4 border border-white/30 bg-white/15 text-white backdrop-blur-md">
              <Mail className="w-3.5 h-3.5" />
              {p.contactBadge}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              {p.contactTitle}{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: `linear-gradient(to right, #ffffff, ${tenantConfig.accentColor})`,
                }}
              >
                {p.contactTitleAccent}
              </span>
            </h2>
            <p className="text-white/80 text-sm md:text-base mt-2 leading-relaxed font-medium">
              {p.contactSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {/* Contact Form */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 md:p-6 shadow-lg border border-white/20 h-full">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {p.firstName}
                    </label>
                    <input
                      id="contact-firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm"
                      style={{ '--tw-ring-color': tenantConfig.primaryColor }}
                      placeholder="Juan"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {p.lastName}
                    </label>
                    <input
                      id="contact-lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm"
                      style={{ '--tw-ring-color': tenantConfig.primaryColor }}
                      placeholder="Dela Cruz"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {p.email}
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm"
                    style={{ '--tw-ring-color': tenantConfig.primaryColor }}
                    placeholder="juan@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {p.phone}
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm"
                    style={{ '--tw-ring-color': tenantConfig.primaryColor }}
                    placeholder="09XX XXX XXXX"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {p.message}
                  </label>
                  <textarea
                    id="contact-message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all resize-none text-sm"
                    style={{ '--tw-ring-color': tenantConfig.primaryColor }}
                    placeholder="Your message here..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 hover:opacity-90 shadow-sm text-sm"
                  style={{ backgroundColor: tenantConfig.primaryColor }}
                >
                  <Send className="w-4 h-4" />
                  {p.sendMessage}
                </button>
              </form>
            </div>

            {/* Contact Info & Office Hours */}
            <div className="space-y-6 h-full flex flex-col">
              {/* Contact Information */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex-1">
                <h3 className="text-base font-bold text-white mb-4">
                  {p.contactInfo}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${tenantConfig.primaryColor}30` }}
                    >
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white/90 text-sm font-medium">{p.address}</p>
                      <p className="text-white/60 text-sm leading-relaxed">
                        {tenantConfig.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${tenantConfig.primaryColor}30` }}
                    >
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white/90 text-sm font-medium">{p.phone}</p>
                      <p className="text-white/60 text-sm">
                        (044) 123-4567
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${tenantConfig.primaryColor}30` }}
                    >
                      <Mail className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white/90 text-sm font-medium">{p.email}</p>
                      <p className="text-white/60 text-sm">
                        {tenantId === "demo"
                          ? "contact@brgydesk.com"
                          : "ibaoeste@calumpit.gov.ph"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/60" />
                  {p.officeHours}
                </h3>
                <div className="space-y-1.5 text-sm text-white/60">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="text-white/80 font-medium">8:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="text-white/80 font-medium">8:00 AM - 12:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="text-white/50">Closed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Hotlines */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] h-full">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                {p.emergencyHotlines}
              </h3>
              <div className="space-y-3">
                {hotlines.map((hotline, index) => (
                  <div key={index} className="flex items-center gap-3 group">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${tenantConfig.primaryColor}30` }}
                    >
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white/90 text-sm font-medium">{hotline.name}</p>
                      <a
                        href={`tel:${hotline.number}`}
                        className="text-white/60 hover:text-white transition-colors text-sm font-bold"
                      >
                        {hotline.number}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 text-center">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">
                  {p.emergency247}
                </p>
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
            <div className="flex flex-col gap-3 max-md:items-start max-md:text-left">
              <div className="flex justify-start">
                <div className="flex items-center gap-3 max-md:w-full">
                  <img
                    loading="lazy"
                    src={tenantConfig.logo}
                    alt={`${tenantConfig.shortName} seal`}
                    className="h-14 w-14 object-contain opacity-80"
                  />
                  <div className="text-left">
                    <p className="text-white font-bold text-sm leading-tight">{tenantConfig.name}</p>
                    <p className="text-white/50 text-xs mt-0.5">{tenantConfig.subtitle}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/40 leading-relaxed text-left max-w-none md:max-w-xs">
                {p.footerBlurb}
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col items-start gap-2 text-left">
              <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wider">{p.footerServices}</h4>
              <a href="#forms" className="text-xs text-white/50 hover:text-white transition-colors">{p.footerFormsLink}</a>
              <a href="#citizen-help" className="text-xs text-white/50 hover:text-white transition-colors">{p.footerHelpLink}</a>
              <a href="#track" className="text-xs text-white/50 hover:text-white transition-colors">{p.footerTrackLink}</a>
              <a href="#directory" className="text-xs text-white/50 hover:text-white transition-colors">{p.footerFacilitiesLink}</a>
              <a href="#tourism" className="text-xs text-white/50 hover:text-white transition-colors">{p.footerTourismLink}</a>
              <a href="#officials" className="text-xs text-white/50 hover:text-white transition-colors">{p.footerOfficialsLink}</a>
              <a href="#contact" className="text-xs text-white/50 hover:text-white transition-colors">{p.footerContactLink}</a>
            </div>

            {/* Privacy & Compliance */}
            <div className="flex flex-col items-start gap-2 text-left">
              <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wider">{p.footerPrivacy}</h4>
              <p className="text-xs text-white/40 leading-relaxed">
                {p.footerPrivacyText}
              </p>
              <p className="text-xs text-white/40 leading-relaxed mt-1">
                © {new Date().getFullYear()} {tenantConfig.name}. {p.footerCopyright}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-start gap-3 pb-8 mb-2">
            <a
              href="#track"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold text-white border border-white/25 bg-white/10 hover:bg-white/15 transition-colors"
            >
              <Search className="w-4 h-4 shrink-0" />
              {p.trackRequest}
            </a>
            {!isInstalled && (
              <button
                type="button"
                onClick={promptInstall}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors border"
                style={{
                  color: tenantConfig.accentColor,
                  borderColor: `${tenantConfig.accentColor}50`,
                  backgroundColor: `${tenantConfig.accentColor}12`,
                }}
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                {p.installApp}
              </button>
            )}
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
            <p className="text-[10px] text-white/30 uppercase tracking-widest">
              {p.footerPhilippines}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-white/30">{p.footerLguService}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Assistance Widget — Government Style */}
      <div className="fixed bottom-[calc(4.875rem+env(safe-area-inset-bottom,0px)+0.5rem)] right-3 left-3 md:left-auto md:bottom-4 md:right-4 z-50 flex flex-col items-end gap-3 pointer-events-none [&>*]:pointer-events-auto">
        {/* Expanded Panel */}
        {showAssistance && !assistanceMode && (
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-[min(100%,18rem)] md:w-72 overflow-hidden animate-fade-in">
            {/* Panel Header */}
            <div
              className="px-4 py-3 border-b border-gray-100"
              style={{ backgroundColor: `${tenantConfig.primaryColor}08` }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: tenantConfig.primaryColor }}
              >
                {p.assistPanelTitle}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="p-3 space-y-2">
              <button
                onClick={() => openAssistance("kapchat")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${tenantConfig.primaryColor}12` }}
                >
                  <MessageCircle className="w-4 h-4" style={{ color: tenantConfig.primaryColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{p.kapchat}</p>
                  <p className="text-xs text-gray-500">{p.kapchatPanelBlurb}</p>
                </div>
              </button>

              <button
                onClick={() => openAssistance("assistance")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${tenantConfig.primaryColor}12` }}
                >
                  <Headphones className="w-4 h-4" style={{ color: tenantConfig.primaryColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">Brgy Assistance</p>
                  <p className="text-xs text-gray-500">Send an inquiry to the office</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowAssistance(false);
                  openESumbong();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-left"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-100"
                >
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">E-Sumbong</p>
                  <p className="text-xs text-gray-500">Barangay blotter / complaint report</p>
                </div>
              </button>
            </div>

            {/* Emergency Hotlines Divider */}
            <div className="px-3 pb-3">
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
                  Emergency Hotlines
                </p>
                <div className="space-y-1.5">
                  {hotlines.map((hotline, index) => (
                    <a
                      key={index}
                      href={`tel:${hotline.number}`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-xs font-medium text-gray-700">
                        {hotline.name}
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: tenantConfig.primaryColor }}
                      >
                        {hotline.number}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KapChat Panel — Modern Live Two-Way Chat Messenger */}
        {showAssistance && assistanceMode === "kapchat" && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[calc(100vw-32px)] sm:w-96 max-w-[420px] overflow-hidden animate-fade-in flex flex-col transition-all" style={{ height: "540px", maxHeight: "88vh" }}>
            {/* Chat Header */}
            <div
              className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between text-white"
              style={{ background: tenantConfig.colorStyle?.background || tenantConfig.primaryColor }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-black text-white truncate leading-tight">
                      {captainDisplayName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/80 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    <span>{p.kapchatHeaderSubtitle}</span>
                    {isChatSyncing && (
                      <RefreshCw className="w-2.5 h-2.5 animate-spin text-white/70" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {chatStarted && (
                  <button
                    onClick={handleResetChatSession}
                    title="Switch user identity or reset chat"
                    className="w-7 h-7 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center justify-center transition-colors shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => closeAssistance()}
                  className="w-7 h-7 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pre-chat: Name & Contact Form */}
            {!chatStarted ? (
              <div className="p-5 flex-1 flex flex-col justify-between overflow-y-auto bg-slate-50/50">
                <div className="space-y-4">
                  <div className="text-center pt-2">
                    <div
                      className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${tenantConfig.primaryColor}18`, color: tenantConfig.primaryColor }}
                    >
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">
                      {p.kapchatWelcome}
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                      {p.kapchatWelcomeDesc.replace("{captain}", captainDisplayName)}
                    </p>
                  </div>

                  <form onSubmit={handleStartChat} className="space-y-3 bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                        {p.kapchatFullName} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={chatUserInfo.name}
                        onChange={(e) => setChatUserInfo({ ...chatUserInfo, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:border-transparent outline-none transition-all"
                        style={{ "--tw-ring-color": tenantConfig.primaryColor }}
                        placeholder="e.g. Juan Dela Cruz"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                        {p.kapchatMobile} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={chatUserInfo.contact}
                        onChange={(e) => setChatUserInfo({ ...chatUserInfo, contact: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-900 focus:bg-white focus:ring-2 focus:border-transparent outline-none transition-all"
                        style={{ "--tw-ring-color": tenantConfig.primaryColor }}
                        placeholder="09XX XXX XXXX"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full text-white py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 text-xs shadow-md active:scale-[0.99] mt-2"
                      style={{ backgroundColor: tenantConfig.primaryColor }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{p.kapchatStart}</span>
                    </button>
                  </form>
                </div>

                <div className="pt-3 text-center border-t border-gray-200/60 mt-4">
                  <p className="text-[10px] text-gray-400 font-medium flex items-center justify-center gap-1">
                    <Shield className="w-3 h-3 text-gray-400" />
                    {p.kapchatFooterNote}
                  </p>
                </div>
              </div>
            ) : (
              /* Two-way Chat Messages & Input Stream */
              <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
                {/* User Session Bar */}
                <div className="px-3.5 py-1.5 bg-gray-100/80 border-b border-gray-200 flex items-center justify-between text-[11px] text-gray-600">
                  <span className="font-semibold truncate">
                    {p.kapchatChattingAs} <strong className="text-gray-900">{chatUserInfo.name}</strong> ({chatUserInfo.contact})
                  </span>
                  <button
                    onClick={handleResetChatSession}
                    className="text-[10px] font-bold text-blue-600 hover:underline shrink-0 ml-2"
                  >
                    {p.kapchatChange}
                  </button>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                  {/* Default Warm Welcome Bubble */}
                  <div className="flex items-start gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-0.5"
                      style={{ backgroundColor: `${tenantConfig.primaryColor}20`, color: tenantConfig.primaryColor }}
                    >
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 border border-gray-200/90 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-500 mb-0.5">
                        {captainDisplayName}
                      </p>
                      <p className="text-xs text-gray-800 leading-relaxed font-normal">
                        {p.kapchatWelcomeGreeting
                          .replace("{firstName}", chatUserInfo.name.split(" ")[0] || "")
                          .replace("{captain}", captainDisplayName)}
                      </p>
                      <span className="text-[9px] text-gray-400 font-medium block mt-1">
                        {p.kapchatOfficialBadge}
                      </span>
                    </div>
                  </div>

                  {/* Quick Suggested Inquiries if user hasn't sent many messages */}
                  {chatMessages.length === 0 && (
                    <div className="pt-2 pb-1 space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        {p.kapchatQuickInquiries}
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {kapchatQuickPrompts.map((prompt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleChatSend(null, prompt.text)}
                            className="text-left px-3 py-2 bg-white hover:bg-emerald-50/80 border border-gray-200 hover:border-emerald-300 rounded-xl text-xs font-semibold text-gray-700 hover:text-emerald-900 transition-all shadow-2xs active:scale-[0.99] flex items-center justify-between group"
                          >
                            <span>{prompt.label}</span>
                            <Send className="w-3 h-3 text-gray-300 group-hover:text-emerald-600 transition-colors shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conversation History Stream */}
                  {chatMessages.map((msg) => {
                    const isUser = msg.sender === "user" || !msg.is_admin;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-1.5 ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isUser && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-2xs mb-0.5"
                            style={{ backgroundColor: `${tenantConfig.primaryColor}20`, color: tenantConfig.primaryColor }}
                          >
                            <Shield className="w-3 h-3" />
                          </div>
                        )}
                        <div
                          className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                            isUser
                              ? "rounded-br-xs text-white"
                              : "rounded-bl-xs bg-white border border-gray-200 text-gray-800"
                          }`}
                          style={isUser ? { backgroundColor: tenantConfig.primaryColor } : {}}
                        >
                          {!isUser && (
                            <p className="text-[10px] font-bold text-emerald-700 mb-0.5">
                              {msg.sender_name || captainDisplayName}
                            </p>
                          )}
                          <p className="text-xs leading-relaxed font-normal whitespace-pre-wrap">
                            {msg.text}
                          </p>
                          <div
                            className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                              isUser ? "text-white/70" : "text-gray-400"
                            }`}
                          >
                            <span>{msg.time}</span>
                            {isUser && (
                              <CheckCheck className="w-3 h-3 text-white/90" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Sending indicator */}
                  {chatSending && (
                    <div className="flex justify-end">
                      <div
                        className="rounded-2xl rounded-br-xs px-3 py-2 text-white/90 text-xs shadow-2xs flex items-center gap-1.5"
                        style={{ backgroundColor: `${tenantConfig.primaryColor}cc` }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}

                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={handleChatSend}
                  className="p-3 border-t border-gray-200 bg-white flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSend(e);
                      }
                    }}
                    placeholder="Type your message to Kap..."
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:border-transparent outline-none transition-all"
                    style={{ "--tw-ring-color": tenantConfig.primaryColor }}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatSending}
                    className="w-10 h-10 text-white rounded-xl font-bold transition-all shrink-0 disabled:opacity-40 flex items-center justify-center shadow-md active:scale-95"
                    style={{ backgroundColor: tenantConfig.primaryColor }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Brgy Assistance Panel — Contact Form */}
        {showAssistance && assistanceMode === "assistance" && (
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-80 overflow-hidden animate-fade-in flex flex-col" style={{ maxHeight: '560px' }}>
            {/* Form Header */}
            <div
              className="px-4 py-3 border-b border-gray-100 flex items-center justify-between"
              style={{ backgroundColor: `${tenantConfig.primaryColor}08` }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${tenantConfig.primaryColor}12` }}
                >
                  <Headphones className="w-4 h-4" style={{ color: tenantConfig.primaryColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">Brgy Assistance</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tenantConfig.primaryColor }}>
                    Send an Inquiry
                  </p>
                </div>
              </div>
              <button
                onClick={() => closeAssistance()}
                className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {assistanceSuccess ? (
                <div className="text-center py-8">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: `${tenantConfig.primaryColor}15` }}
                  >
                    <CheckCircle className="w-6 h-6" style={{ color: tenantConfig.primaryColor }} />
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Message Sent</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Your inquiry has been received. We will get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAssistanceSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={assistanceFormData.firstName}
                        onChange={(e) => setAssistanceFormData({ ...assistanceFormData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:border-transparent transition-all"
                        style={{ '--tw-ring-color': tenantConfig.primaryColor }}
                        placeholder="Juan"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={assistanceFormData.lastName}
                        onChange={(e) => setAssistanceFormData({ ...assistanceFormData, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:border-transparent transition-all"
                        style={{ '--tw-ring-color': tenantConfig.primaryColor }}
                        placeholder="Dela Cruz"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={assistanceFormData.email}
                      onChange={(e) => setAssistanceFormData({ ...assistanceFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': tenantConfig.primaryColor }}
                      placeholder="juan@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={assistanceFormData.phone}
                      onChange={(e) => setAssistanceFormData({ ...assistanceFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': tenantConfig.primaryColor }}
                      placeholder="09XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={assistanceFormData.message}
                      onChange={(e) => setAssistanceFormData({ ...assistanceFormData, message: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:border-transparent transition-all resize-none"
                      style={{ '--tw-ring-color': tenantConfig.primaryColor }}
                      placeholder="How can we help you?"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={assistanceSubmitting}
                    className="w-full text-white py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                    style={{ backgroundColor: tenantConfig.primaryColor }}
                  >
                    {assistanceSubmitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Inquiry
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => (showAssistance ? closeAssistance() : setShowAssistance(true))}
          aria-label={showAssistance ? p.close : p.needHelp}
          className="flex items-center justify-center gap-2 text-white rounded-full md:rounded-xl shadow-lg transition-all p-3.5 md:px-4 md:py-3 min-h-[48px] min-w-[48px] md:min-w-0 touch-manipulation"
          style={{ backgroundColor: tenantConfig.primaryColor }}
        >
          {showAssistance ? (
            <>
              <X className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline text-sm font-bold">{p.close}</span>
            </>
          ) : (
            <>
              <Headphones className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline text-sm font-bold">{p.needHelp}</span>
            </>
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
              {p.comingSoonTitle}
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {p.comingSoonBody}
            </p>

            <button
              onClick={() => setShowComingSoonModal(false)}
              className="w-full text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 group/btn"
              style={{ backgroundColor: tenantConfig.primaryColor }}
            >
              {p.comingSoonOk}
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

      {/* Facility gallery & details modal */}
      {selectedFacility && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
          onClick={() => setSelectedFacility(null)}
        >
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />

          <div
            className="relative z-10 w-full sm:max-w-6xl lg:max-w-7xl h-[96vh] sm:h-[90vh] max-h-[96vh] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-4 py-3 sm:px-5 sm:py-4 text-white flex items-start sm:items-center justify-between gap-3 flex-shrink-0 border-b border-white/10"
              style={{
                background: `linear-gradient(135deg, ${tenantConfig.primaryColor} 0%, #022c22 100%)`,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const FacilityIcon = selectedFacility.icon || Building2;
                    return <FacilityIcon className="w-4 h-4" />;
                  })()}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 truncate">
                    {p.barangayWord} {tenantConfig.shortName || "Iba O' Este"} · {p.publicFacility}
                  </p>
                  <h3 className="text-base sm:text-lg font-black tracking-tight truncate">
                    {selectedFacility.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFacility(null)}
                aria-label="Close"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
              {(() => {
                const images = selectedFacility.images || ["/background.jpg"];
                const activeImg = images[facilityImageIndex] || images[0];

                return (
                  <>
                    <div className="flex-1 lg:flex-[1.75] min-h-[52vh] sm:min-h-0 flex flex-col bg-neutral-950 min-w-0">
                      <div className="relative flex-1 w-full min-h-0 overflow-hidden">
                        <img
                          src={activeImg}
                          alt=""
                          aria-hidden
                          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50 saturate-125"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <img
                          key={facilityImageIndex}
                          src={activeImg}
                          alt={`${selectedFacility.name} — photo ${facilityImageIndex + 1}`}
                          className="absolute inset-0 z-10 w-full h-full object-contain"
                        />

                        <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white/95 bg-black/45 backdrop-blur-md border border-white/15">
                          {facilityImageIndex + 1} / {images.length}
                        </div>

                        {images.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFacilityImageIndex((prev) =>
                                  prev === 0 ? images.length - 1 : prev - 1,
                                );
                              }}
                              aria-label="Previous photo"
                              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 flex items-center justify-center transition-colors"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFacilityImageIndex((prev) =>
                                  prev === images.length - 1 ? 0 : prev + 1,
                                );
                              }}
                              aria-label="Next photo"
                              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 flex items-center justify-center transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-3 pt-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                              <div className="flex justify-center gap-2 overflow-x-auto snap-x snap-mandatory max-w-full">
                                {images.map((img, idx) => {
                                  const isCurrent = facilityImageIndex === idx;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setFacilityImageIndex(idx)}
                                      className={`snap-center relative w-[4.25rem] h-14 sm:w-20 sm:h-[4.5rem] rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all shadow-lg ${
                                        isCurrent
                                          ? "border-emerald-400 opacity-100 ring-2 ring-emerald-400/40 scale-105"
                                          : "border-white/20 opacity-70 hover:opacity-100"
                                      }`}
                                    >
                                      <img
                                        src={img}
                                        alt={`Thumbnail ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="lg:w-[min(100%,22rem)] xl:w-80 flex flex-col min-h-0 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200">
                      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                        <div>
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-800 mb-2">
                            {p.aboutFacility}
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {selectedFacility.description || p.defaultFacilityModalDesc}
                          </p>
                        </div>

                        <ul className="space-y-2 text-xs text-gray-600">
                          <li className="flex gap-2">
                            <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>
                              <span className="font-bold text-gray-900">{p.jurisdictionLabel}</span>{" "}
                              {p.barangayWord} {tenantConfig.shortName || "Iba O' Este"}
                            </span>
                          </li>
                          <li className="flex gap-2">
                            <Building2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>
                              <span className="font-bold text-gray-900">{p.accessLabel}</span> {p.facilityAccessNote}
                            </span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedFacility(null)}
                          className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {p.close}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFacility(null);
                            openAssistance("assistance");
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-95 inline-flex items-center justify-center gap-2"
                          style={{ backgroundColor: tenantConfig.primaryColor }}
                        >
                          <MessageCircle className="w-4 h-4" />
                          {p.requestFacilityUse}
                        </button>
                      </div>
                    </div>
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
                    {p.barangayWord} {tenantConfig.shortName} — {p.officialAnnouncement}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNewsItem(null)}
                  className="px-5 py-2 text-white rounded-lg font-semibold text-sm transition-all shadow-md"
                  style={{ backgroundColor: tenantConfig.primaryColor }}
                >
                  {p.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Program details modal */}
      {selectedProgram && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
          onClick={() => setSelectedProgram(null)}
        >
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />

          <div
            className="relative z-10 w-full sm:max-w-6xl lg:max-w-7xl h-[96vh] sm:h-[90vh] max-h-[96vh] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-4 py-3 sm:px-5 sm:py-4 text-white flex items-start sm:items-center justify-between gap-3 flex-shrink-0 border-b border-white/10"
              style={{
                background: `linear-gradient(135deg, ${tenantConfig.primaryColor} 0%, #022c22 100%)`,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 truncate">
                    {p.barangayWord} {tenantConfig.shortName || "Iba O' Este"} · {p.communityProgram}
                  </p>
                  <h3 className="text-base sm:text-lg font-black tracking-tight truncate">
                    {selectedProgram.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProgram(null)}
                aria-label="Close"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
              {(() => {
                const programImage =
                  selectedProgram.image ||
                  "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1200";

                return (
                  <>
                    <div className="flex-1 lg:flex-[1.75] min-h-[48vh] sm:min-h-0 flex flex-col bg-neutral-950 min-w-0 relative">
                      <div className="relative flex-1 w-full min-h-0 overflow-hidden">
                        <img
                          src={programImage}
                          alt=""
                          aria-hidden
                          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50 saturate-125"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <img
                          src={programImage}
                          alt={selectedProgram.title}
                          className="absolute inset-0 z-10 w-full h-full object-contain"
                        />
                        <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white bg-white/15 backdrop-blur-md border border-white/25">
                            {selectedProgram.category || p.publicInitiative}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white bg-emerald-500/90 border border-emerald-300/40 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            {p.active}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-[min(100%,22rem)] xl:w-80 flex flex-col min-h-0 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200">
                      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                        <div>
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            {p.programDescTitle}
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {selectedProgram.description || p.defaultProgramModalDesc}
                          </p>
                        </div>

                        <ul className="space-y-2 text-xs text-gray-600">
                          <li className="flex gap-2">
                            <Users className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>
                              <span className="font-bold text-gray-900">{p.programBeneficiaries}</span> {p.allQualifiedResidents}
                            </span>
                          </li>
                          <li className="flex gap-2">
                            <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>
                              <span className="font-bold text-gray-900">{p.programCoverage}</span> {p.programCoverageFull}{" "}
                              {tenantConfig.shortName || "Iba O' Este"}
                            </span>
                          </li>
                          <li className="flex gap-2">
                            <Award className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>
                              <span className="font-bold text-gray-900">{p.programFee}</span> {p.programFeeFree}
                            </span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedProgram(null)}
                          className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {p.close}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProgram(null);
                            openAssistance("assistance");
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-95 inline-flex items-center justify-center gap-2"
                          style={{ backgroundColor: tenantConfig.primaryColor }}
                        >
                          <MessageCircle className="w-4 h-4" />
                          {p.askAboutProgram}
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
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

      {/* Resident Mobile Bottom Action Bar */}
      <ResidentMobileActionBar
        onRequestDocs={() => {
          const formsSection = document.getElementById("forms");
          if (formsSection) formsSection.scrollIntoView({ behavior: "smooth" });
        }}
        onTrackStatus={() => {
          const trackSection = document.getElementById("track");
          if (trackSection) trackSection.scrollIntoView({ behavior: "smooth" });
        }}
        onESumbong={openESumbong}
        onInstallApp={promptInstall}
        isInstalled={isInstalled}
      />

      {/* Global PWA Install Modal for Residents */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isInstallable={isInstallable}
        onInstallClick={promptInstall}
      />
    </div>
  );
}


// Track Request Widget Component
function TrackRequestWidget({ tenantId, tenantConfig, labels: labelsProp }) {
  const labels = labelsProp || getPortalStrings();
  const [refNumber, setRefNumber] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');

  const statusConfig = {
    pending:          { label: labels.statusSubmitted, color: 'bg-blue-100 text-blue-700',   step: 1 },
    submitted:        { label: labels.statusSubmitted, color: 'bg-blue-100 text-blue-700',   step: 1 },
    staff_review:     { label: labels.statusUnderReview, color: 'bg-blue-100 text-blue-700',   step: 2 },
    processing:       { label: labels.statusSecretaryApproval, color: 'bg-purple-100 text-purple-700', step: 3 },
    secretary_approval: { label: labels.statusSecretaryApproval, color: 'bg-purple-100 text-purple-700', step: 3 },
    captain_approval: { label: labels.statusCaptainApproval, color: 'bg-violet-100 text-violet-700', step: 4 },
    oic_review:       { label: labels.statusReleasingTeam, color: 'bg-indigo-100 text-indigo-700', step: 5 },
    ready:            { label: labels.statusReadyForPickup, color: 'bg-green-100 text-green-700', step: 6 },
    ready_for_pickup: { label: labels.statusReadyForPickup, color: 'bg-green-100 text-green-700', step: 6 },
    released:         { label: labels.statusReleased, color: 'bg-gray-100 text-gray-600',   step: 7 },
    rejected:         { label: labels.statusRejected, color: 'bg-red-100 text-red-700',     step: 0 },
    returned:         { label: labels.statusReturned, color: 'bg-orange-100 text-orange-700', step: 2 },
    cancelled:        { label: labels.statusCancelled, color: 'bg-gray-100 text-gray-500',   step: 0 },
  };

  const steps = [
    labels.trackStepSubmitted,
    labels.trackStepReview,
    labels.trackStepSecretary,
    labels.trackStepCaptain,
    labels.trackStepReleasing,
    labels.trackStepReady,
    labels.trackStepReleased,
  ];

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
        setError(labels.trackNotFound);
      }
    } catch {
      setError(labels.trackError);
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
            placeholder={labels.trackPlaceholder}
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
          {loading ? labels.trackChecking : labels.trackButton}
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
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1">{labels.trackRefNumber}</p>
              <p className="text-lg font-bold text-gray-900 font-mono">{result.reference_number}</p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
          </div>

          {/* Applicant Info */}
          <div className="px-6 py-4 border-b border-gray-50 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-medium tracking-wide mb-1">{labels.trackApplicant}</p>
              <p className="text-sm font-semibold text-gray-800">{result.full_name || result.applicant_name || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-medium tracking-wide mb-1">{labels.trackCertType}</p>
              <p className="text-sm font-semibold text-gray-800 capitalize">{result.certificate_type?.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-medium tracking-wide mb-1">{labels.trackDateSubmitted}</p>
              <p className="text-sm font-semibold text-gray-800">{result.created_at ? new Date(result.created_at).toLocaleDateString('fil-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-medium tracking-wide mb-1">{labels.trackLastUpdated}</p>
              <p className="text-sm font-semibold text-gray-800">{result.updated_at ? new Date(result.updated_at).toLocaleDateString('fil-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</p>
            </div>
          </div>

          {/* Progress Steps */}
          {!['rejected', 'cancelled'].includes(result.status) && (
            <div className="px-6 py-5">
              <p className="text-[11px] text-gray-400 uppercase font-medium tracking-wide mb-4">{labels.trackProgress}</p>
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
                          style={isActive ? { backgroundColor: isComplete ? tenantConfig.primaryColor : '#4f46e5' } : {}}>
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
              <p className="text-sm text-red-600 font-medium">{labels.trackRejectedMsg}</p>
            </div>
          )}
          {['ready', 'ready_for_pickup'].includes(result.status) && (
            <div className="px-6 py-4 border-t border-gray-50" style={{ backgroundColor: `${tenantConfig.primaryColor}08` }}>
              <p className="text-sm font-semibold" style={{ color: tenantConfig.primaryColor }}>🎉 {labels.trackReadyMsg}</p>
            </div>
          )}
          {result.status === 'oic_review' && (
            <div className="px-6 py-4 border-t border-gray-50" style={{ backgroundColor: `${tenantConfig.primaryColor}08` }}>
              <p className="text-sm font-semibold" style={{ color: tenantConfig.primaryColor }}>📦 {labels.trackOicMsg}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function UpgradeNeededModal({ isOpen, onClose, featureName, tenantConfig }) {
  useScrollLock(isOpen);
  const up = getPortalStrings();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md"
      onClick={onClose}
      onTouchMove={(e) => e.target === e.currentTarget && e.preventDefault()}
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
          {up.premiumFeature}
        </h2>
        
        <p className="text-gray-500 text-base md:text-lg mb-8 leading-relaxed font-medium">
          <span className="font-bold text-gray-900">{featureName}</span> {up.upgradeBody}
        </p>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg hover:-translate-y-1 hover:shadow-xl active:scale-95"
          style={{ backgroundColor: tenantConfig.primaryColor }}
        >
          {up.iUnderstand}
        </button>
      </div>
    </div>
  );
}
