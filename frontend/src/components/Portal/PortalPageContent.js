import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Menu, X, ChevronRight, ChevronLeft, Plus, Send, Phone, MapPin, Mail,
  Clock, Sun, Moon, Cloud, CloudRain, Users, FileText, Award, Building2, Heart, Baby,
  AlertTriangle, Shield, Home, Calendar, TrendingUp, CheckCircle, GraduationCap, User,
  Store, Briefcase, Stethoscope, Fingerprint, UserPlus, Flower2, Search, Star, Leaf, Laptop,
  Trophy, Target, Quote
} from 'lucide-react';
import BarangayClearanceModal from '@/components/Forms/BarangayClearanceModal';
import IndigencyCertificateModal from '@/components/Forms/IndigencyCertificateModal';
import ResidencyCertificateModal from '@/components/Forms/ResidencyCertificateModal';
import BusinessPermitModal from '@/components/Forms/BusinessPermitModal';
import EducationalAssistanceModal from '@/components/Forms/EducationalAssistanceModal';
import NaturalDeathCertificateModal from '@/components/Forms/NaturalDeathCertificateModal';
import GuardianshipCertificateModal from '@/components/Forms/GuardianshipCertificateModal';
import CohabitationCertificateModal from '@/components/Forms/CohabitationCertificateModal';
import MedicoLegalModal from '@/components/Forms/MedicoLegalModal';
import SamePersonCertificateModal from '@/components/Forms/SamePersonCertificateModal';

