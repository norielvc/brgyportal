const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'certificates-supabase.js');

let fileContent = fs.readFileSync(filePath, 'utf8');

// 1. Inject tenantId variable directly into every post/put/delete router if it doesn't exist
fileContent = fileContent.replace(/router\.(post|put|delete)\('([^']+)',\s*(?:[^,]+,\s*)?async\s*\(req,\s*res\)\s*=>\s*\{\s*try\s*\{/g, (match) => {
    if (fileContent.includes(`const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';`, fileContent.indexOf(match))) {
        // If it's already there in the file, we can just inject it again safely locally to the block, 
        // but let's just make sure.
    }
    return match + `\n    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';`;
});

// 2. Add tenant_id to certificate_requests INSERTS
// Find: .insert([{
// Replace: .insert([{ tenant_id: tenantId, 
fileContent = fileContent.replace(/\.insert\(\[\s*\{/g, '.insert([{ tenant_id: tenantId, ');

// 3. Add tenant_id to workflow_assignments INSERTS
// In the code, this might be hit by the generic insert replacement above, but let's verify.
// The generic replacement will hit EVERY .insert([{ which is exactly what we want, because 
// workflow_assignments and workflow_history also got the tenant_id column!

// 4. Update workflow_configurations queries
// .from('workflow_configurations').select('workflow_config').eq('certificate_type', 'xxx')
// We need to add .eq('tenant_id', tenantId)
fileContent = fileContent.replace(/\.from\('workflow_configurations'\)\s*\.select\('workflow_config'\)\s*\.eq\('certificate_type',\s*([^)]+)\)/g, 
    `.from('workflow_configurations').select('workflow_config').eq('certificate_type', $1).eq('tenant_id', tenantId)`);

// 5. Update certificate_requests UPDATEs/DELETEs
// .from('certificate_requests').update(...).eq('id', id)
fileContent = fileContent.replace(/(\.from\('certificate_requests'\)\s*\.(?:update|delete)\([^)]*\)\s*(?:\.eq\([^)]+\)\s*)*)/g, 
    `$1.eq('tenant_id', tenantId)`);

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Successfully applied Multi-Tenant to POST/PUT/DELETE routes in certificates-supabase.js!');
