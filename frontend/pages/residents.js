import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getAuthToken } from "@/lib/auth";
import {
  Search,
  MapPin,
  User,
  Calendar,
  Phone,
  Filter,
  ArrowUpDown,
  Users as UsersIcon,
  Briefcase,
  Heart,
  Mail,
  Home,
  Shield,
  Plus,
  Trash2,
  Edit,
  Save,
  Skull,
  Activity,
  ArrowLeft,
  FileText,
  ChevronDown,
  X,
  CreditCard,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import Layout from "@/components/Layout/Layout";
import { LoadingCard } from "@/components/UI/LoadingSpinner";
import Pagination from "@/components/UI/Pagination";
import Modal from "@/components/UI/Modal";
import BirthPlaceSelect, {
  formatBirthPlaceForStorage,
} from "@/components/UI/BirthPlaceSelect";
import IssueIDModal from "@/components/Modals/IssueIDModal";
import { getUserData } from "@/lib/auth";
import { debounce } from "@/lib/utils";
import { generateFullAddress, PUROK_OPTIONS, PHASE_OPTIONS, isSubdivisionPurok, getSubdivisionInfo, hasPhaseField } from "@/lib/addressHelper";

function formatCivilStatusLabel(code) {
  const c = (code || "").toUpperCase();
  if (c === "M") return "Married (M)";
  if (c === "S") return "Single (S)";
  if (c === "W") return "Widowed (W)";
  return code || "Not recorded";
}

function ProfileSection({ icon: Icon, iconClass = "text-gray-500", title, children, className = "", compact = false }) {
  return (
    <section
      className={`rounded-md border border-gray-200 bg-white overflow-hidden h-full flex flex-col ${className}`}
    >
      <div
        className={`flex items-center gap-1 shrink-0 bg-gray-50 border-b border-gray-100 ${
          compact ? "px-2 py-1" : "px-3 py-1.5"
        }`}
      >
        <Icon className={`shrink-0 stroke-[1.75] ${compact ? "w-3 h-3" : "w-3.5 h-3.5"} ${iconClass}`} />
        <h4 className={`font-semibold text-gray-600 uppercase tracking-wide ${compact ? "text-[9px]" : "text-[10px] font-bold"}`}>
          {title}
        </h4>
      </div>
      <div className={`flex-1 ${compact ? "p-2" : "p-3"}`}>{children}</div>
    </section>
  );
}

function DetailGrid({ items, columns = 2, compact = false }) {
  const colClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";
  return (
    <dl className={`grid ${colClass} ${compact ? "gap-x-3 gap-y-1" : "gap-x-4 gap-y-2"}`}>
      {items.map(({ label, value, fullWidth }) => (
        <div
          key={label}
          className={`min-w-0 ${fullWidth ? "sm:col-span-2 lg:col-span-3" : ""}`}
        >
          <dt className="text-[8px] font-semibold uppercase tracking-wide text-gray-400 mb-px leading-none">
            {label}
          </dt>
          <dd className={`text-gray-900 font-medium leading-snug break-words ${compact ? "text-[11px]" : "text-xs sm:text-sm"}`}>
            {value === null || value === undefined || String(value).trim() === ""
              ? "—"
              : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CensusProfileField({ label, value, compact = false }) {
  const empty =
    value === null || value === undefined || String(value).trim() === "";
  return (
    <div className={`rounded border border-gray-200 bg-white ${compact ? "px-1.5 py-1" : "px-2.5 py-1.5"}`}>
      <p className="text-[8px] font-semibold text-gray-500 uppercase tracking-wide mb-px leading-none">
        {label}
      </p>
      <p
        className={`leading-snug break-words ${compact ? "text-[10px]" : "text-xs"} ${empty ? "text-gray-400 italic font-normal" : "text-gray-900 font-medium"}`}
      >
        {empty ? "Not recorded" : value}
      </p>
    </div>
  );
}

function CensusFlagBadges({ resident }) {
  const flags = [
    { label: "Senior", on: resident.is_senior, className: "bg-amber-100 text-amber-900 border-amber-200" },
    { label: "PWD", on: resident.is_pwd, className: "bg-violet-100 text-violet-900 border-violet-200" },
    { label: "Solo parent", on: resident.is_solo_parent, className: "bg-pink-100 text-pink-900 border-pink-200" },
    { label: "Voter", on: resident.is_registered_voter, className: "bg-sky-100 text-sky-900 border-sky-200" },
    { label: "HH head", on: resident.is_household_head, className: "bg-indigo-100 text-indigo-900 border-indigo-200" },
    { label: "Head of family", on: resident.is_head_of_family, className: "bg-teal-100 text-teal-900 border-teal-200" },
  ].filter((f) => f.on);

  if (flags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mb-1.5">
      {flags.map((f) => (
        <span
          key={f.label}
          className="inline-flex px-1.5 py-px rounded text-[8px] font-semibold uppercase tracking-wide border border-gray-200 bg-gray-50 text-gray-700"
        >
          {f.label}
        </span>
      ))}
    </div>
  );
}

function CensusSubheading({ children, compact = false }) {
  return (
    <p
      className={`font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-100 first:border-0 ${
        compact ? "text-[8px] mt-2 mb-1 first:mt-0 pt-1.5 first:pt-0" : "text-[9px] font-bold text-[#03254c]/70 mt-3 mb-1.5 first:mt-0 pt-2 first:pt-0"
      }`}
    >
      {children}
    </p>
  );
}

function composeHouseNumberForForm(formData) {
  if (!isSubdivisionPurok(formData.purok)) {
    return formData.house_number || "";
  }
  const rawPhase = formData.phase?.trim().toUpperCase() || "";
  const phase = rawPhase
    ? rawPhase.startsWith("PHASE") || ["YAKAL", "PALIKPIK"].includes(rawPhase)
      ? rawPhase
      : `PHASE ${rawPhase}`
    : "";
  const block = formData.block?.trim() || "";
  const lot = formData.lot?.trim() || "";
  return [phase, block && `BLOCK ${block}`, lot && `LOT ${lot}`]
    .filter(Boolean)
    .join(" ");
}

/** Census export columns derived from Core → Residential address (single source of truth). */
function deriveCensusAddressFromForm(formData) {
  const subInfo = getSubdivisionInfo(formData.purok);
  const house_number = composeHouseNumberForForm(formData);

  if (subInfo) {
    return {
      house_number,
      purok_as_in_sheet: subInfo.parentPurok.toUpperCase(),
      subdivision_as_in_sheet: subInfo.subdivision,
      structured_subdivision: subInfo.subdivision,
    };
  }

  return {
    house_number,
    purok_as_in_sheet: (formData.purok || "").trim().toUpperCase(),
    subdivision_as_in_sheet: (formData.subdivision || "").trim().toUpperCase(),
    structured_subdivision: (formData.subdivision || "").trim().toUpperCase(),
  };
}

function getCensusExtraColumns(resident) {
  const extras = resident?.census_extras;
  if (!extras || typeof extras !== "object") return [];
  const cols = extras.columns && typeof extras.columns === "object" ? extras.columns : {};
  const unnamed = extras.unnamed_columns || {};
  const rows = Object.entries(cols).map(([key, val]) => ({
    key,
    value: val === null || val === undefined ? "" : String(val),
  }));
  Object.entries(unnamed).forEach(([key, val]) => {
    if (val !== null && val !== undefined && String(val).trim() !== "") {
      rows.push({ key, value: String(val) });
    }
  });
  return rows;
}

function normalizeCivilStatusForForm(status) {
  const c = String(status || "")
    .trim()
    .toUpperCase();
  if (c === "M" || c.startsWith("MARRIED")) return "MARRIED";
  if (c === "S" || c.startsWith("SINGLE")) return "SINGLE";
  if (c === "W" || c.startsWith("WIDOW")) return "WIDOWED";
  if (c.startsWith("SEPARAT")) return "SEPARATED";
  return c || "SINGLE";
}

function formatDateForInput(val) {
  if (!val) return "";
  return String(val).slice(0, 10);
}

const EMPTY_RESIDENT_FORM = {
  last_name: "",
  first_name: "",
  middle_name: "",
  suffix: "",
  second_name: "",
  age: "",
  gender: "MALE",
  civil_status: "SINGLE",
  date_of_birth: "",
  place_of_birth: "",
  residential_address: "",
  house_number: "",
  purok: "",
  phase: "",
  block: "",
  lot: "",
  barangay: "",
  municipality: "",
  province: "",
  contact_number: "",
  email: "",
  pending_case: false,
  case_record_history: "",
  is_deceased: false,
  date_of_death: "",
  cause_of_death: "",
  covid_related: false,
  census_resident_number: "",
  ec_card_number: "",
  subdivision: "",
  purok_as_in_sheet: "",
  subdivision_as_in_sheet: "",
  residency_type: "",
  household_head_name: "",
  family_number: "",
  relation_to_household_head: "",
  occupation: "",
  monthly_salary: "",
  religion: "",
  volunteer: "",
  census_notes: "",
  is_household_head: false,
  is_head_of_family: false,
  is_senior: false,
  is_pwd: false,
  is_solo_parent: false,
  is_registered_voter: false,
};

const RESIDENT_DB_FIELDS = [
  "last_name",
  "first_name",
  "middle_name",
  "suffix",
  "second_name",
  "age",
  "gender",
  "civil_status",
  "date_of_birth",
  "place_of_birth",
  "residential_address",
  "house_number",
  "purok",
  "subdivision",
  "barangay",
  "municipality",
  "province",
  "contact_number",
  "email",
  "pending_case",
  "case_record_history",
  "is_deceased",
  "date_of_death",
  "cause_of_death",
  "covid_related",
  "census_resident_number",
  "ec_card_number",
  "residency_type",
  "occupation",
  "monthly_salary",
  "relation_to_household_head",
  "religion",
  "household_head_name",
  "family_number",
  "volunteer",
  "census_notes",
  "is_household_head",
  "is_head_of_family",
  "is_senior",
  "is_pwd",
  "is_solo_parent",
  "is_registered_voter",
  "census_extras",
];

function residentToFormState(resident, tenantAddressDefaults) {
  if (!resident) {
    return {
      ...EMPTY_RESIDENT_FORM,
      barangay: tenantAddressDefaults.barangay,
      municipality: tenantAddressDefaults.municipality,
      province: tenantAddressDefaults.province,
    };
  }
  const extras = resident.census_extras || {};
  return {
    ...EMPTY_RESIDENT_FORM,
    last_name: resident.last_name || "",
    first_name: resident.first_name || "",
    middle_name: resident.middle_name || "",
    suffix: resident.suffix || "",
    second_name: resident.second_name || "",
    age: resident.age ?? "",
    gender: (resident.gender || "MALE").toUpperCase(),
    civil_status: normalizeCivilStatusForForm(resident.civil_status),
    date_of_birth: formatDateForInput(resident.date_of_birth),
    place_of_birth: resident.place_of_birth || "",
    residential_address: resident.residential_address || "",
    house_number: resident.house_number || "",
    purok: resident.purok || "",
    contact_number: resident.contact_number || "",
    email: resident.email || "",
    pending_case: Boolean(resident.pending_case),
    case_record_history: resident.case_record_history || "",
    is_deceased: Boolean(resident.is_deceased),
    date_of_death: formatDateForInput(resident.date_of_death),
    cause_of_death: resident.cause_of_death || "",
    covid_related: Boolean(resident.covid_related),
    barangay: resident.barangay || tenantAddressDefaults.barangay,
    municipality: resident.municipality || tenantAddressDefaults.municipality,
    province: resident.province || tenantAddressDefaults.province,
    census_resident_number: resident.census_resident_number || "",
    ec_card_number: resident.ec_card_number || "",
    subdivision: resident.subdivision || "",
    purok_as_in_sheet: extras.purok_as_in_sheet || "",
    subdivision_as_in_sheet:
      extras.subdivision_as_in_sheet || resident.subdivision || "",
    residency_type: resident.residency_type || "",
    household_head_name: resident.household_head_name || "",
    family_number: resident.family_number || "",
    relation_to_household_head: resident.relation_to_household_head || "",
    occupation: resident.occupation || "",
    monthly_salary: resident.monthly_salary || "",
    religion: resident.religion || "",
    volunteer: resident.volunteer || "",
    census_notes: resident.census_notes || "",
    is_household_head: Boolean(resident.is_household_head),
    is_head_of_family: Boolean(resident.is_head_of_family),
    is_senior: Boolean(resident.is_senior),
    is_pwd: Boolean(resident.is_pwd),
    is_solo_parent: Boolean(resident.is_solo_parent),
    is_registered_voter: Boolean(resident.is_registered_voter),
  };
}

export default function Residents() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const API_URL = "/api";

  // Calculate age from birth date
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const [residents, setResidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState(48);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: "",
    civil_status: "",
    purok: "",
    is_deceased: "",
    pending_case: "",
    sort: "newest",
  });
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Tenant-specific address fields
  const [tenantAddressDefaults, setTenantAddressDefaults] = useState({
    barangay: '',
    municipality: '',
    province: 'Province of Bulacan',
  });

  // Tenant-specific purok options
  const [purokOptions, setPurokOptions] = useState(PUROK_OPTIONS);

  // Modal state
  const [selectedResident, setSelectedResident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_RESIDENT_FORM });
  const [censusImportSnapshot, setCensusImportSnapshot] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [showIssueIDModal, setShowIssueIDModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [residentFormTab, setResidentFormTab] = useState("core");
  const [formBaseline, setFormBaseline] = useState("");
  const [discardFormOpen, setDiscardFormOpen] = useState(false);

  const snapshotFormState = (data) => JSON.stringify(data);

  const isResidentFormDirty = () =>
    Boolean(formBaseline) && snapshotFormState(formData) !== formBaseline;

  const closeResidentForm = () => {
    setIsFormModalOpen(false);
    setDiscardFormOpen(false);
    setResidentFormTab("core");
    if (selectedResident) {
      setIsModalOpen(true);
    }
  };

  const requestCloseResidentForm = () => {
    if (isResidentFormDirty()) {
      setDiscardFormOpen(true);
    } else {
      closeResidentForm();
    }
  };

  useEffect(() => {
    const count = Object.entries(filters).filter(([k, v]) => k !== "sort" && v !== "").length;
    setActiveFilterCount(count);
  }, [filters]);

  useEffect(() => {
    setMounted(true);
    const user = getUserData();
    setCurrentUser(user);
  }, [router]);

  // Fetch tenant address defaults when currentUser is available
  useEffect(() => {
    if (currentUser) {
      fetchTenantAddressDefaults();
    }
  }, [currentUser]);

  const fetchTenantAddressDefaults = async () => {
    try {
      const token = getAuthToken();
      const tenantId = currentUser?.tenant_id || "ibaoeste";
      const headers = {
        "x-tenant-id": tenantId,
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/settings`, { headers });
      if (!response.ok) return;
      const data = await response.json();
      
      if (data.success && data.settings) {
        const headerInfo = data.settings.certificate_settings?.headerInfo || data.settings.headerInfo || {};
        setTenantAddressDefaults({
          barangay: headerInfo.barangayName || "BARANGAY IBA O' ESTE",
          municipality: headerInfo.municipality || 'Calumpit',
          province: headerInfo.province || 'Province of Bulacan',
        });

        // Set tenant-specific purok options
        if (currentUser?.tenant_id === 'demo') {
          // Demo tenant: only Purok 1-5
          setPurokOptions([
            { value: 'Purok 1', label: 'Purok 1' },
            { value: 'Purok 2', label: 'Purok 2' },
            { value: 'Purok 3', label: 'Purok 3' },
            { value: 'Purok 4', label: 'Purok 4' },
            { value: 'Purok 5', label: 'Purok 5' },
          ]);
        } else {
          // Other tenants: use default options
          setPurokOptions(PUROK_OPTIONS);
        }
      }
    } catch (error) {
      console.warn('Tenant address defaults fallback:', error.message);
    }
  };

  useEffect(() => {
    if (mounted && currentUser) {
      fetchResidents();
    }
  }, [mounted, currentUser, currentPage, searchTerm, limit, filters]);

  const handleOpenAddModal = () => {
    // Determine purok options based on tenant
    const tenantPurokOptions = currentUser?.tenant_id === 'demo' 
      ? [
          { value: 'Purok 1', label: 'Purok 1' },
          { value: 'Purok 2', label: 'Purok 2' },
          { value: 'Purok 3', label: 'Purok 3' },
          { value: 'Purok 4', label: 'Purok 4' },
          { value: 'Purok 5', label: 'Purok 5' },
        ]
      : PUROK_OPTIONS;
    
    setPurokOptions(tenantPurokOptions);

    const nextForm = {
      ...residentToFormState(null, tenantAddressDefaults),
      phase: "",
      block: "",
      lot: "",
    };
    setFormData(nextForm);
    setFormBaseline(snapshotFormState(nextForm));
    setCensusImportSnapshot([]);
    setSelectedResident(null);
    setResidentFormTab("core");
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = () => {
    const addr = selectedResident.residential_address || "";
    let detectedPurokValue = selectedResident.purok || "";

    if (/HAZEL\s*HEIGHTS/i.test(addr) || /HAZEL\s*HEIGHTS/i.test(selectedResident.purok)) {
      detectedPurokValue = "HAZEL HEIGHTS";
    } else if (/CREEKSTONE/i.test(addr) || /CREEKSTONE/i.test(selectedResident.purok)) {
      detectedPurokValue = "CREEKSTONE";
    } else if (/NORTH\s*VILLE\s*9|NORTHVILLE\s*9|NV9/i.test(addr) || /NORTH\s*VILLE\s*9|NORTHVILLE\s*9|NV9/i.test(selectedResident.purok)) {
      detectedPurokValue = "NORTH VILLE 9";
    } else if (/BANAWE|BANAUE/i.test(addr) || /BANAWE|BANAUE/i.test(selectedResident.purok)) {
      detectedPurokValue = "SITIO BANAWE";
    }

    const isSubdivision = isSubdivisionPurok(detectedPurokValue);
    let phase = "";
    let block = "";
    let lot = "";
    if (isSubdivision) {
      const fullHouseText = `${selectedResident.house_number || ""} ${addr}`;
      const pMatch = fullHouseText.match(/PHASE\s*(\d+|1|2|YAKAL|PALIKPIK)|YAKAL|PALIKPIK/i);
      const bMatch = fullHouseText.match(/BLOCK\s*(\d+)/i);
      const lMatch = fullHouseText.match(/LOT\s*(\d+)/i);
      if (pMatch) {
        const val = pMatch[0].trim().toUpperCase();
        if (val.includes('1') || val === '1') phase = 'PHASE 1';
        else if (val.includes('2') || val === '2') phase = 'PHASE 2';
        else if (val.includes('YAKAL')) phase = 'YAKAL';
        else if (val.includes('PALIKPIK')) phase = 'PALIKPIK';
        else phase = val;
      }
      if (bMatch) block = bMatch[1];
      if (lMatch) lot = lMatch[1];
    }

    const nextForm = {
      ...residentToFormState(selectedResident, tenantAddressDefaults),
      purok: detectedPurokValue || selectedResident.purok || "",
      phase,
      block,
      lot,
    };
    setFormData(nextForm);
    setFormBaseline(snapshotFormState(nextForm));
    setCensusImportSnapshot(getCensusExtraColumns(selectedResident));
    setResidentFormTab("core");
    setIsModalOpen(false);
    setIsFormModalOpen(true);
  };

  const handleSaveResident = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Clean up data for database compatibility
      const cleanedData = { ...formData };
      const censusAddress = deriveCensusAddressFromForm(cleanedData);
      const subInfo = getSubdivisionInfo(cleanedData.purok);

      cleanedData.house_number = censusAddress.house_number;

      if (subInfo) {
        cleanedData.purok = subInfo.parentPurok;
        cleanedData.subdivision = subInfo.subdivision;
      } else if (!cleanedData.subdivision) {
        cleanedData.subdivision = censusAddress.structured_subdivision || null;
      }

      // Generate full address with subdivision/sitio & parent purok
      const effectiveBarangay = cleanedData.barangay || tenantAddressDefaults.barangay;
      const effectiveMunicipality = cleanedData.municipality || tenantAddressDefaults.municipality;
      const effectiveProvince = cleanedData.province || tenantAddressDefaults.province;
      cleanedData.residential_address = generateFullAddress({
        house_number: cleanedData.house_number,
        purok: subInfo ? subInfo.parentPurok : cleanedData.purok,
        subdivision: subInfo ? subInfo.subdivision : null,
        barangay: effectiveBarangay,
        municipality: effectiveMunicipality,
        province: effectiveProvince,
      });

      // Remove helper fields not stored in DB
      delete cleanedData.phase;
      delete cleanedData.block;
      delete cleanedData.lot;
      delete cleanedData.guardian_name;
      delete cleanedData.guardian_relationship;

      const prevExtras =
        selectedResident?.census_extras &&
        typeof selectedResident.census_extras === "object"
          ? selectedResident.census_extras
          : {};
      cleanedData.census_extras = {
        ...prevExtras,
        columns: prevExtras.columns || {},
        unnamed_columns: prevExtras.unnamed_columns || {},
        purok_as_in_sheet: censusAddress.purok_as_in_sheet || null,
        subdivision_as_in_sheet:
          censusAddress.subdivision_as_in_sheet || null,
      };
      delete cleanedData.purok_as_in_sheet;
      delete cleanedData.subdivision_as_in_sheet;

      // Backfill the stored structured fields too so the saved record is complete
      cleanedData.barangay = effectiveBarangay;
      cleanedData.municipality = effectiveMunicipality;
      cleanedData.province = effectiveProvince;

      const payload = {};
      RESIDENT_DB_FIELDS.forEach((key) => {
        if (cleanedData[key] !== undefined) {
          payload[key] = cleanedData[key];
        }
      });

      if (payload.place_of_birth) {
        payload.place_of_birth = formatBirthPlaceForStorage(
          payload.place_of_birth,
        );
      }

      // Convert empty date strings to null to avoid timestamp syntax errors
      if (payload.date_of_birth === "") payload.date_of_birth = null;
      if (payload.date_of_death === "") payload.date_of_death = null;

      // Ensure numeric fields are correctly typed
      if (payload.age === "" || payload.age === null) {
        payload.age = null;
      } else {
        payload.age = parseInt(payload.age, 10);
      }

      const method = selectedResident ? "PUT" : "POST";
      const url = selectedResident
        ? `${API_URL}/residents/${selectedResident.id}`
        : `${API_URL}/residents`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          selectedResident ? "Resident updated!" : "Resident added!",
        );
        if (data.resident && selectedResident) {
          setSelectedResident(data.resident);
        }
        setFormBaseline(snapshotFormState(formData));
        closeResidentForm();
        fetchResidents();
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResident = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${API_URL}/residents/${selectedResident.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Resident deleted");
        setIsDeleteConfirmOpen(false);
        setIsModalOpen(false);
        fetchResidents();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-lg h-8 w-8 border-4 border-[#03254c] border-t-transparent"></div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  const fetchResidents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        name: searchTerm || "",
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (filters.gender) params.set("gender", filters.gender);
      if (filters.civil_status) params.set("civil_status", filters.civil_status);
      if (filters.purok) params.set("purok", filters.purok);
      if (filters.is_deceased) params.set("is_deceased", filters.is_deceased);
      if (filters.pending_case) params.set("pending_case", filters.pending_case);
      if (filters.sort) params.set("sort", filters.sort);

      const token = getAuthToken();
      const tenantId = currentUser?.tenant_id || "ibaoeste";
      const headers = {
        "x-tenant-id": tenantId,
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_URL}/residents/search?${params.toString()}`,
        { headers },
      );

      if (!response.ok) {
        console.warn("Resident search returned status:", response.status);
        setResidents([]);
        setTotalItems(0);
        setTotalPages(1);
        return;
      }

      const data = await response.json();

      if (data && data.success) {
        setResidents(data.residents || []);
        setTotalItems(data.totalItems || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setResidents([]);
        if (data && data.message) {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.error("Error fetching residents:", error);
      toast.error("Error connecting to resident records: " + error.message);
      setResidents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCensus = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Preparing census master list...");
    try {
      const token = getAuthToken();
      const tenantId = currentUser?.tenant_id || "ibaoeste";
      const headers = { "x-tenant-id": tenantId };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/residents/export-census`, { headers });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Export failed");
      }

      const sheet = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, data.sheet || "MASTER LIST");
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `CENSUS 2026 MASTER LIST ${dateStr}.xlsx`);
      toast.success(`Exported ${data.total.toLocaleString()} residents`, { id: toastId });
    } catch (error) {
      toast.error(error.message || "Failed to export census", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSearch = debounce((value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, 300);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ gender: "", civil_status: "", purok: "", is_deceased: "", pending_case: "", sort: "newest" });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-2.5 text-[13px]">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 w-full max-w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search residents..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:border-[#03254c] focus:ring-1 focus:ring-[#03254c]/10 outline-none transition-all text-xs text-gray-900 placeholder:text-gray-400"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 sm:flex-initial justify-center px-2.5 py-1.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors border ${showFilters || activeFilterCount > 0 ? "bg-[#03254c] text-white border-[#03254c]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
          >
            <Filter className="w-3.5 h-3.5 shrink-0" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-[#03254c] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${showFilters ? "rotate-180" : ""}`} />
          </button>
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 rounded-md border border-gray-200 shrink-0">
            <UsersIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-[11px] font-bold text-gray-700 tabular-nums">{totalItems?.toLocaleString() || 0}</span>
          </div>
          <button
            type="button"
            onClick={handleExportCensus}
            disabled={isExporting}
            className="flex-1 sm:flex-initial justify-center px-2.5 py-1.5 bg-white text-[#03254c] border border-[#03254c] rounded-md text-[11px] font-semibold hover:bg-blue-50 transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            {isExporting ? "Exporting..." : "Export"}
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-initial justify-center px-2.5 py-1.5 bg-[#03254c] text-white rounded-md text-[11px] font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            Register
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
            <p className="text-xs font-bold text-gray-700">Advanced Filters</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange("gender", e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs focus:bg-white focus:border-[#03254c] focus:ring-1 focus:ring-[#03254c]/10 outline-none transition-all"
              >
                <option value="">All genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Civil Status</label>
              <select
                value={filters.civil_status}
                onChange={(e) => handleFilterChange("civil_status", e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs focus:bg-white focus:border-[#03254c] focus:ring-1 focus:ring-[#03254c]/10 outline-none transition-all"
              >
                <option value="">All statuses</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="WIDOWED">Widowed</option>
                <option value="SEPARATED">Separated</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Purok</label>
              <select
                value={filters.purok}
                onChange={(e) => handleFilterChange("purok", e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs focus:bg-white focus:border-[#03254c] focus:ring-1 focus:ring-[#03254c]/10 outline-none transition-all"
              >
                <option value="">All puroks</option>
                {purokOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Vital Status</label>
              <select
                value={filters.is_deceased}
                onChange={(e) => handleFilterChange("is_deceased", e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs focus:bg-white focus:border-[#03254c] focus:ring-1 focus:ring-[#03254c]/10 outline-none transition-all"
              >
                <option value="">All residents</option>
                <option value="false">Active only</option>
                <option value="true">Deceased only</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Legal Status</label>
              <select
                value={filters.pending_case}
                onChange={(e) => handleFilterChange("pending_case", e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs focus:bg-white focus:border-[#03254c] focus:ring-1 focus:ring-[#03254c]/10 outline-none transition-all"
              >
                <option value="">All records</option>
                <option value="false">No pending case</option>
                <option value="true">With pending case</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Sort By</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs focus:bg-white focus:border-[#03254c] focus:ring-1 focus:ring-[#03254c]/10 outline-none transition-all"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.gender && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#03254c]/10 text-[#03254c] rounded-full text-[10px] font-semibold">
              {filters.gender === "MALE" ? "Male" : "Female"}
              <button onClick={() => handleFilterChange("gender", "")}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.civil_status && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#03254c]/10 text-[#03254c] rounded-full text-[10px] font-semibold capitalize">
              {filters.civil_status.toLowerCase()}
              <button onClick={() => handleFilterChange("civil_status", "")}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.purok && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#03254c]/10 text-[#03254c] rounded-full text-[10px] font-semibold">
              {filters.purok}
              <button onClick={() => handleFilterChange("purok", "")}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.is_deceased && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#03254c]/10 text-[#03254c] rounded-full text-[10px] font-semibold">
              {filters.is_deceased === "true" ? "Deceased" : "Active"}
              <button onClick={() => handleFilterChange("is_deceased", "")}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.pending_case && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#03254c]/10 text-[#03254c] rounded-full text-[10px] font-semibold">
              {filters.pending_case === "true" ? "With case" : "No case"}
              <button onClick={() => handleFilterChange("pending_case", "")}><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Residents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="animate-pulse bg-white border border-gray-100 rounded-lg h-24" />
          ))}
        </div>
      ) : residents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <UsersIcon className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-bold text-gray-700">No residents found</h3>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
          {residents.map((resident) => (
            <div
              key={resident.id}
              onClick={() => {
                setSelectedResident(resident);
                setIsModalOpen(true);
              }}
              className="bg-white rounded-lg border border-gray-200 hover:border-[#03254c]/30 hover:shadow-sm transition-all cursor-pointer flex flex-col"
            >
              <div className="p-2.5 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <div className="h-7 w-7 bg-[#03254c]/10 rounded-md flex items-center justify-center text-[#03254c] text-xs font-bold shrink-0">
                    {resident.last_name?.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    <span className={`inline-flex items-center px-1.5 py-px rounded text-[9px] font-bold uppercase leading-tight ${resident.is_deceased ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                      {resident.is_deceased ? (
                        <><Skull className="w-2.5 h-2.5 mr-0.5" /> Dec</>
                      ) : (
                        <><Activity className="w-2.5 h-2.5 mr-0.5" /> Act</>
                      )}
                    </span>
                    {resident.pending_case && (
                      <span className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-bold uppercase bg-rose-600 text-white">
                        <Shield className="w-2.5 h-2.5 mr-0.5" /> Case
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-tight truncate leading-snug mb-0.5">
                  {resident.last_name}, {resident.first_name}{" "}
                  {resident.middle_name ? resident.middle_name.charAt(0) + "." : ""}
                </h3>
                <p className="text-[10px] text-gray-500 mb-1.5 truncate">
                  {resident.gender || "—"} • {resident.age ?? "—"} y/o • {resident.civil_status || "S"}
                </p>

                <div className="space-y-1 pt-1.5 border-t border-gray-100">
                  <div className="flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-gray-400 mt-px shrink-0" />
                    <p className="text-[10px] text-gray-600 line-clamp-2 leading-snug">{resident.residential_address}</p>
                  </div>
                  {resident.contact_number && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                      <p className="text-[10px] text-gray-600 truncate">{resident.contact_number}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Resident Profile"
        size="profile"
        dense
      >
        {selectedResident && (() => {
          const displayAddress =
            selectedResident.residential_address ||
            generateFullAddress({
              house_number: selectedResident.house_number,
              purok: selectedResident.purok,
              subdivision: selectedResident.subdivision,
              barangay:
                selectedResident.barangay || tenantAddressDefaults.barangay,
              municipality:
                selectedResident.municipality ||
                tenantAddressDefaults.municipality,
              province:
                selectedResident.province || tenantAddressDefaults.province,
            }) ||
            "—";

          const householdLinkLabel = selectedResident.household_head_id
            ? "Linked as family member"
            : selectedResident.is_household_head
              ? "Household head"
              : "Not linked";

          return (
          <div className="space-y-2 text-[13px]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-md border border-gray-200 bg-gray-50/80 px-2 py-1.5">
              <div className="flex gap-2 min-w-0 flex-1">
              <div className="h-8 w-8 rounded-md bg-[#03254c] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {selectedResident.last_name?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xs font-bold text-gray-900 leading-tight sm:whitespace-normal">
                  {selectedResident.last_name}, {selectedResident.first_name}{" "}
                  {selectedResident.middle_name} {selectedResident.suffix}
                </h2>
                <p className="text-[10px] text-gray-600 leading-snug mt-0.5">
                  {selectedResident.gender || "—"} · {selectedResident.age ?? "—"} y/o ·{" "}
                  {formatCivilStatusLabel(selectedResident.civil_status)} · DOB{" "}
                  {selectedResident.date_of_birth || "—"}
                  {selectedResident.place_of_birth ? (
                    <> · Born {selectedResident.place_of_birth}</>
                  ) : null}
                </p>
              </div>
              </div>
                <div className="flex flex-wrap items-center gap-1 sm:justify-end sm:shrink-0 sm:max-w-[40%]">
                  {selectedResident.is_deceased ? (
                    <span className="inline-flex items-center gap-0.5 px-1 py-px rounded border border-gray-300 bg-white text-[8px] font-semibold uppercase text-gray-700">
                      <Skull className="w-2.5 h-2.5" /> Deceased
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-1 py-px rounded border border-gray-300 bg-white text-[8px] font-semibold uppercase text-gray-700">
                      <Activity className="w-2.5 h-2.5" /> Active
                    </span>
                  )}
                  {selectedResident.census_resident_number && (
                    <span className="text-[8px] font-semibold text-gray-600 bg-white border border-gray-200 px-1 py-px rounded">
                      SR {String(selectedResident.census_resident_number).replace(/^#?\s*/i, "")}
                    </span>
                  )}
                  {selectedResident.ec_card_number && (
                    <span className="text-[8px] font-semibold text-gray-800 bg-white border border-gray-200 px-1 py-px rounded font-mono">
                      {selectedResident.ec_card_number}
                    </span>
                  )}
                  <span
                    className={`text-[8px] font-semibold uppercase px-1 py-px rounded border ${
                      selectedResident.pending_case
                        ? "border-gray-400 bg-gray-800 text-white"
                        : "border-gray-200 bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedResident.pending_case ? "Case hold" : "Cleared"}
                  </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-stretch">
              <ProfileSection compact icon={MapPin} title="Location" className="lg:col-span-7">
                <DetailGrid
                  compact
                  columns={2}
                  items={[
                    {
                      label: "Residential address",
                      value: displayAddress,
                      fullWidth: true,
                    },
                    {
                      label: "House / block & lot",
                      value: selectedResident.house_number,
                    },
                    { label: "Purok", value: selectedResident.purok },
                    {
                      label: "Subdivision",
                      value: selectedResident.subdivision,
                    },
                  ]}
                />
              </ProfileSection>

              <ProfileSection compact icon={Phone} title="Contact" className="lg:col-span-5">
                <DetailGrid
                  compact
                  columns={2}
                  items={[
                    { label: "Phone", value: selectedResident.contact_number },
                    { label: "Email", value: selectedResident.email },
                    {
                      label: "Case / clearance notes",
                      value:
                        selectedResident.case_record_history ||
                        "No previous legal history or pending cases reported.",
                      fullWidth: true,
                    },
                  ]}
                />
              </ProfileSection>
            </div>

            <ProfileSection compact icon={FileText} title="Census 2026 — Master List">
              <CensusFlagBadges resident={selectedResident} />

              <CensusSubheading compact>Registration & address</CensusSubheading>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
                <CensusProfileField compact label="Resident number" value={selectedResident.census_resident_number} />
                <CensusProfileField compact label="EC card number" value={selectedResident.ec_card_number} />
                <CensusProfileField compact label="Purok (Excel)" value={selectedResident.census_extras?.purok_as_in_sheet} />
                <CensusProfileField compact label="Subdivision (Excel)" value={selectedResident.census_extras?.subdivision_as_in_sheet} />
                <CensusProfileField compact label="Kind of residency" value={selectedResident.residency_type} />
                <CensusProfileField compact label="Household link" value={householdLinkLabel} />
            </div>

              <CensusSubheading compact>Household & family</CensusSubheading>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
                <CensusProfileField compact label="Household head name" value={selectedResident.household_head_name} />
                <CensusProfileField compact label="Family number" value={selectedResident.family_number} />
                <CensusProfileField compact label="Relation to head" value={selectedResident.relation_to_household_head} />
              </div>

              <CensusSubheading compact>Employment & other</CensusSubheading>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
                <CensusProfileField compact label="Occupation / student" value={selectedResident.occupation} />
                <CensusProfileField compact label="Monthly salary (HH head)" value={selectedResident.monthly_salary} />
                <CensusProfileField compact label="Religion" value={selectedResident.religion} />
                <CensusProfileField compact label="Volunteer" value={selectedResident.volunteer} />
                <CensusProfileField compact label="Census notes" value={selectedResident.census_notes} />
              </div>

              {getCensusExtraColumns(selectedResident).length > 0 && (
                <details className="mt-2 rounded border border-gray-200 bg-white group">
                  <summary className="cursor-pointer px-2 py-1.5 text-[9px] font-semibold text-gray-700 uppercase tracking-wide list-none flex items-center justify-between gap-2 hover:bg-gray-50 rounded-md">
                    <span className="flex items-center gap-1.5">
                      <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                      All Excel columns (import snapshot)
                    </span>
                    <span className="text-[9px] font-normal text-gray-400 normal-case">
                      {getCensusExtraColumns(selectedResident).length} fields
                    </span>
                  </summary>
                  <div className="border-t border-gray-100 max-h-40 overflow-y-auto">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 font-semibold text-gray-500 uppercase w-[40%]">
                            Column
                          </th>
                          <th className="px-2 py-1 font-semibold text-gray-500 uppercase">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCensusExtraColumns(selectedResident).map((row) => (
                          <tr
                            key={row.key}
                            className="border-t border-gray-100 even:bg-gray-50/40"
                          >
                            <td className="px-2 py-1 font-medium text-gray-600 align-top">
                              {row.key}
                            </td>
                            <td className="px-2 py-1 text-gray-900 break-words">
                              {row.value || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </ProfileSection>

            <div className="pt-1.5 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-1.5 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="px-2 py-1.5 text-gray-600 font-semibold text-[10px] uppercase tracking-wide hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
              <div className="flex flex-wrap items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setShowIssueIDModal(true);
                  }}
                  className="px-2 py-1.5 bg-[#03254c] hover:bg-[#021b37] text-white rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1"
                >
                  <CreditCard className="w-3 h-3" />
                  Issue ID
                </button>
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="px-2 py-1.5 bg-gray-800 text-white rounded-md text-[10px] font-semibold hover:bg-gray-900 transition-colors flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded-md text-[10px] font-semibold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          );
        })()}
      </Modal>

      {/* Issue ID Modal for this resident */}
      <IssueIDModal
        isOpen={showIssueIDModal}
        onClose={() => setShowIssueIDModal(false)}
        preselectedResident={selectedResident}
        onSuccess={() => {
          toast.success("Barangay ID successfully generated!");
        }}
      />

      <Modal
        isOpen={isFormModalOpen}
        onClose={requestCloseResidentForm}
        title={
          selectedResident ? "Update Resident Record" : "Register New Resident"
        }
        size="xl"
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={requestCloseResidentForm}
              className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="resident-record-form"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#03254c] text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {selectedResident ? "Save changes" : "Register"}
            </button>
          </div>
        }
      >
        <form
          id="resident-record-form"
          onSubmit={handleSaveResident}
          className="space-y-3"
        >
          {selectedResident && (
            <div className="rounded-lg border border-gray-200 bg-gray-50/90 px-3 py-2">
              <p className="text-sm font-bold text-gray-900 leading-tight truncate">
                {selectedResident.last_name}, {selectedResident.first_name}{" "}
                {selectedResident.middle_name} {selectedResident.suffix}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[9px] font-semibold">
                {selectedResident.census_resident_number && (
                  <span className="px-1.5 py-px rounded bg-white border border-gray-200 text-gray-700">
                    SR{" "}
                    {String(selectedResident.census_resident_number).replace(
                      /^#?\s*/i,
                      "",
                    )}
                  </span>
                )}
                <span className="text-gray-600">
                  {selectedResident.gender || "—"} · {selectedResident.age ?? "—"}{" "}
                  y/o · {formatCivilStatusLabel(selectedResident.civil_status)}
                </span>
                {selectedResident.is_deceased && (
                  <span className="px-1.5 py-px rounded bg-rose-100 text-rose-800 uppercase">
                    Deceased
                  </span>
                )}
                {selectedResident.pending_case && (
                  <span className="px-1.5 py-px rounded bg-amber-100 text-amber-900 uppercase">
                    With case
                  </span>
                )}
              </div>
            </div>
          )}

          <div
            className="flex gap-1 p-1 bg-gray-100 rounded-lg"
            role="tablist"
            aria-label="Resident form sections"
          >
            {[
              { id: "core", label: "Core" },
              { id: "census", label: "Census 2026" },
              { id: "status", label: "Legal & status" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={residentFormTab === tab.id}
                onClick={() => setResidentFormTab(tab.id)}
                className={`flex-1 px-2 py-1.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-colors ${
                  residentFormTab === tab.id
                    ? "bg-white text-[#03254c] shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isResidentFormDirty() && (
            <p className="text-[9px] font-medium text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2 py-1">
              Unsaved changes — save or cancel to leave.
            </p>
          )}

          {residentFormTab === "core" && (
          <div className="space-y-4">
          {/* Identity */}
          <div className="p-4 border border-gray-100 rounded-xl space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-2">
              <User className="w-3.5 h-3.5 text-blue-500" />
              Identity
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  required
                  className="input uppercase font-bold"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Middle Name</label>
                <input
                  type="text"
                  className="input uppercase font-bold"
                  value={formData.middle_name}
                  onChange={(e) =>
                    setFormData({ ...formData, middle_name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  required
                  className="input uppercase font-bold"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Suffix</label>
                <select
                  className="input uppercase font-bold"
                  value={formData.suffix || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, suffix: e.target.value })
                  }
                >
                  <option value="">—</option>
                  <option value="JR.">JR.</option>
                  <option value="SR.">SR.</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                  {formData.suffix &&
                    !["", "JR.", "SR.", "II", "III", "IV"].includes(
                      formData.suffix,
                    ) && (
                      <option value={formData.suffix}>
                        {formData.suffix} (saved)
                      </option>
                    )}
                </select>
              </div>
              <div className="sm:col-span-2 md:col-span-4">
                <label className="label">Second name / alias (census)</label>
                <input
                  type="text"
                  className="input uppercase"
                  value={formData.second_name}
                  onChange={(e) =>
                    setFormData({ ...formData, second_name: e.target.value })
                  }
                  placeholder="If recorded on master list"
                />
              </div>
            </div>
          </div>

          {/* Personal & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-100 rounded-xl space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-2">
                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                Personal
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Birth Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.date_of_birth}
                    onChange={(e) => {
                      const birthDate = e.target.value;
                      setFormData({
                        ...formData,
                        date_of_birth: birthDate,
                        age: birthDate ? calculateAge(birthDate) : '',
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="label">
                    Age <span className="text-gray-400 text-[9px]">(auto)</span>
                  </label>
                  <input
                    type="number"
                    readOnly
                    className="input bg-gray-100 cursor-not-allowed"
                    value={formData.age}
                    placeholder="Auto"
                  />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select
                    className="input font-bold"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  >
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </select>
                </div>
                <div>
                  <label className="label">Civil Status</label>
                  <select
                    className="input font-bold"
                    value={formData.civil_status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        civil_status: e.target.value,
                      })
                    }
                  >
                    <option value="SINGLE">SINGLE</option>
                    <option value="MARRIED">MARRIED</option>
                    <option value="WIDOWED">WIDOWED</option>
                    <option value="SEPARATED">SEPARATED</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Birth place</label>
                  <BirthPlaceSelect
                    value={formData.place_of_birth}
                    onChange={(place_of_birth) =>
                      setFormData({ ...formData, place_of_birth })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-100 rounded-xl space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-2">
                <Phone className="w-3.5 h-3.5 text-orange-500" />
                Contact
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Contact No.</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.contact_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact_number: e.target.value,
                        })
                      }
                    placeholder="09XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      className="input lowercase font-bold"
                      value={formData.email || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
            </div>
          </div>

          {/* Address */}
          <div className="p-4 border border-gray-100 rounded-xl space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-2">
              <Home className="w-3.5 h-3.5 text-purple-500" />
              Residential Address
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Purok <span className="text-red-500">*</span></label>
                <select
                  required
                  className="input uppercase font-bold"
                  value={formData.purok}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      purok: e.target.value,
                      house_number: "",
                      phase: "",
                      block: "",
                      lot: "",
                    })
                  }
                >
                  <option value="">-- Select --</option>
                  {purokOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {isSubdivisionPurok(formData.purok) ? (
                hasPhaseField(formData.purok) ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="label">Phase <span className="text-red-500">*</span></label>
                      <select
                        required
                        className="input uppercase font-bold"
                        value={formData.phase}
                        onChange={(e) =>
                          setFormData({ ...formData, phase: e.target.value })
                        }
                      >
                        <option value="">-- Select --</option>
                        {PHASE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Block <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="1"
                        className="input uppercase font-bold text-center"
                        value={formData.block}
                        onChange={(e) =>
                          setFormData({ ...formData, block: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="label">Lot <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="2"
                        className="input uppercase font-bold text-center"
                        value={formData.lot}
                        onChange={(e) =>
                          setFormData({ ...formData, lot: e.target.value })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Block <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="1"
                        className="input uppercase font-bold text-center"
                        value={formData.block}
                        onChange={(e) =>
                          setFormData({ ...formData, block: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="label">Lot <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="2"
                        className="input uppercase font-bold text-center"
                        value={formData.lot}
                        onChange={(e) =>
                          setFormData({ ...formData, lot: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )
              ) : formData.purok ? (
                <div>
                  <label className="label">House Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 2706, 123-A"
                    className="input uppercase font-bold"
                    value={formData.house_number}
                    onChange={(e) =>
                      setFormData({ ...formData, house_number: e.target.value })
                    }
                  />
                </div>
              ) : (
                <div>
                  <label className="label">House Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    disabled
                    placeholder="Select a purok first"
                    className="input uppercase font-bold bg-gray-100 cursor-not-allowed"
                    value=""
                  />
                </div>
              )}

              <div>
                <label className="label">Barangay <span className="text-gray-400 text-[9px]">(auto)</span></label>
                <input
                  type="text"
                  readOnly
                  className="input uppercase font-bold bg-gray-100 cursor-not-allowed"
                  value={formData.barangay}
                />
              </div>
              <div>
                <label className="label">Municipality <span className="text-gray-400 text-[9px]">(auto)</span></label>
                <input
                  type="text"
                  readOnly
                  className="input uppercase font-bold bg-gray-100 cursor-not-allowed"
                  value={formData.municipality}
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Province <span className="text-gray-400 text-[9px]">(auto)</span></label>
                <input
                  type="text"
                  readOnly
                  className="input uppercase font-bold bg-gray-100 cursor-not-allowed"
                  value={formData.province}
                />
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Full Address Preview
              </p>
              <p className="text-sm font-semibold text-gray-800 uppercase">
                {generateFullAddress({
                  ...formData,
                  house_number: composeHouseNumberForForm(formData),
                  purok: getSubdivisionInfo(formData.purok)?.parentPurok || formData.purok,
                  subdivision: getSubdivisionInfo(formData.purok)?.subdivision || null,
                }) || 'Enter house number and purok to see preview'}
              </p>
            </div>
            <p className="text-[9px] text-gray-500 leading-snug">
              Single address for IDs, certificates, and census export (PUROK /
              SUBDIVISION columns sync when you save).
            </p>
          </div>
          </div>
          )}

          {residentFormTab === "census" && (
          <div className="p-4 border border-blue-100 rounded-xl space-y-3 bg-slate-50/40">
            <p className="text-[10px] font-bold text-[#03254c] uppercase tracking-wider flex items-center gap-2 border-b border-blue-100/80 pb-2">
              <FileText className="w-3.5 h-3.5" />
              Census 2026 — Master List
            </p>
            <p className="text-[9px] text-gray-600 leading-snug">
              Match the official export sheet. Change only to fix import errors or
              update master census data.
            </p>

            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
              Registration &amp; IDs
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="label">Resident number</label>
                <input
                  type="text"
                  className="input font-mono text-xs"
                  value={formData.census_resident_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      census_resident_number: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="label">EC card number</label>
                <input
                  type="text"
                  className="input font-mono text-xs uppercase"
                  value={formData.ec_card_number}
                  onChange={(e) =>
                    setFormData({ ...formData, ec_card_number: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Kind of residency</label>
                <input
                  type="text"
                  className="input text-xs"
                  value={formData.residency_type}
                  onChange={(e) =>
                    setFormData({ ...formData, residency_type: e.target.value })
                  }
                  placeholder="Own house, rented, etc."
                />
              </div>
            </div>

            <div className="rounded-lg border border-blue-200/80 bg-white p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[9px] font-bold text-[#03254c] uppercase tracking-wide">
                  Address on census export (from Core tab)
                </p>
                <button
                  type="button"
                  onClick={() => setResidentFormTab("core")}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  Edit address
                </button>
              </div>
              {(() => {
                const censusAddr = deriveCensusAddressFromForm(formData);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <CensusProfileField
                      label="House / block–lot"
                      value={censusAddr.house_number}
                    />
                    <CensusProfileField
                      label="Purok (export column)"
                      value={censusAddr.purok_as_in_sheet}
                    />
                    <CensusProfileField
                      label="Subdivision (export column)"
                      value={censusAddr.subdivision_as_in_sheet}
                    />
                  </div>
                );
              })()}
              <p className="text-[9px] text-gray-500 leading-snug">
                Edit location only under{" "}
                <button
                  type="button"
                  className="font-semibold text-[#03254c] underline"
                  onClick={() => setResidentFormTab("core")}
                >
                  Core → Residential address
                </button>
                . Values here update automatically when you save.
              </p>
            </div>

            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider pt-1">
              Household &amp; family
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { key: "is_household_head", label: "HH head" },
                { key: "is_head_of_family", label: "Head of family" },
                { key: "is_senior", label: "Senior" },
                { key: "is_pwd", label: "PWD" },
                { key: "is_solo_parent", label: "Solo parent" },
                { key: "is_registered_voter", label: "Voter" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-gray-200 bg-white cursor-pointer hover:border-blue-200"
                >
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[#03254c]"
                    checked={Boolean(formData[key])}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.checked })
                    }
                  />
                  <span className="text-[10px] font-bold uppercase text-gray-600">
                    {label}
                  </span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="label">Household head name</label>
                <input
                  type="text"
                  className="input uppercase text-xs"
                  value={formData.household_head_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      household_head_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="label">Family number</label>
                <input
                  type="text"
                  className="input font-mono text-xs"
                  value={formData.family_number}
                  onChange={(e) =>
                    setFormData({ ...formData, family_number: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Relation to household head</label>
                <input
                  type="text"
                  className="input uppercase text-xs"
                  value={formData.relation_to_household_head}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      relation_to_household_head: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider pt-1">
              Employment &amp; other
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="label">Occupation / student (grade)</label>
                <input
                  type="text"
                  className="input text-xs"
                  value={formData.occupation}
                  onChange={(e) =>
                    setFormData({ ...formData, occupation: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Monthly salary (HH head)</label>
                <input
                  type="text"
                  className="input text-xs"
                  value={formData.monthly_salary}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_salary: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Religion</label>
                <input
                  type="text"
                  className="input uppercase text-xs"
                  value={formData.religion}
                  onChange={(e) =>
                    setFormData({ ...formData, religion: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Volunteer</label>
                <input
                  type="text"
                  className="input text-xs"
                  value={formData.volunteer}
                  onChange={(e) =>
                    setFormData({ ...formData, volunteer: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="label">Census notes</label>
                <textarea
                  className="input min-h-[52px] resize-y text-xs"
                  value={formData.census_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, census_notes: e.target.value })
                  }
                />
              </div>
            </div>

            {censusImportSnapshot.length > 0 && (
              <details className="rounded-md border border-gray-200 bg-white group">
                <summary className="cursor-pointer px-3 py-2 text-[10px] font-bold text-[#03254c] uppercase tracking-wide list-none flex items-center justify-between gap-2 hover:bg-gray-50">
                  <span className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                    All Excel columns (import snapshot)
                  </span>
                  <span className="text-[10px] font-normal text-gray-400 normal-case">
                    {censusImportSnapshot.length} fields — read-only
                  </span>
                </summary>
                <div className="border-t border-gray-100 max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-1.5 font-bold text-gray-500 uppercase w-[38%]">
                          Column
                        </th>
                        <th className="px-3 py-1.5 font-bold text-gray-500 uppercase">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {censusImportSnapshot.map((row) => (
                        <tr
                          key={row.key}
                          className="border-t border-gray-100 even:bg-gray-50/40"
                        >
                          <td className="px-3 py-1.5 font-medium text-gray-600 align-top">
                            {row.key}
                          </td>
                          <td className="px-3 py-1.5 text-gray-900 break-words">
                            {row.value || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
          )}

          {residentFormTab === "status" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 border rounded-xl space-y-3 ${formData.pending_case ? "bg-rose-50 border-rose-200" : "border-gray-100"}`}>
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  Legal status
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.pending_case}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pending_case: e.target.checked,
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600" />
                  <span className="ml-2.5 text-xs font-bold text-rose-700 uppercase">
                    With case
                  </span>
                </label>
              </div>
              {formData.pending_case ? (
                <textarea
                  className="input min-h-[80px] resize-y uppercase text-xs"
                  placeholder="Enter case records..."
                  value={formData.case_record_history}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      case_record_history: e.target.value,
                    })
                  }
                />
              ) : (
                <p className="text-[10px] text-gray-500">
                  Enable &quot;With case&quot; to add or edit case records.
                </p>
              )}
            </div>

            <div className={`p-4 border rounded-xl space-y-3 ${formData.is_deceased ? "bg-rose-50 border-rose-200" : "border-gray-100"}`}>
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Skull className="w-3.5 h-3.5 text-gray-400" />
                  Deceased
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.is_deceased}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_deceased: e.target.checked,
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600" />
                  <span className="ml-2.5 text-xs font-bold uppercase text-gray-700">
                    Deceased
                  </span>
                </label>
              </div>
              {formData.is_deceased ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Date of death</label>
                      <input
                        type="date"
                        className="input"
                        value={formData.date_of_death}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            date_of_death: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                          checked={formData.covid_related}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              covid_related: e.target.checked,
                            })
                          }
                        />
                        <span className="text-[10px] font-bold text-gray-600 uppercase">
                          COVID-19
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="label">Cause of death</label>
                    <input
                      type="text"
                      className="input uppercase"
                      placeholder="Enter cause of death..."
                      value={formData.cause_of_death}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cause_of_death: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-gray-500">
                  Mark deceased only when updating vital status for this resident.
                </p>
              )}
            </div>
          </div>
          )}

          <div className="sticky bottom-0 z-10 mt-4 pt-3 pb-1 -mx-4 sm:-mx-6 px-4 sm:px-6 bg-white border-t border-gray-200 shadow-[0_-8px_16px_rgba(255,255,255,0.95)] flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={requestCloseResidentForm}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#03254c] text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {selectedResident ? "Save changes" : "Register"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={discardFormOpen}
        onClose={() => setDiscardFormOpen(false)}
        title="Discard changes?"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          You have unsaved edits. Close without saving?
        </p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
            onClick={() => setDiscardFormOpen(false)}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
          >
            Keep editing
            </button>
            <button
            type="button"
            onClick={closeResidentForm}
            className="px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700"
          >
            Discard
            </button>
          </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Resident"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-xl flex gap-3 items-start">
            <Trash2 className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-900">
                Are you absolutely sure?
              </p>
              <p className="text-xs text-red-700 mt-1">
                This will permanently delete{" "}
                <strong>
                  {selectedResident?.first_name} {selectedResident?.last_name}
                </strong>{" "}
                from the database. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
            >
              No, Keep Resident
            </button>
            <button
              onClick={handleDeleteResident}
              disabled={isSubmitting}
              className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-100"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : null}
              Yes, Delete Forever
            </button>
          </div>
        </div>
      </Modal>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-3 border-t border-gray-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
}

Residents.getLayout = (page) => (
  <Layout
    title="Residents"
    subtitle="Resident Records & Census"
    mainClassName="p-2 sm:p-4 pb-24 lg:pb-4"
  >
    {page}
  </Layout>
);
