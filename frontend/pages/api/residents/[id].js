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
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    if (!tenantId) {
        return res.status(403).json({ success: false, message: 'Tenant context required' });
    }
    
    const { id } = req.query;

    if (req.method === 'PUT') {
        try {
            const updates = sanitizeResidentData(req.body);

            // Remove read-only or generated columns to prevent Supabase errors
            delete updates.full_name;
            delete updates.id;
            delete updates.created_at;
            delete updates.updated_at;
            delete updates.tenant_id; // Do not allow manual updates of tenant_id

            const { data, error } = await supabase
                .from('residents')
                .update(updates)
                .eq('id', id)
                .eq('tenant_id', tenantId)
                .select()
                .single();

            if (error) throw error;
            return res.status(200).json({ success: true, resident: data });
        } catch (error) {
            console.error('Error updating resident:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    } else if (req.method === 'DELETE') {
        try {
            const { error } = await supabase
                .from('residents')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenantId);

            if (error) throw error;
            return res.status(200).json({ success: true, message: 'Resident deleted successfully' });
        } catch (error) {
            console.error('Error deleting resident:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    } else {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
}
