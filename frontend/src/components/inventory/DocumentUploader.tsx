'use client';

import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faIdCard,
    faFileAlt,
    faCloudUploadAlt,
    faSpinner,
    faCheckCircle,
    faTimesCircle,
    faEye,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';

interface DocumentField {
    key: string;
    label: string;
    icon: any;
}

interface DocumentUploaderProps {
    vehicleId: string;
    documents: Record<string, string | null>; // { ktpOwnerImage: url, stnkImage: url, ... }
    onDocumentChange: (key: string, url: string) => void;
}

const DOCUMENT_FIELDS: DocumentField[] = [
    { key: 'ktpOwnerImage', label: 'KTP Pemilik (sesuai BPKB)', icon: faIdCard },
    { key: 'stnkImage', label: 'Foto STNK', icon: faFileAlt },
    { key: 'bpkbImage', label: 'Foto BPKB', icon: faFileAlt },
    { key: 'taxImage', label: 'Bukti Pajak Terakhir', icon: faFileAlt },
];

export default function DocumentUploader({ vehicleId, documents, onDocumentChange }: DocumentUploaderProps) {
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const handleUpload = async (key: string, file: File) => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File terlalu besar (maks 5MB)');
            return;
        }

        setUploadingKey(key);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const res = await fetch(`${API_URL}/upload/vehicle/${vehicleId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                onDocumentChange(key, data.url);
                toast.success('Dokumen berhasil diunggah');
            } else {
                toast.error('Gagal mengunggah dokumen');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        } finally {
            setUploadingKey(null);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
                <FontAwesomeIcon icon={faIdCard} className="mr-1" />
                Dokumen Kendaraan
            </label>

            <div className="space-y-2">
                {DOCUMENT_FIELDS.map((field) => {
                    const hasDoc = !!documents[field.key];
                    const isUploading = uploadingKey === field.key;

                    return (
                        <div
                            key={field.key}
                            className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-gray-100"
                        >
                            <div className="flex items-center gap-3">
                                <FontAwesomeIcon
                                    icon={hasDoc ? faCheckCircle : faTimesCircle}
                                    className={hasDoc ? 'text-green-500' : 'text-gray-300'}
                                />
                                <div>
                                    <div className="text-sm font-medium text-gray-700">{field.label}</div>
                                    {hasDoc && (
                                        <div className="text-xs text-green-600">Sudah diunggah</div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasDoc && (
                                    <button
                                        onClick={() => setPreviewUrl(`${API_URL}${documents[field.key]}`)}
                                        className="px-3 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                                    >
                                        <FontAwesomeIcon icon={faEye} className="mr-1" />
                                        Lihat
                                    </button>
                                )}
                                <button
                                    onClick={() => fileRefs.current[field.key]?.click()}
                                    disabled={isUploading}
                                    className="px-3 py-1.5 text-xs rounded-lg bg-[#00bfa5]/10 text-[#00bfa5] hover:bg-[#00bfa5]/20 transition-all font-medium disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faCloudUploadAlt} className="mr-1" />
                                            {hasDoc ? 'Ganti' : 'Upload'}
                                        </>
                                    )}
                                </button>
                                <input
                                    ref={(el) => { fileRefs.current[field.key] = el; }}
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) handleUpload(field.key, e.target.files[0]);
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* PREVIEW MODAL */}
            {previewUrl && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
                    onClick={() => setPreviewUrl(null)}
                >
                    <div className="max-w-3xl max-h-[90vh] overflow-auto bg-white rounded-2xl p-2" onClick={(e) => e.stopPropagation()}>
                        <img src={previewUrl} alt="Document Preview" className="w-full h-auto rounded-lg" />
                        <button
                            onClick={() => setPreviewUrl(null)}
                            className="mt-2 w-full py-2 text-center text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
