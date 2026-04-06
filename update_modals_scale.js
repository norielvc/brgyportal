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

  // Inject min-h-[85vh] to stretch the modal height explicitly
  content = content.replace(/max-w-5xl max-h-\[90vh\]/g, 'max-w-5xl max-h-[90vh] min-h-[85vh]');

  // Scale up step circles
  content = content.replace(/w-8 h-8/g, 'w-10 h-10');
  content = content.replace(/w-6 h-6/g, 'w-8 h-8'); // other icons
  
  // Safe text size replacement
  content = content.replace(/text-\[8px\]/g, '__TEXT8__');
  content = content.replace(/text-\[9px\]/g, '__TEXT9__');
  content = content.replace(/text-\[10px\]/g, '__TEXT10__');
  content = content.replace(/text-xs([^a-zA-Z0-9_-])/g, '__TEXTXS__$1');
  content = content.replace(/text-sm([^a-zA-Z0-9_-])/g, '__TEXTSM__$1');
  content = content.replace(/text-base([^a-zA-Z0-9_-])/g, '__TEXTBASE__$1');

  content = content.replace(/__TEXT8__/g, 'text-[10px]');
  content = content.replace(/__TEXT9__/g, 'text-xs'); 
  content = content.replace(/__TEXT10__/g, 'text-sm');
  content = content.replace(/__TEXTXS__/g, 'text-sm');
  content = content.replace(/__TEXTSM__/g, 'text-base');
  content = content.replace(/__TEXTBASE__/g, 'text-lg');

  // Input and button paddings
  content = content.replace(/py-2\.5/g, 'py-3.5');
  content = content.replace(/(?<!px-|mx-|my-|space-[xy]-)py-2(?![\.0-9])/g, 'py-3');
  content = content.replace(/py-1\.5/g, 'py-2.5');
  
  // Also bump up the step header title
  // text-lg font-bold text-white tracking-tight drop-shadow-md -> text-xl
  content = content.replace(/text-lg font-bold text-white tracking-tight/g, 'text-xl font-bold text-white tracking-tight');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + file);
});

console.log('Done');
