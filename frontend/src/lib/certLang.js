/**
 * certLang.js — Bilingual strings for the barangay certificate request flow.
 *
 * The resident picks a language on the first screen of every request modal,
 * so all downstream copy (steps, labels, errors, confirmation) renders in
 * either English ("en") or Tagalog ("tl").
 */

export const LANGUAGES = [
  { code: "en", label: "English", native: "English", hint: "Continue in English" },
  { code: "tl", label: "Tagalog", native: "Tagalog", hint: "Magpatuloy sa Tagalog" },
];

const STRINGS = {
  en: {
    // Language gate
    langTitle: "Choose your language",
    langSubtitle: "Select the language you are most comfortable with.",
    langNote: "You can close and reopen this form to change your language.",

    // Header
    officialForm: "Official Request Form",

    // Step labels
    stepIdentity: "Your Identity",
    stepContact: "Contact Details",
    stepPurpose: "Purpose",
    stepExtra: "Additional Info",
    stepOwner: "Owner Info",
    stepBusiness: "Business Details",
    stepPermit: "Permit Type",

    // Step 1 — directory
    identityHeading: "Find your record in the resident directory",
    identityHelp: "Your details will be filled in automatically once you select your name.",
    searchDirectory: "Search Resident Directory",
    searchDirectorySub: "Look up your name in the barangay records",
    ownerHeading: "Who owns this business?",
    ownerHelp: "The owner's details will be filled in automatically.",
    searchOwner: "Search Resident Directory",
    searchOwnerSub: "Look up the business owner",
    errNoRecord: "Please select your record from the directory before continuing.",
    errNoOwner: "Please select the business owner from the directory before continuing.",
    verifiedApplicant: "Verified Applicant",
    verifiedOwner: "Verified Business Owner",
    recordNo: "Record No.",
    address: "Address",
    notRecorded: "Not recorded",

    // Step 2 — contact
    contactHeading: "How can we reach you?",
    contactHelp: "We will use this to notify you when your document is ready.",
    mobileLabel: "Mobile Number",
    mobileHelp: "Used for SMS updates about your request.",
    errMobile: "Please enter your mobile number.",
    emailLabel: "Email Address",
    optional: "(optional)",

    // Step 3 — purpose
    purposeHeading: "What will this document be used for?",
    purposeHelp: "Pick from the common reasons below or type your own.",
    purposeLabel: "Purpose",
    purposePlaceholder: "e.g. Employment requirement, loan application, school admission...",
    errPurpose: "Please state the purpose of your request.",
    quickAdd: "Quick add a common purpose",
    catWork: "Work & Government",
    catUtility: "Utilities & Branch",
    catMedical: "Medical",
    select: "Select...",
    noMatches: "No matches found",

    // Business permit
    businessHeading: "Tell us about the business",
    businessHelp: "Enter the details of the business.",
    businessNameLabel: "Business Name",
    businessNamePlaceholder: "e.g. Santos Sari-Sari Store",
    errBusinessName: "Please enter the business name.",
    natureLabel: "Nature of Business",
    naturePlaceholder: "Select type of business...",
    errNature: "Please select the nature of business.",
    businessAddressLabel: "Business Address",
    businessAddressPlaceholder: "House no., street, purok / sitio",
    errBusinessAddress: "Please enter the business address.",
    permitHeading: "Is this a new permit or a renewal?",
    permitHelp: "Choose the type that applies to your business.",
    permitLabel: "Permit Type",
    permitNew: "New Permit",
    permitNewSub: "First-time application",
    permitRenewal: "Renewal",
    permitRenewalSub: "Renewing an existing permit",
    applicationDate: "Application Date",
    inspectionTitle: "Inspection required",
    inspectionBody:
      "After submission, a physical inspection will be scheduled. Please prepare your business premises for the inspection committee.",

    // Review
    reviewEyebrow: "Final Step",
    reviewTitle: "Review Your Application",
    reviewHelp: "Please check that everything below is correct before submitting.",
    consentPrefix: "I agree to the",
    consentLink: "Data Privacy Consent",
    consentSuffix: "under R.A. 10173.",
    privacyTitle: "Data Privacy Consent",
    privacyP1: "By proceeding with this submission, I voluntarily agree to the collection and processing of my personal data by this Barangay for the purpose of certificate request processing and public service delivery.",
    privacyP2: "I understand that the information processed includes my personal details, contact information, and related data, and that such data will be treated with strict confidentiality and used only for legitimate barangay administrative purposes in accordance with the",
    privacyP3: "I further understand that my personal data will not be shared with third parties without my consent, unless required by law or authorized by applicable regulations.",
    privacyAct: "Data Privacy Act of 2012 (R.A. 10173)",

    // Pickup method
    pickupHeading: "How would you like to receive your certificate?",
    pickupHelp: "Choose your preferred delivery method below.",
    pickupPickup: "Pickup at Barangay Hall",
    pickupPickupSub: "Claim your certificate in person at the barangay office.",
    pickupOnline: "Online Delivery (Email)",
    pickupOnlineSub: "Receive a digital copy of your certificate via email.",
    pickupPrintAtHome: "Print at home",
    pickupPrintAtHomeSub: "Download and print your certificate at home.",
    pickupEmailRequired: "Email address is required for online delivery.",

    // Buttons
    back: "Back",
    backToEdit: "Back to Edit",
    continue: "Continue",
    reviewSubmit: "Review & Submit",
    submitRequest: "Submit Request",
    submitting: "Submitting...",
    close: "Close",
    done: "Done",
    requiredFields: "Required fields",

    // Success
    successTitle: "Request Submitted",
    successBody: "Your request has been received and is now being processed.",
    referenceNumber: "Reference Number",
    saveReference: "Save this number to track your request.",

    // Directory modal
    dirTitle: "Resident Directory",
    dirSubtitle: "Official barangay records",
    dirPlaceholder: "Type a name to search...",
    dirEmptyTitle: "Search the directory",
    dirEmptyBody: "Enter at least 3 characters of a name to begin.",
    dirNoneTitle: "No matching record",
    dirNoneBody: "We could not find a record for that name.",
    dirErrTitle: "Search unavailable",
    dirErrBody: "We cannot reach the records service right now.",
    dirManual: "Continue with Manual Entry",
    dirManualNote: "Use only if the resident is not yet registered.",
    dirSelect: "Select",
    dirVerified: "Verified record",
    dirVisitTitle: "In-Person Visit Required",
    dirVisitBody:
      "Please visit the barangay office in person to process this request. Due to data privacy rules and the sensitive nature of certain records, we cannot process it through the online portal.",
    dirVisitAt: "Visit us at",
    dirOfficeHours: "Office Hours: Monday to Friday, 8:00 AM - 5:00 PM",
    dirUnderstand: "I Understand",

    // Guardianship
    guardianHeading: "Guardian (Legitimate Resident)",
    guardianHelp: "The guardian must be a registered resident of this barangay.",
    guardianSearch: "Search Resident Guardian",
    guardianSearchSub: "Click to search for the guardian in resident records",
    guardianRelationship: "Relationship to Minor",
    guardianSelectRel: "SELECT RELATIONSHIP...",
    guardianVerified: "Verified Resident",
    guardianAge: "Age",
    guardianSex: "Sex",
    guardianAddress: "Address",
    guardianRecordNo: "Record No.",

    // Medico-Legal
    medicoDateOfExam: "Date of Examination",
    medicoUsapingNo: "Usaping Barangay No.",
    medicoUsapingPlaceholder: "CASE NUMBER",
    medicoDateOfHearing: "Date of Hearing",

    // Natural Death
    deathDateOfDeath: "Date of Death",
    deathCauseOfDeath: "Cause of Death",
    deathCausePlaceholder: "NATURAL CAUSE...",
    deathRequesterName: "Name of Requester (if different from applicant)",
    deathRequesterPlaceholder: "FULL NAME OF REQUESTER",

    // Same Person
    samePersonHeading: "Second Name / Other Name Used",
    samePersonHelp: "Please provide the alternative name that belongs to the same person",
    samePersonFirst: "First Name",
    samePersonMiddle: "Middle Name",
    samePersonLast: "Last Name",
    samePersonSuffix: "Suffix",
  },

  tl: {
    // Language gate
    langTitle: "Pumili ng iyong wika",
    langSubtitle: "Piliin ang wikang mas komportable sa iyo.",
    langNote: "Maaari mong isara at buksan muli ang form upang palitan ang wika.",

    // Header
    officialForm: "Opisyal na Porma ng Kahilingan",

    // Step labels
    stepIdentity: "Pagkakakilanlan",
    stepContact: "Detalye ng Kontak",
    stepPurpose: "Layunin",
    stepExtra: "Karagdagang Detalye",
    stepOwner: "May-ari",
    stepBusiness: "Detalye ng Negosyo",
    stepPermit: "Uri ng Permit",

    // Step 1 — directory
    identityHeading: "Hanapin ang iyong rekord sa direktoryo",
    identityHelp: "Awtomatikong mapupunan ang iyong mga detalye kapag napili mo ang pangalan mo.",
    searchDirectory: "Hanapin sa Direktoryo",
    searchDirectorySub: "Hanapin ang pangalan mo sa talaan ng barangay",
    ownerHeading: "Sino ang may-ari ng negosyo?",
    ownerHelp: "Awtomatikong mapupunan ang mga detalye ng may-ari.",
    searchOwner: "Hanapin sa Direktoryo",
    searchOwnerSub: "Hanapin ang may-ari ng negosyo",
    errNoRecord: "Mangyaring piliin ang iyong rekord sa direktoryo bago magpatuloy.",
    errNoOwner: "Mangyaring piliin ang may-ari ng negosyo sa direktoryo bago magpatuloy.",
    verifiedApplicant: "Beripikadong Aplikante",
    verifiedOwner: "Beripikadong May-ari",
    recordNo: "Bilang ng Rekord",
    address: "Tirahan",
    notRecorded: "Walang tala",

    // Step 2 — contact
    contactHeading: "Paano ka namin makokontak?",
    contactHelp: "Gagamitin namin ito upang ipaalam sa iyo kapag handa na ang dokumento.",
    mobileLabel: "Numero ng Cellphone",
    mobileHelp: "Gagamitin para sa SMS tungkol sa iyong kahilingan.",
    errMobile: "Mangyaring ilagay ang numero ng iyong cellphone.",
    emailLabel: "Email",
    optional: "(opsyonal)",

    // Step 3 — purpose
    purposeHeading: "Para saan gagamitin ang dokumentong ito?",
    purposeHelp: "Pumili sa mga karaniwang dahilan sa ibaba o mag-type ng sarili mo.",
    purposeLabel: "Layunin",
    purposePlaceholder: "hal. Kailangan sa trabaho, aplikasyon sa utang, pasok sa eskwela...",
    errPurpose: "Mangyaring sabihin ang layunin ng iyong kahilingan.",
    quickAdd: "Mabilisang pagpili ng karaniwang layunin",
    catWork: "Trabaho at Gobyerno",
    catUtility: "Utility at Sangay",
    catMedical: "Medikal",
    select: "Pumili...",
    noMatches: "Walang natagpuan",

    // Business permit
    businessHeading: "Ikwento ang tungkol sa negosyo",
    businessHelp: "Ilagay ang mga detalye ng negosyo.",
    businessNameLabel: "Pangalan ng Negosyo",
    businessNamePlaceholder: "hal. Santos Sari-Sari Store",
    errBusinessName: "Mangyaring ilagay ang pangalan ng negosyo.",
    natureLabel: "Uri ng Negosyo",
    naturePlaceholder: "Pumili ng uri ng negosyo...",
    errNature: "Mangyaring pumili ng uri ng negosyo.",
    businessAddressLabel: "Lokasyon ng Negosyo",
    businessAddressPlaceholder: "Numero ng bahay, kalye, purok / sitio",
    errBusinessAddress: "Mangyaring ilagay ang lokasyon ng negosyo.",
    permitHeading: "Bago ba o renewal ang permit?",
    permitHelp: "Piliin ang naaayon sa iyong negosyo.",
    permitLabel: "Uri ng Permit",
    permitNew: "Bagong Permit",
    permitNewSub: "Unang beses mag-apply",
    permitRenewal: "Renewal",
    permitRenewalSub: "Pag-renew ng kasalukuyang permit",
    applicationDate: "Petsa ng Aplikasyon",
    inspectionTitle: "Kailangan ng inspeksyon",
    inspectionBody:
      "Pagkatapos mag-submit, isasaayos ang pisikal na inspeksyon. Mangyaring ihanda ang lugar ng negosyo para sa komite ng inspeksyon.",

    // Review
    reviewEyebrow: "Huling Hakbang",
    reviewTitle: "Suriin ang Iyong Aplikasyon",
    reviewHelp: "Tiyaking tama ang lahat ng nasa ibaba bago i-submit.",
    consentPrefix: "Sumasang-ayon ako sa",
    consentLink: "Data Privacy Consent",
    consentSuffix: "sa ilalim ng R.A. 10173.",
    privacyTitle: "Pahintulot sa Data Privacy",
    privacyP1: "Sa pagpapatuloy sa paghahandog na ito, kusang-loob akong sumasang-ayon sa pangongolekta at pagpoproseso ng aking personal na datos ng Barangay na ito para sa layunin ng pagpoproseso ng kahilingan ng sertipiko at pagbibigay ng pampublikong serbisyo.",
    privacyP2: "Nauunawaan ko na ang impormasyong pinoproseso ay kinabibilang ng aking personal na detalye, impormasyon ng kontak, at kaugnay na datos, at ang nasabing datos ay tratuhin ng mahigpit na pagiging-kumpidensiyal at gagamitin lamang para sa lehitimong administratibong layunin ng barangay alinsunod sa",
    privacyP3: "Nauunawaan ko rin na ang aking personal na datos ay hindi ibabahagi sa ikatlong partido nang walang aking pahintulot, maliban kung kinakailangan ng batas o awtorisado ng naaangkop na regulasyon.",
    privacyAct: "Data Privacy Act of 2012 (R.A. 10173)",

    // Pickup method
    pickupHeading: "Paano mo nais matanggap ang iyong sertipiko?",
    pickupHelp: "Piliin ang iyong gustong paraan ng pagkuha sa ibaba.",
    pickupPickup: "Kuhanin sa Barangay Hall",
    pickupPickupSub: "Kunin ang iyong sertipiko nang personal sa tanggapan ng barangay.",
    pickupOnline: "Online Delivery (Email)",
    pickupOnlineSub: "Tumanggap ng digital na kopya ng sertipiko sa iyong email.",
    pickupPrintAtHome: "Mag-print sa bahay",
    pickupPrintAtHomeSub: "I-download at i-print ang iyong sertipiko sa bahay.",
    pickupEmailRequired: "Kinakailangan ang email address para sa online delivery.",

    // Buttons
    back: "Bumalik",
    backToEdit: "Bumalik at Baguhin",
    continue: "Magpatuloy",
    reviewSubmit: "Suriin at I-submit",
    submitRequest: "I-submit ang Kahilingan",
    submitting: "Isinusumite...",
    close: "Isara",
    done: "Tapos",
    requiredFields: "Kailangang punan",

    // Success
    successTitle: "Naisumite ang Kahilingan",
    successBody: "Natanggap na ang iyong kahilingan at kasalukuyang pinoproseso.",
    referenceNumber: "Reference Number",
    saveReference: "Itago ang numerong ito upang masubaybayan ang kahilingan.",

    // Directory modal
    dirTitle: "Direktoryo ng Residente",
    dirSubtitle: "Opisyal na talaan ng barangay",
    dirPlaceholder: "Mag-type ng pangalan...",
    dirEmptyTitle: "Maghanap sa direktoryo",
    dirEmptyBody: "Maglagay ng hindi bababa sa 3 letra ng pangalan upang magsimula.",
    dirNoneTitle: "Walang tugmang rekord",
    dirNoneBody: "Wala kaming natagpuang rekord para sa pangalang iyon.",
    dirErrTitle: "Hindi available ang paghahanap",
    dirErrBody: "Hindi namin maabot ang talaan sa ngayon.",
    dirManual: "Magpatuloy sa Manual na Paglagay",
    dirManualNote: "Gamitin lamang kung hindi pa nakarehistro ang residente.",
    dirSelect: "Piliin",
    dirVerified: "Beripikadong rekord",
    dirVisitTitle: "Kailangang Pumunta sa Opisina",
    dirVisitBody:
      "Mangyaring pumunta sa tanggapan ng barangay upang maproseso ang kahilingang ito. Dahil sa mga patakaran sa data privacy at sa sensitibong kalikasan ng ilang rekord, hindi namin ito maaaring iproseso online.",
    dirVisitAt: "Bisitahin kami sa",
    dirOfficeHours: "Oras ng Tanggapan: Lunes hanggang Biyernes, 8:00 AM - 5:00 PM",
    dirUnderstand: "Nauunawaan Ko",

    // Guardianship
    guardianHeading: "Tagapangalaga (Lehitimong Residente)",
    guardianHelp: "Dapat nakarehistrong residente ng barangay na ito ang tagapangalaga.",
    guardianSearch: "Maghanap ng Residenteng Tagapangalaga",
    guardianSearchSub: "I-click upang maghanap ng tagapangalaga sa mga rekord ng residente",
    guardianRelationship: "Relasyon sa Menor",
    guardianSelectRel: "PUMILI NG RELASYON...",
    guardianVerified: "Beripikadong Residente",
    guardianAge: "Edad",
    guardianSex: "Kasarian",
    guardianAddress: "Tirahan",
    guardianRecordNo: "Bilang ng Rekord",

    // Medico-Legal
    medicoDateOfExam: "Petsa ng Pagsusuri",
    medicoUsapingNo: "Usaping Barangay No.",
    medicoUsapingPlaceholder: "NUMERO NG KASO",
    medicoDateOfHearing: "Petsa ng Pagdinig",

    // Natural Death
    deathDateOfDeath: "Petsa ng Kamatayan",
    deathCauseOfDeath: "Sanhi ng Kamatayan",
    deathCausePlaceholder: "LIKAS NA SANHI...",
    deathRequesterName: "Pangalan ng Humihiling (kung iba sa aplikante)",
    deathRequesterPlaceholder: "BUONG PANGALAN NG HUMIHINGI",

    // Same Person
    samePersonHeading: "Ikalawang Pangalan / Ibang Pangalang Ginamit",
    samePersonHelp: "Mangyaring ilagay ang alternatibong pangalan ng parehong tao",
    samePersonFirst: "Pangalan",
    samePersonMiddle: "Gitnang Pangalan",
    samePersonLast: "Apelyido",
    samePersonSuffix: "Sufiks",
  },
};

/**
 * Returns a translator for the given language code.
 * Falls back to English for any missing key.
 */
export function getStrings(lang) {
  const base = STRINGS.en;
  const active = STRINGS[lang] || base;
  return { ...base, ...active };
}

export default STRINGS;
