import os
import re

dir_path = "frontend/src/components/Forms"

translations = {
    # Headers
    "Barangay Clearance Request": "Barangay Clearance Request / Hiling na Barangay Clearance",
    "Partner Details": "Partner Details / Detalye ng Kapareha",
    "Partner Full Name": "Partner Full Name / Buong Pangalan ng Kapareha",
    "Date of Birth": "Date of Birth / Petsa ng Kapanganakan",
    "Current Age": "Current Age / Kasalukuyang Edad",
    
    # Forms and Edges
    "House Number": "House Number / Numero ng Bahay",
    "Phase": "Phase / Bahagi",
    "Block": "Block / Bloke",
    "Lot": "Lot / Lote",
    "Identification Number": "Identification Number / Numero ng Pagkakakilanlan",
    "Level / Grade \\(A\\.Y\\. 2024-2025\\)": "Level / Grade (A.Y. 2024-2025) / Taon o Antas",
    
    # Placeholders missing
    "ENTER HOUSE NUMBER\.\.\.": "ENTER HOUSE NUMBER... / ILAGAY ANG NUMERO NG BAHAY...",
    
    # Buttons
    "REVIEW & SUBMIT": "REVIEW & SUBMIT / SURIIN AT ISUMITE",
    "Go Back to Edit": "Go Back to Edit / Bumalik sa Pag-edit",
    "CONFIRM SUBMISSION": "CONFIRM SUBMISSION / KUMPIRMAHIN ANG PAGSUSUMITE",
    "GO BACK": "GO BACK / BUMALIK",
    "Preview Certificate Format": "Preview Certificate Format / Pormat ng Katibayan",
    
    # Others
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

            # Tag match `>Text<` or `>Text</`
            pattern = r"(>\s*)" + k + r"(\s*(?:<span|</))"
            replacement = r"\g<1>" + v + r"\g<2>"
            content = re.sub(pattern, replacement, content)

            if 'placeholder=' in k:
                content = re.sub(k, v, content)
            else:
                p_pattern = r'placeholder="' + k + r'"'
                p_repl = r'placeholder="' + v + '"'
                content = re.sub(p_pattern, p_repl, content)

            # Match for uppercase tags like ">REVIEW & SUBMIT<" or "REVIEW &amp; SUBMIT" ? Wait, ampersand might be there?
            if "&" in k:
                k_amp = k.replace("&", r"&amp;")
                v_amp = v.replace("&", "&amp;")
                
                content = re.sub(r">\s*" + k_amp + r"\s*<", ">" + v_amp + "<", content)
                content = re.sub(r">\s*" + k + r"\s*<", ">" + v + "<", content)
            else:
                content = re.sub(r">\s*" + k + r"\s*<", ">" + v + "<", content)
                
            # For `<span ` right after
            content = re.sub(k + r"(\s*<span )", v + r"\1", content)
            
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

print("Pass 3 translations applied.")
