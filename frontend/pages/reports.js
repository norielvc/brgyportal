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
    <div className="space-y-4 sm:space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">
          System operational metrics and analytics reports
        </p>
        <button
          onClick={() => handleExport("pdf")}
          className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 active:scale-95 transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Summary</span>
        </button>
      </div>

      {/* Time Period Filter */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3.5 sm:p-5">
        <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2.5">
          Select Reporting Period
        </p>
        <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setSelectedPeriod(p.value)}
              className={`flex-1 sm:flex-none px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
                selectedPeriod === p.value
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3.5 sm:p-4">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">{m.label}</p>
            <p className="text-lg sm:text-2xl font-black text-gray-900 mt-1">{m.value}</p>
            <div className="flex items-center mt-1 text-[11px] sm:text-xs">
              {m.up ? (
                <ArrowUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
              <span
                className={`font-bold ml-0.5 ${m.up ? "text-emerald-600" : "text-rose-600"}`}
              >
                {m.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3.5">
          Available Export Formats
        </p>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {["PDF Document", "CSV Sheet", "Excel Table"].map((f) => (
            <button
              key={f}
              onClick={() => handleExport(f)}
              className="p-3 sm:p-5 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all text-center group active:scale-95 shadow-2xs"
            >
              <Download className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1.5 sm:mb-2 group-hover:-translate-y-0.5 transition-transform" />
              <p className="font-bold text-xs sm:text-sm text-gray-800">{f}</p>
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
