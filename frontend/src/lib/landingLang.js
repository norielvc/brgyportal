/** Marketing / landing copy — Tagalog-first */
export const DEFAULT_LANDING_LANG = "tl";

const STRINGS = {
  tl: {
    brandSubtitle: "Pamamahala ng Barangay",
    navFeatures: "Mga Feature",
    navHow: "Paano Gumagana",
    navCerts: "Mga Sertipiko",
    navDemo: "Demo",
    navPricing: "Presyo",
    navFaq: "FAQ",
    login: "Mag-login",
    visitDemo: "Bisitahin ang Demo",
    seePricing: "Tingnan ang Presyo",
    heroBadge: "Ginawa para sa mga Barangay sa Pilipinas",
    heroTitle1: "Kumpletong digital",
    heroTitle2: "system para sa inyong",
    heroTitleAccent: "barangay.",
    heroDesc:
      "Nagbibigay ang BrgyDesk ng public website, online na kahilingan ng sertipiko, multi-step na approval, opisyal na resibo, at buong admin dashboard — sa isang platform.",
    heroCtaPricing: "Tingnan ang mga Plan at Presyo",
    heroCtaDemo: "Subukan ang Live Demo",
    footerRights: "Lahat ng karapatan ay nakalaan.",
    getStarted: "Magsimula Na",
  },
  en: {
    brandSubtitle: "Barangay Management",
    navFeatures: "Features",
    navHow: "How It Works",
    navCerts: "Certificates",
    navDemo: "Demo",
    navPricing: "Pricing",
    navFaq: "FAQ",
    login: "Log in",
    visitDemo: "Visit Demo",
    seePricing: "See Pricing",
    heroBadge: "Built for Philippine Barangays",
    heroTitle1: "The complete digital",
    heroTitle2: "system for your",
    heroTitleAccent: "barangay.",
    heroDesc:
      "BrgyDesk gives your barangay a public website, online certificate requests, multi-step approval workflows, official receipts, and a full admin dashboard — all in one platform.",
    heroCtaPricing: "View Plans & Pricing",
    heroCtaDemo: "Try Live Demo",
    footerRights: "All rights reserved.",
    getStarted: "Get Started Now",
  },
};

const CERTS_TL = [
  "Barangay Clearance",
  "Sertipiko ng Indigency",
  "Sertipiko ng Residency",
  "Business Permit",
  "Sertipiko ng Natural Death",
  "Kahilingang Medico-Legal",
  "Sertipiko ng Guardianship",
  "Sertipiko ng Co-habitation",
  "Sertipiko ng Parehong Tao",
  "Pagsasara ng Negosyo",
  "Tulong Pang-edukasyon",
];

const FEATURE_TEXTS_TL = [
  { title: "10+ Uri ng Sertipiko", desc: "Lahat ng karaniwang dokumento ng barangay — clearance, indigency, residency, business permit, at iba pa — online na naproseso." },
  { title: "Nako-configure na Workflow", desc: "May sariling proseso ang bawat barangay. Magdagdag, mag-alis, o mag-ayos ng approval steps bawat uri ng sertipiko." },
  { title: "Email at SMS na Abiso", desc: "Aabisuhan ang residente at staff sa bawat hakbang — email at SMS. Bawas ang follow-up na tawag." },
  { title: "SMS Alerts", desc: "Magpadala ng SMS update sa cellphone ng residente kapag naaprubahan, handa nang kunin, o kailangan ng aksyon." },
  { title: "Opisyal na Resibo", desc: "Auto-generate ng PDF na opisyal na resibo na may QR code. Pwede i-download at i-verify." },
  { title: "Ulat ng Pisikal na Inspeksyon", desc: "Built-in na inspection report para sa business permit at iba pang dokumentong kailangan ng field verification." },
  { title: "Digital Signature sa Pickup", desc: "Kunan ang digital signature sa release. Subaybayan ang dokumento mula pagsusumite hanggang pagkuha." },
  { title: "Resident Database Lookup", desc: "Hanapin at i-verify agad ang residente habang pinoproseso ang dokumento." },
  { title: "QR Code Scanner", desc: "May unique QR ang bawat resident ID. Sa relief ops, i-scan lang — naka-log ang claim at naka-block ang duplicate." },
  { title: "Analytics Dashboard", desc: "Subaybayan ang kahilingan, performance ng staff, at oras ng proseso. I-export sa Excel o CSV." },
  { title: "Public na Website ng Barangay", desc: "Buong public portal na may balita, opisyal, pasilidad, programa, at contact info." },
  { title: "Direktoryo ng Opisyal", desc: "Ipakita ang lahat ng opisyal na posisyon na may larawan, deskripsyon, at visibility controls." },
  { title: "Sumusunod sa Data Privacy", desc: "Sumusunod sa RA 10173. Naka-encrypt, araw-araw na backup, multi-tenant isolated." },
  { title: "Cloud-Based", desc: "Naka-host sa cloud. Walang server na aalagaan. Access mula sa anumang device — ligtas at naka-backup ang data." },
  { title: "PDF na Sertipiko", desc: "Auto-generate ang sertipiko bilang propesyonal na PDF — handa nang i-print o i-download pagkatapos maaprubahan." },
  { title: "Security Alert Center", desc: "Abisuhan agad ang admin kung may pending case o restricted ang nag-request — pigilan ang hindi awtorisadong sertipiko." },
];

export function getLandingStrings(lang = DEFAULT_LANDING_LANG) {
  return { ...STRINGS.en, ...(STRINGS[lang] || STRINGS.tl) };
}

export function getLandingCerts(lang = DEFAULT_LANDING_LANG) {
  if (lang === "en") {
    return [
      "Barangay Clearance",
      "Certificate of Indigency",
      "Barangay Residency",
      "Business Permit",
      "Natural Death Certificate",
      "Medico-Legal Request",
      "Guardianship Certificate",
      "Co-habitation Certificate",
      "Certification of Same Person",
      "Business Closure",
      "Educational Assistance",
    ];
  }
  return CERTS_TL;
}

export function getLandingFeatureTexts(lang = DEFAULT_LANDING_LANG) {
  if (lang === "en") return null;
  return FEATURE_TEXTS_TL;
}
