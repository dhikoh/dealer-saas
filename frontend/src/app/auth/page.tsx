'use client';

import React, { useState, useEffect } from 'react';
import styles from './auth.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faLock, faCheck, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope as faEnvelopeReg, faUser as faUserReg } from '@fortawesome/free-regular-svg-icons';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type LangCode = 'id' | 'en' | 'th' | 'ph' | 'vi';
type FormType = 'login' | 'signup' | 'forgot';

const TRANSLATIONS: Record<LangCode, any> = {
    id: {
        ph_user_email: "Username / Email",
        ph_password: "Password",
        ph_fullname: "Nama Lengkap",
        ph_email_active: "Email Aktif",
        ph_create_pass: "Buat Password",
        ph_email_reg: "Email Terdaftar",
        err_required: "Mohon isi bidang ini",
        btn_login: "MASUK",
        btn_signup: "DAFTAR AKUN",
        btn_reset: "KIRIM RESET LINK",
        btn_cancel: "BATAL",
        forgot_pass: "Lupa Password?",
        forgot_desc: "Masukkan email Anda, kami akan mengirimkan link untuk mereset password.",
        no_account: "Belum punya akun?",
        have_account: "Sudah punya akun?",
        link_signup: "Daftar Sekarang",
        link_login: "Login Disini",
        alert_login: "Sedang memproses Login...",
        alert_signup: "Akun berhasil dibuat!",
        alert_forgot: "Link reset terkirim!",
        err_login_failed: "Login gagal. Cek kredensial Anda.",
        err_signup_failed: "Gagal mendaftar. Email mungkin sudah dipakai.",
        remember_me: "Ingat Saya"
    },
    en: {
        ph_user_email: "Username / Email",
        ph_password: "Password",
        ph_fullname: "Full Name",
        ph_email_active: "Active Email",
        ph_create_pass: "Create Password",
        ph_email_reg: "Registered Email",
        err_required: "Please fill out this field",
        btn_login: "LOGIN",
        btn_signup: "SIGN UP",
        btn_reset: "SEND RESET LINK",
        btn_cancel: "CANCEL",
        forgot_pass: "Forgot Password?",
        forgot_desc: "Enter your email, we will send a link to reset your password.",
        no_account: "Don't have an account?",
        have_account: "Already have an account?",
        link_signup: "Sign Up Now",
        link_login: "Login Here",
        alert_login: "Processing Login...",
        alert_signup: "Account created successfully!",
        alert_forgot: "Reset link sent!",
        err_login_failed: "Login failed. Check your credentials.",
        err_signup_failed: "Signup failed. Email might be taken.",
        remember_me: "Remember Me"
    },
    th: {
        ph_user_email: "ชื่อผู้ใช้ / อีเมล",
        ph_password: "รหัสผ่าน",
        ph_fullname: "ชื่อเต็ม",
        ph_email_active: "อีเมลที่ใช้งานอยู่",
        ph_create_pass: "สร้างรหัสผ่าน",
        ph_email_reg: "อีเมลที่ลงทะเบียน",
        err_required: "กรุณากรอกข้อมูลในช่องนี้",
        btn_login: "เข้าสู่ระบบ",
        btn_signup: "ลงชื่อ",
        btn_reset: "ส่งลิงก์รีเซ็ต",
        btn_cancel: "ยกเลิก",
        forgot_pass: "ลืมรหัสผ่าน?",
        forgot_desc: "ใส่อีเมลของคุณ เราจะส่งลิงก์เพื่อรีเซ็ตรหัสผ่าน",
        no_account: "ยังไม่มีบัญชี?",
        have_account: "มีบัญชีอยู่แล้ว?",
        link_signup: "ลงทะเบียนตอนนี้",
        link_login: "เข้าสู่ระบบที่นี่",
        alert_login: "กำลังเข้าสู่ระบบ...",
        alert_signup: "สร้างบัญชีสำเร็จ!",
        alert_forgot: "ส่งลิงก์รีเซ็ตแล้ว!",
        err_login_failed: "เข้าสู่ระบบล้มเหลว ตรวจสอบข้อมูลรับรองของคุณ",
        err_signup_failed: "ลงทะเบียนล้มเหลว อีเมลอาจถูกใช้ไปแล้ว",
        remember_me: "จดจำฉัน"
    },
    ph: {
        ph_user_email: "Username / Email",
        ph_password: "Password",
        ph_fullname: "Buong Pangalan",
        ph_email_active: "Aktibong Email",
        ph_create_pass: "Gumawa ng Password",
        ph_email_reg: "Nakarehistrong Email",
        err_required: "Mangyaring punan ang patlang na ito",
        btn_login: "MAG-LOGIN",
        btn_signup: "MAG-SIGN UP",
        btn_reset: "IPADALA ANG RESET LINK",
        btn_cancel: "KANSELAHIN",
        forgot_pass: "Nakalimutan ang Password?",
        forgot_desc: "Ilagay ang iyong email, magpapadala kami ng link para i-reset ang password.",
        no_account: "Wala pang account?",
        have_account: "May account na?",
        link_signup: "Magparehistro Ngayon",
        link_login: "Mag-login Dito",
        alert_login: "Pinoproseso ang pag-login...",
        alert_signup: "Matagumpay na nagawa ang account!",
        alert_forgot: "Naipadala na ang reset link!",
        err_login_failed: "Nabigo ang pag-login. Suriin ang iyong mga kredensyal.",
        err_signup_failed: "Nabigo ang pag-sign up. Maaaring nakuha na ang email.",
        remember_me: "Tandaan Ako"
    },
    vi: {
        ph_user_email: "Tên người dùng / Email",
        ph_password: "Mật khẩu",
        ph_fullname: "Họ và tên",
        ph_email_active: "Email hoạt động",
        ph_create_pass: "Tạo mật khẩu",
        ph_email_reg: "Email đã đăng ký",
        err_required: "Vui lòng điền vào trường này",
        btn_login: "ĐĂNG NHẬP",
        btn_signup: "ĐĂNG KÝ",
        btn_reset: "GỬI LIÊN KẾT ĐẶT LẠI",
        btn_cancel: "HỦY BỎ",
        forgot_pass: "Quên mật khẩu?",
        forgot_desc: "Nhập email của bạn, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.",
        no_account: "Chưa có tài khoản?",
        have_account: "Đã có tài khoản?",
        link_signup: "Đăng ký ngay",
        link_login: "Đăng nhập tại đây",
        alert_login: "Đang xử lý đăng nhập...",
        alert_signup: "Tài khoản đã được tạo!",
        alert_forgot: "Đã gửi liên kết đặt lại!",
        err_login_failed: "Đăng nhập thất bại. Kiểm tra thông tin của bạn.",
        err_signup_failed: "Đăng ký thất bại. Email có thể đã được sử dụng.",
        remember_me: "Ghi nhớ tôi"
    }
};

