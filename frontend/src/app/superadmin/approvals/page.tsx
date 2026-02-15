'use client';
import { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { Clock, CheckCircle, XCircle, Send, AlertCircle } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

import { ApprovalRequest } from '@/types/superadmin';

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    PENDING: { label: 'Menunggu', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    APPROVED: { label: 'Disetujui', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    REJECTED: { label: 'Ditolak', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

const typeLabels: Record<string, string> = {
    PLAN_CHANGE: 'Perubahan Plan',
    BILLING_EXTEND: 'Perpanjangan Billing',
    INVOICE_ACTION: 'Aksi Invoice',
    TENANT_SUSPEND: 'Suspend Tenant',
};

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | ApprovalRequest['status']>('ALL');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{
        id: string; action: 'APPROVED' | 'REJECTED';
    } | null>(null);



    const fetchApprovals = useCallback(async () => {
        try {
            const res = await fetchApi('/superadmin/approvals');
            if (res.ok) {
                const data = await res.json();
                setApprovals(data);
            }
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

    const processApproval = async (id: string, status: ApprovalRequest['status']) => {
        setProcessingId(id);
        try {
            const res = await fetchApi(`/superadmin/approvals/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                fetchApprovals();
            }
        } catch { /* ignore */ }
        setProcessingId(null);
        setConfirmAction(null);
    };

    const filtered = filter === 'ALL' ? approvals : approvals.filter(a => a.status === filter);

    const parsePayload = (payload: string) => {
        try { return JSON.parse(payload); } catch { return {}; }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Approval Requests</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola permintaan persetujuan dari staff admin</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1">
                    {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {f === 'ALL' ? 'Semua' : statusConfig[f]?.label || f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Menunggu', count: approvals.filter(a => a.status === 'PENDING').length, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
                    { label: 'Disetujui', count: approvals.filter(a => a.status === 'APPROVED').length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
                    { label: 'Ditolak', count: approvals.filter(a => a.status === 'REJECTED').length, color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stat.count}</p>
                            <p className="text-xs text-slate-500">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Tidak ada approval request</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.map(approval => {
                            const config = statusConfig[approval.status] || statusConfig.PENDING;
                            const payload = parsePayload(approval.payload);
                            const StatusIcon = config.icon;

                            return (
                                <div key={approval.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {config.label}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                                                    {typeLabels[approval.type] || approval.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-900 font-medium mt-1">
                                                Request #{approval.id.slice(0, 8)}
                                            </p>
                                            {payload.reason && (
                                                <p className="text-xs text-slate-500 mt-1">Alasan: {payload.reason}</p>
                                            )}
                                            {payload.tenantId && (
                                                <p className="text-xs text-slate-400 mt-0.5">Tenant: {payload.tenantId.slice(0, 8)}...</p>
                                            )}
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(approval.createdAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                                })}
                                            </p>
                                        </div>

                                        {approval.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setConfirmAction({ id: approval.id, action: 'APPROVED' })}
                                                    disabled={processingId === approval.id}
                                                    className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                                >
                                                    Setujui
                                                </button>
                                                <button
                                                    onClick={() => setConfirmAction({ id: approval.id, action: 'REJECTED' })}
                                                    disabled={processingId === approval.id}
                                                    className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                                >
                                                    Tolak
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={() => confirmAction && processApproval(confirmAction.id, confirmAction.action)}
                title={confirmAction?.action === 'APPROVED' ? 'Setujui Request?' : 'Tolak Request?'}
                message={confirmAction?.action === 'APPROVED'
                    ? 'Approval request ini akan disetujui dan aksi akan dijalankan.'
                    : 'Approval request ini akan ditolak. Staff akan diberitahu.'}
                confirmText={confirmAction?.action === 'APPROVED' ? 'Ya, Setujui' : 'Ya, Tolak'}
                variant={confirmAction?.action === 'APPROVED' ? 'success' : 'danger'}
                isLoading={!!processingId}
            />
        </div>
    );
}