export default function PortalPageContent({ initialTenantId }) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState(initialTenantId || 'ibaoeste');
  
  // Version Check Log
  useEffect(() => {
    console.log('🚀 Barangay Portal Loaded: Version 2.7 (Dynamic Themes)');
  }, []);

  const [tenantConfig, setTenantConfig] = useState({
    name: "BARANGAY PORTAL",
    shortName: "Barangay",
    subtitle: "Public Information and Service Center",
    logo: "/logo.png",
    colorStyle: { background: 'linear-gradient(to right, #004700, #001a00)' },
    primaryColor: '#008000',
    primaryHover: '#006400',
    accentColor: '#008000',
    secondaryColor: '#2d5a3d',
    cardBackground: '#112e1f',
    darkBackground: 'from-[#112e1f] to-[#112117]',
    darkHeader: 'from-[#0a1f12] via-[#113821] to-[#0a1f12]'
  });

  // Resilient API URL Discovery
  const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')) {
       return `https://brgyportal-production.up.railway.app/api`;
    }
    return 'http://localhost:5005/api';
  };

  const API_URL = getApiUrl().replace(/\/$/, '');

  useEffect(() => {
    if (initialTenantId) setTenantId(initialTenantId);
  }, [initialTenantId]);

  useEffect(() => {
    if (tenantId === 'demo') {
      setTenantConfig({
        name: "DEMO BARANGAY PORTAL",
        shortName: "Demo Barangay",
        subtitle: "Sample Municipality, Philippines",
        logo: "/images/bdlogo.png",
        colorStyle: { background: 'linear-gradient(to right, #000000, #333333)' },
        primaryColor: '#1a1a1a',
        primaryHover: '#333333',
        accentColor: '#C9A84C', // Gold
        secondaryColor: '#4a4a4a',
        cardBackground: '#1a1a1a',
        darkBackground: 'from-black to-gray-900',
        darkHeader: 'from-black via-gray-900 to-black'
      });
    } else {
      setTenantConfig({
        name: "IBA O' ESTE PORTAL",
        shortName: "Iba O' Este",
        subtitle: "Calumpit, Bulacan",
        logo: "/logo.png",
        colorStyle: { background: 'linear-gradient(to right, #004700, #001a00)' },
        primaryColor: '#008000',
        primaryHover: '#006400',
        accentColor: '#008000',
        secondaryColor: '#2d5a3d',
        cardBackground: '#112e1f',
        darkBackground: 'from-[#112e1f] to-[#112117]',
        darkHeader: 'from-[#0a1f12] via-[#113821] to-[#0a1f12]'
      });
    }
  }, [tenantId]);


  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showHotlines, setShowHotlines] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [weatherInfo, setWeatherInfo] = useState({ icon: Sun, text: 'Loading...', color: 'text-yellow-400' });
  const [showClearanceModal, setShowClearanceModal] = useState(false);
  const [showIndigencyModal, setShowIndigencyModal] = useState(false);
  const [showResidencyModal, setShowResidencyModal] = useState(false);
  const [showBusinessPermitModal, setShowBusinessPermitModal] = useState(false);
  const [showEducationalAssistanceModal, setShowEducationalAssistanceModal] = useState(false);
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
    firstName: '', lastName: '', email: '', phone: '', message: ''
  });
  const [itemsPerView, setItemsPerView] = useState(4);
  const [heroCarouselIndex, setHeroCarouselIndex] = useState(0);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilityImageIndex, setFacilityImageIndex] = useState(0);

  const forms = useMemo(() => [
    {
      title: 'Barangay Clearance',
      description: 'Official clearance for employment, business permits, and other legal purposes.',
      icon: Shield,
      color: 'blue',
      features: ['Employment', 'Business', 'Legal'],
      onClick: () => setShowClearanceModal(true)
    },
    {
      title: 'Certificate of Indigency',
      description: 'Proof of financial status for medical, educational, and social assistance programs.',
      icon: FileText,
      color: 'green',
      features: ['Medical', 'Education', 'Assistance'],
      onClick: () => setShowIndigencyModal(true)
    },
    {
      title: 'Barangay Residency',
      description: `Certificate confirming your residence in ${tenantConfig.shortName} for various requirements.`,
      icon: Home,
      color: 'orange',
      features: ['Proof', 'Enrollment', 'ID'],
      onClick: () => setShowResidencyModal(true)
    },
    {
      title: 'Business Permit',
      description: `Official permit to operate a business within ${tenantConfig.shortName} barangay jurisdiction.`,
      icon: Building2,
      color: 'purple',
      features: ['New Business', 'Renewal', 'Transfer'],
      onClick: () => setShowBusinessPermitModal(true)
    },
    {
      title: 'Business Closure',
      description: 'Official notice to cease business operations within the barangay.',
      icon: Briefcase,
      color: 'blue',
      features: ['Liquidation', 'Permit Exit', 'Tax Clearance'],
      onClick: () => setShowComingSoonModal(true)
    },
    {
      title: 'Co-habitation',
      description: 'Certification for couples living together without formal marriage.',
      icon: Heart,
      color: 'green',
      features: ['Live-in', 'Relationship', 'Proof'],
      onClick: () => setShowCohabitationModal(true)
    },
    {
      title: 'Medico-legal',
      description: 'Official document for cases requiring medical and legal coordination.',
      icon: Stethoscope,
      color: 'orange',
      features: ['Accident', 'Legal Case', 'Medical Report'],
      onClick: () => setShowMedicoLegalModal(true)
    },
    {
      title: 'Certification of Same Person',
      description: 'Certification that differences in name records refer to the same individual.',
      icon: Fingerprint,
      color: 'purple',
      features: ['ID Match', 'Affidavit', 'Verification'],
      onClick: () => setShowSamePersonModal(true)
    },
    {
      title: 'Guardianship',
      description: 'Legal certification for designated guardians of minors or dependents.',
      icon: UserPlus,
      color: 'blue',
      features: ['Legal Guardian', 'Minor Support', 'Custody'],
      onClick: () => setShowGuardianshipModal(true)
    },
    {
      title: 'Natural Death',
      description: 'Official certification for natural death recording and burial requirements.',
      icon: Flower2,
      color: 'green',
      features: ['Certified', 'Family Record', 'Cemetery'],
      onClick: () => setShowNaturalDeathModal(true)
    },
    {
      title: 'Educational Assistance',
      description: 'Apply for scholarship and financial support for studying residents.',
      icon: GraduationCap,
      color: 'blue',
      features: ['Scholarship', 'Allowance', 'Education'],
      onClick: () => setShowEducationalAssistanceModal(true)
    }
  ], [
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
    tenantConfig.shortName
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
      setCurrentFormSlide(prev => Math.min(prev, forms.length - (newItemsPerView - 1)));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [forms.length]);

  // Events load from DB per tenant - no hardcoded defaults
  const [newsItems, setNewsItems] = useState([]);

  // Facilities load from DB per tenant - no hardcoded defaults
  const [facilities, setFacilities] = useState([]);
  const [officials, setOfficials] = useState([]);
  const [visibilitySettings, setVisibilitySettings] = useState(null);

  const [achievements, setAchievements] = useState([]);

  const [programs, setPrograms] = useState([]);
  const [heroSettings, setHeroSettings] = useState({
    title: 'BARANGAY OFFICIALS',
    subtitle: 'Meet our dedicated team serving our community',
    image: '' // No default image - upload via management page
  });

  // Helper function to map icon names to components
  const getIconComponent = (iconName) => {
    const iconMap = {
      'Heart': Heart,
      'Building2': Building2,
      'Baby': Baby,
      'Home': Home,
      'Award': Award
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

    const currentFacilityIndex = facilityImageSlides['main'] || 0;
    const facility = facilities[currentFacilityIndex];
    const currentImageIndex = facilityImageSlides[currentFacilityIndex] || 0;

    console.log('Swipe detected:', { distance, isLeftSwipe, isRightSwipe, currentImageIndex, totalImages: facility.images.length });

    if (isLeftSwipe && facility.images.length > 1) {
      // Swipe left - next image in current facility
      const nextIndex = (currentImageIndex + 1) % facility.images.length;
      console.log('Swiping to next image:', nextIndex);
      setFacilityImageSlides(prev => ({
        ...prev,
        [currentFacilityIndex]: nextIndex
      }));
    }
    if (isRightSwipe && facility.images.length > 1) {
      // Swipe right - previous image in current facility
      const prevIndex = (currentImageIndex - 1 + facility.images.length) % facility.images.length;
      console.log('Swiping to previous image:', prevIndex);
      setFacilityImageSlides(prev => ({
        ...prev,
        [currentFacilityIndex]: prevIndex
      }));
    }

    // Reset touch values
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Load events from API
  useEffect(() => {
    const fetchEvents = async () => {
      // Small delay on first load to ensure interceptor is ready
      await new Promise(r => setTimeout(r, 100));
      if (!tenantId) return;
      try {
        console.log(`📡 Fetching events from: ${API_URL}/events for tenant: ${tenantId}`);
        const response = await fetch(`${API_URL}/events`, {
          headers: { 'x-tenant-id': tenantId }
        });
        
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          console.log('✅ Setting events from API:', data.data);
          setNewsItems(data.data);
        } else {
          console.log('⚠️ No events from API, using defaults');
        }
      } catch (error) {
        console.error('❌ Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [tenantId]);

  // SELF-HEALING: Reset currentSlide if it becomes NaN or out of bounds when data arrives
  useEffect(() => {
    if (newsItems.length > 0 && (isNaN(currentSlide) || currentSlide >= newsItems.length)) {
      console.log('🔄 Self-healing: Resetting currentSlide from', currentSlide, 'to 0');
      setCurrentSlide(0);
    }
  }, [newsItems, currentSlide]);

  // Load facilities from API
  useEffect(() => {
    const fetchFacilities = async () => {
      // Small delay on first load to ensure interceptor is ready
      await new Promise(r => setTimeout(r, 150));
      if (!tenantId) return;
      try {
        console.log(`📡 Fetching facilities from: ${API_URL}/facilities for tenant: ${tenantId}`);
        const response = await fetch(`${API_URL}/facilities`, {
          headers: { 'x-tenant-id': tenantId }
        });
        
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          // Map icon names to actual components
          const facilitiesWithIcons = data.data.map(facility => ({
            ...facility,
            icon: getIconComponent(facility.icon)
          }));
          console.log('✅ Setting facilities from API:', facilitiesWithIcons);
          setFacilities(facilitiesWithIcons);
        } else {
          console.log('⚠️ No facilities from API, using defaults');
        }
      } catch (error) {
        console.error('❌ Error fetching facilities:', error);
      }
    };

    fetchFacilities();
  }, [tenantId]);

  // Set up 5-second interval for hero carousel auto transition
  useEffect(() => {
    const totalImages = facilities.flatMap(f => f.images || []).filter((img, i, arr) => arr.indexOf(img) === i).length || 1;
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
      // Small delay on first load to ensure interceptor is ready
      await new Promise(r => setTimeout(r, 200));
      if (!tenantId) return;
      try {
        console.log(`🌐 BRGY PORTAL [V2.5]: Fetching dynamic content for tenant: ${tenantId}`);

        // Fetch Officials
        const officialsRes = await fetch(`${API_URL}/officials`, {
          headers: { 'x-tenant-id': tenantId }
        });
        const officialsData = await officialsRes.json();
        if (officialsData.success && officialsData.data) {
          setOfficials(Array.isArray(officialsData.data) ? officialsData.data : []);
        }

        // Fetch Hero & Visibility Settings
        const configRes = await fetch(`${API_URL}/officials/config`, {
          headers: { 'x-tenant-id': tenantId }
        });
        const settingsData = await configRes.json();
        if (settingsData.success && settingsData.data) {
          if (settingsData.data.heroSection) setHeroSettings(settingsData.data.heroSection);
          if (settingsData.data.visibility) setVisibilitySettings(settingsData.data.visibility);
        }

        // Fetch Achievements
        const achievementsRes = await fetch(`${API_URL}/achievements`, {
          headers: { 'x-tenant-id': tenantId }
        });
        if (achievementsRes.ok) {
          const achievementsData = await achievementsRes.json();
          if (achievementsData.success && achievementsData.data?.length > 0) {
            const mappedAchievements = achievementsData.data.map(ach => ({
              ...ach,
              colorClass: ach.color_class || 'bg-blue-500',
              textColor: ach.text_color || 'blue-400'
            }));
            setAchievements(mappedAchievements);
          }
        }

        // Fetch Programs
        const programsRes = await fetch(`${API_URL}/programs`, {
          headers: { 'x-tenant-id': tenantId }
        });
        if (programsRes.ok) {
          const programsData = await programsRes.json();
          if (programsData.success && programsData.data?.length > 0) {
            setPrograms(programsData.data);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching dynamic content:', error);
      }
    };

    fetchData();
  }, [tenantId]);


  // Update time and weather every second
  useEffect(() => {
    const updateTimeAndWeather = () => {
      const now = new Date();
      const options = {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
        timeZone: 'Asia/Manila'
      };
      setCurrentTime(now.toLocaleDateString('en-PH', options));

      // Get current hour for weather logic
      const hour = now.getHours();

      // Dynamic weather based on time of day
      let weather;
      if (hour >= 6 && hour < 12) {
        // Morning (6 AM - 12 PM)
        weather = {
          icon: Sun,
          text: 'Morning, 28°C',
          color: 'text-yellow-400'
        };
      } else if (hour >= 12 && hour < 18) {
        // Afternoon (12 PM - 6 PM)
        weather = {
          icon: Sun,
          text: 'Afternoon, 31°C',
          color: 'text-orange-400'
        };
      } else if (hour >= 18 && hour < 21) {
        // Evening (6 PM - 9 PM)
        weather = {
          icon: Cloud,
          text: 'Evening, 26°C',
          color: 'text-blue-300'
        };
      } else {
        // Night (9 PM - 6 AM)
        weather = {
          icon: Moon,
          text: 'Night, 24°C',
          color: 'text-blue-200'
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
      setFacilityImageSlides(prev => {
        const updated = { ...prev };
        const currentFacilityIndex = updated['main'] || 0;
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
            const nextFacilityIndex = (currentFacilityIndex + 1) % facilities.length;
            updated['main'] = nextFacilityIndex;
            updated[nextFacilityIndex] = 0; // Start from first image of next facility
          }
        } else {
          // Current facility has only one image, move to next facility
          const nextFacilityIndex = (currentFacilityIndex + 1) % facilities.length;
          updated['main'] = nextFacilityIndex;
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
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    const animatableElements = document.querySelectorAll('.animate-on-scroll');
    animatableElements.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      animatableElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const stats = [
    { label: 'Total Population', value: '12,847', icon: Users },
    { label: 'Active Programs', value: '24', icon: TrendingUp },
    { label: 'Forms Processed This Month', value: '1,256', icon: FileText }
  ];

  const hotlines = [
    { name: 'Barangay Emergency', number: '(044) 123-4567' },
    { name: 'Police Station', number: '911' },
    { name: 'Fire Department', number: '(044) 765-4321' },
    { name: 'Medical Emergency', number: '(044) 987-6543' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent successfully! We will get back to you soon.');
    setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Google Sans', 'Product Sans', 'Nunito Sans', sans-serif" }}>
      <style jsx global>{`
        * { font-family: 'Google Sans', 'Product Sans', 'Nunito Sans', sans-serif !important; }
        nav a:hover { color: ${tenantConfig.accentColor} !important; border-bottom-color: ${tenantConfig.accentColor} !important; }
        .mobile-nav-link:hover { color: ${tenantConfig.accentColor} !important; }
        .program-card:hover .program-title { color: ${tenantConfig.accentColor} !important; }
      `}</style>
      {/* Large Portal Header with Date/Time and Weather */}
      <div className="py-2 md:py-3" style={tenantConfig.colorStyle}>
        <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6">
          {/* Left Side - Logo and Title */}
          <div className="flex items-center gap-3 md:gap-4">
            <img src={tenantConfig.logo} alt="Barangay Logo" className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 object-contain drop-shadow-2xl bg-white rounded-full p-1" />
            <div className="text-center md:text-left">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
                {tenantConfig.name}
              </h1>
              <p className="text-xs md:text-sm lg:text-base text-gray-200 font-medium mt-0.5">
                {tenantConfig.subtitle}
              </p>
            </div>
          </div>

          {/* Right Side - Date/Time and Weather */}
          <div className="flex flex-col items-end gap-1 mt-4 md:mt-0 text-white text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{currentTime || 'Loading...'}</span>
            </div>
            <div className="flex items-center gap-2">
              {weatherInfo.icon && React.createElement(weatherInfo.icon, { className: `w-4 h-4 ${weatherInfo.color}` })}
              <span>Weather: {weatherInfo.text}</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-100 transition-all duration-500 py-2">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center h-10 md:h-12 gap-8">
            {/* Desktop Navigation - Right Side */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#news" className="text-gray-700 text-sm lg:text-base font-bold transition-all py-1 border-b-2 border-transparent hover:border-current transform hover:scale-105" style={{ color: 'inherit', '--hover-color': tenantConfig.accentColor }}>
                News &amp; Updates
              </a>
              <a href="#forms" className="text-gray-700 text-sm lg:text-base font-bold transition-all py-1 border-b-2 border-transparent hover:border-current transform hover:scale-105" style={{ color: 'inherit', '--hover-color': tenantConfig.accentColor }}>
                Barangay Forms
              </a>
              <a href="#directory" className="text-gray-700 text-sm lg:text-base font-bold transition-all py-1 border-b-2 border-transparent hover:border-current transform hover:scale-105" style={{ color: 'inherit', '--hover-color': tenantConfig.accentColor }}>
                Facilities
              </a>
              <a href="#achievements" className="text-gray-700 text-sm lg:text-base font-bold transition-all py-1 border-b-2 border-transparent hover:border-current transform hover:scale-105" style={{ color: 'inherit', '--hover-color': tenantConfig.accentColor }}>
                Achievements &amp; Awards
              </a>
              <a href="#officials" className="text-gray-700 text-sm lg:text-base font-bold transition-all py-1 border-b-2 border-transparent hover:border-current transform hover:scale-105" style={{ color: 'inherit', '--hover-color': tenantConfig.accentColor }}>
                Barangay Officials
              </a>
              <a href="#contact" className="text-gray-700 text-sm lg:text-base font-bold transition-all py-1 border-b-2 border-transparent hover:border-current transform hover:scale-105" style={{ color: 'inherit', '--hover-color': tenantConfig.accentColor }}>
                Contact Us
              </a>
              <button
                onClick={() => router.push('/login')}
                className="text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 ml-2"
                style={{ backgroundColor: tenantConfig.primaryColor }}
              >
                Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4 px-4 space-y-3">
            <a href="#news" className="block py-2 text-gray-700 font-medium mobile-nav-link">
              News & Updates
            </a>
            <a href="#forms" className="block py-2 text-gray-700 font-medium mobile-nav-link">
              Barangay Forms
            </a>
            <a href="#directory" className="block py-2 text-gray-700 font-medium mobile-nav-link">
              Facilities
            </a>
            <a href="#achievements" className="block py-2 text-gray-700 font-medium mobile-nav-link">
              Achievements & Awards
            </a>
            <a href="#officials" className="block py-2 text-gray-700 font-medium mobile-nav-link">
              Barangay Officials
            </a>
            <a href="#contact" className="block py-2 text-gray-700 font-medium mobile-nav-link">
              Contact Us
            </a>
            <button
              onClick={() => router.push('/login')}
              className="w-full text-white px-6 py-3 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: tenantConfig.primaryColor }}
            >
              Login
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section with News Carousel - Trimmed Balanced Height */}
      <section id="news" className="relative h-[360px] md:h-[420px] lg:h-[520px] xl:h-[580px] overflow-hidden bg-gray-900">
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
              currentSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {item.image && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${item.image})` }}
              />
            )}
            <div className={`absolute inset-0 bg-gradient-to-r ${tenantId === 'demo' ? 'from-black/90 to-black/40' : 'from-[#112117]/80 to-[#112e1f]/60'}`} />
            <div className="relative h-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
              <div className="max-w-2xl text-white">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 text-white shadow-lg`} style={{ backgroundColor: tenantConfig.accentColor }}>
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {item.date}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">{item.title}</h2>
                <p className="text-sm md:text-base text-gray-200 mb-4 line-clamp-2 overflow-hidden">{item.description}</p>
                <button
                  onClick={() => setSelectedNewsItem(item)}
                  className="bg-[#efefef] px-5 py-2 rounded-lg font-semibold hover:bg-white transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg text-sm"
                  style={{ color: tenantConfig.primaryColor }}
                >
                  Read More <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Navigation with Integrated Arrows */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          {/* Left Arrow */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + newsItems.length) % newsItems.length)}
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
                className={`w-3 h-3 rounded-full transition-all ${currentSlide === index ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                  }`}
              />
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % newsItems.length)}
            className="bg-white/30 hover:bg-white/50 backdrop-blur-sm p-2 rounded-full transition-all touch-manipulation"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </section>

      {/* Available Forms Section - Modern Design with Responsive Background */}
      <section id="forms" className="py-4 md:py-6 relative overflow-hidden animate-on-scroll">
        {/* Removed redundant hardcoded image to fix 404 */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat hidden md:block"
          style={{
            backgroundColor: '#f8f9fa',
            backgroundPosition: 'center center',
          }}
        />

        {/* Barangay Logo Watermark - Even Bigger & Impactful */}
        <div
          className="absolute right-[-5%] md:right-[-2%] top-1/2 -translate-y-1/2 w-[600px] md:w-[1100px] h-[110%] md:h-[115%] bg-contain bg-right bg-no-repeat opacity-10 pointer-events-none z-0 hidden md:block"
          style={{ backgroundImage: `url(${tenantConfig.logo})`, backgroundPosition: 'right center' }}
        />

        {/* Light Overlay for Text Readability */}


        {/* Additional Decorative Overlays - Responsive */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 md:-top-40 -right-20 md:-right-40 w-40 h-40 md:w-80 md:h-80 bg-white/10 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute -bottom-20 md:-bottom-40 -left-20 md:-left-40 w-40 h-40 md:w-80 md:h-80 bg-white/10 rounded-full opacity-50 blur-3xl"></div>
        </div>

        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-3">
            {/* Enhanced Online Services Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 backdrop-blur-sm border text-white rounded-full text-xs font-semibold mb-4 shadow-lg" style={{ backgroundColor: `${tenantConfig.secondaryColor}E6`, borderColor: `${tenantConfig.accentColor}40` }}>
              <div className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
                <FileText className="w-3 h-3 text-white" />
              </div>
              <span className="tracking-wide">ONLINE SERVICES</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: tenantId === 'demo' ? '#C9A84C' : '#4ade80' }}></span>
                <span className="text-[10px] font-bold" style={{ color: tenantId === 'demo' ? '#C9A84C' : '#86efac' }}>LIVE</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 drop-shadow-2xl mb-2">
              Available Barangay <span className="text-transparent bg-clip-text drop-shadow-lg" style={{ backgroundImage: `linear-gradient(to right, ${tenantConfig.accentColor}, ${tenantConfig.primaryColor})` }}>Forms</span>
            </h2>
            <p className="text-gray-700 drop-shadow-lg max-w-2xl mx-auto text-base font-medium">
              Request official documents and certificates online. Fast, easy, and convenient.
            </p>
          </div>

          {/* Forms Carousel */}
          <div className="relative mb-8">
            {(() => {
              const colorClasses = {
                blue: {
                  gradient: 'from-blue-500 to-blue-600',
                  shadow: 'shadow-blue-500/30',
                  bg: 'bg-blue-100',
                  text: 'text-blue-600',
                  button: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
                  buttonShadow: 'shadow-blue-500/25 group-hover:shadow-blue-500/40',
                  overlay: 'from-blue-600/5 to-blue-600/10',
                  feature: 'bg-blue-50 text-blue-600'
                },
                green: {
                  gradient: tenantId === 'demo' ? 'from-[#C9A84C] to-[#aa8c2c]' : 'from-green-500 to-green-600',
                  shadow: tenantId === 'demo' ? 'shadow-[#C9A84C]/30' : 'shadow-green-500/30',
                  bg: tenantId === 'demo' ? 'bg-[#C9A84C]/10' : 'bg-green-100',
                  text: tenantId === 'demo' ? 'text-[#C9A84C]' : 'text-green-600',
                  button: tenantId === 'demo' ? 'from-[#C9A84C] to-[#aa8c2c] hover:from-[#aa8c2c] hover:to-amber-700' : 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
                  buttonShadow: tenantId === 'demo' ? 'shadow-[#C9A84C]/25 group-hover:shadow-[#C9A84C]/40' : 'shadow-green-500/25 group-hover:shadow-green-500/40',
                  overlay: tenantId === 'demo' ? 'from-[#C9A84C]/5 to-[#C9A84C]/10' : 'from-green-600/5 to-green-600/10',
                  feature: tenantId === 'demo' ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : 'bg-green-50 text-green-600'
                },
                gold: {
                  gradient: 'from-[#C9A84C] to-[#aa8c2c]',
                  shadow: 'shadow-[#C9A84C]/30',
                  bg: 'bg-[#C9A84C]/10',
                  text: 'text-[#C9A84C]',
                  button: 'from-[#C9A84C] to-[#aa8c2c] hover:from-[#aa8c2c] hover:to-amber-700',
                  buttonShadow: 'shadow-[#C9A84C]/25 group-hover:shadow-[#C9A84C]/40',
                  overlay: 'from-[#C9A84C]/5 to-[#C9A84C]/10',
                  feature: 'bg-[#C9A84C]/10 text-[#C9A84C]'
                },
                orange: {
                  gradient: 'from-orange-500 to-orange-600',
                  shadow: 'shadow-orange-500/30',
                  bg: 'bg-orange-100',
                  text: 'text-orange-600',
                  button: 'from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800',
                  buttonShadow: 'shadow-orange-500/25 group-hover:shadow-orange-500/40',
                  overlay: 'from-orange-600/5 to-orange-600/10',
                  feature: 'bg-orange-50 text-orange-600'
                },
                purple: {
                  gradient: 'from-purple-500 to-purple-600',
                  shadow: 'shadow-purple-500/30',
                  bg: 'bg-purple-100',
                  text: 'text-purple-600',
                  button: 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
                  buttonShadow: 'shadow-purple-500/25 group-hover:shadow-purple-500/40',
                  overlay: 'from-purple-600/5 to-purple-600/10',
                  feature: 'bg-purple-50 text-purple-600'
                }
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
                        const maxSlide = Math.max(0, forms.length - itemsPerView);
                        if (distance > 50) {
                          setCurrentFormSlide((prev) => (prev + 1) % (maxSlide + 1));
                        } else if (distance < -50) {
                          setCurrentFormSlide((prev) => (prev - 1 + (maxSlide + 1)) % (maxSlide + 1));
                        }
                        setTouchStart(null);
                        setTouchEnd(null);
                      }}
                      style={{
                        transform: `translateX(-${currentFormSlide * (100 / forms.length)}%)`,
                        width: `${(forms.length / itemsPerView) * 100}%`
                      }}
                    >
                      {forms.map((form, formIndex) => {
                        const Icon = form.icon;
                        const colors = colorClasses[form.color];
                        const isPrimary = formIndex % 2 === 0;

                        // Theme definitions for better blending
                        const theme = isPrimary ? {
                          bg: tenantConfig.cardBackground,
                          title: 'text-white',
                          desc: tenantId === 'demo' ? 'text-gray-300' : 'text-green-100/80',
                          iconBg: tenantId === 'demo' ? `from-[${tenantConfig.accentColor}] to-black` : 'from-emerald-500 to-green-600',
                          badge: tenantId === 'demo' ? `bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30` : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                          button: tenantId === 'demo' ? `from-[#C9A84C] to-[#A07830] hover:from-[#E8C96A] hover:to-[#C9A84C]` : 'from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600',
                          buttonShadow: tenantId === 'demo' ? 'shadow-yellow-900/40' : 'shadow-emerald-900/40',
                          countBg: tenantId === 'demo' ? 'bg-[#C9A84C] text-black' : 'bg-emerald-400 text-[#112e1f]'
                        } : {
                          bg: tenantId === 'demo' ? '#f5f5f5' : '#d1e0d3',
                          title: 'text-black',
                          desc: tenantId === 'demo' ? 'text-gray-600' : 'text-[#2d5a3d]',
                          iconBg: tenantId === 'demo' ? 'from-black to-gray-700' : 'from-[#2d5a3d] to-[#112e1f]',
                          badge: tenantId === 'demo' ? 'bg-black/10 text-black border-black/20' : 'bg-[#2d5a3d]/10 text-[#2d5a3d] border-[#2d5a3d]/20',
                          button: tenantId === 'demo' ? 'from-black to-gray-800 hover:from-gray-800 hover:to-black' : 'from-[#2d5a3d] to-[#112e1f] hover:from-[#3a6d4b] hover:to-[#1a3826]',
                          buttonShadow: 'shadow-black/20',
                          countBg: 'bg-black text-white'
                        };

                        return (
                          <div key={formIndex} className="w-full flex-shrink-0 flex items-center justify-center p-3 md:p-4" style={{ width: `${100 / forms.length}%` }}>
                            <div
                              className="group relative backdrop-blur-sm rounded-3xl p-5 md:p-6 transition-all duration-500 overflow-hidden w-full max-w-[320px] mx-auto border border-white/20 shadow-xl hover:shadow-2xl"
                              style={{ backgroundColor: theme.bg }}
                            >
                              {/* Integrated Gradient Glow */}
                              <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl`}></div>

                              {/* Icon Container */}
                              <div className="relative mb-5">
                                <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${theme.iconBg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mx-auto`}>
                                  <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                                </div>
                                <div className={`absolute -top-1 md:-top-2 right-1/4 translate-x-1/2 w-6 h-6 ${theme.countBg} rounded-full flex items-center justify-center shadow-md`}>
                                  <span className="text-xs font-bold">{formIndex + 1}</span>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="text-center">
                                <h3 className={`text-lg md:text-xl font-bold ${theme.title} mb-2 transition-colors relative`}>
                                  {form.title}
                                </h3>
                                <p className={`${theme.desc} mb-5 leading-relaxed relative text-xs md:text-sm h-10 overflow-hidden px-1`}>
                                  {form.description}
                                </p>

                                {/* Feature Badges - Blended */}
                                <div className="flex flex-wrap gap-1.5 md:gap-2 mb-6 relative justify-center">
                                  {form.features.map((feature, idx) => (
                                    <span key={idx} className={`px-2.5 md:px-3 py-1 ${theme.badge} text-[10px] md:text-[11px] font-semibold rounded-full border backdrop-blur-sm tracking-wide`}>
                                      {feature}
                                    </span>
                                  ))}
                                </div>

                                {/* Blended Request Button */}
                                <button
                                  onClick={form.onClick}
                                  className={`relative z-10 w-full bg-gradient-to-r ${theme.button} text-white py-2.5 md:py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${theme.buttonShadow} text-sm md:text-base group/btn`}
                                >
                                  <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
                                  <span className="tracking-wide">Request Now</span>
                                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Navigation Arrows - Improved positioning */}
                    <button
                      onClick={() => {
                        const maxSlide = Math.max(0, forms.length - itemsPerView);
                        setCurrentFormSlide((prev) => (prev - 1 + (maxSlide + 1)) % (maxSlide + 1));
                      }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 backdrop-blur-sm shadow-xl rounded-full flex items-center justify-center transition-all z-20 border opacity-80 hover:opacity-100"
                      style={{ backgroundColor: tenantConfig.primaryColor, borderColor: `${tenantConfig.accentColor}40` }}
                    >
                      <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </button>
                    <button
                      onClick={() => {
                        const maxSlide = Math.max(0, forms.length - itemsPerView);
                        setCurrentFormSlide((prev) => (prev + 1) % (maxSlide + 1));
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 backdrop-blur-sm shadow-xl rounded-full flex items-center justify-center transition-all z-20 border opacity-80 hover:opacity-100"
                      style={{ backgroundColor: tenantConfig.primaryColor, borderColor: `${tenantConfig.accentColor}40` }}
                    >
                      <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </button>
                  </div>

                  {/* Dots Navigation */}
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: forms.length - (itemsPerView - 1) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentFormSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all ${currentFormSlide === index ? 'w-8 shadow-lg' : 'bg-gray-400 hover:bg-gray-500'}`}
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

      {/* Barangay Programs Section - 8 items grid matching reference design */}
      <section className="py-2 md:py-4 bg-white w-full border-t border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">

          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
                Barangay Programs
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 gap-y-6">
            {programs.map((program, idx) => (
              <div 
                key={program.id || idx} 
                className="flex flex-col group cursor-pointer h-full program-card"
                onClick={() => setSelectedProgram(program)}
              >
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-gray-100">
                  <img
                    src={program.image || 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800'}
                    alt={program.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col flex-1 px-1 text-left">
                  <p className="text-[10px] md:text-left font-bold uppercase tracking-widest mb-1" style={{ color: tenantConfig.accentColor }}>
                    {program.category}
                  </p>
                  <h3 className="text-gray-900 text-base md:text-lg font-bold mb-1 leading-snug transition-colors program-title">
                    {program.title}
                  </h3>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed mb-2 flex-1">
                    {program.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Facilities Section */}
      <section id="directory" className="bg-white relative">
        {/* Top Carousel Hero */}
        <div className="relative w-full h-[60vh] min-h-[480px] bg-gray-900 overflow-hidden">
          {facilities.flatMap(f => f.images || []).length > 0 ? (
            facilities
              .flatMap(f => f.images || [])
              .filter((img, i, arr) => arr.indexOf(img) === i)
              .map((img, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${heroCarouselIndex === index ? 'opacity-100' : 'opacity-0'}`}
                >
                  <img
                    src={img}
                    alt={`Facility slide ${index + 1}`}
                    className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.6)' }}
                  />
                </div>
              ))
          ) : (
            <img
              src="https://images.unsplash.com/photo-1541188495357-ad2ce61fa0ca?auto=format&fit=crop&q=80&w=2000"
              alt="Facilities Hero"
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.6)' }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* Right-aligned Content */}
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-4xl ml-auto items-end text-right">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 mb-4 w-fit">
              <div className="flex items-center gap-2 px-4 py-1.5 backdrop-blur-sm rounded-full border border-white/20" style={{ backgroundColor: `${tenantConfig.accentColor}33`, borderColor: `${tenantConfig.accentColor}80` }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: tenantConfig.accentColor }} />
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: tenantConfig.accentColor }}>Kalidad na Garantisado</span>
              </div>
            </div>

            {/* Main Heading */}
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-4 tracking-tight">
              Ang inyong mga<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to left, ${tenantConfig.accentColor}, #FFFFFF)` }}>
                pasilidad
              </span>
              {' '}sa komunidad
            </h2>

            {/* Sub-line */}
            <p className="text-white/70 text-base md:text-lg font-medium mb-6 max-w-lg leading-relaxed">
              na inaalagaan sa paraang nararapat para sa bawat mamamayan.
            </p>

            {/* Decorative Rule */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-0.5 opacity-40" style={{ backgroundColor: tenantConfig.accentColor }} />
              <div className="w-3 h-3 border-2 rotate-45" style={{ borderColor: tenantConfig.accentColor }} />
              <div className="w-16 h-0.5" style={{ backgroundColor: tenantConfig.accentColor }} />
            </div>
          </div>

          {/* Carousel Arrows */}
          <button
            onClick={() => {
              const totalImages = facilities.flatMap(f => f.images || []).filter((img, i, arr) => arr.indexOf(img) === i).length || 1;
              setHeroCarouselIndex(prev => (prev === 0 ? totalImages - 1 : prev - 1));
            }}
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white transition-all duration-300 cursor-pointer z-10 backdrop-blur-sm"
            style={{ hover: { backgroundColor: tenantConfig.accentColor } }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              const totalImages = facilities.flatMap(f => f.images || []).filter((img, i, arr) => arr.indexOf(img) === i).length || 1;
              setHeroCarouselIndex(prev => (prev === totalImages - 1 ? 0 : prev + 1));
            }}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white transition-all duration-300 cursor-pointer z-10 backdrop-blur-sm"
            style={{ hover: { backgroundColor: tenantConfig.accentColor } }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>


        </div>

        <div className="py-4 md:py-6">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Facilities Grid */}
            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
                {facilities.map((facility, index) => (
                  <div
                    key={index}
                    className="flex flex-col group bg-white transition-all duration-300 cursor-pointer"
                    onClick={() => {
                      setSelectedFacility(facility);
                      setFacilityImageIndex(0);
                    }}
                  >
                    <div className="w-full h-48 mb-3 overflow-hidden">
                      <img
                        src={(facility.images && facility.images.length > 0) ? facility.images[0] : '/background.jpg'}
                        alt={facility.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="px-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 leading-snug transition-colors" style={{ groupHover: { color: tenantConfig.accentColor } }}>{facility.name}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                        {facility.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Barangay Achievement and Awards Section */}
      <section id="achievements" className={`py-10 md:py-16 bg-gradient-to-br ${tenantConfig.darkHeader} relative overflow-hidden flex items-center animate-on-scroll`}>
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 md:w-96 md:h-96 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 md:w-96 md:h-96 bg-[#be9f56]/30 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* Elegant Abstract Background Image */}
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/background.jpg)',
              filter: 'grayscale(1) contrast(1.5)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b] via-transparent to-[#1e1b4b]"></div>
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto">

            {/* Section Header */}
            <div className="text-center mb-8 md:mb-10">
              <div className="flex justify-center mb-3 md:mb-4">
                <div className={`inline-flex items-center gap-3 px-6 py-2.5 backdrop-blur-sm border rounded-full shadow-lg ${tenantId === 'demo' ? 'bg-black/60 border-white/20' : 'bg-[#113821]/40 border-[#d4af37]/30'}`}>
                  <Award className="w-5 h-5 md:w-6 md:h-6 text-[#d4af37]" />
                  <span className="text-[#ebd78c] font-semibold text-sm md:text-base tracking-widest uppercase">Honors & Recognitions</span>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight font-serif tracking-tight">
                BARANGAY{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500">
                  ACHIEVEMENTS
                </span>
                <br className="hidden md:block" /> & AWARDS
              </h2>

              <div className="flex justify-center mb-3">
                <div className="w-24 md:w-32 h-1.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full opacity-70"></div>
              </div>

              <p className={`text-lg md:text-xl font-light leading-relaxed max-w-3xl mx-auto ${tenantId === 'demo' ? 'text-gray-300' : 'text-green-100/80'}`}>
                Celebrating our shared milestones, exemplary performance, and outstanding service to the community.
              </p>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10">
              {achievements.map((achievement, idx) => (
                <div
                  key={achievement.id || idx}
                  onClick={() => setSelectedAchievement(achievement)}
                  className={`cursor-pointer backdrop-blur-md rounded-2xl border transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col hover:-translate-y-2 ${
                    tenantId === 'demo'
                    ? 'bg-black/60 border-white/10 hover:bg-black/80 hover:border-[#d4af37]/50'
                    : 'bg-[#0a1f12]/60 border-[#d4af37]/20 hover:bg-[#113821]/60 hover:border-[#d4af37]/50'
                  }`}
                >
                  <div className="relative h-48 md:h-56 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-[#0f2e1b]/30 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                    <img
                      src={achievement.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800'}
                      alt={achievement.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    />
                    <div className={`absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent z-10 ${tenantId === 'demo' ? 'from-black' : 'from-[#081a0f]'}`}></div>
                    {/* Floating Badge */}
                    <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#0a1f12] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                      <Award className="w-4 h-4" />
                      {achievement.year}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col relative z-20 -mt-10">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#ebd78c] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] border-2 border-[#0a1f12] mr-4 group-hover:scale-110 transition-transform duration-300 shrink-0">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-[#d4af37] text-[10px] md:text-xs font-bold tracking-widest uppercase mb-0.5">{achievement.category}</p>
                        <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-[#d4af37] transition-colors line-clamp-2 leading-tight">{achievement.title}</h3>
                      </div>
                    </div>
                    <p className="text-[#ebd78c]/80 leading-relaxed text-sm flex-1 pt-3 border-t border-[#d4af37]/20 mt-1">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-8 bg-[#113821]/20 backdrop-blur-sm p-6 md:p-8 rounded-3xl border border-[#d4af37]/20">
              <div className="text-center p-4">
                <div className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 mb-2">12+</div>
                <div className={`${tenantId === 'demo' ? 'text-gray-400' : 'text-green-100/80'} text-xs md:text-sm font-bold uppercase tracking-widest`}>Major Awards</div>
              </div>
              <div className="text-center p-4 border-l border-[#d4af37]/20">
                <div className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 mb-2">100%</div>
                <div className={`${tenantId === 'demo' ? 'text-gray-400' : 'text-green-100/80'} text-xs md:text-sm font-bold uppercase tracking-widest`}>Transparency</div>
              </div>
              <div className="text-center p-4 border-t md:border-t-0 md:border-l border-[#d4af37]/20">
                <div className="text-3xl md:text-4xl font-extrabold text-white mb-2">Top 5</div>
                <div className={`${tenantId === 'demo' ? 'text-gray-400' : 'text-green-100/80'} text-xs md:text-sm font-bold uppercase tracking-widest`}>City Ranking</div>
              </div>
              <div className="text-center p-4 border-l border-t md:border-t-0 border-[#d4af37]/20">
                <div className="text-3xl md:text-4xl font-extrabold text-white mb-2">A+</div>
                <div className={`${tenantId === 'demo' ? 'text-gray-400' : 'text-green-100/80'} text-xs md:text-sm font-bold uppercase tracking-widest`}>Audit Rating</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Achievement Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md" onClick={() => setSelectedAchievement(null)}>
          <div className="bg-[#0a1f12] border border-[#d4af37]/20 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative transform transition-all" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedAchievement(null)} className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-red-500 transition-colors backdrop-blur-md">
              <X className="w-6 h-6" />
            </button>
            <div className="relative h-64 sm:h-80 lg:h-[450px] w-full group overflow-hidden">
              <div className="absolute inset-0 bg-[#113821]/20 z-10"></div>
              <img src={selectedAchievement.image} alt={selectedAchievement.title} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#081a0f] to-transparent z-10"></div>
              <div className={`absolute top-6 left-6 z-20 bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#0a1f12] text-white text-sm md:text-base font-bold px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-md`}>
                <Award className="w-5 h-5" />
                {selectedAchievement.year}
              </div>
            </div>
            <div className="p-8 md:p-10 relative z-20 -mt-10 md:-mt-16 bg-[#0a1f12]/90 backdrop-blur-xl border-t border-[#d4af37]/30">
              <div className="mb-4">
                <p className={` text-sm md:text-base font-bold tracking-widest uppercase mb-2`}>{selectedAchievement.category}</p>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">{selectedAchievement.title}</h3>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedProgram(null)}>
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden relative transform transition-all flex flex-col md:flex-row h-full max-h-[90vh] md:max-h-[80vh]" onClick={e => e.stopPropagation()}>

            {/* Left Column: Fixed Image on Desktop */}
            <div className="relative w-full md:w-[45%] h-64 md:h-full group overflow-hidden shrink-0">
              <img src={selectedProgram.image} alt={selectedProgram.title} className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

              {/* Floating Category Badge */}
              <div className="absolute top-6 left-6 z-20 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl uppercase tracking-[0.2em]">
                <Target className="w-4 h-4 text-green-400" />
                {selectedProgram.category}
              </div>

              {/* Mobile Close Button */}
              <button onClick={() => setSelectedProgram(null)} className="md:hidden absolute top-4 right-4 z-30 w-10 h-10 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10">
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
                      <div className="w-8 h-1 bg-green-600 rounded-full"></div>
                      <p className="text-green-700 font-black text-[10px] tracking-[0.4em] uppercase">PROGRAM PORTFOLIO</p>
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
                      className="w-full sm:w-auto px-10 py-4 bg-[#112117] text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl hover:shadow-green-900/20 text-sm flex items-center justify-center gap-3 group"
                    >
                      <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      BACK TO PORTAL
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Authenticated by</p>
                            <p className="text-xs font-black text-gray-900 uppercase">Barangay Secretariat</p>
                        </div>
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-green-600" />
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
        isDemo={tenantId === 'demo'}
      />

      {/* Certificate of Indigency Modal */}
      <IndigencyCertificateModal
        isOpen={showIndigencyModal}
        onClose={() => setShowIndigencyModal(false)}
        isDemo={tenantId === 'demo'}
      />

      {/* Barangay Residency Modal */}
      <ResidencyCertificateModal
        isOpen={showResidencyModal}
        onClose={() => setShowResidencyModal(false)}
        isDemo={tenantId === 'demo'}
      />

      {/* Business Permit Modal */}
      <BusinessPermitModal
        isOpen={showBusinessPermitModal}
        onClose={() => setShowBusinessPermitModal(false)}
        isDemo={tenantId === 'demo'}
      />

      {/* Educational Assistance Modal */}
      <EducationalAssistanceModal
        isOpen={showEducationalAssistanceModal}
        onClose={() => setShowEducationalAssistanceModal(false)}
        isDemo={tenantId === 'demo'}
      />

      {/* Natural Death Certificate Modal */}
      <NaturalDeathCertificateModal isOpen={showNaturalDeathModal} onClose={() => setShowNaturalDeathModal(false)} isDemo={tenantId === 'demo'} />
      <GuardianshipCertificateModal isOpen={showGuardianshipModal} onClose={() => setShowGuardianshipModal(false)} isDemo={tenantId === 'demo'} />
      <CohabitationCertificateModal isOpen={showCohabitationModal} onClose={() => setShowCohabitationModal(false)} isDemo={tenantId === 'demo'} />
      <MedicoLegalModal isOpen={showMedicoLegalModal} onClose={() => setShowMedicoLegalModal(false)} isDemo={tenantId === 'demo'} />
      <SamePersonCertificateModal isOpen={showSamePersonModal} onClose={() => setShowSamePersonModal(false)} isDemo={tenantId === 'demo'} />




      {/* Barangay Officials Section - Optimized */}
      {visibilitySettings?.section !== false && (
        <section id="officials" className={`relative overflow-hidden transition-colors duration-500 bg-gradient-to-br ${tenantId === 'demo' ? 'from-black via-gray-950 to-black' : 'from-[#112e1f] via-[#1a3d29] to-[#0d1f14]'}`}>
        {/* Photo - Full visibility without overlay */}
        <div className="relative">
          <img
            src={heroSettings?.image || ''}
            alt={heroSettings?.title || "Barangay Officials"}
            className="w-full h-auto md:h-[400px] lg:h-[500px] xl:h-[600px] md:object-cover bg-gray-800"
            onError={(e) => {
              e.target.src = '';
            }}
          />
          {/* Edge Shadow Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 hidden md:block" style={{ boxShadow: `inset 0 0 150px 60px ${tenantId === 'demo' ? '#000000' : '#112e1f'}` }}></div>
        </div>

        {/* Text Section - Professional Leadership Introduction */}
        <div className={`py-4 md:py-6 px-4 bg-gradient-to-br ${tenantId === 'demo' ? 'from-black via-gray-900 to-black' : 'from-[#112117] via-[#2d5a3d] to-[#112e1f]'}`}>
          <div className="max-w-[1400px] mx-auto">
            {/* Leadership Header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tenantConfig.accentColor }}></div>
                <span className="text-white font-semibold text-[10px] tracking-wide uppercase">Leadership Team</span>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tenantConfig.accentColor }}></div>
              </div>

              <h4 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 leading-none uppercase tracking-tight">
                {tenantConfig.name}
                <span className="block text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${tenantConfig.accentColor}, #ebd78c, ${tenantConfig.accentColor})` }}>
                  Leadership Team
                </span>
              </h4>

              <div className="w-24 h-1 mx-auto mb-3 rounded-full" style={{ backgroundImage: `linear-gradient(to right, transparent, ${tenantConfig.accentColor}, transparent)` }}></div>

              <p className="text-lg md:text-xl text-white/90 font-light leading-relaxed max-w-2xl mx-auto">
                Working together for our community's progress and development
              </p>
            </div>
          </div>
        </div>

        {/* Officials Details Section */}
        <div className="bg-gradient-to-br from-gray-50 to-green-50 py-4 md:py-8 px-4">
          <div className="max-w-[1400px] mx-auto">
            {/* Section Header */}
            <div className="text-center mb-4">
              <h5 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 uppercase tracking-tighter">
                Meet Our <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${tenantId === 'demo' ? '#1a1a1a' : '#064e3b'}, ${tenantId === 'demo' ? tenantConfig.accentColor : '#065f46'})` }}>Officials</span>
              </h5>
              <p className="text-gray-600 text-sm md:text-base font-bold max-w-2xl mx-auto uppercase tracking-[0.2em] leading-relaxed">
                Dedicated leaders committed to serving the community of {tenantConfig.shortName} with integrity and excellence
              </p>
            </div>

            {/* Officials Segregated by Position */}
            {officials.length > 0 ? (
              <div className="space-y-8">
                {(() => {
                  // Helper to filter by visibility
                  const filteredOfficials = officials.filter(o => {
                    if (!visibilitySettings) return true;
                    const { position_type, position } = o;

                    if (position_type === 'captain') return visibilitySettings.chairman !== false;
                    if (position_type === 'secretary') return visibilitySettings.secretary !== false;
                    if (position_type === 'treasurer') return visibilitySettings.treasurer !== false;
                    if (position_type === 'sk_chairman') return visibilitySettings.skChairman !== false;
                    if (position_type === 'sk_secretary') return visibilitySettings.skSecretary !== false;
                    if (position_type === 'sk_treasurer') return visibilitySettings.skTreasurer !== false;

                    if (position_type === 'sk_kagawad') {
                      const match = position.match(/SK Kagawad\s+(\d+)/i);
                      if (match) {
                        const idx = parseInt(match[1], 10) - 1;
                        return visibilitySettings.skKagawads?.[idx] !== false;
                      }
                    }

                    if (position_type === 'kagawad') {
                      const match = position.match(/Kagawad\s+(\d+)/i);
                      if (match) {
                        const idx = parseInt(match[1], 10) - 1;
                        return visibilitySettings.councilors?.[idx] !== false;
                      }
                    }

                    if (position === 'Administrator') return visibilitySettings.administrator !== false;
                    if (position === 'Assistant Secretary') return visibilitySettings.assistantSecretary !== false;
                    if (position === 'Assistant Administrator') return visibilitySettings.assistantAdministrator !== false;
                    if (position === 'Barangay Keeper' || position === 'Record Keeper') return visibilitySettings.recordKeeper !== false;
                    if (position === 'Clerk') return visibilitySettings.clerk !== false;

                    return true;
                  });

                  // Group officials by position type
                  const groupedOfficials = {
                    captain: filteredOfficials.filter(o => o.position_type === 'captain'),
                    kagawad: filteredOfficials.filter(o => o.position_type === 'kagawad'),
                    secretary: filteredOfficials.filter(o => o.position_type === 'secretary'),
                    treasurer: filteredOfficials.filter(o => o.position_type === 'treasurer'),
                    sk_chairman: filteredOfficials.filter(o => o.position_type === 'sk_chairman'),
                    sk_secretary: filteredOfficials.filter(o => o.position_type === 'sk_secretary'),
                    sk_treasurer: filteredOfficials.filter(o => o.position_type === 'sk_treasurer'),
                    sk_kagawad: filteredOfficials.filter(o => o.position_type === 'sk_kagawad'),
                    staff: filteredOfficials.filter(o => !['captain', 'kagawad', 'secretary', 'treasurer', 'sk_chairman', 'sk_secretary', 'sk_treasurer', 'sk_kagawad'].includes(o.position_type))
                  };

                  const sections = [
                    {
                      key: 'captain',
                      title: 'Barangay Captain',
                      subtitle: 'Chief Executive Officer',
                      officials: groupedOfficials.captain,
                      bgColor: tenantId === 'demo' ? 'from-black to-gray-950' : 'from-[#112e1f] to-[#2d5a3d]',
                      icon: '👑'
                    },
                    {
                      key: 'kagawad',
                      title: 'Barangay Kagawad',
                      subtitle: 'Council Members, Secretary, and Treasurer',
                      officials: [...groupedOfficials.kagawad, ...groupedOfficials.secretary, ...groupedOfficials.treasurer],
                      bgColor: tenantId === 'demo' ? 'from-gray-900 to-black' : 'from-green-600 to-emerald-700',
                      icon: '🏛️'
                    },
                    {
                      key: 'sk_chairman',
                      title: 'SK Chairman',
                      subtitle: 'Youth Representative',
                      officials: groupedOfficials.sk_chairman,
                      bgColor: tenantId === 'demo' ? 'from-black to-gray-800' : 'from-emerald-600 to-green-700',
                      icon: '🌟'
                    },
                    {
                      key: 'sk_kagawad',
                      title: 'SK Council',
                      subtitle: 'Youth Council Secretary, Treasurer, and Members',
                      officials: [], // Will be populated in the logic below
                      bgColor: tenantId === 'demo' ? 'from-gray-700 to-black' : 'from-orange-500 to-amber-600',
                      icon: '⚡'
                    },
                    {
                      key: 'staff',
                      title: 'Barangay Staff',
                      subtitle: 'Administrative Team',
                      officials: groupedOfficials.staff,
                      bgColor: tenantId === 'demo' ? 'from-gray-600 to-gray-900' : 'from-teal-600 to-green-700',
                      icon: '👥'
                    }
                  ];

                  return sections.map((section) => {
                    // Special case for SK Council: Combine Secretary, Treasurer, and Kagawads
                    let displayOfficials = section.officials;
                    if (section.key === 'sk_kagawad') {
                      displayOfficials = [
                        ...groupedOfficials.sk_kagawad,
                        ...groupedOfficials.sk_secretary,
                        ...groupedOfficials.sk_treasurer
                      ];
                    }

                    if (displayOfficials.length === 0) return null;

                    return (
                      <div key={section.key} className="mb-10">
                        {section.key === 'staff' && (
                          <div className="text-center mb-6">
                            <div className={`inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r ${section.bgColor} text-white rounded-full mb-4 shadow-lg`}>
                              <span className="text-2xl">{section.icon}</span>
                              <span className="font-bold text-lg tracking-wide">{section.title.toUpperCase()}</span>
                            </div>
                            <p className="text-gray-600 text-lg font-medium">{section.subtitle}</p>
                          </div>
                        )}

                        {/* Officials Layout Wrapper */}
                        <div className={(section.key === 'captain' || section.key === 'sk_chairman') ? "max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 px-4 mb-12" : "flex flex-wrap gap-4 lg:gap-5 justify-center"}>
                          {section.key === 'captain' ? (
                            <>
                              {/* Left Aligned Captain Card */}
                              <div className="w-full lg:w-[380px] flex-shrink-0 mx-auto">
                                {displayOfficials.map((official, index) => {
                                  const colorClass = tenantId === 'demo' ? 'from-black to-gray-800' : 'from-green-800 to-green-950';
                                  const initials = official.name.split(' ').slice(0, 2).map(n => n[0]).join('');
                                  return (
                                    <div key={official.id || index} className={`bg-white rounded-[40px] shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 group w-full transform hover:-translate-y-2 ${tenantId === 'demo' ? 'hover:shadow-black/20' : 'hover:shadow-green-900/20'}`}>
                                      <div className="relative aspect-[4/5] overflow-hidden group bg-white">
                                        {official.image_url ? (
                                          <img src={official.image_url} alt={official.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 relative z-10" />
                                        ) : (
                                          <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                                            <span className="text-7xl font-bold text-white tracking-widest opacity-30 group-hover:opacity-50 transition-opacity font-serif">{initials}</span>
                                          </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t flex flex-col justify-end p-8 text-center z-20 h-1/2" style={{ backgroundImage: `linear-gradient(to top, ${tenantId === 'demo' ? '#000000' : '#112e1f'}, ${tenantId === 'demo' ? 'rgba(0,0,0,0.4)' : 'rgba(17,46,31,0.4)'}, transparent)` }}>
                                          <h3 className="text-white font-black text-2xl mb-1 drop-shadow-lg tracking-tight">Punong Barangay</h3>
                                        </div>
                                      </div>
                                      <div className="p-8 text-center bg-white">
                                        <h4 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">{official.name}</h4>
                                        <p className="text-gray-600 text-base font-medium leading-relaxed italic line-clamp-3">
                                          {official.description || `Leading ${tenantConfig.shortName} with vision, integrity, and a heartfelt commitment to serve every constituent with excellence.`}
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
                                    <h3 className="text-3xl font-black text-gray-900 tracking-widest uppercase mb-3">Barangay Vision</h3>
                                    <p className="text-gray-700 text-xl font-medium leading-relaxed italic border-l-4 pl-6 py-2" style={{ borderColor: tenantConfig.accentColor }}>
                                      {`"A model community that is progressive, peaceful, and disaster-resilient, where empowered citizens live in harmony with nature and participate in transparent local governance."`}
                                    </p>
                                  </div>
                                  <div>
                                    <h3 className="text-3xl font-black text-gray-900 tracking-widest uppercase mb-3">Barangay Goal</h3>
                                    <p className="text-gray-700 text-xl font-medium leading-relaxed border-l-4 pl-6 py-2" style={{ borderColor: tenantConfig.primaryColor }}>
                                      {`"To deliver dedicated public service through innovative social programs, sustainable infrastructure, and community-driven initiatives that uplift the dignity and prosperity of every resident."`}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : section.key === 'sk_chairman' ? (
                            <>
                              {/* Left Aligned Plain SK Goal & Vision */}
                              <div className="flex-grow space-y-6 order-2 lg:order-1">
                                <div className="px-4 py-8">
                                  <div className="mb-6">
                                    <h3 className="text-3xl font-black text-gray-900 tracking-widest uppercase mb-3">SK Vision</h3>
                                    <p className="text-gray-700 text-xl font-medium leading-relaxed italic border-l-4 pl-6 py-2" style={{ borderColor: tenantId === 'demo' ? tenantConfig.accentColor : '#f97316' }}>
                                      {`"An inspired youth community of ${tenantConfig.shortName} that is actively involved in community building, advocating for education, sports, and social responsibility while maintaining the highest level of integrity."`}
                                    </p>
                                  </div>
                                  <div>
                                    <h3 className="text-3xl font-black text-gray-900 tracking-widest uppercase mb-3">SK Goal</h3>
                                    <p className="text-gray-700 text-xl font-medium leading-relaxed border-l-4 pl-6 py-2" style={{ borderColor: tenantId === 'demo' ? tenantConfig.primaryColor : '#ea580c' }}>
                                      {`"To empower the youth through comprehensive development programs in leadership, environment, and wellness, ensuring every young resident has the opportunity to contribute to our barangay's future."`}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Right Aligned SK Chairman Card */}
                              <div className="w-full lg:w-[380px] flex-shrink-0 order-1 lg:order-2">
                                {displayOfficials.map((official, index) => {
                                  const colorClass = 'from-orange-600 to-amber-700';
                                  const initials = official.name.split(' ').slice(0, 2).map(n => n[0]).join('');
                                  return (
                                    <div key={official.id || index} className={`bg-white rounded-[40px] shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 group w-full transform hover:-translate-y-2 ${tenantId === 'demo' ? 'hover:shadow-black/20' : 'hover:shadow-orange-900/20'}`}>
                                      <div className="relative aspect-[4/5] overflow-hidden group bg-white">
                                        {official.image_url ? (
                                          <img src={official.image_url} alt={official.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 relative z-10" />
                                        ) : (
                                          <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                                            <span className="text-7xl font-bold text-white tracking-widest opacity-30 group-hover:opacity-50 transition-opacity font-serif">{initials}</span>
                                          </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t flex flex-col justify-end p-8 text-center z-20 h-1/2" style={{ backgroundImage: `linear-gradient(to top, ${tenantId === 'demo' ? '#000000' : '#831a1a'}, ${tenantId === 'demo' ? 'rgba(0,0,0,0.4)' : 'rgba(131,26,26,0.4)'}, transparent)` }}>
                                          <h3 className="text-white font-black text-2xl mb-1 drop-shadow-lg tracking-tight">SK Chairman</h3>
                                        </div>
                                      </div>
                                      <div className="p-8 text-center bg-white">
                                        <h4 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">{official.name}</h4>
                                        <p className="text-gray-600 text-base font-medium leading-relaxed italic line-clamp-3">
                                          {official.description || `Empowering the youth of ${tenantConfig.shortName} through active participation, leadership development, and community-driven initiatives.`}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            displayOfficials.map((official, index) => {
                              const colors = tenantId === 'demo' ? [
                                'from-gray-800 to-gray-900',
                                'from-gray-700 to-gray-800',
                                'from-gray-600 to-gray-700',
                                'from-black to-gray-900',
                                'from-gray-900 to-black',
                                'from-gray-500 to-gray-600'
                              ] : [
                                'from-[#112e1f] to-[#2d5a3d]',
                                'from-teal-600 to-green-700',
                                'from-emerald-600 to-green-700',
                                'from-[#2d5a3d] to-emerald-800',
                                'from-green-600 to-emerald-700',
                                'from-teal-500 to-emerald-600',
                                'from-[#112117] to-green-900',
                                'from-emerald-700 to-teal-800',
                                'from-green-700 to-emerald-900',
                                'from-[#2d5a3d] to-teal-700',
                                'from-emerald-500 to-green-600',
                                'from-teal-400 to-emerald-500',
                                'from-green-500 to-teal-600'
                              ];
                              let colorClass;
                              if (section.key === 'kagawad') colorClass = colors[index % colors.length];
                              else if (section.key === 'sk_secretary') colorClass = tenantId === 'demo' ? 'from-gray-800 to-black' : 'from-orange-500 to-amber-600';
                              else if (section.key === 'sk_treasurer') colorClass = tenantId === 'demo' ? 'from-black to-gray-800' : 'from-amber-600 to-orange-500';
                              else if (section.key === 'sk_kagawad') colorClass = tenantId === 'demo' ? 'from-gray-700 to-gray-900' : 'from-amber-500 to-orange-600';
                              else colorClass = colors[(index + 8) % colors.length];

                              const initials = official.name.split(' ').slice(0, 2).map(n => n[0]).join('');
                              const widthClass = 'w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)] lg:w-[calc(20%-1rem)]';
                              return (
                                <div key={official.id || index} className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group ${widthClass}`}>
                                  <div className="relative aspect-square overflow-hidden group bg-white">
                                    {official.image_url ? (
                                      <img src={official.image_url} alt={official.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 relative z-10" />
                                    ) : (
                                      <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                                        <span className="text-5xl font-bold text-white tracking-widest opacity-30 group-hover:opacity-50 transition-opacity">{initials}</span>
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t flex flex-col justify-end p-6 text-center z-20" style={{ backgroundImage: `linear-gradient(to top, ${tenantId === 'demo' ? '#000000E6' : '#112e1fE6'}, ${tenantId === 'demo' ? '#00000066' : '#112e1f66'}, transparent)` }}>
                                      <h3 className="text-white font-bold text-xl mb-1 drop-shadow-lg">
                                        {(() => {
                                          const pos = official.position || '';
                                          if (pos.includes('SK Kagawad')) return 'SK Kagawad';
                                          if (pos.includes('Kagawad')) return 'Brgy. Kagawad';
                                          if (['Secretary', 'Treasurer', 'Administrator', 'Clerk', 'Record Keeper'].includes(pos)) return `Brgy. ${pos}`;
                                          if (pos === 'Barangay Keeper') return 'Brgy. Record Keeper';
                                          if (['Assistant Secretary', 'Assistant Administrator'].includes(pos)) return pos.replace('Assistant', 'Asst. Brgy.');
                                          return pos;
                                        })()}
                                      </h3>
                                      {official.committee && (
                                        <p className={`text-sm font-medium drop-shadow-md ${tenantId === 'demo' ? 'text-gray-300' : 'text-green-300'}`}>{official.committee}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="p-6">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{official.name}</h4>
                                    <p className="text-gray-600 text-sm leading-relaxed">{official.description}</p>
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

      <section id="contact" className={`py-8 bg-gradient-to-br ${tenantConfig.darkBackground}`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-white mb-1">Feel free to contact us</h2>
            <p className={`text-base italic ${tenantId === 'demo' ? 'text-gray-400' : 'text-green-400'}`}>Wag mahiya at kami ay inyong tanungin</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-5 shadow-xl h-full">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Juan"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Dela Cruz"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email / Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="juan@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone / Numero ng Telepono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="09XX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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
              <div className={`backdrop-blur-sm rounded-2xl p-8 border flex-1 ${tenantId === 'demo' ? 'bg-black/80 border-white/10' : 'bg-green-950/50 border-green-800/50'}`}>
                <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: tenantConfig.primaryColor }}>
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className={tenantId === 'demo' ? 'text-gray-300' : 'text-green-200'}>{tenantConfig.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: tenantConfig.secondaryColor }}>
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className={tenantId === 'demo' ? 'text-gray-300' : 'text-green-200'}>(044) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: tenantConfig.secondaryColor }}>
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Email</p>
                      <p className={tenantId === 'demo' ? 'text-gray-300' : 'text-green-200'}>{tenantId === 'demo' ? 'contact@brgydesk.com' : 'ibaoeste@calumpit.gov.ph'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10" style={{ borderColor: `${tenantConfig.secondaryColor}40` }}>
                <h3 className="text-xl font-bold text-white mb-4">Office Hours</h3>
                <div className={`space-y-2 ${tenantId === 'demo' ? 'text-gray-300' : 'text-green-200'}`}>
                  <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                  <p>Saturday: 8:00 AM - 12:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Emergency Hotlines */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 h-full" style={{ borderColor: `${tenantConfig.secondaryColor}40` }}>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                Emergency Hotlines
              </h3>
              <div className="space-y-4">
                {hotlines.map((hotline, index) => (
                  <div key={index} className="flex items-start gap-4 group">
                    <div className="p-3 rounded-lg group-hover:opacity-80 transition-colors" style={{ backgroundColor: tenantId === 'demo' ? '#4a4a4a' : '#991b1b' }}>
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{hotline.name}</p>
                      <a
                        href={`tel:${hotline.number}`}
                        className={`transition-colors text-xl font-bold ${tenantId === 'demo' ? 'text-gray-300 hover:text-white' : 'text-green-200 hover:text-white'}`}
                      >
                        {hotline.number}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-white/10 rounded-xl text-center border border-white/10">
                <p className={`${tenantId === 'demo' ? 'text-gray-400' : 'text-green-300'} text-[10px] font-bold tracking-widest mb-1 uppercase`}>Available 24/7</p>
                <p className="text-white font-bold">READY TO RESPOND</p>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* Emergency Hotlines - Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {showHotlines && (
          <div className="mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80 animate-fade-in">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Emergency Hotlines
            </h4>
            <div className="space-y-3">
              {hotlines.map((hotline, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{hotline.name}</span>
                  <a
                    href={`tel:${hotline.number}`}
                    className={`font-semibold transition-colors ${tenantId === 'demo' ? 'text-gray-900 hover:text-[#C9A84C]' : 'text-green-700 hover:text-green-800'}`}
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
          className={`${showHotlines ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700 animate-pulse'
            } text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110`}
        >
          {showHotlines ? <X className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
          will-change: opacity, transform;
        }

        .animate-on-scroll.active {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes pulse-light {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
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
        .animate-on-scroll:nth-child(1) { transition-delay: 0.1s; }
        .animate-on-scroll:nth-child(2) { transition-delay: 0.2s; }
        .animate-on-scroll:nth-child(3) { transition-delay: 0.3s; }
        .animate-on-scroll:nth-child(4) { transition-delay: 0.4s; }
        .animate-on-scroll:nth-child(5) { transition-delay: 0.5s; }
        .animate-on-scroll:nth-child(6) { transition-delay: 0.6s; }
        .animate-on-scroll:nth-child(7) { transition-delay: 0.7s; }
        .animate-on-scroll:nth-child(8) { transition-delay: 0.8s; }
      `}</style>

      {/* Coming Soon Modal */}
      {
        showComingSoonModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-white/20 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundImage: `linear-gradient(to right, ${tenantConfig.accentColor}, ${tenantConfig.primaryColor})` }}></div>

              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: `${tenantConfig.accentColor}20` }}>
                <Clock className="w-10 h-10 animate-pulse" style={{ color: tenantConfig.accentColor }} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon!</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We are currently finalizing this online service to serve you better. Please visit the Barangay Hall for manual processing in the meantime.
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
              <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full -z-10 opacity-50" style={{ backgroundColor: `${tenantConfig.accentColor}10` }}></div>
            </div>
          </div>
        )
      }

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
                const images = selectedFacility.images || ['/background.jpg'];
                return (
                  <>
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-500 ease-in-out flex items-center justify-center ${facilityImageIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                      >
                        <img
                          src={img}
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
                            setFacilityImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 flex items-center justify-center text-white rounded-full backdrop-blur-sm transition-colors border border-white/20 opacity-0 group-hover:opacity-100 mx-2 z-50 cursor-pointer hover:opacity-100"
                          style={{ hover: { backgroundColor: tenantConfig.accentColor } }}
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFacilityImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 flex items-center justify-center text-white rounded-full backdrop-blur-sm transition-colors border border-white/20 opacity-0 group-hover:opacity-100 mx-2 z-50 cursor-pointer hover:opacity-100"
                          style={{ hover: { backgroundColor: tenantConfig.accentColor } }}
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
              <img
                src={selectedNewsItem.image || '/background.jpg'}
                alt={selectedNewsItem.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow" style={{ backgroundColor: tenantConfig.secondaryColor }}>
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
                  <Shield className="w-4 h-4" style={{ color: tenantConfig.accentColor }} />
                  <span>Barangay {tenantConfig.shortName} — Official Announcement</span>
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
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
