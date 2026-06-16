const { supabase } = require('./supabaseClient');

class SubscriptionService {
    /**
     * Gets the active subscription and plan details for a barangay
     * Falls back to 'starter' plan if none found.
     */
    async getSubscription(barangayId) {
        if (!barangayId) return null;
        try {
            // 1. Try to get actual subscription
            const { data, error } = await supabase
                .from('barangay_subscriptions')
                .select(`
                    *,
                    plan:subscription_plans(*)
                `)
                .eq('barangay_id', barangayId)
                .eq('status', 'active')
                .maybeSingle();

            if (data && data.plan) {
                return data;
            }

            // 2. Fallback: Get Starter Plan details
            const { data: starterPlan } = await supabase
                .from('subscription_plans')
                .eq('id', 'starter')
                .single();
            
            return {
                plan_id: 'starter',
                tenant_id: barangayId,
                status: 'active',
                current_period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
                current_period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
                plan: starterPlan
            };
        } catch (err) {
            console.error('[SUBSCRIPTION] Error:', err);
            return null;
        }
    }

    /**
     * Internal helper to count requests in current billing cycle
     */
    async getCurrentUsage(barangayId) {
        const sub = await this.getSubscription(barangayId);
        if (!sub) return { requests: 0, staff: 0, plan: null };

        // Count requests
        const { count: requests } = await supabase
            .from('certificate_requests')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', barangayId)
            .gte('created_at', sub.current_period_start);

        // Count staff (including admin)
        const { count: staff } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', barangayId);

        return {
            requests: requests || 0,
            staff: staff || 0,
            sub
        };
    }

    /**
     * API Entry point to get usage stats for frontend
     */
    async getUsageStats(barangayId) {
        const { requests, staff, sub } = await this.getCurrentUsage(barangayId);
        if (!sub) return null;

        return {
            planName: sub.plan.name,
            planId: sub.plan_id,
            requests: {
                used: requests,
                total: sub.plan.max_requests,
                isUnlimited: sub.plan.max_requests === -1
            },
            staff: {
                used: staff,
                total: sub.plan.max_staff,
                isUnlimited: sub.plan.max_staff === -1
            },
            expiryDate: sub.current_period_end
        };
    }

    /**
     * Logic check for creating a new request
     */
    async canCreateRequest(barangayId) {
        const { requests, sub } = await this.getCurrentUsage(barangayId);
        if (!sub || !sub.plan) return false;
        if (sub.plan.max_requests === -1) return true;
        return requests < sub.plan.max_requests;
    }

    /**
     * Logic check for adding a new staff member
     */
    async canAddStaff(barangayId) {
        const { staff, sub } = await this.getCurrentUsage(barangayId);
        if (!sub || !sub.plan) return false;
        if (sub.plan.max_staff === -1) return true;
        return staff < sub.plan.max_staff;
    }
}

module.exports = new SubscriptionService();
