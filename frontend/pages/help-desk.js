import { useState, useEffect } from "react";
import Layout from "@/components/Layout/Layout";
import { blotterAPI, assistanceAPI, kapchatAPI } from "@/lib/api";
import { AlertCircle, HeadphonesIcon, MessageCircle, RefreshCw } from "lucide-react";

const TABS = [
  { id: "esumbong", label: "E-Sumbong", icon: AlertCircle, color: "red" },
  { id: "assistance", label: "Brgy Assistance", icon: HeadphonesIcon, color: "emerald" },
  { id: "kapchat", label: "KapChat", icon: MessageCircle, color: "blue" },
];

const STATUS_OPTIONS = {
  esumbong: ["pending", "under_review", "resolved", "dismissed"],
  assistance: ["pending", "in_progress", "resolved"],
  kapchat: ["unread", "read", "replied"],
};

export default function HelpDesk() {
  const [activeTab, setActiveTab] = useState("esumbong");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "esumbong") {
        const { reports } = await blotterAPI.getReports();
        setItems(reports || []);
      } else if (activeTab === "assistance") {
        const { inquiries } = await assistanceAPI.getInquiries();
        setItems(inquiries || []);
      } else {
        const { messages } = await kapchatAPI.getMessages();
        setItems(messages || []);
      }
    } catch (error) {
      console.error("Error fetching help desk data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try {
      if (activeTab === "esumbong") {
        await blotterAPI.updateStatus(id, status);
      } else if (activeTab === "assistance") {
        await assistanceAPI.updateStatus(id, status);
      } else {
        await kapchatAPI.updateStatus(id, status);
      }
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  return (
    <Layout title="Help Desk" subtitle="Manage E-Sumbong, Brgy Assistance, and KapChat">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Tab Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  active
                    ? `bg-${tab.color}-50 text-${tab.color}-600 ring-1 ring-${tab.color}-200`
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
          <button
            onClick={fetchData}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 font-bold">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 text-gray-400 font-bold">
            No {TABS.find((t) => t.id === activeTab)?.label} submissions yet.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-black tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    {activeTab === "esumbong" && (
                      <>
                        <th className="px-4 py-3">Complainant</th>
                        <th className="px-4 py-3">Respondent</th>
                        <th className="px-4 py-3">Details</th>
                        <th className="px-4 py-3">Contact</th>
                      </>
                    )}
                    {activeTab === "assistance" && (
                      <>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Message</th>
                      </>
                    )}
                    {activeTab === "kapchat" && (
                      <>
                        <th className="px-4 py-3">Sender</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Message</th>
                      </>
                    )}
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>
                      {activeTab === "esumbong" && (
                        <>
                          <td className="px-4 py-3 font-bold text-gray-900">
                            {item.complainant_name}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{item.respondent_name}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                            {item.details}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {item.contact_number}
                          </td>
                        </>
                      )}
                      {activeTab === "assistance" && (
                        <>
                          <td className="px-4 py-3 font-bold text-gray-900">
                            {item.first_name} {item.last_name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{item.email || "-"}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {item.phone || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                            {item.message}
                          </td>
                        </>
                      )}
                      {activeTab === "kapchat" && (
                        <>
                          <td className="px-4 py-3 font-bold text-gray-900">
                            {item.sender_name || "Anonymous"}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {item.contact || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                            {item.message}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          disabled={updating === item.id}
                          className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black"
                        >
                          {STATUS_OPTIONS[activeTab].map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
