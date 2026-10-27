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

  // Revert back to proper proportion: max-w-5xl instead of max-w-[1400px]
  content = content.replace(/max-w-\[1400px\]/g, 'max-w-5xl');
  // Revert max-h-[85vh] back to max-h-[90vh] 
  content = content.replace(/max-h-\[85vh\]/g, 'max-h-[90vh]');

  // Ensure centering works perfectly by injecting `my-auto` if it's not there on the modal div
  // The line usually looks like:
  // <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col ..."
  content = content.replace(/(className="relative bg-white rounded-2xl shadow-2xl w-full max-w-\S+ max-h-\S+)( flex flex-col)/g, '$1 my-auto$2');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + file);
});

console.log('Done');
