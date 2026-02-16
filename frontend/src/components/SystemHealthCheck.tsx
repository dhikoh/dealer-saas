'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api'; // Ensure this path matches your project structure

export default function SystemHealthCheck() {
    const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
    const [latency, setLatency] = useState<number | null>(null);

    useEffect(() => {
        const checkHealth = async () => {
            const start = performance.now();
            try {
                // Adjust endpoint based on your backend. Usually / or /api/health
                const res = await fetch(`${API_URL}/`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                const end = performance.now();
                setLatency(Math.round(end - start));

                if (res.ok) {
                    setStatus('connected');
                } else {
                    setStatus('error');
                }
            } catch (err) {
                setStatus('error');
            }
        };

        checkHealth();
        // Optional: Polling every 30s
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    if (status === 'loading') {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-gray-400" />
                Checking System...
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-red-600" />
                🔴 Disconnected ({API_URL})
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            🟢 Connected ({latency}ms)
        </div>
    );
}
