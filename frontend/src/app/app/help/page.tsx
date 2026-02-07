'use client';

import React, { useState } from 'react';
import { HelpCircle, MessageCircle, Mail, BookOpen, Car, DollarSign, Users, CreditCard, Bell, Shield, Building } from 'lucide-react';

const FAQ_CATEGORIES = [
    {
        title: 'Inventaris Kendaraan',
        icon: <Car className="w-5 h-5" />,
        color: 'bg-blue-100 text-blue-600',
        items: [
            { q: 'Bagaimana cara menambah kendaraan baru?', a: 'Buka menu Inventaris, klik tombol "Tambah Kendaraan". Isi data lengkap termasuk merek, model, tahun, harga, dan upload foto. Klik Simpan untuk menyimpan.' },
            { q: 'Bagaimana cara mengupload foto kendaraan?', a: 'Saat menambah/edit kendaraan, klik area upload foto atau drag & drop gambar. Anda bisa upload hingga 10 foto per kendaraan.' },
            { q: 'Apa arti status kendaraan?', a: 'AVAILABLE = Tersedia untuk dijual, BOOKED = Sedang dipesan, SOLD = Sudah terjual, MAINTENANCE = Sedang dalam perbaikan.' },
        ]
    },
    {
        title: 'Transaksi & Penjualan',
        icon: <DollarSign className="w-5 h-5" />,
        color: 'bg-emerald-100 text-emerald-600',
        items: [
            { q: 'Bagaimana cara mencatat penjualan?', a: 'Buka menu Transaksi → Tambah Transaksi. Pilih kendaraan, customer, metode pembayaran (cash/kredit), dan harga final. Sistem akan otomatis update status kendaraan.' },
            { q: 'Apa bedanya pembayaran Cash dan Kredit?', a: 'CASH = Pembayaran langsung lunas. KREDIT = Pembayaran cicilan melalui leasing. Untuk kredit, Anda perlu input DP, tenor, dan bunga.' },
            { q: 'Bagaimana cara melihat laporan penjualan?', a: 'Buka menu Laporan untuk melihat statistik penjualan, grafik bulanan, total profit, dan performa dealer Anda.' },
        ]
    },
    {
        title: 'Data Customer',
        icon: <Users className="w-5 h-5" />,
        color: 'bg-purple-100 text-purple-600',
        items: [
            { q: 'Bagaimana cara menambah customer baru?', a: 'Buka menu Customer → Tambah Customer. Isi nama, nomor HP, alamat, dan NIK. Data ini akan tersimpan untuk transaksi selanjutnya.' },
            { q: 'Apa itu fitur Blacklist?', a: 'Blacklist adalah daftar customer bermasalah (kredit macet, penipuan). Anda bisa cek dan tambah customer ke blacklist melalui menu Blacklist.' },
        ]
    },
    {
        title: 'Kredit & Cicilan',
        icon: <CreditCard className="w-5 h-5" />,
        color: 'bg-amber-100 text-amber-600',
        items: [
            { q: 'Bagaimana cara tracking cicilan kredit?', a: 'Buka menu Kredit untuk melihat semua transaksi kredit aktif. Anda bisa melihat jadwal jatuh tempo, cicilan terbayar, dan sisa pembayaran.' },
            { q: 'Bagaimana mencatat pembayaran cicilan?', a: 'Di menu Kredit, pilih transaksi → klik Catat Pembayaran. Input tanggal dan jumlah pembayaran. Sistem akan otomatis update sisa cicilan.' },
        ]
    },
    {
        title: 'Multi-Cabang',
        icon: <Building className="w-5 h-5" />,
        color: 'bg-indigo-100 text-indigo-600',
        items: [
            { q: 'Bagaimana cara menambah cabang baru?', a: 'Buka menu Cabang → Tambah Cabang. Fitur ini tersedia untuk paket PRO ke atas. Setiap cabang bisa memiliki staff dan inventaris terpisah.' },
            { q: 'Bagaimana assign staff ke cabang?', a: 'Di menu Pengaturan → Staff, pilih staff dan klik Assign Branch. Staff hanya bisa melihat data dari cabang yang ditugaskan.' },
        ]
    },
    {
        title: 'Langganan & Billing',
        icon: <Shield className="w-5 h-5" />,
        color: 'bg-rose-100 text-rose-600',
        items: [
            { q: 'Bagaimana cara upgrade paket?', a: 'Buka menu Langganan, pilih paket yang diinginkan, lakukan pembayaran via transfer bank. Setelah diverifikasi admin, fitur langsung aktif.' },
            { q: 'Apa perbedaan paket FREE, PRO, dan UNLIMITED?', a: 'FREE: 50 kendaraan, 1 cabang. PRO: 200 kendaraan, 3 cabang, prioritas support. UNLIMITED: Tanpa batasan, dedicated support.' },
            { q: 'Apakah data saya aman?', a: 'Ya, semua data dienkripsi dan disimpan di server yang aman. Kami tidak membagikan data Anda ke pihak ketiga.' },
        ]
    },
];

export default function HelpCenterPage() {
    const [activeCategory, setActiveCategory] = useState(0);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Pusat Bantuan</h1>
                <p className="text-gray-500 mt-1">Ada pertanyaan? Temukan jawaban di sini atau hubungi kami.</p>
            </div>

            {/* Category Tabs */}
            <div className="flex overflow-x-auto gap-2 pb-2">
                {FAQ_CATEGORIES.map((cat, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveCategory(i)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${activeCategory === i
                                ? 'bg-[#00bfa5] text-white'
                                : 'bg-[#ecf0f3] dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] dark:shadow-none hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        {cat.icon}
                        <span className="text-sm font-medium">{cat.title}</span>
                    </button>
                ))}
            </div>

            {/* FAQ Content */}
            <div className="bg-[#ecf0f3] dark:bg-gray-800 rounded-2xl p-6 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] dark:shadow-none">
                <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-xl ${FAQ_CATEGORIES[activeCategory].color} flex items-center justify-center`}>
                        {FAQ_CATEGORIES[activeCategory].icon}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {FAQ_CATEGORIES[activeCategory].title}
                    </h2>
                </div>
                <div className="space-y-3">
                    {FAQ_CATEGORIES[activeCategory].items.map((item, i) => (
                        <details key={i} className="group">
                            <summary className="flex items-center justify-between cursor-pointer py-3 px-4 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors">
                                <span className="font-medium text-gray-700 dark:text-gray-200">{item.q}</span>
                                <span className="text-gray-400 group-open:rotate-180 transition-transform ml-4">▼</span>
                            </summary>
                            <p className="text-gray-500 dark:text-gray-400 text-sm px-4 pb-3 leading-relaxed">{item.a}</p>
                        </details>
                    ))}
                </div>
            </div>

            {/* Contact Card */}
            <div className="bg-[#ecf0f3] dark:bg-gray-800 rounded-2xl p-6 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] dark:shadow-none">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Masih Ada Pertanyaan?</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <a
                        href="https://wa.me/6281234567890"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                        <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                            <p className="font-medium text-emerald-700 dark:text-emerald-300">WhatsApp</p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">Chat langsung dengan CS (respon cepat)</p>
                        </div>
                    </a>
                    <a
                        href="mailto:support@otohub.id"
                        className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                            <p className="font-medium text-blue-700 dark:text-blue-300">Email Support</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">support@otohub.id</p>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}
