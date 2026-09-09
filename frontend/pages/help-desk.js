import { useState, useEffect, useMemo, useRef } from "react";
import Layout from "@/components/Layout/Layout";
import { blotterAPI, assistanceAPI, kapchatAPI } from "@/lib/api";
import {
  AlertCircle,
  AlertTriangle,
  HeadphonesIcon,
  MessageCircle,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Eye,
  Trash2,
  Printer,
  Send,
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  FileText,
  ShieldAlert,
  Clock3,
  Sparkles,
  ExternalLink,
  Check,
  Building,
  HelpCircle,
  CheckCheck,
  LayoutGrid,
  MessageSquare,
  BadgeCheck,
} from "lucide-react";
import Modal, { ConfirmModal } from "@/components/UI/Modal";
import { toast } from "react-hot-toast";
import useScrollLock from "@/lib/useScrollLock";

const TABS = [
  {
    id: "esumbong",
    label: "E-Sumbong Blotters",
    shortLabel: "E-Sumbong",
    description: "Citizen incident complaints & blotter records",
    icon: AlertCircle,
    color: "red",
    badgeBg: "bg-red-50 text-red-700 border-red-200",
    activeTabClass: "bg-red-600 text-white shadow-md shadow-red-200",
  },
  {
    id: "assistance",
    label: "Brgy Assistance",
    shortLabel: "Assistance",
    description: "Public inquiries & community support requests",
    icon: HeadphonesIcon,
    color: "emerald",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    activeTabClass: "bg-emerald-600 text-white shadow-md shadow-emerald-200",
  },
  {
    id: "kapchat",
    label: "KapChat Messages",
    shortLabel: "KapChat",
    description: "Direct community feedback & resident chat",
    icon: MessageCircle,
    color: "blue",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    activeTabClass: "bg-blue-600 text-white shadow-md shadow-blue-200",
  },
];

