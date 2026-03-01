import api from './api';

export const customerService = {
    getCustomers: async (search?: string) => {
        const params = search ? { search } : {};
        const response = await api.get('/customers', { params });
        return Array.isArray(response.data) ? response.data : [];
    },

    getCustomer: async (id: string) => {
        const response = await api.get(`/customers/${id}`);
        return response.data;
    },

    createCustomer: async (data: {
        name: string;
        phone: string;
        email?: string;
        address?: string;
        ktpNumber?: string;
        type?: string;
        source?: string;
        notes?: string;
    }) => {
        const response = await api.post('/customers', data);
        return response.data;
    },

    updateCustomer: async (id: string, data: any) => {
        const response = await api.put(`/customers/${id}`, data);
        return response.data;
    },

    deleteCustomer: async (id: string) => {
        const response = await api.delete(`/customers/${id}`);
        return response.data;
    },
};
