'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import {
    Save, Loader2, Plus, Trash2, LayoutTemplate,
    List, CreditCard, HelpCircle, Footprints, Globe
} from 'lucide-react';

interface HeroSection {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    bgImage: string;
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
    socialLinks: { platform: string; url: string }[];
    contactInfo: { email: string; phone: string; address: string };
}

interface LandingContent {
    hero: HeroSection;
    features: Feature[];
    pricing: PricingPlan[];
    faq: FAQ[];
    footer: Footer;
}

export default function CMSEditorPage() {
    const [activeTab, setActiveTab] = useState<'HERO' | 'FEATURES' | 'PRICING' | 'FAQ' | 'FOOTER'>('HERO');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [content, setContent] = useState<LandingContent | null>(null);

    // Fetch Content
    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const res = await fetch(`${API_URL}/public/content`);
            if (res.ok) {
                const data = await res.json();
                // Ensure defaults if data is partial
                setContent({
                    hero: data.hero || { title: '', subtitle: '', ctaText: '', ctaLink: '', bgImage: '' },
                    features: data.features || [],
                    pricing: data.pricing || [],
                    faq: data.faq || [],
                    footer: data.footer || { socialLinks: [], contactInfo: { email: '', phone: '', address: '' } }
                });
            }
        } catch (error) {
            toast.error('Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!content) return;
        setSaving(true);
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_URL}/superadmin/cms`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(content)
            });

            if (res.ok) {
                toast.success('Landing page content updated successfully');
            } else {
                toast.error('Failed to update content');
            }
        } catch (error) {
            toast.error('Error saving content');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
    if (!content) return <div className="p-8 text-center">Failed to load content</div>;

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">CMS Editor</h1>
                    <p className="text-slate-500">Manage content for the public landing page</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 overflow-x-auto">
                    <TabButton id="HERO" label="Hero Section" icon={LayoutTemplate} />
                    <TabButton id="FEATURES" label="Features" icon={List} />
                    <TabButton id="PRICING" label="Pricing" icon={CreditCard} />
                    <TabButton id="FAQ" label="FAQ" icon={HelpCircle} />
                    <TabButton id="FOOTER" label="Footer" icon={Footprints} />
                </div>

                {/* Content Area */}
                <div className="p-6">
                    {/* ================= HERO TAB ================= */}
                    {activeTab === 'HERO' && (
                        <div className="space-y-4 max-w-2xl">
                            <FormInput label="Title (Headline)" value={content.hero.title} onChange={v => setContent({ ...content, hero: { ...content.hero, title: v } })} />
                            <FormInput label="Subtitle" value={content.hero.subtitle} onChange={v => setContent({ ...content, hero: { ...content.hero, subtitle: v } })} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput label="CTA Text" value={content.hero.ctaText} onChange={v => setContent({ ...content, hero: { ...content.hero, ctaText: v } })} />
                                <FormInput label="CTA Link" value={content.hero.ctaLink} onChange={v => setContent({ ...content, hero: { ...content.hero, ctaLink: v } })} />
                            </div>
                            <FormInput label="Background Image URL" value={content.hero.bgImage} onChange={v => setContent({ ...content, hero: { ...content.hero, bgImage: v } })} />

                            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Review</p>
                                <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden relative flex items-center justify-center">
                                    {content.hero.bgImage ? (
                                        <img src={content.hero.bgImage} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-slate-400">No Image</span>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-4">
                                        <h2 className="text-white text-xl font-bold">{content.hero.title || 'Your Headline'}</h2>
                                        <p className="text-white/80 text-sm mt-2">{content.hero.subtitle || 'Your subtitle goes here'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= FEATURES TAB ================= */}
                    {activeTab === 'FEATURES' && (
                        <div className="space-y-6">
                            {content.features.map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 group">
                                    <div className="flex-1 space-y-3">
                                        <FormInput label="Title" value={item.title} onChange={v => {
                                            const newFeatures = [...content.features];
                                            newFeatures[idx].title = v;
                                            setContent({ ...content, features: newFeatures });
                                        }} />
                                        <FormInput label="Description" value={item.desc} onChange={v => {
                                            const newFeatures = [...content.features];
                                            newFeatures[idx].desc = v;
                                            setContent({ ...content, features: newFeatures });
                                        }} />
                                        <div className="w-1/3">
                                            <FormInput label="Lucide Icon Name" value={item.icon} onChange={v => {
                                                const newFeatures = [...content.features];
                                                newFeatures[idx].icon = v;
                                                setContent({ ...content, features: newFeatures });
                                            }} />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newFeatures = content.features.filter((_, i) => i !== idx);
                                            setContent({ ...content, features: newFeatures });
                                        }}
                                        className="self-start p-2 text-rose-500 hover:bg-rose-100 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setContent({ ...content, features: [...content.features, { title: '', desc: '', icon: 'Star' }] })}
                                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center gap-2 font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Feature
                            </button>
                        </div>
                    )}

                    {/* ================= FAQ TAB ================= */}
                    {activeTab === 'FAQ' && (
                        <div className="space-y-6">
                            {content.faq.map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex-1 space-y-3">
                                        <FormInput label="Question" value={item.question} onChange={v => {
                                            const newFaq = [...content.faq];
                                            newFaq[idx].question = v;
                                            setContent({ ...content, faq: newFaq });
                                        }} />
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Answer</label>
                                            <textarea
                                                value={item.answer}
                                                onChange={e => {
                                                    const newFaq = [...content.faq];
                                                    newFaq[idx].answer = e.target.value;
                                                    setContent({ ...content, faq: newFaq });
                                                }}
                                                rows={3}
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newFaq = content.faq.filter((_, i) => i !== idx);
                                            setContent({ ...content, faq: newFaq });
                                        }}
                                        className="self-start p-2 text-rose-500 hover:bg-rose-100 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setContent({ ...content, faq: [...content.faq, { question: '', answer: '' }] })}
                                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center gap-2 font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Question
                            </button>
                        </div>
                    )}

                    {/* ================= FOOTER TAB ================= */}
                    {activeTab === 'FOOTER' && (
                        <div className="space-y-6 max-w-2xl">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                                <h3 className="font-semibold text-slate-900">Contact Info</h3>
                                <FormInput label="Email" value={content.footer.contactInfo.email} onChange={v => setContent({ ...content, footer: { ...content.footer, contactInfo: { ...content.footer.contactInfo, email: v } } })} />
                                <FormInput label="Phone" value={content.footer.contactInfo.phone} onChange={v => setContent({ ...content, footer: { ...content.footer, contactInfo: { ...content.footer.contactInfo, phone: v } } })} />
                                <FormInput label="Address" value={content.footer.contactInfo.address} onChange={v => setContent({ ...content, footer: { ...content.footer, contactInfo: { ...content.footer.contactInfo, address: v } } })} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'PRICING' && (
                        <div className="p-12 text-center text-slate-400">
                            <p>Pricing is currently managed via Plan Tiers configuration.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

const FormInput = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (val: string) => void, placeholder?: string }) => (
    <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
        />
    </div>
);
