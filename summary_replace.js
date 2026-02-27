const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend', 'src', 'components', 'Forms');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Modal.js') && f !== 'ResidentSearchModal.js');

const newSummaryComponent = `
              <div className="flex-1 overflow-y-auto px-6 py-8 bg-gray-50/80">
                <div className="max-w-2xl mx-auto space-y-4">
                  {Object.entries(formData).map(([key, value]) => {
                    if (!value || key === 'residentId' || key === 'signature' || key === 'details') return null;
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return (
                      <div key={key} className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 bg-white shadow-sm border border-gray-100 rounded-[1.25rem] hover:bg-gray-50 transition-colors group">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{formattedKey}</span>
                        <span className="text-sm font-bold text-gray-900 break-words md:text-right mt-1 md:mt-0 group-hover:text-emerald-700 transition-colors uppercase">{typeof value === 'object' ? JSON.stringify(value) : value.toString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
`;

files.forEach(f => {
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf-8');

    const sPopupIndex = content.indexOf('showConfirmationPopup');
    if (sPopupIndex !== -1) {
        let prePopup = content.substring(0, sPopupIndex);
        let popupArea = content.substring(sPopupIndex);

        // we only want to replace the first max-w-5xl right after showConfirmationPopup.
        // just do global replace of max-w-5xl, since success modal is max-w-md.
        popupArea = popupArea.replace(/max-w-5xl/g, 'max-w-2xl');

        // search for the div containing the preview
        // Sometimes it's <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
        const bodyStart = popupArea.indexOf('<div className="flex-1 overflow-y-auto p-4 bg-gray-100">');

        if (bodyStart !== -1) {
            let openDivs = 0;
            let bodyEnd = -1;
            let started = false;

            // parse until next match
            for (let i = bodyStart; i < popupArea.length; i++) {
                if (popupArea.substring(i, i + 4) === '<div') {
                    openDivs++;
                    started = true;
                } else if (popupArea.substring(i, i + 6) === '</div') {
                    openDivs--;
                    if (started && openDivs === 0) {
                        bodyEnd = i + 6;
                        break;
                    }
                }
            }

            if (bodyEnd !== -1) {
                popupArea = popupArea.substring(0, bodyStart) + newSummaryComponent + popupArea.substring(bodyEnd);
            }
        } else {
            console.log("No body start found for", f);
        }

        content = prePopup + popupArea;
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log("Updated", f);
    }
});
