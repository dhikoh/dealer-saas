import api from './api';

export const branchService = {
    getBranches: async () => {
        // Backend: GET /tenant/branches (TenantController — tenant-scoped)
        const response = await api.get('/tenant/branches');
        return Array.isArray(response.data) ? response.data : [];
    },

    createBranch: async (data: {
        name: string;
        address?: string;
        phone?: string;
        isMain?: boolean;
    }) => {
        // Backend: POST /tenant/branches
        const response = await api.post('/tenant/branches', data);
        return response.data;
    },

    updateBranch: async (id: string, data: any) => {
        // Backend: PUT /tenant/branches/:id
        const response = await api.put(`/tenant/branches/${id}`, data);
        return response.data;
    },

    deleteBranch: async (id: string) => {
        // Backend: DELETE /tenant/branches/:id
        const response = await api.delete(`/tenant/branches/${id}`);
        return response.data;
    },
};
