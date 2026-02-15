'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Upload, ArrowRight, Building2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';

interface PaymentMethod {
    id: string;
    provider: string;
    accountName: string;
    accountNumber: string;
    description?: string;
    logo?: string;
}

interface PaymentModalProps {
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: () => void;
}

export default function PaymentModal({
    invoiceId,
    invoiceNumber,
    amount,
    isOpen,
    onClose,
    onUploadSuccess
}: PaymentModalProps) {
    const [step, setStep] = useState(1); // 1: Select Method, 2: Instruction & Upload
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [copied, setCopied] = useState(false);


    useEffect(() => {
        if (isOpen) {
            fetchMethods();
            setStep(1);
        }
    }, [isOpen]);

    const fetchMethods = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/payment-methods/active');
            if (res.ok) {
                const data = await res.json();
                setMethods(data);
                // Auto select first if only one
                if (data.length === 1) setSelectedMethod(data[0]);
            }
        } catch {
            toast.error('Failed to load payment options');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Copied to clipboard');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        setUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('proof', file);

        try {
            const res = await fetchApi(`/billing/my-invoices/${invoiceId}/upload-proof`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                toast.success('Proof uploaded successfully! 🚀');
                onUploadSuccess();
                onClose();
            } else {
                throw new Error('Upload failed');
            }
        } catch {
            toast.error('Failed to upload proof');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 border-b">
                    <h2 className="text-xl font-bold">Payment for {invoiceNumber}</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Total Amount: <span className="font-bold text-blue-600 text-lg">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)}
                        </span>
                    </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-16 w-full rounded-xl" />
                            <Skeleton className="h-16 w-full rounded-xl" />
                        </div>
                    ) : (
                        <>
                            {step === 1 && (
                                <div className="space-y-4">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Select Payment Method</p>
                                    {methods.map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => { setSelectedMethod(method); setStep(2); }}
                                            className="w-full flex items-center justify-between p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 group-hover:bg-blue-200 group-hover:text-blue-700">
                                                    {method.provider.includes('QRIS') ? <QrCode className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="font-bold">{method.provider}</h3>
                                                    <p className="text-xs text-gray-500">{method.accountName}</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ))}
                                    {methods.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            No payment methods active. Please contact support.
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 2 && selectedMethod && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 p-4 rounded-xl text-center">
                                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Transfer to</p>
                                        <h3 className="font-bold text-lg">{selectedMethod.provider}</h3>
                                        <div className="flex items-center justify-center gap-2 mt-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-dashed border-blue-200">
                                            <code className="text-xl font-mono tracking-wider">{selectedMethod.accountNumber}</code>
                                            <button
                                                onClick={() => handleCopy(selectedMethod.accountNumber)}
                                                className="p-1 hover:bg-gray-100 rounded text-gray-500"
                                            >
                                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-center mt-2 text-gray-500">a.n {selectedMethod.accountName}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Upload Payment Proof</label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                            />
                                            {uploading ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                    <p className="text-sm text-gray-500">Uploading...</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-gray-500">
                                                    <Upload className="h-8 w-8 text-gray-400" />
                                                    <p className="text-sm font-medium">Click to upload image</p>
                                                    <p className="text-xs">JPG, PNG up to 5MB</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setStep(1)}
                                        className="w-full text-gray-500 text-sm hover:text-gray-800"
                                    >
                                        &larr; Choose another method
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 dark:bg-gray-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
