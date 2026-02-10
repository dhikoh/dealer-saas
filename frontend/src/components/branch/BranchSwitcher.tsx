
'use client';

import React from 'react';
import { useBranch } from '@/context/BranchContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCodeBranch, faCheck } from '@fortawesome/free-solid-svg-icons';

export default function BranchSwitcher() {
    const { branches, currentBranch, setBranch, isLoading } = useBranch();
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (isLoading || branches.length <= 1) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <FontAwesomeIcon icon={faCodeBranch} className="text-[#00bfa5]" />
                <span className="hidden sm:inline">{currentBranch?.name || 'Pilih Cabang'}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2">
                        <div className="text-xs font-semibold text-gray-400 px-3 py-2 uppercase tracking-wider">
                            Pilih Cabang
                        </div>
                        {branches.map((branch) => (
                            <button
                                key={branch.id}
                                onClick={() => {
                                    setBranch(branch);
                                    setIsOpen(false);
                                    // Optional: reload page if context switch requires full refresh
                                    // window.location.reload(); 
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${currentBranch?.id === branch.id
                                        ? 'bg-[#00bfa5]/10 text-[#00bfa5] font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span>{branch.name}</span>
                                {currentBranch?.id === branch.id && (
                                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="bg-gray-50 px-3 py-2 border-t border-gray-100">
                        <a href="/app/settings/branches" className="text-xs text-[#00bfa5] hover:underline">
                            Kelola Cabang
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
