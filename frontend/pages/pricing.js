import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, X, Star, Zap, Crown, Shield, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

// Hook: fade+slide in when element enters viewport
function useReveal(immediate = false) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (immediate) {
      // Reveal right away (for above-fold content)
      const t = setTimeout(() => el.classList.add('revealed'), 80);
      return () => clearTimeout(t);
    }
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add('revealed');
            observer.unobserve(el);
          }
        },
        { threshold: 0.05, rootMargin: '0px 0px 0px 0px' }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, 50);
    return () => clearTimeout(timer);
  }, []);
  return ref;
}

const plans = [
  {
    name: 'Starter',
    price: 1499,
    setup: 5000,
    description: 'For small barangays getting started with digital services.',
    icon: Zap,
    color: 'blue',
    popular: false,
    requests: '300 requests / mo',
    staff: '3 staff + 1 admin',
    support: 'Email · 3–5 days',
    training: '1 training call',
    features: [
      'Barangay public website',
      'Custom name, logo & branding',
      'News & Events carousel',
      'Officials directory with photos',
      'Contact section & hotlines',
      'Mobile responsive',
      '3 certificate types',
      '2-step approval workflow',
      'Email notification on submission',
      'PDF certificate generation',
      'Reference number & status tracking',
    ],
    notIncluded: [
      'Facilities & Programs sections',
      'Achievements & Awards section',
      'All 11 certificate types',
      'Full multi-step workflow',
      'Official Receipt (OR) generation',
      'Physical Inspection Report',
      'Signature capture',
      'QR attendance system',
      'Analytics dashboard',
      'Custom domain',
    ]
  },
  {
    name: 'Standard',
    price: 2999,
    setup: 8000,
    description: 'Full-featured system for active barangays with complete document processing.',
    icon: Star,
    color: 'green',
    popular: true,
    requests: '2,000 requests / mo',
    staff: '8 staff + 1 admin',
    support: 'Email · 1–2 days',
    training: '2 training calls',
    features: [
      'Everything in Starter',
      'Facilities section with image gallery',
      'Barangay Programs section',
      'Achievements & Awards section',
      'All 11 certificate & document types',
      'Business Permit + Physical Inspection',
      'Full multi-step workflow',
      'Configurable workflow per certificate',
      'Approve / Reject / Return / Send Back',
      'Email notifications at every step',
      'Official Receipt (OR) + PDF download',
      'Pickup verification + digital signature',
      'Request history & audit trail',
      'Resident database lookup',
    ],
    notIncluded: [
      'Custom domain',
      'QR attendance system',
      'Analytics dashboard',
      'Bulk data export',
      'Dedicated support line',
    ]
  },
  {
    name: 'Pro',
    price: 4999,
    setup: 10000,
    description: 'For high-volume or urban barangays that need everything, unlimited.',
    icon: Crown,
    color: 'slate',
    popular: false,
    requests: 'Unlimited',
    staff: 'Unlimited',
    support: 'Priority · same-day',
    training: '3 calls + 30-day support',
    features: [
      'Everything in Standard',
      'Custom domain (yourbrgy.gov.ph)',
      'Custom color theme',
      'Unlimited staff accounts',
      'Unlimited requests / month',
      'QR code employee attendance',
      'Analytics dashboard',
      'Bulk data export (Excel / CSV)',
      'Priority same-day support',
      'Dedicated WhatsApp / Viber line',
      '30-day post-launch monitoring',
    ],
    notIncluded: []
  }
];

const addons = [
  {
    category: 'Recurring',
    items: [
      { name: 'Extra staff accounts (5 slots)', price: '₱500 / mo' },
      { name: 'Extra request capacity (+500 / mo)', price: '₱300 / mo' },
    ]
  },
  {
    category: 'One-Time',
    items: [
      { name: 'Additional training session (1 hr)', price: '₱800' },
      { name: 'Custom certificate template design', price: '₱3,000' },
      { name: 'Data migration from old system', price: '₱5,000' },
    ]
  },
  {
    category: 'Custom Request Form',
    description: 'New certificate or document type beyond included forms.',
    items: [
      { name: 'Simple — basic fields, 1–2 step workflow', price: '₱5,000' },
      { name: 'Standard — multiple fields, full workflow', price: '₱8,000' },
      { name: 'Complex — conditional fields, inspection, OR', price: '₱12,000' },
    ]
  },
  {
    category: 'Additional Landing Page Section',
    description: 'New section on your public barangay website.',
    items: [
      { name: 'Simple — text + image, static', price: '₱3,000' },
      { name: 'Standard — CMS / admin-editable', price: '₱5,000' },
      { name: 'Complex — gallery, carousel, dynamic data', price: '₱8,000' },
    ]
  }
];

