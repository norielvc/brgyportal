const fs = require('fs');
const filePath = 'c:\\Users\\SCREENS\\OneDrive\\Desktop\\Admin dashboard\\frontend\\pages\\landing.js';
let content = fs.readFileSync(filePath, 'utf8');

const heroSectionIdentifier = '{/* \u2500\u2500 HERO \u2500\u2500 */}';
const startIdx = content.indexOf(heroSectionIdentifier);
const endSectionTag = '</section>';
const endIdx = content.indexOf(endSectionTag, startIdx) + endSectionTag.length;

const part1 = content.substring(0, startIdx);
const part2 = content.substring(endIdx);

const newHeroSec = [
  '{/* \u2500\u2500 HERO \u2500\u2500 */}',
  '      <section className="pt-20 pb-20 px-8 bg-white overflow-hidden relative">',
  "        <div className='absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.04] pointer-events-none' style={{ background: GOLD, filter: 'blur(120px)', transform: 'translate(30%, -30%)' }} />",
  '        <div className={`max-w-[1400px] mx-auto transition-all duration-800 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>',
  '          <div className="max-w-3xl mb-12">',
  '            <span className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-8 border" style={{ background: `${GOLD}12`, color: GOLD_DARK, borderColor: `${GOLD}35` }}>',
  '              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: GOLD }}></span>',
  '              Built for Philippine Barangays',
  '            </span>',
  '            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-[1.08] tracking-tight">',
  '              The complete digital<br />',
  '              system for your<br />',
  '              <span className="relative inline-block">',
  '                <span style={{ color: GOLD }}>barangay.</span>',
  '                <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />',
  '              </span>',
  '            </h1>',
  '          </div>',
  '',
  '          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-20 items-start">',
  '            <div>',
  '              <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl font-medium">',
  '                BrgyDesk gives your barangay a public website, online certificate requests, multi-step approval workflows, official receipts, and a full admin dashboard \u2014 all in one platform.',
  '              </p>',
  '              <div className="flex flex-col sm:flex-row gap-4">',
  '                <button onClick={() => router.push("/pricing")} className="btn-gold flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white" style={{ background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})` }}>',
  '                  View Plans & Pricing <ArrowRight className="w-5 h-5" />',
  '                </button>',
  '                <button onClick={() => router.push("/login")} className="btn-dark flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold bg-gray-900 text-white">',
  '                  Log in to Dashboard',
  '                </button>',
  '              </div>',
  '              <div className="flex flex-wrap items-center gap-6 mt-12 pt-10 border-t border-gray-100">',
  '                {[ { val: "10+", label: "Certificate Types" }, { val: "Multi-Step", label: "Approval Workflow" }, { val: "100%", label: "RA 10173 Compliant" }, { val: "Multi-Tenant", label: "LGU Ready" } ].map(s => (',
  '                  <div key={s.label}>',
  '                    <div className="text-2xl font-bold text-gray-900">{s.val}</div>',
  '                    <div className="text-sm text-gray-400 font-medium">{s.label}</div>',
  '                  </div>',
  '                ))}',
  '              </div>',
  '            </div>',
  '',
  '            <div className="relative lg:-mt-40">',
  '              {/* Background Glow */}',
  '              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full blur-[100px] opacity-10 pointer-events-none" style={{ background: GOLD }} />',
  '',
  '              {/* Primary Wide Desktop View (Raw Illustration) */}',
  '              <div className="relative z-10 p-1.5 rounded-[2rem] border border-gray-100 shadow-[0_40px_80px_rgba(0,0,0,0.08)] bg-white overflow-hidden">',
  '                <img src="/images/landing/hero.png" alt="BrgyDesk Desktop View" className="w-full h-auto rounded-[1.2rem]" />',
  '              </div>',
  '',
  '              {/* Secondary Vertical Tablet View (Raw Illustration) */}',
  '              <div className="absolute -left-12 -bottom-10 z-20 w-1/2 p-1.5 rounded-[2rem] border border-gray-100 shadow-[0_30px_60px_rgba(0,0,0,0.1)] bg-white overflow-hidden hidden sm:block transform -rotate-3">',
  '                <img src="/images/landing/hero-tablet.png" alt="BrgyDesk Tablet View" className="w-full h-auto rounded-[1.2rem]" />',
  '              </div>',
  '            </div>',
  '          </div>',
  '        </div>',
  '      </section>'
].join('\n');

fs.writeFileSync(filePath, part1 + newHeroSec + part2, 'utf8');
console.log('Moved up hero images further and removed browser frame');
