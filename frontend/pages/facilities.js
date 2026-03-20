import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout/Layout';
import {
  Save, Plus, Edit2, Trash2, Image, Building2,
  ChevronUp, ChevronDown, Eye, X, Check, AlertCircle, CheckCircle,
  Upload, Loader2, Heart, Baby, Home, Award
} from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';

const defaultFacilities = [];

const iconOptions = [
  { name: 'Heart', component: Heart },
  { name: 'Building2', component: Building2 },
  { name: 'Baby', component: Baby },
  { name: 'Home', component: Home },
  { name: 'Award', component: Award }
];

const colorOptions = [
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Pink', value: 'bg-pink-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Yellow', value: 'bg-yellow-500' },
  { name: 'Indigo', value: 'bg-indigo-500' }
];

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [editingFacility, setEditingFacility] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRefs = useRef({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Building2',
    color: 'bg-blue-500',
    images: ['/background.jpg'],
    features: ['']
  });

  // Fetch facilities from API
  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/facilities`);
      const data = await response.json();

      if (data.success) {
        setFacilities(data.data || []);
      } else {
        setFacilities([]);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
      setFacilities(defaultFacilities);
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

  // Auto-slide preview
  useEffect(() => {
    if (facilities.length === 0) return;
    const interval = setInterval(() => {
      setPreviewSlide((prev) => (prev + 1) % facilities.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [facilities.length]);

  const saveAllChanges = async () => {
    try {
      setSaving(true);
      const token = getAuthToken();

      const response = await fetch(`${API_URL}/facilities/bulk/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ facilities })
      });

      const data = await response.json();

      if (data.success) {
        setHasChanges(false);
        setNotification({ type: 'success', message: 'Facilities saved! Changes will appear on homepage for everyone.' });
        fetchFacilities();
      } else {
        setNotification({ type: 'error', message: data.message || 'Failed to save facilities' });
      }
    } catch (error) {
      console.error('Error saving facilities:', error);
      setNotification({ type: 'error', message: 'Failed to save facilities. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    try {
      setSaving(true);
      const token = getAuthToken();

      const response = await fetch(`${API_URL}/facilities/bulk/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ facilities: defaultFacilities })
      });

      const data = await response.json();

      if (data.success) {
        setFacilities(defaultFacilities);
        setHasChanges(false);
        setNotification({ type: 'success', message: 'Reset to default facilities' });
        fetchFacilities();
      } else {
        setNotification({ type: 'error', message: 'Failed to reset facilities' });
      }
    } catch (error) {
      console.error('Error resetting facilities:', error);
      setNotification({ type: 'error', message: 'Failed to reset facilities' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e, isEditing = false, imageIndex = 0) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (1MB = 1024 * 1024 bytes)
    if (file.size > 1024 * 1024) {
      setNotification({ type: 'error', message: 'Image size must be less than 1MB' });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setNotification({ type: 'error', message: 'Please select an image file' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEditing && editingFacility) {
        const newImages = [...editingFacility.images];
        newImages[imageIndex] = reader.result;
        setEditingFacility({ ...editingFacility, images: newImages });
      } else {
        const newImages = [...formData.images];
        newImages[imageIndex] = reader.result;
        setFormData({ ...formData, images: newImages });
      }
      setNotification({ type: 'success', message: 'Image uploaded successfully' });
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = (imageIndex, isEditing = false) => {
    const inputId = isEditing ? `edit-${imageIndex}` : `add-${imageIndex}`;
    const input = fileInputRefs.current[inputId];
    if (input) {
      input.click();
    }
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'Building2',
      color: 'bg-blue-500',
      images: ['/background.jpg'],
      features: ['']
    });
    setShowAddModal(true);
  };

  const addFacility = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      setNotification({ type: 'error', message: 'Please fill in name and description' });
      return;
    }
    const newFacility = { ...formData, id: Date.now() };
    setFacilities([...facilities, newFacility]);
    setShowAddModal(false);
    setHasChanges(true);
    setNotification({ type: 'success', message: 'Facility added. Click "Save All" to publish.' });
  };

  const startEditing = (facility) => {
    setEditingFacility({ ...facility });
  };

  const saveEdit = () => {
    if (!editingFacility.name.trim() || !editingFacility.description.trim()) {
      setNotification({ type: 'error', message: 'Please fill in name and description' });
      return;
    }
    setFacilities(facilities.map(f => f.id === editingFacility.id ? editingFacility : f));
    setEditingFacility(null);
    setHasChanges(true);
    setNotification({ type: 'success', message: 'Facility updated. Click "Save All" to publish.' });
  };

  const deleteFacility = (id) => {
    if (facilities.length <= 1) {
      setNotification({ type: 'error', message: 'Must have at least one facility' });
      return;
    }
    setFacilities(facilities.filter(f => f.id !== id));
    setHasChanges(true);
    setNotification({ type: 'success', message: 'Facility deleted. Click "Save All" to publish.' });
  };

  const moveFacility = (index, direction) => {
    const newFacilities = [...facilities];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= facilities.length) return;
    [newFacilities[index], newFacilities[newIndex]] = [newFacilities[newIndex], newFacilities[index]];
    setFacilities(newFacilities);
    setHasChanges(true);
  };

  const addFeature = (isEditing = false) => {
    if (isEditing && editingFacility) {
      setEditingFacility({ ...editingFacility, features: [...editingFacility.features, ''] });
    } else {
      setFormData({ ...formData, features: [...formData.features, ''] });
    }
  };

  const updateFeature = (index, value, isEditing = false) => {
    if (isEditing && editingFacility) {
      const newFeatures = [...editingFacility.features];
      newFeatures[index] = value;
      setEditingFacility({ ...editingFacility, features: newFeatures });
    } else {
      const newFeatures = [...formData.features];
      newFeatures[index] = value;
      setFormData({ ...formData, features: newFeatures });
    }
  };

  const removeFeature = (index, isEditing = false) => {
    if (isEditing && editingFacility) {
      const newFeatures = editingFacility.features.filter((_, i) => i !== index);
      setEditingFacility({ ...editingFacility, features: newFeatures });
    } else {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData({ ...formData, features: newFeatures });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading facilities...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Barangay Facilities</h1>
          <p className="text-gray-600 mt-1">Manage facilities displayed on the homepage</p>
        </div>
        <div className="flex gap-3">
          <button onClick={resetToDefault} disabled={saving} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Reset
          </button>
          <button onClick={openAddModal} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2">
            <Plus className="w-5 h-5" />Add Facility
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
          <span className="text-amber-800 font-medium">Unsaved changes. Click "Save All" to publish to homepage for everyone.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Facilities List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Facilities ({facilities.length})
          </h2>

          {facilities.map((facility, index) => {
            const IconComponent = iconOptions.find(opt => opt.name === facility.icon)?.component || Building2;

            return (
              <div key={facility.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                {editingFacility?.id === facility.id ? (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
                      <input
                        type="text"
                        value={editingFacility.name}
                        onChange={(e) => setEditingFacility({ ...editingFacility, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                      <textarea
                        value={editingFacility.description}
                        onChange={(e) => setEditingFacility({ ...editingFacility, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Icon</label>
                        <select
                          value={editingFacility.icon}
                          onChange={(e) => setEditingFacility({ ...editingFacility, icon: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {iconOptions.map(option => (
                            <option key={option.name} value={option.name}>{option.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Color</label>
                        <select
                          value={editingFacility.color}
                          onChange={(e) => setEditingFacility({ ...editingFacility, color: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {colorOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Images</label>
                      {editingFacility.images.map((image, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <div className="flex-1 flex gap-2">
                            {image.startsWith('data:') && (
                              <div className="w-12 h-12 flex-shrink-0">
                                <img
                                  src={image}
                                  alt={`Preview ${idx + 1}`}
                                  className="w-full h-full object-cover rounded border"
                                />
                              </div>
                            )}
                            <input
                              type="text"
                              value={image.startsWith('data:') ? `Uploaded Image ${idx + 1}` : image}
                              onChange={(e) => {
                                if (!e.target.value.startsWith('data:')) {
                                  const newImages = [...editingFacility.images];
                                  newImages[idx] = e.target.value;
                                  setEditingFacility({ ...editingFacility, images: newImages });
                                }
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Image URL or click upload"
                              readOnly={image.startsWith('data:')}
                            />
                            <button
                              type="button"
                              onClick={() => triggerFileInput(idx, true)}
                              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1 text-sm"
                            >
                              <Upload className="w-4 h-4" />
                              Upload
                            </button>
                            <input
                              type="file"
                              ref={el => fileInputRefs.current[`edit-${idx}`] = el}
                              onChange={(e) => handleImageUpload(e, true, idx)}
                              accept="image/*"
                              className="hidden"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const newImages = editingFacility.images.filter((_, i) => i !== idx);
                              if (newImages.length === 0) newImages.push('/background.jpg');
                              setEditingFacility({ ...editingFacility, images: newImages });
                            }}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newImages = [...editingFacility.images, '/background.jpg'];
                          setEditingFacility({ ...editingFacility, images: newImages });
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm mb-3"
                      >
                        + Add Image
                      </button>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Features</label>
                      {editingFacility.features.map((feature, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => updateFeature(idx, e.target.value, true)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Feature name"
                          />
                          <button onClick={() => removeFeature(idx, true)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addFeature(true)} className="text-blue-600 hover:text-blue-800 text-sm">
                        + Add Feature
                      </button>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={saveEdit} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />Save
                      </button>
                      <button onClick={() => setEditingFacility(null)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2">
                        <X className="w-4 h-4" />Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex">
                    <div className="w-32 h-24 flex-shrink-0 relative">
                      <img
                        src={facility.images[0]}
                        alt={facility.name}
                        className="w-full h-full object-cover rounded-l-xl"
                        onError={(e) => {
                          e.target.src = '/background.jpg';
                        }}
                      />
                      {facility.images.length > 1 && (
                        <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
                          +{facility.images.length - 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`${facility.color} p-1 rounded`}>
                              <IconComponent className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-900 truncate">{facility.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{facility.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {facility.features.slice(0, 3).map((feature, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                          <button onClick={() => moveFacility(index, 'up')} disabled={index === 0}
                            className={`p-1 rounded ${index === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'}`}>
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button onClick={() => moveFacility(index, 'down')} disabled={index === facilities.length - 1}
                            className={`p-1 rounded ${index === facilities.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'}`}>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => startEditing(facility)} className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1">
                          <Edit2 className="w-3 h-3" />Edit
                        </button>
                        <button onClick={() => deleteFacility(facility.id)} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1">
                          <Trash2 className="w-3 h-3" />Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-600" />
            Facilities Preview
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4">
                {facilities.slice(0, 3).map((facility, index) => {
                  const IconComponent = iconOptions.find(opt => opt.name === facility.icon)?.component || Building2;
                  return (
                    <div key={facility.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`${facility.color} p-2 rounded-lg`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{facility.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{facility.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {facility.features.map((feature, idx) => (
                          <span key={idx} className="px-2 py-1 bg-white text-gray-600 text-xs rounded border">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t">
              <p className="text-sm text-gray-600 text-center">
                This preview shows how facilities will appear on the homepage
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use descriptive names and clear descriptions</li>
              <li>• Choose appropriate icons and colors</li>
              <li>• Add relevant features for each facility</li>
              <li>• <strong>Images:</strong> Click "Upload" to select photos (max 1MB) or use URLs</li>
              <li>• Multiple images create a carousel effect on homepage</li>
              <li>• Supported formats: JPG, PNG, GIF, WebP</li>
              <li>• Click "Save All" to publish changes for everyone</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Facility Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add New Facility</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Facility Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Community Center"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the facility..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Icon</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {iconOptions.map(option => (
                      <option key={option.name} value={option.name}>{option.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Color</label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Images</label>
                {formData.images.map((image, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <div className="flex-1 flex gap-2">
                      {image.startsWith('data:') && (
                        <div className="w-12 h-12 flex-shrink-0">
                          <img
                            src={image}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover rounded border"
                          />
                        </div>
                      )}
                      <input
                        type="text"
                        value={image.startsWith('data:') ? `Uploaded Image ${idx + 1}` : image}
                        onChange={(e) => {
                          if (!e.target.value.startsWith('data:')) {
                            const newImages = [...formData.images];
                            newImages[idx] = e.target.value;
                            setFormData({ ...formData, images: newImages });
                          }
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Image URL or click upload"
                        readOnly={image.startsWith('data:')}
                      />
                      <button
                        type="button"
                        onClick={() => triggerFileInput(idx, false)}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1 text-sm"
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>
                      <input
                        type="file"
                        ref={el => fileInputRefs.current[`add-${idx}`] = el}
                        onChange={(e) => handleImageUpload(e, false, idx)}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newImages = formData.images.filter((_, i) => i !== idx);
                        if (newImages.length === 0) newImages.push('/background.jpg');
                        setFormData({ ...formData, images: newImages });
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newImages = [...formData.images, '/background.jpg'];
                    setFormData({ ...formData, images: newImages });
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm mb-4"
                >
                  + Add Image
                </button>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Features</label>
                {formData.features.map((feature, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(idx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Feature name"
                    />
                    <button onClick={() => removeFeature(idx)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addFeature()} className="text-blue-600 hover:text-blue-800 text-sm">
                  + Add Feature
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={addFacility} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />Add Facility
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

FacilitiesPage.getLayout = (page) => (
  <Layout title="Facilities Management" subtitle="Customize barangay facilities">
    {page}
  </Layout>
);