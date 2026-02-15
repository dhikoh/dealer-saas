'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCamera,
    faTrash,
    faSpinner,
    faCloudUploadAlt,
    faStar,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { API_URL, fetchApi } from '@/lib/api';

interface VehicleImageUploaderProps {
    vehicleId?: string; // Optional: if null, we are in "Create Mode" (offline)
    existingImages: string[]; // URLs
    onImagesChange: (images: string[]) => void;
    pendingFiles?: File[];
    onPendingFilesChange?: (files: File[]) => void;
}

export default function VehicleImageUploader({
    vehicleId,
    existingImages,
    onImagesChange,
    pendingFiles = [],
    onPendingFilesChange
}: VehicleImageUploaderProps) {
    const [images, setImages] = useState<string[]>(existingImages || []);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync internal state with props
    useEffect(() => {
        setImages(existingImages || []);
    }, [existingImages]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Validation for all files
        const validFiles: File[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`File "${file.name}" terlalu besar (maks 5MB)`);
                continue;
            }
            if (!file.type.startsWith('image/')) {
                toast.error(`File "${file.name}" bukan gambar`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        // MODE A: Direct Upload (Edit Mode)
        if (vehicleId) {
            await uploadDirectly(validFiles);
        }
        // MODE B: Offline/Pending (Create Mode)
        else if (onPendingFilesChange) {
            onPendingFilesChange([...pendingFiles, ...validFiles]);
            toast.success(`${validFiles.length} foto dipilih (akan diupload saat disimpan)`);
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadDirectly = async (files: File[]) => {
        if (!vehicleId) return;

        setUploading(true);
        try {
            const formData = new FormData();
            files.forEach(f => formData.append('images', f));

            const res = await fetchApi(`/upload/vehicle/${vehicleId}/multiple`, {
                method: 'POST',
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
        }
    };

    const removeImage = (index: number) => {
        const updated = images.filter((_, i) => i !== index);
        setImages(updated);
        onImagesChange(updated);
    };

    const removePendingFile = (index: number) => {
        if (!onPendingFilesChange) return;
        const updated = pendingFiles.filter((_, i) => i !== index);
        onPendingFilesChange(updated);
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

    const setMainPendingFile = (index: number) => {
        if (index === 0 || !onPendingFilesChange) return;
        const updated = [...pendingFiles];
        const [main] = updated.splice(index, 1);
        updated.unshift(main);
        onPendingFilesChange(updated);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
                <FontAwesomeIcon icon={faCamera} className="mr-1" />
                Foto Kendaraan
            </label>

            <div className="flex flex-wrap gap-2 mb-3">
                {/* EXISTING IMAGES (From Server) */}
                {images.map((url, i) => (
                    <div key={`server-${i}`} className="relative group rounded-lg overflow-hidden bg-gray-100 w-24 h-24 border border-gray-200">
                        <img
                            src={`${API_URL}${url}`}
                            alt={`Vehicle ${i}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%239ca3af" font-size="14">Error</text></svg>';
                            }}
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                            {i !== 0 && (
                                <button onClick={() => setMainImage(i)} className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center hover:bg-yellow-600" title="Utama">
                                    <FontAwesomeIcon icon={faStar} size="xs" />
                                </button>
                            )}
                            <button onClick={() => removeImage(i)} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600" title="Hapus">
                                <FontAwesomeIcon icon={faTrash} size="xs" />
                            </button>
                        </div>
                        {i === 0 && (
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-yellow-500 text-white text-[9px] font-bold rounded flex items-center gap-1">
                                <FontAwesomeIcon icon={faStar} />
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 px-1 bg-blue-500 text-white text-[8px] rounded-tl">Server</div>
                    </div>
                ))}

                {/* PENDING FILES (Local Preview) */}
                {pendingFiles.map((file, i) => (
                    <div key={`local-${i}`} className="relative group rounded-lg overflow-hidden bg-gray-100 w-24 h-24 border border-blue-200">
                        <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${i}`}
                            className="w-full h-full object-cover opacity-80"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                            {i !== 0 && (
                                <button onClick={() => setMainPendingFile(i)} className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center hover:bg-yellow-600" title="Utama">
                                    <FontAwesomeIcon icon={faStar} size="xs" />
                                </button>
                            )}
                            <button onClick={() => removePendingFile(i)} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600" title="Hapus">
                                <FontAwesomeIcon icon={faTrash} size="xs" />
                            </button>
                        </div>
                        <div className="absolute bottom-0 right-0 px-1 bg-green-500 text-white text-[8px] rounded-tl">Baru</div>
                        {/* MAIN BADGE FOR PENDING (If no server images exist, first pending is main) */}
                        {images.length === 0 && i === 0 && (
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-yellow-500 text-white text-[9px] font-bold rounded flex items-center gap-1">
                                <FontAwesomeIcon icon={faStar} />
                            </div>
                        )}
                    </div>
                ))}

                {/* UPLOAD BUTTON */}
                <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${uploading
                        ? 'border-gray-300 bg-gray-50 cursor-wait'
                        : 'border-gray-300 hover:border-[#00bfa5] hover:bg-[#00bfa5]/5'
                        }`}
                >
                    {uploading ? (
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400" />
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faCloudUploadAlt} className="text-gray-400 mb-1" />
                            <span className="text-[10px] text-gray-500">Tambah Foto</span>
                        </>
                    )}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
}
