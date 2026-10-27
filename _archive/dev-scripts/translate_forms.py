import os
import re

dir_path = "frontend/src/components/Forms"

translations = {
    r">Full Name<": ">Full Name / Buong Pangalan<",
    r">Search Resident<": ">Search Resident / Hanapin<",
    r">Search Ward<": ">Search Ward / Hanapin<",
    r">Search Guardian<": ">Search Guardian / Hanapin<",
    r">Guardian Information<": ">Guardian Information / Impormasyon ng Tagapag-alaga<",
    r">Guardian's Full Name<": ">Guardian's Full Name / Buong Pangalan<",
    r">Person Under Guardianship \(Ward\)<": ">Person Under Guardianship (Ward) / Taong Nasa Ilalim ng Pangangalaga<",
    r">Relationship<": ">Relationship / Relasyon<",
    r">Contact Information<": ">Contact Information / Impormasyon sa Pakikipag-ugnayan<",
    r">Requestor's Contact Number": ">Requestor's Contact Number / Numero ng Requestor",
    r">Requestor's Email": ">Requestor's Email / Email ng Requestor",
    r">Requestor Details<": ">Requestor Details / Detalye ng Requestor<",
    r">Purpose of Request": ">Purpose of Request / Layunin ng Request",
    r"ENTER PURPOSE OF REQUEST\.\.\.": "ENTER PURPOSE OF REQUEST... / ILAGAY ANG LAYUNIN...",
    r'placeholder="Select from directory\.\.\."': 'placeholder="Select from directory... / Pumili mula sa direktoryo..."',
    r">First Person Details<": ">First Person Details / Detalye ng Unang Tao<",
    r">Second Person Details<": ">Second Person Details / Detalye ng Ikalawang Tao<",
    r">Primary resident making the request<": ">Primary resident making the request / Pangunahing residente na nagre-request<",
    r">Partner's Details<": ">Partner's Details / Detalye ng Partner<",
    r">Partnership Details<": ">Partnership Details / Detalye ng Pagsasama<",
    r">Number of Children<": ">Number of Children / Bilang ng Anak<",
    r">Years Living Together<": ">Years Living Together / Ilang Taon Nagsasama<",
    r">Months Living Together \(if under 1 year\)<": ">Months Living Together / Ilang Buwan Nagsasama (kung kulang 1 taon)<",
    r"TAP SEARCH BUTTON TO SELECT WARD\.\.\.": "TAP SEARCH BUTTON TO SELECT WARD... / PINDUTIN ANG SEARCH...",
    r"TAP SEARCH BUTTON TO SELECT GUARDIAN\.\.\.": "TAP SEARCH BUTTON TO SELECT GUARDIAN... / PINDUTIN ANG SEARCH...",
    r"TAP TO SELECT PATIENT\.\.\.": "TAP TO SELECT PATIENT... / PINDUTIN UPANG PUMILI NG PASYENTE...",
    r"TAP SEARCH BUTTON TO FILL DETAILS\.\.\.": "TAP SEARCH BUTTON TO FILL DETAILS... / PINDUTIN PARA PUNO ANG DETALYE...",
    r">Patient Information<": ">Patient Information / Impormasyon ng Pasyente<",
    r">Investigation Details<": ">Investigation Details / Detalye ng Imbestigasyon<",
    r">Date of Examination": ">Date of Examination / Petsa ng Pagsusuri",
    r">Time of Examination": ">Time of Examination / Oras ng Pagsusuri",
    r">Nature of Incident": ">Nature of Incident / Uri ng Insidente",
    r">Place of Incident": ">Place of Incident / Lugar ng Insidente",
    r">Examining Physician": ">Examining Physician / Sumuring Doktor",
    r">Requesting Party": ">Requesting Party / Humihiling na Partido",
    r"ENTER INCIDENT NATURE\.\.\.": "ENTER INCIDENT NATURE... / ILAGAY ANG URI NG INSIDENTE...",
    r"ENTER LOCATION\.\.\.": "ENTER LOCATION... / ILAGAY ANG LOKASYON...",
    r"ENTER DOCTOR'S NAME\.\.\.": "ENTER DOCTOR'S NAME... / ILAGAY ANG PANGALAN NG DOKTOR...",
    r"E\.G\., PNP IBA, RELATIVE\.\.\.": "E.G., PNP IBA, RELATIVE... / HAL., PNP IBA, KAMAG-ANAK...", 
    r">Deceased Information<": ">Deceased Information / Impormasyon ng Namatay<",
    r">Known Aliases / AKAs": ">Known Aliases / AKAs / Mga Kilalang Alyas",
    r">Discrepancy Details<": ">Discrepancy Details / Detalye ng Pagkakaiba<",
    r">Document with Discrepancy": ">Document with Discrepancy / Dokumentong may Pagkakaiba",
    r"E\.G\., BIRTH CERTIFICATE, SSS ID\.\.\.": "E.G., BIRTH CERTIFICATE, SSS ID... / HAL., BIRTH CERTIFICATE, SSS ID...",
    r">Academic Profile<": ">Academic Profile / Akademikong Profile<",
    r">Guardian's Name": ">Guardian's Name / Pangalan ng Tagapag-alaga",
    r"ENTER GUARDIAN'S NAME\.\.\.": "ENTER GUARDIAN'S NAME... / ILAGAY ANG PANGALAN NG TAGAPAG-ALAGA...",
    r">Educational Status & performance<": ">Educational Status & performance / Katayuan sa Edukasyon at Pagganap<",
    r">General Weighted Average": ">General Weighted Average / Pangkalahatang Average",
    r">Business Details<": ">Business Details / Detalye ng Negosyo<",
    r">Business / Trade Name": ">Business / Trade Name / Pangalan ng Negosyo",
    r"ENTER COMPLETE BUSINESS NAME\.\.\.": "ENTER COMPLETE BUSINESS NAME... / ILAGAY ANG BUONG PANGALAN NG NEGOSYO...",
    r">Owner Information<": ">Owner Information / Impormasyon ng May-ari<",
    r">Proprietor's Full Name": ">Proprietor's Full Name / Buong Pangalan ng May-ari",
    r"ENTER OWNER'S FULL NAME\.\.\.": "ENTER OWNER'S FULL NAME... / ILAGAY ANG PANGALAN NG MAY-ARI...",
    r">Business Registration<": ">Business Registration / Pagpaparehistro ng Negosyo<",
    r">DTI / SEC / CDA Registration No\.": ">DTI / SEC / CDA Registration No. / Numero ng Rehistro",
    r">Reference Number<": ">Reference Number / Numero ng Sanggunian<",
}

for filename in os.listdir(dir_path):
    if filename.endswith(".js"):
        filepath = os.path.join(dir_path, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for k, v in translations.items():
            content = re.sub(k, v, content)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print("Translations applied.")
