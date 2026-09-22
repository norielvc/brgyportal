const xlsx = require('xlsx');
const fs = require('fs');
const crypto = require('crypto');

const excelFilePath = 'CENSUS 2026 MASTER LIST ORIGINAL for EC CARD.xlsx';
const outputSqlPath = 'IMPORT_EC_CARDS.sql';

const workbook = xlsx.readFile(excelFilePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Parse with header array to ensure we get objects with these keys
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 1, defval: '' });

// Based on our analysis, headers are:
// 0: SR NUMBER, 1: LAST NAME, 2: FIRST NAME, 3: MIDDLE NAME, 4: EXT, 5: BIRTHDATE, 6: AGE, 7: HOUSE NUMBER...
// 11: GENDER, 12: CIVIL STATUS, 13: HOUSE HOLD HEAD... 31: NOTES, 32: EMPTY, 33: EC CARD NUMBER (approx)

// Let's find the exact index for EC CARD NUMBER dynamically from row 0
const headers = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, raw: false })[0];
const ecCardIdx = headers.findIndex(h => h && h.toString().trim() === 'EC CARD NUMBER');
const lastNameIdx = headers.findIndex(h => h && h.toString().trim() === 'LAST NAME');
const firstNameIdx = headers.findIndex(h => h && h.toString().trim() === 'FIRST NAME');
const midNameIdx = headers.findIndex(h => h && h.toString().trim() === 'MIDDLE NAME');
const suffixIdx = headers.findIndex(h => h && h.toString().trim() === 'EXT');
const dobIdx = headers.findIndex(h => h && h.toString().trim() === 'BIRTHDATE');
const pobIdx = headers.findIndex(h => h && h.toString().trim() === 'BIRTH PLACE');
const houseNoIdx = headers.findIndex(h => h && h.toString().trim() === 'HOUSE NUMBER / BLOCK LOT');
const purokIdx = headers.findIndex(h => h && h.toString().trim() === 'PUROK');
const subdivIdx = headers.findIndex(h => h && h.toString().trim() === 'SUBDIVISION');
const contactIdx = headers.findIndex(h => h && h.toString().trim() === 'CONTACT NO.');
const genderIdx = headers.findIndex(h => h && h.toString().trim() === 'GENDER');
const civilIdx = headers.findIndex(h => h && h.toString().trim() === 'CIVIL STATUS');

console.log('EC Card Index:', ecCardIdx);

if (ecCardIdx === -1) {
    console.error("Could not find EC CARD NUMBER column");
    process.exit(1);
}

const tenantId = 'ibaoeste';
let sqlStatements = [];

// Start transaction
sqlStatements.push('-- =====================================================================');
sqlStatements.push('-- AUTO-GENERATED IMPORT SCRIPT FOR EC CARDS');
sqlStatements.push('-- =====================================================================');
sqlStatements.push('BEGIN;');

function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'string') {
        return "'" + val.replace(/'/g, "''") + "'";
    }
    return "'" + val + "'";
}

