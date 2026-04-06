import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout/Layout';
import { Save, FileText, Globe, MapPin, Building, Shield, Palette, Image, Type, Upload, Trash2, AlertCircle, CheckCircle, Phone, UserCog, Mail, Eye } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

const API_URL = '/api';

const defaultOfficials = {
    // We need the full structure to avoid breaking things, even if we don't edit names here
    chairman: '',
    secretary: '',
    treasurer: '',
    skChairman: '',
    councilors: [],
    contactInfo: {
        address: '',
        contactPerson: '',
        telephone: '',
        email: ''
    },
    headerInfo: {
        country: 'Republic of the Philippines',
        province: '',
        municipality: '',
        barangayName: 'BARANGAY NAME',
        officeName: 'Office of the Punong Barangay'
    },
    logos: {
        leftLogo: '',
        rightLogo: '',
        logoSize: 115,
        captainImage: ''
    },
    headerStyle: {
        bgColor: '#ffffff',
        borderColor: '#1e40af',
        fontFamily: 'default',
        logoSpacing: 0
    },
    countryStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
    provinceStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
    municipalityStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
    barangayNameStyle: { color: '#1e40af', size: 20, fontWeight: 'bold', fontFamily: 'default' },
    officeNameStyle: { color: '#6b7280', size: 11, fontWeight: 'normal', fontFamily: 'default' },
    sidebarStyle: {
        bgColor: '#1e40af',
        gradientEnd: '#1e3a8a',
        textColor: '#ffffff',
        labelColor: '#fde047',
        titleSize: 14,
        textSize: 11,
        fontFamily: 'default',
        titleWeight: 'bold',
        nameWeight: 'bold',
        nameWeight: 'bold',
        letterSpacing: 'normal',
        showSidebar: true
    },
    bodyStyle: {
        bgColor: '#ffffff',
        textColor: '#1f2937',
        titleColor: '#1e3a8a',
        titleSize: 24,
        textSize: 14,
        fontFamily: 'default'
    },
    footerStyle: {
        bgColor: '#f9fafb',
        textColor: '#374151',
        borderColor: '#d1d5db',
        textSize: 9,
        fontFamily: 'default'
    },
    templates: {
        indigency: {
            title: "CERTIFICATE OF INDIGENCY",
            intro: "TO WHOM IT MAY CONCERN:",
            body1: "This is to certify that below mentioned person is a bona fide resident and their family belongs to the \"Indigent Families\" of this barangay as of date mentioned below. Further certifying that their income is not enough to sustain and support their basic needs:",
            body2: "", // Not used in new layout
            purpose: "This certification is being issued upon the request of above mentioned person for below purpose(s):"
        },
        clearance: {
            title: "BARANGAY CLEARANCE CERTIFICATE",
            intro: "TO WHOM IT MAY CONCERN:",
            body1: "This is to certify that below mentioned person is a bona fide resident of this barangay and has no derogatory record as of date mentioned below:",
            purpose: "This certification is being issued upon the request of above mentioned person for below purpose(s):"
        },
        residency: {
            title: "BARANGAY RESIDENCY CERTIFICATE",
            intro: "TO WHOM IT MAY CONCERN:",
            body1: "This is to certify that below mentioned person is a bona fide resident of this barangay as detailed below:",
            purpose: "This certification is being issued upon the request of above mentioned person for below purpose(s):\n1. PROOF OF RESIDENCY - POSTAL ID REQUIREMENT"
        }
    }
};

