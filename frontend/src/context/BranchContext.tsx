
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/lib/api';

export interface Branch {
    id: string;
    name: string;
    isMain: boolean;
    address?: string;
    phone?: string;
}

interface BranchContextType {
    branches: Branch[];
    currentBranch: Branch | null;
    isLoading: boolean;
    setBranch: (branch: Branch) => void;
    refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshBranches = useCallback(async () => {
        try {
            const res = await fetchApi('/branches');

            if (res.ok) {
                const data = await res.json();
                setBranches(data);

                // Restore selected branch or default to Main
                const storedBranchId = localStorage.getItem('otohub_branch_id');
                const found = data.find((b: Branch) => b.id === storedBranchId);

                if (found) {
                    setCurrentBranch(found);
                } else if (data.length > 0) {
                    // Default to main branch or first branch
                    const main = data.find((b: Branch) => b.isMain) || data[0];
                    setCurrentBranch(main);
                    localStorage.setItem('otohub_branch_id', main.id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch branches:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshBranches();
    }, [refreshBranches]);

    const setBranch = (branch: Branch) => {
        setCurrentBranch(branch);
        localStorage.setItem('otohub_branch_id', branch.id);
    };

    return (
        <BranchContext.Provider value={{ branches, currentBranch, isLoading, setBranch, refreshBranches }}>
            {children}
        </BranchContext.Provider>
    );
}

export function useBranch() {
    const context = useContext(BranchContext);
    if (!context) {
        throw new Error('useBranch must be used within a BranchProvider');
    }
    return context;
}
