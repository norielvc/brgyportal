import os
import re

dir_path = "frontend/src/components/Forms"

translations = {
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
    r"Level \/ Grade \(A\.Y\. 2024-2025\)": "Level / Grade (A.Y. 2024-2025) / Taon o Antas",
    
    # Placeholders
    "ENTER HOUSE NUMBER\.\.\.": "ENTER HOUSE NUMBER... / ILAGAY ANG NUMERO NG BAHAY...",
    "Select from directory\.\.\.": "Select from directory... / Pumili mula sa direktoryo...",
    "TAP SEARCH BUTTON TO SELECT WARD\.\.\.": "TAP SEARCH BUTTON TO SELECT WARD... / PINDUTIN ANG SEARCH...",
    "TAP SEARCH BUTTON TO SELECT GUARDIAN\.\.\.": "TAP SEARCH BUTTON TO SELECT GUARDIAN... / PINDUTIN ANG SEARCH...",
    "TAP SEARCH BUTTON TO SELECT PARTNER\.\.\.": "TAP SEARCH BUTTON TO SELECT PARTNER... / PINDUTIN ANG SEARCH...",
    "TAP TO SELECT PATIENT\.\.\.": "TAP TO SELECT PATIENT... / PINDUTIN UPANG PUMILI NG PASYENTE...",
    "TAP SEARCH BUTTON TO FILL DETAILS\.\.\.": "TAP SEARCH BUTTON TO FILL DETAILS... / PINDUTIN PARA PUNO ANG DETALYE...",
    "TAP TO SELECT DECEASED\.\.\.": "TAP TO SELECT DECEASED... / PINDUTIN UPANG PUMILI NG NAMATAY...",
    "ENTER INCIDENT NATURE\.\.\.": "ENTER INCIDENT NATURE... / ILAGAY ANG URI NG INSIDENTE...",
    "ENTER LOCATION\.\.\.": "ENTER LOCATION... / ILAGAY ANG LOKASYON...",
    "ENTER DOCTOR'S NAME\.\.\.": "ENTER DOCTOR'S NAME... / ILAGAY ANG PANGALAN NG DOKTOR...",
    "E\.G\., PNP IBA, RELATIVE\.\.\.": "E.G., PNP IBA, RELATIVE... / HAL., PNP IBA, KAMAG-ANAK...", 
    "ENTER GUARDIAN'S NAME\.\.\.": "ENTER GUARDIAN'S NAME... / ILAGAY ANG PANGALAN NG TAGAPAG-ALAGA...",
    "ENTER COMPLETE BUSINESS NAME\.\.\.": "ENTER COMPLETE BUSINESS NAME... / ILAGAY ANG BUONG PANGALAN NG NEGOSYO...",
    "ENTER OWNER'S FULL NAME\.\.\.": "ENTER OWNER'S FULL NAME... / ILAGAY ANG PANGALAN NG MAY-ARI...",
    "E\.G\., BIRTH CERTIFICATE, SSS ID\.\.\.": "E.G., BIRTH CERTIFICATE, SSS ID... / HAL., BIRTH CERTIFICATE, SSS ID...",
    "ENTER CORRECT INFORMATION\.\.\.": "ENTER CORRECT INFORMATION... / ILAGAY ANG TAMANG IMPORMASYON...",
    "ENTER ALIASES COMMA SEPARATED\.\.\.": "ENTER ALIASES COMMA SEPARATED... / ILAGAY ANG MGA ALYAS...",
    "e\.g\., Juan, Johnny\.\.\.": "e.g., Juan, Johnny... / hal., Juan, Johnny...",
    "ENTER NUMBER OF CHILDREN\.\.\.": "ENTER NUMBER OF CHILDREN... / ILAGAY ANG BILANG NG ANAK...",
    r"ENTER GWA \(E\.G\. 1\.25\)\.\.\.": "ENTER GWA (E.G. 1.25)... / ILAGAY ANG GWA (HAL. 1.25)...",
    "ENTER PURPOSE OF REQUEST\.\.\.": "ENTER PURPOSE OF REQUEST... / ILAGAY ANG LAYUNIN...",
    
    # Ward & Guardian
    "Guardian's Full Name": "Guardian's Full Name / Buong Pangalan ng Tagapag-alaga",
    "Guardian Information": "Guardian Information / Impormasyon ng Tagapag-alaga",
    "Search Guardian": "Search Guardian / Hanap Tagapag-alaga",
    r"Person Under Guardianship \(Ward\)": "Person Under Guardianship (Ward) / Taong Nasa Ilalim ng Pangangalaga",
    "Search Ward": "Search Ward / Hanap Ward",
    "Search Partner": "Search Partner / Hanap Kapareha",
    "Search Resident": "Search Resident / Hanap Residente",
    
    # Common fields
    "Full Name": "Full Name / Buong Pangalan",
    "Requestor Details": "Requestor Details / Detalye ng Requestor",
    "Contact Information": "Contact Information / Impormasyon sa Pakikipag-ugnayan",
    "Requestor's Contact Number": "Requestor's Contact Number / Numero ng Requestor",
    "SMS Contact Number": "SMS Contact Number / Numero para sa SMS",
    r"Requestor's Email \(Optional\)": "Requestor's Email (Optional) / Email (Opsyonal)",
    "Requestor's Email": "Requestor's Email / Email ng Requestor",
    "Purpose of Request": "Purpose of Request / Layunin ng Request",
    "Relationship": "Relationship / Relasyon",
    "Gender": "Gender / Kasarian",
    
    # Same Person
    "First Person Details": "First Person Details / Detalye ng Unang Tao",
    "Second Person Details": "Second Person Details / Detalye ng Ikalawang Tao",
    "Primary resident making the request": "Primary resident making the request / Pangunahing residente na nagre-request",
    
    # Cohabitation
    "Partner's Details": "Partner's Details / Detalye ng Partner",
    "Partnership Details": "Partnership Details / Detalye ng Pagsasama",
    "Number of Children": "Number of Children / Bilang ng Anak",
    "Years Living Together": "Years Living Together / Ilang Taon Nagsasama",
    r"Months Living Together \(if under 1 year\)": "Months Living Together / Ilang Buwan Nagsasama (kung kulang 1 taon)",
    
    # Medico / Death
    "Deceased Information": "Deceased Information / Impormasyon ng Namatay",
    "Patient Information": "Patient Information / Impormasyon ng Pasyente",
    "Investigation Details": "Investigation Details / Detalye ng Imbestigasyon",
    "Date of Examination": "Date of Examination / Petsa ng Pagsusuri",
    "Time of Examination": "Time of Examination / Oras ng Pagsusuri",
    "Nature of Incident": "Nature of Incident / Uri ng Insidente",
    "Place of Incident": "Place of Incident / Lugar ng Insidente",
    "Examining Physician": "Examining Physician / Sumuring Doktor",
    "Requesting Party": "Requesting Party / Humihiling na Partido",
    
    # Discrepancy
    "Known Aliases / AKAs": "Known Aliases / AKAs / Mga Kilalang Alyas",
    "Discrepancy Details": "Discrepancy Details / Detalye ng Pagkakaiba",
    "Document with Discrepancy": "Document with Discrepancy / Dokumentong may Pagkakaiba",
    "Correct Name / Information": "Correct Name / Information / Tamang Pangalan / Impormasyon",
    
    # Business / Educational
    "Academic Profile": "Academic Profile / Akademikong Profile",
    "Guardian's Name": "Guardian's Name / Pangalan ng Tagapag-alaga",
    "Educational Status & performance": "Educational Status & performance / Katayuan sa Edukasyon",
    "General Weighted Average": "General Weighted Average / Pangkalahatang Average",
    "Business Details": "Business Details / Detalye ng Negosyo",
    "Business / Trade Name": "Business / Trade Name / Pangalan ng Negosyo",
    "Owner Information": "Owner Information / Impormasyon ng May-ari",
    "Proprietor's Full Name": "Proprietor's Full Name / Buong Pangalan ng May-ari",
    "Business Registration": "Business Registration / Pagpaparehistro ng Negosyo",
    r"DTI / SEC / CDA Registration No\.": "DTI / SEC / CDA Registration No. / Numero ng Rehistro",
    "Reference Number": "Reference Number / Numero ng Sanggunian",
    "Date Established": "Date Established / Petsa Kailan Itinatag",

    # Buttons
    "Review & Submit": "Review & Submit / Suriin at Isumite",
    "Go Back & Edit": "Go Back & Edit / Bumalik sa Pag-edit",
    "Confirm & Submit": "Confirm & Submit / Kumpirmahin at Isumite",
    "Submit Application": "Submit Application / Ipadala ang Aplikasyon",
    "Confirm Submission": "Confirm Submission / Kumpirmahin ang Pagsusumite",
    "Go Back": "Go Back / Bumalik",
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
        
        for k, v in sorted(translations.items(), key=lambda x: len(x[0]), reverse=True):
            if v in content:
                continue

            # In elements: `>Text<`
            patt_tags = r"(>\s*)" + k + r"(\s*<)"
            content = re.sub(patt_tags, r"\1" + v + r"\2", content)
            
            # Text inside span `>Text</span`
            patt_span = r"(>\s*)" + k + r"(\s*</)"
            content = re.sub(patt_span, r"\1" + v + r"\2", content)
            
            # Placeholders
            if 'placeholder' in k:
                content = re.sub(k, v, content)
            else:
                p_pattern = r'placeholder="' + k + r'"'
                p_repl = r'placeholder="' + v + '"'
                content = re.sub(p_pattern, p_repl, content)
                
            # Text floating near icons, e.g. `\n   Review & Submit\n`
            patt_loose = r"(\n\s*)" + k + r"(\s*\n)"
            content = re.sub(patt_loose, r"\1" + v + r"\2", content)

            # Special case for `<Icon /> Text` where there's no newline
            # `<Icon className="..." />Text<`
            patt_icon_text = r"(/>\s*)" + k + r"(\s*<)"
            content = re.sub(patt_icon_text, r"\1" + v + r"\2", content)

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

print("Pass ALL applied cleanly.")
