'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import VehicleForm from '@/components/forms/VehicleForm';
import { fetchApi } from '@/lib/api';

export default function EditVehiclePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [isLoading, setIsLoading] = useState(false);
    const [vehicle, setVehicle] = useState<any>(null);

    // Master Data State
    const [category, setCategory] = useState('CAR');
    const [brands, setBrands] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);

    // Fetch initial vehicle data
    useEffect(() => {
        if (id) fetchVehicle(id);
    }, [id]);

    const fetchVehicle = async (vehicleId: string) => {
        try {
            const res = await fetchApi(`/vehicles/${vehicleId}`);
            if (res.ok) {
                const data = await res.json();
                const v = data.data;
                setVehicle(v);
                setCategory(v.category); // Set initial category
                fetchBrands(v.category); // Fetch brands for this category
            } else {
                toast.error('Gagal mengambil data kendaraan');
                router.push('/app/inventory');
            }
        } catch (error) {
            console.error('Failed to fetch vehicle', error);
            router.push('/app/inventory');
        }
    };

    // Fetch Brands when category changes
    useEffect(() => {
        if (category) fetchBrands(category);
    }, [category]);

    const fetchBrands = async (cat: string) => {
        try {
            const res = await fetchApi(`/vehicles/brands/list?category=${cat}`);
            if (res.ok) {
                const data = await res.json();
                setBrands(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch brands', error);
        }
    };

    useEffect(() => {
        if (brands.length > 0) {
            const allModels = brands.flatMap(b => b.models || []);
            setModels(allModels);
        }
    }, [brands]);


    const handleSubmit = async (formData: any, pendingFiles: File[], pendingDocs: Record<string, File>) => {
        setIsLoading(true);
        try {
            // 1. Update Vehicle
            const res = await fetchApi(`/vehicles/${id}`, {
                method: 'PUT',
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Gagal menyimpan perubahan');
            }

            // 2. Upload Images (if any)
            if (pendingFiles.length > 0) {
                const imageFormData = new FormData();
                pendingFiles.forEach(file => imageFormData.append('files', file));

                const uploadRes = await fetchApi(`/vehicles/${id}/images`, {
                    method: 'POST',
                    body: imageFormData,
                });

                if (!uploadRes.ok) toast.error('Gagal mengupload beberapa gambar baru');
            }

            // 3. Upload Docs (TODO: Implement proper doc upload endpoints if needed per doc type)
            // ...

            toast.success('Edit kendaraan berhasil');
            router.push('/app/inventory');

        } catch (error: any) {
            toast.error(error.message || 'Terjadi kesalahan saat menyimpan');
        } finally {
            setIsLoading(false);
        }
    };

    if (!vehicle) return <div className="p-12 text-center text-gray-500">Loading...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Kendaraan</h1>
            <VehicleForm
                initialData={vehicle}
                masterData={{ brands, models }}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                onCategoryChange={setCategory}
            />
        </div>
    );
}
