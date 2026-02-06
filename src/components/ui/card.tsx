"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps {
    children: ReactNode;
    className?: string;
    padding?: "none" | "sm" | "md" | "lg";
    hover?: boolean;
}

export function Card({ children, className, padding = "md", hover = false }: CardProps) {
    const paddings = {
        none: "",
        sm: "p-3",
        md: "p-4 md:p-6",
        lg: "p-6 md:p-8"
    };

    return (
        <div
            className={cn(
                "bg-white rounded-2xl border border-slate-100 shadow-sm",
                hover && "transition-shadow hover:shadow-md hover:border-slate-200",
                paddings[padding],
                className
            )}
        >
            {children}
        </div>
    );
}

export interface CardHeaderProps {
    title: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
    className?: string;
}

export function CardHeader({ title, description, action, icon, className }: CardHeaderProps) {
    return (
        <div className={cn("flex items-start justify-between gap-4 mb-4", className)}>
            <div className="min-w-0 flex-1 flex items-center gap-2">
                {icon && <span className="text-primary-500 flex-shrink-0">{icon}</span>}
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 truncate">{title}</h3>
                    {description && (
                        <p className="text-sm text-slate-500 mt-0.5">{description}</p>
                    )}
                </div>
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
        </div>
    );
}
