const xlsx = require('xlsx');

const workbook = xlsx.readFile('CENSUS 2026 MASTER LIST ORIGINAL for EC CARD.xlsx');
console.log('Sheets:', workbook.SheetNames);

const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, raw: false });
console.log('Total rows:', data.length);
if (data.length > 0) {
    console.log('\nHeader Row (Row 0):');
    console.log(data[0]);
    console.log('\nRow 1:');
    console.log(data[1]);
    console.log('\nRow 2:');
    console.log(data[2]);
    console.log('\nRow 3:');
    console.log(data[3]);
}
