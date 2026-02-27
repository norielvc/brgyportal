import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Menu, X, ChevronRight, ChevronLeft, Plus, Send, Phone, MapPin, Mail,
  Clock, Sun, Moon, Cloud, CloudRain, Users, FileText, Award, Building2, Heart, Baby,
  AlertTriangle, Shield, Home, Calendar, TrendingUp, CheckCircle, GraduationCap, User,
  Store, Briefcase, Stethoscope, Fingerprint, UserPlus, Flower2, Search
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
              <a href="#educational-assistance" className="text-gray-700 hover:text-[#008000] font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-[#008000]">
                Educational Assistance
              </a>
              <a href="#senior-citizen-assistance" className="text-gray-700 hover:text-[#008000] font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-[#008000]">
                Senior Citizen Services
              </a>
              <a href="#directory" className="text-gray-700 hover:text-[#008000] font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-[#008000]">
                Facilities
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
            <a href="#educational-assistance" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
              Educational Assistance
            </a>
            <a href="#senior-citizen-assistance" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
              Senior Citizen Services
            </a>
            <a href="#directory" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
              Facilities
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

      {/* Barangay Programs Section - Carousel layout mirroring exact screenshot design */}
      <section className="py-12 md:py-16 bg-white w-full">
        <h2 className="text-center text-3xl md:text-[2.5rem] font-extrabold text-[#113b4d] uppercase mb-10 tracking-[0.05em] font-serif">
          Barangay Programs
        </h2>

        <div className="w-full relative overflow-hidden">
          <div className="flex overflow-x-auto md:grid md:grid-cols-3 snap-x snap-mandatory scrollbar-hide">

            {/* Card 1 */}
            <div className="relative h-[350px] md:h-[450px] w-full min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 group">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                style={{ backgroundImage: 'url(/background.jpg)' }}
              />
              <div className="absolute inset-0 bg-[#2a4d5c]/85 flex flex-col items-start justify-center p-10 md:p-14 transition-colors duration-500 hover:bg-[#2a4d5c]/90">
                <h3 className="text-white text-3xl md:text-4xl font-black uppercase leading-tight mb-8 tracking-wide drop-shadow-md">
                  Brgy. Green<br className="hidden md:block" /> Building Code
                </h3>
                <button className="border-2 border-white text-white px-8 py-3 bg-transparent hover:bg-white hover:text-[#2a4d5c] transition-colors rounded-sm font-semibold text-sm md:text-base">
                  Read More
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative h-[350px] md:h-[450px] w-full min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 group">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                style={{ backgroundImage: 'url(/background.jpg)' }}
              />
              <div className="absolute inset-0 bg-[#c04646]/85 flex flex-col items-start justify-center p-10 md:p-14 transition-colors duration-500 hover:bg-[#c04646]/90">
                <h3 className="text-white text-3xl md:text-4xl font-black uppercase leading-tight mb-8 tracking-wide drop-shadow-md">
                  Pangkabuhayang<br className="hidden md:block" /> Iba O' Este
                </h3>
                <button className="border-2 border-white text-white px-8 py-3 bg-transparent hover:bg-white hover:text-[#c04646] transition-colors rounded-sm font-semibold text-sm md:text-base">
                  Read More
                </button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="relative h-[350px] md:h-[450px] w-full min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 group">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                style={{ backgroundImage: 'url(/background.jpg)' }}
              />
              <div className="absolute inset-0 bg-[#356db3]/85 flex flex-col items-start justify-center p-10 md:p-14 transition-colors duration-500 hover:bg-[#356db3]/90">
                <h3 className="text-white text-3xl md:text-4xl font-black uppercase leading-tight mb-8 tracking-wide drop-shadow-md">
                  Barangay<br className="hidden md:block" /> E-Services
                </h3>
                <button className="border-2 border-white text-white px-8 py-3 bg-transparent hover:bg-white hover:text-[#356db3] transition-colors rounded-sm font-semibold text-sm md:text-base">
                  Read More
                </button>
              </div>
            </div>

          </div>
        </div>

        <div className="text-center mt-12 mb-4">
          <button className="border border-[#2a4d5c] text-[#2a4d5c] px-8 py-3 hover:bg-[#2a4d5c] hover:text-white transition-colors uppercase font-semibold tracking-wide text-sm rounded-sm">
            More Programs
          </button>
        </div>
      </section>

      {/* Educational Assistance Program Section - SK Project - Trimmed for single screen */}
      <section id="educational-assistance" className="py-4 md:py-6 bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 relative overflow-hidden flex items-center animate-on-scroll">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-48 h-48 md:w-96 md:h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 md:w-96 md:h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* SK Chairman Background Image - Responsive */}
        <div className="absolute left-0 top-0 bottom-0 w-full md:w-1/2 opacity-20 md:opacity-30 pointer-events-none hidden md:block">
          <div
            className="w-full h-full bg-cover bg-no-repeat bg-center md:bg-left-top"
            style={{
              backgroundImage: 'url(/images/sk-chairman.png)',
              filter: 'brightness(0.9) contrast(1.1)',
              backgroundPosition: 'center 20%'
            }}
          />
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
          {/* Responsive Container */}
          <div className="max-w-[1800px] mx-auto">
            {/* Mobile-first layout, then desktop alignment */}
            <div className="w-full md:flex md:justify-end">
              <div className="w-full md:max-w-4xl lg:max-w-5xl md:pr-8 lg:pr-16">

                {/* Section Header - Responsive */}
                <div className="text-center md:text-right mb-6 md:mb-8">
                  <div className="flex justify-center md:justify-end mb-3 md:mb-4">
                    <div className="inline-flex items-center gap-2 md:gap-4 px-4 md:px-8 py-2 md:py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                      <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-white" />
                      <span className="text-white font-bold text-sm md:text-xl lg:text-2xl tracking-wide">SANGUNIANG KABATAAN PROJECT</span>
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 leading-tight text-center md:text-right">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
                      𝐄𝐃𝐔𝐂𝐀𝐓𝐈𝐎𝐍𝐀𝐋 𝐀𝐒𝐒𝐈𝐒𝐓𝐀𝐍𝐂𝐄 𝐏𝐑𝐎𝐆𝐑𝐀𝐌
                    </span>
                  </h2>

                  <div className="flex justify-center md:justify-end mb-3">
                    <div className="w-20 md:w-28 h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-full"></div>
                  </div>

                  <p className="text-base md:text-lg lg:text-xl text-green-100 font-light leading-relaxed text-center md:text-right px-4 md:px-0">
                    Empowering the youth of Iba O' Este through quality education
                  </p>
                  <p className="text-sm md:text-base text-cyan-200 font-medium text-center md:text-right px-4 md:px-0">
                    A Sanguniang Kabataan Initiative for Educational Excellence
                  </p>
                </div>

                {/* Compact Requirements Info - Responsive */}
                <div className="mb-4 md:mb-6">
                  <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 md:gap-4 text-center px-2 md:px-0">
                    {/* Eligibility - Compact */}
                    <div className="flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 md:px-4 py-2 border border-white/30 text-center">
                      <Users className="w-3 h-3 md:w-4 md:h-4 text-green-300 flex-shrink-0" />
                      <span className="text-white text-xs md:text-xs font-medium">ELIGIBILITY: GRADE 7 TO 4TH/5TH YEAR COLLEGE</span>
                    </div>

                    {/* Selection - Compact */}
                    <div className="flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 md:px-4 py-2 border border-white/30 text-center">
                      <Clock className="w-3 h-3 md:w-4 md:h-4 text-green-300 flex-shrink-0" />
                      <span className="text-white text-xs md:text-xs font-medium">SELECTION: FIRST COME, FIRST SERVE!</span>
                    </div>
                  </div>
                </div>

                {/* Application Form Section - Responsive */}
                <div className="mb-4 md:mb-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-8 border border-white/20 shadow-xl mx-2 md:mx-0">
                    <div className="text-center mb-4 md:mb-6">
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 md:mb-4 text-center">Ready to Apply?</h3>
                      <p className="text-green-200 text-sm md:text-base mb-4 md:mb-6 text-center leading-relaxed max-w-3xl mx-auto px-2 md:px-0">
                        Take the first step towards your educational goals. Fill out our comprehensive application form and join hundreds of students who have benefited from this program.
                      </p>

                      <div className="flex justify-center mb-4 md:mb-6">
                        <button
                          onClick={() => setShowEducationalAssistanceModal(true)}
                          className="group bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white px-8 md:px-16 py-3 md:py-4 rounded-xl font-bold text-lg md:text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-orange-500/25 flex items-center gap-2 md:gap-4"
                        >
                          <GraduationCap className="w-6 h-6 md:w-8 md:h-8 group-hover:rotate-12 transition-transform" />
                          APPLY NOW
                          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>

                      {/* Requirements Preview - Responsive Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                        <div className="bg-white/15 rounded-lg p-3 md:p-4 text-center flex flex-col items-center justify-center min-h-[70px] md:min-h-[80px]">
                          <User className="w-6 h-6 md:w-8 md:h-8 text-green-300 mx-auto mb-1 md:mb-2" />
                          <p className="text-white text-xs md:text-sm font-medium">Personal Info</p>
                        </div>
                        <div className="bg-white/15 rounded-lg p-3 md:p-4 text-center flex flex-col items-center justify-center min-h-[70px] md:min-h-[80px]">
                          <MapPin className="w-6 h-6 md:w-8 md:h-8 text-green-300 mx-auto mb-1 md:mb-2" />
                          <p className="text-white text-xs md:text-sm font-medium">Address</p>
                        </div>
                        <div className="bg-white/15 rounded-lg p-3 md:p-4 text-center flex flex-col items-center justify-center min-h-[70px] md:min-h-[80px]">
                          <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-purple-300 mx-auto mb-1 md:mb-2" />
                          <p className="text-white text-xs md:text-sm font-medium">Academic</p>
                        </div>
                        <div className="bg-white/15 rounded-lg p-3 md:p-4 text-center flex flex-col items-center justify-center min-h-[70px] md:min-h-[80px]">
                          <Award className="w-6 h-6 md:w-8 md:h-8 text-yellow-300 mx-auto mb-1 md:mb-2" />
                          <p className="text-white text-xs md:text-sm font-medium">Awards</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics Section - Responsive */}
                <div className="px-2 md:px-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
                    <div className="text-center bg-white/5 rounded-lg p-3 md:p-4 border border-white/10">
                      <div className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">500+</div>
                      <div className="text-green-200 text-xs md:text-sm font-medium">Students Helped</div>
                    </div>
                    <div className="text-center bg-white/5 rounded-lg p-3 md:p-4 border border-white/10">
                      <div className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">₱2M+</div>
                      <div className="text-green-200 text-xs md:text-sm font-medium">Total Assistance</div>
                    </div>
                    <div className="text-center bg-white/5 rounded-lg p-3 md:p-4 border border-white/10">
                      <div className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">95%</div>
                      <div className="text-green-200 text-xs md:text-sm font-medium">Success Rate</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Senior Citizen Assistance Section */}
      <section id="senior-citizen-assistance" className="py-4 md:py-6 bg-gradient-to-br from-[#4d2c00] via-[#8c5100] to-[#331c00] relative overflow-hidden flex items-center animate-on-scroll">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 md:w-96 md:h-96 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 md:w-96 md:h-96 bg-white rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* Filipino Senior Citizens Background Image */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/images/seniorcitizens.jpg)',
              filter: 'brightness(0.7) contrast(1.2) sepia(0.2)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFA500]/10 via-transparent to-[#FFA500]/10"></div>
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1800px] mx-auto">

            {/* Section Header */}
            <div className="text-center mb-8 md:mb-12">
              <div className="flex justify-center mb-4 md:mb-6">
                <div className="inline-flex items-center gap-3 md:gap-4 px-6 md:px-8 py-3 md:py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                  <Heart className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  <span className="text-white font-bold text-lg md:text-xl lg:text-2xl tracking-wide">SENIOR CITIZEN SERVICES</span>
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-[#FFA500] rounded-full animate-pulse shadow-[0_0_8px_rgba(255,165,0,0.6)]"></div>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd89b] via-[#FFA500] to-[#996300]">
                  SENIOR CITIZEN ASSISTANCE PROGRAM
                </span>
              </h2>

              <div className="flex justify-center mb-4 md:mb-6">
                <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-[#ffd89b]/20 via-[#FFA500] to-[#ffd89b]/20 rounded-full"></div>
              </div>

              <p className="text-lg md:text-xl lg:text-2xl text-orange-100 font-light leading-relaxed max-w-4xl mx-auto px-4 md:px-0">
                Honoring our elders with comprehensive care and support services
              </p>
              <p className="text-base md:text-lg text-[#FFA500] font-bold max-w-3xl mx-auto px-4 md:px-0 uppercase tracking-wide">
                Dedicated programs for the health, welfare, and dignity of our senior citizens
              </p>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">

              {/* Healthcare Services */}
              <div className="bg-orange-950/15 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-[#FFA500]/20 hover:bg-orange-900/40 hover:border-[#FFA500]/40 transition-all duration-300 group shadow-2xl">
                <div className="flex items-center mb-4 md:mb-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#996300] to-[#FFA500] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[#FFA500]/20 group-hover:scale-110 transition-all duration-300">
                    <Heart className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg md:text-xl font-bold text-white">Healthcare Services</h3>
                    <p className="text-orange-200/80 text-sm md:text-base font-medium">Medical Care & Support</p>
                  </div>
                </div>
                <ul className="space-y-2 md:space-y-3 text-white text-sm md:text-base">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Free medical check-ups and consultations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Medicine assistance and subsidies</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Health monitoring and wellness programs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Referral services to specialists</span>
                  </li>
                </ul>
              </div>

              {/* Financial Assistance */}
              <div className="bg-orange-950/15 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-[#FFA500]/20 hover:bg-orange-900/40 hover:border-[#FFA500]/40 transition-all duration-300 group shadow-2xl">
                <div className="flex items-center mb-4 md:mb-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#FFA500] to-[#ffd89b] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[#FFA500]/20 group-hover:scale-110 transition-all duration-300">
                    <Award className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg md:text-xl font-bold text-white">Financial Assistance</h3>
                    <p className="text-orange-200/80 text-sm md:text-base font-medium">Economic Support</p>
                  </div>
                </div>
                <ul className="space-y-2 md:space-y-3 text-white text-sm md:text-base">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Senior citizen pension assistance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Emergency financial aid</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Burial and funeral assistance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Utility bill subsidies</span>
                  </li>
                </ul>
              </div>

              {/* Social Services */}
              <div className="bg-orange-950/15 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-[#FFA500]/20 hover:bg-orange-900/40 hover:border-[#FFA500]/40 transition-all duration-300 group shadow-2xl">
                <div className="flex items-center mb-4 md:mb-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#8c5100] to-[#FFA500] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[#FFA500]/20 group-hover:scale-110 transition-all duration-300">
                    <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg md:text-xl font-bold text-white">Social Services</h3>
                    <p className="text-orange-200/80 text-sm md:text-base font-medium">Community & Recreation</p>
                  </div>
                </div>
                <ul className="space-y-2 md:space-y-3 text-white text-sm md:text-base">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Senior citizen activities and events</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Transportation assistance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Recreational and wellness programs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Social interaction and support groups</span>
                  </li>
                </ul>
              </div>

              {/* Legal Assistance */}
              <div className="bg-orange-950/15 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-[#FFA500]/20 hover:bg-orange-900/40 hover:border-[#FFA500]/40 transition-all duration-300 group shadow-2xl">
                <div className="flex items-center mb-4 md:mb-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#664200] to-[#996300] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[#FFA500]/20 group-hover:scale-110 transition-all duration-300">
                    <Shield className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg md:text-xl font-bold text-white">Legal Assistance</h3>
                    <p className="text-orange-200/80 text-sm md:text-base font-medium">Rights & Protection</p>
                  </div>
                </div>
                <ul className="space-y-2 md:space-y-3 text-white text-sm md:text-base">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Senior citizen ID processing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Legal counseling and advice</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Document assistance and notarization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Advocacy and rights protection</span>
                  </li>
                </ul>
              </div>

              {/* Food & Nutrition */}
              <div className="bg-orange-950/15 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-[#FFA500]/20 hover:bg-orange-900/40 hover:border-[#FFA500]/40 transition-all duration-300 group shadow-2xl">
                <div className="flex items-center mb-4 md:mb-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#FFA500] to-[#cc8400] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[#FFA500]/20 group-hover:scale-110 transition-all duration-300">
                    <Baby className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg md:text-xl font-bold text-white">Food & Nutrition</h3>
                    <p className="text-orange-200/80 text-sm md:text-base font-medium">Nutritional Support</p>
                  </div>
                </div>
                <ul className="space-y-2 md:space-y-3 text-white text-sm md:text-base">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Nutritional meals and food packs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Dietary counseling and guidance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Special dietary requirements support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Community feeding programs</span>
                  </li>
                </ul>
              </div>

              {/* Home Care Services */}
              <div className="bg-orange-950/15 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-[#FFA500]/20 hover:bg-orange-900/40 hover:border-[#FFA500]/40 transition-all duration-300 group shadow-2xl">
                <div className="flex items-center mb-4 md:mb-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#cc8400] to-[#ffd89b] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[#FFA500]/20 group-hover:scale-110 transition-all duration-300">
                    <Home className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg md:text-xl font-bold text-white">Home Care Services</h3>
                    <p className="text-orange-200/80 text-sm md:text-base font-medium">In-Home Support</p>
                  </div>
                </div>
                <ul className="space-y-2 md:space-y-3 text-white text-sm md:text-base">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Home visits and wellness checks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Personal care assistance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Household maintenance support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Emergency response services</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* Call to Action */}
            <div className="text-center mb-8 md:mb-12">
              <div className="bg-orange-950/20 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-[#FFA500]/20 shadow-xl max-w-4xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Need Assistance?</h3>
                <p className="text-orange-100/90 text-base md:text-lg mb-6 md:mb-8 leading-relaxed font-medium">
                  Our dedicated team is here to help our senior citizens access the services and support they deserve.
                  Contact us today to learn more about available programs and how to apply.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                  <div className="flex items-center gap-3 bg-white/10 rounded-full px-6 py-3 border border-white/20">
                    <Phone className="w-5 h-5 text-[#FFA500]" />
                    <span className="text-white font-medium">(044) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 rounded-full px-6 py-3 border border-white/20">
                    <Mail className="w-5 h-5 text-[#FFA500]" />
                    <span className="text-white font-medium">seniors@ibaoeste.gov.ph</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 rounded-full px-6 py-3 border border-white/20">
                    <Clock className="w-5 h-5 text-[#FFA500]" />
                    <span className="text-white font-medium">Mon-Fri 8AM-5PM</span>
                  </div>
                </div>

                {/* Message Us Here Button */}
                <div className="mt-6">
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-[#996300] to-[#FFA500] hover:from-[#FFA500] hover:to-[#ffd89b] text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-[#FFA500]/20 transition-all duration-300 transform hover:scale-105"
                  >
                    <Send className="w-5 h-5" />
                    Message Us Here
                  </a>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="text-center bg-orange-950/20 backdrop-blur-xl rounded-xl p-4 md:p-6 border border-[#FFA500]/10 hover:border-[#FFA500]/30 transition-all duration-300 group shadow-lg">
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">1,200+</div>
                <div className="text-orange-100/80 text-sm md:text-base font-bold uppercase tracking-wider">Senior Citizens Served</div>
              </div>
              <div className="text-center bg-orange-950/20 backdrop-blur-xl rounded-xl p-4 md:p-6 border border-[#FFA500]/10 hover:border-[#FFA500]/30 transition-all duration-300 group shadow-lg">
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">₱5M+</div>
                <div className="text-orange-100/80 text-sm md:text-base font-bold uppercase tracking-wider">Total Assistance Provided</div>
              </div>
              <div className="text-center bg-orange-950/20 backdrop-blur-xl rounded-xl p-4 md:p-6 border border-[#FFA500]/10 hover:border-[#FFA500]/30 transition-all duration-300 group shadow-lg">
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">15</div>
                <div className="text-orange-100/80 text-sm md:text-base font-bold uppercase tracking-wider">Active Programs</div>
              </div>
              <div className="text-center bg-orange-950/20 backdrop-blur-xl rounded-xl p-4 md:p-6 border border-[#FFA500]/10 hover:border-[#FFA500]/30 transition-all duration-300 group shadow-lg">
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">98%</div>
                <div className="text-orange-100/80 text-sm md:text-base font-bold uppercase tracking-wider">Satisfaction Rate</div>
              </div>
            </div>

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
