import { useState, useEffect } from "react";

export default function TestSimpleOfficials() {
  const [officials, setOfficials] = useState([]);

  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        const API_URL = "/api";
        const response = await fetch(`${API_URL}/officials`);
        const data = await response.json();

        if (data.success && data.data) {
          setOfficials(data.data);
        }
      } catch (error) {
        console.error("Error fetching officials:", error);
      }
    };

    fetchOfficials();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Barangay Officials
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {officials.length > 0 ? (
          officials.map((official, index) => {
            const colors = [
              "from-blue-600 to-indigo-700",
              "from-teal-600 to-green-700",
              "from-emerald-600 to-green-700",
              "from-cyan-600 to-blue-700",
              "from-green-600 to-emerald-700",
              "from-purple-600 to-violet-700",
              "from-orange-600 to-red-700",
              "from-pink-600 to-rose-700",
              "from-indigo-600 to-purple-700",
              "from-yellow-600 to-orange-700",
              "from-red-600 to-pink-700",
              "from-gray-600 to-slate-700",
              "from-violet-600 to-purple-700",
              "from-rose-600 to-pink-700",
              "from-amber-600 to-orange-700",
              "from-lime-600 to-green-700",
            ];

            const colorClass = colors[index % colors.length];
            const initials = official.name
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("");

            return (
              <div
                key={official.id || index}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div
                  className={`bg-gradient-to-br ${colorClass} p-6 text-center`}
                >
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">
                      {initials}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {official.position}
                  </h3>
                  {official.committee && (
                    <p className="text-white/80 text-sm">
                      {official.committee}
                    </p>
                  )}
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {official.name}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {official.description}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">Loading officials...</p>
          </div>
        )}
      </div>
    </div>
  );
}
