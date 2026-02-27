const fs = require("fs");
const path = require("path");

const directoryPath = path.join(__dirname, "frontend", "src", "components", "Forms");
const files = fs.readdirSync(directoryPath).filter(f => f.endsWith("Modal.js"));

files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    let content = fs.readFileSync(filePath, "utf-8");

    // 1. Optimize padding and margins in the form body
    content = content.replace(/p-8 space-y-10/g, "p-4 md:p-6 space-y-6");
    content = content.replace(/space-y-8/g, "space-y-4 md:space-y-6");
    content = content.replace(/px-4 py-4 md:px-8 md:py-6/g, "px-4 py-3 md:px-6 md:py-4");
    content = content.replace(/px-4 py-4 md:px-8 md:py-7/g, "px-4 py-3 md:px-6 md:py-4");

    // Format the red banner in the header
    content = content.replace(/<p className=\"text-emerald-50\/90 text-\[10px\] md:text-xs font-bold uppercase tracking-widest px-2 py-0\.5 bg-white\/10 rounded-full border border-white\/5\">/g,
        "<p className=\"text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 bg-red-600 rounded-l-full rounded-tr-md rounded-br-md shadow-md\">"
    );
    content = content.replace(/<p className=\"text-green-100\/80 text-\[10px\] md:text-sm font-bold uppercase tracking-widest leading-none\">/g,
        "<p className=\"text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 bg-red-600 rounded-l-full rounded-tr-md rounded-br-md shadow-md mt-2 block\">"
    );

    // Re-style the step headers to look like the lime green bar with a white number circle
    // We'll replace the outer container of the step header to have the green background
    content = content.replace(/<div className=\"flex items-center gap-3( mb-8)?\">/g,
        "<div className=\"flex items-center gap-4 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-xl p-2 pr-6 shadow-sm mb-6\">"
    );
    content = content.replace(/<div className=\"flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4\">(\s*)<div className=\"flex items-center gap-3\">/g,
        "<div className=\"flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4\">$1<div className=\"flex items-center gap-4 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-xl p-2 pr-6 shadow-sm w-full md:w-auto\">"
    );
    content = content.replace(/<div className=\"flex items-center gap-4 border-b border-gray-100 pb-5\">\s*<div/g,
        "<div className=\"flex items-center gap-4 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-xl p-2 pr-6 shadow-sm mb-6\">\n<div"
    );

    // Replace the number container (e.g. <div className="w-10 h-10 bg-[#112e1f] ...">1</div>)
    content = content.replace(/<div className=\"w-1[02] h-1[02] bg-\[[^\]]+\] text-white rounded-[^ ]+ flex items-center justify-center font-[^ ]+ text-[^ ]+ shadow-[^ ]+[^"]*\">(\d+)<\/div>/g,
        "<div className=\"w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-black text-2xl shadow-sm shrink-0\">$1</div>"
    );
    content = content.replace(/<div className=\"w-1[02] h-1[02] bg-[a-z0-9-]+ text-white rounded-[^ ]+ flex items-center justify-center font-[^ ]+ text-[^ ]+ shadow-[^ ]+[^"]*\">(\d+)<\/div>/g,
        "<div className=\"w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-black text-2xl shadow-sm shrink-0\">$1</div>"
    );

    // Adjust the text color inside the green step header to be white
    content = content.replace(/<h3 className=\"text-xl font-bold text-gray-900\">/g, "<h3 className=\"text-lg md:text-xl font-bold text-white\">");
    content = content.replace(/<h3 className=\"text-xl font-black text-gray-900 tracking-tight\">/g, "<h3 className=\"text-lg md:text-xl font-black text-white tracking-tight\">");

    content = content.replace(/<p className=\"text-sm text-gray-500 font-medium tracking-wide\">/g, "<p className=\"text-xs text-white/90 font-medium tracking-wide\">");
    content = content.replace(/<p className=\"text-sm text-gray-500 font-bold uppercase tracking-widest opacity-60\">/g, "<p className=\"text-xs text-white/90 font-bold uppercase tracking-widest\">");

    // Adjust the main submit buttons to be green
    content = content.replace(/from-\[\#112e1f\] to-\[\#2d5a3d\] hover:from-\[\#2d5a3d\] hover:to-\[\#112e1f\]/g,
        "from-[#8cc63f] to-[#7cb342] hover:from-[#7cb342] hover:to-[#689f38]"
    );

    fs.writeFileSync(filePath, content, "utf-8");
});

console.log("Styling applied to all forms.");