const faqs = [
  { q: 'Is there a free trial?', a: 'Yes, we offer a 30-day demo so you can see the system live before committing.' },
  { q: 'Can we upgrade our plan later?', a: 'Absolutely. You can upgrade anytime and we will prorate the difference.' },
  { q: 'What happens to our data if we cancel?', a: 'Your data remains accessible for 30 days after cancellation. We can export everything for you.' },
  { q: 'Is this compliant with the Data Privacy Act?', a: 'Yes. Compliant with RA 10173. Data is encrypted and backed up daily.' },
  { q: 'Do you provide on-site training?', a: 'Yes. On-site training is available. Online training via Zoom/Meet is included in all plans.' },
  { q: 'Can we add certificate types not in the list?', a: 'Yes, through our Custom Request Form add-on. Pricing depends on complexity.' }
];

export default function PricingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger hero animation on mount
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Plans are the main content — reveal immediately; rest trigger on scroll
  const plansRef = useReveal(true);
  const enterpriseRef = useReveal();
  const addonsRef = useReveal();
  const faqRef = useReveal();
  const ctaRef = useReveal();

  return (
    <div className="min-h-screen bg-white font-sans">
      <style>{`
        .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.65s cubic-bezier(.4,0,.2,1), transform 0.65s cubic-bezier(.4,0,.2,1); }
        .reveal.revealed { opacity: 1; transform: translateY(0); }
        .plan-card { transition: transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s cubic-bezier(.4,0,.2,1); }
        .plan-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.12); }
        .plan-card.popular:hover { transform: scale(1.02) translateY(-6px); }
        .faq-answer { overflow: hidden; max-height: 0; transition: max-height 0.35s cubic-bezier(.4,0,.2,1), opacity 0.3s ease; opacity: 0; }
        .faq-answer.open { max-height: 200px; opacity: 1; }
        .btn-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 6px 20px -4px rgba(0,71,0,0.3); }
        .addon-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .addon-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px -6px rgba(0,0,0,0.08); }
      `}</style>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#004700] rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base">BarangayPortal</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#addons" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">Add-ons</a>
            <a href="#faq" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">FAQ</a>
            <button
              onClick={() => router.push('/')}
              className="text-sm font-medium text-[#004700] hover:text-[#006400] transition-colors"
            >
              ← Back to Portal
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center bg-white">
        <div className={`max-w-3xl mx-auto transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-green-100">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            Subscription Plans
          </span>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            A professional barangay website and complete document management system.
            No hidden fees. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-24 px-6">
        <div ref={plansRef} className="reveal max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan, idx) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  style={{ transitionDelay: `${idx * 0.12}s` }}
                  className={`plan-card relative rounded-2xl flex flex-col overflow-hidden
                    ${plan.popular
                      ? 'popular bg-[#004700] text-white shadow-2xl shadow-green-900/20 scale-[1.02]'
                      : 'bg-white border border-gray-200 shadow-sm'
                    }`}
                >
                  {plan.popular && (
                    <div className="bg-[#8dc63f] text-[#002200] text-[11px] font-bold text-center py-2 tracking-widest uppercase">
                      Most Popular
                    </div>
                  )}

                  <div className="p-8 flex-1 flex flex-col">
                    {/* Icon + Name */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                        ${plan.popular ? 'bg-white/15' : 'bg-gray-100'}`}>
                        <Icon className={`w-5 h-5 ${plan.popular ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                        {plan.name}
                      </h3>
                    </div>

                    {/* Price */}
                    <div className="mb-1">
                      <span className={`text-5xl font-extrabold tracking-tight ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                        ₱{plan.price.toLocaleString()}
                      </span>
                      <span className={`text-sm ml-1 ${plan.popular ? 'text-green-200' : 'text-gray-400'}`}>/month</span>
                    </div>
                    <p className={`text-sm mb-2 ${plan.popular ? 'text-green-200' : 'text-gray-400'}`}>
                      + ₱{plan.setup.toLocaleString()} one-time setup
                    </p>
                    <p className={`text-sm mb-8 leading-relaxed ${plan.popular ? 'text-green-100' : 'text-gray-500'}`}>
                      {plan.description}
                    </p>

                    {/* CTA */}
                    <button className={`btn-hover w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mb-8
                      ${plan.popular
                        ? 'bg-white text-[#004700] hover:bg-green-50'
                        : 'bg-[#004700] text-white hover:bg-[#006400]'
                      }`}>
                      Get Started <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Meta */}
                    <div className={`grid grid-cols-2 gap-3 p-4 rounded-xl mb-8 text-xs
                      ${plan.popular ? 'bg-white/10' : 'bg-gray-50'}`}>
                      <div>
                        <p className={`font-semibold mb-0.5 ${plan.popular ? 'text-green-200' : 'text-gray-400'}`}>Requests</p>
                        <p className={plan.popular ? 'text-white font-medium' : 'text-gray-700 font-medium'}>{plan.requests}</p>
                      </div>
                      <div>
                        <p className={`font-semibold mb-0.5 ${plan.popular ? 'text-green-200' : 'text-gray-400'}`}>Staff</p>
                        <p className={plan.popular ? 'text-white font-medium' : 'text-gray-700 font-medium'}>{plan.staff}</p>
                      </div>
                      <div>
                        <p className={`font-semibold mb-0.5 ${plan.popular ? 'text-green-200' : 'text-gray-400'}`}>Support</p>
                        <p className={plan.popular ? 'text-white font-medium' : 'text-gray-700 font-medium'}>{plan.support}</p>
                      </div>
                      <div>
                        <p className={`font-semibold mb-0.5 ${plan.popular ? 'text-green-200' : 'text-gray-400'}`}>Training</p>
                        <p className={plan.popular ? 'text-white font-medium' : 'text-gray-700 font-medium'}>{plan.training}</p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2.5">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? 'text-[#8dc63f]' : 'text-green-500'}`} />
                          <span className={`text-sm ${plan.popular ? 'text-green-50' : 'text-gray-600'}`}>{f}</span>
                        </div>
                      ))}
                    </div>

                    {plan.notIncluded.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-100 space-y-2.5">
                        {plan.notIncluded.map((f, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <X className="w-4 h-4 mt-0.5 shrink-0 text-gray-300" />
                            <span className="text-sm text-gray-400">{f}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LGU Enterprise */}
      <section className="pb-24 px-6">
        <div ref={enterpriseRef} className="reveal max-w-6xl mx-auto">
          <div className="bg-gray-950 rounded-2xl p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3 block">LGU Enterprise</span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3 leading-snug">
                Deploying to multiple barangays?
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Get a centralized LGU dashboard, bulk deployment across all barangays, unified reporting,
                SLA guarantee, and a dedicated account manager. Starting at ₱25,000/month.
              </p>
            </div>
            <button className="shrink-0 bg-white text-gray-900 font-semibold px-7 py-3 rounded-xl hover:bg-gray-100 transition-all text-sm flex items-center gap-2">
              Contact Us <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section id="addons" className="pb-24 px-6 bg-gray-50">
        <div ref={addonsRef} className="reveal max-w-6xl mx-auto pt-20">
          <div className="mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Add-ons</h2>
            <p className="text-gray-500">Extend your plan with exactly what you need.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addons.map((group, gi) => (
              <div key={gi} className="addon-card bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-1">{group.category}</h3>
                {group.description && (
                  <p className="text-sm text-gray-400 mb-5">{group.description}</p>
                )}
                {!group.description && <div className="mb-5" />}
                <div className="space-y-1">
                  {group.items.map((item, ii) => (
                    <div key={ii} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-600">{item.name}</span>
                      <span className="text-sm font-bold text-gray-900 ml-4 shrink-0">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-white">
        <div ref={faqRef} className="reveal max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Frequently asked questions</h2>
            <p className="text-gray-500">Everything you need to know before getting started.</p>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  }
                </button>
                <div className={`faq-answer px-6 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3 pb-5 ${openFaq === i ? 'open' : ''}`}>
                  {faq.a}
                </div>              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 bg-[#004700]">
        <div ref={ctaRef} className="reveal max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            Ready to modernize your barangay?
          </h2>
          <p className="text-green-200 mb-10 text-base leading-relaxed">
            Contact us for a free demo. We will walk you through the system and help you pick the right plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:your@email.com"
              className="bg-white text-[#004700] font-semibold px-8 py-3.5 rounded-xl hover:bg-green-50 transition-all text-sm"
            >
              Email Us
            </a>
            <a
              href="#"
              className="border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all text-sm"
            >
              Message on Facebook
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
