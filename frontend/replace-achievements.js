const fs = require('fs');
const file = 'c:/Users/SCREENS/OneDrive/Desktop/Admin dashboard/frontend/pages/index.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state
content = content.replace(/const \[showComingSoonModal, setShowComingSoonModal\] = useState\(false\);/, 'const [showComingSoonModal, setShowComingSoonModal] = useState(false);\n  const [selectedAchievement, setSelectedAchievement] = useState(null);');

// 2. Add cursor-pointer and onClick to each achievement block

// We can replace the start of each achievement block.
const replacements = [
    {
        find: /Outstanding Barangay Award \*\\/\r?\n\s*<div className = "bg-indigo-950\/30 backdrop-blur-md rounded-2xl border border-indigo-400\/20 hover:bg-indigo-900\/50 hover:border-yellow-400\/40 transition-all duration-300 group shadow-\[0_8px_30px_rgb\(0,0,0,0\.12\)\] overflow-hidden flex flex-col hover:-translate-y-2">/,
    replace: `Outstanding Barangay Award */
              <div 
                onClick={() => setSelectedAchievement({
                  title: "Most Outstanding Barangay",
                  category: "City-level Recognition",
                  description: "Awarded for exhibiting exemplary performance in local governance, community engagement, and rapid public service delivery across all metrics.",
                  image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800",
                  year: "2025",
                  colorClass: "bg-yellow-500",
                  textColor: "yellow-400"
                })}
                className="cursor-pointer bg-indigo-950/30 backdrop-blur-md rounded-2xl border border-indigo-400/20 hover:bg-indigo-900/50 hover:border-yellow-400/40 transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col hover:-translate-y-2">`
  },
{
    find: /Cleanest & Greenest \*\\/\r ?\n\s * <div className="bg-indigo-950\/30 backdrop-blur-md rounded-2xl border border-indigo-400\/20 hover:bg-indigo-900\/50 hover:border-emerald-400\/40 transition-all duration-300 group shadow-\[0_8px_30px_rgb\(0,0,0,0\.12\)\] overflow-hidden flex flex-col hover:-translate-y-2">/,
        replace: `Cleanest & Greenest */
        <div
            onClick={() => setSelectedAchievement({
                title: "Cleanest & Greenest",
                category: "Environmental Award",
                description: "Recognized for initiating the Brgy. Green Building Code and maintaining a zero-waste policy within the immediate public vicinity.",
                image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800",
                year: "2024",
                colorClass: "bg-emerald-500",
                textColor: "emerald-400"
            })}
            className="cursor-pointer bg-indigo-950/30 backdrop-blur-md rounded-2xl border border-indigo-400/20 hover:bg-indigo-900/50 hover:border-emerald-400/40 transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col hover:-translate-y-2">`
  },
            {
                find: /Digital Innovation Pioneer \*\\/\r?\n\s*<div className="bg-indigo-950\/30 backdrop-blur-md rounded-2xl border border-indigo-400\/20 hover:bg-indigo-900\/50 hover:border-blue-400\/40 transition-all duration-300 group shadow-\[0_8px_30px_rgb\(0,0,0,0\.12\)\] overflow-hidden flex flex-col hover:-translate-y-2">/,
                    replace: `Digital Innovation Pioneer */
                <div
                    onClick={() => setSelectedAchievement({
                        title: "Digital Innovation Pioneer",
                        category: "Special Citation",
                        description: "Acknowledged for launching the comprehensive E-Services portal, ensuring 100% online availability of forms and digital records.",
                        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
                        year: "2026",
                        colorClass: "bg-blue-500",
                        textColor: "blue-400"
                    })}
                    className="cursor-pointer bg-indigo-950/30 backdrop-blur-md rounded-2xl border border-indigo-400/20 hover:bg-indigo-900/50 hover:border-blue-400/40 transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col hover:-translate-y-2">`
  },
                    {
                        find: /Best in Public Safety \*\\/\r?\n\s*<div className="bg-indigo-950\/30 backdrop-blur-md rounded-2xl border border-indigo-400\/20 hover:bg-indigo-900\/50 hover:border-red-400\/40 transition-all duration-300 group shadow-\[0_8px_30px_rgb\(0,0,0,0\.12\)\] overflow-hidden flex flex-col hover:-translate-y-2">/,
                            replace: `Best in Public Safety */
                        <div
                            onClick={() => setSelectedAchievement({
                                title: "Best in Public Safety",
                                category: "Community Safety",
                                description: "Recognized for the lowest crime rate in the municipality and unparalleled rapid response of the Barangay Tanods and safety patrols.",
                                image: "https://images.unsplash.com/photo-1533481405265-e9ce0c044abb?auto=format&fit=crop&q=80&w=800",
                                year: "2025",
                                colorClass: "bg-red-500",
                                textColor: "red-400"
                            })}
                            className="cursor-pointer bg-indigo-950/30 backdrop-blur-md rounded-2xl border border-indigo-400/20 hover:bg-indigo-900/50 hover:border-red-400/40 transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col hover:-translate-y-2">`
  },
                            {
                                find: /Excellence in Healthcare \*\\/\r?\n\s*<div className="bg-indigo-950\/30 backdrop-blur-md rounded-2xl border border-indigo-400\/20 hover:bg-indigo-900\/50 hover:border-pink-400\/40 transition-all duration-300 group shadow-\[0_8px_30px_rgb\(0,0,0,0\.12\)\] overflow-hidden flex flex-col hover:-translate-y-2">/,
                                    replace: `Excellence in Healthcare */
                                <div
                                    onClick={() => setSelectedAchievement({
                                        title: "Excellence in Healthcare",
                                        category: "Health Service",
                                        description: "Awarded for the continuous deployment of mobile clinics, free check-ups, and maternal care support for marginalized sectors.",
                                        image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
                                        year: "2024",
                                        colorClass: "bg-pink-500",
                                        textColor: "pink-400"
                                    })}
                                    className="cursor-pointer bg-indigo-950/30 backdrop-blur-md rounded-2xl border border-indigo-400/20 hover:bg-indigo-900/50 hover:border-pink-400/40 transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col hover:-translate-y-2">`
  },
                                    {
                                        find: /Champion in Youth Development \*\\/\r?\n\s*<div className="bg-indigo-950\/30 backdrop-blur-md rounded-2xl border border-indigo-400\/20 hover:bg-indigo-900\/50 hover:border-purple-400\/40 transition-all duration-300 group shadow-\[0_8px_30px_rgb\(0,0,0,0\.12\)\] overflow-hidden flex flex-col hover:-translate-y-2">/,
                                            replace: `Champion in Youth Development */
                                        <div
                                            onClick={() => setSelectedAchievement({
                                                title: "Youth Development",
                                                category: "Youth Council",
                                                description: "Honored for establishing local sports tournaments, skill-building workshops, and broad educational assistance distribution.",
                                                image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800",
                                                year: "2025",
                                                colorClass: "bg-purple-500",
                                                textColor: "purple-400"
                                            })}
                                            className="cursor-pointer bg-indigo-950/30 backdrop-blur-md rounded-2xl border border-indigo-400/20 hover:bg-indigo-900/50 hover:border-purple-400/40 transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col hover:-translate-y-2">`
  }
                                            ];

                                            let replaced = 0;
