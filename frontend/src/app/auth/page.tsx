'use client';

import React, { useState, useEffect } from 'react';
import styles from './auth.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faLock, faCheck, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope as faEnvelopeReg, faUser as faUserReg } from '@fortawesome/free-regular-svg-icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Script from 'next/script';
import { API_URL } from '@/lib/api';
import translations, { Language } from '@/lib/translations';
import { useAuth } from '@/context/AuthContext';

// Helper to set auth cookie for middleware
// Helper to set auth cookie for middleware - REMOVED (Handled by Backend)
// function setAuthCookie(token: string) { ... }

// Helper to clear auth cookie
function clearAuthCookie() {
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.modula.click; secure; samesite=none';
}

type FormType = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
    const { refreshUser } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [currentLang, setCurrentLang] = useState<Language>('id');
    const [isLangOpen, setIsLangOpen] = useState(false); // NEW STATE
    const [activeForm, setActiveForm] = useState<FormType>('login');

    const LANG_OPTIONS = [
        { code: 'id', label: 'ID', flag: 'id' },
        { code: 'en', label: 'EN', flag: 'us' },
        { code: 'th', label: 'TH', flag: 'th' },
        { code: 'ph', label: 'PH', flag: 'ph' },
        { code: 'vi', label: 'VI', flag: 'vn' },
    ];
    const [isAnimating, setIsAnimating] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // NEW STATE FOR VISIBILITY
    const [showPassword, setShowPassword] = useState(false);
    // Removed redundant showSignupPass state
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // DYNAMIC HEIGHT REF
    const [wrapperHeight, setWrapperHeight] = useState<number | 'auto'>('auto');
    const loginRef = React.useRef<HTMLDivElement>(null);
    const signupRef = React.useRef<HTMLDivElement>(null);
    const forgotRef = React.useRef<HTMLDivElement>(null);

    const router = useRouter();
    const t = translations[currentLang];

    // ANIMATE HEIGHT ON FORM SWITCH
    useEffect(() => {
        let activeRef = loginRef;
        if (activeForm === 'signup') activeRef = signupRef;
        if (activeForm === 'forgot') activeRef = forgotRef;

        if (activeRef.current) {
            setWrapperHeight(activeRef.current.offsetHeight);
        }
    }, [activeForm, mounted, errors]); // Update when form changes or errors (validation msg) appear

    useEffect(() => {
        setMounted(true);

        // M7: Support ?form=forgot redirect
        const params = new URLSearchParams(window.location.search);
        const formParam = params.get('form');
        if (formParam === 'forgot') {
            setActiveForm('forgot');
        } else if (formParam === 'signup') {
            setActiveForm('signup');
        }
    }, [router]);

    // EMAIL REGEX VALIDATION
    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const switchForm = (formName: FormType) => {
        if (activeForm === formName) return;

        setIsAnimating(true);
        setApiError(null);
        setErrors({});

        // Immediate switch to sync with animation
        setActiveForm(formName);

        setTimeout(() => {
            setIsAnimating(false);
        }, 600);
    };



    const handleSubmit = async (e: React.FormEvent, type: FormType) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;

        setErrors({});
        setApiError(null);

        // ==================== LOGIN HANDLER ====================
        if (type === 'login') {

            try {
                const emailInput = form.elements.namedItem('login_email') as HTMLInputElement;
                const passInput = form.elements.namedItem('login_password') as HTMLInputElement;

                if (!emailInput || !passInput) {
                    toast.error("Form Error: Inputs missing");
                    return;
                }

                const email = emailInput.value.trim().toLowerCase();
                const password = passInput.value;

                // 1. Validate Login
                let hasError = false;
                if (!email) {
                    setErrors(prev => ({ ...prev, login_email: true }));
                    toast.error(`${t.authErrRequired}: Email/Username`);
                    hasError = true;
                }
                if (!password) {
                    setErrors(prev => ({ ...prev, login_password: true }));
                    if (!hasError) toast.error(`${t.authErrRequired}: Password`);
                    hasError = true;
                }

                if (hasError) {
                    return;
                }

                // 2. Execute Login
                setIsLoading(true);
                const endpoint = `${API_URL}/auth/login`;

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include',
                });

                const data = await res.json();

                // Store tokens
                localStorage.setItem('user_info', JSON.stringify(data.user));
                if (data.access_token) localStorage.setItem('access_token', data.access_token);
                if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);

                if (rememberMe) {
                    localStorage.setItem('remember_me', 'true');
                } else {
                    localStorage.removeItem('remember_me');
                }

                toast.success(`Welcome ${data.user.name}!`);
                await refreshUser();

                setTimeout(() => {
                    router.refresh();
                    const params = new URLSearchParams(window.location.search);
                    const redirectUrl = params.get('redirect');
                    if (redirectUrl) {
                        router.push(redirectUrl);
                        return;
                    }
                    if (data.user.role === 'SUPERADMIN') {
                        router.push('/superadmin');
                    } else if (!data.user.onboardingCompleted) {
                        router.push('/onboarding');
                    } else {
                        router.push('/app');
                    }
                }, 1000);

            } catch (err: any) {
                toast.error(err.message || 'Login Failed');
                setApiError(err.message || 'Login Failed');
            } finally {
                setIsLoading(false);
            }
        }
        // ==================== SIGNUP HANDLER ====================
        else if (type === 'signup') {
            const usernameInput = form.elements.namedItem('signup_username') as HTMLInputElement;
            const emailInput = form.elements.namedItem('signup_email') as HTMLInputElement;
            const passInput = form.elements.namedItem('signup_pass') as HTMLInputElement;
            const confirmPassInput = form.elements.namedItem('signup_confirm_pass') as HTMLInputElement;

            const username = usernameInput.value.trim();
            const email = emailInput.value.trim().toLowerCase();
            const password = passInput.value;
            const confirmPass = confirmPassInput.value;

            let hasError = false;

            // Validate Username
            if (!username) {
                setErrors(prev => ({ ...prev, signup_username: true }));
                if (!hasError) toast.error(`${t.authErrRequired}: Username`);
                hasError = true;
            } else if (username.length < 3) {
                setErrors(prev => ({ ...prev, signup_username: true }));
                if (!hasError) toast.error('Username terlalu pendek (min 3 chars)');
                hasError = true;
            }

            // Validate Email
            if (!email) {
                setErrors(prev => ({ ...prev, signup_email: true }));
                if (!hasError) toast.error(`${t.authErrRequired}: Email`);
                hasError = true;
            } else if (!isValidEmail(email)) {
                setErrors(prev => ({ ...prev, signup_email: true }));
                if (!hasError) toast.error('Format Email Salah');
                hasError = true;
            }

            // Validate Password
            if (!password) {
                setErrors(prev => ({ ...prev, signup_pass: true }));
                if (!hasError) toast.error(`${t.authErrRequired}: Password`);
                hasError = true;
            } else if (password.length < 8) {
                setErrors(prev => ({ ...prev, signup_pass: true }));
                if (!hasError) toast.error('Password terlalu pendek (min 8 chars)');
                hasError = true;
            } else {
                const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
                if (!complexityRegex.test(password)) {
                    setErrors(prev => ({ ...prev, signup_pass: true }));
                    if (!hasError) toast.error('Password lemah (Huruf Besar, Kecil, Angka)');
                    hasError = true;
                }
            }

            // Validate Confirmation
            if (confirmPass !== password) {
                setErrors(prev => ({ ...prev, signup_confirm_pass: true }));
                if (!hasError) toast.error('Password Tidak Cocok');
                hasError = true;
            }

            if (hasError) return;

            // Execute Signup
            setIsLoading(true);
            try {
                const res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                    credentials: 'include',
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || t.authErrSignupFailed);
                }

                const data = await res.json();
                localStorage.setItem('user_info', JSON.stringify(data.user));
                if (data.access_token) localStorage.setItem('access_token', data.access_token);
                if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);

                toast.success(t.authAlertSignup);
                setTimeout(() => {
                    router.push(`/auth/verify?email=${email}`);
                }, 1000);
            } catch (err: any) {
                toast.error(err.message || 'Signup Failed');
                setApiError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        // ==================== FORGOT PASSWORD HANDLER ====================
        else if (type === 'forgot') {
            const emailInput = form.elements.namedItem('forgot_email') as HTMLInputElement;
            const email = emailInput.value.trim().toLowerCase();

            let hasError = false;
            if (!email) {
                setErrors(prev => ({ ...prev, forgot_email: true }));
                toast.error(`${t.authErrRequired}: Email`);
                hasError = true;
            } else if (!isValidEmail(email)) {
                setErrors(prev => ({ ...prev, forgot_email: true }));
                toast.error('Format Email Salah');
                hasError = true;
            }

            if (hasError) return;

            setIsLoading(true);
            try {
                const res = await fetch(`${API_URL}/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Gagal mengirim link reset.');
                }

                toast.success(t.authAlertForgot);
                switchForm('login');
            } catch (err: any) {
                toast.error(err.message || 'Error occurred');
                setApiError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // ==================== GOOGLE OAUTH ====================
    const handleGoogleLogin = async () => {
        const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!googleClientId) {
            toast.error('Google OAuth belum dikonfigurasi.');
            return;
        }

        // Use Google Identity Services
        const google = (window as any).google;
        if (!google) {
            toast.error('Google script belum dimuat. Coba refresh halaman.');
            return;
        }

        google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: any) => {
                setIsLoading(true);
                try {
                    const res = await fetch(`${API_URL}/auth/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ credential: response.credential }),
                        credentials: 'include', // Enable cookie storage
                    });

                    if (!res.ok) {
                        const errorData = await res.json();
                        throw new Error(errorData.message || 'Google login gagal.');
                    }

                    const data = await res.json();

                    // Access Token is set via HTTP-only Cookie by backend
                    localStorage.setItem('user_info', JSON.stringify(data.user));
                    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);

                    toast.success(`Welcome ${data.user.name}!`);

                    setTimeout(async () => {
                        router.refresh();

                        const params = new URLSearchParams(window.location.search);
                        const redirectUrl = params.get('redirect');

                        if (redirectUrl) {
                            router.push(redirectUrl);
                            return;
                        }

                        if (data.user.role === 'SUPERADMIN') {
                            router.push('/superadmin');
                        } else if (!data.user.onboardingCompleted) {
                            router.push('/onboarding');
                        } else {
                            router.push('/app');
                        }
                    }, 1000);
                } catch (err: any) {
                    toast.error(err.message || 'Google login gagal.');
                } finally {
                    setIsLoading(false);
                }
            },
        });

        google.accounts.id.prompt();
    };

    if (!mounted) return <div className="min-h-screen bg-[#ecf0f3]" />;

    return (
        <div className="flex justify-center items-start min-h-screen bg-[#ecf0f3] overflow-hidden py-5 pt-[5vh] font-poppins text-gray-700 select-none">
            <style jsx global>{`
                :root {
                    --bg-color: #ecf0f3;
                    --text-main: #555;
                    --text-sub: #999;
                    --teal-btn: #00bfa5;
                    --shadow-light: #ffffff;
                    --shadow-dark: #cbced1;
                }
                body {
                    background-color: var(--bg-color);
                }
            `}</style>

            <div className={styles.langSelectorWrapper}>
                <div
                    className={styles.langTrigger}
                    onClick={() => setIsLangOpen(!isLangOpen)}
                >
                    <div className="flex items-center gap-2">
                        <img
                            src={`https://flagcdn.com/w40/${LANG_OPTIONS.find(l => l.code === currentLang)?.flag}.png`}
                            alt="flag"
                            className="w-5 h-auto rounded-sm shadow-sm opacity-80"
                        />
                        <span>{LANG_OPTIONS.find(l => l.code === currentLang)?.label}</span>
                    </div>
                    <FontAwesomeIcon icon={faChevronDown} className={`text-xs text-[#999] transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                </div>

                <div className={`${styles.langDropdown} ${isLangOpen ? styles.open : ''}`}>
                    {LANG_OPTIONS.map((opt) => (
                        <div
                            key={opt.code}
                            className={`${styles.langOption} ${currentLang === opt.code ? styles.selected : ''}`}
                            onClick={() => {
                                setCurrentLang(opt.code as Language);
                                setIsLangOpen(false);
                            }}
                        >
                            <img
                                src={`https://flagcdn.com/w40/${opt.flag}.png`}
                                alt={opt.label}
                                className="w-5 h-auto rounded-sm"
                            />
                            {opt.label}
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.bgDecoText}>OTOHUB</div>

            <div className={styles.container}>
                <div className={styles.loginCard}>
                    <div className={styles.headerContent}>
                        {/* CONTAINER LOGO: OTO-BOT (ROBOT AI) */}
                        <div className={`${styles.logoContainer} ${isAnimating ? styles.animatingFlip : ''}`}>
                            <svg className={styles.customLogoSvg} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                {/* BASE SHAPE */}
                                <line x1="100" y1="40" x2="100" y2="20" stroke="var(--teal-btn)" strokeWidth="6" strokeLinecap="round" />
                                <circle cx="100" cy="15" r="5" fill="var(--teal-btn)" />
                                <rect x="40" y="40" width="120" height="100" rx="30" ry="30" fill="none" stroke="var(--teal-btn)" strokeWidth="6" />
                                <rect x="25" y="80" width="15" height="20" rx="5" fill="var(--teal-btn)" />
                                <rect x="160" y="80" width="15" height="20" rx="5" fill="var(--teal-btn)" />

                                {/* 1. MODE LOGIN */}
                                <g className={`${styles.logoGroup} ${activeForm === 'login' ? styles.active : ''}`}>
                                    <circle cx="75" cy="80" r="10" fill="var(--teal-btn)" />
                                    <circle cx="125" cy="80" r="10" fill="var(--teal-btn)" />
                                    <path d="M80,110 Q100,120 120,110" fill="none" stroke="var(--teal-btn)" strokeWidth="5" strokeLinecap="round" />
                                </g>

                                {/* 2. MODE SIGNUP */}
                                <g className={`${styles.logoGroup} ${activeForm === 'signup' ? styles.active : ''}`}>
                                    <path d="M65,80 L85,80" stroke="var(--teal-btn)" strokeWidth="6" strokeLinecap="round" />
                                    <circle cx="125" cy="80" r="10" fill="var(--teal-btn)" />
                                    <path d="M70,105 Q100,135 130,105" fill="none" stroke="var(--teal-btn)" strokeWidth="6" strokeLinecap="round" />
                                    <circle cx="60" cy="95" r="4" fill="#ffaaa5" opacity="0.6" />
                                    <circle cx="140" cy="95" r="4" fill="#ffaaa5" opacity="0.6" />
                                </g>

                                {/* 3. MODE FORGOT */}
                                <g className={`${styles.logoGroup} ${activeForm === 'forgot' ? styles.active : ''}`}>
                                    <path d="M65,70 L85,90 M85,70 L65,90" stroke="var(--teal-btn)" strokeWidth="4" strokeLinecap="round" />
                                    <path d="M115,70 L135,90 M135,70 L115,90" stroke="var(--teal-btn)" strokeWidth="4" strokeLinecap="round" />
                                    <path d="M70,115 Q80,105 90,115 T110,115 T130,115" fill="none" stroke="var(--teal-btn)" strokeWidth="4" strokeLinecap="round" />
                                    <text x="135" y="45" fontFamily="Arial" fontWeight="bold" fontSize="40" fill="var(--teal-btn)" transform="rotate(15, 135, 45)">?</text>
                                </g>
                            </svg>
                        </div>

                        <div className={styles.brandName}>OTOHUB</div>
                        <div className={styles.subName}>Smart System</div>
                    </div>

                    {apiError && <div className="text-red-500 mb-4 text-sm font-bold bg-red-100 p-2 rounded">{apiError}</div>}

                    <div className={styles.formWrapper} style={{ height: wrapperHeight }}>
                        {/* 1. FORM LOGIN */}
                        <div ref={loginRef} className={`${styles.formSection} ${activeForm === 'login' ? styles.active : ''}`}>
                            <form onSubmit={(e) => handleSubmit(e, 'login')} noValidate>
                                <div className={styles.inputGroup}>
                                    <FontAwesomeIcon icon={faEnvelopeReg} className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        name="login_email"
                                        className={`${styles.formInput} ${errors['login_email'] ? styles.invalid : ''}`}
                                        placeholder="Email / Username"
                                        required
                                        autoComplete="username"
                                        onChange={() => setErrors({ ...errors, login_email: false })}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <FontAwesomeIcon icon={faLock} className={styles.inputIcon} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="login_password"
                                        className={`${styles.formInput} ${errors['login_password'] ? styles.invalid : ''}`}
                                        placeholder={t.authPassword}
                                        required
                                        autoComplete="current-password"
                                        onChange={() => setErrors({ ...errors, login_password: false })}
                                    />
                                    <FontAwesomeIcon
                                        icon={showPassword ? faEyeSlash : faEye}
                                        className={styles.passwordToggle}
                                        onClick={() => setShowPassword(!showPassword)}
                                    />
                                </div>

                                <div className="flex justify-between items-center mb-5">
                                    <label className={styles.checkboxGroup} onClick={(e) => {
                                        e.preventDefault();
                                        setRememberMe(!rememberMe);
                                    }}>
                                        <div className={`${styles.customCheckbox} ${rememberMe ? styles.checked : ''}`}>
                                            {rememberMe && <FontAwesomeIcon icon={faCheck} className={styles.checkIcon} />}
                                        </div>
                                        <span>{t.authRememberMe}</span>
                                    </label>

                                    <span
                                        className={styles.linkText}
                                        onClick={() => switchForm('forgot')}
                                        style={{ fontSize: '0.8rem', color: '#777' }}
                                    >
                                        {t.authForgotPass}
                                    </span>
                                </div>

                                <button type="submit" className={styles.btnAction} disabled={isLoading}>
                                    {isLoading ? '...' : t.authBtnLogin}
                                </button>

                                {/* Google OAuth Divider */}
                                <div className="flex items-center gap-3 my-4">
                                    <div className="flex-1 h-px bg-gray-300" />
                                    <span className="text-xs text-gray-400 font-medium">ATAU</span>
                                    <div className="flex-1 h-px bg-gray-300" />
                                </div>

                                {/* Google Login Button */}
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] transition-all duration-200 text-sm font-medium text-gray-600"
                                >
                                    <svg width="18" height="18" viewBox="0 0 48 48">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                    </svg>
                                    Login dengan Google
                                </button>
                            </form>

                            <div className={styles.footerLinks}>
                                <span>{t.authNoAccount}</span> <span className={styles.linkText} onClick={() => switchForm('signup')}>{t.authLinkSignup}</span>
                            </div>
                        </div>

                        {/* 2. FORM SIGNUP */}
                        <div ref={signupRef} className={`${styles.formSection} ${activeForm === 'signup' ? styles.active : ''}`}>
                            <form onSubmit={(e) => handleSubmit(e, 'signup')} noValidate>
                                <div className={styles.inputGroup}>
                                    <FontAwesomeIcon icon={faUserReg} className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        name="signup_username"
                                        className={`${styles.formInput} ${errors['signup_username'] ? styles.invalid : ''}`}
                                        placeholder="Username"
                                        required
                                        autoComplete="username"
                                        onChange={() => setErrors({ ...errors, signup_username: false })}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <FontAwesomeIcon icon={faEnvelopeReg} className={styles.inputIcon} />
                                    <input
                                        type="email"
                                        name="signup_email"
                                        className={`${styles.formInput} ${errors['signup_email'] ? styles.invalid : ''}`}
                                        placeholder={t.authEmailActive}
                                        required
                                        autoComplete="email"
                                        onChange={() => setErrors({ ...errors, signup_email: false })}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <FontAwesomeIcon icon={faLock} className={styles.inputIcon} />
                                    <input
                                        type={showConfirmPass ? "text" : "password"}
                                        name="signup_pass"
                                        className={`${styles.formInput} ${errors['signup_pass'] ? styles.invalid : ''}`}
                                        placeholder={t.authCreatePass}
                                        required
                                        autoComplete="new-password"
                                        onChange={() => setErrors({ ...errors, signup_pass: false })}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <FontAwesomeIcon icon={faLock} className={styles.inputIcon} />
                                    <input
                                        type={showConfirmPass ? "text" : "password"}
                                        name="signup_confirm_pass"
                                        className={`${styles.formInput} ${errors['signup_confirm_pass'] ? styles.invalid : ''}`}
                                        placeholder="Konfirmasi Password"
                                        required
                                        autoComplete="new-password"
                                        onChange={() => setErrors({ ...errors, signup_confirm_pass: false })}
                                    />
                                    <FontAwesomeIcon
                                        icon={showConfirmPass ? faEyeSlash : faEye}
                                        className={styles.passwordToggle}
                                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                                    />
                                </div>

                                <button type="submit" className={styles.btnAction} disabled={isLoading}>
                                    {isLoading ? '...' : t.authBtnSignup}
                                </button>
                            </form>

                            <div className={styles.footerLinks}>
                                <span>{t.authHaveAccount}</span> <span className={styles.linkText} onClick={() => switchForm('login')}>{t.authLinkLogin}</span>
                            </div>
                        </div>

                        {/* 3. FORM FORGOT */}
                        <div ref={forgotRef} className={`${styles.formSection} ${activeForm === 'forgot' ? styles.active : ''}`}>
                            <div style={{ marginBottom: '20px', fontSize: '0.9rem', color: '#666' }}>
                                {t.authForgotDesc}
                            </div>
                            <form onSubmit={(e) => handleSubmit(e, 'forgot')} noValidate>
                                <div className={styles.inputGroup}>
                                    <FontAwesomeIcon icon={faEnvelopeReg} className={styles.inputIcon} />
                                    <input
                                        type="email"
                                        name="forgot_email"
                                        className={`${styles.formInput} ${errors['forgot_email'] ? styles.invalid : ''}`}
                                        placeholder={t.authEmailReg}
                                        required
                                        autoComplete="email"
                                        onChange={() => setErrors({ ...errors, forgot_email: false })}
                                    />
                                </div>

                                <button type="submit" className={styles.btnAction} disabled={isLoading}>{t.authBtnReset}</button>
                                <button type="button" className={`${styles.btnAction} ${styles.secondary}`} onClick={() => switchForm('login')}>{t.authBtnCancel}</button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>

            <div className={styles.cornerBrand}>
                <div className={styles.cornerLogo}>M</div>
                <div style={{ fontWeight: 600, color: '#555' }}>Modula</div>
            </div>

            {/* Google Identity Services Script */}
            <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        </div>
    );
}
