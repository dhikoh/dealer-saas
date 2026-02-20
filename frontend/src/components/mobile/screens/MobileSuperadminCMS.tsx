'use client';

import React, { useEffect, useState } from 'react';
import { Layout, Image, Type, AlignLeft, Save, Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

interface CMSSection {
    id: string;
    name: string;
    type: 'HERO' | 'FEATURES' | 'PRICING' | 'TESTIMONIALS' | 'FAQ' | 'CTA' | 'CUSTOM';
    isVisible: boolean;
    content: Record<string, any>;
    order: number;
}

interface HeroContent { headline: string; subheadline: string; ctaText: string; ctaUrl: string; }
interface FAQItem { question: string; answer: string; }

const TYPE_ICONS: Record<string, React.ReactNode> = {
    HERO: <Layout className="w-4 h-4" />,
    FEATURES: <Type className="w-4 h-4" />,
    PRICING: <AlignLeft className="w-4 h-4" />,
    TESTIMONIALS: <Image className="w-4 h-4" />,
    FAQ: <AlignLeft className="w-4 h-4" />,
    CTA: <Type className="w-4 h-4" />,
    CUSTOM: <Layout className="w-4 h-4" />,
};
const TYPE_COLORS: Record<string, string> = {
    HERO: 'bg-blue-100 text-blue-600', FEATURES: 'bg-emerald-100 text-emerald-600',
    PRICING: 'bg-purple-100 text-purple-600', TESTIMONIALS: 'bg-amber-100 text-amber-600',
    FAQ: 'bg-orange-100 text-orange-600', CTA: 'bg-pink-100 text-pink-600',
    CUSTOM: 'bg-gray-100 text-gray-600',
};

export default function MobileSuperadminCMS() {
    const [sections, setSections] = useState<CMSSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<CMSSection | null>(null);
    const [saving, setSaving] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => { fetchSections(); }, []);

    const fetchSections = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/cms/sections');
            if (res.ok) {
                const d = await res.json();
                const sorted = (d?.sections ?? d ?? []).sort((a: CMSSection, b: CMSSection) => a.order - b.order);
                setSections(sorted);
            }
        } catch { } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            const res = await fetchApi(`/cms/sections/${editing.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ content: editing.content, isVisible: editing.isVisible }),
            });
            if (res.ok) {
                toast.success('Section disimpan');
                setEditing(null);
                fetchSections();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal menyimpan');
            }
        } catch { toast.error('Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const toggleVisibility = async (section: CMSSection) => {
        try {
            const res = await fetchApi(`/cms/sections/${section.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isVisible: !section.isVisible }),
            });
            if (res.ok) {
                toast.success(section.isVisible ? 'Section disembunyikan' : 'Section ditampilkan');
                fetchSections();
            }
        } catch { toast.error('Gagal'); }
    };

    const moveSection = async (section: CMSSection, direction: 'up' | 'down') => {
        const currentIndex = sections.findIndex(s => s.id === section.id);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;
        try {
            await fetchApi(`/cms/sections/${section.id}/reorder`, {
                method: 'PATCH',
                body: JSON.stringify({ newOrder: sections[targetIndex].order }),
            });
            fetchSections();
        } catch { }
    };

    const renderEditor = (sec: CMSSection) => {
        if (sec.type === 'HERO') {
            const c = (sec.content || {}) as HeroContent;
            return (
                <div className="space-y-3">
                    {[
                        { key: 'headline', label: 'Headline', placeholder: 'Judul utama...', multiline: false },
                        { key: 'subheadline', label: 'Subheadline', placeholder: 'Deskripsi singkat...', multiline: true },
                        { key: 'ctaText', label: 'Teks CTA Button', placeholder: 'Mulai Sekarang', multiline: false },
                        { key: 'ctaUrl', label: 'URL CTA', placeholder: '/register', multiline: false },
                    ].map(({ key, label, placeholder, multiline }) => (
                        <div key={key}>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                            {multiline ? (
                                <textarea rows={2} value={(c as any)[key] || ''} placeholder={placeholder}
                                    onChange={e => setEditing({ ...sec, content: { ...c, [key]: e.target.value } })}
                                    className="w-full px-3 py-2 rounded-lg bg-[#ecf0f3] shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] focus:outline-none text-gray-800 text-sm resize-none" />
                            ) : (
                                <input type="text" value={(c as any)[key] || ''} placeholder={placeholder}
                                    onChange={e => setEditing({ ...sec, content: { ...c, [key]: e.target.value } })}
                                    className="w-full px-3 py-2 rounded-lg bg-[#ecf0f3] shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] focus:outline-none text-gray-800 text-sm" />
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        if (sec.type === 'FAQ') {
            const faqs: FAQItem[] = sec.content?.faqs || [];
            return (
                <div className="space-y-2">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="bg-white/50 rounded-xl p-3 space-y-2">
                            <input type="text" value={faq.question} placeholder="Pertanyaan..."
                                onChange={e => {
                                    const updated = faqs.map((f, i) => i === idx ? { ...f, question: e.target.value } : f);
                                    setEditing({ ...sec, content: { ...sec.content, faqs: updated } });
                                }}
                                className="w-full px-3 py-2 rounded-lg bg-[#ecf0f3] shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] focus:outline-none text-gray-800 text-sm" />
                            <textarea rows={2} value={faq.answer} placeholder="Jawaban..."
                                onChange={e => {
                                    const updated = faqs.map((f, i) => i === idx ? { ...f, answer: e.target.value } : f);
                                    setEditing({ ...sec, content: { ...sec.content, faqs: updated } });
                                }}
                                className="w-full px-3 py-2 rounded-lg bg-[#ecf0f3] shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] focus:outline-none text-gray-800 text-sm resize-none" />
                            <button onClick={() => {
                                const updated = faqs.filter((_, i) => i !== idx);
                                setEditing({ ...sec, content: { ...sec.content, faqs: updated } });
                            }} className="text-red-500 text-xs flex items-center gap-1">
                                <Trash2 className="w-3 h-3" /> Hapus
                            </button>
                        </div>
                    ))}
                    <button onClick={() => {
                        const updated = [...faqs, { question: '', answer: '' }];
                        setEditing({ ...sec, content: { ...sec.content, faqs: updated } });
                    }} className="w-full py-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Tambah FAQ
                    </button>
                </div>
            );
        }

        // Generic JSON editor for other types
        return (
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Konten (JSON)</label>
                <textarea rows={6} value={JSON.stringify(sec.content, null, 2)}
                    onChange={e => {
                        try { setEditing({ ...sec, content: JSON.parse(e.target.value) }); } catch { }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-[#ecf0f3] shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] focus:outline-none text-gray-800 text-xs resize-none font-mono" />
            </div>
        );
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-4 pb-24 space-y-4">
            <div>
                <h1 className="text-xl font-bold text-gray-800">CMS Landing Page</h1>
                <p className="text-sm text-gray-500">{sections.length} section aktif</p>
            </div>

            <div className="space-y-3">
                {sections.map((section, idx) => (
                    <div key={section.id} className={`bg-[#ecf0f3] rounded-2xl shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff] overflow-hidden ${!section.isVisible ? 'opacity-60' : ''}`}>
                        {/* Section header */}
                        <div className="p-4 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[section.type] ?? TYPE_COLORS.CUSTOM}`}>
                                {TYPE_ICONS[section.type] ?? TYPE_ICONS.CUSTOM}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 text-sm">{section.name}</h3>
                                <p className="text-xs text-gray-400">{section.type}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                {/* Move up/down */}
                                <button disabled={idx === 0} onClick={() => moveSection(section, 'up')} className={`p-1.5 rounded-lg ${idx === 0 ? 'opacity-30' : 'text-gray-500 bg-[#ecf0f3] shadow-[2px_2px_4px_#cbced1,-2px_-2px_4px_#ffffff]'}`}>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button disabled={idx === sections.length - 1} onClick={() => moveSection(section, 'down')} className={`p-1.5 rounded-lg ${idx === sections.length - 1 ? 'opacity-30' : 'text-gray-500 bg-[#ecf0f3] shadow-[2px_2px_4px_#cbced1,-2px_-2px_4px_#ffffff]'}`}>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                {/* Visibility toggle */}
                                <button onClick={() => toggleVisibility(section)}
                                    className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${section.isVisible ? 'bg-[#00bfa5]' : 'bg-gray-300'}`}>
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${section.isVisible ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                                {/* Edit button */}
                                <button onClick={() => setEditing(editing?.id === section.id ? null : { ...section })}
                                    className="px-3 py-1.5 rounded-lg bg-[#00bfa5] text-white text-xs font-bold ml-1">
                                    Edit
                                </button>
                            </div>
                        </div>

                        {/* Inline editor */}
                        {editing?.id === section.id && (
                            <div className="px-4 pb-4 border-t border-gray-200 pt-3 space-y-3">
                                {renderEditor(editing)}
                                <div className="flex items-center justify-between pt-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                        <button onClick={() => setEditing({ ...editing, isVisible: !editing.isVisible })}
                                            className={`relative w-10 h-5 rounded-full transition-colors ${editing.isVisible ? 'bg-[#00bfa5]' : 'bg-gray-300'}`}>
                                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editing.isVisible ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                        </button>
                                        Tampilkan
                                    </label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditing(null)} className="px-3 py-2 rounded-xl bg-[#ecf0f3] text-gray-600 text-xs font-medium shadow-[2px_2px_4px_#cbced1,-2px_-2px_4px_#ffffff]">Batal</button>
                                        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-[#00bfa5] text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50">
                                            <Save className="w-3.5 h-3.5" /> Simpan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {sections.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Layout className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Belum ada section CMS</p>
                    </div>
                )}
            </div>
        </div>
    );
}