export default function AuthPage() {
    const [mounted, setMounted] = useState(false);
    const [currentLang, setCurrentLang] = useState<LangCode>('id');
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
    const t = TRANSLATIONS[currentLang];
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
        const savedToken = localStorage.getItem('access_token');

        const savedRemember = localStorage.getItem('remember_me') === 'true';
        if (savedToken && savedRemember) {
            router.push('/app');
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
        const inputs = Array.from(form.elements) as HTMLInputElement[];
        let isValid = true;
        let firstErrorFound = false; // Flag to prevent multiple toasts

        setErrors({});

        // SINGLE PASS VALIDATION LOOP
        for (const input of inputs) {
            if (input.tagName !== 'INPUT') continue;

            // 1. Check Required
            if (input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                setErrors(prev => ({ ...prev, [input.name]: true }));

                // Only show toast if it's the first error
                if (!firstErrorFound) {
                    toast.error(`${t.err_required}: ${input.placeholder || input.name}`, { description: 'Mohon lengkapi data.' });
                    firstErrorFound = true;
                }
                continue; // Continue to mark other fields as red, but don't show more toasts
            }

            // 2. Check Email Format
            if (input.type === 'email' && input.value && !isValidEmail(input.value)) {
                isValid = false;
                setErrors(prev => ({ ...prev, [input.name]: true }));

                if (!firstErrorFound) {
                    toast.error('Format Email Salah', { description: 'Contoh: user@domain.com' });
                    firstErrorFound = true;
                }
                continue;
            }

            // 3. Check Username (Signup only)
            if (input.name === 'signup_username' && input.value.trim().length < 3) {
                isValid = false;
                setErrors(prev => ({ ...prev, [input.name]: true }));

                if (!firstErrorFound) {
                    toast.error('Username terlalu pendek', { description: 'Minimal 3 karakter.' });
                    firstErrorFound = true;
                }
                continue;
            }

            // 4. Check Password Length (Signup only)
            if (input.name === 'signup_pass' && input.value.length < 6) {
                isValid = false;
                setErrors(prev => ({ ...prev, [input.name]: true }));

                if (!firstErrorFound) {
                    toast.error('Password terlalu pendek', { description: 'Minimal 6 karakter.' });
                    firstErrorFound = true;
                }
                continue;
            }

            // 5. Check Password Confirmation (Signup)
            if (input.name === 'signup_confirm_pass') {
                const passInput = form.elements.namedItem('signup_pass') as HTMLInputElement;
                if (input.value !== passInput.value) {
                    isValid = false;
                    setErrors(prev => ({ ...prev, [input.name]: true }));

                    if (!firstErrorFound) {
                        toast.error('Password Tidak Cocok', { description: 'Pastikan konfirmasi password sama.' });
                        firstErrorFound = true;
                    }
                    continue;
                }
            }
        }

        if (!isValid) return; // Stop here if any validation failed

        setApiError(null);
        setIsLoading(true);

        try {
            if (type === 'login') {
                const identifierRaw = (form.elements.namedItem('login_email') as HTMLInputElement).value;
                const email = identifierRaw.toLowerCase(); // Treat as generic identifier (email or username)
                const password = (form.elements.namedItem('login_password') as HTMLInputElement).value;

                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                if (!res.ok) throw new Error(t.err_login_failed);

                const data = await res.json();
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('user_info', JSON.stringify(data.user));

                if (rememberMe) {
                    localStorage.setItem('remember_me', 'true');
                } else {
                    localStorage.removeItem('remember_me');
                }

                toast.success(`Welcome ${data.user.name}!`);

                setTimeout(() => {
                    router.push('/app');
                }, 1000);

            }
            else if (type === 'signup') {
                const username = (form.elements.namedItem('signup_username') as HTMLInputElement).value;
                const emailRaw = (form.elements.namedItem('signup_email') as HTMLInputElement).value;
                const email = emailRaw.toLowerCase(); // Ensure lowercase
                const password = (form.elements.namedItem('signup_pass') as HTMLInputElement).value;

                const res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || t.err_signup_failed);
                }

                const data = await res.json();
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('user_info', JSON.stringify(data.user));

                toast.success(t.alert_signup);

                setTimeout(() => {
                    router.push(`/auth/verify?email=${email}`);
                }, 1000);
            }
            else if (type === 'forgot') {
                toast.info(t.alert_forgot);
                switchForm('login');
            }

            if (type !== 'login') form.reset();
        } catch (err: any) {
            toast.error(err.message || 'An error occurred');
            setApiError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
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
                                setCurrentLang(opt.code as LangCode);
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

                    {apiError && <div className="text-red-500 mb-4 text-sm font-bold bg-red-100 p-2 rounded">{apiError}</div>}

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
                                        onChange={() => setErrors({ ...errors, login_email: false })}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <FontAwesomeIcon icon={faLock} className={styles.inputIcon} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="login_password"
                                        className={`${styles.formInput} ${errors['login_password'] ? styles.invalid : ''}`}
                                        placeholder={t.ph_password}
                                        required
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
                                        <span>{t.remember_me}</span>
                                    </label>

                                    <span
                                        className={styles.linkText}
                                        onClick={() => switchForm('forgot')}
                                        style={{ fontSize: '0.8rem', color: '#777' }}
                                    >
                                        {t.forgot_pass}
                                    </span>
                                </div>

                                <button type="submit" className={styles.btnAction} disabled={isLoading}>
                                    {isLoading ? '...' : t.btn_login}
                                </button>
                            </form>

                            <div className={styles.footerLinks}>
                                <span>{t.no_account}</span> <span className={styles.linkText} onClick={() => switchForm('signup')}>{t.link_signup}</span>
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
                                        onChange={() => setErrors({ ...errors, signup_username: false })}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <FontAwesomeIcon icon={faEnvelopeReg} className={styles.inputIcon} />
                                    <input
                                        type="email"
                                        name="signup_email"
                                        className={`${styles.formInput} ${errors['signup_email'] ? styles.invalid : ''}`}
                                        placeholder={t.ph_email_active}
                                        required
                                        onChange={() => setErrors({ ...errors, signup_email: false })}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <FontAwesomeIcon icon={faLock} className={styles.inputIcon} />
                                    <input
                                        type={showConfirmPass ? "text" : "password"}
                                        name="signup_pass"
                                        className={`${styles.formInput} ${errors['signup_pass'] ? styles.invalid : ''}`}
                                        placeholder={t.ph_create_pass}
                                        required
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
                                        onChange={() => setErrors({ ...errors, signup_confirm_pass: false })}
                                    />
                                    <FontAwesomeIcon
                                        icon={showConfirmPass ? faEyeSlash : faEye}
                                        className={styles.passwordToggle}
                                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                                    />
                                </div>

                                <button type="submit" className={styles.btnAction} disabled={isLoading}>
                                    {isLoading ? '...' : t.btn_signup}
                                </button>
                            </form>

                            <div className={styles.footerLinks}>
                                <span>{t.have_account}</span> <span className={styles.linkText} onClick={() => switchForm('login')}>{t.link_login}</span>
                            </div>
                        </div>

                        {/* 3. FORM FORGOT */}
                        <div ref={forgotRef} className={`${styles.formSection} ${activeForm === 'forgot' ? styles.active : ''}`}>
                            <div style={{ marginBottom: '20px', fontSize: '0.9rem', color: '#666' }}>
                                {t.forgot_desc}
                            </div>
                            <form onSubmit={(e) => handleSubmit(e, 'forgot')} noValidate>
                                <div className={styles.inputGroup}>
                                    <FontAwesomeIcon icon={faEnvelopeReg} className={styles.inputIcon} />
                                    <input
                                        type="email"
                                        name="forgot_email"
                                        className={`${styles.formInput} ${errors['forgot_email'] ? styles.invalid : ''}`}
                                        placeholder={t.ph_email_reg}
                                        required
                                        onChange={() => setErrors({ ...errors, forgot_email: false })}
                                    />
                                </div>

                                <button type="submit" className={styles.btnAction} disabled={isLoading}>{t.btn_reset}</button>
                                <button type="button" className={`${styles.btnAction} ${styles.secondary}`} onClick={() => switchForm('login')}>{t.btn_cancel}</button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>

            <div className={styles.cornerBrand}>
                <div className={styles.cornerLogo}>M</div>
                <div style={{ fontWeight: 600, color: '#555' }}>Modula</div>
            </div>
        </div>
    );
}
