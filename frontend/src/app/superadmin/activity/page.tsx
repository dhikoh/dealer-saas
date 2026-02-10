'use client';
import { useEffect, useState, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import { Activity, Search, ShieldAlert, User, Database, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';

interface ActivityLog {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    details: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    user: {
        name: string;
        email: string;
        role: string;
    };
}

const actionIcons: Record<string, any> = {
    LOGIN: User,
    LOGOUT: User,
    CREATE: Database,
    UPDATE: Database,
    DELETE: ShieldAlert,
    PLAN_CHANGE: CreditCard,
    Approve: Activity,
    Reject: ShieldAlert,
};

export default function ActivityLogPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(20);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            // Using the paginated endpoint we added
            const res = await fetch(`${API_URL}/superadmin/activity/full?page=${page}&limit=${limit}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data.data);
                setTotalPages(data.meta.lastPage);
            }
        } catch { /* ignore */ }
        setLoading(false);
    }, [token, page, limit]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const getIcon = (action: string) => {
        // Simple heuristic to match icons
        if (action.includes('LOGIN')) return User;
        if (action.includes('CREATE')) return Database;
        if (action.includes('DELETE')) return ShieldAlert;
        if (action.includes('PLAN')) return CreditCard;
        return Activity;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
                <p className="text-slate-500 text-sm mt-1">Audit trail aktivitas sistem dan user</p>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Activity className="w-4 h-4" />
                        <span>System Audit Trail</span>
                    </div>
                    <span className="text-xs text-slate-400">Total Pages: {totalPages}</span>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {logs.map(log => {
                            const Icon = getIcon(log.action);
                            return (
                                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors text-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500 mt-1">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-slate-900">
                                                    {log.action} <span className="font-normal text-slate-500">on</span> {log.entity}
                                                </p>
                                                <span className="text-xs text-slate-400 font-mono">
                                                    {new Date(log.createdAt).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 mt-0.5">{log.details}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {log.user.name} ({log.user.role})
                                                </span>
                                                {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {logs.length === 0 && (
                            <div className="p-12 text-center text-slate-400">
                                Tidak ada aktivitas tercatat
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <span className="text-sm text-slate-600">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