export default function CertificateLayoutPage() {
    const [officials, setOfficials] = useState(defaultOfficials);
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState('');
    const [notification, setNotification] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [activeTab, setActiveTab] = useState('header');
    const [previewType, setPreviewType] = useState('indigency');
    const [isSaving, setIsSaving] = useState(false);
    const leftLogoRef = useRef(null);
    const rightLogoRef = useRef(null);
    const captainImageRef = useRef(null);
    const [activeTemplateField, setActiveTemplateField] = useState('body1'); // Default to body1

    const placeholders = [
        { label: 'Name', value: '[NAME]' },
        { label: 'Age', value: '[AGE]' },
        { label: 'Civil Status', value: '[CIVIL_STATUS]' },
        { label: 'Barangay Name', value: '[BARANGAY]' },
        { label: 'Purpose', value: '[PURPOSE]' },
        { label: 'Date', value: '[DATE]' }
    ];

    const insertPlaceholder = (placeholder) => {
        if (!activeTemplateField || !previewType) return;

        const currentContent = officials.templates?.[previewType]?.[activeTemplateField] || '';
        const newContent = currentContent + (currentContent.endsWith(' ') ? '' : ' ') + placeholder;

        const newTemplates = { ...officials.templates };
        newTemplates[previewType] = {
            ...(newTemplates[previewType] || {}),
            [activeTemplateField]: newContent
        };

        setOfficials({ ...officials, templates: newTemplates });
        setHasChanges(true);
        setNotification({ type: 'success', message: `Added ${placeholder} to ${activeTemplateField}` });
    };

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const token = getAuthToken();
                const res = await fetch(`${API_URL}/officials/config`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.success && data.data) {
                    setOfficials(prev => ({
                        ...prev,
                        ...data.data,
                        logos: { ...prev.logos, ...(data.data.logos || {}) },
                        headerInfo: { ...prev.headerInfo, ...(data.data.headerInfo || {}) },
                        headerStyle: { ...prev.headerStyle, ...(data.data.headerStyle || {}) },
                        sidebarStyle: { ...prev.sidebarStyle, ...(data.data.sidebarStyle || {}) },
                        bodyStyle: { ...prev.bodyStyle, ...(data.data.bodyStyle || {}) },
                        footerStyle: { ...prev.footerStyle, ...(data.data.footerStyle || {}) },
                        // Styles
                        countryStyle: { ...prev.countryStyle, ...(data.data.countryStyle || {}) },
                        provinceStyle: { ...prev.provinceStyle, ...(data.data.provinceStyle || {}) },
                        municipalityStyle: { ...prev.municipalityStyle, ...(data.data.municipalityStyle || {}) },
                        barangayNameStyle: { ...prev.barangayNameStyle, ...(data.data.barangayNameStyle || {}) },
                        officeNameStyle: { ...prev.officeNameStyle, ...(data.data.officeNameStyle || {}) },
                        templates: {
                            indigency: { ...(prev.templates?.indigency || {}), ...(data.data.templates?.indigency || {}) },
                            clearance: { ...(prev.templates?.clearance || {}), ...(data.data.templates?.clearance || {}) },
                            residency: { ...(prev.templates?.residency || {}), ...(data.data.templates?.residency || {}) }
                        }
                    }));
                }
            } catch (error) {
                console.error('Failed to load config', error);
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

    const updateStyle = (section, field, value) => {
        setOfficials({ ...officials, [section]: { ...officials[section], [field]: value } });
        setHasChanges(true);
    };

    const handleLogoUpload = (side, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                let fieldName = side === 'left' ? 'leftLogo' : side === 'right' ? 'rightLogo' : 'captainImage';
                updateStyle('logos', fieldName, reader.result);
                setNotification({ type: 'success', message: 'Image uploaded' });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = (side) => {
        let fieldName = side === 'left' ? 'leftLogo' : side === 'right' ? 'rightLogo' : 'captainImage';
        updateStyle('logos', fieldName, '');
        setNotification({ type: 'success', message: 'Image removed' });
    };

    // Helper for text editing (Header Text)
    const startEditing = (field, value) => { setEditingField(field); setTempValue(value || ''); };
    const cancelEditing = () => { setEditingField(null); setTempValue(''); };
    const saveField = (field) => {
        const value = tempValue.trim();
        if (field.startsWith('header_')) {
            const key = field.replace('header_', '');
            setOfficials({ ...officials, headerInfo: { ...officials.headerInfo, [key]: value } });
            setHasChanges(true);
            setEditingField(null);
            setNotification({ type: 'success', message: 'Text updated' });
        } else if (field.startsWith('contact_')) {
            const key = field.replace('contact_', '');
            setOfficials({ ...officials, contactInfo: { ...officials.contactInfo, [key]: value } });
            setHasChanges(true);
            setEditingField(null);
            setNotification({ type: 'success', message: 'Contact info updated' });
        }
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
                setNotification({ type: 'success', message: 'Layout settings saved!' });
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

    const EditableField = ({ label, field, value, icon: Icon }) => {
        const isEditing = editingField === field;
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-100 p-1.5 rounded-lg"><Icon className="w-4 h-4 text-blue-600" /></div>
                    <span className="text-sm font-medium text-gray-600">{label}</span>
                </div>
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input type="text" value={tempValue} onChange={(e) => setTempValue(e.target.value)}
                            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold" autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') saveField(field); if (e.key === 'Escape') cancelEditing(); }} />
                        <button onClick={() => saveField(field)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><CheckCircle className="w-5 h-5" /></button>
                        <button onClick={cancelEditing} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><Trash2 className="w-5 h-5" /></button> {/* Using Trash/X icon */}
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">{value || '(Not set)'}</span>
                        <button onClick={() => startEditing(field, value)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Palette className="w-5 h-5" /></button>
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

    const tabs = [
        { id: 'header', label: 'Header & Logos', icon: Image },
        { id: 'sidebar', label: 'Sidebar Style', icon: Palette },
        { id: 'body', label: 'Body Style', icon: Type },
        { id: 'footer', label: 'Footer Style', icon: FileText },
        { id: 'preview', label: 'Full Layout', icon: Eye }
    ];

    return (
        <Layout title="Certificate Layout" subtitle="Customize PDF appearance">
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Certificate Layout</h1>
                        <p className="text-gray-600 mt-1">Customize the design and structure of printed certificates</p>
                    </div>
                    <button onClick={saveAllChanges} disabled={!hasChanges}
                        className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${hasChanges ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
                        <Save className="w-5 h-5" />Save Changes
                    </button>
                </div>

                {notification && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl border ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-medium">{notification.message}</span>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            <tab.icon className="w-4 h-4" />{tab.label}
                        </button>
                    ))}
                </div>

                {/* Header Tab */}
                {activeTab === 'header' && (
                    <div className="space-y-6">
                        {/* Logo Upload */}
                        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Image className="w-5 h-5 text-purple-600" />Certificate Logos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Logo */}
                                <div className="bg-white rounded-xl p-4 border">
                                    <label className="text-sm font-medium text-gray-700 block mb-3">Left Logo (Barangay)</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                                            {officials.logos?.leftLogo ? <img src={officials.logos.leftLogo} className="w-full h-full object-contain" /> : <Image className="w-8 h-8 text-gray-400" />}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <input type="file" ref={leftLogoRef} accept="image/*" onChange={(e) => handleLogoUpload('left', e)} className="hidden" />
                                            <button onClick={() => leftLogoRef.current?.click()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-purple-700"><Upload className="w-4 h-4" />Upload</button>
                                            {officials.logos?.leftLogo && <button onClick={() => removeLogo('left')} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2 hover:bg-red-200"><Trash2 className="w-4 h-4" />Remove</button>}
                                        </div>
                                    </div>
                                </div>
                                {/* Right Logo */}
                                <div className="bg-white rounded-xl p-4 border">
                                    <label className="text-sm font-medium text-gray-700 block mb-3">Right Logo (Municipality)</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                                            {officials.logos?.rightLogo ? <img src={officials.logos.rightLogo} className="w-full h-full object-contain" /> : <Image className="w-8 h-8 text-gray-400" />}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <input type="file" ref={rightLogoRef} accept="image/*" onChange={(e) => handleLogoUpload('right', e)} className="hidden" />
                                            <button onClick={() => rightLogoRef.current?.click()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-purple-700"><Upload className="w-4 h-4" />Upload</button>
                                            {officials.logos?.rightLogo && <button onClick={() => removeLogo('right')} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2 hover:bg-red-200"><Trash2 className="w-4 h-4" />Remove</button>}
                                        </div>
                                    </div>
                                </div>
                                {/* Captain Image */}
                                <div className="bg-white rounded-xl p-4 border md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700 block mb-3">Punong Barangay Portrait</label>
                                    <div className="flex items-center gap-6">
                                        <div className="w-32 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden shadow-inner">
                                            {officials.logos?.captainImage ? <img src={officials.logos.captainImage} className="w-full h-full object-cover" /> : <Image className="w-10 h-10 text-gray-400" />}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <p className="text-xs text-gray-500 mb-2">Appears in sidebar.<br />300x400 px recommended.</p>
                                            <div className="flex gap-2">
                                                <input type="file" ref={captainImageRef} accept="image/*" onChange={(e) => handleLogoUpload('captain', e)} className="hidden" />
                                                <button onClick={() => captainImageRef.current?.click()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-purple-700"><Upload className="w-4 h-4" />Upload</button>
                                                {officials.logos?.captainImage && <button onClick={() => removeLogo('captain')} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2 hover:bg-red-200"><Trash2 className="w-4 h-4" />Remove</button>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4"><SizeSlider label="Logo Size" value={officials.logos?.logoSize || 115} onChange={updateStyle} section="logos" field="logoSize" min={40} max={150} /></div>
                        </div>

                        {/* Header Text */}
                        <div className="bg-pink-50 rounded-2xl p-6 border border-pink-200">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-pink-600" />Header Text Content</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <EditableField label="Country" field="header_country" value={officials.headerInfo?.country} icon={Globe} />
                                <EditableField label="Province" field="header_province" value={officials.headerInfo?.province} icon={MapPin} />
                                <EditableField label="Municipality" field="header_municipality" value={officials.headerInfo?.municipality} icon={Building} />
                                <EditableField label="Barangay Name" field="header_barangayName" value={officials.headerInfo?.barangayName} icon={Shield} />
                                <div className="md:col-span-2"><EditableField label="Office Name" field="header_officeName" value={officials.headerInfo?.officeName} icon={Building} /></div>
                            </div>
                        </div>

                        {/* Header Styling */}
                        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-200">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Type className="w-5 h-5 text-indigo-600" />Header Typography</h3>
                            {['country', 'province', 'municipality', 'barangayName', 'officeName'].map(type => (
                                <div key={type} className="bg-white rounded-xl p-4 border mb-4">
                                    <span className="font-medium text-gray-700 capitalize mb-2 block">{type.replace(/([A-Z])/g, ' $1').trim()} Style</span>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <ColorPicker label="Color" value={officials[`${type}Style`]?.color || '#000000'} onChange={updateStyle} section={`${type}Style`} field="color" />
                                        <SizeSlider label="Size" value={officials[`${type}Style`]?.size || 12} onChange={updateStyle} section={`${type}Style`} field="size" min={8} max={32} />
                                        <div className="bg-white rounded-xl border border-gray-200 p-3">
                                            <label className="text-xs font-medium text-gray-600 block mb-2">Weight</label>
                                            <select value={officials[`${type}Style`]?.fontWeight || 'normal'} onChange={(e) => updateStyle(`${type}Style`, 'fontWeight', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                                                <option value="normal">Normal</option><option value="bold">Bold</option>
                                            </select>
                                        </div>
                                        <FontSelect label="Font" value={officials[`${type}Style`]?.fontFamily || 'default'} onChange={updateStyle} section={`${type}Style`} field="fontFamily" />
                                    </div>
                                </div>
                            ))}
                            <div className="bg-gray-100 rounded-xl p-4 mt-4">
                                <h4 className="font-bold mb-2">Layout Config</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <ColorPicker label="Background" value={officials.headerStyle?.bgColor || '#ffffff'} onChange={updateStyle} section="headerStyle" field="bgColor" />
                                    <ColorPicker label="Border Color" value={officials.headerStyle?.borderColor || '#1e40af'} onChange={updateStyle} section="headerStyle" field="borderColor" />
                                    <SizeSlider label="Logo Spacing" value={officials.headerStyle?.logoSpacing || 0} onChange={updateStyle} section="headerStyle" field="logoSpacing" min={0} max={200} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sidebar Tab */}
                {activeTab === 'sidebar' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">Sidebar Appearance</h3>
                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-blue-100">
                                    <span className="text-sm font-medium text-gray-700">Show Sidebar</span>
                                    <button
                                        onClick={() => updateStyle('sidebarStyle', 'showSidebar', !officials.sidebarStyle?.showSidebar)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${officials.sidebarStyle?.showSidebar ? 'bg-blue-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${officials.sidebarStyle?.showSidebar ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <ColorPicker label="Gradient Start" value={officials.sidebarStyle?.bgColor} onChange={updateStyle} section="sidebarStyle" field="bgColor" />
                                <ColorPicker label="Gradient End" value={officials.sidebarStyle?.gradientEnd} onChange={updateStyle} section="sidebarStyle" field="gradientEnd" />
                                <ColorPicker label="Text Color" value={officials.sidebarStyle?.textColor} onChange={updateStyle} section="sidebarStyle" field="textColor" />
                                <ColorPicker label="Label Color" value={officials.sidebarStyle?.labelColor} onChange={updateStyle} section="sidebarStyle" field="labelColor" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SizeSlider label="Title Size" value={officials.sidebarStyle?.titleSize} onChange={updateStyle} section="sidebarStyle" field="titleSize" min={10} max={24} />
                                <SizeSlider label="Name Size" value={officials.sidebarStyle?.textSize} onChange={updateStyle} section="sidebarStyle" field="textSize" min={8} max={18} />
                                <div className="bg-white p-3 rounded-xl border">
                                    <label className="text-xs font-medium block mb-2">Letter Spacing</label>
                                    <select value={officials.sidebarStyle?.letterSpacing || 'normal'} onChange={(e) => updateStyle('sidebarStyle', 'letterSpacing', e.target.value)} className="w-full text-sm border rounded">
                                        <option value="tighter">Tighter</option><option value="normal">Normal</option><option value="wide">Wide</option><option value="widest">Widest</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        {/* Preview */}
                        <div className="bg-white rounded-2xl p-6 border">
                            <h3 className="font-bold text-gray-900 mb-4">Preview</h3>
                            {officials.sidebarStyle?.showSidebar ? (
                                <div className="w-56 p-4 rounded-lg" style={{
                                    background: `linear-gradient(to bottom, ${officials.sidebarStyle?.bgColor}, ${officials.sidebarStyle?.gradientEnd})`,
                                    color: officials.sidebarStyle?.textColor,
                                    letterSpacing: officials.sidebarStyle?.letterSpacing === 'tighter' ? '-0.05em' : officials.sidebarStyle?.letterSpacing === 'wide' ? '0.025em' : officials.sidebarStyle?.letterSpacing === 'widest' ? '0.1em' : 'normal'
                                }}>
                                    <div className="text-center">
                                        <p className="text-xs mb-1" style={{ color: officials.sidebarStyle?.labelColor, fontWeight: 'bold' }}>PUNONG BARANGAY</p>
                                        <p className="font-bold" style={{ fontSize: `${officials.sidebarStyle?.textSize}px` }}>{officials.chairman}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-56 h-32 p-4 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                    Sidebar Disabled
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Body Tab */}
                {activeTab === 'body' && (
                    <div className="space-y-6">
                        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                            <h3 className="font-bold text-gray-900 mb-4">Document Body</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <ColorPicker label="Background" value={officials.bodyStyle?.bgColor} onChange={updateStyle} section="bodyStyle" field="bgColor" />
                                <ColorPicker label="Text Color" value={officials.bodyStyle?.textColor} onChange={updateStyle} section="bodyStyle" field="textColor" />
                                <ColorPicker label="Title Color" value={officials.bodyStyle?.titleColor} onChange={updateStyle} section="bodyStyle" field="titleColor" />
                                <SizeSlider label="Title Size" value={officials.bodyStyle?.titleSize} onChange={updateStyle} section="bodyStyle" field="titleSize" min={18} max={48} />
                                <SizeSlider label="Body Text Size" value={officials.bodyStyle?.textSize} onChange={updateStyle} section="bodyStyle" field="textSize" min={10} max={20} />
                                <FontSelect label="Font" value={officials.bodyStyle?.fontFamily} onChange={updateStyle} section="bodyStyle" field="fontFamily" />
                            </div>
                        </div>

                        {/* Text Template Editor */}
                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" />Content Templates</h3>
                                {/* Type Selector for Editing */}
                                <div className="flex bg-white rounded-lg p-1 border shadow-sm">
                                    {['indigency', 'clearance', 'residency'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setPreviewType(type)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${previewType === type ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            {type === 'indigency' ? 'Indigency' : type === 'clearance' ? 'Clearance' : 'Residency'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Placeholders Toolbar */}
                            <div className="bg-white p-3 rounded-xl border mb-4">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Insert Placeholder</label>
                                <div className="flex flex-wrap gap-2">
                                    {placeholders.map(p => (
                                        <button
                                            key={p.value}
                                            onClick={() => insertPlaceholder(p.value)}
                                            className="px-2 py-1 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 text-xs font-medium rounded border border-gray-200 hover:border-blue-200 transition-colors"
                                            title={`Click to insert ${p.label}`}
                                        >
                                            {p.value}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Click a field below, then click a placeholder to add it.</p>
                            </div>

                            <div className="space-y-4">
                                <div className={`bg-white rounded-xl p-4 border space-y-3 transition-colors ${activeTemplateField === 'title' ? 'ring-2 ring-blue-100 border-blue-300' : ''}`}>
                                    <label className="text-sm font-medium text-gray-700 block">Title</label>
                                    <input
                                        type="text"
                                        value={officials.templates?.[previewType]?.title || ''}
                                        onFocus={() => setActiveTemplateField('title')}
                                        onChange={(e) => {
                                            const newTemplates = { ...officials.templates };
                                            newTemplates[previewType] = { ...newTemplates[previewType], title: e.target.value };
                                            setOfficials({ ...officials, templates: newTemplates });
                                            setHasChanges(true);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-blue-800"
                                    />
                                </div>

                                <div className={`bg-white rounded-xl p-4 border space-y-3 transition-colors ${activeTemplateField === 'intro' ? 'ring-2 ring-blue-100 border-blue-300' : ''}`}>
                                    <label className="text-sm font-medium text-gray-700 block">Salutation / Intro</label>
                                    <input
                                        type="text"
                                        value={officials.templates?.[previewType]?.intro || ''}
                                        onFocus={() => setActiveTemplateField('intro')}
                                        onChange={(e) => {
                                            const newTemplates = { ...officials.templates };
                                            newTemplates[previewType] = { ...newTemplates[previewType], intro: e.target.value };
                                            setOfficials({ ...officials, templates: newTemplates });
                                            setHasChanges(true);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                                    />
                                </div>

                                <div className={`bg-white rounded-xl p-4 border space-y-3 transition-colors ${activeTemplateField === 'body1' ? 'ring-2 ring-blue-100 border-blue-300' : ''}`}>
                                    <label className="text-sm font-medium text-gray-700 block">First Paragraph / Certification Text</label>
                                    <textarea
                                        rows={3}
                                        value={officials.templates?.[previewType]?.body1 || ''}
                                        onFocus={() => setActiveTemplateField('body1')}
                                        onChange={(e) => {
                                            const newTemplates = { ...officials.templates };
                                            newTemplates[previewType] = { ...newTemplates[previewType], body1: e.target.value };
                                            setOfficials({ ...officials, templates: newTemplates });
                                            setHasChanges(true);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Use [NAME], [AGE], [CIVIL_STATUS], [BARANGAY] as placeholders"
                                    />
                                </div>

                                {previewType === 'indigency' && (
                                    <div className={`bg-white rounded-xl p-4 border space-y-3 transition-colors ${activeTemplateField === 'body2' ? 'ring-2 ring-blue-100 border-blue-300' : ''}`}>
                                        <label className="text-sm font-medium text-gray-700 block">Second Paragraph</label>
                                        <textarea
                                            rows={3}
                                            value={officials.templates?.[previewType]?.body2 || ''}
                                            onFocus={() => setActiveTemplateField('body2')}
                                            onChange={(e) => {
                                                const newTemplates = { ...officials.templates };
                                                newTemplates[previewType] = { ...newTemplates[previewType], body2: e.target.value };
                                                setOfficials({ ...officials, templates: newTemplates });
                                                setHasChanges(true);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                <div className={`bg-white rounded-xl p-4 border space-y-3 transition-colors ${activeTemplateField === 'purpose' ? 'ring-2 ring-blue-100 border-blue-300' : ''}`}>
                                    <label className="text-sm font-medium text-gray-700 block">Purpose / Closing Statement</label>
                                    <textarea
                                        rows={3}
                                        value={officials.templates?.[previewType]?.purpose || ''}
                                        onFocus={() => setActiveTemplateField('purpose')}
                                        onChange={(e) => {
                                            const newTemplates = { ...officials.templates };
                                            newTemplates[previewType] = { ...newTemplates[previewType], purpose: e.target.value };
                                            setOfficials({ ...officials, templates: newTemplates });
                                            setHasChanges(true);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Use [PURPOSE] as placeholder"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Tab */}
                {activeTab === 'footer' && (
                    <div className="space-y-6">
                        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                            <h3 className="font-bold text-gray-900 mb-4">Footer</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <ColorPicker label="Background" value={officials.footerStyle?.bgColor} onChange={updateStyle} section="footerStyle" field="bgColor" />
                                <ColorPicker label="Text Color" value={officials.footerStyle?.textColor} onChange={updateStyle} section="footerStyle" field="textColor" />
                                <ColorPicker label="Border Color" value={officials.footerStyle?.borderColor} onChange={updateStyle} section="footerStyle" field="borderColor" />
                                <SizeSlider label="Text Size" value={officials.footerStyle?.textSize} onChange={updateStyle} section="footerStyle" field="textSize" min={8} max={14} />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Phone className="w-5 h-5 text-green-600" />Contact Information (Appears in Footer)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2"><EditableField label="Address" field="contact_address" value={officials.contactInfo?.address} icon={MapPin} /></div>
                                <EditableField label="Contact Person" field="contact_contactPerson" value={officials.contactInfo?.contactPerson} icon={UserCog} />
                                <EditableField label="Telephone" field="contact_telephone" value={officials.contactInfo?.telephone} icon={Phone} />
                                <div className="md:col-span-2"><EditableField label="Email" field="contact_email" value={officials.contactInfo?.email} icon={Mail} /></div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Full Preview Tab */}
                {/* Full Preview Tab */}
                {activeTab === 'preview' && (
                    <div className="bg-gray-100 p-8 rounded-2xl overflow-auto border flex flex-col items-center">
                        {/* Type Selector */}
                        <div className="mb-6 flex gap-2 bg-white p-2 rounded-lg shadow-sm border">
                            {[
                                { id: 'indigency', label: 'Certificate of Indigency' },
                                { id: 'clearance', label: 'Barangay Clearance' },
                                { id: 'residency', label: 'Barangay Residency' }
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setPreviewType(type.id)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${previewType === type.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white shadow-2xl relative flex flex-col mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
                            {/* Header Section */}
                            <div className="w-full border-b flex justify-center items-center p-8" style={{
                                backgroundColor: officials.headerStyle?.bgColor,
                                borderColor: officials.headerStyle?.borderColor
                            }}>
                                {/* Left Logo */}
                                <div style={{
                                    width: `${officials.logos?.logoSize}px`,
                                    height: `${officials.logos?.logoSize}px`,
                                    marginRight: `${officials.headerStyle?.logoSpacing}px`
                                }} className="flex-shrink-0 transition-all duration-200">
                                    {officials.logos?.leftLogo && <img src={officials.logos.leftLogo} className="w-full h-full object-contain" alt="Left" />}
                                </div>

                                {/* Text Content */}
                                <div className="text-center flex flex-col justify-center">
                                    <p style={{ color: officials.countryStyle?.color, fontSize: `${officials.countryStyle?.size}px`, fontWeight: officials.countryStyle?.fontWeight, fontFamily: officials.countryStyle?.fontFamily }}>{officials.headerInfo?.country}</p>
                                    <p style={{ color: officials.provinceStyle?.color, fontSize: `${officials.provinceStyle?.size}px`, fontWeight: officials.provinceStyle?.fontWeight, fontFamily: officials.provinceStyle?.fontFamily }}>{officials.headerInfo?.province}</p>
                                    <p style={{ color: officials.municipalityStyle?.color, fontSize: `${officials.municipalityStyle?.size}px`, fontWeight: officials.municipalityStyle?.fontWeight, fontFamily: officials.municipalityStyle?.fontFamily }}>{officials.headerInfo?.municipality}</p>
                                    <p className="mt-1" style={{ color: officials.barangayNameStyle?.color, fontSize: `${officials.barangayNameStyle?.size}px`, fontWeight: officials.barangayNameStyle?.fontWeight, fontFamily: officials.barangayNameStyle?.fontFamily }}>{officials.headerInfo?.barangayName}</p>
                                    <p style={{ color: officials.officeNameStyle?.color, fontSize: `${officials.officeNameStyle?.size}px`, fontWeight: officials.officeNameStyle?.fontWeight, fontFamily: officials.officeNameStyle?.fontFamily }}>{officials.headerInfo?.officeName}</p>
                                </div>

                                {/* Right Logo */}
                                <div style={{
                                    width: `${officials.logos?.logoSize}px`,
                                    height: `${officials.logos?.logoSize}px`,
                                    marginLeft: `${officials.headerStyle?.logoSpacing}px`
                                }} className="flex-shrink-0 transition-all duration-200">
                                    {officials.logos?.rightLogo && <img src={officials.logos.rightLogo} className="w-full h-full object-contain" alt="Right" />}
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex flex-1 relative">
                                {/* Sidebar (Conditional) */}
                                {officials.sidebarStyle?.showSidebar && (
                                    <div className="w-64 p-6 flex flex-col text-center" style={{
                                        background: `linear-gradient(to bottom, ${officials.sidebarStyle?.bgColor}, ${officials.sidebarStyle?.gradientEnd})`,
                                        color: officials.sidebarStyle?.textColor
                                    }}>
                                        {/* Captain Image */}
                                        <div className="mb-4 mx-auto w-32 h-40 bg-white/20 rounded-lg overflow-hidden">
                                            {officials.logos?.captainImage && <img src={officials.logos.captainImage} className="w-full h-full object-cover" alt="Captain" />}
                                        </div>

                                        {/* Punong Barangay */}
                                        <div className="mb-6">
                                            <p className="mb-1 uppercase tracking-wider" style={{ color: officials.sidebarStyle?.labelColor, fontSize: '10px', fontWeight: 'bold' }}>PUNONG BARANGAY</p>
                                            <p style={{ fontSize: `${officials.sidebarStyle?.textSize}px`, fontWeight: officials.sidebarStyle?.nameWeight || 'bold' }}>{officials.chairman}</p>
                                        </div>

                                        {/* Councilors (Placeholder) */}
                                        <div className="space-y-4">
                                            <div>
                                                <p className="mb-1 uppercase tracking-wider" style={{ color: officials.sidebarStyle?.labelColor, fontSize: '10px', fontWeight: 'bold' }}>SANGGUNIANG BARANGAY</p>
                                                {['Kagawad One', 'Kagawad Two', 'Kagawad Three'].map((k, i) => (
                                                    <p key={i} className="mb-1" style={{ fontSize: `${(officials.sidebarStyle?.textSize || 12) - 1}px` }}>{k}</p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Document Body */}
                                <div className="flex-1 px-12 pt-6 pb-12 relative" style={{ backgroundColor: officials.bodyStyle?.bgColor }}>
                                    {/* Watermark/Background Logo */}
                                    {officials.logos?.leftLogo && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
                                            <img src={officials.logos.leftLogo} className="w-3/4 object-contain" alt="Watermark" />
                                        </div>
                                    )}

                                    <div className="relative z-10 flex flex-col items-center">
                                        <h2 className="text-center font-bold mb-10 border-b-2 inline-block pb-4 px-8 uppercase leading-normal" style={{
                                            color: officials.bodyStyle?.titleColor,
                                            borderColor: officials.bodyStyle?.titleColor,
                                            fontSize: `${officials.bodyStyle?.titleSize}px`,
                                            fontFamily: officials.bodyStyle?.fontFamily
                                        }}>
                                            {officials.templates?.[previewType]?.title || (previewType === 'indigency' ? 'CERTIFICATE OF INDIGENCY' : previewType === 'clearance' ? 'BARANGAY CLEARANCE CERTIFICATE' : 'BARANGAY RESIDENCY CERTIFICATE')}
                                        </h2>

                                        <div className="w-full space-y-6 text-justify" style={{
                                            color: officials.bodyStyle?.textColor,
                                            fontSize: `${officials.bodyStyle?.textSize}px`,
                                            fontFamily: officials.bodyStyle?.fontFamily
                                        }}>
                                            <div className="flex justify-between items-center mb-8">
                                                <p><strong>{officials.templates?.[previewType]?.intro || "TO WHOM IT MAY CONCERN:"}</strong></p>
                                            </div>

                                            {previewType === 'indigency' ? (
                                                <div className="w-full text-left">
                                                    <p className="mb-8 leading-relaxed whitespace-pre-wrap">
                                                        {(officials.templates?.indigency?.body1 && !officials.templates?.indigency?.body1.includes('[NAME]'))
                                                            ? officials.templates?.indigency?.body1
                                                            : "This is to certify that below mentioned person is a bona fide resident and their family belongs to the \"Indigent Families\" of this barangay as of date mentioned below. Further certifying that their income is not enough to sustain and support their basic needs:"}
                                                    </p>

                                                    <div className="mb-6 space-y-1 pl-4">
                                                        <div className="grid grid-cols-[160px_10px_1fr]">
                                                            <span className="font-semibold">Name</span><span>:</span><span className="font-bold uppercase text-lg">JUAN DELA CRUZ</span>
                                                        </div>
                                                        <div className="grid grid-cols-[160px_10px_1fr]">
                                                            <span className="font-semibold">Age</span><span>:</span><span className="font-bold uppercase">25</span>
                                                        </div>
                                                        <div className="grid grid-cols-[160px_10px_1fr]">
                                                            <span className="font-semibold">Sex</span><span>:</span><span className="font-bold uppercase">MALE</span>
                                                        </div>
                                                        <div className="grid grid-cols-[160px_10px_1fr]">
                                                            <span className="font-semibold">Civil Status</span><span>:</span><span className="font-bold uppercase">SINGLE</span>
                                                        </div>
                                                        <div className="grid grid-cols-[160px_10px_1fr]">
                                                            <span className="font-semibold">Residential Address</span><span>:</span><span className="font-bold uppercase">{officials.contactInfo?.address || 'PUROK 1'}</span>
                                                        </div>
                                                        <div className="grid grid-cols-[160px_10px_1fr]">
                                                            <span className="font-semibold">Date of Birth</span><span>:</span><span className="font-bold uppercase">JANUARY 1, 1999</span>
                                                        </div>
                                                        <div className="grid grid-cols-[160px_10px_1fr]">
                                                            <span className="font-semibold">Place of Birth</span><span>:</span><span className="font-bold uppercase">CALUMPIT, BULACAN</span>
                                                        </div>
                                                    </div>

                                                    <p className="mb-2 leading-relaxed whitespace-pre-wrap">
                                                        {(officials.templates?.indigency?.purpose && !officials.templates?.indigency?.purpose.includes('[PURPOSE]'))
                                                            ? officials.templates?.indigency?.purpose
                                                            : "This certification is being issued upon the request of above mentioned person for below purpose(s):"}
                                                    </p>

                                                    {/* 5 vacant lines spacer */}
                                                    <div className="h-32"></div>

                                                    <p className="mb-12">
                                                        Issued this <strong>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong> at {officials.headerInfo?.barangayName}, {officials.headerInfo?.municipality}, {officials.headerInfo?.province}.
                                                    </p>

                                                    {/* Unified Signature Section (Left Aligned for All) - MATCHING MODAL */}
                                                    <div className="mt-8 relative">
                                                        <div className="mb-4">
                                                            <div className="h-4"></div>
                                                            <div className="border-t border-black w-64 pt-1">
                                                                <p className="text-sm">Resident's Signature / Thumb Mark</p>
                                                            </div>
                                                        </div>

                                                        <div className="text-left mb-8 self-start">
                                                            <p className="font-bold mb-20">TRULY YOURS,</p>
                                                            <p className="uppercase font-bold mb-1" style={{
                                                                color: officials.bodyStyle?.titleColor,
                                                                fontSize: `${parseInt(officials.bodyStyle?.textSize) + 2}px`
                                                            }}>
                                                                {officials.chairman}
                                                            </p>
                                                            <p className="text-xs font-bold">BARANGAY CHAIRMAN</p>
                                                        </div>
                                                    </div>

                                                    {/* Reference Number Section */}
                                                    <div className="w-full text-right mt-auto mb-2 text-xs">
                                                        <p>Ref No: <strong>BRGY-2026-00001</strong></p>
                                                    </div>

                                                    <div className="clear-both pt-1 border-t border-gray-400 w-full text-xs text-left">
                                                        <p><strong>Address:</strong> {officials.contactInfo?.address}</p>
                                                        <p><strong>Contact:</strong> {officials.contactInfo?.contactPerson} ({officials.contactInfo?.telephone}) email: {officials.contactInfo?.email}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-4 text-left w-full">
                                                    <p className="text-left mb-8 whitespace-pre-wrap leading-relaxed">
                                                        {previewType === 'clearance' ?
                                                            (officials.templates?.clearance?.body1 || 'This is to certify that below mentioned person is a bona fide resident of this barangay and has no derogatory record as of date mentioned below:') :
                                                            (officials.templates?.residency?.body1 || 'This is to certify that below mentioned person is a bona fide resident of this barangay as detailed below:')}
                                                    </p>

                                                    <div className="mb-8 ml-8">
                                                        <table className="w-full text-left">
                                                            <tbody>
                                                                {[
                                                                    { label: 'Name', value: 'JUAN DELA CRUZ' },
                                                                    { label: 'Age', value: '25' },
                                                                    { label: 'Sex', value: 'MALE' },
                                                                    { label: 'Civil Status', value: 'SINGLE' },
                                                                    { label: 'Residential Address', value: officials.contactInfo?.address || 'PUROK 1' },
                                                                    { label: 'Date of Birth', value: 'JANUARY 1, 1999' },
                                                                    { label: 'Place of Birth', value: 'CALUMPIT, BULACAN' }
                                                                ].map((row, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="font-semibold py-1 w-48 align-top text-gray-700">{row.label}</td>
                                                                        <td className="font-bold py-1 align-top uppercase flex text-gray-900"><span className="mr-4 text-gray-500">:</span> {row.value}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    <div className="mb-4">
                                                        <p className="whitespace-pre-wrap mb-2">
                                                            {officials.templates?.[previewType]?.purpose || "This certification is being issued upon the request of above mentioned person for below purpose(s):"}
                                                        </p>
                                                        <div className="h-24 border-l-2 border-dashed border-gray-200 ml-8 pl-4 flex items-center text-gray-400 italic">
                                                            (Purpose details will appear here)
                                                        </div>
                                                    </div>

                                                    <p className="mb-12">
                                                        Issued this {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at <span className="capitalize">{officials.headerInfo?.barangayName?.toLowerCase()}</span>, {officials.headerInfo?.municipality}, {officials.headerInfo?.province}.
                                                    </p>

                                                    {/* Other Certificate Signatures */}
                                                    <div className="mt-8 relative">
                                                        <div className="mb-4">
                                                            <div className="h-8"></div>
                                                            <div className="border-t border-black w-64 pt-1">
                                                                <p className="text-sm">Resident's Signature / Thumb Mark</p>
                                                            </div>
                                                        </div>

                                                        <div className="text-left mb-8 self-start">
                                                            <p className="font-bold mb-20">TRULY YOURS,</p>
                                                            <p className="uppercase font-bold mb-1" style={{
                                                                fontSize: `${parseInt(officials.bodyStyle?.textSize) + 2}px`
                                                            }}>
                                                                {officials.chairman}
                                                            </p>
                                                            <p className="text-xs font-bold">BARANGAY CHAIRMAN</p>
                                                        </div>

                                                        {/* Reference Number Section */}
                                                        <div className="w-full text-right mt-auto mb-2 text-xs">
                                                            <p>Ref No: <strong>BRGY-2026-00001</strong></p>
                                                        </div>

                                                        <div className="clear-both pt-1 border-t border-gray-400 w-full text-xs">
                                                            <p><strong>Address:</strong> {officials.contactInfo?.address}</p>
                                                            <p><strong>Contact:</strong> {officials.contactInfo?.contactPerson} ({officials.contactInfo?.telephone}) email: {officials.contactInfo?.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </Layout>
    );
}
