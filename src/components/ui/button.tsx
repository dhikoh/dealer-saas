"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        className,
        variant = "primary",
        size = "md",
        isLoading,
        leftIcon,
        rightIcon,
        children,
        disabled,
        ...props
    }, ref) => {
        const baseStyles = cn(
            "inline-flex items-center justify-center font-medium rounded-xl",
            "transition-all duration-200 active:scale-[0.98]",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        );

        const variants = {
            primary: cn(
                "bg-gradient-to-r from-primary-600 to-primary-500 text-white",
                "hover:from-primary-700 hover:to-primary-600",
                "focus:ring-primary-500 shadow-lg shadow-primary-500/25",
                "hover:shadow-xl hover:shadow-primary-500/30"
            ),
            secondary: cn(
                "bg-slate-100 text-slate-900",
                "hover:bg-slate-200",
                "focus:ring-slate-400"
            ),
            outline: cn(
                "border-2 border-slate-200 bg-transparent text-slate-700",
                "hover:bg-slate-50 hover:border-slate-300",
                "focus:ring-slate-400"
            ),
            ghost: cn(
                "bg-transparent text-slate-700",
                "hover:bg-slate-100",
                "focus:ring-slate-400"
            ),
            danger: cn(
                "bg-gradient-to-r from-red-600 to-red-500 text-white",
                "hover:from-red-700 hover:to-red-600",
                "focus:ring-red-500 shadow-lg shadow-red-500/25"
            )
        };

        const sizes = {
            sm: "px-3 py-1.5 text-sm gap-1.5",
            md: "px-4 py-2.5 text-base gap-2",
            lg: "px-6 py-3 text-lg gap-2.5"
        };

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : leftIcon}
                {children}
                {!isLoading && rightIcon}
            </button>
        );
    }
);

Button.displayName = "Button";

export { Button };
