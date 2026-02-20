import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import SignatureInput from '@/components/UI/SignatureInput';
import {
  Save, Trash2, Eye, EyeOff, User, Shield,
  CheckCircle, AlertCircle, Info, Pen
} from 'lucide-react';
import { getAuthToken, getUserData } from '@/lib/auth';

// API Configuration
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';

export default function SignatureSettings() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [newSignature, setNewSignature] = useState(null);
  const [defaultSignatureId, setDefaultSignatureId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showPreview, setShowPreview] = useState({});

  useEffect(() => {
    const user = getUserData();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    fetchSignatures();
  }, []);

  const fetchSignatures = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/user/signatures`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setSignatures(data.signatures || []);
        setDefaultSignatureId(data.defaultSignatureId);
      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load signatures'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSignature = async () => {
    if (!newSignature) {
      setNotification({
        type: 'error',
        title: 'No Signature',
        message: 'Please create a signature first'
      });
      return;
    }

    setSaving(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/user/signatures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signatureData: newSignature,
          name: `Signature ${signatures.length + 1}`,
          isDefault: signatures.length === 0 // First signature becomes default
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewSignature(null);
        fetchSignatures();
        setNotification({
          type: 'success',
          title: 'Success',
          message: 'Signature saved successfully'
        });
      } else {
        setNotification({
          type: 'error',
          title: 'Error',
          message: data.message || 'Failed to save signature'
        });
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save signature'
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteSignature = async (signatureId) => {
    if (!confirm('Are you sure you want to delete this signature?')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/user/signatures/${signatureId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchSignatures();
        setNotification({
          type: 'success',
          title: 'Success',
          message: 'Signature deleted successfully'
        });
      } else {
        setNotification({
          type: 'error',
          title: 'Error',
          message: data.message || 'Failed to delete signature'
        });
      }
    } catch (error) {
      console.error('Error deleting signature:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete signature'
      });
    }
  };

  const setDefaultSignature = async (signatureId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/user/signatures/${signatureId}/default`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setDefaultSignatureId(signatureId);
        setNotification({
          type: 'success',
          title: 'Success',
          message: 'Default signature updated'
        });
      }
    } catch (error) {
      console.error('Error setting default signature:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update default signature'
      });
    }
  };

  const togglePreview = (signatureId) => {
    setShowPreview(prev => ({
      ...prev,
      [signatureId]: !prev[signatureId]
    }));
  };

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Pen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Signature Settings</h1>
              <p className="text-gray-600">Manage your digital signatures for document signing</p>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg border ${notification.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {notification.type === 'info' && <Info className="w-5 h-5" />}
              <div>
                <h4 className="font-semibold">{notification.title}</h4>
                <p className="text-sm">{notification.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Create New Signature */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Signature</h2>

          <SignatureInput
            onSignatureChange={setNewSignature}
            label="Your Digital Signature"
            required={false}
          />

          <div className="mt-4 flex justify-end">
            <button
              onClick={saveSignature}
              disabled={!newSignature || saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Signature'}
            </button>
          </div>
        </div>

        {/* Saved Signatures */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Saved Signatures ({signatures.length})
          </h2>

          {signatures.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Pen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No signatures saved yet</p>
              <p className="text-sm">Create your first signature above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {signatures.map((signature) => (
                <div
                  key={signature.id}
                  className={`border rounded-lg p-4 ${signature.id === defaultSignatureId
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {showPreview[signature.id] ? (
                          <img
                            src={signature.signatureData}
                            alt="Signature"
                            className="w-24 h-12 object-contain border border-gray-200 rounded bg-white"
                          />
                        ) : (
                          <div className="w-24 h-12 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                            <Pen className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {signature.name}
                          {signature.id === defaultSignatureId && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Default
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Created {new Date(signature.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePreview(signature.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title={showPreview[signature.id] ? 'Hide preview' : 'Show preview'}
                      >
                        {showPreview[signature.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>

                      {signature.id !== defaultSignatureId && (
                        <button
                          onClick={() => setDefaultSignature(signature.id)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          Set Default
                        </button>
                      )}

                      <button
                        onClick={() => deleteSignature(signature.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete signature"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <h4 className="font-semibold mb-1">About Digital Signatures</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Your signatures are securely stored and encrypted</li>
                <li>• Default signature will be used automatically in forms</li>
                <li>• You can create multiple signatures for different purposes</li>
                <li>• Signatures are legally binding for barangay documents</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}