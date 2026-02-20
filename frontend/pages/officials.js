import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout/Layout';
import { Save, Users, UserCog, Shield, Award, Edit2, Check, X, AlertCircle, CheckCircle, MapPin, Phone, Mail, Building, Crop, Camera, Layout as LayoutIcon } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';

// Default officials data
const defaultOfficials = {
  chairman: 'ALEXANDER C. MANIO',
  secretary: 'ROYCE ANN C. GALVEZ',
  treasurer: 'MA. LUZ S. REYES',
  skChairman: 'JOHN RUZZEL C. SANTOS',
  skSecretary: '',
  skTreasurer: '',
  skKagawads: ['', '', '', '', '', '', '', ''],
  councilors: [
    'JOELITO C. MANIO',
    'ENGELBERT M. INDUCTIVO',
    'NORMANDO T. SANTOS',
    'JOPHET M. TURLA',
    'JOHN BRYAN C. CRUZ',
    'ARNEL D. BERNARDINO',
    'LORENA G. LOPEZ'
  ],
  administrator: 'ROBERT D. SANTOS',
  assistantSecretary: 'PERLITA C. DE JESUS',
  assistantAdministrator: 'KHINZ JANZL V. BARROGA',
  recordKeeper: 'EMIL D. ROBLES',
  clerk: 'CIELITO B. DE LEON',

  officialImages: {
    chairman: '', secretary: '', treasurer: '', skChairman: '',
    skSecretary: '', skTreasurer: '',
    skKagawads: Array(8).fill(''),
    councilors: Array(7).fill(''),
    administrator: '', assistantSecretary: '', assistantAdministrator: '',
    recordKeeper: '', clerk: ''
  },
  descriptions: {
    chairman: 'Detailed leader committed to serving the community.',
    secretary: 'Responsible for maintaining barangay records.',
    treasurer: 'Manages barangay funds and financial records.',
    skChairman: 'Leading the youth towards a better future.',
    skSecretary: 'Keeps minutes and records of SK meetings.',
    skTreasurer: 'Handles SK funds and financial reports.',
    councilors: Array(7).fill('Brgy. Kagawad'),
    skKagawads: Array(8).fill('SK Kagawad'),
    administrator: 'Oversees day-to-day operations.',
    assistantSecretary: 'Assists the Barangay Secretary.',
    assistantAdministrator: 'Assists the Barangay Administrator.',
    recordKeeper: 'Maintains official barangay documents.',
    clerk: 'Assists with clerical work and documentation.'
  },
  committees: {
    councilors: [
      'Committee on Peace & Order',
      'Committee on Infrastructure',
      'Committee on Health',
      'Committee on Education',
      'Committee on Agriculture',
      'Committee on Environment',
      'Committee on Appropriation'
    ],
    skKagawads: Array(8).fill('Youth Comittee')
  },
  contactInfo: {
    address: 'Purok 2 (Sitio Banawe) Barangay Iba O\' Este, Calumpit, Bulacan',
    contactPerson: 'Sec. Royce Ann C. Galvez',
    telephone: '0967 631 9168',
    email: 'anneseriousme@gmail.com'
  },
  headerInfo: {
    country: 'Republic of the Philippines',
    province: 'Province of Bulacan',
    municipality: 'Municipality of Calumpit',
    barangayName: 'BARANGAY IBA O\' ESTE',
    officeName: 'Office of the Punong Barangay'
  },
  // Logos
  logos: {
    leftLogo: '/iba-o-este.png',
    rightLogo: '/calumpit.png',
    logoSize: 115,
    captainImage: '/images/brgycaptain.png'
  },
  // Header Style - General
  headerStyle: {
    bgColor: '#ffffff',
    borderColor: '#1e40af',
    fontFamily: 'default'
  },
  // Individual Header Text Styles
  countryStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  provinceStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  municipalityStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  barangayNameStyle: { color: '#1e40af', size: 20, fontWeight: 'bold', fontFamily: 'default' },
  officeNameStyle: { color: '#6b7280', size: 11, fontWeight: 'normal', fontFamily: 'default' },
  // Sidebar Style
  sidebarStyle: {
    bgColor: '#1e40af',
    gradientEnd: '#1e3a8a',
    textColor: '#ffffff',
    labelColor: '#fde047',
    titleSize: 14,
    textSize: 11,
    fontFamily: 'default'
  },
  // Body Style
  bodyStyle: {
    bgColor: '#ffffff',
    textColor: '#1f2937',
    titleColor: '#1e3a8a',
    titleSize: 24,
    textSize: 14,
    fontFamily: 'default'
  },
  // Footer Style
  footerStyle: {
    bgColor: '#f9fafb',
    textColor: '#374151',
    borderColor: '#d1d5db',
    textSize: 9,
    fontFamily: 'default'
  },
  heroSection: {
    title: 'BARANGAY OFFICIALS',
    subtitle: 'Meet our dedicated team serving Iba O\' Este',
    image: '/images/barangay-officials.jpg'
  }
};