const STATUS_CONFIGS = {
  esumbong: [
    { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
    { value: "under_review", label: "Under Review", color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
    { value: "resolved", label: "Resolved", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
    { value: "dismissed", label: "Dismissed", color: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400" },
  ],
  assistance: [
    { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
    { value: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
    { value: "resolved", label: "Resolved", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  ],
  kapchat: [
    { value: "unread", label: "Unread", color: "bg-rose-100 text-rose-800 border-rose-200", dot: "bg-rose-500" },
    { value: "read", label: "Read", color: "bg-slate-100 text-slate-800 border-slate-200", dot: "bg-slate-400" },
    { value: "replied", label: "Replied", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  ],
};

export default function HelpDesk() {
  const [activeTab, setActiveTab] = useState("esumbong");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Summary counts across all 3 channels
  const [channelCounts, setChannelCounts] = useState({
    esumbong: { total: 0, pending: 0, resolved: 0 },
    assistance: { total: 0, pending: 0, resolved: 0 },
    kapchat: { total: 0, unread: 0, replied: 0 },
  });

  // Modal states
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState("esumbong");
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  // New entry form state
  const [newEntryData, setNewEntryData] = useState({
    // E-Sumbong
    complainant_name: "",
    respondent_name: "",
    details: "",
    incident_date: new Date().toISOString().split("T")[0],
    incident_time: "10:00",
    contact_number: "",
    email: "",
    // Assistance
    firstName: "",
    lastName: "",
    phone: "",
    message: "",
    // KapChat
    name: "",
    contact: "",
  });
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);

  // KapChat Messenger Specific States
  const [kapchatViewMode, setKapchatViewMode] = useState("messenger"); // 'messenger' | 'table'
  const [activeThreadKey, setActiveThreadKey] = useState(null);
  const [mobileChatViewActive, setMobileChatViewActive] = useState(false);
  const [messengerReplyInput, setMessengerReplyInput] = useState("");
  const messengerEndRef = useRef(null);

  // KapChat Canned Responses
  const CANNED_RESPONSES = [
    "Good day! We have received your inquiry. Our desk officer will assist you shortly.",
    "Barangay Hall is open 8:00 AM – 5:00 PM, Monday to Friday. Please bring 1 valid government ID.",
    "Your requested barangay document is processed and ready for pickup at Window 2.",
    "Thank you for reporting this concern. We have alerted our Barangay Tanods to inspect the location.",
  ];

  // KapChat reply state (for modal)
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Auto-scroll messenger chat to bottom
  useEffect(() => {
    if (messengerEndRef.current && activeTab === "kapchat") {
      messengerEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [items, activeThreadKey, activeTab]);

  // Live polling for KapChat (every 4s) to receive incoming resident messages
  useEffect(() => {
    if (activeTab !== "kapchat") return;
    const interval = setInterval(async () => {
      try {
        const res = await kapchatAPI.getMessages();
        if (res?.messages) {
          setItems(res.messages);
        }
      } catch (e) {
        // silent polling error
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Fetch data on tab change
  useEffect(() => {
    fetchCurrentTabData();
  }, [activeTab]);

  // Initial load of counts across all channels
  useEffect(() => {
    fetchAllChannelCounts();
  }, []);

  const fetchAllChannelCounts = async () => {
    try {
      const [esumbongRes, assistanceRes, kapchatRes] = await Promise.allSettled([
        blotterAPI.getReports(),
        assistanceAPI.getInquiries(),
        kapchatAPI.getMessages(),
      ]);

      const reports = esumbongRes.status === "fulfilled" && esumbongRes.value?.reports ? esumbongRes.value.reports : [];
      const inquiries = assistanceRes.status === "fulfilled" && assistanceRes.value?.inquiries ? assistanceRes.value.inquiries : [];
      const messages = kapchatRes.status === "fulfilled" && kapchatRes.value?.messages ? kapchatRes.value.messages : [];

      setChannelCounts({
        esumbong: {
          total: reports.length,
          pending: reports.filter((r) => r.status === "pending" || r.status === "under_review").length,
          resolved: reports.filter((r) => r.status === "resolved").length,
        },
        assistance: {
          total: inquiries.length,
          pending: inquiries.filter((i) => i.status === "pending" || i.status === "in_progress").length,
          resolved: inquiries.filter((i) => i.status === "resolved").length,
        },
        kapchat: {
          total: messages.length,
          unread: messages.filter((m) => m.status === "unread").length,
          replied: messages.filter((m) => m.status === "replied").length,
        },
      });
    } catch (error) {
      console.error("Error loading channel counts:", error);
    }
  };

  const fetchCurrentTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === "esumbong") {
        const res = await blotterAPI.getReports();
        setItems(res.reports || []);
      } else if (activeTab === "assistance") {
        const res = await assistanceAPI.getInquiries();
        setItems(res.inquiries || []);
      } else {
        const res = await kapchatAPI.getMessages();
        setItems(res.messages || []);
      }
      fetchAllChannelCounts();
    } catch (error) {
      console.error("Error fetching help desk data:", error);
      toast.error("Failed to load records. Please refresh.");
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

      if (selectedItem && selectedItem.id === id) {
        setSelectedItem((prev) => ({ ...prev, status }));
      }

      toast.success(`Status updated to ${status.replace("_", " ")}`);
      fetchAllChannelCounts();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteItem = async (item) => {
    try {
      if (activeTab === "esumbong") {
        await blotterAPI.deleteReport(item.id);
      } else if (activeTab === "assistance") {
        await assistanceAPI.deleteInquiry(item.id);
      } else {
        await kapchatAPI.deleteMessage(item.id);
      }

      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (selectedItem && selectedItem.id === item.id) {
        setIsDetailsModalOpen(false);
        setSelectedItem(null);
      }
      setDeleteConfirmItem(null);
      toast.success("Record deleted successfully");
      fetchAllChannelCounts();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete record");
    }
  };

  const handleCreateNewEntry = async (e) => {
    e.preventDefault();
    setIsSubmittingEntry(true);

    try {
      if (newEntryType === "esumbong") {
        if (!newEntryData.complainant_name || !newEntryData.respondent_name || !newEntryData.details || !newEntryData.contact_number) {
          toast.error("Please fill in all required fields");
          setIsSubmittingEntry(false);
          return;
        }

        await blotterAPI.createReport({
          complainant_name: newEntryData.complainant_name,
          respondent_name: newEntryData.respondent_name,
          details: newEntryData.details,
          incident_date: newEntryData.incident_date,
          incident_time: newEntryData.incident_time,
          contact_number: newEntryData.contact_number,
          email: newEntryData.email,
        });
        toast.success("Blotter report recorded successfully!");
      } else if (newEntryType === "assistance") {
        if (!newEntryData.firstName || !newEntryData.lastName || !newEntryData.message) {
          toast.error("Please provide first name, last name, and assistance details");
          setIsSubmittingEntry(false);
          return;
        }

        await assistanceAPI.create({
          firstName: newEntryData.firstName,
          lastName: newEntryData.lastName,
          phone: newEntryData.phone,
          email: newEntryData.email,
          message: newEntryData.message,
        });
        toast.success("Assistance request logged successfully!");
      } else {
        if (!newEntryData.message) {
          toast.error("Please provide a message");
          setIsSubmittingEntry(false);
          return;
        }

        await kapchatAPI.send({
          name: newEntryData.name || "Walk-in Resident",
          contact: newEntryData.contact,
          message: newEntryData.message,
        });
        toast.success("Message recorded successfully!");
      }

      setIsNewEntryModalOpen(false);
      resetNewEntryForm();
      if (activeTab === newEntryType) {
        fetchCurrentTabData();
      } else {
        setActiveTab(newEntryType);
      }
    } catch (error) {
      console.error("Error creating new entry:", error);
      toast.error(error.message || "Failed to save record");
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  // Group KapChat messages into conversation threads
  const kapchatThreads = useMemo(() => {
    if (activeTab !== "kapchat") return [];
    const threadsMap = {};

    items.forEach((msg) => {
      const key = msg.contact?.trim() || msg.sender_name?.trim() || `anon-${msg.id}`;
      if (!threadsMap[key]) {
        threadsMap[key] = {
          threadKey: key,
          contact: msg.contact || "",
          sender_name: msg.sender_name || "Resident",
          messages: [],
          lastMessageTime: msg.created_at,
          unreadCount: 0,
        };
      }
      threadsMap[key].messages.push(msg);
      if (!msg.is_admin && msg.status === "unread") {
        threadsMap[key].unreadCount += 1;
      }
      if (!msg.is_admin && msg.sender_name) {
        threadsMap[key].sender_name = msg.sender_name;
      }
    });

    const threadList = Object.values(threadsMap).map((thread) => {
      const sortedMsgs = [...thread.messages].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      const lastMsg = sortedMsgs[sortedMsgs.length - 1];
      const hasUnread = thread.unreadCount > 0;
      const allReplied = sortedMsgs.some((m) => m.is_admin);

      return {
        ...thread,
        messages: sortedMsgs,
        lastMessage: lastMsg?.message || "",
        lastMessageTime: lastMsg?.created_at || thread.lastMessageTime,
        status: hasUnread ? "unread" : allReplied ? "replied" : "read",
      };
    });

    return threadList.sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
  }, [items, activeTab]);

  // Filtered KapChat threads for left column
  const filteredThreads = useMemo(() => {
    return kapchatThreads.filter((thread) => {
      const matchesSearch =
        !searchTerm.trim() ||
        thread.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.messages.some((m) => m.message.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "unread" && thread.status === "unread") ||
        (statusFilter === "replied" && thread.status === "replied") ||
        (statusFilter === "read" && thread.status === "read");

      return matchesSearch && matchesStatus;
    });
  }, [kapchatThreads, searchTerm, statusFilter]);

  // Active selected thread in messenger
  const activeThread = useMemo(() => {
    if (!kapchatThreads.length) return null;
    if (activeThreadKey) {
      const found = kapchatThreads.find((t) => t.threadKey === activeThreadKey);
      if (found) return found;
    }
    return filteredThreads[0] || kapchatThreads[0];
  }, [kapchatThreads, filteredThreads, activeThreadKey]);

  // Messenger Reply Handler
  const handleSendMessengerReply = async (customText = null) => {
    if (!activeThread) return;
    const textToSend = (customText || messengerReplyInput).trim();
    if (!textToSend) return;

    setIsSendingReply(true);
    if (!customText) setMessengerReplyInput("");

    try {
      await kapchatAPI.send({
        sender_name: "Barangay Desk Officer",
        contact: activeThread.contact || "",
        message: textToSend,
        is_admin: true,
        status: "replied",
      });

      const res = await kapchatAPI.getMessages();
      if (res?.messages) {
        setItems(res.messages);
      }
      fetchAllChannelCounts();
      toast.success("Official reply sent to resident!");
    } catch (error) {
      console.error("Error sending messenger reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  // Update whole thread status
  const handleUpdateThreadStatus = async (thread, newStatus) => {
    try {
      if (thread.contact) {
        await kapchatAPI.updateThreadStatus(thread.contact, newStatus);
      } else {
        for (const m of thread.messages) {
          await kapchatAPI.updateStatus(m.id, newStatus);
        }
      }
      toast.success(`Conversation marked as ${newStatus}`);
      fetchCurrentTabData();
    } catch (err) {
      console.error("Error updating thread status:", err);
      toast.error("Failed to update conversation status");
    }
  };

  // Delete entire conversation thread
  const handleDeleteThread = async (thread) => {
    if (!window.confirm(`Delete complete chat thread with ${thread.sender_name}?`)) {
      return;
    }
    try {
      if (thread.contact) {
        await kapchatAPI.deleteThread(thread.contact);
      } else {
        for (const m of thread.messages) {
          await kapchatAPI.deleteMessage(m.id);
        }
      }
      toast.success("Chat thread deleted");
      fetchCurrentTabData();
    } catch (err) {
      console.error("Error deleting thread:", err);
      toast.error("Failed to delete chat thread");
    }
  };

  const handleSendKapChatReply = async () => {
    if (!replyMessage.trim() || !selectedItem) return;
    setIsSendingReply(true);
    try {
      // Mark current message as replied
      await kapchatAPI.updateStatus(selectedItem.id, "replied");

      // Post clean admin reply message
      await kapchatAPI.send({
        sender_name: "Barangay Desk Officer",
        contact: selectedItem.contact || "",
        message: replyMessage.trim(),
        is_admin: true,
        status: "replied",
      });

      const res = await kapchatAPI.getMessages();
      if (res?.messages) {
        setItems(res.messages);
      }
      setReplyMessage("");
      setIsDetailsModalOpen(false);
      toast.success("Official reply sent to resident!");
      fetchAllChannelCounts();
    } catch (error) {
      console.error("Error sending KapChat reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handlePrintBlotterSlip = (report) => {
    const printWindow = window.open("", "_blank", "width=850,height=1100");
    if (!printWindow) {
      alert("Please allow pop-ups to print the blotter summary slip.");
      return;
    }

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Barangay Blotter Slip - ${report.id.substring(0, 8).toUpperCase()}</title>
    <style>
      body { font-family: 'Times New Roman', serif; margin: 30px; color: #111; line-height: 1.5; }
      .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
      .header h2 { margin: 0; font-size: 16px; text-transform: uppercase; }
      .header h3 { margin: 2px 0; font-size: 14px; font-weight: normal; }
      .header h1 { margin: 8px 0 0 0; font-size: 20px; font-weight: bold; color: #b91c1c; }
      .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; font-weight: bold; }
      .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; background: #f3f4f6; padding: 4px 8px; border-left: 4px solid #b91c1c; margin-top: 15px; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; font-size: 13px; }
      .info-row { margin-bottom: 6px; }
      .info-row strong { display: inline-block; width: 140px; color: #374151; }
      .narrative-box { border: 1px solid #d1d5db; padding: 12px; min-height: 140px; font-size: 13px; white-space: pre-wrap; margin-top: 8px; background: #fafafa; }
      .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 12px; }
      .sig-line { border-top: 1px solid #000; margin-top: 45px; padding-top: 4px; font-weight: bold; text-transform: uppercase; }
      @media print { body { margin: 0; } }
    </style>
  </head>
  <body>
    <div class="header">
      <h3>Republic of the Philippines &bull; Province of Bulacan &bull; Municipality of Calumpit</h3>
      <h2>BARANGAY IBA O' ESTE</h2>
      <h3>OFFICE OF THE PUNONG BARANGAY / LUPONG TAGAPAMAYAPA</h3>
      <h1>OFFICIAL BLOTTER INCIDENT SLIP</h1>
    </div>

    <div class="meta">
      <div>ENTRY NO: <strong>BL-${report.id.substring(0, 8).toUpperCase()}</strong></div>
      <div>STATUS: <strong style="text-transform: uppercase;">${(report.status || "pending").replace("_", " ")}</strong></div>
      <div>DATE FILED: <strong>${new Date(report.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong></div>
    </div>

    <div class="section-title">I. Parties Involved</div>
    <div class="info-grid">
      <div>
        <div class="info-row"><strong>Complainant:</strong> ${report.complainant_name || "-"}</div>
        <div class="info-row"><strong>Contact Number:</strong> ${report.contact_number || "-"}</div>
        <div class="info-row"><strong>Email Address:</strong> ${report.email || "-"}</div>
      </div>
      <div>
        <div class="info-row"><strong>Respondent:</strong> ${report.respondent_name || "-"}</div>
        <div class="info-row"><strong>Incident Date:</strong> ${report.incident_date || "-"}</div>
        <div class="info-row"><strong>Incident Time:</strong> ${report.incident_time || "-"}</div>
      </div>
    </div>

    <div class="section-title">II. Statement of Facts / Incident Narrative</div>
    <div class="narrative-box">${report.details || "No narrative details recorded."}</div>

    <div class="signatures">
      <div>
        <div class="sig-line">${report.complainant_name || "Complainant Signature"}</div>
        <div>Affiant / Complainant</div>
      </div>
      <div>
        <div class="sig-line">Barangay Desk Officer</div>
        <div>Recorded By / Desk Officer on Duty</div>
      </div>
    </div>

    <script>
      window.onload = function() { window.print(); }
    <\/script>
  </body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const resetNewEntryForm = () => {
    setNewEntryData({
      complainant_name: "",
      respondent_name: "",
      details: "",
      incident_date: new Date().toISOString().split("T")[0],
      incident_time: "10:00",
      contact_number: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      message: "",
      name: "",
      contact: "",
    });
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Status Filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Search matching
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      if (activeTab === "esumbong") {
        return (
          (item.complainant_name || "").toLowerCase().includes(term) ||
          (item.respondent_name || "").toLowerCase().includes(term) ||
          (item.details || "").toLowerCase().includes(term) ||
          (item.contact_number || "").toLowerCase().includes(term) ||
          (item.email || "").toLowerCase().includes(term) ||
          (item.id || "").toLowerCase().includes(term)
        );
      } else if (activeTab === "assistance") {
        const fullName = `${item.first_name || ""} ${item.last_name || ""}`.toLowerCase();
        return (
          fullName.includes(term) ||
          (item.email || "").toLowerCase().includes(term) ||
          (item.phone || "").toLowerCase().includes(term) ||
          (item.message || "").toLowerCase().includes(term) ||
          (item.id || "").toLowerCase().includes(term)
        );
      } else {
        return (
          (item.sender_name || "").toLowerCase().includes(term) ||
          (item.contact || "").toLowerCase().includes(term) ||
          (item.message || "").toLowerCase().includes(term) ||
          (item.id || "").toLowerCase().includes(term)
        );
      }
    }).sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [items, statusFilter, searchTerm, sortBy, activeTab]);

  const currentTabConfig = TABS.find((t) => t.id === activeTab) || TABS[0];
  const currentStatusOptions = STATUS_CONFIGS[activeTab] || [];

  return (
    <Layout
      title="Help Desk Center"
      subtitle="Barangay Public Assistance, E-Sumbong Blotters & KapChat"
    >
      <div className="max-w-7xl mx-auto space-y-3.5 sm:space-y-5 pb-12">
        {/* Top Summary Metric Cards (2x2 on mobile, 4 columns on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Card 1: E-Sumbong */}
          <div
            onClick={() => setActiveTab("esumbong")}
            className={`cursor-pointer bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition-all hover:shadow-md ${
              activeTab === "esumbong" ? "border-red-400 ring-2 ring-red-100 shadow-sm" : "border-gray-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider truncate">E-Sumbong</span>
              <div className="p-1.5 sm:p-2 bg-red-50 text-red-600 rounded-lg sm:rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-3 flex items-baseline justify-between gap-1">
              <span className="text-xl sm:text-2xl font-black text-gray-900">{channelCounts.esumbong.total}</span>
              {channelCounts.esumbong.pending > 0 && (
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-red-100 text-red-800 animate-pulse truncate">
                  {channelCounts.esumbong.pending} Pend
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 sm:mt-1 font-medium truncate">
              {channelCounts.esumbong.resolved} resolved
            </p>
          </div>

          {/* Card 2: Assistance */}
          <div
            onClick={() => setActiveTab("assistance")}
            className={`cursor-pointer bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition-all hover:shadow-md ${
              activeTab === "assistance" ? "border-emerald-400 ring-2 ring-emerald-100 shadow-sm" : "border-gray-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider truncate">Assistance</span>
              <div className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl">
                <HeadphonesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-3 flex items-baseline justify-between gap-1">
              <span className="text-xl sm:text-2xl font-black text-gray-900">{channelCounts.assistance.total}</span>
              {channelCounts.assistance.pending > 0 && (
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-amber-100 text-amber-800 truncate">
                  {channelCounts.assistance.pending} Act
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 sm:mt-1 font-medium truncate">
              {channelCounts.assistance.resolved} resolved
            </p>
          </div>

          {/* Card 3: KapChat */}
          <div
            onClick={() => setActiveTab("kapchat")}
            className={`cursor-pointer bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition-all hover:shadow-md ${
              activeTab === "kapchat" ? "border-blue-400 ring-2 ring-blue-100 shadow-sm" : "border-gray-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider truncate">KapChat</span>
              <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl">
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-3 flex items-baseline justify-between gap-1">
              <span className="text-xl sm:text-2xl font-black text-gray-900">{channelCounts.kapchat.total}</span>
              {channelCounts.kapchat.unread > 0 && (
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-blue-100 text-blue-800 animate-pulse truncate">
                  {channelCounts.kapchat.unread} New
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 sm:mt-1 font-medium truncate">
              {channelCounts.kapchat.replied} replied
            </p>
          </div>

          {/* Card 4: Quick Action & Intake */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-300">Intake</span>
              <span className="text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded bg-white/10 text-emerald-300">LIVE</span>
            </div>
            <button
              onClick={() => {
                setNewEntryType(activeTab);
                setIsNewEntryModalOpen(true);
              }}
              className="mt-2 sm:mt-3 w-full py-1.5 sm:py-2 px-2.5 sm:px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow flex items-center justify-center gap-1 active:scale-95"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Log Record</span>
            </button>
          </div>
        </div>

        {/* Tab Selection Row (Touch-friendly & Horizontal Scroll on Mobile) */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-1.5 sm:p-2.5">
          <div className="flex sm:grid sm:grid-cols-3 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              const pendingCount =
                tab.id === "esumbong"
                  ? channelCounts.esumbong.pending
                  : tab.id === "assistance"
                  ? channelCounts.assistance.pending
                  : channelCounts.kapchat.unread;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setStatusFilter("all");
                    setSearchTerm("");
                    setMobileChatViewActive(false);
                  }}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all text-left shrink-0 min-w-[125px] sm:min-w-0 ${
                    active
                      ? tab.activeTabClass
                      : "bg-gray-50/80 hover:bg-gray-100 text-gray-700 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div
                      className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                        active ? "bg-white/20 text-white" : "bg-white text-gray-600 shadow-2xs"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs sm:text-sm font-bold truncate ${active ? "text-white" : "text-gray-900"}`}>
                        {tab.shortLabel}
                      </p>
                      <p className={`text-[10px] truncate hidden md:block ${active ? "text-white/80" : "text-gray-400"}`}>
                        {tab.description}
                      </p>
                    </div>
                  </div>
                  {pendingCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black shrink-0 ml-1.5 ${
                        active ? "bg-white text-gray-900" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Filter & Quick Actions Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${currentTabConfig.shortLabel} by name, details, contact...`}
                className="w-full pl-10 pr-9 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown, View Toggle & Refresh */}
            <div className="flex items-center gap-2 shrink-0">
              {activeTab === "kapchat" && (
                <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                  <button
                    onClick={() => setKapchatViewMode("messenger")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      kapchatViewMode === "messenger"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Messenger</span>
                  </button>
                  <button
                    onClick={() => setKapchatViewMode("table")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      kapchatViewMode === "table"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Table</span>
                  </button>
                </div>
              )}

              {!(activeTab === "kapchat" && kapchatViewMode === "messenger") && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              )}

              <button
                onClick={fetchCurrentTabData}
                disabled={loading}
                className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                title="Refresh items"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => {
                  setNewEntryType(activeTab);
                  setIsNewEntryModalOpen(true);
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Record</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-gray-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1 shrink-0">
              Status:
            </span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                statusFilter === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All ({items.length})
            </button>
            {currentStatusOptions.map((opt) => {
              const count = items.filter((i) => i.status === opt.value).length;
              const isSelected = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(isSelected ? "all" : opt.value)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 border flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : opt.dot}`} />
                  <span>{opt.label}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? "text-white/80" : "text-gray-400"}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main List & Records Container */}
        {loading ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-600">Loading {currentTabConfig.label} records...</p>
          </div>
        ) : activeTab === "kapchat" && kapchatViewMode === "messenger" ? (
          /* Live KapChat Split Messenger Workspace (Mobile slide between threads & active chat) */
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px] max-h-[780px]">
            {/* Left Column: Conversation Threads (4 cols on lg; hidden on mobile if chat is active) */}
            <div
              className={`lg:col-span-4 border-r border-gray-200 flex flex-col bg-slate-50/50 min-h-0 ${
                mobileChatViewActive ? "hidden lg:flex" : "flex"
              }`}
            >
              {/* Threads Header */}
              <div className="p-3 sm:p-3.5 border-b border-gray-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                      Conversations
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {kapchatThreads.length}
                  </span>
                </div>
              </div>

              {/* Threads List */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {filteredThreads.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 space-y-2">
                    <MessageCircle className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="text-xs font-semibold">No conversations matching search</p>
                  </div>
                ) : (
                  filteredThreads.map((thread) => {
                    const isSelected = activeThread?.threadKey === thread.threadKey;
                    return (
                      <div
                        key={thread.threadKey}
                        onClick={() => {
                          setActiveThreadKey(thread.threadKey);
                          setMobileChatViewActive(true);
                        }}
                        className={`p-3 sm:p-3.5 cursor-pointer transition-all flex items-start gap-3 relative ${
                          isSelected
                            ? "bg-blue-50/90 border-l-4 border-blue-600 shadow-2xs"
                            : "hover:bg-white bg-transparent active:bg-gray-100"
                        }`}
                      >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-xs">
                          {(thread.sender_name || "R")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h5 className="text-xs font-bold text-gray-900 truncate">
                              {thread.sender_name}
                            </h5>
                            <span className="text-[10px] text-gray-400 font-medium shrink-0">
                              {formatDate(thread.lastMessageTime)}
                            </span>
                          </div>
                          {thread.contact && (
                            <p className="text-[10px] font-mono text-gray-500 mb-1">
                              {thread.contact}
                            </p>
                          )}
                          <p className="text-xs text-gray-600 truncate font-normal">
                            {thread.lastMessage}
                          </p>
                        </div>
                        {thread.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs animate-pulse">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Active Conversation Stream (8 cols on lg; hidden on mobile if threads list is active) */}
            {activeThread ? (
              <div
                className={`lg:col-span-8 flex flex-col bg-white min-h-0 ${
                  !mobileChatViewActive ? "hidden lg:flex" : "flex"
                }`}
              >
                {/* Conversation Header */}
                <div className="p-2.5 sm:p-3.5 border-b border-gray-200 flex items-center justify-between bg-slate-50/90 gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* Mobile Back Button */}
                    <button
                      onClick={() => setMobileChatViewActive(false)}
                      className="lg:hidden p-1.5 -ml-1 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors shrink-0 flex items-center"
                      title="Back to conversation list"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-800" />
                    </button>

                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                      {(activeThread.sender_name || "R")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-gray-900 truncate">
                          {activeThread.sender_name}
                        </h4>
                        <span
                          className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border uppercase shrink-0 ${
                            activeThread.status === "unread"
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : activeThread.status === "replied"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {activeThread.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5">
                        {activeThread.contact ? (
                          <a
                            href={`tel:${activeThread.contact}`}
                            className="flex items-center gap-1 text-blue-600 hover:underline font-mono font-bold"
                          >
                            <Phone className="w-3 h-3" />
                            <span className="truncate max-w-[120px] sm:max-w-none">{activeThread.contact}</span>
                          </a>
                        ) : (
                          <span className="italic text-gray-400 text-[10px]">No phone</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Thread Status Switcher */}
                    <select
                      value={activeThread.status}
                      onChange={(e) => handleUpdateThreadStatus(activeThread, e.target.value)}
                      className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[11px] sm:text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                    >
                      <option value="unread">Unread</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                    </select>

                    {/* Delete Thread Button */}
                    <button
                      onClick={() => handleDeleteThread(activeThread)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete conversation thread"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 sm:space-y-3 bg-slate-50/40">
                  {activeThread.messages.map((msg) => {
                    const isAdmin = msg.is_admin;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-2xs ${
                            isAdmin
                              ? "bg-slate-900 text-white rounded-br-xs"
                              : "bg-white border border-gray-200 text-gray-800 rounded-bl-xs"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-[9px] sm:text-[10px] font-bold ${isAdmin ? "text-blue-400" : "text-gray-500"}`}>
                              {isAdmin ? "Desk Officer" : msg.sender_name || "Resident"}
                            </span>
                            <span className={`text-[8px] sm:text-[9px] ${isAdmin ? "text-slate-400" : "text-gray-400"}`}>
                              {formatDate(msg.created_at)}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed font-normal whitespace-pre-wrap">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messengerEndRef} />
                </div>

                {/* Canned Quick Response Chips */}
                <div className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-gray-50 border-t border-gray-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Quick:
                  </span>
                  {CANNED_RESPONSES.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessengerReply(chip)}
                      className="px-2 sm:px-2.5 py-1 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-800 text-[10px] sm:text-[11px] font-semibold rounded-lg shrink-0 transition-colors shadow-2xs"
                    >
                      {chip.substring(0, 24)}...
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <div className="p-2.5 sm:p-3 border-t border-gray-200 bg-white flex items-center gap-2">
                  <input
                    type="text"
                    value={messengerReplyInput}
                    onChange={(e) => setMessengerReplyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessengerReply();
                      }
                    }}
                    placeholder={`Reply to ${activeThread.sender_name}...`}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <button
                    onClick={() => handleSendMessengerReply()}
                    disabled={!messengerReplyInput.trim() || isSendingReply}
                    className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shrink-0 disabled:opacity-40 shadow-sm flex items-center gap-1 active:scale-95"
                  >
                    {isSendingReply ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden xs:inline">Reply</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-8 flex flex-col items-center justify-center p-12 text-center text-gray-400 bg-slate-50/20">
                <MessageCircle className="w-12 h-12 text-gray-300 mb-2" />
                <h4 className="text-sm font-bold text-gray-700">No Conversation Selected</h4>
                <p className="text-xs text-gray-400">Select a resident thread on the left to start chatting.</p>
              </div>
            )}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-3">
            <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-800">
              No {currentTabConfig.shortLabel} Records Found
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== "all"
                ? "Try clearing filters or search terms to see all records."
                : `There are currently no submissions under ${currentTabConfig.label}.`}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors inline-block"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-200 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Date Filed</th>
                    {activeTab === "esumbong" && (
                      <>
                        <th className="py-3 px-4">Complainant</th>
                        <th className="py-3 px-4">Respondent</th>
                        <th className="py-3 px-4">Incident Details</th>
                        <th className="py-3 px-4">Contact</th>
                      </>
                    )}
                    {activeTab === "assistance" && (
                      <>
                        <th className="py-3 px-4">Resident Name</th>
                        <th className="py-3 px-4">Contact Details</th>
                        <th className="py-3 px-4">Inquiry / Request Details</th>
                      </>
                    )}
                    {activeTab === "kapchat" && (
                      <>
                        <th className="py-3 px-4">Sender</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Message Content</th>
                      </>
                    )}
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredItems.map((item) => {
                    const statusConfig =
                      currentStatusOptions.find((s) => s.value === item.status) || currentStatusOptions[0];

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        {/* Date */}
                        <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap font-medium">
                          {formatDate(item.created_at)}
                        </td>

                        {/* E-Sumbong Columns */}
                        {activeTab === "esumbong" && (
                          <>
                            <td className="py-3.5 px-4 font-bold text-gray-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  {(item.complainant_name || "C")[0].toUpperCase()}
                                </div>
                                <span className="truncate max-w-[160px]">{item.complainant_name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-700">
                              <span className="truncate max-w-[140px] block">{item.respondent_name}</span>
                            </td>
                            <td className="py-3.5 px-4 text-gray-600 max-w-xs">
                              <p className="truncate font-medium">{item.details}</p>
                              {item.incident_date && (
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                  Incident: {item.incident_date} {item.incident_time || ""}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap font-mono text-gray-600">
                              {item.contact_number && (
                                <a
                                  href={`tel:${item.contact_number}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{item.contact_number}</span>
                                </a>
                              )}
                            </td>
                          </>
                        )}

                        {/* Assistance Columns */}
                        {activeTab === "assistance" && (
                          <>
                            <td className="py-3.5 px-4 font-bold text-gray-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  {(item.first_name || "A")[0].toUpperCase()}
                                </div>
                                <span>
                                  {item.first_name} {item.last_name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap text-gray-600">
                              {item.phone && (
                                <p className="font-mono flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <span>{item.phone}</span>
                                </p>
                              )}
                              {item.email && (
                                <p className="text-[11px] text-gray-400 truncate max-w-[150px]">
                                  {item.email}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-gray-700 max-w-sm">
                              <p className="truncate font-medium">{item.message}</p>
                            </td>
                          </>
                        )}

                        {/* KapChat Columns */}
                        {activeTab === "kapchat" && (
                          <>
                            <td className="py-3.5 px-4 font-bold text-gray-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  {(item.sender_name || "K")[0].toUpperCase()}
                                </div>
                                <span>{item.sender_name || "Anonymous Resident"}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap font-mono text-gray-600">
                              {item.contact ? (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-blue-600" />
                                  <span>{item.contact}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">No contact</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-gray-700 max-w-sm">
                              <p className="truncate font-medium">{item.message}</p>
                            </td>
                          </>
                        )}

                        {/* Status Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            disabled={updating === item.id}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                              statusConfig.color
                            } ${updating === item.id ? "opacity-40 animate-pulse" : ""}`}
                          >
                            {currentStatusOptions.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {activeTab === "esumbong" && (
                              <button
                                onClick={() => handlePrintBlotterSlip(item)}
                                className="p-1.5 text-gray-500 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Print Blotter Slip"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setIsDetailsModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => setDeleteConfirmItem(item)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards List */}
            <div className="md:hidden space-y-3">
              {filteredItems.map((item) => {
                const statusConfig =
                  currentStatusOptions.find((s) => s.value === item.status) || currentStatusOptions[0];

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setIsDetailsModalOpen(true);
                    }}
                    className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3 active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            activeTab === "esumbong"
                              ? "bg-red-100 text-red-700"
                              : activeTab === "assistance"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {activeTab === "esumbong"
                            ? (item.complainant_name || "C")[0].toUpperCase()
                            : activeTab === "assistance"
                            ? (item.first_name || "A")[0].toUpperCase()
                            : (item.sender_name || "K")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-snug">
                            {activeTab === "esumbong"
                              ? item.complainant_name
                              : activeTab === "assistance"
                              ? `${item.first_name || ""} ${item.last_name || ""}`
                              : item.sender_name || "Anonymous Resident"}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase shrink-0 ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Content snippet */}
                    <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700 font-medium leading-relaxed">
                      {activeTab === "esumbong" && (
                        <p className="text-[11px] font-bold text-red-600 mb-1">
                          VS: {item.respondent_name || "(No respondent specified)"}
                        </p>
                      )}
                      <p className="line-clamp-2">
                        {activeTab === "esumbong" ? item.details : item.message}
                      </p>
                    </div>

                    {/* Footer Actions on Mobile */}
                    <div
                      className="flex items-center justify-between pt-2 border-t border-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-xs font-mono text-gray-500">
                        {item.contact_number || item.phone || item.contact ? (
                          <a
                            href={`tel:${item.contact_number || item.phone || item.contact}`}
                            className="text-blue-600 hover:underline flex items-center gap-1 font-bold"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{item.contact_number || item.phone || item.contact}</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">No phone</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {activeTab === "esumbong" && (
                          <button
                            onClick={() => handlePrintBlotterSlip(item)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                            title="Print Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDetailsModalOpen(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Item View & Management Modal */}
        {isDetailsModalOpen && selectedItem && (
          <Modal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedItem(null);
            }}
            title={
              activeTab === "esumbong"
                ? `E-Sumbong Blotter Record (#${selectedItem.id.substring(0, 8).toUpperCase()})`
                : activeTab === "assistance"
                ? `Barangay Assistance Request (#${selectedItem.id.substring(0, 8).toUpperCase()})`
                : `KapChat Community Thread (#${selectedItem.id.substring(0, 8).toUpperCase()})`
            }
            size="lg"
          >
            <div className="space-y-5">
              {/* Header Status Bar inside modal */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Status:</span>
                  <select
                    value={selectedItem.status}
                    onChange={(e) => handleStatusChange(selectedItem.id, e.target.value)}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                  >
                    {currentStatusOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === "esumbong" && (
                    <button
                      onClick={() => handlePrintBlotterSlip(selectedItem)}
                      className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>Print Blotter Slip</span>
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirmItem(selectedItem)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Specific Content for E-Sumbong */}
              {activeTab === "esumbong" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Complainant Card */}
                    <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-red-600 flex items-center gap-1">
                        <User className="w-3 h-3" /> Complainant Information
                      </p>
                      <p className="text-base font-bold text-gray-900">{selectedItem.complainant_name}</p>
                      {selectedItem.contact_number && (
                        <p className="text-xs text-gray-600 flex items-center gap-1.5 font-mono">
                          <Phone className="w-3 h-3 text-red-500" />
                          <a href={`tel:${selectedItem.contact_number}`} className="text-blue-600 hover:underline">
                            {selectedItem.contact_number}
                          </a>
                        </p>
                      )}
                      {selectedItem.email && (
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-red-500" />
                          <a href={`mailto:${selectedItem.email}`} className="text-blue-600 hover:underline">
                            {selectedItem.email}
                          </a>
                        </p>
                      )}
                    </div>

                    {/* Respondent Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Respondent / Accused
                      </p>
                      <p className="text-base font-bold text-gray-900">{selectedItem.respondent_name}</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Incident Date: {selectedItem.incident_date || "Not specified"}</span>
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Incident Time: {selectedItem.incident_time || "Not specified"}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Incident Narrative */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-gray-400" /> Incident Narrative & Statement of Facts
                    </p>
                    <div className="p-3.5 bg-gray-50 rounded-lg text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                      {selectedItem.details || "No narrative details provided."}
                    </div>
                  </div>
                </div>
              )}

              {/* Specific Content for Assistance */}
              {activeTab === "assistance" && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Citizen Information
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {selectedItem.first_name} {selectedItem.last_name}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-600 pt-1">
                      {selectedItem.phone && (
                        <a href={`tel:${selectedItem.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{selectedItem.phone}</span>
                        </a>
                      )}
                      {selectedItem.email && (
                        <a href={`mailto:${selectedItem.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{selectedItem.email}</span>
                        </a>
                      )}
                      <span className="text-gray-400">
                        Date: {formatDate(selectedItem.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
                      <HeadphonesIcon className="w-3.5 h-3.5 text-gray-400" /> Inquiry / Assistance Message
                    </p>
                    <div className="p-3.5 bg-gray-50 rounded-lg text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                      {selectedItem.message}
                    </div>
                  </div>
                </div>
              )}

              {/* Specific Content for KapChat */}
              {activeTab === "kapchat" && (
                <div className="space-y-4">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> Sender Information
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {selectedItem.sender_name || "Anonymous Resident"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      {selectedItem.contact && (
                        <a href={`tel:${selectedItem.contact}`} className="text-blue-600 hover:underline flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3" />
                          <span>{selectedItem.contact}</span>
                        </a>
                      )}
                      <span className="text-gray-400">Sent on: {formatDate(selectedItem.created_at)}</span>
                    </div>
                  </div>

                  {/* Message Thread */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                      Citizen Message
                    </p>
                    <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-sm text-gray-800 leading-relaxed font-medium">
                      {selectedItem.message}
                    </div>
                  </div>

                  {/* Official Reply Box */}
                  <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-blue-400" /> Send Official Response
                    </p>
                    <textarea
                      rows={3}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type official response note here (e.g., Action taken, resolution notice, or follow-up instructions)..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSendKapChatReply}
                        disabled={isSendingReply || !replyMessage.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 shadow"
                      >
                        {isSendingReply ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Send Reply & Mark Replied</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* New Record Intake Modal */}
        {isNewEntryModalOpen && (
          <Modal
            isOpen={isNewEntryModalOpen}
            onClose={() => {
              setIsNewEntryModalOpen(false);
              resetNewEntryForm();
            }}
            title="Log New Help Desk Record"
            size="lg"
          >
            <form onSubmit={handleCreateNewEntry} className="space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setNewEntryType(tab.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        newEntryType === tab.id
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      <span>{tab.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields for E-Sumbong Blotter */}
              {newEntryType === "esumbong" && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Complainant Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newEntryData.complainant_name}
                        onChange={(e) => setNewEntryData({ ...newEntryData, complainant_name: e.target.value })}
                        placeholder="Full Name of Complainant"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Respondent / Accused <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newEntryData.respondent_name}
                        onChange={(e) => setNewEntryData({ ...newEntryData, respondent_name: e.target.value })}
                        placeholder="Name of Respondent"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Contact Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={newEntryData.contact_number}
                        onChange={(e) => setNewEntryData({ ...newEntryData, contact_number: e.target.value })}
                        placeholder="09XX XXX XXXX"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        value={newEntryData.email}
                        onChange={(e) => setNewEntryData({ ...newEntryData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Incident Date</label>
                      <input
                        type="date"
                        value={newEntryData.incident_date}
                        onChange={(e) => setNewEntryData({ ...newEntryData, incident_date: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Incident Time</label>
                      <input
                        type="time"
                        value={newEntryData.incident_time}
                        onChange={(e) => setNewEntryData({ ...newEntryData, incident_time: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Incident Details & Narrative <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={newEntryData.details}
                      onChange={(e) => setNewEntryData({ ...newEntryData, details: e.target.value })}
                      placeholder="State complete facts, location of incident, and damages/injuries..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Form Fields for Assistance */}
              {newEntryType === "assistance" && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newEntryData.firstName}
                        onChange={(e) => setNewEntryData({ ...newEntryData, firstName: e.target.value })}
                        placeholder="First Name"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newEntryData.lastName}
                        onChange={(e) => setNewEntryData({ ...newEntryData, lastName: e.target.value })}
                        placeholder="Last Name"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={newEntryData.phone}
                        onChange={(e) => setNewEntryData({ ...newEntryData, phone: e.target.value })}
                        placeholder="09XX XXX XXXX"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newEntryData.email}
                        onChange={(e) => setNewEntryData({ ...newEntryData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Assistance Request / Inquiry <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={newEntryData.message}
                      onChange={(e) => setNewEntryData({ ...newEntryData, message: e.target.value })}
                      placeholder="Specify requested assistance (medical, financial, legal advice, etc.)..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Form Fields for KapChat Message */}
              {newEntryType === "kapchat" && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Sender Name</label>
                      <input
                        type="text"
                        value={newEntryData.name}
                        onChange={(e) => setNewEntryData({ ...newEntryData, name: e.target.value })}
                        placeholder="Resident Name (optional)"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={newEntryData.contact}
                        onChange={(e) => setNewEntryData({ ...newEntryData, contact: e.target.value })}
                        placeholder="09XX XXX XXXX"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Message Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={newEntryData.message}
                      onChange={(e) => setNewEntryData({ ...newEntryData, message: e.target.value })}
                      placeholder="Type the community feedback or message note..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewEntryModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEntry}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingEntry ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmItem && (
          <ConfirmModal
            isOpen={!!deleteConfirmItem}
            onClose={() => setDeleteConfirmItem(null)}
            onConfirm={() => handleDeleteItem(deleteConfirmItem)}
            title="Delete Help Desk Record"
            message={`Are you sure you want to permanently delete this ${currentTabConfig.shortLabel} entry? This action cannot be undone.`}
            confirmText="Delete Record"
            type="danger"
          />
        )}
      </div>
    </Layout>
  );
}
