import api from './api';
import { Vehicle } from '../constants/types';

export const vehicleService = {
    getVehicles: async (params?: any): Promise<Vehicle[]> => {
        const response = await api.get('/vehicles', { params });
        return Array.isArray(response.data) ? response.data : [];
    },

    getVehicleStats: async () => {
        // FIX: Use the proper backend stats endpoint instead of computing client-side
        const response = await api.get('/vehicles/stats');
        return response.data;
    },

    getVehicle: async (id: string) => {
        const response = await api.get(`/vehicles/${id}`);
        return response.data;
    },

    createVehicle: async (data: any) => {
        const response = await api.post('/vehicles', data);
        return response.data;
    },

    updateVehicle: async (id: string, data: any) => {
        const response = await api.put(`/vehicles/${id}`, data);
        return response.data;
    },

    deleteVehicle: async (id: string) => {
        const response = await api.delete(`/vehicles/${id}`);
        return response.data;
    },

    getBrands: async (category?: string) => {
        const params = category ? { category } : {};
        const response = await api.get('/vehicles/brands/list', { params });
        return response.data?.data || response.data || [];
    },
};
