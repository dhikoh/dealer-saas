'use client';
import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'success' | 'info';
    isLoading?: boolean;
}

const variantStyles = {
    danger: {
        icon: '⚠️',
        button: 'bg-red-500 hover:bg-red-600',
        border: 'border-red-500/30',
        glow: 'shadow-red-500/20',
    },
    warning: {
        icon: '⚡',
        button: 'bg-amber-500 hover:bg-amber-600',
        border: 'border-amber-500/30',
        glow: 'shadow-amber-500/20',
    },
    success: {
        icon: '✅',
        button: 'bg-emerald-500 hover:bg-emerald-600',
        border: 'border-emerald-500/30',
        glow: 'shadow-emerald-500/20',
    },
    info: {
        icon: 'ℹ️',
        button: 'bg-blue-500 hover:bg-blue-600',
        border: 'border-blue-500/30',
        glow: 'shadow-blue-500/20',
    },
};

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    variant = 'danger',
    isLoading = false,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const styles = variantStyles[variant];

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Dialog */}
            <div
                ref={dialogRef}
                onClick={(e) => e.stopPropagation()}
                className={`
                    relative w-full max-w-md mx-4 p-6 rounded-2xl 
                    bg-[#1a1d23] border ${styles.border}
                    shadow-2xl ${styles.glow}
                    animate-in fade-in zoom-in-95 duration-200
                `}
            >
                {/* Icon */}
                <div className="text-center mb-4">
                    <span className="text-4xl">{styles.icon}</span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white text-center mb-2">
                    {title}
                </h3>

                {/* Message */}
                <p className="text-gray-400 text-center text-sm mb-6 leading-relaxed">
                    {message}
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="
                            flex-1 px-4 py-2.5 rounded-xl 
                            bg-[#2a2d35] text-gray-300 font-medium
                            hover:bg-[#3a3d45] transition-colors
                            disabled:opacity-50
                        "
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`
                            flex-1 px-4 py-2.5 rounded-xl 
                            ${styles.button} text-white font-medium
                            transition-colors disabled:opacity-50
                            flex items-center justify-center gap-2
                        `}
                    >
                        {isLoading && (
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>

        </div>
    );
}
