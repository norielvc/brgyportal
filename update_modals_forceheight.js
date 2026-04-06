const fs = require('fs');
const path = require('path');

const formsDir = 'c:\\Users\\SCREENS\\OneDrive\\Desktop\\Admin dashboard\\frontend\\src\\components\\Forms';

const filesToUpdate = [
  'BarangayClearanceModal.js',
  'BusinessPermitModal.js',
  'CohabitationCertificateModal.js',
  'EducationalAssistanceModal.js',
  'GuardianshipCertificateModal.js',
  'IndigencyCertificateModal.js',
  'MedicoLegalModal.js',
  'NaturalDeathCertificateModal.js',
  'ResidencyCertificateModal.js',
  'SamePersonCertificateModal.js'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(formsDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Target the exact modal container string regardless of its current state and forcefully overwrite its dimensions
  content = content.replace(/<div className="relative bg-white rounded-2xl shadow-2xl w-full[a-zA-Z0-9\-\[\] ]*flex flex-col overflow-hidden animate-fade-in(.*?)".*?>/g, '<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden animate-fade-in$1" style={{ minHeight: \'85vh\', maxHeight: \'85vh\', fontFamily: "\'Open Sans\', sans-serif" }}>');

  // Same thing but if the class order is slightly different:
  content = content.replace(/<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-\[?.*?\]? max-h-\[?.*?\]?( my-auto)? flex flex-col overflow-hidden animate-fade-in no-scrollbar" style=\{\{.*?\}\}>/g, '<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden animate-fade-in no-scrollbar" style={{ minHeight: \'85vh\', maxHeight: \'85vh\', fontFamily: "\'Open Sans\', sans-serif" }}>');
  content = content.replace(/<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-\[?.*?\]? max-h-\[?.*?\]?( my-auto)? flex flex-col overflow-hidden animate-fade-in" style=\{\{.*?\}\}>/g, '<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden animate-fade-in" style={{ minHeight: \'85vh\', maxHeight: \'85vh\', fontFamily: "\'Open Sans\', sans-serif" }}>');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + file);
});

console.log('Done');
