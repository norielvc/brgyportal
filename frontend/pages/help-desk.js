import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
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
  Pencil,
  Save,
  Trash2,
  Printer,
  Download,
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
import ESumbongForm from "@/components/Forms/ESumbongForm";
import { toast } from "react-hot-toast";
import useScrollLock from "@/lib/useScrollLock";
import { buildKapchatHelpDeskThreads } from "@/lib/kapchatThread";
import {
  BLOTTER_DOC_VARIANT,
  downloadBlotterDocumentPdf,
  printBlotterDocument,
} from "@/lib/blotterDocument";
import BlotterDocumentPreviewModal from "@/components/HelpDesk/BlotterDocumentPreviewModal";
import {
  DEFAULT_CERTIFICATE_OFFICIALS,
} from "@/lib/certificateLetterhead";
import { mergeOfficialsConfig } from "@/lib/officialsConfig";
import { getAuthToken, getUserData } from "@/lib/auth";
import { userHasEsumbongAccess } from "@/lib/esumbongAccess";
import { userHasKapchatAccess } from "@/lib/kapchatAccess";
import {
  formatHearingScheduleDisplay,
  isBlotterVerified,
  orasNgPaghaharapInputValue,
} from "@/lib/blotterVerify";

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

const VALID_HELP_DESK_TABS = ["esumbong", "assistance", "kapchat"];
const API_URL = "/api";