replacements.forEach(rep => {
  if (content.match(rep.find)) {
                                                content = content.replace(rep.find, rep.replace);
                                            replaced++;
  } else {
                                                console.log('Missed:', rep.find);
  }
});
                                            console.log('Replaced', replaced, 'cards');

                                            // 3. Add Modal at the end
                                            const modalJSX = `
                                            {/* Achievement Modal */}
                                            {selectedAchievement && (
                                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAchievement(null)}>
                                                    <div className="bg-indigo-950 border border-indigo-400/20 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => setSelectedAchievement(null)} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-red-500 transition-colors backdrop-blur-md">
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                        <div className="relative h-48 sm:h-64 lg:h-80 w-full">
                                                            <div className="absolute inset-0 bg-indigo-900/20 z-10"></div>
                                                            <img src={selectedAchievement.image} alt={selectedAchievement.title} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-950 to-transparent z-10"></div>
                                                            <div className={\`absolute top-4 left-4 z-20 \${selectedAchievement.colorClass} text-white text-xs md:text-sm font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md\`}>
                                                            <Award className="w-4 h-4" />
                                                            {selectedAchievement.year}
                                                        </div>
                                                    </div>
                                                    <div className="p-6 md:p-8 relative z-20 -mt-8 md:-mt-12 bg-indigo-950/80 backdrop-blur-md border-t border-indigo-500/20">
                                                        <div className="mb-2">
                                                            <p className={\`text-\${selectedAchievement.textColor} text-xs md:text-sm font-bold tracking-widest uppercase mb-1\`}>{selectedAchievement.category}</p>
                                                        <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">{selectedAchievement.title}</h3>
                                                    </div>
                                                    <p className="text-indigo-100 leading-relaxed text-base md:text-lg mt-4">
                                                        {selectedAchievement.description}
                                                    </p>
                                                </div>
          </div>
                                    </div>
      )}

                                </div>
                                );
}`;

                                content = content.replace(/    <\/div>\sr+\);\s+}\s*$/, modalJSX);

                                fs.writeFileSync(file, content);
                                console.log('File updated successfully!');
