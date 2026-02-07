'use client';

import React, { useState, useEffect } from 'react';
import styles from './auth.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faLock, faCheck } from '@fortawesome/free-solid-svg-icons';
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
    const [activeForm, setActiveForm] = useState<FormType>('login');
    const [isAnimating, setIsAnimating] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const router = useRouter();
    const t = TRANSLATIONS[currentLang];
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    useEffect(() => {
        setMounted(true);
        const savedToken = localStorage.getItem('access_token');
        const savedRemember = localStorage.getItem('remember_me') === 'true';
        if (savedToken && savedRemember) {
            router.push('/app');
        }
    }, [router]);

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

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentLang(e.target.value as LangCode);
    };

    const handleSubmit = async (e: React.FormEvent, type: FormType) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const inputs = Array.from(form.elements) as HTMLInputElement[];
        let isValid = true;

        setErrors({}); // Reset error highlights (red borders)

        inputs.forEach(input => {
            if (input.tagName === 'INPUT' && input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                setErrors(prev => ({ ...prev, [input.name]: true }));
            }
        });

        // TOAST NOTIFICATION FOR VALIDATION ERROR
        if (!isValid) {
            toast.error(t.err_required, {
                position: 'bottom-center',
                style: { backgroundColor: '#fff', color: '#ff6b6b', border: '1px solid #ff6b6b' }
            });
            return;
        }

        setApiError(null);

        if (isValid) {
            setIsLoading(true);
            try {
                if (type === 'login') {
                    const email = (form.elements.namedItem('login_email') as HTMLInputElement).value;
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
                    const name = (form.elements.namedItem('signup_name') as HTMLInputElement).value;
                    const email = (form.elements.namedItem('signup_email') as HTMLInputElement).value;
                    const password = (form.elements.namedItem('signup_pass') as HTMLInputElement).value;

                    const res = await fetch(`${API_URL}/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, password }),
                    });

                    if (!res.ok) throw new Error(t.err_signup_failed);

                    const data = await res.json();
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('user_info', JSON.stringify(data.user));

                    toast.success(t.alert_signup);

                    setTimeout(() => {
                        router.push('/app');
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
        }
    };

    if (!mounted) return <div className="min-h-screen bg-[#ecf0f3]" />;

    return (
        <div className="flex justify-center items-center min-h-screen bg-[#ecf0f3] overflow-hidden py-5 font-poppins text-gray-700 select-none">
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
                <select
                    className={styles.langSelect}
                    value={currentLang}
                    onChange={handleLanguageChange}
                >
                    <option value="id">🇮🇩 ID</option>
                    <option value="en">🇺🇸 EN</option>
                    <option value="th">🇹🇭 TH</option>
                    <option value="ph">🇵🇭 PH</option>
                    <option value="vi">🇻🇳 VI</option>
                </select>
                <FontAwesomeIcon icon={faChevronDown} className={styles.langArrow} />
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

                    <div className={styles.formWrapper}>
                        {/* 1. FORM LOGIN */}
                        <div className={`${styles.formSection} ${activeForm === 'login' ? styles.active : ''}`}>
                            <form onSubmit={(e) => handleSubmit(e, 'login')}>
                                <div className={styles.inputGroup}>
                                    <FontAwesomeIcon icon={faEnvelopeReg} className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        name="login_email"
                                        className={`${styles.formInput} ${errors['login_email'] ? styles.invalid : ''}`}
                                        placeholder={t.ph_user_email}
                                        required
                                        onChange={() => setErrors({ ...errors, login_email: false })}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <FontAwesomeIcon icon={faLock} className={styles.inputIcon} />
                                    <input
                                        type="password"
                                        name="login_password"
                                        className={`${styles.formInput} ${errors['login_password'] ? styles.invalid : ''}`}
                                        placeholder={t.ph_password}
                                        required
                                        onChange={() => setErrors({ ...errors, login_password: false })}
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
                        <div className={`${styles.formSection} ${activeForm === 'signup' ? styles.active : ''}`}>
                            <form onSubmit={(e) => handleSubmit(e, 'signup')}>
                                <div className={styles.inputGroup}>
                                    <FontAwesomeIcon icon={faUserReg} className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        name="signup_name"
                                        className={`${styles.formInput} ${errors['signup_name'] ? styles.invalid : ''}`}
                                        placeholder={t.ph_fullname}
                                        required
                                        onChange={() => setErrors({ ...errors, signup_name: false })}
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
                                        type="password"
                                        name="signup_pass"
                                        className={`${styles.formInput} ${errors['signup_pass'] ? styles.invalid : ''}`}
                                        placeholder={t.ph_create_pass}
                                        required
                                        onChange={() => setErrors({ ...errors, signup_pass: false })}
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
                        <div className={`${styles.formSection} ${activeForm === 'forgot' ? styles.active : ''}`}>
                            <div style={{ marginBottom: '20px', fontSize: '0.9rem', color: '#666' }}>
                                {t.forgot_desc}
                            </div>
                            <form onSubmit={(e) => handleSubmit(e, 'forgot')}>
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