function parseDate(dateStr) {
    if (dateStr === null || dateStr === undefined || dateStr === '') return null;
    
    // Handle Excel serial date format (number of days since 1900)
    if (typeof dateStr === 'number') {
        const utc_days = Math.floor(dateStr - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        return date_info.toISOString().split('T')[0];
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
}

function toTitleCase(str) {
    if (!str) return '';
    return str.toString().toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
}

const householdMap = new Map(); // Base Household Number -> Leader UUID
const members = []; // Store members to process after leaders

console.log(`Processing ${data.length} rows...`);

// First pass: identify leaders and generate their UUIDs
for (const row of data) {
    const ecCardNo = row[ecCardIdx];
    if (!ecCardNo || typeof ecCardNo !== 'string') continue;
    
    const cardStr = ecCardNo.trim();
    if (cardStr === '') continue;

    const baseMatch = cardStr.match(/^(H\d+)(M?)-(F\d+)$/);
    if (!baseMatch) {
        console.warn(`Could not parse EC Card: ${cardStr}`);
        continue;
    }

    const baseH = baseMatch[1]; // H03157
    const isMember = baseMatch[2] === 'M';
    
    // Generate deterministic UUID based on EC Card Number so rerunning doesn't create duplicates
    const hash = crypto.createHash('md5').update(cardStr).digest('hex');
    const residentId = [
        hash.slice(0, 8),
        hash.slice(8, 12),
        '4' + hash.slice(13, 16),
        'a' + hash.slice(17, 20),
        hash.slice(20, 32)
    ].join('-');
    
    const houseNo = houseNoIdx !== -1 && row[houseNoIdx] ? row[houseNoIdx].toString().trim() : '';
    const subdivision = subdivIdx !== -1 && row[subdivIdx] ? row[subdivIdx].toString().trim() : '';
    const purokStr = row[purokIdx] ? toTitleCase(row[purokIdx].toString().trim()) : '';

    const addressParts = [];
    if (houseNo) addressParts.push(houseNo);
    if (subdivision) addressParts.push(toTitleCase(subdivision));
    if (purokStr) addressParts.push(purokStr);
    addressParts.push("Brgy. Iba O' Este");

    const fullAddress = addressParts.join(', ');

    const resident = {
        residentId,
        baseH,
        isMember,
        cardStr,
        lastName: row[lastNameIdx] || '',
        firstName: row[firstNameIdx] || '',
        midName: row[midNameIdx] || '',
        suffix: row[suffixIdx] || '',
        dob: parseDate(row[dobIdx]),
        pob: row[pobIdx],
        purokRaw: purokStr,
        address: fullAddress,
        contact: row[contactIdx],
        gender: row[genderIdx],
        civilStatus: row[civilIdx],
    };

    if (!isMember) {
        householdMap.set(baseH, residentId);
        members.push(resident); // Still add to list to process insertion later
    } else {
        members.push(resident);
    }
}

// Second pass: Generate SQL
for (const res of members) {
    let householdHeadId = res.isMember ? householdMap.get(res.baseH) : null;
    if (res.isMember && !householdHeadId) {
        console.warn(`Warning: Could not find leader for member ${res.cardStr} (Base ${res.baseH})`);
        householdHeadId = null;
    }

    // 1. Insert Resident (mapping purok to residential_address)
    const resSql = `INSERT INTO public.residents (id, last_name, first_name, middle_name, suffix, date_of_birth, place_of_birth, residential_address, contact_number, gender, civil_status, household_head_id) VALUES (${escapeSql(res.residentId)}, ${escapeSql(res.lastName)}, ${escapeSql(res.firstName)}, ${escapeSql(res.midName)}, ${escapeSql(res.suffix)}, ${escapeSql(res.dob)}, ${escapeSql(res.pob)}, ${escapeSql(res.address)}, ${escapeSql(res.contact)}, ${escapeSql(res.gender)}, ${escapeSql(res.civilStatus)}, ${householdHeadId ? escapeSql(householdHeadId) : 'NULL'}) ON CONFLICT (id) DO UPDATE SET date_of_birth = EXCLUDED.date_of_birth, place_of_birth = EXCLUDED.place_of_birth, residential_address = EXCLUDED.residential_address;`;
    
    sqlStatements.push(resSql);

    // 2. Insert Barangay ID (mapping purok to BOTH purok and address)
    const fullName = `${res.firstName} ${res.midName ? res.midName + ' ' : ''}${res.lastName}${res.suffix ? ' ' + res.suffix : ''}`.trim();
    
    const idSql = `INSERT INTO public.barangay_ids (resident_id, tenant_id, id_number, full_name, first_name, last_name, middle_name, suffix, birth_date, gender, civil_status, purok, address) VALUES (${escapeSql(res.residentId)}, ${escapeSql(tenantId)}, ${escapeSql(res.cardStr)}, ${escapeSql(fullName)}, ${escapeSql(res.firstName)}, ${escapeSql(res.lastName)}, ${escapeSql(res.midName)}, ${escapeSql(res.suffix)}, ${escapeSql(res.dob)}, ${escapeSql(res.gender)}, ${escapeSql(res.civilStatus)}, ${escapeSql(res.purokRaw)}, ${escapeSql(res.address)}) ON CONFLICT (tenant_id, id_number) DO UPDATE SET birth_date = EXCLUDED.birth_date, purok = EXCLUDED.purok, address = EXCLUDED.address;`;
    
    sqlStatements.push(idSql);
}

sqlStatements.push('COMMIT;');

fs.writeFileSync(outputSqlPath, sqlStatements.join('\n'));
console.log(`Generated SQL script at ${outputSqlPath} with ${sqlStatements.length} statements.`);
