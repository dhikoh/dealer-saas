import api from './api';

export const financeService = {
    getCosts: async (filters?: {
        startDate?: string;
        endDate?: string;
        category?: string;
    }) => {
        const response = await api.get('/finance/costs', { params: filters });
        return Array.isArray(response.data) ? response.data : [];
    },

    createCost: async (data: {
        name: string;
        amount: number;
        category: string;
        date?: string;
        note?: string;
    }) => {
        const response = await api.post('/finance/costs', data);
        return response.data;
    },

    updateCost: async (id: string, data: any) => {
        const response = await api.put(`/finance/costs/${id}`, data);
        return response.data;
    },

    deleteCost: async (id: string) => {
        const response = await api.delete(`/finance/costs/${id}`);
        return response.data;
    },

    getSummary: async (startDate?: string, endDate?: string) => {
        const params: any = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const response = await api.get('/finance/summary', { params });
        return response.data;
    },
};
