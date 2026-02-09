'use client';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
}

const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
};

export default function LoadingSpinner({
    size = 'md',
    text,
    fullScreen = false
}: LoadingSpinnerProps) {
    const spinner = (
        <div className="flex flex-col items-center justify-center gap-3">
            <div
                className={`${sizes[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}
            />
            {text && (
                <p className="text-gray-500 text-sm font-medium">{text}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                {spinner}
            </div>
        );
    }

    return spinner;
}

// Skeleton loading for cards
export function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
        </div>
    );
}

// Skeleton loading for tables
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3 animate-pulse">
            {/* Header */}
            <div className="flex gap-4 p-4 bg-gray-100 rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-1/6" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/6" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-20" />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 bg-white rounded-lg border border-gray-100">
                    <div className="h-4 bg-gray-100 rounded w-1/6" />
                    <div className="h-4 bg-gray-100 rounded w-1/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/6" />
                    <div className="h-4 bg-gray-100 rounded w-1/4" />
                    <div className="h-4 bg-gray-100 rounded w-20" />
                </div>
            ))}
        </div>
    );
}

// Skeleton for stat cards
export function StatCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                    <div className="h-8 bg-gray-200 rounded w-24" />
                </div>
                <div className="w-14 h-14 bg-gray-200 rounded-xl" />
            </div>
        </div>
    );
}

// Page loading state
export function PageLoading({ text = 'Memuat...' }: { text?: string }) {
    return (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" text={text} />
        </div>
    );
}
