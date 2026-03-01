import api from './api';

export const transactionService = {
    getTransactions: async (filters?: {
        type?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        const response = await api.get('/transactions', { params: filters });
        return Array.isArray(response.data) ? response.data : [];
    },

    getTransaction: async (id: string) => {
        const response = await api.get(`/transactions/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await api.get('/transactions/stats');
        return response.data;
    },

    createTransaction: async (data: {
        type: string;
        vehicleId: string;
        customerId: string;
        paymentType: string;
        finalPrice: number;
        notes?: string;
        paymentMethod?: string;
        referenceNumber?: string;
        creditData?: {
            creditType: string;
            leasingCompany?: string;
            downPayment: number;
            interestRate: number;
            tenorMonths: number;
        };
    }) => {
        const response = await api.post('/transactions', data);
        return response.data;
    },

    updateTransaction: async (id: string, data: any) => {
        const response = await api.put(`/transactions/${id}`, data);
        return response.data;
    },

    updateStatus: async (id: string, status: string) => {
        const response = await api.patch(`/transactions/${id}/status`, { status });
        return response.data;
    },

    getMonthlySales: async (months: number = 6) => {
        const response = await api.get('/transactions/reports/monthly', { params: { months } });
        return response.data;
    },
};
