import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Shield, FileText, Users, CheckCircle, ArrowRight, Menu, X,
  Zap, Star, Crown, ChevronDown, ChevronUp, Building2, QrCode,
  BarChart3, Bell, Fingerprint, Receipt, ClipboardCheck, Search,
  Globe, Lock, Layers, Award, Phone, Mail, MapPin, MessageSquare, ChevronRight
} from 'lucide-react';

const GOLD = '#C9A84C';
const GOLD_DARK = '#A07830';
const GOLD_LIGHT = '#E8C96A';


const CERTS = [
  'Barangay Clearance', 'Certificate of Indigency', 'Barangay Residency',
  'Business Permit', 'Natural Death Certificate', 'Medico-Legal Request',
  'Guardianship Certificate', 'Co-habitation Certificate',
  'Certification of Same Person', 'Business Closure', 'Educational Assistance'
];

const FEATURES = [
  { icon: FileText, title: '10+ Certificate Types', desc: 'All standard barangay documents — clearance, indigency, residency, business permits, and more — processed online.' },
  { icon: Layers, title: 'Configurable Workflows', desc: 'Every barangay has its own process. Add, remove, or reorder approval steps per certificate type — tailored to how your barangay actually works.' },
  { icon: Bell, title: 'Email & SMS Notifications', desc: 'Residents and staff get notified at every step — via email and SMS. No more follow-up calls or missed updates.' },
  { icon: MessageSquare, title: 'SMS Alerts', desc: 'Send SMS updates directly to residents\' mobile numbers when their request is approved, ready for pickup, or needs action. Works even without internet.' },
  { icon: Receipt, title: 'Official Receipt Generation', desc: 'Auto-generate PDF official receipts with QR codes. Downloadable and verifiable.' },
  { icon: ClipboardCheck, title: 'Physical Inspection Reports', desc: 'Built-in inspection report module for business permits and other field-verified documents.' },
  { icon: Fingerprint, title: 'Digital Signatures & Pickup', desc: 'Capture digital signatures on release. Track every document from submission to pickup.' },
  { icon: Search, title: 'Resident Database Lookup', desc: 'Search and verify residents instantly during document processing. No manual cross-referencing.' },
  { icon: QrCode, title: 'QR Code Scanner', desc: 'Every resident ID has a unique QR code. During relief operations, staff simply scans the ID — the system logs the claim and blocks duplicates automatically.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track requests, staff performance, and processing times. Export data to Excel or CSV.' },
  { icon: Globe, title: 'Public Barangay Website', desc: 'A full public portal with news, officials directory, facilities, programs, and contact info.' },
  { icon: Users, title: 'Officials Directory', desc: 'Showcase all 26 official positions with photos, descriptions, and visibility controls.' },
  { icon: Lock, title: 'Data Privacy Compliant', desc: 'Fully compliant with RA 10173 (Data Privacy Act). Encrypted, backed up daily, multi-tenant isolated.' },
  { icon: Globe, title: 'Cloud-Based', desc: 'Fully hosted in the cloud. No servers to maintain, no installations. Access from any device, anywhere — your data is always safe and backed up.' },
  { icon: FileText, title: 'PDF Certificate Generation', desc: 'Certificates are auto-generated as professionally formatted PDFs. Ready to print or download instantly after approval.' },
  { icon: Shield, title: 'Security Alert Center', desc: 'Instantly notify admins if a document requester has a pending case or is on a restricted list. Prevents unauthorized certificate issuance.' },
];

const WORKFLOW_STEPS = [
  { num: '01', title: 'Resident Submits Online', desc: 'Resident fills out the form on the public portal. Gets a reference number instantly.' },
  { num: '02', title: 'Staff Reviews Request', desc: 'Assigned staff reviews the submission and forwards it for approval.' },
  { num: '03', title: 'Secretary & Captain Approve', desc: 'Barangay Secretary and Captain review and sign off digitally.' },
  { num: '04', title: 'Certificate Released', desc: 'Releasing team notifies the resident. Digital signature captured on pickup.' },
];

