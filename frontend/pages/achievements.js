import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout/Layout';
import {
    Save, Plus, Edit2, Trash2, Image, Award,
    ChevronUp, ChevronDown, Eye, X, Check, AlertCircle, CheckCircle,
    Upload, Loader2, Trophy, Star, Target, Shield, Medal
} from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

const API_URL = '/api';

const defaultAchievements = [];

const colorOptions = [
    { name: 'Red', value: 'bg-red-500', text: 'red-400' },
    { name: 'Blue', value: 'bg-blue-500', text: 'blue-400' },
    { name: 'Green', value: 'bg-green-500', text: 'green-400' },
    { name: 'Purple', value: 'bg-purple-500', text: 'purple-400' },
    { name: 'Pink', value: 'bg-pink-500', text: 'pink-400' },
    { name: 'Orange', value: 'bg-orange-500', text: 'orange-400' },
    { name: 'Yellow', value: 'bg-yellow-500', text: 'yellow-400' },
    { name: 'Indigo', value: 'bg-indigo-500', text: 'indigo-400' }
];

export default function AchievementsPage() {
    const [achievements, setAchievements] = useState([]);
    const [editingAchievement, setEditingAchievement] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [notification, setNotification] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        year: new Date().getFullYear().toString(),
        image: '',
        color_class: 'bg-blue-500',
        text_color: 'blue-400'
    });

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/achievements`);
            const data = await response.json();

            if (data.success) {
                setAchievements(data.data || []);
            } else {
                setAchievements([]);
            }
        } catch (error) {
            console.error('Error fetching achievements:', error);
            setAchievements([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const saveAllChanges = async () => {
        try {
            setSaving(true);
            const token = getAuthToken();

            const response = await fetch(`${API_URL}/achievements/bulk/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ achievements })
            });

            const data = await response.json();

            if (data.success) {
                setHasChanges(false);
                setNotification({ type: 'success', message: 'Achievements saved successfully!' });
                fetchAchievements();
            } else {
                setNotification({ type: 'error', message: data.message || 'Failed to save achievements' });
            }
        } catch (error) {
            console.error('Error saving achievements:', error);
            setNotification({ type: 'error', message: 'Failed to save achievements. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = (e, isEditing = false) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setNotification({ type: 'error', message: 'Image size must be less than 2MB' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (isEditing && editingAchievement) {
                setEditingAchievement({ ...editingAchievement, image: reader.result });
            } else {
                setFormData({ ...formData, image: reader.result });
            }
            setNotification({ type: 'success', message: 'Image uploaded successfully' });
        };
        reader.readAsDataURL(file);
    };

    const openAddModal = () => {
        setFormData({
            title: '',
            category: '',
            description: '',
            year: new Date().getFullYear().toString(),
            image: '',
            color_class: 'bg-blue-500',
            text_color: 'blue-400'
        });
        setShowAddModal(true);
    };

    const addAchievement = () => {
        if (!formData.title.trim() || !formData.category.trim() || !formData.description.trim()) {
            setNotification({ type: 'error', message: 'Please fill in all required fields' });
            return;
        }
        const newAchievement = { ...formData, id: Date.now() };
        setAchievements([newAchievement, ...achievements]);
        setShowAddModal(false);
        setHasChanges(true);
        setNotification({ type: 'success', message: 'Achievement added. Remember to Save All.' });
    };

    const startEditing = (achievement) => {
        setEditingAchievement({ ...achievement });
    };

    const saveEdit = () => {
        if (!editingAchievement.title.trim() || !editingAchievement.category.trim()) {
            setNotification({ type: 'error', message: 'Please fill in title and category' });
            return;
        }
        setAchievements(achievements.map(a => a.id === editingAchievement.id ? editingAchievement : a));
        setEditingAchievement(null);
        setHasChanges(true);
        setNotification({ type: 'success', message: 'Achievement updated locally. Click "Save All" to publish.' });
    };

    const deleteAchievement = (id) => {
        setAchievements(achievements.filter(a => a.id !== id));
        setHasChanges(true);
        setNotification({ type: 'success', message: 'Achievement removed. Click "Save All" to publish.' });
    };

    const moveAchievement = (index, direction) => {
        const newAchievements = [...achievements];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= achievements.length) return;
        [newAchievements[index], newAchievements[newIndex]] = [newAchievements[newIndex], newAchievements[index]];
        setAchievements(newAchievements);
        setHasChanges(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading achievements...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Barangay Achievements & Awards</h1>
                    <p className="text-gray-600 mt-1">Configure awards displayed on the homepage</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={openAddModal} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2">
                        <Plus className="w-5 h-5" />Add Award
                    </button>
                    <button onClick={saveAllChanges} disabled={!hasChanges || saving}
                        className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${hasChanges && !saving ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? 'Saving...' : 'Save All'}
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {notification && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium">{notification.message}</span>
                </div>
            )}

            {hasChanges && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="text-amber-800 font-medium">Unsaved changes. Click "Save All" to publish.</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Achievements List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                        Award Gallery ({achievements.length})
                    </h2>

                    {achievements.map((ach, index) => (
                        <div key={ach.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                            <div className="flex flex-col md:flex-row">
                                <div className="md:w-48 h-32 md:h-auto relative bg-gray-100">
                                    <img
                                        src={ach.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800'}
                                        alt={ach.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800' }}
                                    />
                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-md">
                                        {ach.year}
                                    </div>
                                </div>
                                <div className="flex-1 p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ach.color_class} text-white`}>
                                                {ach.category}
                                            </span>
                                            <h3 className="text-lg font-bold text-gray-900 mt-1">{ach.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ach.description}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => moveAchievement(index, 'up')} disabled={index === 0} className={`p-1 rounded ${index === 0 ? 'text-gray-200' : 'text-gray-400 hover:bg-gray-100'}`}>
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => moveAchievement(index, 'down')} disabled={index === achievements.length - 1} className={`p-1 rounded ${index === achievements.length - 1 ? 'text-gray-200' : 'text-gray-400 hover:bg-gray-100'}`}>
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-4">
                                        <button onClick={() => startEditing(ach)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                            <Edit2 className="w-3 h-3" />Edit Details
                                        </button>
                                        <button onClick={() => deleteAchievement(ach.id)} className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1">
                                            <Trash2 className="w-3 h-3" />Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Editor/Preview Placeholder */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-blue-600" />
                        Quick Preview
                    </h2>
                    <div className="bg-[#0a1f12] rounded-2xl border border-yellow-500/20 p-6 shadow-xl">
                        <div className="text-center mb-6">
                            <p className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Preview Mode</p>
                            <div className="h-0.5 w-12 bg-yellow-500 mx-auto"></div>
                        </div>

                        {achievements.length > 0 ? (
                            <div className="relative group rounded-xl overflow-hidden border border-white/10">
                                <img src={achievements[0].image} className="w-full h-40 object-cover opacity-60" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f12] to-transparent"></div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <p className="text-yellow-500 text-[8px] font-bold uppercase tracking-widest">{achievements[0].category}</p>
                                    <h4 className="text-white font-bold text-sm truncate">{achievements[0].title}</h4>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Award className="w-3 h-3 text-yellow-500" />
                                        <span className="text-white/60 text-[10px]">{achievements[0].year}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-40 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-white/30 text-sm">
                                No awards to preview
                            </div>
                        )}

                        <div className="mt-8 bg-black/30 rounded-xl p-4 border border-white/5">
                            <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                                Management Tips
                            </h4>
                            <ul className="text-xs text-white/60 space-y-2">
                                <li className="flex gap-2">• <span>Use high-quality photos (16:9 recommended)</span></li>
                                <li className="flex gap-2">• <span>Keep descriptions punchy and impactful</span></li>
                                <li className="flex gap-2">• <span>Update years to reflect current records</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingAchievement && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-blue-600" />
                                Edit Achievement
                            </h2>
                            <button onClick={() => setEditingAchievement(null)} className="p-2 hover:bg-gray-200 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Award Title</label>
                                        <input
                                            type="text"
                                            value={editingAchievement.title}
                                            onChange={(e) => setEditingAchievement({ ...editingAchievement, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
                                        <input
                                            type="text"
                                            value={editingAchievement.category}
                                            onChange={(e) => setEditingAchievement({ ...editingAchievement, category: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Year</label>
                                            <input
                                                type="text"
                                                value={editingAchievement.year}
                                                onChange={(e) => setEditingAchievement({ ...editingAchievement, year: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Theme Color</label>
                                            <select
                                                value={editingAchievement.color_class}
                                                onChange={(e) => {
                                                    const selected = colorOptions.find(opt => opt.value === e.target.value);
                                                    setEditingAchievement({ ...editingAchievement, color_class: e.target.value, text_color: selected.text });
                                                }}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold transition-all"
                                            >
                                                {colorOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Award Photo</label>
                                        <div className="relative group h-48 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-blue-500 transition-colors cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                            {editingAchievement.image ? (
                                                <>
                                                    <img src={editingAchievement.image} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Upload className="w-8 h-8 text-white" />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                                    <Image className="w-10 h-10 mb-2" />
                                                    <p className="text-[10px] font-bold uppercase">Click to upload</p>
                                                </div>
                                            )}
                                            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleImageUpload(e, true)} accept="image/*" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
                                <textarea
                                    value={editingAchievement.description}
                                    onChange={(e) => setEditingAchievement({ ...editingAchievement, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all resize-none"
                                    placeholder="Describe the significance of this award..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50">
                            <button onClick={saveEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                                <Check className="w-4 h-4" /> Save Changes
                            </button>
                            <button onClick={() => setEditingAchievement(null)} className="flex-1 bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 py-3 rounded-xl font-black uppercase tracking-widest text-xs">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-green-600" />
                                New Barangay Award
                            </h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Award Title *</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g. Seal of Good Local Governance"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Category *</label>
                                        <input
                                            type="text"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            placeholder="e.g. Governance"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Year *</label>
                                            <input
                                                type="text"
                                                value={formData.year}
                                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Theme Color</label>
                                            <select
                                                value={formData.color_class}
                                                onChange={(e) => {
                                                    const selected = colorOptions.find(opt => opt.value === e.target.value);
                                                    setFormData({ ...formData, color_class: e.target.value, text_color: selected.text });
                                                }}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold transition-all"
                                            >
                                                {colorOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Award Photo</label>
                                        <div className="relative group h-48 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-blue-500 transition-colors cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                            {formData.image ? (
                                                <>
                                                    <img src={formData.image} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Upload className="w-8 h-8 text-white" />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                                    <Image className="w-10 h-10 mb-2" />
                                                    <p className="text-[10px] font-bold uppercase">Click to upload</p>
                                                </div>
                                            )}
                                            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleImageUpload(e, false)} accept="image/*" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Description *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all resize-none"
                                    placeholder="Describe the significance of this award..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50">
                            <button onClick={addAchievement} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-green-600/20">
                                <Plus className="w-4 h-4" /> Add Achievement
                            </button>
                            <button onClick={() => setShowAddModal(false)} className="flex-1 bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 py-3 rounded-xl font-black uppercase tracking-widest text-xs">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

AchievementsPage.getLayout = (page) => (
    <Layout
        title="Achievements & Awards"
        subtitle="BARANGAY RECOGNITION & HONORS"
    >
        {page}
    </Layout>
);
