'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faUser, faPhone, faBuilding, faGlobe } from '@fortawesome/free-solid-svg-icons';
import DatePicker, { registerLocale } from 'react-datepicker';
import { id } from 'date-fns/locale/id';
registerLocale('id', id);

export default function OnboardingPage() {
    const router = useRouter();
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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    // ... existing useEffect ...

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
            toast.error('Mohon lengkapi semua data');
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
                throw new Error(errorData.message || 'Gagal menyimpan data');
            }

            const data = await res.json();

            // Store Language Preference
            localStorage.setItem('app_lang', formData.language);

            // Update stored user info logic
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('user_info', JSON.stringify(data.user));
            }

            toast.success('Selamat Datang di OTOHUB!');

            setTimeout(() => {
                router.push('/app');
            }, 1000);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#ecf0f3] font-['Poppins'] py-10">
            <div className="w-[480px] p-10 rounded-[20px] bg-[#ecf0f3] shadow-[13px_13px_20px_#cbced1,-13px_-13px_20px_#ffffff]">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#1b1b1b] mb-2">Lengkapi Data Diri</h1>
                    <p className="text-sm text-[#555]">
                        Satu langkah lagi! Mohon lengkapi data berikut untuk memulai.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* FULL NAME */}
                    <div className="relative">
                        <FontAwesomeIcon icon={faUser} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-lg" />
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Nama Lengkap"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            className="w-full h-12 pl-12 pr-4 rounded-[50px] bg-[#ecf0f3] shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff] border-none outline-none text-[#1b1b1b] focus:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff,0_0_0_2px_#00bfa5] transition-all"
                        />
                    </div>

                    {/* LANGUAGE SELECTION */}
                    <div className="relative">
                        <FontAwesomeIcon icon={faGlobe} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-lg z-10" />
                        <select
                            name="language"
                            value={formData.language}
                            onChange={handleChange}
                            className="w-full h-12 pl-12 pr-4 rounded-[50px] bg-[#ecf0f3] shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff] border-none outline-none text-[#1b1b1b] focus:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff,0_0_0_2px_#00bfa5] transition-all appearance-none cursor-pointer"
                        >
                            <option value="id">Bahasa Indonesia</option>
                            <option value="en">English (US)</option>
                            <option value="th">Thai (ไทย)</option>
                            <option value="ph">Filipino (Tagalog)</option>
                            <option value="vi">Vietnamese (Tiếng Việt)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#555]">
                            ▼
                        </div>
                    </div>

                    {/* BIRTH DATE */}
                    <div className="relative">
                        <DatePicker
                            selected={formData.birthDate ? new Date(formData.birthDate) : null}
                            onChange={handleDateChange}
                            dateFormat="dd MMMM yyyy"
                            locale="id"
                            placeholderText="Tanggal Lahir"
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
                            placeholder="Nomor WhatsApp"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="w-full h-12 pl-12 pr-4 rounded-[50px] bg-[#ecf0f3] shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff] border-none outline-none text-[#1b1b1b] focus:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff,0_0_0_2px_#00bfa5] transition-all"
                        />
                    </div>

                    {/* DOMICILE ADDRESS */}
                    <div className="relative">
                        <textarea
                            name="domicileAddress"
                            placeholder="Alamat Domisili"
                            value={formData.domicileAddress}
                            onChange={handleChange}
                            required
                            rows={3}
                            className="w-full p-4 rounded-[20px] bg-[#ecf0f3] shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff] border-none outline-none text-[#1b1b1b] focus:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff,0_0_0_2px_#00bfa5] transition-all resize-none"
                        />
                    </div>

                    {/* DEALER NAME */}
                    <div className="relative">
                        <FontAwesomeIcon icon={faBuilding} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-lg" />
                        <input
                            type="text"
                            name="dealerName"
                            placeholder="Nama Dealer / Showroom"
                            value={formData.dealerName}
                            onChange={handleChange}
                            required
                            className="w-full h-12 pl-12 pr-4 rounded-[50px] bg-[#ecf0f3] shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff] border-none outline-none text-[#1b1b1b] focus:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff,0_0_0_2px_#00bfa5] transition-all"
                        />
                    </div>

                    {/* OFFICE ADDRESS */}
                    <div className="relative">
                        <textarea
                            name="officeAddress"
                            placeholder="Alamat Kantor"
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
                            'Simpan & Lanjutkan'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