const PLANS = [
  { name: 'Starter', price: 1499, setup: 5000, icon: Zap, desc: 'For small barangays getting started.', highlight: false },
  { name: 'Standard', price: 2999, setup: 8000, icon: Star, desc: 'Full-featured for active barangays.', highlight: true },
  { name: 'Pro', price: 4999, setup: 10000, icon: Crown, desc: 'Unlimited, for high-volume barangays.', highlight: false },
];

const FAQS = [
  { q: 'How long does setup take?', a: 'Most barangays are live within 3–5 business days. We handle the full setup and provide training.' },
  { q: 'Can residents submit requests from their phones?', a: 'Yes. The public portal is fully mobile-responsive. Residents can submit from any device.' },
  { q: 'Is this compliant with the Data Privacy Act?', a: 'Yes. Compliant with RA 10173. All data is encrypted, isolated per barangay, and backed up daily.' },
  { q: 'Can we customize the workflow steps?', a: 'Absolutely. Each certificate type has its own configurable workflow. Add, remove, or reorder steps.' },
  { q: 'What if we need a certificate type not in the list?', a: 'We can build custom request forms. Pricing starts at ₱5,000 depending on complexity.' },
  { q: 'Can our LGU deploy this for all barangays?', a: 'Yes. Our LGU Enterprise plan gives you a centralized dashboard for all barangays under your municipality.' },
  { q: 'Can residents track their application status?', a: 'Yes. Every resident receives a unique reference number to track their application progress in real-time without logging in.' },
];

