import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, X, Star, Zap, Crown, Shield, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

function useReveal(immediate = false) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (immediate) {
      const t = setTimeout(() => el.classList.add('revealed'), 80);
      return () => clearTimeout(t);
    }
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) { el.classList.add('revealed'); observer.unobserve(el); }
        },
        { threshold: 0.05 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, 50);
    return () => clearTimeout(timer);
  }, []);
  return ref;
}

const GOLD = '#C9A84C';
const GOLD_DARK = '#A07830';

const plans = [
  {
    name: 'Starter',
    price: 1499,
    setup: 5000,
    description: 'For small barangays getting started with digital services.',
    icon: Zap,
    highlight: false,
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
      'Resident database lookup',
      'Facilities & Programs sections',
      'Achievements & Awards section',
      'All 11 certificate types',
      'Full multi-step workflow',
      'Official Receipt (OR) generation',
      'Physical Inspection Report',
      'Signature capture',
      'QR code scanner feature',
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
    highlight: true,
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
      'QR code scanner feature',
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
    highlight: false,
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
      'QR code scanner feature',
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
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const plansRef = useReveal(true);
  const enterpriseRef = useReveal();
  const addonsRef = useReveal();
  const faqRef = useReveal();
  const ctaRef = useReveal();

  return (
    <div className="min-h-screen bg-white font-sans pricing-page">
      <style suppressHydrationWarning>{`
        .pricing-page, .pricing-page * { font-family: 'Google Sans', 'Product Sans', 'Nunito Sans', sans-serif !important; }
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s cubic-bezier(.4,0,.2,1), transform 0.6s cubic-bezier(.4,0,.2,1); }
        .reveal.revealed { opacity: 1; transform: translateY(0); }
        .plan-card { transition: transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s cubic-bezier(.4,0,.2,1); }
        .plan-card:hover { transform: translateY(-6px); box-shadow: 0 24px 48px -12px rgba(0,0,0,0.10); }
        .plan-card.highlight { box-shadow: 0 0 0 2px #C9A84C; }
        .plan-card.highlight:hover { box-shadow: 0 24px 48px -12px rgba(201,168,76,0.25), 0 0 0 2px #C9A84C; }
        .faq-answer { overflow: hidden; max-height: 0; transition: max-height 0.35s cubic-bezier(.4,0,.2,1), opacity 0.3s ease; opacity: 0; }
        .faq-answer.open { max-height: 300px; opacity: 1; }
        .btn-gold { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .btn-gold:hover { transform: translateY(-1px); box-shadow: 0 8px 24px -6px rgba(201,168,76,0.4); }
        .btn-dark { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .btn-dark:hover { transform: translateY(-1px); box-shadow: 0 8px 24px -6px rgba(0,0,0,0.2); }
        .addon-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .addon-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px -6px rgba(0,0,0,0.07); }
      `}</style>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-8 h-18 flex items-center justify-between" style={{ height: '68px' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">BrgyDesk</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#addons" className="text-base text-gray-400 hover:text-gray-900 transition-colors hidden sm:block">Add-ons</a>
            <a href="#faq" className="text-base text-gray-400 hover:text-gray-900 transition-colors hidden sm:block">FAQ</a>
            <button
              onClick={() => router.push('/')}
              className="text-base font-semibold transition-colors"
              style={{ color: GOLD }}
              onMouseEnter={e => e.currentTarget.style.color = GOLD_DARK}
              onMouseLeave={e => e.currentTarget.style.color = GOLD}
            >
              ← Back to BrgyDesk
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-14 px-8 text-center bg-white">
        <div className={`max-w-4xl mx-auto transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <span
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-8 border"
            style={{ background: `${GOLD}12`, color: GOLD_DARK, borderColor: `${GOLD}35` }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: GOLD }}></span>
            Subscription Plans
          </span>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            A professional barangay website and complete document management system.
            No hidden fees. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-28 px-8">
        <div ref={plansRef} className="reveal max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {plans.map((plan, idx) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  style={{ transitionDelay: `${idx * 0.12}s` }}
                  className={`plan-card${plan.highlight ? ' highlight' : ''} relative rounded-2xl flex flex-col overflow-hidden bg-white border ${plan.highlight ? 'border-transparent' : 'border-gray-200'} shadow-sm`}
                >
                  <div className="p-10 flex-1 flex flex-col">
                    {/* Icon + Name */}
                    <div className="flex items-center gap-4 mb-8">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={plan.highlight ? { background: `${GOLD}20` } : { background: '#f3f4f6' }}
                      >
                        <Icon
                          className="w-6 h-6"
                          style={plan.highlight ? { color: GOLD_DARK } : { color: '#6b7280' }}
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    </div>

                    {/* Price */}
                    <div className="mb-2">
                      <span className="text-6xl font-extrabold tracking-tight text-gray-900">
                        ₱{plan.price.toLocaleString()}
                      </span>
                      <span className="text-base ml-2 text-gray-400">/month</span>
                    </div>
                    <p className="text-base text-gray-400 mb-3">+ ₱{plan.setup.toLocaleString()} one-time setup</p>
                    <p className="text-base text-gray-500 mb-10 leading-relaxed">{plan.description}</p>

                    {/* CTA */}
                    {plan.highlight ? (
                      <button
                        className="btn-gold w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 mb-10 text-white"
                        style={{ background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})` }}
                      >
                        Get Started <ArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button className="btn-dark w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 mb-10 bg-gray-900 text-white hover:bg-black transition-colors">
                        Get Started <ArrowRight className="w-5 h-5" />
                      </button>
                    )}

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-4 p-5 rounded-xl mb-10 text-sm bg-gray-50">
                      {[
                        { label: 'Requests', value: plan.requests },
                        { label: 'Staff', value: plan.staff },
                        { label: 'Support', value: plan.support },
                        { label: 'Training', value: plan.training },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-gray-400 font-semibold mb-1">{label}</p>
                          <p className="text-gray-700 font-medium">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Features */}
                    <div className="space-y-3.5">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: GOLD }} />
                          <span className="text-base text-gray-600">{f}</span>
                        </div>
                      ))}
                    </div>

                    {plan.notIncluded.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-gray-100 space-y-3.5">
                        {plan.notIncluded.map((f, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <X className="w-5 h-5 mt-0.5 shrink-0 text-gray-300" />
                            <span className="text-base text-gray-400">{f}</span>
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
      <section className="pb-28 px-8">
        <div ref={enterpriseRef} className="reveal max-w-[1400px] mx-auto">
          <div className="bg-gray-950 rounded-2xl p-12 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
            <div className="max-w-2xl">
              <span className="text-sm font-bold uppercase tracking-widest mb-4 block" style={{ color: GOLD }}>LGU Enterprise</span>
              <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-snug">
                Deploying to multiple barangays?
              </h3>
              <p className="text-gray-400 text-base leading-relaxed">
                Get a centralized LGU dashboard, bulk deployment across all barangays, unified reporting,
                SLA guarantee, and a dedicated account manager. Starting at ₱25,000/month.
              </p>
            </div>
            <button
              className="btn-gold shrink-0 font-semibold px-8 py-4 rounded-xl text-base flex items-center gap-2 text-white"
              style={{ background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})` }}
            >
              Contact Us <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section id="addons" className="pb-28 px-8 bg-gray-50">
        <div ref={addonsRef} className="reveal max-w-[1400px] mx-auto pt-24">
          <div className="mb-14">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Add-ons</h2>
            <p className="text-lg text-gray-500">Extend your plan with exactly what you need.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {addons.map((group, gi) => (
              <div key={gi} className="addon-card bg-white rounded-2xl border border-gray-100 p-9 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{group.category}</h3>
                {group.description
                  ? <p className="text-base text-gray-400 mb-6">{group.description}</p>
                  : <div className="mb-6" />
                }
                <div className="space-y-1">
                  {group.items.map((item, ii) => (
                    <div key={ii} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                      <span className="text-base text-gray-600">{item.name}</span>
                      <span className="text-base font-bold ml-4 shrink-0" style={{ color: GOLD_DARK }}>{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-28 px-8 bg-white">
        <div ref={faqRef} className="reveal max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Frequently asked questions</h2>
            <p className="text-lg text-gray-500">Everything you need to know before getting started.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
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
                <div className={`faq-answer px-7 text-base text-gray-500 leading-relaxed border-t border-gray-50 pt-4 pb-6 ${openFaq === i ? 'open' : ''}`}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-28 px-8 bg-gray-950">
        <div ref={ctaRef} className="reveal max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            Ready to modernize your barangay?
          </h2>
          <p className="text-gray-400 mb-12 text-lg leading-relaxed">
            Contact us for a free demo. We will walk you through the system and help you pick the right plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:your@email.com"
              className="btn-gold font-semibold px-10 py-4 rounded-xl text-base text-white"
              style={{ background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})` }}
            >
              Email Us
            </a>
            <a
              href="#"
              className="border border-white/20 text-white font-semibold px-10 py-4 rounded-xl hover:bg-white/10 transition-all text-base"
            >
              Message on Facebook
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
