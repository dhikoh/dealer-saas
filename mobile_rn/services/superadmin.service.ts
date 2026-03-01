import api from './api';

export const superadminService = {
    // Dashboard
    getStats: async () => {
        const response = await api.get('/superadmin/stats');
        return response.data;
    },
    getPlanDistribution: async () => {
        // Backend: GET /superadmin/analytics/plan-distribution
        const response = await api.get('/superadmin/analytics/plan-distribution');
        return response.data;
    },
    getMonthlyRevenue: async (months = 6) => {
        // Backend: GET /superadmin/analytics/revenue
        const response = await api.get('/superadmin/analytics/revenue', { params: { months } });
        return response.data;
    },

    // Tenants
    getTenants: async (params?: { status?: string; planTier?: string; search?: string }) => {
        const response = await api.get('/superadmin/tenants', { params });
        return Array.isArray(response.data) ? response.data : [];
    },
    getTenant: async (id: string) => {
        const response = await api.get(`/superadmin/tenants/${id}`);
        return response.data;
    },
    updateTenantStatus: async (id: string, status: string) => {
        // Backend: PATCH /superadmin/tenants/:id/status
        const response = await api.patch(`/superadmin/tenants/${id}/status`, { status });
        return response.data;
    },
    suspendTenant: async (id: string, reason: string) => {
        // Backend: POST /superadmin/tenants/:id/suspend
        const response = await api.post(`/superadmin/tenants/${id}/suspend`, { reason });
        return response.data;
    },
    activateTenant: async (id: string) => {
        // Backend: POST /superadmin/tenants/:id/activate
        const response = await api.post(`/superadmin/tenants/${id}/activate`);
        return response.data;
    },
    deleteTenant: async (id: string) => {
        const response = await api.delete(`/superadmin/tenants/${id}`);
        return response.data;
    },

    // Users
    getAllUsers: async (params?: { search?: string; role?: string; page?: string; limit?: string }) => {
        const response = await api.get('/superadmin/users', { params });
        return response.data;
    },
    deleteUser: async (id: string) => {
        const response = await api.delete(`/superadmin/users/${id}`);
        return response.data;
    },

    // Plans
    getPlans: async () => {
        const response = await api.get('/superadmin/plans');
        return Array.isArray(response.data) ? response.data : [];
    },

    // Invoices
    getInvoices: async (params?: { status?: string; tenantId?: string }) => {
        const response = await api.get('/superadmin/invoices', { params });
        return Array.isArray(response.data) ? response.data : [];
    },
    verifyInvoice: async (id: string, approved: boolean) => {
        // Backend: POST /superadmin/invoices/:id/verify
        const response = await api.post(`/superadmin/invoices/${id}/verify`, { approved });
        return response.data;
    },

    // Approvals
    getApprovals: async (status?: string) => {
        const response = await api.get('/superadmin/approvals', { params: status ? { status } : {} });
        return Array.isArray(response.data) ? response.data : [];
    },
    processApproval: async (id: string, approved: boolean) => {
        // Backend: PATCH /superadmin/approvals/:id
        const response = await api.patch(`/superadmin/approvals/${id}`, { approved });
        return response.data;
    },

    // Payment Methods
    getPaymentMethods: async () => {
        const response = await api.get('/payment-methods');
        return Array.isArray(response.data) ? response.data : [];
    },
};
