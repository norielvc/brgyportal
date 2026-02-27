const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "frontend", "src", "components", "Forms");
const files = fs.readdirSync(dir).filter(f => f.endsWith("Modal.js") && f !== "ResidentSearchModal.js");

const newNoticeBlock = `
                  <div className="bg-amber-50 border-l-[6px] border-amber-500 rounded-r-2xl p-5 shadow-sm relative overflow-hidden mb-6 flex-shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2.5 rounded-full shadow-md mt-1 shrink-0">
                        <Info className="w-5 h-5 text-white" />
                      </div>
                      <div className="space-y-2.5 flex-1">
                        <div>
                          <h4 className="font-extrabold text-amber-900 uppercase tracking-widest text-xs flex items-center gap-2 mb-1">
                            Registration Notice
                          </h4>
                          <p className="text-amber-800 text-sm font-bold leading-relaxed">
                            If no record is found in the resident directory, please visit the Barangay Hall and coordinate with the staff to register.
                          </p>
                        </div>
                        
                        <div className="h-px w-full bg-amber-200/60 my-1"></div>
                        
                        <div>
                          <h4 className="font-black text-amber-700 uppercase tracking-widest text-[10px] flex items-center gap-2 mb-1">
                            Paunawa
                          </h4>
                          <p className="text-amber-800/80 text-xs font-semibold leading-relaxed">
                            Kung walang rekord sa direktoryo ng residente, mangyaring pumunta sa Barangay Hall upang magparehistro sa ating mga kawani.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  `;

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, "utf-8");

    // This regex matches from the start of the emerald gradient div until right before <div className="space-y-4 md:space-y-6">
    const regex = /<div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group">[\s\S]*?(?=<div className="space-y-4 md:space-y-6">)/;

    if (regex.test(content)) {
        content = content.replace(regex, newNoticeBlock);
        fs.writeFileSync(filePath, content, "utf-8");
    } else {
        console.log("Could not match regex in: " + file);
    }
});

console.log("Notices replaced universally.");
