import { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import { getAuthToken } from '@/lib/auth';

export default function TestImageDisplay() {
  const [signatures, setSignatures] = useState([]);
  const [testImage, setTestImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = '/api';

  const createTestImage = () => {
    // Create a simple test image
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 200, 100);

    // Draw a simple signature
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 50);
    ctx.quadraticCurveTo(60, 20, 100, 50);
    ctx.quadraticCurveTo(140, 80, 180, 50);
    ctx.stroke();

    const dataURL = canvas.toDataURL('image/png');
    setTestImage(dataURL);
    console.log('Created test image:', dataURL.substring(0, 100) + '...');
  };

  const loadSignatures = async () => {
    setLoading(true);
    try {
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
        console.log('Loaded signatures for image test:', data.signatures);
      }
    } catch (error) {
      console.error('Error loading signatures:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    createTestImage();
    loadSignatures();
  }, []);

  return (
    <Layout title="Test Image Display" subtitle="Debug signature image display issues">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Test Image */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🧪 Test Image (Generated in Browser)
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Generated Test Image:</h3>
              <div className="border border-gray-300 rounded p-4 bg-gray-50 inline-block">
                {testImage ? (
                  <img
                    src={testImage}
                    alt="Test signature"
                    className="border border-gray-400"
                    onLoad={() => console.log('✅ Test image loaded successfully')}
                    onError={() => console.error('❌ Test image failed to load')}
                  />
                ) : (
                  <p>Generating test image...</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Test Image Data:</h3>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono break-all">
                {testImage ? testImage.substring(0, 200) + '...' : 'No data'}
              </div>
            </div>
          </div>
        </div>

        {/* Database Signatures */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🗄️ Database Signatures ({signatures.length})
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : signatures.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No signatures found</p>
          ) : (
            <div className="space-y-4">
              {signatures.map((sig, index) => (
                <div key={sig.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <h4 className="font-medium text-sm mb-2">Preview:</h4>
                      <div className="w-32 h-16 border border-gray-300 rounded bg-white overflow-hidden">
                        {sig.signature_data ? (
                          <img
                            src={sig.signature_data}
                            alt={`Signature ${index + 1}`}
                            className="w-full h-full object-contain"
                            onLoad={() => {
                              console.log(`✅ Database signature ${index + 1} loaded successfully`);
                            }}
                            onError={(e) => {
                              console.error(`❌ Database signature ${index + 1} failed to load`);
                              console.error('Error details:', {
                                name: sig.name,
                                dataLength: sig.signature_data?.length,
                                dataStart: sig.signature_data?.substring(0, 100),
                                isValidDataURL: sig.signature_data?.startsWith('data:image/'),
                                hasBase64: sig.signature_data?.includes('base64,')
                              });
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full flex items-center justify-center text-red-500 text-xs"
                          style={{ display: sig.signature_data ? 'none' : 'flex' }}
                        >
                          {sig.signature_data ? '❌ Load Failed' : 'No Data'}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium">{sig.name}</h4>
                      <p className="text-sm text-gray-500 mb-2">
                        Created: {new Date(sig.created_at).toLocaleDateString()}
                      </p>

                      <div className="text-xs text-gray-600 space-y-1">
                        <p><strong>Has Data:</strong> {sig.signature_data ? 'Yes' : 'No'}</p>
                        {sig.signature_data && (
                          <>
                            <p><strong>Data Length:</strong> {sig.signature_data.length}</p>
                            <p><strong>Valid Data URL:</strong> {sig.signature_data.startsWith('data:image/') ? 'Yes' : 'No'}</p>
                            <p><strong>Has Base64:</strong> {sig.signature_data.includes('base64,') ? 'Yes' : 'No'}</p>
                            <p><strong>MIME Type:</strong> {
                              sig.signature_data.startsWith('data:image/')
                                ? sig.signature_data.split(';')[0].split(':')[1]
                                : 'Unknown'
                            }</p>
                          </>
                        )}
                      </div>

                      {sig.signature_data && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer">Show Raw Data</summary>
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono break-all max-h-32 overflow-y-auto">
                            {sig.signature_data}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comparison */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🔍 Comparison Test
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">✅ Working Test Image:</h3>
              <div className="border border-green-300 rounded p-4 bg-green-50">
                {testImage && (
                  <img src={testImage} alt="Working test" className="border border-gray-400" />
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">❓ Database Image:</h3>
              <div className="border border-blue-300 rounded p-4 bg-blue-50">
                {signatures.length > 0 && signatures[0].signature_data ? (
                  <img
                    src={signatures[0].signature_data}
                    alt="Database signature"
                    className="border border-gray-400"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div style={{ display: 'none' }} className="text-red-600 text-center py-4">
                  ❌ Failed to load database image
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}