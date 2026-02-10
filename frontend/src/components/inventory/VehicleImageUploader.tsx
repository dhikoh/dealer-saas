'use client';

import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCamera,
    faTrash,
    faSpinner,
    faCloudUploadAlt,
    faStar,
    faImage,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';

interface VehicleImageUploaderProps {
    vehicleId: string;
    existingImages: string[]; // JSON-parsed array of URLs
    onImagesChange: (images: string[]) => void;
}

export default function VehicleImageUploader({ vehicleId, existingImages, onImagesChange }: VehicleImageUploaderProps) {
    const [images, setImages] = useState<string[]>(existingImages || []);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const token = localStorage.getItem('access_token');
        if (!token) return;

        setUploading(true);

        try {
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                // Validate file size (max 5MB per file)
                if (files[i].size > 5 * 1024 * 1024) {
                    toast.error(`File "${files[i].name}" terlalu besar (maks 5MB)`);
                    continue;
                }
                // Validate file type
                if (!files[i].type.startsWith('image/')) {
                    toast.error(`File "${files[i].name}" bukan gambar`);
                    continue;
                }
                formData.append('images', files[i]);
            }

            const res = await fetch(`${API_URL}/upload/vehicle/${vehicleId}/multiple`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                const newUrls = data.files.map((f: any) => f.url);
                const updated = [...images, ...newUrls];
                setImages(updated);
                onImagesChange(updated);
                toast.success(`${newUrls.length} foto berhasil diunggah`);
            } else {
                toast.error('Gagal mengunggah foto');
            }
        } catch {
            toast.error('Terjadi kesalahan saat upload');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        const updated = images.filter((_, i) => i !== index);
        setImages(updated);
        onImagesChange(updated);
    };

    const setMainImage = (index: number) => {
        if (index === 0) return;
        const updated = [...images];
        const [main] = updated.splice(index, 1);
        updated.unshift(main);
        setImages(updated);
        onImagesChange(updated);
        toast.success('Foto utama diperbarui');
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
                <FontAwesomeIcon icon={faCamera} className="mr-1" />
                Foto Kendaraan
            </label>

            {/* EXISTING IMAGES GRID */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {images.map((url, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-[4/3]">
                            <img
                                src={`${API_URL}${url}`}
                                alt={`Vehicle ${i + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%239ca3af" font-size="14">No Image</text></svg>';
                                }}
                            />
                            {/* BADGES & OVERLAY */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                {i !== 0 && (
                                    <button
                                        onClick={() => setMainImage(i)}
                                        className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center hover:bg-yellow-600 transition-all"
                                        title="Jadikan foto utama"
                                    >
                                        <FontAwesomeIcon icon={faStar} size="sm" />
                                    </button>
                                )}
                                <button
                                    onClick={() => removeImage(i)}
                                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
                                    title="Hapus foto"
                                >
                                    <FontAwesomeIcon icon={faTrash} size="sm" />
                                </button>
                            </div>
                            {/* MAIN BADGE */}
                            {i === 0 && (
                                <div className="absolute top-1 left-1 px-2 py-0.5 bg-yellow-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                                    <FontAwesomeIcon icon={faStar} className="text-[8px]" />
                                    Utama
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* UPLOAD ZONE */}
            <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${uploading
                        ? 'border-gray-300 bg-gray-50 cursor-wait'
                        : 'border-gray-300 hover:border-[#00bfa5] hover:bg-[#00bfa5]/5'
                    }`}
            >
                {uploading ? (
                    <div className="text-gray-500">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl mb-1" />
                        <p className="text-sm">Mengunggah...</p>
                    </div>
                ) : (
                    <div className="text-gray-400">
                        <FontAwesomeIcon icon={faCloudUploadAlt} className="text-2xl mb-1" />
                        <p className="text-sm font-medium">Klik untuk upload foto</p>
                        <p className="text-xs">JPG, PNG • Maks 5MB per file • Maks 10 foto</p>
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="hidden"
            />
        </div>
    );
}
