'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faUser, faPhone, faBuilding, faGlobe, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import DatePicker, { registerLocale } from 'react-datepicker';
import { id } from 'date-fns/locale/id';
import NeumorphicSelect from '@/components/NeumorphicSelect';
import { API_URL } from '@/lib/api';
registerLocale('id', id);

export default function OnboardingPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        dealerName: '',
        birthDate: '',
        domicileAddress: '',
        officeAddress: '',
        language: 'id'
    });



    // Translation Dictionary
    const t = {
        id: {
            title: "Lengkapi Data Diri",
            subtitle: "Satu langkah lagi! Mohon lengkapi data berikut untuk memulai.",
            ph_fullname: "Nama Lengkap",
            ph_phone: "Nomor WhatsApp",
            ph_dealer: "Nama Dealer / Showroom",
            ph_birthdate: "Tanggal Lahir",
            ph_domicile: "Alamat Domisili",
            ph_office: "Alamat Kantor / Dealer",
            btn_submit: "Simpan & Lanjutkan",
            err_required: "Mohon lengkapi semua data",
            success: "Onboarding Berhasil!",
            err_generic: "Terjadi kesalahan. Coba lagi."
        },
        en: {
            title: "Complete Your Profile",
            subtitle: "One more step! Please complete the following data to start.",
            ph_fullname: "Full Name",
            ph_phone: "WhatsApp Number",
            ph_dealer: "Dealer / Showroom Name",
            ph_birthdate: "Birth Date",
            ph_domicile: "Domicile Address",
            ph_office: "Office / Dealer Address",
            btn_submit: "Save & Continue",
            err_required: "Please complete all fields",
            success: "Onboarding Successful!",
            err_generic: "An error occurred. Try again."
        },
        th: {
            title: "กรอกข้อมูลส่วนตัว",
            subtitle: "อีกเพียงขั้นตอนเดียว! โปรดกรอกข้อมูลเพื่อเริ่มต้น",
            ph_fullname: "ชื่อ-นามสกุล",
            ph_phone: "เบอร์ WhatsApp",
            ph_dealer: "ชื่อดีลเลอร์ / โชว์รูม",
            ph_birthdate: "วันเกิด",
            ph_domicile: "ที่อยู่ตามทะเบียนบ้าน",
            ph_office: "ที่อยู่ที่ทำงาน / ดีลเลอร์",
            btn_submit: "บันทึกและดำเนินการต่อ",
            err_required: "กรุณากรอกข้อมูลให้ครบถ้วน",
            success: "การเริ่มต้นใช้งานสำเร็จ!",
            err_generic: "เกิดข้อผิดพลาด ลองอีกครั้ง"
        },
        ph: {
            title: "Kumpletuhin ang Profile",
            subtitle: "Isang hakbang na lang! Pakikumpleto ang data upang magsimula.",
            ph_fullname: "Buong Pangalan",
            ph_phone: "Numero ng WhatsApp",
            ph_dealer: "Pangalan ng Dealer / Showroom",
            ph_birthdate: "Petsa ng Kapanganakan",
            ph_domicile: "Tirahan",
            ph_office: "Address ng Opisina / Dealer",
            btn_submit: "I-save at Magpatuloy",
            err_required: "Pakikumpleto ang lahat ng field",
            success: "Matagumpay ang Onboarding!",
            err_generic: "May naganap na error. Subukan muli."
        },
        vi: {
            title: "Hoàn Thiện Hồ Sơ",
            subtitle: "Chỉ còn một bước nữa! Vui lòng điền thông tin để bắt đầu.",
            ph_fullname: "Họ và Tên",
            ph_phone: "Số WhatsApp",
            ph_dealer: "Tên Đại Lý / Showroom",
            ph_birthdate: "Ngày Sinh",
            ph_domicile: "Địa Chỉ Cư Trú",
            ph_office: "Địa Chỉ Văn Phòng / Đại Lý",
            btn_submit: "Lưu & Tiếp Tục",
            err_required: "Vui lòng điền đầy đủ thông tin",
            success: "Onboarding Thành Công!",
            err_generic: "Đã xảy ra lỗi. Thử lại."
        }
    };

    const text = t[formData.language as keyof typeof t] || t.id;

    useEffect(() => {
        setMounted(true);
        // Load saved language if available
        const savedLang = localStorage.getItem('app_lang');
        if (savedLang && ['id', 'en', 'th', 'ph', 'vi'].includes(savedLang)) {
            setFormData(prev => ({ ...prev, language: savedLang }));
        }
    }, []);

    // Persist language change
    useEffect(() => {
        if (mounted) {
            localStorage.setItem('app_lang', formData.language);
        }
    }, [formData.language, mounted]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDateChange = (date: Date | null) => {
        if (date) {
            setFormData({ ...formData, birthDate: date.toISOString() });
        } else {
            setFormData({ ...formData, birthDate: '' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.fullName || !formData.phone || !formData.dealerName || !formData.birthDate || !formData.domicileAddress || !formData.officeAddress) {
            toast.error(text.err_required);
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/auth/onboarding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || text.err_generic);
            }

            const data = await res.json();

            // Update stored user info logic
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('user_info', JSON.stringify(data.user));
            }

            toast.success(text.success);

            setTimeout(() => {
                router.push('/app');
            }, 1000);

        } catch (error: any) {
            toast.error(error.message || text.err_generic);
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) return <div className="min-h-screen bg-[#ecf0f3]" />;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#ecf0f3] font-['Poppins'] py-10">
            <style jsx global>{`
                /* Ensure DatePicker inputs are styled correctly */
                .react-datepicker-wrapper {
                   width: 100%;
                }
            `}</style>
            <div className="w-[480px] p-10 rounded-[20px] bg-[#ecf0f3] shadow-[13px_13px_20px_#cbced1,-13px_-13px_20px_#ffffff]">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#1b1b1b] mb-2">{text.title}</h1>
                    <p className="text-sm text-[#555]">
                        {text.subtitle}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* FULL NAME */}
                    <div className="relative">
                        <FontAwesomeIcon icon={faUser} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-lg" />
                        <input
                            type="text"
                            name="fullName"
                            placeholder={text.ph_fullname}
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            className="w-full h-12 pl-12 pr-4 rounded-[50px] bg-[#ecf0f3] shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff] border-none outline-none text-[#1b1b1b] focus:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff,0_0_0_2px_#00bfa5] transition-all"
                        />
                    </div>

                    {/* LANGUAGE SELECTION (Custom Neumorphic Dropdown) */}
                    <NeumorphicSelect
                        name="language"
                        value={formData.language}
                        onChange={(name, value) => {
                            setFormData(prev => ({ ...prev, [name]: value }));
                        }}
                        options={[
                            { code: 'id', label: 'Bahasa Indonesia' },
                            { code: 'en', label: 'English (US)' },
                            { code: 'th', label: 'Thai (ไทย)' },
                            { code: 'ph', label: 'Filipino (Tagalog)' },
                            { code: 'vi', label: 'Vietnamese (Tiếng Việt)' }
                        ]}
                        icon={faGlobe}
                    />

                    {/* BIRTH DATE */}
                    <div className="relative">
                        <DatePicker
                            selected={formData.birthDate ? new Date(formData.birthDate) : null}
                            onChange={handleDateChange}
                            dateFormat="dd MMMM yyyy"
                            locale={formData.language === 'id' ? 'id' : undefined}
                            placeholderText={text.ph_birthdate}
                            className="w-full h-12 px-4 rounded-[50px] bg-[#ecf0f3] shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff] border-none outline-none text-[#1b1b1b] focus:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff,0_0_0_2px_#00bfa5] transition-all text-center placeholder-gray-500 cursor-pointer"
                            wrapperClassName="w-full"
                            showYearDropdown
                            scrollableYearDropdown
                            yearDropdownItemNumber={100}
                        />
                    </div>

                    {/* PHONE */}
                    <div className="relative">
                        <FontAwesomeIcon icon={faPhone} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-lg" />
                        <input
                            type="tel"
                            name="phone"
                            placeholder={text.ph_phone}
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="w-full h-12 pl-12 pr-4 rounded-[50px] bg-[#ecf0f3] shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff] border-none outline-none text-[#1b1b1b] focus:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff,0_0_0_2px_#00bfa5] transition-all"
                        />
                    </div>

                    {/* DEALER NAME */}
                    <div className="relative">
                        <FontAwesomeIcon icon={faBuilding} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-lg" />
                        <input
                            type="text"
                            name="dealerName"
                            placeholder={text.ph_dealer}
                            value={formData.dealerName}
                            onChange={handleChange}
                            required
                            className="w-full h-12 pl-12 pr-4 rounded-[50px] bg-[#ecf0f3] shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff] border-none outline-none text-[#1b1b1b] focus:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff,0_0_0_2px_#00bfa5] transition-all"
                        />
                    </div>

                    {/* DOMICILE ADDRESS */}
                    <div className="relative">
                        <textarea
                            name="domicileAddress"
                            placeholder={text.ph_domicile}
                            value={formData.domicileAddress}
                            onChange={handleChange}
                            required
                            rows={3}
                            className="w-full p-4 rounded-[20px] bg-[#ecf0f3] shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff] border-none outline-none text-[#1b1b1b] focus:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff,0_0_0_2px_#00bfa5] transition-all resize-none"
                        />
                    </div>

                    {/* OFFICE ADDRESS */}
                    <div className="relative">
                        <textarea
                            name="officeAddress"
                            placeholder={text.ph_office}
                            value={formData.officeAddress}
                            onChange={handleChange}
                            required
                            rows={3}
                            className="w-full p-4 rounded-[20px] bg-[#ecf0f3] shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff] border-none outline-none text-[#1b1b1b] focus:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff,0_0_0_2px_#00bfa5] transition-all resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-[50px] mt-4 rounded-[50px] bg-[#00bfa5] text-white font-bold text-lg shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] hover:scale-[0.98] active:shadow-[inset_5px_5px_10px_#008f7a,inset_-5px_-5px_10px_#00efcf] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin className="text-white" />
                                Menyimpan...
                            </>
                        ) : (
                            text.btn_submit
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
