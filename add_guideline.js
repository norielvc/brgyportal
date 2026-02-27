const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "frontend", "src", "components", "Forms");
const files = fs.readdirSync(dir).filter(f => f.endsWith("Modal.js") && f !== "ResidentSearchModal.js");

const appendText = `
                            <div className="mt-3 bg-white/60 p-3 rounded-lg border border-emerald-100/50 shadow-sm text-xs text-emerald-900 leading-relaxed">
                              <strong>Notice:</strong> If no record is found in the resident directory, please visit the Barangay Hall and coordinate with the staff to register.<br/>
                              <strong className="text-[10px] text-emerald-800">Paunawa:</strong> <span className="text-[10px] text-emerald-800">Kung walang rekord sa direktoryo ng residente, mangyaring pumunta sa Barangay Hall upang magparehistro sa ating mga kawani.</span>
                            </div>
`;

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, "utf-8");

    // Replaces the closing </p> tag of the notices with the appendText + </p> or just append it as a sibling.
    // The notices generally look like <p className="text-emerald-800/90 leading-relaxed text-sm">...</p>
    // Or <p className="text-emerald-800/90 leading-relaxed text-sm font-medium">...</p>
    // Let's inject after the </p> that follows "leading-relaxed text-sm".

    content = content.replace(/(<p className="text-emerald-800\/90 leading-relaxed text-sm[^>]*>.*?<\/p>)/s, `$1${appendText}`);

    fs.writeFileSync(filePath, content, "utf-8");
});

console.log("Added guidelines to all forms.");
