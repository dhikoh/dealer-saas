'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        Terjadi Kesalahan
                    </h2>
                    <p className="text-gray-500 mb-4 max-w-md">
                        Maaf, terjadi kesalahan saat memuat halaman ini.
                        Silakan coba lagi atau hubungi support jika masalah berlanjut.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Coba Lagi
                    </button>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-xs text-red-600 max-w-xl overflow-auto">
                            {this.state.error.message}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

// Wrapper for async components
export function AsyncBoundary({
    children,
    loading,
    error
}: {
    children: ReactNode;
    loading?: ReactNode;
    error?: ReactNode;
}) {
    return (
        <ErrorBoundary fallback={error}>
            <React.Suspense fallback={loading || <DefaultLoading />}>
                {children}
            </React.Suspense>
        </ErrorBoundary>
    );
}

function DefaultLoading() {
    return (
        <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
    );
}
