import api from './api';

export const staffService = {
    getStaff: async () => {
        // Backend: GET /tenant/staff (TenantController)
        const response = await api.get('/tenant/staff');
        return Array.isArray(response.data) ? response.data : [];
    },

    createStaff: async (data: {
        name: string;
        email: string;
        password: string;
        role?: string;
        phone?: string;
    }) => {
        // Backend: POST /tenant/staff
        const response = await api.post('/tenant/staff', data);
        return response.data;
    },

    updateStaff: async (id: string, data: any) => {
        // Backend: PUT /tenant/staff/:id
        const response = await api.put(`/tenant/staff/${id}`, data);
        return response.data;
    },

    deleteStaff: async (id: string) => {
        // Backend: DELETE /tenant/staff/:id
        const response = await api.delete(`/tenant/staff/${id}`);
        return response.data;
    },

    assignBranch: async (staffId: string, branchId: string | null) => {
        // Backend: PATCH /tenant/staff/:id/branch
        const response = await api.patch(`/tenant/staff/${staffId}/branch`, { branchId });
        return response.data;
    },
};
