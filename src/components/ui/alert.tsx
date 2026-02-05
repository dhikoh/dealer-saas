"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AlertProps {
    variant: AlertVariant;
    title?: string;
    message: string;
    onClose?: () => void;
    className?: string;
}

const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
};

const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
};

const iconStyles = {
    success: "text-green-500",
    error: "text-red-500",
    warning: "text-amber-500",
    info: "text-blue-500"
};

export function Alert({ variant, title, message, onClose, className }: AlertProps) {
    const Icon = icons[variant];

    return (
        <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl border",
            styles[variant],
            className
        )}>
            <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconStyles[variant])} />
            <div className="flex-1 min-w-0">
                {title && (
                    <p className="font-medium mb-0.5">{title}</p>
                )}
                <p className="text-sm break-words whitespace-normal">{message}</p>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-black/5 transition-colors flex-shrink-0"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
