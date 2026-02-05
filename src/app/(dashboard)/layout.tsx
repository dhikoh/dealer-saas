"use client";

import { ReactNode, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Car,
    LayoutDashboard,
    Users,
    FileText,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Building2,
    HandCoins,
    ClipboardList,
    ShieldCheck
} from "lucide-react";

interface NavItem {
    label: string;
    href: string;
    icon: ReactNode;
    roles?: string[];
    children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
        label: "Kendaraan",
        href: "/dashboard/vehicles",
        icon: <Car className="h-5 w-5" />,
        children: [
            { label: "Daftar Kendaraan", href: "/dashboard/vehicles" },
            { label: "Tambah Kendaraan", href: "/dashboard/vehicles/new" },
            { label: "Master Data", href: "/dashboard/vehicles/master" }
        ]
    },
    {
        label: "Customer",
        href: "/dashboard/customers",
        icon: <Users className="h-5 w-5" />
    },
    {
        label: "Penjualan",
        href: "/dashboard/sales",
        icon: <ClipboardList className="h-5 w-5" />,
        children: [
            { label: "Draft Penjualan", href: "/dashboard/sales" },
            { label: "Transaksi", href: "/dashboard/sales/transactions" },
            { label: "Simulasi Kredit", href: "/dashboard/sales/credit-simulation" }
        ]
    },
    {
        label: "Leasing",
        href: "/dashboard/leasing",
        icon: <CreditCard className="h-5 w-5" />,
        roles: ["owner", "finance"]
    },
    {
        label: "Keuangan",
        href: "/dashboard/finance",
        icon: <HandCoins className="h-5 w-5" />,
        roles: ["owner", "finance"]
    },
    {
        label: "Pengaturan",
        href: "/dashboard/settings",
        icon: <Settings className="h-5 w-5" />,
        roles: ["owner"]
    }
];

const superAdminItems: NavItem[] = [
    {
        label: "Dashboard",
        href: "/super-admin",
        icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
        label: "Tenant / Dealer",
        href: "/super-admin/tenants",
        icon: <Building2 className="h-5 w-5" />
    },
    {
        label: "Pengguna",
        href: "/super-admin/users",
        icon: <Users className="h-5 w-5" />
    },
    {
        label: "Sistem",
        href: "/super-admin/system",
        icon: <ShieldCheck className="h-5 w-5" />
    }
];

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const isSuperAdmin = session?.user?.role === "super_admin";
    const items = isSuperAdmin ? superAdminItems : navItems;

    const toggleExpanded = (label: string) => {
        setExpandedItems(prev =>
            prev.includes(label)
                ? prev.filter(i => i !== label)
                : [...prev, label]
        );
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/login" });
    };

    const isActive = (href: string) => {
        if (href === "/dashboard" || href === "/super-admin") {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    const canAccess = (item: NavItem) => {
        if (!item.roles) return true;
        return item.roles.includes(session?.user?.role || "");
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Overlay for Mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100",
                "transform transition-transform duration-300 lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <Link href="/dashboard" className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                                    <Car className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <span className="font-bold text-slate-900">Showroom</span>
                                    <span className="text-xs block text-slate-500">
                                        {session?.user?.tenantName || "Dealer"}
                                    </span>
                                </div>
                            </Link>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4">
                        <ul className="space-y-1">
                            {items.filter(canAccess).map((item) => (
                                <li key={item.href}>
                                    {item.children ? (
                                        <div>
                                            <button
                                                onClick={() => toggleExpanded(item.label)}
                                                className={cn(
                                                    "w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl",
                                                    "text-slate-600 hover:bg-slate-50 transition-colors",
                                                    isActive(item.href) && "bg-primary-50 text-primary-600"
                                                )}
                                            >
                                                <span className="flex items-center gap-3">
                                                    {item.icon}
                                                    <span className="font-medium">{item.label}</span>
                                                </span>
                                                <ChevronDown className={cn(
                                                    "h-4 w-4 transition-transform",
                                                    expandedItems.includes(item.label) && "rotate-180"
                                                )} />
                                            </button>
                                            {expandedItems.includes(item.label) && (
                                                <ul className="mt-1 ml-4 pl-4 border-l border-slate-100 space-y-1">
                                                    {item.children.map((child) => (
                                                        <li key={child.href}>
                                                            <Link
                                                                href={child.href}
                                                                onClick={() => setSidebarOpen(false)}
                                                                className={cn(
                                                                    "block px-4 py-2 rounded-lg text-sm transition-colors",
                                                                    pathname === child.href
                                                                        ? "bg-primary-50 text-primary-600 font-medium"
                                                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                                                )}
                                                            >
                                                                {child.label}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors",
                                                isActive(item.href)
                                                    ? "bg-primary-50 text-primary-600"
                                                    : "text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            {item.icon}
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-slate-100">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                                {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 truncate">
                                    {session?.user?.name}
                                </p>
                                <p className="text-xs text-slate-500 capitalize">
                                    {session?.user?.role?.replace("_", " ")}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-100">
                    <div className="flex items-center justify-between px-4 lg:px-6 py-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        <div className="flex-1 lg:flex-none" />

                        <div className="flex items-center gap-4">
                            {/* Additional header items can go here */}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-4 lg:p-6 safe-area-bottom">
                    {children}
                </div>
            </main>
        </div>
    );
}
