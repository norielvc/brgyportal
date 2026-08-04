import { useState, useEffect } from "react";
import Layout from "@/components/Layout/Layout";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  CheckCircle,
  MapPin,
  Upload,
  Loader2,
  Save,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";

const API_URL = "/api";

export default function TourismPage() {
  const [destinations, setDestinations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    directions_url: "",
  });

  useEffect(() => {
    fetchDestinations();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/cms/tourism`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDestinations(data.data || []);
      } else {
        setDestinations([]);
      }
    } catch (error) {
      console.error("Error fetching tourism destinations:", error);
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      setNotification({ type: "error", message: "Name is required" });
      return;
    }
    try {
      setSaving(true);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/cms/tourism`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setNotification({ type: "success", message: "Destination added!" });
        setShowAddModal(false);
        setFormData({ name: "", description: "", image: "", directions_url: "" });
        fetchDestinations();
      } else {
        setNotification({ type: "error", message: data.message || "Failed to add" });
      }
    } catch (error) {
      setNotification({ type: "error", message: "Failed to add destination" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, field, value) => {
    setDestinations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleSave = async (id) => {
    const dest = destinations.find((d) => d.id === id);
    if (!dest) return;
    try {
      setSaving(true);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/cms/tourism`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dest),
      });
      const data = await response.json();
      if (data.success) {
        setNotification({ type: "success", message: "Destination updated!" });
        setEditingId(null);
        fetchDestinations();
      } else {
        setNotification({ type: "error", message: data.message || "Failed to update" });
      }
    } catch (error) {
      setNotification({ type: "error", message: "Failed to update destination" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this destination?")) return;
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/cms/tourism?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setNotification({ type: "success", message: "Destination deleted!" });
        fetchDestinations();
      } else {
        setNotification({ type: "error", message: data.message || "Failed to delete" });
      }
    } catch (error) {
      setNotification({ type: "error", message: "Failed to delete destination" });
    }
  };

  return (
    <Layout title="Tourism & Lifestyle" subtitle="Manage tourism destinations shown on the public portal">
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {notification && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              notification.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tourism & Lifestyle</h1>
            <p className="text-gray-500 text-sm mt-1">
              Add destinations that appear on the public portal with directions links.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl font-semibold hover:bg-black transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Destination
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : destinations.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
            <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No tourism destinations yet</p>
            <p className="text-gray-400 text-sm mt-1">Click &quot;Add Destination&quot; to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((dest) => (
              <div
                key={dest.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="relative aspect-[16/10] bg-gray-100">
                  {dest.image ? (
                    <img
                      src={dest.image}
                      alt={dest.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <MapPin className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => setEditingId(editingId === dest.id ? null : dest.id)}
                      className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center shadow-sm hover:bg-white"
                    >
                      <Edit2 className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleDelete(dest.id)}
                      className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center shadow-sm hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  {editingId === dest.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={dest.name}
                        onChange={(e) => handleUpdate(dest.id, "name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium"
                        placeholder="Destination name"
                      />
                      <textarea
                        value={dest.description || ""}
                        onChange={(e) => handleUpdate(dest.id, "description", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Description"
                        rows={2}
                      />
                      <input
                        type="text"
                        value={dest.image || ""}
                        onChange={(e) => handleUpdate(dest.id, "image", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Image URL"
                      />
                      <input
                        type="text"
                        value={dest.directions_url || ""}
                        onChange={(e) => handleUpdate(dest.id, "directions_url", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Google Maps directions URL"
                      />
                      <button
                        onClick={() => handleSave(dest.id)}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{dest.name}</h3>
                      {dest.description && (
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{dest.description}</p>
                      )}
                      {dest.directions_url && (
                        <a
                          href={dest.directions_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          <MapPin className="w-4 h-4" />
                          View Directions
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Destination Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Destination</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                  placeholder="e.g., Wildflour Restaurant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                  placeholder="Short description"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Directions URL</label>
                <input
                  type="text"
                  value={formData.directions_url}
                  onChange={(e) => setFormData({ ...formData, directions_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                  placeholder="https://maps.google.com/?q=..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-gray-900 hover:bg-black transition-colors text-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Destination
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
