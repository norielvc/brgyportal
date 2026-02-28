import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Menu, X, ChevronRight, ChevronLeft, Plus, Send, Phone, MapPin, Mail,
  Clock, Sun, Moon, Cloud, CloudRain, Users, FileText, Award, Building2, Heart, Baby,
  AlertTriangle, Shield, Home, Calendar, TrendingUp, CheckCircle, GraduationCap, User,
  Store, Briefcase, Stethoscope, Fingerprint, UserPlus, Flower2, Search, Star, Leaf, Laptop
, Trophy } from 'lucide-react';
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

export default function BarangayPortal() {
  // Version Check Log
  useEffect(() => {
    console.log('🚀 Barangay Portal Loaded: Version 2.1 (Synced Officials)');
  }, []);

  const router = useRouter();
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
  const [currentFormSlide, setCurrentFormSlide] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', message: ''
  });
  const [itemsPerView, setItemsPerView] = useState(3);

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
      description: 'Certificate confirming your residence in Iba O\' Este for various requirements.',
      icon: Home,
      color: 'orange',
      features: ['Proof', 'Enrollment', 'ID'],
      onClick: () => setShowResidencyModal(true)
    },
    {
      title: 'Business Permit',
      description: 'Official permit to operate a business within Iba O\' Este barangay jurisdiction.',
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
    setShowEducationalAssistanceModal
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
        newItemsPerView = 3;
      }
      setItemsPerView(newItemsPerView);
      setCurrentFormSlide(prev => Math.min(prev, forms.length - (newItemsPerView - 1)));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [forms.length]);

  // Default events (fallback)
  const defaultNewsItems = [
    {
      title: 'Barangay Clean-Up Drive 2026',
      description: 'Join us this Saturday for our monthly community clean-up initiative. Together, we can keep Iba O\' Este beautiful!',
      image: '/background.jpg',
      date: 'January 5, 2026'
    },
    {
      title: 'Free Medical Mission',
      description: 'Free check-ups, medicines, and health consultations for all residents. Bring your Barangay ID.',
      image: '/background.jpg',
      date: 'January 10, 2026'
    },
    {
      title: 'Livelihood Training Program',
      description: 'Register now for free skills training in food processing, handicrafts, and more!',
      image: '/background.jpg',
      date: 'January 15, 2026'
    }
  ];

  const [newsItems, setNewsItems] = useState(defaultNewsItems);

  // Default facilities (fallback)
  const defaultFacilities = [
    {
      name: 'Health Center',
      icon: Heart,
      description: 'Primary healthcare services for residents',
      color: 'bg-red-500',
      images: ['/background.jpg', '/background.jpg', '/background.jpg'],
      features: ['Free Checkups', 'Vaccination', 'First Aid']
    },
    {
      name: 'Multi-purpose Hall',
      icon: Building2,
      description: 'Events, meetings, and community gatherings',
      color: 'bg-blue-500',
      images: ['/background.jpg', '/background.jpg', '/background.jpg'],
      features: ['500 Capacity', 'AC Equipped', 'Stage']
    },
    {
      name: 'Daycare Center',
      icon: Baby,
      description: 'Early childhood education and care',
      color: 'bg-pink-500',
      images: ['/background.jpg', '/background.jpg', '/background.jpg'],
      features: ['Ages 3-5', 'Free Education', 'Meals']
    },
    {
      name: 'Barangay Hall',
      icon: Home,
      description: 'Administrative services and assistance',
      color: 'bg-green-500',
      images: ['/background.jpg', '/background.jpg', '/background.jpg'],
      features: ['Documents', 'Assistance', 'Info Desk']
    },
    {
      name: 'Sports Complex',
      icon: Award,
      description: 'Basketball court and fitness area',
      color: 'bg-orange-500',
      images: ['/background.jpg', '/background.jpg', '/background.jpg'],
      features: ['Basketball', 'Volleyball', 'Gym']
    }
  ];

  const [facilities, setFacilities] = useState(defaultFacilities);
  const [officials, setOfficials] = useState([]);
  const [heroSettings, setHeroSettings] = useState({
    title: 'BARANGAY OFFICIALS',
    subtitle: 'Meet our dedicated team serving Iba O\' Este',
    image: '/images/barangay-officials.jpg'
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
      try {
        const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';
        console.log('Fetching events from:', `${API_URL}/events`);
        const response = await fetch(`${API_URL}/events`);
        console.log('Events API response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Events API data:', data);

        if (data.success && data.data && data.data.length > 0) {
          console.log('Setting events from API:', data.data);
          setNewsItems(data.data);
        } else {
          console.log('No events from API, using defaults');
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        console.log('Using default events due to error');
        // Keep default events on error
      }
    };

    fetchEvents();
  }, []);

  // Load facilities from API
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';
        console.log('Fetching facilities from:', `${API_URL}/facilities`);
        const response = await fetch(`${API_URL}/facilities`);
        console.log('Facilities API response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Facilities API data:', data);

        if (data.success && data.data && data.data.length > 0) {
          // Map icon names to actual components
          const facilitiesWithIcons = data.data.map(facility => ({
            ...facility,
            icon: getIconComponent(facility.icon)
          }));
          console.log('Setting facilities from API:', facilitiesWithIcons);
          setFacilities(facilitiesWithIcons);
        } else {
          console.log('No facilities from API, using defaults');
        }
      } catch (error) {
        console.error('Error fetching facilities:', error);
        console.log('Using default facilities due to error');
        // Keep default facilities on error
      }
    };

    fetchFacilities();
  }, []);

  // Load officials from API
  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';
        console.log('🔍 Fetching officials from:', `${API_URL}/officials`);
        const response = await fetch(`${API_URL}/officials`);
        console.log('📊 Officials API response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📋 Officials API data received:', data);
        console.log('📋 Number of officials:', data.data?.length || 0);

        if (data.success && data.data && data.data.length > 0) {
          console.log('✅ Setting officials from API:', data.data);
          setOfficials(data.data);
          console.log('✅ Officials state updated, count:', data.data.length);
        } else {
          console.log('⚠️ No officials from API, using empty array');
          console.log('⚠️ API response structure:', JSON.stringify(data, null, 2));
        }
      } catch (error) {
        console.error('❌ Error fetching officials:', error);
        console.log('❌ Using empty officials array due to error');
        // Keep empty array on error
      }
    };

    fetchOfficials();

    // Fetch Hero Settings
    const fetchSettings = async () => {
      try {
        const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';
        const res = await fetch(`${API_URL}/officials/config`);
        const data = await res.json();
        if (data.success && data.data.heroSection) {
          console.log('✅ Hero settings fetched:', data.data.heroSection);
          setHeroSettings(data.data.heroSection);
        }
      } catch (error) {
        console.error('❌ Error fetching hero settings:', error);
      }
    };
    fetchSettings();
  }, []);

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

  // Hero news carousel auto-slide
  useEffect(() => {
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
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe all animatable elements with lightweight setup
    const animatableElements = document.querySelectorAll('.animate-on-scroll');
    animatableElements.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
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
    <div className="min-h-screen bg-gray-50">
      {/* Large Portal Header with Date/Time and Weather */}
      <div className="bg-gradient-to-r from-[#004700] to-[#001a00] py-2 md:py-3">
        <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6">
          {/* Left Side - Logo and Title */}
          <div className="flex items-center gap-3 md:gap-4">
            <img src="/logo.png" alt="Iba O' Este Logo" className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 object-contain drop-shadow-2xl" />
            <div className="text-center md:text-left">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
                IBA O' ESTE PORTAL
              </h1>
              <p className="text-xs md:text-sm lg:text-base text-green-100 font-medium mt-0.5">
                Calumpit, Bulacan
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
              <weatherInfo.icon className={`w-4 h-4 ${weatherInfo.color}`} />
              <span>Weather: {weatherInfo.text}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center h-12 gap-8">
            {/* Desktop Navigation - Right Side */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#news" className="text-gray-700 hover:text-[#008000] font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-[#008000]">
                News & Updates
              </a>
              <a href="#forms" className="text-gray-700 hover:text-[#008000] font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-[#008000]">
                Barangay Forms
              </a>
              <a href="#directory" className="text-gray-700 hover:text-[#008000] font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-[#008000]">
                Facilities
              </a>
              <a href="#achievements" className="text-gray-700 hover:text-[#008000] font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-[#008000]">
                Achievements & Awards
              </a>
              <a href="#officials" className="text-gray-700 hover:text-[#008000] font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-[#008000]">
                Barangay Officials
              </a>
              <a href="#contact" className="text-gray-700 hover:text-[#008000] font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-[#008000]">
                Contact Us
              </a>
              <button
                onClick={() => router.push('/login')}
                className="bg-[#008000] hover:bg-[#006400] text-white px-5 py-2 rounded-lg font-semibold transition-all shadow-md"
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
            <a href="#news" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
              News & Updates
            </a>
            <a href="#forms" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
              Barangay Forms
            </a>
            <a href="#directory" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
              Facilities
            </a>
            <a href="#achievements" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
              Achievements & Awards
            </a>
            <a href="#officials" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
              Barangay Officials
            </a>
            <a href="#contact" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
              Contact Us
            </a>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-[#008000] hover:bg-[#006400] text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Login
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section with News Carousel */}
      <section id="news" className="relative h-[400px] md:h-[450px] lg:h-[500px] xl:h-[600px] 2xl:h-[700px] overflow-hidden animate-on-scroll">
        {newsItems.map((item, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === index ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${item.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#112117]/80 to-[#112e1f]/60" />
            <div className="relative h-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
              <div className="max-w-2xl text-white">
                <span className="inline-block bg-[#648a6a] text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {item.date}
                </span>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{item.title}</h2>
                <p className="text-lg md:text-xl text-gray-200 mb-6">{item.description}</p>
                <button className="bg-[#efefef] text-[#112117] px-6 py-3 rounded-lg font-semibold hover:bg-white transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg">
                  Read More <ChevronRight className="w-5 h-5" />
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
      <section id="forms" className="py-6 md:py-8 relative overflow-hidden animate-on-scroll">
        {/* Responsive Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat hidden md:block"
          style={{
            backgroundImage: 'url(/images/barangay-captain.jpg)',
            backgroundPosition: 'center center',
          }}
        />

        {/* Barangay Logo Watermark - Even Bigger & Impactful */}
        <div
          className="absolute right-[-5%] md:right-[-2%] top-1/2 -translate-y-1/2 w-[600px] md:w-[1100px] h-[110%] md:h-[115%] bg-contain bg-right bg-no-repeat opacity-10 pointer-events-none z-0 hidden md:block"
          style={{ backgroundImage: 'url(/images/ibalogo.png)', backgroundPosition: 'right center' }}
        />

        {/* Light Overlay for Text Readability */}


        {/* Additional Decorative Overlays - Responsive */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 md:-top-40 -right-20 md:-right-40 w-40 h-40 md:w-80 md:h-80 bg-white/10 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute -bottom-20 md:-bottom-40 -left-20 md:-left-40 w-40 h-40 md:w-80 md:h-80 bg-white/10 rounded-full opacity-50 blur-3xl"></div>
        </div>

        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-6">
            {/* Enhanced Online Services Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d5a3d]/90 backdrop-blur-sm border border-[#4b6c56]/50 text-white rounded-full text-xs font-semibold mb-4 shadow-lg">
              <div className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
                <FileText className="w-3 h-3 text-white" />
              </div>
              <span className="tracking-wide">ONLINE SERVICES</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-green-300 font-bold">LIVE</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 drop-shadow-2xl mb-2">
              Available Barangay <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2d5a3d] to-[#112117] drop-shadow-lg">Forms</span>
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
                  gradient: 'from-green-500 to-green-600',
                  shadow: 'shadow-green-500/30',
                  bg: 'bg-green-100',
                  text: 'text-green-600',
                  button: 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
                  buttonShadow: 'shadow-green-500/25 group-hover:shadow-green-500/40',
                  overlay: 'from-green-600/5 to-green-600/10',
                  feature: 'bg-green-50 text-green-600'
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
                          bg: '#112e1f',              // Dark Forest
                          title: 'text-white',
                          desc: 'text-green-100/80',
                          iconBg: 'from-emerald-500 to-green-600',
                          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                          button: 'from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600',
                          buttonShadow: 'shadow-emerald-900/40',
                          countBg: 'bg-emerald-400 text-[#112e1f]'
                        } : {
                          bg: '#d1e0d3',              // Sage
                          title: 'text-[#112e1f]',
                          desc: 'text-[#2d5a3d]',
                          iconBg: 'from-[#2d5a3d] to-[#112e1f]',
                          badge: 'bg-[#2d5a3d]/10 text-[#2d5a3d] border-[#2d5a3d]/20',
                          button: 'from-[#2d5a3d] to-[#112e1f] hover:from-[#3a6d4b] hover:to-[#1a3826]',
                          buttonShadow: 'shadow-[#112e1f]/20',
                          countBg: 'bg-[#112e1f] text-white'
                        };

                        return (
                          <div key={formIndex} className="w-full flex-shrink-0 flex items-center justify-center p-4" style={{ width: `${100 / forms.length}%` }}>
                            <div
                              className="group relative backdrop-blur-sm rounded-3xl p-8 transition-all duration-500 overflow-hidden w-full border border-white/20 shadow-xl hover:shadow-2xl"
                              style={{ backgroundColor: theme.bg }}
                            >
                              {/* Integrated Gradient Glow */}
                              <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl`}></div>

                              {/* Icon Container */}
                              <div className="relative mb-8">
                                <div className={`w-20 h-20 bg-gradient-to-br ${theme.iconBg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mx-auto`}>
                                  <Icon className="w-10 h-10 text-white" />
                                </div>
                                <div className={`absolute -top-1 -right-1 w-7 h-7 ${theme.countBg} rounded-full flex items-center justify-center shadow-md`}>
                                  <span className="text-sm font-bold">{formIndex + 1}</span>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="text-center">
                                <h3 className={`text-2xl font-bold ${theme.title} mb-4 transition-colors relative`}>
                                  {form.title}
                                </h3>
                                <p className={`${theme.desc} mb-8 leading-relaxed relative text-base h-12 overflow-hidden`}>
                                  {form.description}
                                </p>

                                {/* Feature Badges - Blended */}
                                <div className="flex flex-wrap gap-3 mb-8 relative justify-center">
                                  {form.features.map((feature, idx) => (
                                    <span key={idx} className={`px-4 py-1.5 ${theme.badge} text-xs font-semibold rounded-full border backdrop-blur-sm`}>
                                      {feature}
                                    </span>
                                  ))}
                                </div>

                                {/* Blended Request Button */}
                                <button
                                  onClick={form.onClick}
                                  className={`relative z-10 w-full bg-gradient-to-r ${theme.button} text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${theme.buttonShadow} text-lg group/btn`}
                                >
                                  <Plus className="w-6 h-6 group-hover/btn:rotate-90 transition-transform" />
                                  Request Now
                                  <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
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
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-[#2d5a3d]/90 hover:bg-[#112e1f] backdrop-blur-sm shadow-xl rounded-full flex items-center justify-center transition-all z-20 border border-[#4b6c56]/50"
                    >
                      <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </button>
                    <button
                      onClick={() => {
                        const maxSlide = Math.max(0, forms.length - itemsPerView);
                        setCurrentFormSlide((prev) => (prev + 1) % (maxSlide + 1));
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-[#2d5a3d]/90 hover:bg-[#112e1f] backdrop-blur-sm shadow-xl rounded-full flex items-center justify-center transition-all z-20 border border-[#4b6c56]/50"
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
                        className={`w-3 h-3 rounded-full transition-all ${currentFormSlide === index ? 'bg-[#2d5a3d] w-8 shadow-lg' : 'bg-gray-400 hover:bg-gray-500'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Enhanced Bottom Info */}
          <div className="mt-8 md:mt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto">
              {/* Processing Time */}
              <div className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl md:rounded-2xl p-3 md:p-6 border border-green-100 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                    <Clock className="w-5 h-5 md:w-7 md:h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">1-3 Days</p>
                    <p className="text-xs md:text-sm text-green-600 font-medium">Processing Time</p>
                  </div>
                </div>
                <div className="absolute top-2 md:top-3 right-2 md:right-3">
                  <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-green-100 text-green-700 text-[10px] md:text-xs font-semibold rounded-full">FAST</span>
                </div>
              </div>

              {/* 100% Online */}
              <div className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl md:rounded-2xl p-3 md:p-6 border border-green-100 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-5 h-5 md:w-7 md:h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">100%</p>
                    <p className="text-xs md:text-sm text-green-600 font-medium">Fully Online</p>
                  </div>
                </div>
                <div className="absolute top-2 md:top-3 right-2 md:right-3">
                  <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-green-100 text-green-700 text-[10px] md:text-xs font-semibold rounded-full">NO LINES</span>
                </div>
              </div>

              {/* SMS Notification */}
              <div className="group relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl md:rounded-2xl p-3 md:p-6 border border-orange-100 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5 md:w-7 md:h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">SMS</p>
                    <p className="text-xs md:text-sm text-orange-600 font-medium">Instant Updates</p>
                  </div>
                </div>
                <div className="absolute top-2 md:top-3 right-2 md:right-3">
                  <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-orange-100 text-orange-700 text-[10px] md:text-xs font-semibold rounded-full">REAL-TIME</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Barangay Programs Section - 8 items grid matching reference design */}
      <section className="py-16 md:py-24 bg-white w-full border-t border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">

          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                Barangay Programs
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 gap-y-12">
            {[
              {
                category: "HEALTH & WELLNESS",
                title: "Free Medical Mission 2026",
                description: "Comprehensive health check-ups, free medicines, and basic dental services for all registered residents of our barangay.",
                image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800"
              },
              {
                category: "LIVELIHOOD",
                title: "Pangkabuhayang Iba O' Este",
                description: "Empowering residents with practical skills in culinary arts, tailoring, and automotive mechanics.",
                image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800"
              },
              {
                category: "INFRASTRUCTURE",
                title: "Brgy. Green Building Initiative",
                description: "Launching sustainable practices and installing solar-powered streetlights across major puroks.",
                image: "https://images.unsplash.com/photo-1503694978374-8a2fa686963a?auto=format&fit=crop&q=80&w=800"
              },
              {
                category: "EDUCATION",
                title: "Scholarship Grants Awarding",
                description: "Distributing financial assistance to deserving local youth to support their higher education journeys.",
                image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800"
              },
              {
                category: "YOUTH & SPORTS",
                title: "Inter-Purok Basketball League",
                description: "Fostering sportsmanship and camaraderie among our youth through the annual basketball championship.",
                image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800"
              },
              {
                category: "ENVIRONMENT",
                title: "Monthly Coastal Clean-up",
                description: "Preserving our shores and marine life with the help of community volunteers and local groups.",
                image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800"
              },
              {
                category: "SENIOR CITIZENS",
                title: "Elders Wellness & Social Day",
                description: "A special day dedicated to our elders featuring health seminars, games, and free wellness packages.",
                image: "https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&q=80&w=800"
              },
              {
                category: "DIGITAL TRANSFORMATION",
                title: "Barangay E-Services Launch",
                description: "Experience faster transaction times and online document requests through our brand new web portal.",
                image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800"
              }
            ].map((program, idx) => (
              <div key={idx} className="flex flex-col group cursor-pointer h-full">
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-5 bg-gray-100">
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col flex-1 px-1">
                  <p className="text-[#6366f1] text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2.5">
                    {program.category}
                  </p>
                  <h3 className="text-gray-900 text-lg md:text-xl font-bold mb-3 leading-snug group-hover:text-[#6366f1] transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4 flex-1">
                    {program.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Facilities Section - Enhanced Modern Design */}
      <section id="directory" className="py-8 md:py-10 bg-gradient-to-br from-[#112117] via-[#2d5a3d] to-[#112e1f] relative overflow-hidden animate-on-scroll">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-teal-400 to-green-500 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-4 h-4 bg-green-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-emerald-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-32 left-20 w-5 h-5 bg-teal-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 right-10 w-3 h-3 bg-green-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        </div>

        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Enhanced Section Header */}
          <div className="text-center mb-8 md:mb-10">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-xs font-semibold border border-white/20 shadow-lg">
                <div className="w-6 h-6 bg-gradient-to-br from-[#2d5a3d] to-[#112e1f] rounded-full flex items-center justify-center">
                  <Building2 className="w-3 h-3 text-white" />
                </div>
                <span className="tracking-wide">COMMUNITY SERVICES</span>
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Barangay <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">Facilities</span>
            </h2>

            <div className="flex justify-center mb-6">
              <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-full"></div>
            </div>

            <p className="text-green-100 max-w-3xl mx-auto text-lg md:text-xl leading-relaxed">
              Discover our state-of-the-art community facilities designed to serve and enhance the lives of Iba O' Este residents
            </p>
          </div>

          {/* Enhanced Facility Showcase - Smaller Photos to fit screen */}
          <div className="relative mb-8 md:mb-10">
            {(() => {
              const currentFacilityIndex = facilityImageSlides['main'] || 0;
              const facility = facilities[currentFacilityIndex];
              const Icon = facility.icon;
              const currentImageIndex = facilityImageSlides[currentFacilityIndex] || 0;
              const colors = {
                'bg-red-500': {
                  bg: 'from-red-500 to-rose-600',
                  light: 'from-red-50/10 to-rose-100/10',
                  text: 'text-red-300',
                  border: 'border-red-400/30',
                  shadow: 'shadow-red-500/25',
                  glow: 'shadow-red-500/40'
                },
                'bg-blue-500': {
                  bg: 'from-blue-500 to-indigo-600',
                  light: 'from-blue-50/10 to-indigo-100/10',
                  text: 'text-blue-300',
                  border: 'border-blue-400/30',
                  shadow: 'shadow-blue-500/25',
                  glow: 'shadow-blue-500/40'
                },
                'bg-pink-500': {
                  bg: 'from-pink-500 to-rose-600',
                  light: 'from-pink-50/10 to-rose-100/10',
                  text: 'text-pink-300',
                  border: 'border-pink-400/30',
                  shadow: 'shadow-pink-500/25',
                  glow: 'shadow-pink-500/40'
                },
                'bg-green-500': {
                  bg: 'from-green-500 to-emerald-600',
                  light: 'from-green-50/10 to-emerald-100/10',
                  text: 'text-green-300',
                  border: 'border-green-400/30',
                  shadow: 'shadow-green-500/25',
                  glow: 'shadow-green-500/40'
                },
                'bg-orange-500': {
                  bg: 'from-orange-500 to-amber-600',
                  light: 'from-orange-50/10 to-amber-100/10',
                  text: 'text-orange-300',
                  border: 'border-orange-400/30',
                  shadow: 'shadow-orange-500/25',
                  glow: 'shadow-orange-500/40'
                }
              };
              const colorSet = colors[facility.color] || colors['bg-blue-500'];

              return (
                <div className="group relative max-w-6xl mx-auto">
                  {/* Main Facility Card - Bigger Photos */}
                  <div className={`relative w-full bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border-2 ${colorSet.border} hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2`}>

                    {/* Image Section - Adjusted for Screen Fit */}
                    <div
                      className="relative h-[300px] md:h-[450px] lg:h-[500px] overflow-hidden"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      {facility.images.map((image, imgIndex) => (
                        <div
                          key={imgIndex}
                          className={`absolute inset-0 transition-all duration-700 ease-in-out ${currentImageIndex === imgIndex
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-105'
                            }`}
                        >
                          <img
                            src={image}
                            alt={`${facility.name} ${imgIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}

                      {/* Enhanced Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                      {/* Integrated Thumbnail Gallery Overlay */}
                      {facility.images.length > 1 && (
                        <div className="absolute bottom-6 left-0 right-0 z-20 px-4">
                          <div className="flex justify-center gap-3">
                            {facility.images.map((image, imgIndex) => (
                              <button
                                key={imgIndex}
                                onClick={() => {
                                  setFacilityImageSlides(prev => ({ ...prev, [currentFacilityIndex]: imgIndex }));
                                }}
                                className={`group/thumb relative w-16 h-12 md:w-20 md:h-16 rounded-xl overflow-hidden transition-all duration-300 ${currentImageIndex === imgIndex
                                  ? 'ring-4 ring-[#648a6a] ring-offset-2 ring-offset-[#112117] scale-110 shadow-2xl'
                                  : 'ring-2 ring-white/20 hover:ring-white/50 opacity-60 hover:opacity-100'
                                  }`}
                              >
                                <img
                                  src={image}
                                  alt={`${facility.name} thumbnail ${imgIndex + 1}`}
                                  className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110"
                                />
                                {currentImageIndex === imgIndex && (
                                  <div className="absolute inset-0 bg-[#648a6a]/10" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Content Section */}
                    <div className={`bg-gradient-to-br ${colorSet.light} backdrop-blur-sm p-3 md:p-4 border-t border-white/20`}>
                      <div className="mb-2">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                          {facility.name}
                        </h3>
                        <p className="text-green-100 text-sm md:text-base leading-relaxed">
                          {facility.description}
                        </p>
                      </div>

                      {/* Enhanced Features */}
                      <div className="flex flex-wrap gap-2 mb-1">
                        {facility.features.map((feature, fIndex) => (
                          <span
                            key={fIndex}
                            className={`px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/30 shadow-sm transition-shadow`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>



          {/* Enhanced Facility Navigation */}
          <div className="flex justify-start md:justify-center gap-3 md:gap-4 mb-16 md:mb-20 overflow-x-auto pb-4 px-4 scrollbar-hide">
            {facilities.map((facility, index) => {
              const Icon = facility.icon;
              const isActive = (facilityImageSlides['main'] || 0) === index;
              const colors = {
                'bg-red-500': 'from-red-500 to-rose-600',
                'bg-blue-500': 'from-blue-500 to-indigo-600',
                'bg-pink-500': 'from-pink-500 to-rose-600',
                'bg-green-500': 'from-green-500 to-emerald-600',
                'bg-orange-500': 'from-orange-500 to-amber-600'
              };

              return (
                <button
                  key={index}
                  onClick={() => setFacilityImageSlides(prev => ({ ...prev, main: index }))}
                  className={`flex flex-col items-center gap-3 p-4 md:p-6 rounded-2xl transition-all duration-300 min-w-[100px] md:min-w-[120px] ${isActive
                    ? 'bg-white/20 backdrop-blur-sm shadow-xl scale-110 border-2 border-[#648a6a] transform -translate-y-2'
                    : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:shadow-lg border-2 border-transparent hover:scale-105'
                    }`}
                >
                  <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${colors[facility.color]} rounded-2xl flex items-center justify-center shadow-lg ${isActive ? 'shadow-xl' : ''}`}>
                    <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <span className={`text-xs md:text-sm font-semibold text-center leading-tight ${isActive ? 'text-[#bdcdc0]' : 'text-green-200'}`}>
                    {facility.name}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </section>


      {/* Barangay Achievement and Awards Section */}
      <section id="achievements" className="py-16 md:py-24 bg-gradient-to-br from-[#0a1f12] via-[#113821] to-[#0a1f12] relative overflow-hidden flex items-center animate-on-scroll">
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
            <div className="text-center mb-12 md:mb-16">
              <div className="flex justify-center mb-4 md:mb-6">
                <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-[#113821]/40 backdrop-blur-sm border border-[#d4af37]/30 rounded-full shadow-lg">
                  <Award className="w-5 h-5 md:w-6 md:h-6 text-[#d4af37]" />
                  <span className="text-[#ebd78c] font-semibold text-sm md:text-base tracking-widest uppercase">Honors & Recognitions</span>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight font-serif tracking-tight">
                BARANGAY{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500">
                  ACHIEVEMENTS
                </span>
                <br className="hidden md:block" /> & AWARDS
              </h2>

              <div className="flex justify-center mb-6">
                <div className="w-24 md:w-32 h-1.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full opacity-70"></div>
              </div>

              <p className="text-lg md:text-xl text-green-100/80 font-light leading-relaxed max-w-3xl mx-auto">
                Celebrating our shared milestones, exemplary performance, and outstanding service to the community.
              </p>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">

              {/* Outstanding Barangay Award */}
              <div
                onClick={() => setSelectedAchievement({
                  title: "Most Outstanding Barangay",
                  category: "City-Level Recognition",
                  description: "Awarded for exhibiting exemplary performance in local governance, community engagement, and rapid public service delivery across all metrics.",
                  image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800",
                  year: "2025",
                  colorClass: "bg-yellow-500",
                  textColor: "yellow-400"
                })}
                className="cursor-pointer bg-[#0a1f12]/60 backdrop-blur-md rounded-2xl border border-[#d4af37]/20 hover:bg-[#113821]/60 hover:border-[#d4af37]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col hover:-translate-y-2">
                {/* Image Cover */}
                <div className="relative h-48 md:h-56 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-[#0f2e1b]/30 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                  <img
                    src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800"
                    alt="Most Outstanding Barangay"
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#081a0f] to-transparent z-10"></div>
                  {/* Floating Badge */}
                  <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#0a1f12] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                    <Award className="w-4 h-4" />
                    2025
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col relative z-20 -mt-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#ebd78c] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] border-2 border-[#0a1f12] mr-4 group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[#d4af37] text-[10px] md:text-xs font-bold tracking-widest uppercase mb-0.5">City-Level Recognition</p>
                      <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-[#d4af37] transition-colors line-clamp-2 leading-tight">Most Outstanding Barangay</h3>
                    </div>
                  </div>
                  <p className="text-[#ebd78c]/80 leading-relaxed text-sm flex-1 pt-3 border-t border-[#d4af37]/20 mt-1">
                    Awarded for exhibiting exemplary performance in local governance, community engagement, and rapid public service delivery across all metrics.
                  </p>
                </div>
              </div>

              {/* Cleanest & Greenest */}
              <div
                onClick={() => setSelectedAchievement({
                  title: "Cleanest & Greenest",
                  category: "Environmental Award",
                  description: "Recognized for initiating the Brgy. Green Building Code and maintaining a zero-waste policy within the immediate public vicinity.",
                  image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800",
                  year: "2024",
                  colorClass: "bg-emerald-500",
                  textColor: "emerald-400"
                })}
                className="cursor-pointer bg-[#0a1f12]/60 backdrop-blur-md rounded-2xl border border-[#d4af37]/20 hover:bg-[#113821]/60 hover:border-[#d4af37]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col hover:-translate-y-2">
                {/* Image Cover */}
                <div className="relative h-48 md:h-56 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-[#0f2e1b]/30 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                  <img
                    src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800"
                    alt="Cleanest & Greenest"
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#081a0f] to-transparent z-10"></div>
                  {/* Floating Badge */}
                  <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#0a1f12] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                    <Award className="w-4 h-4" />
                    2024
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col relative z-20 -mt-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#ebd78c] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] border-2 border-[#0a1f12] mr-4 group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[#d4af37] text-[10px] md:text-xs font-bold tracking-widest uppercase mb-0.5">Environmental Award</p>
                      <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-[#d4af37] transition-colors line-clamp-2 leading-tight">Cleanest & Greenest</h3>
                    </div>
                  </div>
                  <p className="text-[#ebd78c]/80 leading-relaxed text-sm flex-1 pt-3 border-t border-[#d4af37]/20 mt-1">
                    Recognized for initiating the Brgy. Green Building Code and maintaining a zero-waste policy within the immediate public vicinity.
                  </p>
                </div>
              </div>

              {/* Digital Innovation Pioneer */}
              <div
                onClick={() => setSelectedAchievement({
                  title: "Digital Innovation Pioneer",
                  category: "Special Citation",
                  description: "Acknowledged for launching the comprehensive E-Services portal, ensuring 100% online availability of forms and digital records.",
                  image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
                  year: "2026",
                  colorClass: "bg-blue-500",
                  textColor: "blue-400"
                })}
                className="cursor-pointer bg-[#0a1f12]/60 backdrop-blur-md rounded-2xl border border-[#d4af37]/20 hover:bg-[#113821]/60 hover:border-[#d4af37]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col hover:-translate-y-2">
                {/* Image Cover */}
                <div className="relative h-48 md:h-56 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-[#0f2e1b]/30 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                  <img
                    src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800"
                    alt="Digital Innovation Pioneer"
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#081a0f] to-transparent z-10"></div>
                  {/* Floating Badge */}
                  <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#0a1f12] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                    <Award className="w-4 h-4" />
                    2026
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col relative z-20 -mt-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#ebd78c] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] border-2 border-[#0a1f12] mr-4 group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[#d4af37] text-[10px] md:text-xs font-bold tracking-widest uppercase mb-0.5">Special Citation</p>
                      <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-[#d4af37] transition-colors line-clamp-2 leading-tight">Digital Innovation Pioneer</h3>
                    </div>
                  </div>
                  <p className="text-[#ebd78c]/80 leading-relaxed text-sm flex-1 pt-3 border-t border-[#d4af37]/20 mt-1">
                    Acknowledged for launching the comprehensive E-Services portal, ensuring 100% online availability of forms and digital records.
                  </p>
                </div>
              </div>

              {/* Best in Public Safety */}
              <div
                onClick={() => setSelectedAchievement({
                  title: "Best in Public Safety",
                  category: "Community Safety",
                  description: "Recognized for the lowest crime rate in the municipality and unparalleled rapid response of the Barangay Tanods and safety patrols.",
                  image: "https://images.unsplash.com/photo-1533481405265-e9ce0c044abb?auto=format&fit=crop&q=80&w=800",
                  year: "2025",
                  colorClass: "bg-red-500",
                  textColor: "red-400"
                })}
                className="cursor-pointer bg-[#0a1f12]/60 backdrop-blur-md rounded-2xl border border-[#d4af37]/20 hover:bg-[#113821]/60 hover:border-[#d4af37]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col hover:-translate-y-2">
                {/* Image Cover */}
                <div className="relative h-48 md:h-56 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-[#0f2e1b]/30 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                  <img
                    src="https://images.unsplash.com/photo-1533481405265-e9ce0c044abb?auto=format&fit=crop&q=80&w=800"
                    alt="Best in Public Safety"
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#081a0f] to-transparent z-10"></div>
                  {/* Floating Badge */}
                  <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#0a1f12] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                    <Award className="w-4 h-4" />
                    2025
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col relative z-20 -mt-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#ebd78c] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] border-2 border-[#0a1f12] mr-4 group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[#d4af37] text-[10px] md:text-xs font-bold tracking-widest uppercase mb-0.5">Community Safety</p>
                      <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-[#d4af37] transition-colors line-clamp-2 leading-tight">Best in Public Safety</h3>
                    </div>
                  </div>
                  <p className="text-[#ebd78c]/80 leading-relaxed text-sm flex-1 pt-3 border-t border-[#d4af37]/20 mt-1">
                    Recognized for the lowest crime rate in the municipality and unparalleled rapid response of the Barangay Tanods and safety patrols.
                  </p>
                </div>
              </div>

              {/* Excellence in Healthcare */}
              <div
                onClick={() => setSelectedAchievement({
                  title: "Excellence in Healthcare",
                  category: "Health Service",
                  description: "Awarded for the continuous deployment of mobile clinics, free check-ups, and maternal care support for marginalized sectors.",
                  image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
                  year: "2024",
                  colorClass: "bg-pink-500",
                  textColor: "pink-400"
                })}
                className="cursor-pointer bg-[#0a1f12]/60 backdrop-blur-md rounded-2xl border border-[#d4af37]/20 hover:bg-[#113821]/60 hover:border-[#d4af37]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col hover:-translate-y-2">
                {/* Image Cover */}
                <div className="relative h-48 md:h-56 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-[#0f2e1b]/30 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                  <img
                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800"
                    alt="Excellence in Healthcare"
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#081a0f] to-transparent z-10"></div>
                  {/* Floating Badge */}
                  <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#0a1f12] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                    <Award className="w-4 h-4" />
                    2024
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col relative z-20 -mt-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#ebd78c] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] border-2 border-[#0a1f12] mr-4 group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[#d4af37] text-[10px] md:text-xs font-bold tracking-widest uppercase mb-0.5">Health Service</p>
                      <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-[#d4af37] transition-colors line-clamp-2 leading-tight">Excellence in Healthcare</h3>
                    </div>
                  </div>
                  <p className="text-[#ebd78c]/80 leading-relaxed text-sm flex-1 pt-3 border-t border-[#d4af37]/20 mt-1">
                    Awarded for the continuous deployment of mobile clinics, free check-ups, and maternal care support for marginalized sectors.
                  </p>
                </div>
              </div>

              {/* Champion in Youth Development */}
              <div
                onClick={() => setSelectedAchievement({
                  title: "Champion in Youth Development",
                  category: "Youth Council",
                  description: "Honored for establishing local sports tournaments, skill-building workshops, and broad educational assistance distribution.",
                  image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800",
                  year: "2025",
                  colorClass: "bg-purple-500",
                  textColor: "purple-400"
                })}
                className="cursor-pointer bg-[#0a1f12]/60 backdrop-blur-md rounded-2xl border border-[#d4af37]/20 hover:bg-[#113821]/60 hover:border-[#d4af37]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col hover:-translate-y-2">
                {/* Image Cover */}
                <div className="relative h-48 md:h-56 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-[#0f2e1b]/30 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                  <img
                    src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800"
                    alt="Champion in Youth Development"
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#081a0f] to-transparent z-10"></div>
                  {/* Floating Badge */}
                  <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#0a1f12] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                    <Award className="w-4 h-4" />
                    2025
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col relative z-20 -mt-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#ebd78c] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] border-2 border-[#0a1f12] mr-4 group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[#d4af37] text-[10px] md:text-xs font-bold tracking-widest uppercase mb-0.5">Youth Council</p>
                      <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-[#d4af37] transition-colors line-clamp-2 leading-tight">Youth Development</h3>
                    </div>
                  </div>
                  <p className="text-[#ebd78c]/80 leading-relaxed text-sm flex-1 pt-3 border-t border-[#d4af37]/20 mt-1">
                    Honored for establishing local sports tournaments, skill-building workshops, and broad educational assistance distribution.
                  </p>
                </div>
              </div>

            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-12 bg-[#113821]/20 backdrop-blur-sm p-6 md:p-8 rounded-3xl border border-[#d4af37]/20">
              <div className="text-center p-4">
                <div className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 mb-2">12+</div>
                <div className="text-green-100/80 text-xs md:text-sm font-bold uppercase tracking-widest">Major Awards</div>
              </div>
              <div className="text-center p-4 border-l border-[#d4af37]/20">
                <div className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 mb-2">100%</div>
                <div className="text-green-100/80 text-xs md:text-sm font-bold uppercase tracking-widest">Transparency</div>
              </div>
              <div className="text-center p-4 border-t md:border-t-0 md:border-l border-[#d4af37]/20">
                <div className="text-3xl md:text-4xl font-extrabold text-white mb-2">Top 5</div>
                <div className="text-green-100/80 text-xs md:text-sm font-bold uppercase tracking-widest">City Ranking</div>
              </div>
              <div className="text-center p-4 border-l border-t md:border-t-0 border-[#d4af37]/20">
                <div className="text-3xl md:text-4xl font-extrabold text-white mb-2">A+</div>
                <div className="text-green-100/80 text-xs md:text-sm font-bold uppercase tracking-widest">Audit Rating</div>
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

      {/* Barangay Clearance Modal */}
      <BarangayClearanceModal
        isOpen={showClearanceModal}
        onClose={() => setShowClearanceModal(false)}
      />

      {/* Certificate of Indigency Modal */}
      <IndigencyCertificateModal
        isOpen={showIndigencyModal}
        onClose={() => setShowIndigencyModal(false)}
      />

      {/* Barangay Residency Modal */}
      <ResidencyCertificateModal
        isOpen={showResidencyModal}
        onClose={() => setShowResidencyModal(false)}
      />

      {/* Business Permit Modal */}
      <BusinessPermitModal
        isOpen={showBusinessPermitModal}
        onClose={() => setShowBusinessPermitModal(false)}
      />

      {/* Educational Assistance Modal */}
      <EducationalAssistanceModal
        isOpen={showEducationalAssistanceModal}
        onClose={() => setShowEducationalAssistanceModal(false)}
      />

      {/* Natural Death Certificate Modal */}
      <NaturalDeathCertificateModal isOpen={showNaturalDeathModal} onClose={() => setShowNaturalDeathModal(false)} />
      <GuardianshipCertificateModal isOpen={showGuardianshipModal} onClose={() => setShowGuardianshipModal(false)} />
      <CohabitationCertificateModal isOpen={showCohabitationModal} onClose={() => setShowCohabitationModal(false)} />
      <MedicoLegalModal isOpen={showMedicoLegalModal} onClose={() => setShowMedicoLegalModal(false)} />
      <SamePersonCertificateModal isOpen={showSamePersonModal} onClose={() => setShowSamePersonModal(false)} />




      {/* Barangay Officials Section - Optimized */}
      <section id="officials" className="bg-gradient-to-br from-[#112e1f] via-[#1a3d29] to-[#0d1f14] relative overflow-hidden">
        {/* Header with modern aesthetic */}
        <div className="text-center pt-10 pb-6 md:pt-14 md:pb-8 relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-4">
            <span className="text-green-300 font-bold text-[10px] tracking-[0.2em] uppercase">Executive Governance</span>
          </div>

          <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tighter uppercase">
            {heroSettings?.title && heroSettings.title.includes('OFFICIALS') ? (
              <>Barangay <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Officials</span></>
            ) : (
              heroSettings?.title || 'BARANGAY OFFICIALS'
            )}
          </h3>

          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-green-500/50"></div>
            <p className="text-white font-bold text-sm md:text-base tracking-[0.3em] uppercase">
              {heroSettings?.subtitle || 'Meet our dedicated team serving Iba O\' Este'}
            </p>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-green-500/50"></div>
          </div>
        </div>

        {/* Photo - Full visibility without overlay */}
        <div className="relative">
          <img
            src={heroSettings?.image || '/images/barangay-officials.jpg'}
            alt={heroSettings?.title || "Barangay Officials"}
            className="w-full h-auto md:h-[400px] lg:h-[500px] xl:h-[600px] md:object-cover bg-gray-800"
            onError={(e) => {
              e.target.src = '/background.jpg';
            }}
          />
          {/* Green Shadow Overlay on Edges */}
          <div className="absolute inset-0 shadow-[inset_0_0_150px_60px_#112e1f] pointer-events-none z-10 hidden md:block"></div>
        </div>

        {/* Text Section - Professional Leadership Introduction */}
        <div className="bg-gradient-to-br from-[#112117] via-[#2d5a3d] to-[#112e1f] py-8 md:py-10 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Leadership Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-4">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                <span className="text-green-200 font-semibold text-[10px] tracking-wide uppercase">Leadership Team</span>
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              </div>

              <h4 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-none uppercase tracking-tight">
                Barangay Iba O' Este
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-emerald-400 to-green-300">
                  Leadership Team
                </span>
              </h4>

              <div className="w-24 h-1 bg-gradient-to-r from-green-600 via-emerald-500 to-green-400 mx-auto mb-4 rounded-full"></div>

              <p className="text-lg md:text-xl text-green-100 font-light leading-relaxed max-w-2xl mx-auto">
                Working together for our community's progress and development
              </p>
            </div>
          </div>
        </div>

        {/* Officials Details Section */}
        <div className="bg-gradient-to-br from-gray-50 to-green-50 py-6 md:py-10 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h5 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tighter">
                Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-green-950">Officials</span>
              </h5>
              <p className="text-gray-600 text-sm md:text-base font-bold max-w-2xl mx-auto uppercase tracking-[0.2em] leading-relaxed">
                Dedicated leaders committed to serving the community of Iba O' Este with integrity and excellence
              </p>
            </div>

            {/* Officials Segregated by Position */}
            {officials.length > 0 ? (
              <div className="space-y-16">
                {(() => {
                  // Group officials by position type
                  const groupedOfficials = {
                    captain: officials.filter(o => o.position_type === 'captain'),
                    kagawad: officials.filter(o => o.position_type === 'kagawad'),
                    sk_chairman: officials.filter(o => o.position_type === 'sk_chairman'),
                    sk_secretary: officials.filter(o => o.position_type === 'sk_secretary'),
                    sk_treasurer: officials.filter(o => o.position_type === 'sk_treasurer'),
                    sk_kagawad: officials.filter(o => o.position_type === 'sk_kagawad'),
                    staff: officials.filter(o => ['secretary', 'treasurer', 'staff'].includes(o.position_type))
                  };

                  const sections = [
                    {
                      key: 'captain',
                      title: 'Barangay Captain',
                      subtitle: 'Chief Executive Officer',
                      officials: groupedOfficials.captain,
                      bgColor: 'from-[#112e1f] to-[#2d5a3d]',
                      icon: '👑'
                    },
                    {
                      key: 'kagawad',
                      title: 'Barangay Kagawad',
                      subtitle: 'Council Members',
                      officials: groupedOfficials.kagawad,
                      bgColor: 'from-green-600 to-emerald-700',
                      icon: '🏛️'
                    },
                    {
                      key: 'sk_chairman',
                      title: 'SK Chairman',
                      subtitle: 'Youth Representative',
                      officials: groupedOfficials.sk_chairman,
                      bgColor: 'from-emerald-600 to-green-700',
                      icon: '🌟'
                    },
                    {
                      key: 'sk_kagawad',
                      title: 'SK Council',
                      subtitle: 'Youth Council Secretary, Treasurer, and Members',
                      officials: [], // Will be populated in the logic below
                      bgColor: 'from-orange-500 to-amber-600',
                      icon: '⚡'
                    },
                    {
                      key: 'staff',
                      title: 'Barangay Staff',
                      subtitle: 'Administrative Team',
                      officials: groupedOfficials.staff,
                      bgColor: 'from-teal-600 to-green-700',
                      icon: '👥'
                    }
                  ];

                  return sections.map((section) => {
                    // Special case for SK Council: Combine Secretary, Treasurer, and Kagawads
                    let displayOfficials = section.officials;
                    if (section.key === 'sk_kagawad') {
                      const sec = groupedOfficials.sk_secretary.length > 0 ? groupedOfficials.sk_secretary : [{ name: 'SK SECRETARY NAME', position: 'SK Secretary', description: 'Official secretary of the Sangguniang Kabataan.' }];
                      const trs = groupedOfficials.sk_treasurer.length > 0 ? groupedOfficials.sk_treasurer : [{ name: 'SK TREASURER NAME', position: 'SK Treasurer', description: 'Official treasurer of the Sangguniang Kabataan.' }];
                      const kgw = groupedOfficials.sk_kagawad.length > 0 ? groupedOfficials.sk_kagawad : Array(8).fill({ name: 'SK KAGAWAD NAME', position: 'SK Kagawad', description: 'Member of the Sangguniang Kabataan council.' });
                      displayOfficials = [...kgw, ...sec, ...trs];
                    }

                    if (displayOfficials.length === 0) return null;

                    return (
                      <div key={section.key} className="mb-16">
                        {/* Section Header */}
                        <div className="text-center mb-8">
                          <div className={`inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r ${section.bgColor} text-white rounded-full mb-4 shadow-lg`}>
                            <span className="text-2xl">{section.icon}</span>
                            <span className="font-bold text-lg tracking-wide">{section.title.toUpperCase()}</span>
                          </div>
                          <p className="text-gray-600 text-lg font-medium">{section.subtitle}</p>
                        </div>

                        {/* Officials Flex Container for automatic centering of orphans */}
                        <div className={`flex flex-wrap gap-6 justify-center ${section.key === 'captain' || section.key === 'sk_chairman' ? 'max-w-md mx-auto' : ''}`}>
                          {
                            displayOfficials.map((official, index) => {
                              const colors = [
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

                              // Use section-specific colors for consistency
                              let colorClass;
                              if (section.key === 'captain') {
                                colorClass = 'from-green-800 to-green-950';
                              } else if (section.key === 'kagawad') {
                                colorClass = colors[index % colors.length];
                              } else if (section.key === 'sk_chairman') {
                                colorClass = 'from-orange-600 to-amber-700';
                              } else if (section.key === 'sk_secretary') {
                                colorClass = 'from-orange-500 to-amber-600';
                              } else if (section.key === 'sk_treasurer') {
                                colorClass = 'from-amber-600 to-orange-500';
                              } else if (section.key === 'sk_kagawad') {
                                colorClass = 'from-amber-500 to-orange-600';
                              } else {
                                colorClass = colors[(index + 8) % colors.length];
                              }

                              const initials = official.name.split(' ').slice(0, 2).map(n => n[0]).join('');

                              // Dynamic width based on section type
                              const widthClass = section.key === 'captain' || section.key === 'sk_chairman' ? 'w-full' :
                                section.key === 'sk_kagawad' || section.key === 'staff' ? 'w-full md:w-[calc(50%-1.5rem)] lg:w-[calc(25%-1.5rem)]' :
                                  'w-full md:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)]';

                              return (
                                <div key={official.id || index} className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group ${widthClass}`}>
                                  <div className="relative aspect-square overflow-hidden group bg-white">
                                    {official.image_url ? (
                                      <img
                                        src={official.image_url}
                                        alt={official.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 relative z-10"
                                      />
                                    ) : (
                                      <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                                        <span className="text-5xl font-bold text-white tracking-widest opacity-30 group-hover:opacity-50 transition-opacity">{initials}</span>
                                      </div>
                                    )}

                                    {/* Position & Committee Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#112e1f]/90 via-[#112e1f]/40 to-transparent flex flex-col justify-end p-6 text-center z-20">
                                      <h3 className="text-white font-bold text-xl mb-1 drop-shadow-lg">
                                        {(() => {
                                          const pos = official.position;
                                          if (pos.includes('Kagawad')) return 'Brgy. Kagawad';
                                          if (['Secretary', 'Treasurer', 'Administrator', 'Clerk', 'Record Keeper'].includes(pos)) return `Brgy. ${pos}`;
                                          if (pos === 'Barangay Keeper') return 'Brgy. Record Keeper';
                                          if (['Assistant Secretary', 'Assistant Administrator'].includes(pos)) {
                                            return pos.replace('Assistant', 'Asst. Brgy.');
                                          }
                                          return pos;
                                        })()}
                                      </h3>
                                      {official.committee && (
                                        <p className="text-green-300 text-sm font-medium drop-shadow-md">{official.committee}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="p-6">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{official.name}</h4>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                      {official.description}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          }
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

      {/* Contact Section */}
      <section id="contact" className="py-8 bg-[#112117]">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-2">Feel free to contact us</h2>
            <p className="text-xl text-green-400 italic">Wag mahiya at kami ay inyong tanungin</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full bg-[#2d5a3d] hover:bg-[#112e1f] text-white py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 transform hover:scale-105 shadow-lg"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-green-950/50 backdrop-blur-sm rounded-2xl p-8 border border-green-800/50">
                <h3 className="text-xl font-bold text-white mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-800 p-3 rounded-lg">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className="text-green-200">Brgy. Iba O' Este, Calumpit, Bulacan</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-green-800 p-3 rounded-lg">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className="text-green-200">(044) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-green-800 p-3 rounded-lg">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Email</p>
                      <p className="text-green-200">ibaoeste@calumpit.gov.ph</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-950/50 backdrop-blur-sm rounded-2xl p-8 border border-green-800/50">
                <h3 className="text-xl font-bold text-white mb-4">Office Hours</h3>
                <div className="space-y-2 text-green-200">
                  <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                  <p>Saturday: 8:00 AM - 12:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Transparency Stats Section - Barangay at a Glance */}
      <section className="py-16 bg-gradient-to-r from-[#112e1f] to-[#112117] animate-on-scroll">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Barangay at a Glance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center transform hover:scale-105 transition-all border border-white/20"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-4xl font-bold text-white mb-2">{stat.value}</p>
                  <p className="text-[#bdcdc0]">{stat.label}</p>
                </div>
              );
            })}
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
                    className="text-green-700 font-semibold hover:text-green-800 transition-colors"
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
        
        /* Base state for animated elements */
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
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
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-green-600"></div>

              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                <Clock className="w-10 h-10 text-emerald-600 animate-pulse" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon!</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We are currently finalizing this online service to serve you better. Please visit the Barangay Hall for manual processing in the meantime.
              </p>

              <button
                onClick={() => setShowComingSoonModal(false)}
                className="w-full bg-gradient-to-r from-[#2d5a3d] to-[#112e1f] text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 group/btn"
              >
                Got it!
                <CheckCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
              </button>

              {/* Decorative background circle */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full -z-10 opacity-50"></div>
            </div>
          </div>
        )
      }

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
