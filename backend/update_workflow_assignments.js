const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'workflow-assignments-supabase.js');

let fileContent = fs.readFileSync(filePath, 'utf8');

// 1. Inject tenantId variable directly into every router.(get|post|put|delete)
fileContent = fileContent.replace(/router\.(get|post|put|delete)\('([^']+)',\s*(?:[^,]+,\s*)*async\s*\(req,\s*res\)\s*=>\s*\{\s*(?:console\.log\([^)]+\);\s*)?try\s*\{/g, (match) => {
    if (fileContent.includes(`const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';`, fileContent.indexOf(match))) {
        return match;
    }
    return match + `\n    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';`;
});

// 2. Add tenant_id to workflow_assignments, certificate_requests, workflow_configurations INSERTS and SELECTS and UPDATES and DELETES
// We will simply append .eq('tenant_id', tenantId) before any terminal methods like .single() or order() or select() 
// Wait, NO. .eq() should be appended after .from() or .update() or .delete() and before terminal execution. 
// A simpler way is to just do `.eq('tenant_id', tenantId)` after instances of `eq('...'`
// But regex might break it.

// For now, I will use a reliable safe find-and-replace for the exact critical queries.
// 2.1 INSERTS
fileContent = fileContent.replace(/\.insert\(\[\{/g, '.insert([{ tenant_id: tenantId, ');

// 2.2 SELECTS/UPDATES/DELETES on critical tables
const targetTables = ['workflow_assignments', 'certificate_requests', 'workflow_configurations', 'workflow_history', 'users'];

for (const table of targetTables) {
    // Look for: .from('table').select/update/delete something
    const regex = new RegExp(`(\\.from\\('${table}'\\)\\s*\\.(?:select|update|delete)\\([^)]*\\)[\\s\\S]*?(?:\\.eq\\([^)]+\\))*)(?=\\s*\\.|;)`, 'g');
    
    fileContent = fileContent.replace(regex, (match) => {
        // Prevent double injection
        if (match.includes(`tenant_id', tenantId`)) return match;
        // Don't inject if it's not a query builder (e.g. just .from('users').select('*'))
        // Actually append it immediately after the first .select/.update/.delete
        return match + `\n      .eq('tenant_id', tenantId)`;
    });
}

// Write the file
fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Successfully secured workflow-assignments-supabase.js!');