export default function OfficialsPage() {
  const [officials, setOfficials] = useState(defaultOfficials);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [notification, setNotification] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('officials');
  const [isSaving, setIsSaving] = useState(false);
  const leftLogoRef = useRef(null);
  const rightLogoRef = useRef(null);
  const captainImageRef = useRef(null);
  const [croppingImg, setCroppingImg] = useState(null);
  const [targetField, setTargetField] = useState(null);

  useEffect(() => {
    // Fetch from API
    const fetchConfig = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_URL}/officials/config`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();

        if (data.success && data.data) {
          // Merge API data with defaults to ensure all fields exist
          setOfficials(prev => ({
            ...prev,
            ...data.data,
            // Deep merge essential nested objects if they exist in data.data
            contactInfo: { ...prev.contactInfo, ...(data.data.contactInfo || {}) },
            headerInfo: { ...prev.headerInfo, ...(data.data.headerInfo || {}) },
            logos: { ...prev.logos, ...(data.data.logos || {}) },
            headerStyle: { ...prev.headerStyle, ...(data.data.headerStyle || {}) },
            sidebarStyle: { ...prev.sidebarStyle, ...(data.data.sidebarStyle || {}) },
            bodyStyle: { ...prev.bodyStyle, ...(data.data.bodyStyle || {}) },
            footerStyle: { ...prev.footerStyle, ...(data.data.footerStyle || {}) },
          }));
        }
      } catch (error) {
        console.error('Failed to load officials config', error);
        // Fallback to local storage if API fails
        const saved = localStorage.getItem('barangayOfficials');
        if (saved) {
          setOfficials(prev => ({ ...prev, ...JSON.parse(saved) }));
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

  const startEditing = (field, value, type = 'name') => {
    setEditingField({ field, type });
    setTempValue(value || '');
  };
  const cancelEditing = () => { setEditingField(null); setTempValue(''); };

  const saveField = (fieldInfo) => {
    const { field, type } = fieldInfo;
    const value = tempValue.trim();

    // Descriptions
    if (type === 'description') {
      if (field.startsWith('councilor_')) {
        const index = parseInt(field.split('_')[1]);
        const newDesc = [...officials.descriptions.councilors];
        newDesc[index] = value;
        setOfficials({ ...officials, descriptions: { ...officials.descriptions, councilors: newDesc } });
      } else if (field.startsWith('skKagawad_')) {
        const index = parseInt(field.split('_')[1]);
        const newDesc = [...officials.descriptions.skKagawads];
        newDesc[index] = value;
        setOfficials({ ...officials, descriptions: { ...officials.descriptions, skKagawads: newDesc } });
      } else {
        setOfficials({ ...officials, descriptions: { ...officials.descriptions, [field]: value } });
      }
    }
    // Committees
    else if (type === 'committee') {
      if (field.startsWith('councilor_')) {
        const index = parseInt(field.split('_')[1]);
        const newComm = [...officials.committees.councilors];
        newComm[index] = value;
        setOfficials({ ...officials, committees: { ...officials.committees, councilors: newComm } });
      } else if (field.startsWith('skKagawad_')) {
        const index = parseInt(field.split('_')[1]);
        const newComm = [...officials.committees.skKagawads];
        newComm[index] = value;
        setOfficials({ ...officials, committees: { ...officials.committees, skKagawads: newComm } });
      }
    }
    // Names and others
    else {
      if (field.startsWith('councilor_')) {
        const index = parseInt(field.split('_')[1]);
        const newCouncilors = [...officials.councilors];
        newCouncilors[index] = value.toUpperCase();
        setOfficials({ ...officials, councilors: newCouncilors });
      } else if (field.startsWith('skKagawad_')) {
        const index = parseInt(field.split('_')[1]);
        const newSkKagawads = [...officials.skKagawads];
        newSkKagawads[index] = value.toUpperCase();
        setOfficials({ ...officials, skKagawads: newSkKagawads });
      } else if (field.startsWith('contact_')) {
        setOfficials({ ...officials, contactInfo: { ...officials.contactInfo, [field.replace('contact_', '')]: value } });
      } else if (field.startsWith('header_')) {
        setOfficials({ ...officials, headerInfo: { ...officials.headerInfo, [field.replace('header_', '')]: value } });
      } else if (field.startsWith('hero_')) {
        setOfficials({ ...officials, heroSection: { ...officials.heroSection, [field.replace('hero_', '')]: value } });
      } else {
        setOfficials({ ...officials, [field]: value.toUpperCase() });
      }
    }

    setEditingField(null); setTempValue(''); setHasChanges(true);
    setNotification({ type: 'success', message: 'Field updated' });
  };

  const handleHeroImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCroppingImg(reader.result);
        setTargetField('hero_image');
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

    if (field.startsWith('councilor_')) {
      const index = parseInt(field.split('_')[1]);
      const newImgs = [...officials.officialImages.councilors];
      newImgs[index] = base64;
      newOfficials.officialImages = { ...officials.officialImages, councilors: newImgs };
    } else if (field.startsWith('skKagawad_')) {
      const index = parseInt(field.split('_')[1]);
      const newImgs = [...officials.officialImages.skKagawads];
      newImgs[index] = base64;
      newOfficials.officialImages = { ...officials.officialImages, skKagawads: newImgs };
    } else if (field === 'hero_image') {
      newOfficials.heroSection = { ...officials.heroSection, image: base64 };
    } else {
      newOfficials.officialImages = { ...officials.officialImages, [field]: base64 };
    }

    setOfficials(newOfficials);
    setHasChanges(true);
    setCroppingImg(null);
    setTargetField(null);
    setNotification({ type: 'success', message: 'Official photo optimized and applied. Click Save All to finalize.' });
  };

  const updateStyle = (section, field, value) => {
    setOfficials({ ...officials, [section]: { ...officials[section], [field]: value } });
    setHasChanges(true);
  };

  const ImageCropperModal = ({ src, onApply, onCancel, cropWidth = 600, cropHeight = 600, modalTitle = 'CROP PROFILE PHOTO', modalSubtitle = '2x2 Official Resolution', outputFormat = 'image/png', quality }) => {
    const canvasRef = useRef(null);
    const [zoom, setZoom] = useState(1.2);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);

    useEffect(() => {
      const img = new Image();
      img.src = src;
      img.crossOrigin = 'anonymous';
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
      const ctx = canvas.getContext('2d');
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
        <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="font-black text-xl text-gray-900 tracking-tight flex items-center gap-2">
                <Crop className="w-6 h-6 text-blue-600" /> {modalTitle}
              </h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{modalSubtitle}</p>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-inner border-4 border-gray-100 cursor-move bg-white"
              style={{
                aspectRatio: cropWidth / cropHeight,
                backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              <canvas ref={canvasRef} className="w-full h-full relative z-10" />

              <div className="absolute top-4 left-4 bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-full backdrop-blur-md font-bold uppercase tracking-tighter z-20">
                Drag to Position Card
              </div>
            </div>

            <div className="mt-10 space-y-8">
              <div className="px-2">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Adjust Magnification</span>
                  <span className="text-2xl font-black text-blue-600 tabular-nums">{(zoom * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min="0.5" max="4" step="0.01" value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600 border border-gray-200" />
              </div>

              <div className="flex gap-4">
                <button onClick={onCancel}
                  className="flex-1 py-4 px-6 border-2 border-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-sm">
                  Discard
                </button>
                <button onClick={() => onApply(canvasRef.current.toDataURL(outputFormat, quality))}
                  className="flex-[2] py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black rounded-2xl hover:shadow-xl hover:shadow-blue-200 transition-all active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-2">
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
        let fieldName = '';
        if (side === 'left') fieldName = 'leftLogo';
        else if (side === 'right') fieldName = 'rightLogo';
        else if (side === 'captain') fieldName = 'captainImage';

        updateStyle('logos', fieldName, reader.result);
        setNotification({ type: 'success', message: `${side.charAt(0).toUpperCase() + side.slice(1)} image uploaded` });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = (side) => {
    let fieldName = '';
    if (side === 'left') fieldName = 'leftLogo';
    else if (side === 'right') fieldName = 'rightLogo';
    else if (side === 'captain') fieldName = 'captainImage';

    updateStyle('logos', fieldName, '');
    setNotification({ type: 'success', message: `${side.charAt(0).toUpperCase() + side.slice(1)} image removed` });
  };

  const saveAllChanges = async () => {
    setIsSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/officials/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(officials)
      });
      const data = await res.json();
      if (data.success) {
        setHasChanges(false);
        setNotification({ type: 'success', message: 'All changes saved to database!' });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Failed to save', error);
      setNotification({ type: 'error', message: 'Failed to save changes' });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = () => {
    if (confirm('Are you sure? This will revert all changes.')) {
      setOfficials(defaultOfficials);
      setHasChanges(true);
      setNotification({ type: 'success', message: 'Reset to default values. Click Save to apply.' });
    }
  };

  const EditableField = ({ label, field, value, icon: Icon, placeholder = '', showDescription = true, showCommittee = false }) => {
    const isEditingName = editingField?.field === field && editingField?.type === 'name';
    const isEditingDesc = editingField?.field === field && editingField?.type === 'description';
    const isEditingComm = editingField?.field === field && editingField?.type === 'committee';

    // Get image, description, and committee for this field
    let imageUrl = '';
    let description = '';
    let committee = '';

    if (field.startsWith('councilor_')) {
      const idx = parseInt(field.split('_')[1]);
      imageUrl = officials.officialImages.councilors[idx];
      description = officials.descriptions?.councilors[idx] || '';
      committee = officials.committees?.councilors[idx] || '';
    } else if (field.startsWith('skKagawad_')) {
      const idx = parseInt(field.split('_')[1]);
      imageUrl = officials.officialImages.skKagawads[idx];
      description = officials.descriptions?.skKagawads[idx] || '';
      committee = officials.committees?.skKagawads[idx] || '';
    } else {
      imageUrl = officials.officialImages[field];
      description = officials.descriptions?.[field] || '';
      // Non-array fields usually don't have committees in this simple structure, but could extend if needed
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all group flex flex-col h-full">
        {/* Header: Label & Photo */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-1.5 rounded-lg"><Icon className="w-4 h-4 text-blue-600" /></div>
            <span className="text-sm font-medium text-gray-600">{label}</span>
          </div>

          <div className="relative group/photo">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center text-gray-400">
              {imageUrl ? (
                <img src={imageUrl} alt="Official Photo" className="w-full h-full object-cover" />
              ) : (
                <Users className="w-8 h-8 opacity-20" />
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleOfficialImageUpload(field, e)} />
              <Edit2 className="w-3 h-3" />
            </label>
          </div>
        </div>

        {/* Name Field */}
        <div className="mb-3">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input type="text" value={tempValue} onChange={(e) => setTempValue(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-sm" autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveField({ field, type: 'name' });
                  if (e.key === 'Escape') cancelEditing();
                }} />
              <button onClick={() => saveField({ field, type: 'name' })} className="p-2 bg-green-100 text-green-600 rounded-lg"><Check className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center justify-between group/edit">
              <span className={`text-base font-bold truncate pr-2 ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>{value || '(Name not set)'}</span>
              <button onClick={() => startEditing(field, value, 'name')} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover/edit:opacity-100 transition-opacity"><Edit2 className="w-3 h-3" /></button>
            </div>
          )}
        </div>

        {/* Committee Field (Optional) */}
        {showCommittee && (
          <div className="mb-2">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Committee</label>
            {isEditingComm ? (
              <div className="flex items-center gap-2 mt-1">
                <input type="text" value={tempValue} onChange={(e) => setTempValue(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-blue-300 rounded text-xs" autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveField({ field, type: 'committee' });
                    if (e.key === 'Escape') cancelEditing();
                  }} />
                <button onClick={() => saveField({ field, type: 'committee' })} className="p-1 px-2 bg-green-100 text-green-600 rounded"><Check className="w-3 h-3" /></button>
              </div>
            ) : (
              <div className="flex items-center justify-between group/comm mt-0.5">
                <span className={`text-xs font-medium ${committee ? 'text-blue-700' : 'text-gray-400 italic'}`}>{committee || 'No committee assigned'}</span>
                <button onClick={() => startEditing(field, committee, 'committee')} className="p-1 text-gray-400 hover:text-blue-600 rounded opacity-0 group-hover/comm:opacity-100 transition-opacity"><Edit2 className="w-3 h-3" /></button>
              </div>
            )}
          </div>
        )}

        {/* Description Field (Optional) */}
        {showDescription && (
          <div className="mt-auto pt-2 border-t border-gray-100">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Description</label>
            {isEditingDesc ? (
              <div className="flex flex-col gap-2 mt-1">
                <textarea value={tempValue} onChange={(e) => setTempValue(e.target.value)}
                  className="w-full px-2 py-1.5 border border-blue-300 rounded text-xs resize-none" rows={2} autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault(); // Prevent newline
                      saveField({ field, type: 'description' });
                    }
                    if (e.key === 'Escape') cancelEditing();
                  }} />
                <div className="flex justify-end gap-2">
                  <button onClick={cancelEditing} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">Cancel</button>
                  <button onClick={() => saveField({ field, type: 'description' })} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Save</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between group/desc mt-0.5 relative">
                <p className={`text-xs leading-relaxed line-clamp-2 ${description ? 'text-gray-600' : 'text-gray-400 italic'}`}>{description || 'No description added'}</p>
                <button onClick={() => startEditing(field, description, 'description')} className="absolute bottom-0 right-0 bg-white shadow-sm p-1 text-gray-400 hover:text-blue-600 border border-gray-200 rounded opacity-0 group-hover/desc:opacity-100 transition-opacity"><Edit2 className="w-3 h-3" /></button>
              </div>
            )}
          </div>
        )}

      </div>
    );
  };

  const ColorPicker = ({ label, value, onChange, section, field }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <label className="text-xs font-medium text-gray-600 block mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(section, field, e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0" />
        <span className="text-xs font-mono text-gray-500">{value}</span>
      </div>
    </div>
  );

  const SizeSlider = ({ label, value, onChange, section, field, min = 8, max = 32 }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <label className="text-xs font-medium text-gray-600 block mb-2">{label}: {value}px</label>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(section, field, parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
    </div>
  );

  const FontSelect = ({ label, value, onChange, section, field }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <label className="text-xs font-medium text-gray-600 block mb-2">{label}</label>
      <select value={value} onChange={(e) => onChange(section, field, e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
        <option value="default">Default</option>
        <option value="serif">Serif</option>
        <option value="sans">Sans-serif</option>
        <option value="mono">Monospace</option>
      </select>
    </div>
  );

  return (
    <Layout title="Barangay Officials" subtitle="Manage officials information">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Barangay Officials</h1>
            <p className="text-gray-600 mt-1">Manage the list of current barangay officials</p>
          </div>
          <div className="flex gap-3">
            <button onClick={resetToDefault} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Reset</button>
            <button
              onClick={saveAllChanges}
              disabled={!hasChanges || isSaving}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${!hasChanges
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : isSaving
                  ? 'bg-blue-600/80 text-white cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
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
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800 font-medium">Unsaved changes. Click "Save All" to apply.</span>
          </div>
        )}

        {/* Feature Section (Hero Header) */}
        <div className="bg-emerald-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <LayoutIcon className="w-6 h-6 text-emerald-300" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest">Feature Section (Hero Header)</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-2 block">Hero Title</label>
                  {editingField === 'hero_title' ? (
                    <div className="flex gap-2">
                      <input type="text" value={tempValue} onChange={(e) => setTempValue(e.target.value)}
                        className="flex-1 bg-white/10 border border-emerald-400/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400" autoFocus />
                      <button onClick={() => saveField('hero_title')} className="p-3 bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-colors"><Check className="w-5 h-5" /></button>
                      <button onClick={cancelEditing} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 group">
                      <span className="text-xl font-bold">{officials.heroSection?.title || 'BARANGAY OFFICIALS'}</span>
                      <button onClick={() => startEditing('hero_title', officials.heroSection?.title)} className="p-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-2 block">Hero Subtitle</label>
                  {editingField === 'hero_subtitle' ? (
                    <div className="flex gap-2">
                      <input type="text" value={tempValue} onChange={(e) => setTempValue(e.target.value)}
                        className="flex-1 bg-white/10 border border-emerald-400/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400" autoFocus />
                      <button onClick={() => saveField('hero_subtitle')} className="p-3 bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-colors"><Check className="w-5 h-5" /></button>
                      <button onClick={cancelEditing} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 group">
                      <span className="text-emerald-50/70">{officials.heroSection?.subtitle || 'Meet our dedicated team serving Iba O\' Este'}</span>
                      <button onClick={() => startEditing('hero_subtitle', officials.heroSection?.subtitle)} className="p-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-2 block">Hero Background Image</label>
                <div className="relative group aspect-video bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                  <img src={officials.heroSection?.image || '/images/barangay-officials.jpg'} alt="Hero Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                    <label className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold cursor-pointer hover:bg-emerald-400 hover:scale-105 transition-all shadow-xl flex items-center gap-2">
                      <Camera className="w-5 h-5" /> Change Hero Image
                      <input type="file" className="hidden" accept="image/*" onChange={handleHeroImageUpload} />
                    </label>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-400/60 mt-2 text-center uppercase tracking-widest font-bold font-mono">Recommended: 1920x600 px or similar wide aspect</p>
              </div>
            </div>
          </div>
        </div>

        {/* Officials List */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditableField label="Punong Barangay" field="chairman" value={officials.chairman} icon={Shield} />
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" />Kagawad</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {officials.councilors.map((c, i) => <EditableField key={i} label="Brgy. Kagawad" field={`councilor_${i}`} value={c} icon={UserCog} showCommittee={true} />)}
            </div>
          </div>

          <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-orange-600" />SK Council</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditableField label="SK Chairman" field="skChairman" value={officials.skChairman} icon={Shield} />
                <EditableField label="SK Secretary" field="skSecretary" value={officials.skSecretary} icon={UserCog} />
                <EditableField label="SK Treasurer" field="skTreasurer" value={officials.skTreasurer} icon={Award} />
              </div>

              <div className="border-t border-orange-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">SK Kagawad</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {officials.skKagawads.map((c, i) => (
                    <EditableField key={i} label={`SK Kagawad ${i + 1}`} field={`skKagawad_${i}`} value={c} icon={Users} showCommittee={true} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Building className="w-5 h-5 text-blue-600" />Staff</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EditableField label="Brgy. Secretary" field="secretary" value={officials.secretary} icon={UserCog} />
              <EditableField label="Brgy. Treasurer" field="treasurer" value={officials.treasurer} icon={Award} />
              <EditableField label="Brgy. Administrator" field="administrator" value={officials.administrator} icon={UserCog} />
              <EditableField label="Asst. Brgy. Secretary" field="assistantSecretary" value={officials.assistantSecretary} icon={UserCog} />
              <EditableField label="Asst. Brgy. Administrator" field="assistantAdministrator" value={officials.assistantAdministrator} icon={UserCog} />
              <EditableField label="Brgy. Record Keeper" field="recordKeeper" value={officials.recordKeeper} icon={UserCog} />
              <EditableField label="Brgy. Clerk" field="clerk" value={officials.clerk} icon={UserCog} />
            </div>
          </div>
        </div>

        {croppingImg && (
          <ImageCropperModal
            src={croppingImg}
            onApply={handleApplyCrop}
            onCancel={() => { setCroppingImg(null); setTargetField(null); }}
            cropWidth={targetField === 'hero_image' ? 1920 : 600}
            cropHeight={targetField === 'hero_image' ? 900 : 600}
            modalTitle={targetField === 'hero_image' ? 'CROP HERO BANNER' : 'CROP PROFILE PHOTO'}
            modalSubtitle={targetField === 'hero_image' ? '1920x900 Header Resolution' : '2x2 Official Resolution'}
            outputFormat={targetField === 'hero_image' ? 'image/jpeg' : 'image/png'}
            quality={targetField === 'hero_image' ? 0.85 : undefined}
          />
        )}
      </div>
    </Layout>
  );
}
