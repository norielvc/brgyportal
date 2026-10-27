import os
import re

files_to_fix = [
    'NaturalDeathCertificateModal.js',
    'SamePersonCertificateModal.js',
    'GuardianshipCertificateModal.js'
]

directory = r'c:\Users\SCREENS\OneDrive\Desktop\Admin dashboard\frontend\src\components\Forms'

replacement_content = r"""              <div className="flex-1 overflow-y-auto px-6 py-8 bg-gray-50/80">
                <div className="max-w-2xl mx-auto space-y-4">
                  {Object.entries(formData).map(([key, value]) => {
                    if (!value || key === 'residentId' || key === 'signature' || key === 'details') return null;
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return (
                      <div key={key} className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 bg-white shadow-sm border border-gray-100 rounded-[1.25rem] hover:bg-gray-50 transition-colors group">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{formattedKey}</span>
                        <span className="text-sm font-bold text-gray-900 break-words md:text-right mt-1 md:mt-0 group-hover:text-emerald-700 transition-colors uppercase">{typeof value === 'object' ? JSON.stringify(value) : value.toString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>"""

# Variations for indentation
replacement_content_4space = r"""                            <div className="flex-1 overflow-y-auto px-6 py-8 bg-gray-50/80">
                                <div className="max-w-2xl mx-auto space-y-4">
                                    {Object.entries(formData).map(([key, value]) => {
                                        if (!value || key === 'residentId' || key === 'signature' || key === 'details') return null;
                                        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                        return (
                                            <div key={key} className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 bg-white shadow-sm border border-gray-100 rounded-[1.25rem] hover:bg-gray-50 transition-colors group">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{formattedKey}</span>
                                                <span className="text-sm font-bold text-gray-900 break-words md:text-right mt-1 md:mt-0 group-hover:text-emerald-700 transition-colors uppercase">{typeof value === 'object' ? JSON.stringify(value) : value.toString()}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>"""

pattern = re.compile(r'(\s*)<div className="flex-1 overflow-y-auto p-4 bg-gray-100">.*?</div>\s*</div>', re.DOTALL)

for filename in files_to_fix:
    filepath = os.path.join(directory, filename)
    if not os.path.exists(filepath):
        print(f"File {filename} not found.")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Determine base indentation
    match = pattern.search(content)
    if match:
        indent = match.group(1)
        if len(indent) > 10: # Likely 28 spaces or similar
            # Use a generic replacement and adjust indent
            # But for simplicity, I'll use the two I prepared
            if filename in ['SamePersonCertificateModal.js', 'GuardianshipCertificateModal.js']:
                rep = replacement_content_4space
            else:
                rep = replacement_content
            
            new_content = pattern.sub(rep, content)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed {filename}")
        else:
            new_content = pattern.sub(replacement_content, content)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed {filename}")
    else:
        print(f"Could not find pattern in {filename}")
