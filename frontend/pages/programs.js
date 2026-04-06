import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout/Layout';
import {
    Save, Plus, Edit2, Trash2, Image,
    ChevronUp, ChevronDown, Eye, X, Check, AlertCircle, CheckCircle,
    Upload, Loader2, BookOpen, Briefcase, Heart, Shield, Activity
} from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

const API_URL = '/api';

const defaultPrograms = [];


export default function ProgramsPage() {
    const [programs, setPrograms] = useState([]);
    const [editingProgram, setEditingProgram] = useState(null);
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
        image: ''
    });

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/programs`);
            const data = await response.json();

            if (data.success) {
                setPrograms(data.data || []);
            } else {
                setPrograms([]);
            }
        } catch (error) {
            console.error('Error fetching programs:', error);
            setPrograms([]);
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

            const response = await fetch(`${API_URL}/programs/bulk/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ programs })
            });

            const data = await response.json();

            if (data.success) {
                setHasChanges(false);
                setNotification({ type: 'success', message: 'Programs saved successfully!' });
                fetchPrograms();
            } else {
                setNotification({ type: 'error', message: data.message || 'Failed to save programs' });
            }
        } catch (error) {
            console.error('Error saving programs:', error);
            setNotification({ type: 'error', message: 'Failed to save programs. Please try again.' });
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
            if (isEditing && editingProgram) {
                setEditingProgram({ ...editingProgram, image: reader.result });
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
            image: ''
        });
        setShowAddModal(true);
    };

    const addProgram = () => {
        if (!formData.title.trim() || !formData.category.trim() || !formData.description.trim()) {
            setNotification({ type: 'error', message: 'Please fill in all required fields' });
            return;
        }
        const newProgram = { ...formData, id: Date.now() };
        setPrograms([...programs, newProgram]);
        setShowAddModal(false);
        setHasChanges(true);
        setNotification({ type: 'success', message: 'Program added. Remember to Save All.' });
    };

    const startEditing = (program) => {
        setEditingProgram({ ...program });
    };

    const saveEdit = () => {
        if (!editingProgram.title.trim() || !editingProgram.category.trim()) {
            setNotification({ type: 'error', message: 'Please fill in title and category' });
            return;
        }
        setPrograms(programs.map(p => p.id === editingProgram.id ? editingProgram : p));
        setEditingProgram(null);
        setHasChanges(true);
        setNotification({ type: 'success', message: 'Program updated locally. Click "Save All" to publish.' });
    };

    const deleteProgram = (id) => {
        setPrograms(programs.filter(p => p.id !== id));
        setHasChanges(true);
        setNotification({ type: 'success', message: 'Program removed. Click "Save All" to publish.' });
    };

    const moveProgram = (index, direction) => {
        const newPrograms = [...programs];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= programs.length) return;
        [newPrograms[index], newPrograms[newIndex]] = [newPrograms[newIndex], newPrograms[index]];
        setPrograms(newPrograms);
        setHasChanges(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="ml-2 text-gray-600">Loading programs...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Barangay Programs</h1>
                    <p className="text-gray-600 mt-1">Configure programs displayed on the homepage</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={openAddModal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2">
                        <Plus className="w-5 h-5" />Add Program
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Active Programs ({programs.length})</h2>
                    {programs.map((prog, index) => (
                        <div key={prog.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                            <div className="flex flex-col md:flex-row">
                                <div className="md:w-48 h-32 md:h-auto relative">
                                    <img src={prog.image} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{prog.category}</span>
                                            <h3 className="text-lg font-bold text-gray-900 mt-1">{prog.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{prog.description}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => moveProgram(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30">
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => moveProgram(index, 'down')} disabled={index === programs.length - 1} className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30">
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-4">
                                        <button onClick={() => startEditing(prog)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                            <Edit2 className="w-3 h-3" />Edit
                                        </button>
                                        <button onClick={() => deleteProgram(prog.id)} className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1">
                                            <Trash2 className="w-3 h-3" />Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Display Preview</h2>
                    <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center">
                        {programs.length > 0 ? (
                            <div className="w-full bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                                <img src={programs[0].image} className="w-full aspect-[4/3] object-cover" />
                                <div className="p-4">
                                    <p className="text-indigo-600 text-[10px] font-bold uppercase mb-2">{programs[0].category}</p>
                                    <h4 className="text-gray-900 font-bold text-base leading-tight">{programs[0].title}</h4>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">No programs to preview</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingProgram && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h2 className="text-xl font-bold text-gray-900">Edit Program</h2>
                            <button onClick={() => setEditingProgram(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Program Title</label>
                                <input type="text" value={editingProgram.title} onChange={(e) => setEditingProgram({ ...editingProgram, title: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Category</label>
                                <input type="text" value={editingProgram.category} onChange={(e) => setEditingProgram({ ...editingProgram, category: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Description</label>
                                <textarea value={editingProgram.description} onChange={(e) => setEditingProgram({ ...editingProgram, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Program Image</label>
                                <div className="mt-2 flex items-center gap-4">
                                    <img src={editingProgram.image} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                                    <button onClick={() => fileInputRef.current.click()} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-2">
                                        <Upload className="w-4 h-4" /> Change Image
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleImageUpload(e, true)} accept="image/*" />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0">
                            <button onClick={saveEdit} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold">Save Changes</button>
                            <button onClick={() => setEditingProgram(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-lg font-bold">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h2 className="text-xl font-bold text-gray-900">Add New Program</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Program Title *</label>
                                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Health Mission" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Category *</label>
                                <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. HEALTH" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Description *</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Describe the program..." className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Program Image</label>
                                <div className="mt-2 flex items-center gap-4">
                                    {formData.image && <img src={formData.image} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />}
                                    <button onClick={() => fileInputRef.current.click()} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-2">
                                        <Upload className="w-4 h-4" /> Upload
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleImageUpload(e)} accept="image/*" />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0">
                            <button onClick={addProgram} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold">Add Program</button>
                            <button onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-lg font-bold">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

ProgramsPage.getLayout = (page) => (
    <Layout
        title="Barangay Programs"
        subtitle="COMMUNITY INITIATIVES & SERVICES"
    >
        {page}
    </Layout>
);
