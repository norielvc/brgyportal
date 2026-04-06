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

  // Completely force the height to a massive fixed size so it visually CANNOT be the same
  content = content.replace(/minHeight: '85vh', maxHeight: '85vh'/g, 'minHeight: \'800px\', height: \'90vh\', maxHeight: \'95vh\' /* BUST-CACHE-800 */');
  
  // Make the form inputs visually bolder and taller to actually take up the height beautifully
  // We'll cautiously increase padding
  content = content.replace(/className="flex-1 overflow-y-auto"/g, 'className="flex-1 overflow-y-auto px-2 py-4"');
  content = content.replace(/<form onSubmit=\{handleSubmit\} className="p-4 space-y-4">/g, '<form onSubmit={handleSubmit} className="p-4 space-y-6">');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + file);
});

console.log('Done');
