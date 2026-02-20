'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';

interface BottomModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function BottomModal({ isOpen, onClose, title, children }: BottomModalProps) {
    const { theme } = useMobileContext();

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[80] backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className={`fixed bottom-0 left-0 right-0 max-h-[90dvh] flex flex-col z-[90] ${theme.bgCard} rounded-t-[40px] rounded-b-none shadow-[0_-20px_50px_rgba(0,0,0,0.3)] animate-slide-up-modal`}>

                {/* Grab Handle */}
                <div className="w-full flex justify-center pt-4 pb-2">
                    <div className={`w-12 h-1.5 rounded-full ${theme.name === 'dark-neu' ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                </div>

                {/* Modal Header */}
                <div className="px-6 pb-4 flex justify-between items-center">
                    <h2 className={`text-xl font-black tracking-tight ${theme.textMain}`}>{title}</h2>
                    <button
                        onClick={onClose}
                        className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 ${theme.iconContainer}`}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="overflow-y-auto hide-scrollbar smooth-scroll p-6 pt-2 pb-[calc(2rem+env(safe-area-inset-bottom,20px))]">
                    {children}
                </div>
            </div>
        </>
    );
}
