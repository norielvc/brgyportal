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

  // Replace max-w-5xl max-h-[90vh] with max-w-6xl max-h-[85vh]
  content = content.replace(/max-w-5xl/g, 'max-w-[1400px]');
  content = content.replace(/max-h-\[90vh\]/g, 'max-h-[85vh]');

  // Provide a clean demoTheme replacement that targets the pill gradient specifically
  const cssTarget = `      /* Step header pill (green lime -> gold) */
      .brgy-modal-wrap [class*="from-[#8cc63f]"],
      .brgy-modal-wrap [class*="from-[#7cb342]"] {
        --tw-gradient-from: #c9a84c !important;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent) !important;
      }
      .brgy-modal-wrap [class*="to-[#b4d339]"],
      .brgy-modal-wrap [class*="to-[#7cb342]"],
      .brgy-modal-wrap [class*="to-[#689f38]"] {
        --tw-gradient-to: #a07830 !important;
      }
      .brgy-modal-wrap [class*="from-[#8cc63f]"],
      .brgy-modal-wrap [class*="from-[#7cb342]"] {
        background-image: linear-gradient(to right, #c9a84c, #a07830) !important;
      }`;
      
  const cssReplacement = `      /* Step header pill mappings */
      .brgy-modal-wrap [class*="from-[#8cc63f]"],
      .brgy-modal-wrap [class*="from-[#7cb342]"] {
        --tw-gradient-from: #111111 !important;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent) !important;
      }
      .brgy-modal-wrap [class*="to-[#b4d339]"],
      .brgy-modal-wrap [class*="to-[#7cb342]"],
      .brgy-modal-wrap [class*="to-[#689f38]"] {
        --tw-gradient-to: #222222 !important;
      }
      .brgy-modal-wrap [class*="from-[#8cc63f]"],
      .brgy-modal-wrap [class*="from-[#7cb342]"] {
        background-image: linear-gradient(to right, #111111, #222222) !important;
      }
      /* Submit button explicitly gold */
      .brgy-modal-wrap button[type="submit"], .brgy-modal-wrap button.bg-gradient-to-r[class*="from-[#8cc63f]"] {
        background-image: linear-gradient(to right, #c9a84c, #a07830) !important;
        color: #fff !important;
        border: none !important;
      }
      /* Gold step headers numbers */
      .brgy-modal-wrap .bg-gradient-to-r[class*="from-[#8cc63f]"] .w-8.h-8 {
        background-color: #c9a84c !important;
        color: #fff !important;
      }`;

  if (content.includes(cssTarget)) {
    content = content.replace(cssTarget, cssReplacement);
  }

  // Same thing for submit buttons that might use background-color overrides
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + file);
});

console.log('Done');