export default function LandingPageContent() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);


  const NAV = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how' },
    { label: 'Certificates', href: '#certs' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <div className="min-h-screen bg-white landing-page">
      <style suppressHydrationWarning>{`
        .landing-page, .landing-page * { font-family: 'Google Sans', 'Product Sans', 'Nunito Sans', sans-serif !important; }
        .section-animate { opacity: 0; transform: translateY(20px); transition: all 0.8s ease-out; }
        .section-animate.visible { opacity: 1; transform: translateY(0); }
        .feat-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .feat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.09); }
        .faq-body { overflow: hidden; max-height: 0; transition: max-height 0.35s cubic-bezier(.4,0,.2,1), opacity 0.3s ease; opacity: 0; }
        .faq-body.open { max-height: 200px; opacity: 1; }
        .btn-gold { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .btn-gold:hover { transform: translateY(-2px); box-shadow: 0 10px 28px -6px rgba(201,168,76,0.45); }
        .btn-dark { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .btn-dark:hover { transform: translateY(-2px); box-shadow: 0 10px 28px -6px rgba(0,0,0,0.2); }
        .cert-pill { transition: all 0.2s ease; }
        .cert-pill:hover { background: rgba(201,168,76,0.09); border-color: rgba(201,168,76,0.4); color: #A07830; }
        .plan-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .plan-card:hover { transform: translateY(-6px); }
        .plan-highlight { box-shadow: 0 0 0 2px #C9A84C; }
        .plan-highlight:hover { box-shadow: 0 20px 40px -12px rgba(201,168,76,0.25), 0 0 0 2px #C9A84C; }
      `}</style>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-8 flex items-center justify-between" style={{ height: 68 }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="font-bold text-gray-900 text-lg tracking-tight">BrgyDesk</span>
              <span className="block text-[9px] font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Barangay Management</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {NAV.map(n => (
              <a key={n.href} href={n.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">{n.label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => router.push('/login')} className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors px-4 py-2">
              Log in
            </button>
            <button
              onClick={() => router.push('/pricing')}
              className="btn-gold text-sm font-semibold px-5 py-2.5 rounded-xl text-white"
              style={{ background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})` }}
            >
              See Pricing
            </button>
          </div>

          <button onClick={() => setMobileOpen(o => !o)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-8 py-5 space-y-4">
            {NAV.map(n => (
              <a key={n.href} href={n.href} onClick={() => setMobileOpen(false)} className="block text-base text-gray-700 font-medium py-1">{n.label}</a>
            ))}
            <div className="pt-3 flex flex-col gap-3">
              <button onClick={() => router.push('/login')} className="w-full py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700">Log in</button>
              <button onClick={() => router.push('/pricing')} className="btn-gold w-full py-3 rounded-xl text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})` }}>See Pricing</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-24 pb-16 lg:pt-20 lg:pb-20 px-6 lg:px-8 bg-white overflow-hidden relative">
        <div className='absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.04] pointer-events-none' style={{ background: GOLD, filter: 'blur(120px)', transform: 'translate(30%, -30%)' }} />
        <div className={`max-w-[1400px] mx-auto transition-all duration-800 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="max-w-3xl mb-12">
            <span className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-8 border" style={{ background: `${GOLD}12`, color: GOLD_DARK, borderColor: `${GOLD}35` }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: GOLD }}></span>
              Built for Philippine Barangays
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
              The complete digital<br />
              system for your<br />
              <span className="relative inline-block">
                <span style={{ color: GOLD }}>barangay.</span>
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
              </span>
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-20 items-start">
            <div className="z-10 relative">
              <p className="text-lg lg:text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl font-medium">
                BrgyDesk gives your barangay a public website, online certificate requests, multi-step approval workflows, official receipts, and a full admin dashboard — all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => router.push("/pricing")} className="btn-gold flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white" style={{ background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})` }}>
                  View Plans & Pricing <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => router.push("/login")} className="btn-dark flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold bg-gray-900 text-white">
                  Log in to Dashboard
                </button>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-6 mt-12 pt-10 border-t border-gray-100">
                {[ { val: "10+", label: "Certificate Types" }, { val: "Multi-Step", label: "Approval Workflow" }, { val: "100%", label: "RA 10173 Compliant" }, { val: "Multi-Tenant", label: "LGU Ready" } ].map(s => (
                  <div key={s.label}>
                    <div className="text-xl lg:text-2xl font-bold text-gray-900">{s.val}</div>
                    <div className="text-xs lg:text-sm text-gray-400 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block relative lg:-mt-10">
              {/* Background Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full blur-[100px] opacity-10 pointer-events-none" style={{ background: GOLD }} />

              {/* Primary Wide Desktop View */}
              <div className="relative z-10 w-full aspect-video rounded-[1.5rem] shadow-[0_45px_100px_rgba(0,0,0,0.1)] bg-white overflow-hidden border border-gray-100 p-3">
                <img src="/images/landing/hero.png" alt="BrgyDesk Desktop View" className="w-full h-full object-cover rounded-[1rem] shadow-sm" />
              </div>

              {/* Secondary Vertical Tablet View */}
              <div className="absolute -left-12 -bottom-10 z-20 w-1/2 aspect-[4/5] rounded-[1.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.15)] bg-white overflow-hidden hidden sm:block transform -rotate-3 border border-gray-100 hover:rotate-0 transition-transform duration-500 p-3">
                <img src="/images/landing/hero-tablet.png" alt="BrgyDesk Tablet View" className="w-full h-full object-cover rounded-[1rem] shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-8 bg-gray-50">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-16">
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Everything you need</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-4 tracking-tight">One platform, complete coverage</h2>
            <p className="text-lg text-gray-500 max-w-2xl font-medium">From online submissions to digital signatures — BrgyDesk handles the entire document lifecycle.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="feat-card bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `${GOLD}15` }}>
                    <Icon className="w-5 h-5" style={{ color: GOLD_DARK }} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHT: PUBLIC PORTAL ── */}
      <section className="py-28 px-8 bg-white overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Public Portal</span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-6 tracking-tight">Your barangay's<br />official website</h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed font-medium">
                Every barangay gets a professional public portal where residents can read news, view officials, see facilities, and most importantly — request certificates online. It works perfectly on phones, tablets, and desktops.
              </p>
              <div className="space-y-4">
                {[ 
                  'News & Announcements', 'Officials Directory', 
                  'No More Long Queues — Apply from home', 
                  'Zero Waiting Time — Visit only for pickup' 
                ].map((item, i) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                      <CheckCircle className="w-3.5 h-3.5" style={{ color: i > 1 ? '#10b981' : GOLD }} />
                    </div>
                    <span className={`text-base font-semibold ${i > 1 ? 'text-green-600' : 'text-gray-700'}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-amber-100/50 blur-[80px] rounded-full pointer-events-none" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 transform lg:rotate-2 hover:rotate-0 transition-transform duration-700">
                <img src="/images/landing/portal.png" alt="Public Portal Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHT: QR SCANNER ── */}
      <section className="py-28 px-8 bg-gray-50 overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
             <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-amber-100/30 blur-[60px] rounded-full pointer-events-none" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 transform lg:-rotate-2 hover:rotate-0 transition-transform duration-700">
                <img src="/images/landing/qr-scan.png" alt="QR Scanner Preview" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: GOLD }}>QR Code System</span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-6 tracking-tight">Scan resident IDs<br />in seconds</h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed font-medium">
                Streamline relief operations and verify residents instantly. Every resident is issued a unique QR code ID. Staff simply scans it with any mobile phone — no special equipment needed.
              </p>
              <div className="space-y-4">
                {[ 'Instant Resident Verification', 'Track Relief Claims', 'Prevent Duplicate Claims', 'Offline Verification Mode' ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                      <CheckCircle className="w-3.5 h-3.5" style={{ color: GOLD }} />
                    </div>
                    <span className="text-base font-semibold text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHT: NOTIFICATIONS ── */}
      <section className="py-28 px-8 bg-white overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Messaging & Alerts</span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-6 tracking-tight">Stay connected with<br />real-time notifications</h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed font-medium">
                No more manual follow-up calls or missed updates. BrgyDesk automatically sends notifications to both residents and barangay staff at every stage of the document lifecycle — via both Email and SMS.
              </p>
              <div className="space-y-6">
                {[ 
                  { icon: Bell, title: 'Instant Confirmation', desc: 'Residents receive a reference number via SMS immediately after submission.' },
                  { icon: Mail, title: 'Email Updates', desc: 'Secure links for document tracking and official receipts sent to the resident\'s inbox.' },
                  { icon: MessageSquare, title: 'Pick-up Alerts', desc: 'Automated SMS notifying the resident when the document is ready for collection.' }
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100 shadow-sm">
                        <Icon className="w-6 h-6" style={{ color: GOLD }} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="relative p-6 md:p-10 bg-gray-50 rounded-[3rem] border border-gray-100 shadow-inner">
               <div className="absolute inset-0 bg-blue-50/30 blur-[60px] rounded-full pointer-events-none" />
               <div className="space-y-4 relative z-10">
                  {/* SMS Bubble Mock */}
                  <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-lg border border-gray-100 max-w-[85%] animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-2 h-2 rounded-full bg-green-500" />
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-wrap">BrgyDesk SMS</span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                      Barangay Iba O' Este: Mabuhay! Your <span className="font-bold text-gray-900">Barangay Clearance</span> (REF: #B-240322) has been approved and is ready for pickup. See you at the Barangay Hall!
                    </p>
                  </div>
                  {/* Email Bubble Mock */}
                  <div className="bg-gray-950 p-6 rounded-3xl shadow-xl w-full border border-white/5 transform lg:translate-x-12">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                           <div className="p-1.5 bg-white/10 rounded-lg">
                              <Mail className="w-4 h-4 text-amber-500" />
                           </div>
                           <span className="text-xs font-bold text-white tracking-widest uppercase">Official Update</span>
                        </div>
                        <span className="text-[10px] text-gray-500">Just now</span>
                     </div>
                     <div className="space-y-2">
                        <div className="h-1.5 w-1/3 bg-white/20 rounded-full" />
                        <div className="h-1.5 w-full bg-white/10 rounded-full" />
                        <div className="h-1.5 w-4/5 bg-white/10 rounded-full" />
                     </div>
                     <div className="mt-5 flex justify-end">
                        <div className="px-4 py-1.5 bg-amber-500 text-gray-950 rounded-full text-[10px] font-bold">Document Approved</div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-28 px-8 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: GOLD }}>The process</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 tracking-tight">From request to release</h2>
            <p className="text-lg text-gray-500 mt-4 max-w-xl mx-auto font-medium">The default flow is 4 steps — but every barangay can modify, add, or remove steps to match their own process.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {WORKFLOW_STEPS.map((s, i) => (
              <div key={i} className="relative text-center group">
                <div className="w-64 h-40 mx-auto mb-6 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 flex items-center justify-center">
                  {i < 3 ? (
                    <img src={`/images/landing/step-${i + 1}.png`} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-amber-50 flex flex-col items-center justify-center gap-3">
                       <CheckCircle className="w-16 h-16 text-amber-500" />
                       <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Released</span>
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-sm" style={{ background: i === 0 ? `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})` : '#f3f4f6', color: i === 0 ? '#fff' : '#374151' }}>
                  {s.num}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHT: RESIDENT MANAGEMENT ── */}
      <section className="py-28 px-8 bg-gray-50 overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
               <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100">
                  <div className="flex items-center justify-between mb-8">
                     <div className="text-xl font-bold text-gray-900">Resident Search</div>
                     <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                     {[ 'Dela Cruz, Juan', 'Santos, Maria', 'Lopez, Antonio' ].map((name, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-amber-200 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">{name[0]}</div>
                             <div>
                                <div className="text-sm font-bold text-gray-900">{name}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Zone 4 — Verified</div>
                             </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                       </div>
                     ))}
                  </div>
                  <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
                     <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Residents</div>
                     <div className="text-2xl font-black text-gray-900 tracking-tight">12,402</div>
                  </div>
               </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Resident Database</span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-6 tracking-tight">Your barangay's<br />digital census</h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed font-medium">
                Eliminate manual record-keeping. Search, verify, and manage your residents instantly. Track household relations, verify residency status during certificate requests, and keep your records always up to date.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[ 'Instant Verification', 'Barangay ID Generation', 'Household Mapping', 'Pending Case / Restricted Alerts' ].map(item => (
                   <div key={item} className="flex items-center gap-3">
                      <Shield className="w-5 h-5" style={{ color: GOLD }} />
                      <span className="text-base font-semibold text-gray-700">{item}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHT: TRACK STATUS ── */}
      <section className="py-28 px-8 bg-gray-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/5 to-transparent" />
        <div className="max-w-[1400px] mx-auto text-center relative z-10">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Real-time Transparency</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6 tracking-tight">Resident Application Tracker</h2>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto font-medium">
            Give your residents peace of mind. Every application generates a unique reference number they can use to track real-time progress — from submission to signature.
          </p>
          <div className="max-w-xl mx-auto bg-white/10 p-2 rounded-[2rem] border border-white/10 flex flex-col sm:flex-row items-center gap-2">
             <input type="text" placeholder="E.G. BC-2026-00001" className="w-full bg-transparent px-6 py-4 outline-none text-white font-bold uppercase tracking-widest text-sm" readOnly />
             <button className="whitespace-nowrap w-full sm:w-auto px-8 py-4 rounded-[1.5rem] bg-amber-500 text-gray-900 font-bold uppercase tracking-widest text-sm shadow-xl">
                Check Status
             </button>
          </div>
          <div className="flex flex-wrap justify-center gap-8 mt-12">
             {[ { label: 'Submitted', color: '#6b7280' }, { label: 'In Review', color: GOLD }, { label: 'Ready for Pickup', color: '#10b981' } ].map(s => (
               <div key={s.label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: s.color }} />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* ── CERTIFICATES ── */}
      <section id="certs" className="py-28 px-8 bg-gray-950">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Document types</span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6 tracking-tight leading-tight">
                All 11 standard<br />barangay documents
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed mb-8 font-medium">
                Every certificate your barangay issues — available online, processed through a configurable approval workflow, and released with an official receipt.
              </p>
              <button
                onClick={() => router.push('/pricing')}
                className="btn-gold inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})` }}
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {CERTS.map((c, i) => (
                <span
                  key={i}
                  className="cert-pill inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium cursor-default"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#d1d5db' }}
                >
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ── */}
      <section id="pricing" className="py-28 px-8 bg-gray-50">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 tracking-tight">Simple, transparent plans</h2>
            <p className="text-lg text-gray-500 mt-4 font-medium">No hidden fees. Cancel anytime. Upgrade as you grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={`plan-card bg-white rounded-2xl p-10 border shadow-sm flex flex-col ${plan.highlight ? 'plan-highlight border-transparent' : 'border-gray-200'}`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={plan.highlight ? { background: `${GOLD}20` } : { background: '#f3f4f6' }}>
                      <Icon className="w-5 h-5" style={plan.highlight ? { color: GOLD_DARK } : { color: '#6b7280' }} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  </div>
                  <div className="mb-2">
                    <span className="text-5xl font-extrabold text-gray-900 tracking-tight">₱{plan.price.toLocaleString()}</span>
                    <span className="text-base text-gray-400 ml-2">/month</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">+ ₱{plan.setup.toLocaleString()} one-time setup</p>
                  <p className="text-base text-gray-500 mb-8 leading-relaxed flex-1">{plan.desc}</p>
                  <button onClick={() => router.push('/pricing')} className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all ${plan.highlight ? 'btn-gold text-white' : 'btn-dark bg-gray-900 text-white'}`} style={plan.highlight ? { background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})` } : {}}>
                    See Full Details
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-900 rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <span className="inline-flex px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-xs font-bold uppercase tracking-widest mb-6">Enterprise Suite</span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">LGU City & Municipality Dashboard</h2>
                <p className="text-lg text-gray-400 leading-relaxed font-medium mb-8">
                  Centralized control for Municipal and City governments. Monitor all 26+ barangays in one dashboard, track document volumes, and generate city-wide reports instantly.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[ 'Consolidated Analytics', 'City-wide Reporting', 'Bulk Onboarding', 'Technical Support' ].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5" style={{ color: GOLD }} />
                      <span className="text-white font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-10">
                   <button 
                     onClick={() => router.push('#faq')} 
                     className="px-8 py-4 rounded-xl font-bold text-gray-900 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl" 
                     style={{ background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})` }}
                   >
                     Contact Us for LGU Pricing <ArrowRight className="w-5 h-5" />
                   </button>
                </div>
              </div>
              <div className="bg-gray-800 rounded-2xl p-6 border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-amber-500" />
                    <div>
                      <div className="text-white font-bold">LGU Dashboard</div>
                      <div className="text-gray-500 text-xs">Full Governance Visibility</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-gray-400 font-bold uppercase tracking-widest">Live Preview</div>
                </div>
                <div className="space-y-4">
                  {[ { n: "Active Barangays", v: "26/26" }, { n: "Total Requests", v: "15,402" }, { n: "Avg. Process Time", v: "1.2 Days" } ].map(s => (
                    <div key={s.n} className="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors">
                      <span className="text-gray-400 font-medium">{s.n}</span>
                      <span className="text-white font-bold">{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-28 px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: GOLD }}>FAQ</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 tracking-tight">Common questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-7 py-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-base pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  }
                </button>
                <div className={`faq-body px-7 text-base text-gray-500 leading-relaxed border-t border-gray-50 pt-4 pb-6 ${openFaq === i ? 'open' : ''}`}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-8 bg-gray-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight tracking-tight">
            Ready to modernize<br />your barangay?
          </h2>
          <p className="text-lg text-gray-400 mb-12 leading-relaxed font-medium">
            Get a free walk-through. We'll show you how BrgyDesk can transform your operations in days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/pricing')}
              className="btn-gold font-semibold px-10 py-4 rounded-xl text-base text-white"
              style={{ background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})` }}
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 border-t border-white/5 px-8 py-12">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="leading-none">
              <span className="font-bold text-white text-base">BrgyDesk</span>
              <span className="block text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: GOLD }}>Barangay Management</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">© {new Date().getFullYear()} BrgyDesk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
