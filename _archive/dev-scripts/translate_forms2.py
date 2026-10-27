import os
import re

dir_path = "frontend/src/components/Forms"

# First, some tuples of (original, translation)
# We will do a generic replacement matching `> {original} <span` OR `> {original} </` OR `label...>{original}</label>`
raw_translations = {
    # Ward & Guardian
    "Guardian's Full Name": "Guardian's Full Name / Buong Pangalan ng Tagapag-alaga",
    "Guardian Information": "Guardian Information / Impormasyon ng Tagapag-alaga",
    "Search Guardian": "Search Guardian / Hanap Tagapag-alaga",
    "Person Under Guardianship \\(Ward\\)": "Person Under Guardianship (Ward) / Taong Nasa Ilalim ng Pangangalaga",
    "Search Ward": "Search Ward / Hanap Ward",
    
    # Common fields
    "Full Name": "Full Name / Buong Pangalan",
    "Requestor Details": "Requestor Details / Detalye ng Requestor",
    "Contact Information": "Contact Information / Impormasyon sa Pakikipag-ugnayan",
    "Requestor's Contact Number": "Requestor's Contact Number / Numero ng Requestor",
    "SMS Contact Number": "SMS Contact Number / Numero para sa SMS",
    "Requestor's Email": "Requestor's Email / Email ng Requestor",
    "Requestor's Email \\(Optional\\)": "Requestor's Email (Optional) / Email (Opsyonal)",
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
    "Partner Full Name": "Partner Full Name / Buong Pangalan ng Partner",
    "Number of Children": "Number of Children / Bilang ng Anak",
    "Years Living Together": "Years Living Together / Ilang Taon Nagsasama",
    "Months Living Together \\(if under 1 year\\)": "Months Living Together / Ilang Buwan Nagsasama (kung kulang 1 taon)",
    
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
    "Cause of Death / Sanhi ng Kamatayan": "Cause of Death / Sanhi ng Kamatayan",
    "Date of Death / Petsa ng Kamatayan": "Date of Death / Petsa ng Kamatayan",
    
    # Discrepancy
    "Known Aliases / AKAs": "Known Aliases / AKAs / Mga Kilalang Alyas",
    "Discrepancy Details": "Discrepancy Details / Detalye ng Pagkakaiba",
    "Document with Discrepancy": "Document with Discrepancy / Dokumentong may Pagkakaiba",
    "Correct Name / Information": "Correct Name / Information / Tamang Pangalan / Impormasyon",
    
    # Business / Educational
    "Academic Profile": "Academic Profile / Akademikong Profile",
    "Guardian's Name": "Guardian's Name / Pangalan ng Tagapag-alaga",
    "Educational Status & performance": "Educational Status & performance / Katayuan sa Edukasyon at Pagganap",
    "General Weighted Average": "General Weighted Average / Pangkalahatang Average",
    "Business Details": "Business Details / Detalye ng Negosyo",
    "Business / Trade Name": "Business / Trade Name / Pangalan ng Negosyo",
    "Owner Information": "Owner Information / Impormasyon ng May-ari",
    "Proprietor's Full Name": "Proprietor's Full Name / Buong Pangalan ng May-ari",
    "Business Registration": "Business Registration / Pagpaparehistro ng Negosyo",
    "DTI / SEC / CDA Registration No\.": "DTI / SEC / CDA Registration No. / Numero ng Rehistro",
    "Reference Number": "Reference Number / Numero ng Sanggunian",
    "Date Established": "Date Established / Petsa Kailan Itinatag",

    # Buttons and Placeholders
    "ENTER PURPOSE OF REQUEST\.\.\.": "ENTER PURPOSE OF REQUEST... / ILAGAY ANG LAYUNIN...",
    'placeholder="Select from directory\.\.\."': 'placeholder="Select from directory... / Pumili mula sa direktoryo..."',
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
    "ENTER ALIASES COMMA SEPARATED\.\.\.": "ENTER ALIASES COMMA SEPARATED... / ILAGAY ANG MGA ALYAS (NAGKAKA-HIWALAY SA KOMA)...",
    "e\.g\., Juan, Johnny\.\.\.": "e.g., Juan, Johnny... / hal., Juan, Johnny...",
    "ENTER NUMBER OF CHILDREN\.\.\.": "ENTER NUMBER OF CHILDREN... / ILAGAY ANG BILANG NG ANAK...",
    "ENTER GWA \\(E\.G\. 1\.25\\)\.\.\.": "ENTER GWA (E.G. 1.25)... / ILAGAY ANG GWA (HAL. 1.25)...",
}

for filename in os.listdir(dir_path):
    if filename.endswith(".js"):
        filepath = os.path.join(dir_path, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            original_content = content
        
        for k, v in raw_translations.items():
            # Only match exact words/labels. Not already translated ones.
            # Avoid translating "Full Name / Buong Pangalan" again.
            if v in content:
                continue # Already translated

            # Replace inside tags >Original Text< or >Original Text <span
            # Using regex: `>\s*Original Text\s*(<span|</)`
            pattern = r"(>\s*)" + k + r"(\s*(?:<span|</))"
            replacement = r"\g<1>" + v + r"\g<2>"
            content = re.sub(pattern, replacement, content)

            # Replace placeholders `placeholder="Original Text"`
            # If the k is already a placeholder like placeholder=... we just do direct string replace.
            if 'placeholder=' in k:
                content = re.sub(k, v, content)
            else:
                p_pattern = r'placeholder="' + k + r'"'
                p_repl = r'placeholder="' + v + '"'
                content = re.sub(p_pattern, p_repl, content)

                
            # Replace free standing text like >Original Text<
            content = re.sub(r">\s*" + k + r"\s*<", ">" + v + "<", content)
            
            # Additional replace for "Original Text <span"
            content = re.sub(k + r"(\s*<span )", v + r"\1", content)
            
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

print("Pass 2 translations applied.")
