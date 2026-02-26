
const fs = require("fs");
const path = require("path");

const directoryPath = __dirname;
const files = fs.readdirSync(directoryPath).filter(f => f.endsWith("Modal.js"));

const dictionary = {
  ">Registered Business Name": ">Registered Business Name / Rehistradong Pangalan ng Negosyo",
  ">Industry Classification": ">Industry Classification / Uri ng Industriya",
  ">Commercial Address": ">Commercial Address / Address ng Negosyo",
  ">Business Telephone/Mobile": ">Business Telephone/Mobile / Telepono o Mobile ng Negosyo",
  ">Business Email Address (Optional)": ">Business Email Address (Optional) / Email ng Negosyo (Opsyonal)",
  ">First Name": ">First Name / Pangalan",
  ">Last Name": ">Last Name / Apelyido",
  ">Owner Residential Address": ">Owner Residential Address / Tirahan ng May-ari",
  ">Owner Mobile Number": ">Owner Mobile Number / Numero ng Mobile ng May-ari",
  ">Owner Email (Optional)": ">Owner Email (Optional) / Email ng May-ari (Opsyonal)",
  ">Detailed Nature of Operations": ">Detailed Nature of Operations / Detalyadong Uri ng Operasyon",
  ">Capital Investment (Est. PHP)": ">Capital Investment (Est. PHP) / Puhunan (Est. PHP)",
  ">Force size (Employees)": ">Force size (Employees) / Bilang ng Empleyado",
  ">Application Intent": ">Application Intent / Layunin ng Aplikasyon",
  ">Detailed Purpose of Report": ">Detailed Purpose of Report / Detalyadong Layunin ng Ulat",
  ">Relationship to Minor": ">Relationship to Minor / Relasyon sa Menor de Edad",
  ">Minor Full Name": ">Minor Full Name / Buong Pangalan ng Menor de Edad",
  ">Date of Birth (Minor)": ">Date of Birth (Minor) / Petsa ng Kapanganakan (Menor de Edad)",
  ">Purpose of Guardianship": ">Purpose of Guardianship / Layunin ng Pagiging Tagapag-alaga",
  ">Purpose of Indigency": ">Purpose of Indigency / Layunin ng Indigency",
  ">Cause of Incident/Injury": ">Cause of Incident/Injury / Sanhi ng Insidente o Pinsala",
  ">Date/Time of Incident": ">Date/Time of Incident / Petsa/Oras ng Insidente",
  ">Place of Incident": ">Place of Incident / Lugar ng Insidente",
  ">Treating Physician/Hospital": ">Treating Physician/Hospital / Gagamot na Doktor o Ospital",
  ">Primary Reason for Request": ">Primary Reason for Request / Pangunahing Dahilan ng Request",
  ">Educational Attainment": ">Educational Attainment / Antas ng Edukasyon",
  ">School/University Name": ">School/University Name / Pangalan ng Paaralan/Unibersidad",
  ">Course/Grade Level": ">Course/Grade Level / Kurso o Antas ng Grado",
  ">Student ID Number": ">Student ID Number / Numero ng ID ng Estudyante",
  ">General Purpose of Certification": ">General Purpose of Certification / Pangkalahatang Layunin ng Sertipikasyon",
  "Partner Full Name": "Partner Full Name / Buong Pangalan ng Kapareha",
  ">Years Cohabiting": ">Years Cohabiting / Taon ng Pagsasama",
  "Number of Children (If any)": "Number of Children (If any) / Bilang ng mga Anak (Kung mayroon)",
  ">Purpose of Certification": ">Purpose of Certification / Layunin ng Sertipikasyon",
  ">Deceased Full Name": ">Deceased Full Name / Buong Pangalan ng Namatay",
  ">Date of Death": ">Date of Death / Petsa ng Kamatayan",
  ">Place of Death": ">Place of Death / Lugar ng Kamatayan",
  ">Cause of Death": ">Cause of Death / Sanhi ng Kamatayan",
  ">Place of Burial": ">Place of Burial / Lugar ng Paglilibing",
  ">Claimant Name (Informant)": ">Claimant Name (Informant) / Pangalan ng Kumukuha (Impornante)",
  ">Relationship to Deceased": ">Relationship to Deceased / Relasyon sa Namatay",
  ">Name Format 1 (e.g. Maiden Name)": ">Name Format 1 (e.g. Maiden Name) / Unang Format ng Pangalan (hal. Apelyido sa pagkadalaga)",
  ">Name Format 2 (e.g. Married Name)": ">Name Format 2 (e.g. Married Name) / Ikalawang Format ng Pangalan (hal. Apelyido matapos ikasal)",
  ">Reason for Discrepancy": ">Reason for Discrepancy / Dahilan ng Pagkakaiba ng Pangalan",
  ">Purpose of Document": ">Purpose of Document / Layunin ng Dokumento"
};

files.forEach(file => {
  const filePath = path.join(directoryPath, file);
  let content = fs.readFileSync(filePath, "utf-8");
  
  for (const [eng, translated] of Object.entries(dictionary)) {
    content = content.split(eng).join(translated);
  }
  
  fs.writeFileSync(filePath, content, "utf-8");
  console.log("Updated", file);
});

