import os
import re

dir_path = "frontend/src/components/Forms"

translations = {
    # Buttons
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
    
    # Randoms
    "Please verify all data for commercial accuracy": "Please verify all data for commercial accuracy / Pakisuri ang lahat ng datos para sa katumpakan",
    "Please verify all information before submission": "Please verify all information before submission / Pakisuri ang lahat ng impormasyon bago isumite",
    "Verify information before final filing": "Verify information before final filing / Suriin ang impormasyon bago ang pinal na pagpapasa",
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

            # Need to be very careful with "&" matching. 
            # In JSX, "Review & Submit" might be written literally or "Review &amp; Submit".
            # Let's replace literally.
            
            # 1. Plain text replacement `>Text<`
            content = content.replace(">" + k + "<", ">" + v + "<")
            
            # 2. Inside a tag where text is followed by an icon (so no `</` or `<span` immediately? wait, `>Text</button>`)
            content = content.replace(k + "</button>", v + "</button>")
            
            # 3. Followed by `<` usually, like `Review & Submit</span>`
            content = content.replace(k + "<", v + "<")
            
            # 4. Text loose like `> Review & Submit `
            content = content.replace(">" + k, ">" + v)
            
            
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

print("Pass 4 translations applied.")
