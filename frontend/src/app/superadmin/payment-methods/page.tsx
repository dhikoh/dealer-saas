'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit2, Check, X, Building2, QrCode, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';

interface PaymentMethod {
    id: string;
    provider: string;
    accountName: string;
    accountNumber: string;
    description?: string;
    logo?: string;
    isActive: boolean;
    instructions?: string;
}

export default function PaymentMethodsPage() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<PaymentMethod>>({
        provider: 'BCA',
        isActive: true
    });
    const [editId, setEditId] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    useEffect(() => {
        fetchMethods();
    }, []);

    const fetchMethods = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/payment-methods/admin/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMethods(data);
            }
        } catch (error) {
            toast.error('Failed to load payment methods');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            const url = editId
                ? `${API_URL}/payment-methods/admin/${editId}`
                : `${API_URL}/payment-methods/admin`;

            const method = editId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(editId ? 'Method updated' : 'Method created');
                fetchMethods();
                setIsModalOpen(false);
                setFormData({ provider: 'BCA', isActive: true });
                setEditId(null);
            } else {
                throw new Error('Operation failed');
            }
        } catch (error) {
            toast.error('Failed to save payment method');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${API_URL}/payment-methods/admin/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Deleted successfully');
            fetchMethods();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setMethods(prev => prev.map(m => m.id === id ? { ...m, isActive: !currentStatus } : m));

        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${API_URL}/payment-methods/admin/${id}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });
        } catch {
            // Revert
            setMethods(prev => prev.map(m => m.id === id ? { ...m, isActive: currentStatus } : m));
            toast.error('Failed to update status');
        }
    };

    const getIcon = (provider: string) => {
        if (provider.includes('QRIS')) return <QrCode className="h-6 w-6" />;
        return <Building2 className="h-6 w-6" />;
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Payment Methods</h1>
                    <p className="text-gray-500">Manage bank accounts and payment channels</p>
                </div>
                <button
                    onClick={() => { setEditId(null); setFormData({}); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4" /> Add Method
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-6 rounded-xl border space-y-4">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {methods.map(method => (
                        <div key={method.id} className={`bg-white p-6 rounded-xl border transition-all hover:shadow-lg ${!method.isActive && 'opacity-70 bg-gray-50'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        {getIcon(method.provider)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{method.provider}</h3>
                                        <p className="text-sm text-gray-500">{method.accountName}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setEditId(method.id); setFormData(method); setIsModalOpen(true); }}
                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(method.id)}
                                        className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg mb-4 font-mono text-lg text-center tracking-wider border border-dashed border-gray-300">
                                {method.accountNumber}
                            </div>

                            <div className="flex items-center justify-between">
                                <span className={`text-xs px-2 py-1 rounded-full ${method.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                                    {method.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <button
                                    onClick={() => toggleActive(method.id, method.isActive)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${method.isActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${method.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{editId ? 'Edit Method' : 'Add New Method'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Provider Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. BCA, QRIS, MANDIRI"
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.provider || ''}
                                    onChange={e => setFormData({ ...formData, provider: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Account Number / QR String</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 1234567890"
                                    className="w-full border rounded-lg px-3 py-2 font-mono"
                                    value={formData.accountNumber || ''}
                                    onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. PT OTOHUB INDONESIA"
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.accountName || ''}
                                    onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Instructions (Optional)</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                    rows={3}
                                    placeholder="Additional notes..."
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="h-4 w-4" /> Save Method
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
