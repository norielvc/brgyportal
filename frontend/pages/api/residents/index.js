import { supabase } from '../../../lib/supabase';

const sanitizeResidentData = (data) => {
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === '') {
            sanitized[key] = null;
        }
    });
    return sanitized;
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Tenant context required' });
        }

        // Handle bulk insert
        if (req.query.action === 'bulk-insert' || req.body.action === 'bulk-insert' || Array.isArray(req.body.residents)) {
            const residents = req.body.residents || req.body;
            if (!residents || !Array.isArray(residents)) {
                return res.status(400).json({ success: false, message: 'Invalid residents data' });
            }

            const sanitizedResidents = residents.map(r => ({
                ...sanitizeResidentData(r),
                tenant_id: tenantId
            }));

            const { data, error } = await supabase
                .from('residents')
                .insert(sanitizedResidents)
                .select();

            if (error) throw error;

            return res.status(200).json({
                success: true,
                message: `${data.length} residents imported successfully`,
                count: data.length
            });
        }

        // Handle single insert
        const residentData = sanitizeResidentData(req.body);
        
        // Remove generated or system columns
        delete residentData.full_name;
        delete residentData.id;
        
        residentData.tenant_id = tenantId;

        const { data, error } = await supabase
            .from('residents')
            .insert([residentData])
            .select()
            .single();

        if (error) throw error;
        return res.status(200).json({ success: true, resident: data });
    } catch (error) {
        console.error('Error creating resident:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}
