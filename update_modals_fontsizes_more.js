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

  // Let's aggressively push all tiny labels upward to text-sm (14px) and text-xs (12px), taking advantage of the wider max-w-6xl layout.
  // We'll leave existing text-sm alone so headers and buttons don't bloat.
  content = content.replace(/text-xs(?![a-zA-Z0-9_-])/g, 'text-sm');
  content = content.replace(/text-\[11px\]/g, 'text-sm');
  content = content.replace(/text-\[10px\]/g, 'text-xs');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + file);
});

console.log('Done');
