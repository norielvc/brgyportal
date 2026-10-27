import os

dir_path = "frontend/src/components/Forms"

replacements = {
    # Natural Death
    "REQUESTOR NAME (RELATIVE)": "REQUESTOR NAME (RELATIVE) / PANGALAN NG REQUESTOR (KAMAG-ANAK)",
    "FULL NAME OF RELATIVE": "FULL NAME OF RELATIVE / BUONG PANGALAN NG KAMAG-ANAK",
    "REQUESTOR CONTACT NUMBER": "REQUESTOR CONTACT NUMBER / NUMERO NG REQUESTOR",
    "REQUESTOR EMAIL ADDRESS (OPTIONAL)": "REQUESTOR EMAIL ADDRESS (OPTIONAL) / EMAIL NG REQUESTOR (OPSYONAL)",
    "E.G. HEART ATTACK (MILD STROKE)": "E.G. HEART ATTACK (MILD STROKE) / HAL. INATAKE SA PUSO",

    # Same Person
    "NAME (1) - PRIMARY RECORD": "NAME (1) - PRIMARY RECORD / PANGALAN (1) - PANGUNAHING REKORD",
    "TAP HERE TO SELECT FROM RESIDENT": "TAP HERE TO SELECT FROM RESIDENT / PUMILI MULA SA RESIDENTE",
    "NAME (2) - ALSO KNOWN AS": "NAME (2) - ALSO KNOWN AS / PANGALAN (2) - KILALA RIN BILANG",
    "SECONDARY NAME / ALIAS": "SECONDARY NAME / ALIAS / IKALAWANG PANGALAN / ALYAS",
    "PLEASE CHECK ALL ENTRIES BEFORE FINAL SUBMISSION": "PLEASE CHECK ALL ENTRIES BEFORE FINAL SUBMISSION / PAKISURI ANG LAHAT NG ENTRY BAGO ISUMITE",

    # Medico Legal
    "USAPING BARANGAY NO.": "USAPING BARANGAY NO. / NUMERO NG USAPING BARANGAY",
    "DATE OF HEARING": "DATE OF HEARING / PETSA NG PAGDINIG",
    "CONTACT NO. <span": "CONTACT NO. / NUMERO NG TELEPONO <span",
    "Note:": "Note / Paunawa:",
    "The Barangay Administrator will contact you via this number regarding the official status or schedule of your request.": "The Barangay Administrator will contact you via this number regarding the official status or schedule of your request. / Makikipag-ugnayan ang Barangay Administrator sa numerong ito patungkol sa estado o iskedyul ng iyong request.",
    "VERIFY ALL INFORMATION BEFORE STARTING THE APPROVAL WORKFLOW": "VERIFY ALL INFORMATION BEFORE STARTING THE APPROVAL WORKFLOW / SURIIN ANG LAHAT NG IMPORMASYON BAGO SIMULAN ANG PROSESO NG PAG-APRUBA",
    ">CANCEL<": ">CANCEL / KANSELAHIN<",

    # Cohabitation
    "COMMON RESIDENTIAL ADDRESS": "COMMON RESIDENTIAL ADDRESS / KASALUKUYANG TIRAHAN",
    "SELECT RESIDENTS TO ENABLE QUICK SYNC": "SELECT RESIDENTS TO ENABLE QUICK SYNC / PUMILI NG RESIDENTE PARA SA QUICK SYNC",
    "Enter or sync shared residential address...": "Enter or sync shared residential address... / Ilagay o i-sync ang kasalukuyang tirahan...",
    "THIS ADDRESS WILL BE PRINTED AS YOUR SHARED HOME IN THE CERTIFICATE.": "THIS ADDRESS WILL BE PRINTED AS YOUR SHARED HOME IN THE CERTIFICATE. / ANG ADDRESS NA ITO AY IPI-PRINT BILANG INYONG TIRAHAN SA SERTIPIKO.",
    "YEARS TOGETHER": "YEARS TOGETHER / ILANG TAONG NAGSASAMA",
    "MONTHS TOGETHER": "MONTHS TOGETHER / ILANG BUWANG NAGSASAMA",
    "COMMON-LAW PARTNERSHIP CERTIFICATION": "COMMON-LAW PARTNERSHIP CERTIFICATION / SERTIPIKASYON NG PAGSASAMA",
    "SUBMIT FOR REVIEW": "SUBMIT FOR REVIEW / ISUMITE PARA SURIIN",

    # Residency
    "Where to receive your updates": "Where to receive your updates / Kung saan matatanggap ang mga update",
    "Notifications will be sent here": "Notifications will be sent here / Dito ipapadala ang mga abiso",
    "REQUEST PURPOSE": "REQUEST PURPOSE / LAYUNIN NG REQUEST",
    "E.G. SCHOOL ENROLLMENT, ID APPLICATION...": "E.G. SCHOOL ENROLLMENT, ID APPLICATION... / HAL. PAG-ENROLL SA PAARALAN, PAGKUHA NG ID...",

    # Others globally
    "NEW APPLICATION REQUEST": "NEW APPLICATION REQUEST / BAGONG APLIKASYON",
    "NEW RESIDENCY REQUEST": "NEW RESIDENCY REQUEST / BAGONG REQUEST NG RESIDENCY",
}

for filename in os.listdir(dir_path):
    if filename.endswith(".js"):
        filepath = os.path.join(dir_path, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            original_content = content
        
        for k, v in replacements.items():
            if v in content:
                continue
            content = content.replace(k, v)
            
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

print("Pass 6 specific replacements applied.")
