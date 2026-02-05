"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Button, Alert } from "@/components/ui";
import { Car, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    const error = searchParams.get("error");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(error ? "Terjadi kesalahan saat login" : "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setErrorMessage(result.error);
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch {
            setErrorMessage("Terjadi kesalahan jaringan");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left Side - Branding */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 p-12 flex-col justify-between">
                <div>
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
                            <Car className="h-8 w-8" />
                        </div>
                        <span className="text-2xl font-bold">Showroom Dealer</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                        Kelola Showroom Anda dengan Mudah
                    </h1>
                    <p className="text-lg text-primary-100 max-w-md">
                        Platform lengkap untuk manajemen kendaraan, penjualan, kredit, dan keuangan dealer Anda.
                    </p>

                    <div className="flex gap-4 pt-4">
                        <div className="flex items-center gap-2 text-primary-100">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            <span className="text-sm">Multi-Tenant</span>
                        </div>
                        <div className="flex items-center gap-2 text-primary-100">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            <span className="text-sm">Real-time</span>
                        </div>
                        <div className="flex items-center gap-2 text-primary-100">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            <span className="text-sm">Secure</span>
                        </div>
                    </div>
                </div>

                <p className="text-primary-200 text-sm">
                    © 2026 Showroom Dealer. All rights reserved.
                </p>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-slate-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="md:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="p-2 bg-primary-500 rounded-xl">
                            <Car className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">Showroom Dealer</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Selamat Datang!</h2>
                            <p className="text-slate-500 mt-2">Masuk ke akun Anda untuk melanjutkan</p>
                        </div>

                        {errorMessage && (
                            <Alert
                                variant="error"
                                message={errorMessage}
                                onClose={() => setErrorMessage("")}
                                className="mb-6"
                            />
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                label="Email"
                                type="email"
                                placeholder="nama@dealer.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />

                            <div className="relative">
                                <Input
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                isLoading={isLoading}
                            >
                                Masuk
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <a href="#" className="text-sm text-primary-600 hover:text-primary-700 transition-colors">
                                Lupa password?
                            </a>
                        </div>
                    </div>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        Belum punya akun?{" "}
                        <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                            Hubungi Admin
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
