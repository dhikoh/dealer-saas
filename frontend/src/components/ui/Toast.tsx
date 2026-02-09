'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        (type: ToastType, title: string, message?: string, duration = 4000) => {
            const id = Math.random().toString(36).substr(2, 9);
            const newToast: Toast = { id, type, title, message, duration };

            setToasts((prev) => [...prev, newToast]);

            if (duration > 0) {
                setTimeout(() => removeToast(id), duration);
            }
        },
        [removeToast]
    );

    const success = useCallback(
        (title: string, message?: string) => showToast('success', title, message),
        [showToast]
    );

    const error = useCallback(
        (title: string, message?: string) => showToast('error', title, message, 6000),
        [showToast]
    );

    const warning = useCallback(
        (title: string, message?: string) => showToast('warning', title, message),
        [showToast]
    );

    const info = useCallback(
        (title: string, message?: string) => showToast('info', title, message),
        [showToast]
    );

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Toast container with CSS animations
function ToastContainer({
    toasts,
    removeToast
}: {
    toasts: Toast[];
    removeToast: (id: string) => void
}) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

// Individual toast with CSS animation
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 200);
    };

    const icons = {
        success: CheckCircle,
        error: XCircle,
        warning: AlertTriangle,
        info: Info,
    };

    const colors = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
    };

    const iconColors = {
        success: 'text-green-500',
        error: 'text-red-500',
        warning: 'text-yellow-500',
        info: 'text-blue-500',
    };

    const Icon = icons[toast.type];

    return (
        <div
            className={`
        pointer-events-auto p-4 rounded-xl border shadow-lg backdrop-blur-sm
        transition-all duration-200 ease-out
        ${colors[toast.type]}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
        >
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[toast.type]}`} />
                <div className="flex-1 min-w-0">
                    <p className="font-medium">{toast.title}</p>
                    {toast.message && (
                        <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
                    )}
                </div>
                <button
                    onClick={handleClose}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
