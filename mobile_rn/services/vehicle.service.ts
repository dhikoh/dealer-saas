import api from './api';
import { Vehicle } from '../constants/types';

export const vehicleService = {
    getVehicles: async (params?: any): Promise<Vehicle[]> => {
        const response = await api.get('/vehicles', { params });
        // FIX: Validate response is an array before returning, fallback to empty array
        return Array.isArray(response.data) ? response.data : [];
    },

    getVehicleStats: async () => {
        const response = await api.get('/vehicles');
        const vehicles: any[] = Array.isArray(response.data) ? response.data : [];

        // FIX: API contract mismatch - normalize both uppercase & lowercase status values
        // Backend uses AVAILABLE/SOLD (uppercase from Prisma enum), frontend was checking lowercase
        return {
            total: vehicles.length,
            available: vehicles.filter((v) =>
                v.status === 'AVAILABLE' || v.status === 'available'
            ).length,
            sold: vehicles.filter((v) =>
                v.status === 'SOLD' || v.status === 'sold'
            ).length,
        };
    }
};
