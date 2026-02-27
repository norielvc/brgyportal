const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "frontend", "src", "components", "Forms");
const files = fs.readdirSync(dir).filter(f => f.endsWith("Modal.js") && f !== "ResidentSearchModal.js");

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, "utf-8");

    // We want to replace the `grid` that comes right after the Full Name input.
    // We can look for:
    // <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
    // ...
    // </div>
    // The simplest reliable way for this specific structure:
    const split1 = content.split(/<div className="grid grid-cols-1 md:grid-cols-2 gap-6( pb-6)?">/);

    if (split1.length > 1) {
        let replacedContent = split1[0];
        for (let i = 2; i < split1.length; i += 2) {
            // split1[1] is the ( pb-6)? capture group
            const remainder = split1[i];

            // Find the matching closing </div> for the grid
            // Since it's a grid with space-y-2 divs inside, let's just use string finding to find the start of the next section.
            // The next section usually starts with `<div className="pt-6 border-t border-gray-100">`
            const nextSectionIndex = remainder.indexOf('<div className="pt-6 border-t border-gray-100">');

            if (nextSectionIndex !== -1) {
                replacedContent += `
                    {formData.fullName && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mt-4 flex items-center justify-center gap-2 text-emerald-700 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            <span className="text-xs font-black uppercase tracking-widest italic">Personal Data Protected Under Data Privacy Act</span>
                        </div>
                    )}
                    ` + remainder.substring(nextSectionIndex);
            } else {
                replacedContent += '<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">' + remainder;
            }
        }

        // Some forms don't have "pt-6 border-t border-gray-100" exactly, or the grid uses gap-6 without pb-6
        fs.writeFileSync(filePath, replacedContent, "utf-8");
    }
});

console.log("Forms updated to hide data.");