export default function HelpDesk() {
  const router = useRouter();
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
  const [rejectConfirmItem, setRejectConfirmItem] = useState(null);
  const [isVerifyingBlotter, setIsVerifyingBlotter] = useState(false);
  const [blotterPdfDownloadingKey, setBlotterPdfDownloadingKey] = useState(null);
  const [blotterPreviewReport, setBlotterPreviewReport] = useState(null);
  const [blotterPreviewVariant, setBlotterPreviewVariant] = useState(
    BLOTTER_DOC_VARIANT.BLOTTER,
  );
  const [petsaDraft, setPetsaDraft] = useState("");
  const [petsaTimeDraft, setPetsaTimeDraft] = useState("");
  const [isSavingPetsa, setIsSavingPetsa] = useState(false);
  const [purposeDraft, setPurposeDraft] = useState("");
  const [isSavingPurpose, setIsSavingPurpose] = useState(false);
  const [isEditingEsumbong, setIsEditingEsumbong] = useState(false);
  const [esumbongEditDraft, setEsumbongEditDraft] = useState({
    complainant_name: "",
    respondent_name: "",
    purpose: "",
    contact_number: "",
    email: "",
    incident_date: "",
    incident_time: "",
    details: "",
  });
  const [isSavingEsumbong, setIsSavingEsumbong] = useState(false);
  const [certificateOfficials, setCertificateOfficials] = useState(
    DEFAULT_CERTIFICATE_OFFICIALS,
  );

  // New entry form state
  const [staffTenantId, setStaffTenantId] = useState("");
  const [canAccessEsumbong, setCanAccessEsumbong] = useState(false);
  const [canAccessKapchat, setCanAccessKapchat] = useState(false);
  const [esumbongAccessLoaded, setEsumbongAccessLoaded] = useState(false);

  const [newEntryData, setNewEntryData] = useState({
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const userObj = JSON.parse(storedUser);
      if (userObj?.tenant_id) {
        setStaffTenantId(String(userObj.tenant_id).toLowerCase());
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const loadEsumbongAccess = async () => {
      try {
        const token = getAuthToken();
        const user = getUserData();
        if (!token || !user) {
          setEsumbongAccessLoaded(true);
          return;
        }
        const [esumbongRes, kapchatRes] = await Promise.allSettled([
          fetch(`${API_URL}/workflows/esumbong-settings`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/workflows/kapchat-settings`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        let allowedEsumbong = true;
        if (esumbongRes.status === "fulfilled" && esumbongRes.value.ok) {
          const data = await esumbongRes.value.json();
          const settings = data?.data || {};
          allowedEsumbong = userHasEsumbongAccess(user, settings);
        }
        setCanAccessEsumbong(allowedEsumbong);

        let allowedKapchat = true;
        if (kapchatRes.status === "fulfilled" && kapchatRes.value.ok) {
          const kapData = await kapchatRes.value.json();
          const kapSettings = kapData?.data || {};
          allowedKapchat = userHasKapchatAccess(user, kapSettings);
        }
        setCanAccessKapchat(allowedKapchat);

        if (!allowedEsumbong) {
          setActiveTab((prev) => (prev === "esumbong" ? "assistance" : prev));
        }
        if (!allowedKapchat) {
          setActiveTab((prev) =>
            prev === "kapchat" ? (allowedEsumbong ? "esumbong" : "assistance") : prev,
          );
        }
      } catch {
        setCanAccessEsumbong(true);
        setCanAccessKapchat(true);
      } finally {
        setEsumbongAccessLoaded(true);
      }
    };
    loadEsumbongAccess();
  }, []);

  const visibleTabs = useMemo(
    () =>
      TABS.filter((tab) => {
        if (tab.id === "esumbong" && !canAccessEsumbong) return false;
        if (tab.id === "kapchat" && !canAccessKapchat) return false;
        return true;
      }),
    [canAccessEsumbong, canAccessKapchat],
  );

  useEffect(() => {
    if (!esumbongAccessLoaded) return;
    if (!canAccessEsumbong && activeTab === "esumbong") {
      setActiveTab("assistance");
    } else if (!canAccessKapchat && activeTab === "kapchat") {
      setActiveTab(canAccessEsumbong ? "esumbong" : "assistance");
    }
  }, [esumbongAccessLoaded, canAccessEsumbong, canAccessKapchat, activeTab]);

  // KapChat Messenger Specific States
  const [kapchatViewMode, setKapchatViewMode] = useState("messenger"); // 'messenger' | 'table'
  const [activeThreadKey, setActiveThreadKey] = useState(null);
  const [mobileChatViewActive, setMobileChatViewActive] = useState(false);
  const [messengerReplyInput, setMessengerReplyInput] = useState("");
  const messengerEndRef = useRef(null);

  // KapChat reply state (for modal)
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const [assistanceReplyMessage, setAssistanceReplyMessage] = useState("");
  const [isSendingAssistanceReply, setIsSendingAssistanceReply] = useState(false);

  // Auto-scroll messenger chat to bottom
  useEffect(() => {
    if (messengerEndRef.current && activeTab === "kapchat") {
      messengerEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [items, activeThreadKey, activeTab]);

  // Live polling for KapChat (every 4s) to receive incoming resident messages
  useEffect(() => {
    if (activeTab !== "kapchat" || !canAccessKapchat) return;
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
  }, [activeTab, canAccessKapchat]);

  // Fetch data on tab change once E-Sumbong & KapChat access check completes
  useEffect(() => {
    if (!esumbongAccessLoaded) return;
    fetchCurrentTabData();
  }, [activeTab, esumbongAccessLoaded, canAccessEsumbong, canAccessKapchat]);

  useEffect(() => {
    const loadCertificateOfficials = async () => {
      const applySaved = () => {
        const saved = localStorage.getItem("barangayOfficials");
        if (!saved) {
          setCertificateOfficials(DEFAULT_CERTIFICATE_OFFICIALS);
          return;
        }
        try {
          setCertificateOfficials(
            mergeOfficialsConfig(DEFAULT_CERTIFICATE_OFFICIALS, JSON.parse(saved)),
          );
        } catch {
          setCertificateOfficials(DEFAULT_CERTIFICATE_OFFICIALS);
        }
      };

      try {
        const token = getAuthToken();
        const headers = {
          "Content-Type": "application/json",
          "x-tenant-id": "ibaoeste",
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/officials/config`, { headers });
        const data = await res.json();
        if (data.success && data.data) {
          const merged = mergeOfficialsConfig(DEFAULT_CERTIFICATE_OFFICIALS, data.data);
          setCertificateOfficials(merged);
          localStorage.setItem("barangayOfficials", JSON.stringify(merged));
          return;
        }
      } catch (err) {
        console.error("Help desk: failed to load certificate officials", err);
      }
      applySaved();
    };

    loadCertificateOfficials();
  }, []);

  useEffect(() => {
    const onNavbarRefresh = () => {
      fetchCurrentTabData();
      fetchAllChannelCounts();
    };
    window.addEventListener("brgydesk-page-refresh", onNavbarRefresh);
    return () =>
      window.removeEventListener("brgydesk-page-refresh", onNavbarRefresh);
  }, [activeTab]);

  useEffect(() => {
    if (!router.isReady) return;
    const tab =
      typeof router.query.tab === "string" && VALID_HELP_DESK_TABS.includes(router.query.tab)
        ? router.query.tab
        : "esumbong";
    setActiveTab(tab);
  }, [router.isReady, router.query.tab]);

  const switchHelpDeskTab = (tabId) => {
    setActiveTab(tabId);
    setStatusFilter("all");
    setSearchTerm("");
    setMobileChatViewActive(false);
    const nextQuery = { ...router.query };
    if (tabId === "esumbong") {
      delete nextQuery.tab;
    } else {
      nextQuery.tab = tabId;
    }
    router.replace({ pathname: "/help-desk", query: nextQuery }, undefined, {
      shallow: true,
    });
  };

  const fetchAllChannelCounts = async (
    allowEsumbong = canAccessEsumbong,
    allowKapchat = canAccessKapchat,
  ) => {
    try {
      const [esumbongRes, assistanceRes, kapchatRes] = await Promise.allSettled([
        allowEsumbong
          ? blotterAPI.getReports()
          : Promise.resolve({ reports: [] }),
        assistanceAPI.getInquiries(),
        allowKapchat
          ? kapchatAPI.getMessages()
          : Promise.resolve({ messages: [] }),
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
        kapchat: (() => {
          const threads = buildKapchatHelpDeskThreads(messages);
          const unread = threads.reduce(
            (sum, t) => sum + (t.unreadCount || 0),
            0,
          );
          return {
            total: messages.length,
            unread,
            replied: messages.filter((m) => m.status === "replied").length,
          };
        })(),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("help-desk-nav-refresh"));
      }
    } catch (error) {
      console.error("Error loading channel counts:", error);
    }
  };

  const fetchCurrentTabData = async () => {
    if (!esumbongAccessLoaded) return;
    if (activeTab === "esumbong" && !canAccessEsumbong) {
      setActiveTab("assistance");
      return;
    }
    if (activeTab === "kapchat" && !canAccessKapchat) {
      setActiveTab(canAccessEsumbong ? "esumbong" : "assistance");
      return;
    }
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
      fetchAllChannelCounts(canAccessEsumbong, canAccessKapchat);
    } catch (error) {
      console.error("Error fetching help desk data:", error);
      if (error?.response?.status !== 403) {
        toast.error("Failed to load records. Please refresh.");
      }
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
        setIsSubmittingEntry(false);
        return;
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

  // Group KapChat messages — one conversation per resident (census record)
  const kapchatThreads = useMemo(() => {
    if (activeTab !== "kapchat") return [];
    return buildKapchatHelpDeskThreads(items);
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

  const kapchatThreadCounts = useMemo(() => {
    const threads = kapchatThreads;
    return {
      all: threads.length,
      unread: threads.filter((t) => t.status === "unread").length,
      read: threads.filter((t) => t.status === "read").length,
      replied: threads.filter((t) => t.status === "replied").length,
    };
  }, [kapchatThreads]);

  // Active selected thread in messenger
  const activeThread = useMemo(() => {
    if (!kapchatThreads.length) return null;
    if (activeThreadKey) {
      const inFiltered = filteredThreads.find((t) => t.threadKey === activeThreadKey);
      if (inFiltered) return inFiltered;
      const inAll = kapchatThreads.find((t) => t.threadKey === activeThreadKey);
      if (inAll) return inAll;
    }
    return filteredThreads[0] || kapchatThreads[0] || null;
  }, [kapchatThreads, filteredThreads, activeThreadKey]);

  // Messenger Reply Handler
  const handleSendMessengerReply = async () => {
    if (!activeThread) return;
    const textToSend = messengerReplyInput.trim();
    if (!textToSend) return;

    setIsSendingReply(true);
    setMessengerReplyInput("");

    try {
      await kapchatAPI.send({
        sender_name: "Barangay Desk Officer",
        contact: activeThread.contact || "",
        resident_id: activeThread.residentId || undefined,
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
      for (const m of thread.messages || []) {
        if (m.id) await kapchatAPI.updateStatus(m.id, newStatus);
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
      for (const m of thread.messages || []) {
        if (m.id) await kapchatAPI.deleteMessage(m.id);
      }
      toast.success("Chat thread deleted");
      fetchCurrentTabData();
    } catch (err) {
      console.error("Error deleting thread:", err);
      toast.error("Failed to delete chat thread");
    }
  };

  useEffect(() => {
    if (isDetailsModalOpen && activeTab === "assistance" && selectedItem) {
      setAssistanceReplyMessage(selectedItem.staff_response || "");
    }
  }, [isDetailsModalOpen, selectedItem?.id, activeTab, selectedItem?.staff_response]);

  useEffect(() => {
    if (activeTab !== "esumbong" || !selectedItem) {
      setPetsaDraft("");
      setPetsaTimeDraft("");
      setPurposeDraft("");
      return;
    }
    setPurposeDraft(selectedItem.purpose || "");
    if (!selectedItem.petsa_ng_paghaharap) {
      setPetsaDraft("");
      setPetsaTimeDraft("");
      return;
    }
    const raw = String(selectedItem.petsa_ng_paghaharap);
    setPetsaDraft(raw.includes("T") ? raw.slice(0, 10) : raw.slice(0, 10));
    setPetsaTimeDraft(
      orasNgPaghaharapInputValue(selectedItem.oras_ng_paghaharap) || "09:00",
    );
  }, [
    activeTab,
    selectedItem?.id,
    selectedItem?.purpose,
    selectedItem?.petsa_ng_paghaharap,
    selectedItem?.oras_ng_paghaharap,
  ]);

  const handleSendAssistanceReply = async (markResolved = false) => {
    if (!assistanceReplyMessage.trim() || !selectedItem) return;
    setIsSendingAssistanceReply(true);
    try {
      const res = await assistanceAPI.sendResponse(
        selectedItem.id,
        assistanceReplyMessage.trim(),
        markResolved,
      );
      if (res?.inquiry) {
        setSelectedItem(res.inquiry);
        setItems((prev) =>
          prev.map((row) => (row.id === res.inquiry.id ? res.inquiry : row)),
        );
      }
      toast.success(res?.message || "Response sent to resident");
      fetchAllChannelCounts();
      if (markResolved) {
        setIsDetailsModalOpen(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error("Error sending assistance reply:", error);
      toast.error(
        error.response?.data?.message || "Failed to send response",
      );
    } finally {
      setIsSendingAssistanceReply(false);
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
        resident_id: selectedItem.resident_id || undefined,
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

  const handlePreviewBlotterSlip = (report, variant = BLOTTER_DOC_VARIANT.BLOTTER) => {
    setBlotterPreviewVariant(variant);
    setBlotterPreviewReport(report);
  };

  const handlePrintBlotterSlip = async (
    report,
    variant = BLOTTER_DOC_VARIANT.BLOTTER,
  ) => {
    if (!report) return;
    try {
      const result = await printBlotterDocument(report, {
        officials: certificateOfficials,
        variant,
      });
      if (!result.ok) {
        toast.error("Could not open print dialog.");
      }
    } catch (err) {
      console.error("Blotter print error:", err);
      toast.error("Failed to print document");
    }
  };

  const handlePrintFromBlotterPreview = () => {
    if (blotterPreviewReport) {
      void handlePrintBlotterSlip(blotterPreviewReport, blotterPreviewVariant);
    }
  };

  const handleDownloadFromBlotterPreview = () => {
    if (blotterPreviewReport) {
      void handleDownloadBlotterPdf(
        blotterPreviewReport,
        blotterPreviewVariant,
      );
    }
  };

  const handleDownloadBlotterPdf = async (
    report,
    variant = BLOTTER_DOC_VARIANT.BLOTTER,
  ) => {
    if (!report?.id) return;
    const downloadKey = `${report.id}:${variant}`;
    setBlotterPdfDownloadingKey(downloadKey);
    try {
      const result = await downloadBlotterDocumentPdf(report, {
        officials: certificateOfficials,
        variant,
      });
      if (!result.ok) {
        toast.error("Could not generate PDF. Try Preview or Print instead.");
        return;
      }
      toast.success("PDF downloaded");
    } catch (err) {
      console.error("Blotter PDF download error:", err);
      toast.error("Failed to download PDF");
    } finally {
      setBlotterPdfDownloadingKey(null);
    }
  };

  const renderEsumbongDocActions = (report, variant, compactLabel) => {
    const downloadKey = `${report.id}:${variant}`;
    return (
      <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-2 bg-white border border-gray-200 rounded-lg">
        <span className="text-[11px] font-semibold text-gray-800 mr-1 min-w-0">
          {compactLabel}
        </span>
        <button
          type="button"
          onClick={() => handlePreviewBlotterSlip(report, variant)}
          className="p-1 text-gray-600 hover:bg-gray-100 rounded-md"
          title={`Preview — ${compactLabel}`}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => void handlePrintBlotterSlip(report, variant)}
          className="p-1 text-gray-600 hover:bg-gray-100 rounded-md"
          title={`Print — ${compactLabel}`}
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => void handleDownloadBlotterPdf(report, variant)}
          disabled={blotterPdfDownloadingKey === downloadKey}
          className="p-1 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-40"
          title={`Download PDF — ${compactLabel}`}
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  const handleRejectEsumbong = async (item) => {
    if (!item?.id) return;
    setUpdating(item.id);
    try {
      await blotterAPI.updateStatus(item.id, "dismissed");
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "dismissed" } : i)),
      );
      if (selectedItem?.id === item.id) {
        setSelectedItem((prev) => ({ ...prev, status: "dismissed" }));
      }
      toast.success("E-Sumbong marked as rejected (dismissed)");
      fetchAllChannelCounts();
    } catch (error) {
      console.error("Reject E-Sumbong error:", error);
      toast.error("Failed to reject E-Sumbong");
    } finally {
      setUpdating(null);
      setRejectConfirmItem(null);
    }
  };

  const handleVerifyEsumbong = async () => {
    if (!selectedItem?.id) return;
    if (!purposeDraft?.trim()) {
      toast.error("Kailangan ilagay ang 'Para sa:' (purpose ng sumbong) bago i-verify.");
      return;
    }
    setIsVerifyingBlotter(true);
    try {
      const res = await blotterAPI.verifyReport(selectedItem.id, {
        purpose: purposeDraft.trim(),
      });
      const report = res.report;
      setItems((prev) =>
        prev.map((item) => (item.id === report.id ? report : item)),
      );
      setSelectedItem(report);
      toast.success(
        res.alreadyVerified
          ? "E-Sumbong was already verified."
          : `Verified — ${report.usaping_barangay_number}`,
      );
      fetchAllChannelCounts();
    } catch (error) {
      console.error("Verify E-Sumbong error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to verify E-Sumbong",
      );
    } finally {
      setIsVerifyingBlotter(false);
    }
  };

  const handleSavePurpose = async () => {
    if (!selectedItem?.id) return;
    if (!purposeDraft?.trim()) {
      toast.error("Kailangan ilagay ang 'Para sa:' (purpose ng sumbong).");
      return;
    }
    setIsSavingPurpose(true);
    try {
      const res = await blotterAPI.updatePurpose(
        selectedItem.id,
        purposeDraft.trim(),
      );
      const report = res.report;
      setItems((prev) =>
        prev.map((item) => (item.id === report.id ? report : item)),
      );
      setSelectedItem(report);
      toast.success("Na-save ang 'Para sa:'");
    } catch (error) {
      console.error("Update purpose error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to save 'Para sa:'",
      );
    } finally {
      setIsSavingPurpose(false);
    }
  };

  const handleSavePetsaNgPaghaharap = async () => {
    if (!selectedItem?.id || !petsaDraft) return;
    const currentDate = selectedItem.petsa_ng_paghaharap
      ? String(selectedItem.petsa_ng_paghaharap).slice(0, 10)
      : "";
    const currentTime =
      orasNgPaghaharapInputValue(selectedItem.oras_ng_paghaharap) || "09:00";
    if (petsaDraft === currentDate && petsaTimeDraft === currentTime) return;

    setIsSavingPetsa(true);
    try {
      const res = await blotterAPI.updatePetsaNgPaghaharap(
        selectedItem.id,
        petsaDraft,
        petsaTimeDraft || null,
      );
      const report = res.report;
      setItems((prev) =>
        prev.map((item) => (item.id === report.id ? report : item)),
      );
      setSelectedItem(report);
      toast.success("Petsa ng paghaharap saved");
    } catch (error) {
      console.error("Update petsa error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update hearing date",
      );
    } finally {
      setIsSavingPetsa(false);
    }
  };

  const handleStartEditEsumbong = (item = selectedItem) => {
    if (!item) return;
    setEsumbongEditDraft({
      complainant_name: item.complainant_name || "",
      respondent_name: item.respondent_name || "",
      purpose: item.purpose || "",
      contact_number: item.contact_number || "",
      email: item.email || "",
      incident_date: item.incident_date ? String(item.incident_date).slice(0, 10) : "",
      incident_time: item.incident_time ? String(item.incident_time).slice(0, 5) : "",
      details: item.details || "",
    });
    setIsEditingEsumbong(true);
  };

  const handleCancelEditEsumbong = () => {
    setIsEditingEsumbong(false);
  };

  const handleSaveEsumbong = async () => {
    if (!selectedItem?.id) return;
    if (!esumbongEditDraft.complainant_name.trim()) {
      toast.error("Kailangan ang pangalan ng nagsusumbong.");
      return;
    }
    if (!esumbongEditDraft.respondent_name.trim()) {
      toast.error("Kailangan ang pangalan ng inirereklamo.");
      return;
    }
    if (!esumbongEditDraft.contact_number.trim()) {
      toast.error("Kailangan ang contact number.");
      return;
    }
    if (!esumbongEditDraft.incident_date.trim()) {
      toast.error("Kailangan ang petsa ng pangyayari.");
      return;
    }
    if (!esumbongEditDraft.details.trim()) {
      toast.error("Kailangan ang detalye ng sumbong.");
      return;
    }
    if (!esumbongEditDraft.purpose?.trim()) {
      toast.error("Kailangan ang 'Para sa:' (layunin o paksa ng sumbong).");
      return;
    }

    try {
      setIsSavingEsumbong(true);
      const res = await blotterAPI.updateReport(selectedItem.id, esumbongEditDraft);
      if (res?.success) {
        toast.success(res.message || "Na-update ang E-Sumbong report.");
        const updated = res.report || { ...selectedItem, ...esumbongEditDraft };
        setSelectedItem(updated);
        setItems((prev) =>
          prev.map((it) => (it.id === selectedItem.id ? { ...it, ...updated } : it))
        );
        setIsEditingEsumbong(false);
      } else {
        toast.error(res?.message || "Failed to update E-Sumbong report.");
      }
    } catch (err) {
      console.error("Save E-Sumbong error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Error saving changes.");
    } finally {
      setIsSavingEsumbong(false);
    }
  };

  const resetNewEntryForm = () => {
    setNewEntryData({
      firstName: "",
      lastName: "",
      phone: "",
      message: "",
      name: "",
      contact: "",
      email: "",
    });
  };

  const handleWalkInEsumbongSaved = () => {
    setIsNewEntryModalOpen(false);
    resetNewEntryForm();
    if (activeTab === "esumbong") {
      fetchCurrentTabData();
    } else {
      setActiveTab("esumbong");
    }
    fetchAllChannelCounts();
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
      subtitle="E-Sumbong, assistance & KapChat"
      mainClassName="p-2 sm:p-4 pb-24 lg:pb-4"
    >
      <div className="max-w-[1600px] mx-auto space-y-2.5 text-[13px] pb-6">
        {/* Top Summary Metric Cards (2x2 on mobile, 4 columns on desktop) */}
        <div
          className={`grid grid-cols-2 ${
            canAccessEsumbong ? "lg:grid-cols-4" : "lg:grid-cols-2"
          } gap-2`}
        >
          {/* Card 1: E-Sumbong */}
          {canAccessEsumbong && (
            <div
              onClick={() => switchHelpDeskTab("esumbong")}
              className={`cursor-pointer bg-white rounded-lg p-2.5 border transition-all hover:shadow-sm ${
                activeTab === "esumbong" ? "border-red-400 ring-1 ring-red-100" : "border-gray-200/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide truncate">E-Sumbong</span>
                <div className="p-1 bg-red-50 text-red-600 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-0.5 flex items-baseline justify-between gap-1">
                <span className="text-lg font-black text-gray-900 tabular-nums">{channelCounts.esumbong.total}</span>
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
          )}

          {/* Card 2: Assistance */}
          <div
            onClick={() => switchHelpDeskTab("assistance")}
            className={`cursor-pointer bg-white rounded-lg p-2.5 border transition-all hover:shadow-sm ${
              activeTab === "assistance" ? "border-emerald-400 ring-1 ring-emerald-100" : "border-gray-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide truncate">Assistance</span>
              <div className="p-1 bg-emerald-50 text-emerald-600 rounded-md">
                <HeadphonesIcon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-0.5 flex items-baseline justify-between gap-1">
              <span className="text-lg font-black text-gray-900 tabular-nums">{channelCounts.assistance.total}</span>
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
          {canAccessKapchat && (
            <div
              onClick={() => switchHelpDeskTab("kapchat")}
              className={`cursor-pointer bg-white rounded-lg p-2.5 border transition-all hover:shadow-sm ${
                activeTab === "kapchat" ? "border-blue-400 ring-1 ring-blue-100" : "border-gray-200/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide truncate">KapChat</span>
                <div className="p-1 bg-blue-50 text-blue-600 rounded-md">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-0.5 flex items-baseline justify-between gap-1">
                <span className="text-lg font-black text-gray-900 tabular-nums">{channelCounts.kapchat.total}</span>
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
          )}

          {/* Card 4: Quick Action & Intake */}
          {canAccessEsumbong && (
            <div className="bg-gradient-to-br from-[#021b38] to-[#03254c] text-white rounded-lg p-2.5 flex flex-col justify-between min-h-[72px]">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-300">Intake</span>
                <span className="text-[8px] font-bold px-1 py-px rounded bg-white/10 text-emerald-300">LIVE</span>
              </div>
              <button
                onClick={() => {
                  setNewEntryType("esumbong");
                  setIsNewEntryModalOpen(true);
                }}
                className="mt-1.5 w-full py-1.5 px-2 bg-white/15 hover:bg-white/25 text-white rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                title="Log walk-in E-Sumbong at the help desk"
              >
                <Plus className="w-3 h-3" />
                <span>Walk-in E-Sumbong</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Selection Row (Touch-friendly & Horizontal Scroll on Mobile) */}
        <div className="bg-white rounded-lg border border-gray-200 p-0.5">
          <div className="grid grid-cols-3 gap-0.5">
            {visibleTabs.map((tab) => {
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
                  onClick={() => switchHelpDeskTab(tab.id)}
                  className={`flex items-center justify-between py-1.5 px-2 rounded-md transition-all text-left min-w-0 ${
                    active
                      ? tab.activeTabClass
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-white" : "text-gray-600"}`} />
                    <p className={`text-[11px] font-bold truncate ${active ? "text-white" : "text-gray-900"}`}>
                      {tab.shortLabel}
                    </p>
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
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0 max-w-full sm:max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${currentTabConfig.shortLabel}...`}
                className="w-full pl-8 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#03254c]/20 focus:border-[#03254c] focus:bg-white transition-all"
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
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
              {activeTab === "kapchat" && (
                <div className="flex items-center bg-gray-100 p-0.5 rounded-md border border-gray-200">
                  <button
                    onClick={() => setKapchatViewMode("messenger")}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                      kapchatViewMode === "messenger"
                        ? "bg-white text-[#03254c] shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span className="hidden xs:inline">Chat</span>
                  </button>
                  <button
                    onClick={() => setKapchatViewMode("table")}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                      kapchatViewMode === "table"
                        ? "bg-white text-[#03254c] shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span className="hidden xs:inline">Table</span>
                  </button>
                </div>
              )}

              {!(activeTab === "kapchat" && kapchatViewMode === "messenger") && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="py-1.5 px-2 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#03254c]/20 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              )}

              <button
                onClick={fetchCurrentTabData}
                disabled={loading}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-white bg-[#03254c] hover:opacity-90 rounded-md transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                title="Refresh items"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => {
                  setNewEntryType(activeTab);
                  setIsNewEntryModalOpen(true);
                }}
                className="px-2.5 py-1.5 bg-[#03254c] hover:opacity-90 text-white rounded-md text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New record</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1 border-t border-gray-100">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all shrink-0 ${
                statusFilter === "all"
                  ? "bg-[#03254c] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All (
              {activeTab === "kapchat"
                ? kapchatThreadCounts.all
                : items.length}
              )
            </button>
            {currentStatusOptions.map((opt) => {
              const count =
                activeTab === "kapchat"
                  ? kapchatThreadCounts[opt.value] ?? 0
                  : items.filter((i) => i.status === opt.value).length;
              const isSelected = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(isSelected ? "all" : opt.value)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all shrink-0 border flex items-center gap-1 ${
                    isSelected
                      ? "bg-[#03254c] text-white border-[#03254c]"
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
          <div className="bg-white rounded-lg py-10 text-center border border-gray-200">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#03254c] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-600">Loading {currentTabConfig.label}...</p>
          </div>
        ) : activeTab === "kapchat" && kapchatViewMode === "messenger" ? (
          /* Live KapChat Split Messenger Workspace (Mobile slide between threads & active chat) */
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col lg:flex-row min-h-[480px] h-[min(72vh,780px)] max-h-[780px]">
            {/* Left Column: conversation list — fixed width on desktop so all threads stay readable */}
            <div
              className={`w-full lg:w-[340px] xl:w-[380px] shrink-0 border-r border-gray-200 flex flex-col bg-slate-50/50 min-h-0 min-h-[240px] lg:min-h-0 ${
                mobileChatViewActive ? "hidden lg:flex" : "flex"
              }`}
            >
              {/* Threads Header */}
              <div className="p-2.5 sm:p-3 border-b border-gray-200 bg-white space-y-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 truncate">
                      Conversations
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                    {filteredThreads.length}/{kapchatThreads.length}
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search residents..."
                    className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-[11px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Threads List */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-gray-100">
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
                        className={`px-2.5 py-2 sm:px-3 sm:py-2.5 cursor-pointer transition-all flex items-start gap-2.5 relative ${
                          isSelected
                            ? "bg-blue-50/90 border-l-4 border-blue-600 shadow-2xs"
                            : "hover:bg-white bg-transparent active:bg-gray-100"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-xs">
                          {(thread.sender_name || "R")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1 mb-0.5">
                            <h5 className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight line-clamp-2">
                              {thread.sender_name}
                            </h5>
                            <span className="text-[9px] text-gray-400 font-medium shrink-0 pt-0.5">
                              {formatDate(thread.lastMessageTime)}
                            </span>
                          </div>
                          {thread.contact && (
                            <p className="text-[9px] font-mono text-gray-500 truncate mb-0.5">
                              {thread.contact}
                            </p>
                          )}
                          <p className="text-[10px] sm:text-[11px] text-gray-600 line-clamp-2 leading-snug font-normal">
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
                className={`flex-1 min-w-0 flex flex-col bg-white min-h-0 ${
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
          <div className="bg-white rounded-lg py-10 px-4 text-center border border-gray-200 space-y-2">
            <div className="w-9 h-9 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-gray-800">
              No {currentTabConfig.shortLabel} records found
            </h3>
            <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
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
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-md transition-colors inline-block"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[9px] font-bold uppercase tracking-wide border-b border-gray-200">
                    <th className="py-2 px-2.5">Date Filed</th>
                    {activeTab === "esumbong" && (
                      <>
                        <th className="py-2 px-2.5">Complainant</th>
                        <th className="py-2 px-2.5">Respondent</th>
                        <th className="py-2 px-2.5">Incident</th>
                        <th className="py-2 px-2.5">Contact</th>
                      </>
                    )}
                    {activeTab === "assistance" && (
                      <>
                        <th className="py-2 px-2.5">Resident</th>
                        <th className="py-2 px-2.5">Contact</th>
                        <th className="py-2 px-2.5">Request</th>
                      </>
                    )}
                    {activeTab === "kapchat" && (
                      <>
                        <th className="py-2 px-2.5">Sender</th>
                        <th className="py-2 px-2.5">Contact</th>
                        <th className="py-2 px-2.5">Message</th>
                      </>
                    )}
                    <th className="py-2 px-2.5">Status</th>
                    <th className="py-2 px-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
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
                        <td className="py-1.5 px-2.5 text-gray-500 whitespace-nowrap font-medium text-[10px] tabular-nums">
                          {formatDate(item.created_at)}
                        </td>

                        {/* E-Sumbong Columns */}
                        {activeTab === "esumbong" && (
                          <>
                            <td className="py-1.5 px-2.5 font-bold text-gray-900">
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {(item.complainant_name || "C")[0].toUpperCase()}
                                </div>
                                <span className="truncate max-w-[160px]">{item.complainant_name}</span>
                                {item.intake_source === "walk_in" && (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-200">
                                    Walk-in
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-1.5 px-2.5 font-bold text-slate-700 text-[11px]">
                              <span className="truncate max-w-[140px] block">{item.respondent_name}</span>
                            </td>
                            <td className="py-1.5 px-2.5 text-gray-600 max-w-xs text-[11px]">
                              <p className="truncate font-medium">{item.details}</p>
                              {item.incident_date && (
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                  Incident: {item.incident_date} {item.incident_time || ""}
                                </p>
                              )}
                            </td>
                            <td className="py-1.5 px-2.5 whitespace-nowrap font-mono text-gray-600">
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
                            <td className="py-1.5 px-2.5 font-bold text-gray-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  {(item.first_name || "A")[0].toUpperCase()}
                                </div>
                                <span>
                                  {item.first_name} {item.last_name}
                                </span>
                              </div>
                            </td>
                            <td className="py-1.5 px-2.5 whitespace-nowrap text-gray-600">
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
                            <td className="py-1.5 px-2.5 text-gray-700 max-w-sm">
                              <p className="truncate font-medium">{item.message}</p>
                            </td>
                          </>
                        )}

                        {/* KapChat Columns */}
                        {activeTab === "kapchat" && (
                          <>
                            <td className="py-1.5 px-2.5 font-bold text-gray-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  {(item.sender_name || "K")[0].toUpperCase()}
                                </div>
                                <span>{item.sender_name || "Anonymous Resident"}</span>
                              </div>
                            </td>
                            <td className="py-1.5 px-2.5 whitespace-nowrap font-mono text-gray-600">
                              {item.contact ? (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-blue-600" />
                                  <span>{item.contact}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">No contact</span>
                              )}
                            </td>
                            <td className="py-1.5 px-2.5 text-gray-700 max-w-sm">
                              <p className="truncate font-medium">{item.message}</p>
                            </td>
                          </>
                        )}

                        {/* Status Column */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
                        <td className="py-1.5 px-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {activeTab === "esumbong" && (
                              <>
                                {canAccessEsumbong && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      handleStartEditEsumbong(item);
                                      setIsDetailsModalOpen(true);
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Edit E-Sumbong"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDownloadBlotterPdf(item)}
                                  disabled={
                                    blotterPdfDownloadingKey ===
                                    `${item.id}:${BLOTTER_DOC_VARIANT.BLOTTER}`
                                  }
                                  className="p-1.5 text-gray-500 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
                                  title="Download PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintBlotterSlip(item)}
                                  className="p-1.5 text-gray-500 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Print Blotter Slip"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              </>
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
                    className="bg-white rounded-lg p-2.5 border border-gray-200 space-y-2 active:scale-[0.99] transition-all"
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
                          <>
                            <button
                              type="button"
                              onClick={() => handleDownloadBlotterPdf(item)}
                              disabled={
                                blotterPdfDownloadingKey ===
                                `${item.id}:${BLOTTER_DOC_VARIANT.BLOTTER}`
                              }
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintBlotterSlip(item)}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                              title="Print Slip"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </>
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
              setIsEditingEsumbong(false);
            }}
            title={
              activeTab === "esumbong"
                ? `E-Sumbong #${selectedItem.id.substring(0, 8).toUpperCase()}`
                : activeTab === "assistance"
                ? `Assistance #${selectedItem.id.substring(0, 8).toUpperCase()}`
                : `KapChat #${selectedItem.id.substring(0, 8).toUpperCase()}`
            }
            size={activeTab === "esumbong" ? "xl" : "md"}
            dense={activeTab !== "esumbong"}
            headerActions={
              activeTab === "esumbong" ? (
                <>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0">
                    <span className="font-medium hidden sm:inline">Status</span>
                    <select
                      value={selectedItem.status}
                      onChange={(e) =>
                        handleStatusChange(selectedItem.id, e.target.value)
                      }
                      className="pl-2 pr-7 py-1 text-xs sm:text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#03254c]/20 focus:border-[#03254c] cursor-pointer max-w-[7.5rem] sm:max-w-none"
                    >
                      {currentStatusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2 ml-0.5">
                    {canAccessEsumbong && !isEditingEsumbong && (
                      <button
                        type="button"
                        onClick={() => handleStartEditEsumbong(selectedItem)}
                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit E-Sumbong"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {isEditingEsumbong && (
                      <>
                        <button
                          type="button"
                          onClick={handleSaveEsumbong}
                          disabled={isSavingEsumbong}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                          title="Save Changes"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditEsumbong}
                          disabled={isSavingEsumbong}
                          className="px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handlePreviewBlotterSlip(selectedItem)}
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadBlotterPdf(selectedItem)}
                      disabled={
                        blotterPdfDownloadingKey ===
                        `${selectedItem.id}:${BLOTTER_DOC_VARIANT.BLOTTER}`
                      }
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintBlotterSlip(selectedItem)}
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Print"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmItem(selectedItem)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : null
            }
            footer={
              activeTab === "esumbong" &&
              !isEditingEsumbong &&
              !isBlotterVerified(selectedItem) &&
              selectedItem.status !== "dismissed" ? (
                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                  <p className="text-xs text-gray-500 leading-snug">
                    Verify to assign usaping barangay number and hearing date.
                  </p>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectConfirmItem(selectedItem)}
                      disabled={
                        isVerifyingBlotter || updating === selectedItem.id
                      }
                      className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4 text-red-600" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyEsumbong}
                      disabled={
                        isVerifyingBlotter || updating === selectedItem.id
                      }
                      className="px-4 py-2 text-sm font-semibold text-white bg-[#03254c] hover:bg-[#021c38] rounded-lg disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {isVerifyingBlotter ? (
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <BadgeCheck className="w-4 h-4" />
                      )}
                      Verify E-Sumbong
                    </button>
                  </div>
                </div>
              ) : null
            }
          >
            <div className={activeTab === "esumbong" ? "space-y-5" : "space-y-3"}>
              {activeTab !== "esumbong" ? (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide shrink-0">
                      Status
                    </span>
                    <select
                      value={selectedItem.status}
                      onChange={(e) =>
                        handleStatusChange(selectedItem.id, e.target.value)
                      }
                      className="px-2 py-0.5 bg-white border border-gray-300 rounded-md text-[11px] font-bold text-gray-800 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {currentStatusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setDeleteConfirmItem(selectedItem)}
                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-[10px] font-bold transition-all flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              ) : null}

              {activeTab === "esumbong" && (
                <div className="space-y-5">
                  {!isBlotterVerified(selectedItem) &&
                    selectedItem.status !== "dismissed" &&
                    !isEditingEsumbong && (
                      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/90 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <BadgeCheck className="w-4 h-4 text-[#03254c]" />
                          <span className="text-xs font-bold uppercase tracking-wide text-[#03254c]">
                            E-Sumbong Verification
                          </span>
                        </div>
                        <div>
                          <label
                            htmlFor="verify-purpose-input"
                            className="text-xs font-semibold text-gray-800 mb-1 block"
                          >
                            Para sa: <span className="text-red-500">*</span>{" "}
                            <span className="font-normal text-gray-500">
                              (Subject / paksa ng sumbong na ilalagay sa Lupong Tagapamayapa document)
                            </span>
                          </label>
                          <input
                            id="verify-purpose-input"
                            type="text"
                            required
                            placeholder="Halimbawa: Paninirang puri, Alitan sa bakod, Pananakit..."
                            value={purposeDraft}
                            onChange={(e) => setPurposeDraft(e.target.value)}
                            className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03254c]/20 focus:border-[#03254c]"
                          />
                          <p className="text-[11px] text-gray-600 mt-1">
                            Kinakailangan: Ilagay dito ang layunin o paksa bago i-verify. Lalabas ito sa &quot;-para sa-&quot; ng Lupong Tagapamayapa.
                          </p>
                        </div>
                      </div>
                    )}

                  {isBlotterVerified(selectedItem) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-200">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Usaping barangay no.
                        </p>
                        <p className="text-base font-semibold text-gray-900 font-mono tracking-tight">
                          {selectedItem.usaping_barangay_number}
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="petsa-ng-paghaharap"
                          className="text-xs font-medium text-gray-500 mb-1 block"
                        >
                          Petsa ng paghaharap
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            id="petsa-ng-paghaharap"
                            type="date"
                            value={petsaDraft}
                            onChange={(e) => setPetsaDraft(e.target.value)}
                            disabled={isSavingPetsa}
                            className="px-2 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03254c]/20 focus:border-[#03254c] disabled:opacity-50"
                          />
                          <input
                            id="oras-ng-paghaharap"
                            type="time"
                            value={petsaTimeDraft}
                            onChange={(e) => setPetsaTimeDraft(e.target.value)}
                            disabled={isSavingPetsa}
                            className="px-2 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03254c]/20 focus:border-[#03254c] disabled:opacity-50"
                            aria-label="Oras ng paghaharap"
                          />
                          <button
                            type="button"
                            onClick={() => void handleSavePetsaNgPaghaharap()}
                            disabled={
                              isSavingPetsa ||
                              !petsaDraft ||
                              (petsaDraft ===
                                String(selectedItem.petsa_ng_paghaharap || "").slice(
                                  0,
                                  10,
                                ) &&
                                petsaTimeDraft ===
                                  (orasNgPaghaharapInputValue(
                                    selectedItem.oras_ng_paghaharap,
                                  ) || "09:00"))
                            }
                            className="px-2.5 py-1.5 text-xs font-semibold text-[#03254c] bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                          >
                            {isSavingPetsa ? "Saving…" : "Save"}
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-1.5 leading-snug">
                          {formatHearingScheduleDisplay({
                            petsa_ng_paghaharap:
                              petsaDraft || selectedItem.petsa_ng_paghaharap,
                            oras_ng_paghaharap:
                              petsaTimeDraft || selectedItem.oras_ng_paghaharap,
                          })}
                        </p>
                      </div>

                      <div className="sm:col-span-2 pt-3 border-t border-gray-200">
                        <label
                          htmlFor="purpose-field"
                          className="text-xs font-semibold text-gray-700 mb-1 block"
                        >
                          Para sa: <span className="text-red-500">*</span>{" "}
                          <span className="font-normal text-gray-500">
                            (Layunin o paksa ng sumbong para sa Lupong Tagapamayapa)
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="purpose-field"
                            type="text"
                            required
                            placeholder="Halimbawa: Paninirang puri, Alitan sa bakod..."
                            value={purposeDraft}
                            onChange={(e) => setPurposeDraft(e.target.value)}
                            disabled={isSavingPurpose}
                            className="flex-1 px-3 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03254c]/20 focus:border-[#03254c] disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => void handleSavePurpose()}
                            disabled={
                              isSavingPurpose ||
                              !purposeDraft.trim() ||
                              (purposeDraft || "").trim() === (selectedItem.purpose || "").trim()
                            }
                            className="px-3 py-1.5 text-xs font-semibold text-[#03254c] bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 shrink-0"
                          >
                            {isSavingPurpose ? "Saving…" : "Save"}
                          </button>
                        </div>
                      </div>

                      {selectedItem.verified_at && (
                        <p className="sm:col-span-2 text-xs text-gray-500">
                          Verified {formatDate(selectedItem.verified_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {isBlotterVerified(selectedItem) && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Documents
                      </p>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                        {renderEsumbongDocActions(
                          selectedItem,
                          BLOTTER_DOC_VARIANT.BLOTTER,
                          "Tanggapan ng Lupong Tagapamayapa",
                        )}
                        {renderEsumbongDocActions(
                          selectedItem,
                          BLOTTER_DOC_VARIANT.SUMMONS,
                          "Paanyaya sa Paghaharap",
                        )}
                      </div>
                    </div>
                  )}

                  {selectedItem.status === "dismissed" &&
                    !isBlotterVerified(selectedItem) && (
                      <p className="text-sm text-gray-600 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                        This report was{" "}
                        <span className="font-semibold text-red-700">
                          rejected
                        </span>
                        . No usaping barangay number was issued.
                      </p>
                    )}

{isEditingEsumbong ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                        {/* Nagsusumbong Section */}
                        <div className="space-y-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            Nagsusumbong (Complainant)
                          </p>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                              Pangalan <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={esumbongEditDraft.complainant_name}
                              onChange={(e) =>
                                setEsumbongEditDraft((d) => ({
                                  ...d,
                                  complainant_name: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03254c]/20 focus:border-[#03254c] outline-none"
                              placeholder="Pangalan ng nagsusumbong"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                              Contact Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={esumbongEditDraft.contact_number}
                              onChange={(e) =>
                                setEsumbongEditDraft((d) => ({
                                  ...d,
                                  contact_number: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03254c]/20 focus:border-[#03254c] outline-none"
                              placeholder="09XXXXXXXXX"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={esumbongEditDraft.email}
                              onChange={(e) =>
                                setEsumbongEditDraft((d) => ({
                                  ...d,
                                  email: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03254c]/20 focus:border-[#03254c] outline-none"
                              placeholder="Opsyonal: email@example.com"
                            />
                          </div>
                        </div>

                        {/* Inirereklamo Section */}
                        <div className="space-y-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            Inirereklamo (Respondent)
                          </p>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                              Pangalan <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={esumbongEditDraft.respondent_name}
                              onChange={(e) =>
                                setEsumbongEditDraft((d) => ({
                                  ...d,
                                  respondent_name: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03254c]/20 focus:border-[#03254c] outline-none"
                              placeholder="Pangalan ng inirereklamo"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                              Petsa ng Pangyayari <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={esumbongEditDraft.incident_date}
                              onChange={(e) =>
                                setEsumbongEditDraft((d) => ({
                                  ...d,
                                  incident_date: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03254c]/20 focus:border-[#03254c] outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                              Oras ng Pangyayari
                            </label>
                            <input
                              type="time"
                              value={esumbongEditDraft.incident_time}
                              onChange={(e) =>
                                setEsumbongEditDraft((d) => ({
                                  ...d,
                                  incident_time: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03254c]/20 focus:border-[#03254c] outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Para sa (Purpose) */}
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          Para sa: <span className="text-red-500">*</span>{" "}
                          <span className="font-normal text-gray-500">(Subject / Purpose ng sumbong para sa Lupong Tagapamayapa)</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={esumbongEditDraft.purpose || ""}
                          onChange={(e) =>
                            setEsumbongEditDraft((d) => ({
                              ...d,
                              purpose: e.target.value,
                            }))
                          }
                          className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:ring-2 focus:ring-[#03254c]/20 focus:border-[#03254c] outline-none ${
                            !esumbongEditDraft.purpose?.trim()
                              ? "border-amber-300"
                              : "border-gray-300"
                          }`}
                          placeholder="Halimbawa: Paninirang puri, Alitan sa bakod, Pananakit..."
                        />
                      </div>

                      {/* Detalye ng Sumbong Section */}
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                          Detalye ng sumbong <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={6}
                          value={esumbongEditDraft.details}
                          onChange={(e) =>
                            setEsumbongEditDraft((d) => ({
                              ...d,
                              details: e.target.value,
                            }))
                          }
                          className="w-full p-3.5 text-xs sm:text-sm text-gray-800 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#03254c]/20 focus:border-[#03254c] outline-none leading-relaxed"
                          placeholder="Isalaysay ang buong detalye ng sumbong..."
                        />
                      </div>

                      {/* Save / Cancel action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={handleCancelEditEsumbong}
                          disabled={isSavingEsumbong}
                          className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEsumbong}
                          disabled={isSavingEsumbong}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {isSavingEsumbong ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px rounded-lg border border-gray-200 overflow-hidden bg-gray-200 text-[11px] leading-snug">
                        <div className="bg-white px-3 py-2 space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            Nagsusumbong
                          </p>
                          <p className="text-xs font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                            {selectedItem.complainant_name}
                            {selectedItem.intake_source === "walk_in" && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-200">
                                Walk-in intake
                              </span>
                            )}
                          </p>
                          <div className="space-y-0.5 text-[11px] text-gray-600">
                            {selectedItem.contact_number && (
                              <a
                                href={`tel:${selectedItem.contact_number}`}
                                className="flex items-center gap-1.5 hover:text-[#03254c] font-mono"
                              >
                                <Phone className="w-3 h-3 shrink-0 text-gray-400" />
                                {selectedItem.contact_number}
                              </a>
                            )}
                            {selectedItem.email && (
                              <a
                                href={`mailto:${selectedItem.email}`}
                                className="flex items-center gap-1.5 break-all hover:text-[#03254c]"
                              >
                                <Mail className="w-3 h-3 shrink-0 text-gray-400" />
                                {selectedItem.email}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="bg-white px-3 py-2 space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            Inirereklamo
                          </p>
                          <p className="text-xs font-semibold text-gray-900">
                            {selectedItem.respondent_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-600">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3 shrink-0 text-gray-400" />
                              {selectedItem.incident_date || "—"}
                            </span>
                            {selectedItem.incident_time ? (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0 text-gray-400" />
                                {selectedItem.incident_time}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col min-h-0 flex-1">
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Detalye ng sumbong
                        </p>
                        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 sm:p-5 text-sm sm:text-[15px] text-gray-800 leading-relaxed min-h-[14rem] max-h-[min(28rem,50vh)] overflow-y-auto whitespace-pre-wrap [overflow-wrap:anywhere]">
                          {selectedItem.details || "No narrative provided."}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Specific Content for Assistance */}
              {activeTab === "assistance" && (
                <div className="space-y-2.5">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                      <User className="w-3 h-3" /> Resident
                    </p>
                    <p className="text-sm font-bold text-gray-900 leading-snug">
                      {selectedItem.first_name} {selectedItem.last_name}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-gray-600">
                      {selectedItem.phone && (
                        <a href={`tel:${selectedItem.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{selectedItem.phone}</span>
                        </a>
                      )}
                      {selectedItem.email && (
                        <a href={`mailto:${selectedItem.email}`} className="text-blue-600 hover:underline flex items-center gap-1 break-all">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span>{selectedItem.email}</span>
                        </a>
                      )}
                      <span className="text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        {formatDate(selectedItem.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
                      <HeadphonesIcon className="w-3 h-3 text-gray-400" /> Resident message
                    </p>
                    <div className="p-2.5 bg-gray-50 rounded-md text-xs text-gray-800 leading-relaxed max-h-44 overflow-y-auto whitespace-pre-wrap">
                      {selectedItem.message}
                    </div>
                  </div>

                  {selectedItem.staff_response && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Last barangay reply
                        {selectedItem.responded_at && (
                          <span className="font-normal normal-case text-emerald-700/80 ml-1">
                            · {formatDate(selectedItem.responded_at)}
                          </span>
                        )}
                      </p>
                      <div className="p-2.5 bg-white/80 rounded-md text-xs text-gray-800 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {selectedItem.staff_response}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-900 text-white rounded-lg p-3 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                      <Send className="w-3 h-3 text-emerald-400" /> Reply to resident
                    </p>
                    <p className="text-[10px] text-slate-400 leading-snug">
                      Sent by email when an address is on file; use the phone number for SMS if needed.
                    </p>
                    <textarea
                      rows={3}
                      value={assistanceReplyMessage}
                      onChange={(e) => setAssistanceReplyMessage(e.target.value)}
                      placeholder="Type your official reply (requirements, schedule, next steps)…"
                      className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {selectedItem.phone && (
                        <a
                          href={`sms:${selectedItem.phone}?body=${encodeURIComponent(assistanceReplyMessage.trim() || "Message from Barangay Help Desk: ")}`}
                          className="px-2.5 py-1.5 bg-slate-800 border border-slate-600 text-slate-200 rounded-md text-[10px] font-bold hover:bg-slate-700"
                        >
                          Open SMS
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSendAssistanceReply(false)}
                        disabled={
                          isSendingAssistanceReply || !assistanceReplyMessage.trim()
                        }
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-bold transition-all flex items-center gap-1 disabled:opacity-40"
                      >
                        {isSendingAssistanceReply ? (
                          <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        Send reply
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendAssistanceReply(true)}
                        disabled={
                          isSendingAssistanceReply || !assistanceReplyMessage.trim()
                        }
                        className="px-3 py-1.5 bg-white text-slate-900 rounded-md text-[10px] font-bold transition-all disabled:opacity-40"
                      >
                        Send & resolve
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Specific Content for KapChat */}
              {activeTab === "kapchat" && (
                <div className="space-y-2.5">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> Sender
                    </p>
                    <p className="text-sm font-bold text-gray-900 leading-snug">
                      {selectedItem.sender_name || "Anonymous Resident"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600">
                      {selectedItem.contact && (
                        <a href={`tel:${selectedItem.contact}`} className="text-blue-600 hover:underline flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{selectedItem.contact}</span>
                        </a>
                      )}
                      <span className="text-gray-400">{formatDate(selectedItem.created_at)}</span>
                    </div>
                  </div>

                  {/* Message Thread */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                      Message
                    </p>
                    <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-md text-xs text-gray-800 leading-relaxed max-h-36 overflow-y-auto">
                      {selectedItem.message}
                    </div>
                  </div>

                  {/* Official Reply Box */}
                  <div className="bg-slate-900 text-white rounded-lg p-3 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                      <Send className="w-3 h-3 text-blue-400" /> Reply
                    </p>
                    <textarea
                      rows={2}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Official response…"
                      className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-[11px] text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSendKapChatReply}
                        disabled={isSendingReply || !replyMessage.trim()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[10px] font-bold transition-all flex items-center gap-1 disabled:opacity-40"
                      >
                        {isSendingReply ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Send & mark replied</span>
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
            title={
              newEntryType === "esumbong"
                ? "Walk-in E-Sumbong intake"
                : "Log New Help Desk Record"
            }
            size={newEntryType === "esumbong" ? "lg" : "lg"}
            dense={newEntryType === "esumbong"}
            bodyScroll={newEntryType !== "esumbong"}
          >
            <div
              className={
                newEntryType === "esumbong"
                  ? "flex flex-col flex-1 min-h-0 gap-2.5"
                  : "space-y-4"
              }
            >
              {/* Channel Selector */}
              <div className="shrink-0">
                {newEntryType === "esumbong" && (
                  <p className="text-[11px] text-gray-500 leading-snug mb-2">
                    Log a complaint for a walk-in resident. Link census optionally to prefill contact info.
                  </p>
                )}
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Channel
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setNewEntryType(tab.id)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                        newEntryType === tab.id
                          ? "bg-[#03254c] text-white border-[#03254c]"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {newEntryType === "esumbong" ? (
                <div className="flex flex-col flex-1 min-h-0 pt-1 border-t border-gray-100">
                  <ESumbongForm
                    walkInMode
                    variant="modal"
                    isActive={isNewEntryModalOpen}
                    tenantId={staffTenantId || "ibaoeste"}
                    onSuccess={handleWalkInEsumbongSaved}
                    onCancel={() => {
                      setIsNewEntryModalOpen(false);
                      resetNewEntryForm();
                    }}
                  />
                </div>
              ) : (
            <form onSubmit={handleCreateNewEntry} className="space-y-4 pt-2 border-t border-gray-100">
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
              )}
            </div>
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

        {rejectConfirmItem && (
          <ConfirmModal
            isOpen={!!rejectConfirmItem}
            onClose={() => setRejectConfirmItem(null)}
            onConfirm={() => handleRejectEsumbong(rejectConfirmItem)}
            title="Reject E-Sumbong"
            message="Mark this report as rejected (dismissed)? No usaping barangay number will be generated. The complainant may be notified by email if an address is on file."
            confirmText="Reject Sumbong"
            type="danger"
          />
        )}

        <BlotterDocumentPreviewModal
          report={blotterPreviewReport}
          officials={certificateOfficials}
          variant={blotterPreviewVariant}
          onVariantChange={setBlotterPreviewVariant}
          isOpen={!!blotterPreviewReport}
          onClose={() => {
            setBlotterPreviewReport(null);
            setBlotterPreviewVariant(BLOTTER_DOC_VARIANT.BLOTTER);
          }}
          onPrint={handlePrintFromBlotterPreview}
          onDownload={handleDownloadFromBlotterPreview}
          downloading={
            blotterPreviewReport?.id != null &&
            blotterPdfDownloadingKey ===
              `${blotterPreviewReport.id}:${blotterPreviewVariant}`
          }
        />
      </div>
    </Layout>
  );
}
