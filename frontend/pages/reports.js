import { useState } from "react";
import Layout from "@/components/Layout/Layout";
import {
  BarChart3,
  Users,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = (format) => {
    alert("Exported as " + format);
  };

  const periods = [
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
  ];

  const metrics = [
    { label: "Total Employees", value: "8", change: "+12%", up: true },
    { label: "Active Users", value: "7", change: "+8%", up: true },
    { label: "System Uptime", value: "99.9%", change: "+0.1%", up: true },
    { label: "Response Time", value: "245ms", change: "-15%", up: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <button
          onClick={() => handleExport("pdf")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <p className="font-semibold mb-3">Time Period</p>
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setSelectedPeriod(p.value)}
              className={`px-4 py-2 rounded-lg ${selectedPeriod === p.value ? "bg-blue-600 text-white" : "bg-gray-100"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-600">{m.label}</p>
            <p className="text-2xl font-bold mt-1">{m.value}</p>
            <div className="flex items-center mt-1">
              {m.up ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm ml-1 ${m.up ? "text-green-600" : "text-red-600"}`}
              >
                {m.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <p className="font-semibold mb-4">Export Options</p>
        <div className="grid grid-cols-3 gap-4">
          {["PDF", "CSV", "Excel"].map((f) => (
            <button
              key={f}
              onClick={() => handleExport(f)}
              className="p-4 border rounded-lg hover:bg-blue-50"
            >
              <Download className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="font-medium">{f}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

ReportsPage.getLayout = (page) => (
  <Layout title="Reports" subtitle="Analytics">
    {page}
  </Layout>
);
