'use client';

import React, { useState, useEffect } from 'react';
import { useMobileContext } from '@/context/MobileContext';
import type { MobileTab } from '@/components/mobile/MobileBottomNav';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import MoreBottomSheet from '@/components/mobile/MoreBottomSheet';
import MobileDashboard from '@/components/mobile/screens/MobileDashboard';
import MobileVehicleList from '@/components/mobile/screens/MobileVehicleList';
import MobileCreditSimulator from '@/components/mobile/screens/MobileCreditSimulator';
import MobileProfile from '@/components/mobile/screens/MobileProfile';
import MobileCustomers from '@/components/mobile/screens/MobileCustomers';
import MobileTransactions from '@/components/mobile/screens/MobileTransactions';
import MobilePlaceholder from '@/components/mobile/screens/MobilePlaceholder';
import MobileSuperadminDashboard from '@/components/mobile/screens/MobileSuperadminDashboard';
import MobileTenantList from '@/components/mobile/screens/MobileTenantList';

interface MobileAppShellProps {
    user: {
        name?: string;
        email?: string;
        role?: string;
        tenant?: { name?: string; subscriptionStatus?: string };
        [key: string]: unknown;
    };
    onLogout: () => void;
}

export default function MobileAppShell({ user, onLogout }: MobileAppShellProps) {
    const { theme } = useMobileContext();
    const [activeTab, setActiveTab] = useState<MobileTab>('home');
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const isSuperadmin = user?.role === 'SUPERADMIN';

    // Open the MoreBottomSheet when "more" tab is tapped  
    const handleTabChange = (tab: MobileTab) => {
        if (tab === 'more') {
            setIsMoreOpen(true);
        } else {
            setActiveTab(tab);
        }
    };

    const handleMoreTabChange = (tab: MobileTab) => {
        setActiveTab(tab);
        setIsMoreOpen(false);
    };

    const renderScreen = () => {
        if (isSuperadmin) {
            switch (activeTab) {
                case 'home': return <MobileSuperadminDashboard user={user} />;
                case 'vehicles': return <MobileTenantList />;
                case 'profile': return <MobileProfile user={user} onLogout={onLogout} />;
                default: return <MobilePlaceholder tabId={activeTab} />;
            }
        }

        switch (activeTab) {
            case 'home': return <MobileDashboard user={user} onTabChange={setActiveTab} />;
            case 'vehicles': return <MobileVehicleList />;
            case 'credit': return <MobileCreditSimulator />;
            case 'profile': return <MobileProfile user={user} onLogout={onLogout} />;
            case 'customers': return <MobileCustomers />;
            case 'transactions': return <MobileTransactions />;
            default: return <MobilePlaceholder tabId={activeTab} />;
        }
    };

    return (
        <div className={`w-full h-[100dvh] ${theme.bgFrame} flex flex-col overflow-hidden relative no-select`}>
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto hide-scrollbar smooth-scroll pb-[calc(5rem+env(safe-area-inset-bottom,20px))]">
                {renderScreen()}
            </div>

            {/* Floating Bottom Navigation */}
            <MobileBottomNav
                activeTab={activeTab}
                onChange={handleTabChange}
                isSuperadmin={isSuperadmin}
            />

            {/* More Menu Bottom Sheet */}
            <MoreBottomSheet
                isOpen={isMoreOpen}
                onClose={() => setIsMoreOpen(false)}
                onChangeTab={handleMoreTabChange}
                isSuperadmin={isSuperadmin}
            />
        </div>
    );
}
