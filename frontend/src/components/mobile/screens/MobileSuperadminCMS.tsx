'use client';

import React, { useEffect, useState } from 'react';
import { Layout, Type, List, CreditCard, Save, Plus, Trash2, HelpCircle, Footprints, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

interface HeroSection {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
}

interface Feature {
    title: string;
    desc: string;
    icon: string;
}

interface PricingPlan {
    name: string;
    price: string;
    features: string[];
    highlight: boolean;
}

interface FAQ {
    question: string;
    answer: string;
}

interface Footer {
    contactInfo: { email: string; phone: string; address: string };
}

interface LandingContent {
    hero: HeroSection;
    features: Feature[];
    pricing: PricingPlan[];
    faq: FAQ[];
    footer: Footer;
}

const DEFAULT_CONTENT: LandingContent = {
    hero: { title: '', subtitle: '', ctaText: '', ctaLink: '' },
    features: [],
    pricing: [],
    faq: [],
    footer: { contactInfo: { email: '', phone: '', address: '' } }
};

export default function MobileSuperadminCMS() {
    const [content, setContent] = useState<LandingContent>(DEFAULT_CONTENT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedTab, setExpandedTab] = useState<'HERO' | 'FEATURES' | 'PRICING' | 'FAQ' | 'FOOTER' | null>('HERO');

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/public/content');
            if (res.ok) {
                const data = await res.json();
                setContent({
                    hero: data.hero || DEFAULT_CONTENT.hero,
                    features: data.features || DEFAULT_CONTENT.features,
                    pricing: data.pricing || DEFAULT_CONTENT.pricing,
                    faq: data.faq || DEFAULT_CONTENT.faq,
                    footer: data.footer || DEFAULT_CONTENT.footer
                });
            }
        } catch { } finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetchApi('/superadmin/cms', {
                method: 'PATCH',
                body: JSON.stringify(content),
            });
            if (res.ok) {
                toast.success('Konten landing page disimpan');
            } else {
                toast.error('Gagal menyimpan konten');
            }
        } catch { toast.error('Gagal menyimpan konten'); }
        finally { setSaving(false); }
    };

    const updateHero = (key: keyof HeroSection, val: string) => {
        setContent(c => ({ ...c, hero: { ...c.hero, [key]: val } }));
    };

    const updateFooter = (key: keyof Footer['contactInfo'], val: string) => {
        setContent(c => ({ ...c, footer: { ...c.footer, contactInfo: { ...c.footer.contactInfo, [key]: val } } }));
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const renderAccordionItem = (id: any, label: string, icon: React.ReactNode, children: React.ReactNode) => {
        const isExpanded = expandedTab === id;
        return (
            <div className="bg-[#ecf0f3] rounded-2xl shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff] overflow-hidden mb-4">
                <button
                    onClick={() => setExpandedTab(isExpanded ? null : id)}
                    className="w-full flex items-center justify-between p-4 bg-[#ecf0f3] active:bg-[#e0e5e9] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#ecf0f3] flex items-center justify-center shadow-[2px_2px_4px_#cbced1,-2px_-2px_4px_#ffffff] text-[#00bfa5]">
                            {icon}
                        </div>
                        <span className="font-bold text-gray-800 text-sm">{label}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {isExpanded && (
                    <div className="p-4 pt-0 border-t border-gray-200 mt-2">
                        {children}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 pb-24 space-y-2">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Landing Page (CMS)</h1>
                    <p className="text-sm text-gray-500">Edit tampilan halaman depan</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00bfa5] text-white text-sm font-bold shadow-lg disabled:opacity-50">
                    <Save className="w-4 h-4" /> {saving ? 'Load' : 'Simpan'}
                </button>
            </div>

            {/* HERO */}
            {renderAccordionItem('HERO', 'Hero Section', <Layout className="w-5 h-5" />, (
                <div className="space-y-3 mt-3">
                    {[
                        { label: 'Judul Utama', key: 'title', type: 'text' },
                        { label: 'Subjudul', key: 'subtitle', type: 'textarea' },
                        { label: 'Teks Tombol CTA', key: 'ctaText', type: 'text' },
                        { label: 'Link CTA', key: 'ctaLink', type: 'text' },
                    ].map(f => (
                        <div key={f.key}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                            {f.type === 'text' ? (
                                <input type="text" value={content.hero[f.key as keyof HeroSection] || ''}
                                    onChange={e => updateHero(f.key as keyof HeroSection, e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm" />
                            ) : (
                                <textarea rows={3} value={content.hero[f.key as keyof HeroSection] || ''}
                                    onChange={e => updateHero(f.key as keyof HeroSection, e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm resize-none" />
                            )}
                        </div>
                    ))}
                </div>
            ))}

            {/* FEATURES */}
            {renderAccordionItem('FEATURES', 'Fitur Unggulan', <List className="w-5 h-5" />, (
                <div className="space-y-4 py-2">
                    {content.features.map((feat, idx) => (
                        <div key={idx} className="bg-white/40 p-3 rounded-xl space-y-3 relative border border-white/50">
                            <button onClick={() => setContent(c => ({ ...c, features: c.features.filter((_, i) => i !== idx) }))}
                                className="absolute top-3 right-3 text-red-400 p-1">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Judul Fitur</label>
                                <input type="text" value={feat.title} onChange={e => {
                                    const next = [...content.features]; next[idx].title = e.target.value;
                                    setContent({ ...content, features: next });
                                }} className="w-full px-3 py-2 rounded-lg bg-[#ecf0f3] shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] focus:outline-none text-sm text-gray-800" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Deskripsi</label>
                                <textarea rows={2} value={feat.desc} onChange={e => {
                                    const next = [...content.features]; next[idx].desc = e.target.value;
                                    setContent({ ...content, features: next });
                                }} className="w-full px-3 py-2 rounded-lg bg-[#ecf0f3] shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] focus:outline-none text-sm text-gray-800 resize-none" />
                            </div>
                        </div>
                    ))}
                    <button onClick={() => setContent(c => ({ ...c, features: [...c.features, { title: '', desc: '', icon: '' }] }))}
                        className="w-full py-3 rounded-xl border border-dashed border-[#00bfa5] text-[#00bfa5] text-sm font-bold flex gap-2 justify-center items-center">
                        <Plus className="w-4 h-4" /> Tambah Fitur
                    </button>
                </div>
            ))}

            {/* PRICING */}
            {renderAccordionItem('PRICING', 'Harga & Paket', <CreditCard className="w-5 h-5" />, (
                <div className="text-center py-6 text-gray-500">
                    <p className="text-xs mb-2 italic">Daftar harga kini diambil otomatis dari database Master Plans, tidak perlu diinput manual di CMS.</p>
                </div>
            ))}

            {/* FAQ */}
            {renderAccordionItem('FAQ', 'FAQ', <HelpCircle className="w-5 h-5" />, (
                <div className="space-y-4 py-2">
                    {content.faq.map((f, idx) => (
                        <div key={idx} className="bg-white/40 p-3 rounded-xl space-y-3 relative border border-white/50">
                            <button onClick={() => setContent(c => ({ ...c, faq: c.faq.filter((_, i) => i !== idx) }))}
                                className="absolute top-3 right-3 text-red-400 p-1">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Pertanyaan</label>
                                <input type="text" value={f.question} onChange={e => {
                                    const next = [...content.faq]; next[idx].question = e.target.value;
                                    setContent({ ...content, faq: next });
                                }} className="w-full px-3 py-2 rounded-lg bg-[#ecf0f3] shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] focus:outline-none text-sm text-gray-800" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Jawaban</label>
                                <textarea rows={2} value={f.answer} onChange={e => {
                                    const next = [...content.faq]; next[idx].answer = e.target.value;
                                    setContent({ ...content, faq: next });
                                }} className="w-full px-3 py-2 rounded-lg bg-[#ecf0f3] shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] focus:outline-none text-sm text-gray-800 resize-none" />
                            </div>
                        </div>
                    ))}
                    <button onClick={() => setContent(c => ({ ...c, faq: [...c.faq, { question: '', answer: '' }] }))}
                        className="w-full py-3 rounded-xl border border-dashed border-[#00bfa5] text-[#00bfa5] text-sm font-bold flex gap-2 justify-center items-center">
                        <Plus className="w-4 h-4" /> Tambah FAQ
                    </button>
                </div>
            ))}

            {/* FOOTER */}
            {renderAccordionItem('FOOTER', 'Hubungi Kami', <Footprints className="w-5 h-5" />, (
                <div className="space-y-3 mt-3">
                    {[
                        { label: 'Email', key: 'email', type: 'email' },
                        { label: 'Telepon', key: 'phone', type: 'tel' },
                    ].map(f => (
                        <div key={f.key}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                            <input type={f.type} value={content.footer.contactInfo[f.key as keyof Footer['contactInfo']] || ''}
                                onChange={e => updateFooter(f.key as keyof Footer['contactInfo'], e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm" />
                        </div>
                    ))}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Alamat</label>
                        <textarea rows={3} value={content.footer.contactInfo.address || ''}
                            onChange={e => updateFooter('address', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm resize-none" />
                    </div>
                </div>
            ))}
        </div>
    );
}
