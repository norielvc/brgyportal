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

  // Enforce explicit min-height of 85vh to expand the modal physically up and down
  content = content.replace(/max-h-\[90vh\]/g, 'max-h-[85vh] min-h-[85vh]');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + file);
});

console.log('Done');
