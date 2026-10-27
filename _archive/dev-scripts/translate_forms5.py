import os
import re

dir_path = "frontend/src/components/Forms"

translations = {
    "Review & Submit": "Review & Submit / Suriin at Isumite",
    "Go Back & Edit": "Go Back & Edit / Bumalik sa Pag-edit",
    "Confirm & Submit": "Confirm & Submit / Kumpirmahin at Isumite",
    "Submit Application": "Submit Application / Ipadala ang Aplikasyon",
    "Confirm Submission": "Confirm Submission / Kumpirmahin ang Pagsusumite",
    "Go Back": "Go Back / Bumalik",
    "Search Ward": "Search Ward / Hanap Ward",
    "Search Resident": "Search Resident / Hanap Residente",
    "Search Guardian": "Search Guardian / Hanap Tagapag-alaga",
    "Search Partner": "Search Partner / Hanap Kapareha",
    "Select from directory\.\.\.": "Select from directory... / Pumili mula sa direktoryo...",
}

for filename in os.listdir(dir_path):
    if filename.endswith(".js"):
        filepath = os.path.join(dir_path, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            original_content = content
        
        for k, v in translations.items():
            if v in content:
                continue
            
            # Match `>\s*k` (e.g. `> Review & Submit`)
            content = re.sub(r"(>\s*)" + k, r"\g<1>" + v, content)
            
            # Match `k\s*</`
            content = re.sub(k + r"(\s*</)", v + r"\g<1>", content)
            
            # Match `\n\s*k\n`
            content = re.sub(r"(\n\s*)" + k + r"(\s*\n)", r"\g<1>" + v + r"\g<2>", content)

            # Match for buttons strictly `k</button>`
            content = content.replace(k + "</button>", v + "</button>")
            
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

print("Pass 5 translations applied.")
