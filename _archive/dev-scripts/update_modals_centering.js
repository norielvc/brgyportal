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

  // Change min-h-screen to min-h-full to fix the sticking-to-top overflow bug
  content = content.replace(/className="flex min-h-screen items-center justify-center p-4"/g, 'className="flex min-h-full items-center justify-center p-4 sm:p-10"');
  content = content.replace(/className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0"/g, 'className="flex min-h-full items-center justify-center p-4 sm:p-10"');

  // Remove my-auto if present
  content = content.replace(/ my-auto/g, '');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + file);
});

console.log('Done');
