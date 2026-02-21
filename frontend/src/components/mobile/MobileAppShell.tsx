'use client';

import React, { useState } from 'react';
import { useMobileContext } from '@/context/MobileContext';
import type { MobileTab } from '@/components/mobile/MobileBottomNav';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import MoreBottomSheet from '@/components/mobile/MoreBottomSheet';

// Dealer screens
import MobileDashboard from '@/components/mobile/screens/MobileDashboard';
import MobileVehicleList from '@/components/mobile/screens/MobileVehicleList';
import MobileCreditList from '@/components/mobile/screens/MobileCreditList';
import MobileCreditSimulator from '@/components/mobile/screens/MobileCreditSimulator';
import MobileProfile from '@/components/mobile/screens/MobileProfile';
import MobileCustomers from '@/components/mobile/screens/MobileCustomers';
import MobileTransactions from '@/components/mobile/screens/MobileTransactions';
import MobileReports from '@/components/mobile/screens/MobileReports';
import MobileFinance from '@/components/mobile/screens/MobileFinance';
import MobileStaff from '@/components/mobile/screens/MobileStaff';
import MobileBilling from '@/components/mobile/screens/MobileBilling';
import MobileSettings from '@/components/mobile/screens/MobileSettings';
import MobileActivity from '@/components/mobile/screens/MobileActivity';
import MobileBranches from '@/components/mobile/screens/MobileBranches';

// Superadmin screens
import MobileSuperadminDashboard from '@/components/mobile/screens/MobileSuperadminDashboard';
import MobileTenantList from '@/components/mobile/screens/MobileTenantList';
import MobileSuperadminInvoices from '@/components/mobile/screens/MobileSuperadminInvoices';
import MobileSuperadminPlans from '@/components/mobile/screens/MobileSuperadminPlans';
import MobileSuperadminUsers from '@/components/mobile/screens/MobileSuperadminUsers';
import MobileSuperadminApprovals from '@/components/mobile/screens/MobileSuperadminApprovals';
import MobileSuperadminPaymentMethods from '@/components/mobile/screens/MobileSuperadminPaymentMethods';
import MobileSuperadminSettings from '@/components/mobile/screens/MobileSuperadminSettings';
import MobileSuperadminCMS from '@/components/mobile/screens/MobileSuperadminCMS';

// Fallback
import MobilePlaceholder from '@/components/mobile/screens/MobilePlaceholder';

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
                case 'invoices': return <MobileSuperadminInvoices />;
                case 'plans': return <MobileSuperadminPlans />;
                case 'users': return <MobileSuperadminUsers />;
                case 'approvals': return <MobileSuperadminApprovals />;
                case 'payment-methods': return <MobileSuperadminPaymentMethods />;
                case 'activity': return <MobileActivity />;
                case 'settings': return <MobileSuperadminSettings />;
                case 'cms': return <MobileSuperadminCMS />;
                case 'profile': return <MobileProfile user={user} onLogout={onLogout} onTabChange={setActiveTab} />;
                case 'subscriptions': return <MobileBilling />;
                default: return <MobilePlaceholder tabId={activeTab} />;
            }
        }

        // Dealer / Owner / Staff screens
        switch (activeTab) {
            case 'home': return <MobileDashboard user={user} onTabChange={setActiveTab} />;
            case 'vehicles': return <MobileVehicleList />;
            case 'credit': return <MobileCreditList />;
            case 'customers': return <MobileCustomers />;
            case 'transactions': return <MobileTransactions />;
            case 'reports': return <MobileReports />;
            case 'finance': return <MobileFinance />;
            case 'users': return <MobileStaff />;
            case 'settings': return <MobileSettings />;
            case 'activity': return <MobileActivity />;
            case 'branches': return <MobileBranches />;
            case 'subscriptions':
            case 'invoices': return <MobileBilling />;
            case 'leasing': return <MobileCreditSimulator />;
            case 'profile': return <MobileProfile user={user} onLogout={onLogout} onTabChange={setActiveTab} />;
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
