import { useState, useEffect } from 'react';

export default function TestOfficials() {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        console.log('🔍 Testing officials API...');
        const API_URL = '/api';
        console.log('🔍 API URL:', API_URL);

        const response = await fetch(`${API_URL}/officials`);
        console.log('📊 Response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📋 API Response:', data);

        if (data.success && data.data) {
          setOfficials(data.data);
          console.log('✅ Officials loaded:', data.data.length);
        } else {
          setError('Invalid API response format');
        }
      } catch (err) {
        console.error('❌ Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficials();
  }, []);

  if (loading) return <div className="p-8">Loading officials...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Officials API Test</h1>
      <p className="mb-4">Found {officials.length} officials</p>

      <div className="grid gap-4">
        {officials.map((official, index) => (
          <div key={official.id} className="border p-4 rounded">
            <h3 className="font-bold">{official.name}</h3>
            <p>Position: {official.position}</p>
            <p>Type: {official.position_type}</p>
            {official.committee && <p>Committee: {official.committee}</p>}
            <p className="text-sm text-gray-600">{official.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}