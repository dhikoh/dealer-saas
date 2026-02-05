"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, hint, id, ...props }, ref) => {
        const inputId = id || props.name;

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    id={inputId}
                    className={cn(
                        "w-full max-w-full px-4 py-2.5 rounded-xl border bg-white",
                        "text-slate-900 placeholder:text-slate-400",
                        "transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                        error
                            ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                            : "border-slate-200 hover:border-slate-300",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="mt-1.5 text-sm text-red-600">{error}</p>
                )}
                {hint && !error && (
                    <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export { Input };
