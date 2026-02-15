'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faIdCard,
    faFileAlt,
    faCloudUploadAlt,
    faSpinner,
    faCheckCircle,
    faTimesCircle,
    faEye,
    faHome,
    faMoneyBillWave,
    faBriefcase,
    faFileInvoiceDollar
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { API_URL, fetchApi } from '@/lib/api';

interface DocumentField {
    key: string; // Database field name
    docType: string; // URL param for UploadController
    label: string;
    icon: any;
}

interface CustomerDocumentUploaderProps {
    customerId: string;
    documents: Record<string, string | null>; // { ktpImage: url, kkImage: url, ... }
    onDocumentChange: (key: string, url: string) => void;
    onFileSelect?: (key: string, file: File | null) => void; // For pending uploads checks
}

const DOCUMENT_FIELDS: DocumentField[] = [
    { key: 'ktpImage', docType: 'ktp', label: 'Foto KTP (Wajib)', icon: faIdCard },
    { key: 'kkImage', docType: 'kk', label: 'Kartu Keluarga (KK)', icon: faUsers },
    { key: 'homeProofImage', docType: 'home-proof', label: 'Bukti Kepemilikan Rumah (PBB/Rek. Listrik)', icon: faHome },
    { key: 'salarySlipImage', docType: 'salary-slip', label: 'Slip Gaji', icon: faMoneyBillWave },
    { key: 'bankStatementImage', docType: 'bank-statement', label: 'Rekening Koran (3 Bulan)', icon: faFileInvoiceDollar },
    { key: 'businessLicenseImage', docType: 'business-license', label: 'Bukti Usaha (SIUP/NIB/SKU)', icon: faBriefcase },
];

import { faUsers } from '@fortawesome/free-solid-svg-icons';

export default function CustomerDocumentUploader({ customerId, documents, onDocumentChange, onFileSelect }: CustomerDocumentUploaderProps) {
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
    const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // CRITICAL FIX: Reset all internal state when customer changes
    // Prevents "KTP Tersimpan" leaking from previous customer
    useEffect(() => {
        setUploadingKey(null);
        setPreviewUrl(null);
        setPendingFiles({});
    }, [customerId]);

    const handleFileChange = async (key: string, docType: string, file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File terlalu besar (maks 5MB)');
            return;
        }

        // MODE 1: PENDING UPLOAD (Create New Customer)
        if (!customerId && onFileSelect) {
            setPendingFiles(prev => ({ ...prev, [key]: file }));
            onFileSelect(key, file);
            return;
        }

        // MODE 2: DIRECT UPLOAD (Edit Existing Customer)
        setUploadingKey(key);
        try {
            const formData = new FormData();
            formData.append('document', file);

            const res = await fetchApi(`/upload/customer/${customerId}/${docType}`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                onDocumentChange(key, data.url);
                toast.success('Dokumen berhasil diunggah');
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal mengunggah dokumen');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        } finally {
            setUploadingKey(null);
        }
    };

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DOCUMENT_FIELDS.map((field) => {
                    const hasDoc = !!documents[field.key];
                    const isPending = !!pendingFiles[field.key];
                    const isUploading = uploadingKey === field.key;

                    return (
                        <div
                            key={field.key}
                            className={`flex flex-col p-4 rounded-xl border transition-all ${hasDoc ? 'bg-green-50 border-green-200' :
                                isPending ? 'bg-blue-50 border-blue-200' :
                                    'bg-white border-gray-200'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasDoc ? 'bg-green-100 text-green-600' :
                                        isPending ? 'bg-blue-100 text-blue-600' :
                                            'bg-gray-100 text-gray-400'
                                        }`}>
                                        <FontAwesomeIcon icon={field.icon} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-700">{field.label}</div>
                                        <div className="text-xs mt-1">
                                            {hasDoc ? (
                                                <span className="text-green-600 font-medium flex items-center gap-1">
                                                    <FontAwesomeIcon icon={faCheckCircle} /> Tersimpan
                                                </span>
                                            ) : isPending ? (
                                                <span className="text-blue-600 font-medium flex items-center gap-1">
                                                    <FontAwesomeIcon icon={faCheckCircle} /> Siap Upload
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">Belum ada file</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-auto">
                                {hasDoc && (
                                    <button
                                        type="button"
                                        onClick={() => setPreviewUrl(`${API_URL}${documents[field.key]}`)}
                                        className="flex-1 py-2 text-xs rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-all"
                                    >
                                        <FontAwesomeIcon icon={faEye} className="mr-1" />
                                        Lihat
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => fileRefs.current[field.key]?.click()}
                                    disabled={isUploading}
                                    className={`flex-1 py-2 text-xs rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${hasDoc || isPending
                                        ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                        : 'bg-[#00bfa5] text-white hover:bg-[#00a891]'
                                        }`}
                                >
                                    {isUploading ? (
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faCloudUploadAlt} />
                                            {hasDoc ? 'Ganti' : isPending ? 'Ganti File' : 'Upload'}
                                        </>
                                    )}
                                </button>
                                <input
                                    ref={(el) => { fileRefs.current[field.key] = el; }}
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) handleFileChange(field.key, field.docType, e.target.files[0]);
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
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold">Preview Dokumen</h3>
                            <button onClick={() => setPreviewUrl(null)}><FontAwesomeIcon icon={faTimesCircle} size="lg" /></button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 bg-gray-100 text-center">
                            {previewUrl.toLowerCase().endsWith('.pdf') ? (
                                <iframe src={previewUrl} className="w-full h-[600px] rounded-lg" />
                            ) : (
                                <img src={previewUrl} alt="Preview" className="max-w-full h-auto rounded-lg mx-auto shadow-lg" />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
