const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "frontend", "src", "components", "Forms");
const files = [
    "CohabitationCertificateModal.js",
    "EducationalAssistanceModal.js",
    "GuardianshipCertificateModal.js",
    "MedicoLegalModal.js",
    "SamePersonCertificateModal.js"
];

const newNoticeBlock = `
                    <div className="bg-amber-50 border-l-[6px] border-amber-500 rounded-r-2xl p-5 shadow-sm relative overflow-hidden mb-6 flex-shrink-0">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2.5 rounded-full shadow-md mt-1 shrink-0">
                          <Info className="w-5 h-5 text-white" />
                        </div>
                        <div className="space-y-2.5 flex-1">
                          <div>
                            <h4 className="font-extrabold text-amber-900 uppercase tracking-widest text-[11px] flex items-center gap-2 mb-1">
                              Registration Notice / Paunawa
                            </h4>
                            <p className="text-amber-800 text-xs font-bold leading-relaxed mb-1">
                              If no record is found in the resident directory, please visit the Barangay Hall and coordinate with the staff to register.
                            </p>
                            
                            <p className="text-amber-800/80 text-[11px] font-bold leading-relaxed">
                              Kung walang rekord sa direktoryo ng residente, mangyaring pumunta sa Barangay Hall upang magparehistro sa ating mga kawani.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>`;

function replaceNotice(content) {
    // Use regex to locate the exact starting <div ...> for the gradient block.
    // We look for: <div className="bg-gradient-to-br ... overflow-hidden group">
    let match = content.match(/<div className="bg-gradient-to-br[^>]+rounded-2xl p-6 shadow-sm relative overflow-hidden group">/);

    if (!match) {
        // try fallback (for MedicoLegal it might not be a group)
        match = content.match(/<div className="bg-gradient-to-br[^>]+shadow-sm relative overflow-hidden/);
    }

    if (!match) return content;

    let startIndex = match.index;
    let openDivs = 0;
    let endIndex = -1;
    let started = false;

    for (let i = startIndex; i < content.length; i++) {
        if (content.substring(i, i + 4) === '<div') {
            openDivs++;
            started = true;
        } else if (content.substring(i, i + 6) === '</div>') {
            openDivs--;
            if (started && openDivs === 0) {
                endIndex = i + 5;
                break;
            }
        }
    }

    if (endIndex !== -1) {
        let replaced = content.substring(0, startIndex) + Object.values(newNoticeBlock).join('').trim() + content.substring(endIndex + 1);

        if (!replaced.includes("Info,") && !replaced.includes(" Info ") && replaced.includes("lucide-react")) {
            replaced = replaced.replace(/import {([^}]+)} from 'lucide-react';/, (m, p1) => {
                if (!p1.includes("Info")) {
                    return `import { ${p1.trim()}, Info } from 'lucide-react';`;
                }
                return m;
            });
        }
        return replaced;
    }
    return content;
}

files.forEach(file => {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, "utf-8");

    const newContent = replaceNotice(content);
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, "utf-8");
        console.log("Updated", file);
    } else {
        console.log("No match found for", file);
    }
});
