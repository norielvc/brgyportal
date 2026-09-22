const fs = require('fs');

const sqlFilePath = 'IMPORT_EC_CARDS.sql';
const lines = fs.readFileSync(sqlFilePath, 'utf-8').split('\n');

const chunkSize = 1500;
let currentPart = 1;
let currentLines = [];

for (let i = 0; i < lines.length; i++) {
    currentLines.push(lines[i]);
    
    // When we reach chunkSize, or the end of the file, write the part.
    // Ensure we don't split right in the middle of a transaction if we can avoid it.
    // But since each line is an INSERT, it's fine. We'll just wrap each part in BEGIN/COMMIT
    if ((currentLines.length >= chunkSize && lines[i].endsWith(';')) || i === lines.length - 1) {
        
        let output = currentLines.join('\n');
        
        // Add BEGIN/COMMIT if they aren't there
        if (!output.startsWith('BEGIN;')) output = 'BEGIN;\n' + output;
        if (!output.endsWith('COMMIT;')) output = output + '\nCOMMIT;';
        
        const partName = `IMPORT_EC_CARDS_PART_${currentPart}.sql`;
        fs.writeFileSync(partName, output);
        console.log(`Created ${partName} with ${currentLines.length} lines.`);
        
        currentPart++;
        currentLines = [];
    }
}
