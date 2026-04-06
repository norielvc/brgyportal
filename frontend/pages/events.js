import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout/Layout';
import {
  Save, Plus, Edit2, Trash2, Image, Calendar,
  ChevronUp, ChevronDown, Eye, X, Check, AlertCircle, CheckCircle,
  Upload, Loader2
} from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

const API_URL = '/api';

const defaultEvents = [];

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    body: '',
    image: '/background.jpg',
    date: ''
  });

  // Fetch events from API
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/events`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setEvents(data.data);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
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
    if (events.length === 0) return;
    const interval = setInterval(() => {
      setPreviewSlide((prev) => (prev + 1) % events.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [events.length]);

  const saveAllChanges = async () => {
    try {
      setSaving(true);
      const token = getAuthToken();

      const response = await fetch(`${API_URL}/events/bulk/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ events })
      });

      const data = await response.json();

      if (data.success) {
        setHasChanges(false);
        setNotification({ type: 'success', message: 'Events saved! Changes will appear on homepage for everyone.' });
        fetchEvents(); // Refresh from server
      } else {
        setNotification({ type: 'error', message: data.message || 'Failed to save events' });
      }
    } catch (error) {
      console.error('Error saving events:', error);
      setNotification({ type: 'error', message: 'Failed to save events. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    try {
      setSaving(true);
      const token = getAuthToken();

      const response = await fetch(`${API_URL}/events/bulk/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ events: defaultEvents })
      });

      const data = await response.json();

      if (data.success) {
        setEvents(defaultEvents);
        setHasChanges(false);
        setNotification({ type: 'success', message: 'Reset to default events' });
        fetchEvents();
      } else {
        setNotification({ type: 'error', message: 'Failed to reset events' });
      }
    } catch (error) {
      console.error('Error resetting events:', error);
      setNotification({ type: 'error', message: 'Failed to reset events' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEditing && editingEvent) {
          setEditingEvent({ ...editingEvent, image: reader.result });
        } else {
          setFormData({ ...formData, image: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setFormData({ title: '', description: '', body: '', image: '/background.jpg', date: '' });
    setShowAddModal(true);
  };

  const addEvent = () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.date.trim()) {
      setNotification({ type: 'error', message: 'Please fill in all fields' });
      return;
    }
    const newEvent = { ...formData, id: Date.now() };
    setEvents([...events, newEvent]);
    setShowAddModal(false);
    setHasChanges(true);
    setNotification({ type: 'success', message: 'Event added. Click "Save All" to publish.' });
  };

  const startEditing = (event) => {
    setEditingEvent({ ...event });
  };

  const saveEdit = () => {
    if (!editingEvent.title.trim() || !editingEvent.description.trim() || !editingEvent.date.trim()) {
      setNotification({ type: 'error', message: 'Please fill in all fields' });
      return;
    }
    setEvents(events.map(e => e.id === editingEvent.id ? editingEvent : e));
    setEditingEvent(null);
    setHasChanges(true);
    setNotification({ type: 'success', message: 'Event updated. Click "Save All" to publish.' });
  };

  const deleteEvent = (id) => {
    if (events.length <= 1) {
      setNotification({ type: 'error', message: 'Must have at least one event' });
      return;
    }
    setEvents(events.filter(e => e.id !== id));
    setHasChanges(true);
    setNotification({ type: 'success', message: 'Event deleted. Click "Save All" to publish.' });
  };

  const moveEvent = (index, direction) => {
    const newEvents = [...events];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= events.length) return;
    [newEvents[index], newEvents[newIndex]] = [newEvents[newIndex], newEvents[index]];
    setEvents(newEvents);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading events...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carousel Events</h1>
          <p className="text-gray-600 mt-1">Manage events displayed on the homepage carousel</p>
        </div>
        <div className="flex gap-3">
          <button onClick={resetToDefault} disabled={saving} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Reset
          </button>
          <button onClick={openAddModal} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2">
            <Plus className="w-5 h-5" />Add Event
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
        {/* Events List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Events ({events.length})
          </h2>

          {events.map((event, index) => (
            <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
              {editingEvent?.id === event.id ? (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
                    <input
                      type="text"
                      value={editingEvent.title}
                      onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                    <textarea
                      value={editingEvent.description}
                      onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Body <span className="text-gray-400 font-normal">(shown in Read More modal)</span></label>
                    <textarea
                      value={editingEvent.body || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, body: e.target.value })}
                      rows={5}
                      placeholder="Full event details, instructions, schedules, etc..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Date</label>
                    <input
                      type="text"
                      value={editingEvent.date}
                      onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                      placeholder="e.g., January 15, 2026"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Image</label>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-14 bg-gray-100 rounded-lg overflow-hidden">
                        <img src={editingEvent.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={saveEdit} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />Save
                    </button>
                    <button onClick={() => setEditingEvent(null)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2">
                      <X className="w-4 h-4" />Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex">
                  <div className="w-32 h-24 flex-shrink-0">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                        <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />{event.date}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                      </div>
                      <div className="flex flex-col gap-1 ml-2">
                        <button onClick={() => moveEvent(index, 'up')} disabled={index === 0}
                          className={`p-1 rounded ${index === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'}`}>
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => moveEvent(index, 'down')} disabled={index === events.length - 1}
                          className={`p-1 rounded ${index === events.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'}`}>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => startEditing(event)} className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1">
                        <Edit2 className="w-3 h-3" />Edit
                      </button>
                      <button onClick={() => deleteEvent(event.id)} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" />Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Carousel Preview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-600" />
            Carousel Preview
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="relative h-64 overflow-hidden">
              {events.map((event, index) => (
                <div
                  key={event.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${previewSlide === index ? 'opacity-100' : 'opacity-0'}`}
                >
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${event.image})` }} />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/70" />
                  <div className="relative h-full p-6 flex flex-col justify-center">
                    <span className="inline-block bg-yellow-500 text-blue-900 px-2 py-0.5 rounded-full text-xs font-semibold mb-2 w-fit">
                      <Calendar className="w-3 h-3 inline mr-1" />{event.date}
                    </span>
                    <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                    <p className="text-sm text-gray-200 line-clamp-2">{event.description}</p>
                  </div>
                </div>
              ))}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {events.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setPreviewSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${previewSlide === index ? 'bg-white w-6' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t">
              <p className="text-sm text-gray-600 text-center">
                This preview shows how events will appear on the homepage carousel
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use high-quality images (recommended: 1920x1080)</li>
              <li>• Keep titles short and descriptive</li>
              <li>• Use the arrows to reorder events</li>
              <li>• Click "Save All" to publish changes for everyone</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add New Event</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Event Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Community Clean-Up Drive"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Short summary shown on the carousel..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Body <span className="text-gray-400 font-normal">(shown in Read More modal)</span></label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={5}
                  placeholder="Full event details, instructions, venue, schedules, requirements, etc..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Event Date *</label>
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  placeholder="e.g., January 15, 2026"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Event Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                    {formData.image ? (
                      <img src={formData.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                    >
                      <Upload className="w-4 h-4" />Upload Image
                    </button>
                    <p className="text-xs text-gray-500 mt-1">Or use default background</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 shrink-0">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={addEvent} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

EventsPage.getLayout = (page) => (
  <Layout title="Events Management" subtitle="Customize homepage carousel events">
    {page}
  </Layout>
);
