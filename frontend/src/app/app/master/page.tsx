'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Car, Bike, Truck, Bus, Wrench, Package, CircleDot, X, Search, Settings } from 'lucide-react';
import { getCategories, addCategory, ICON_OPTIONS, COLOR_OPTIONS, VehicleCategory, VEHICLE_ICONS } from '@/lib/categories';
import { API_URL } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';

interface Brand {
    id: string;
    name: string;
    category: string;
    models: Model[];
}

interface Model {
    id: string;
    name: string;
    variants: string | null;
}

export default function MasterDataPage() {
    const { t, language } = useLanguage();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<VehicleCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('CAR');
    const [search, setSearch] = useState('');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Modal states
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [showModelModal, setShowModelModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

    // Form states
    const [brandForm, setBrandForm] = useState({ name: '', category: 'CAR' });
    const [modelForm, setModelForm] = useState({ name: '', variants: '' });
    const [categoryForm, setCategoryForm] = useState({ name: '', nameId: '', icon: 'circle', color: 'gray' });

    // Helper for local translations
    const getLabel = (key: string) => {
        const labels: Record<string, Record<string, string>> = {
            addCategory: { id: 'Tambah Kategori', en: 'Add Category' },
            categoryNameEn: { id: 'Nama (English)', en: 'Name (English)' },
            categoryNameId: { id: 'Nama (Indonesia)', en: 'Name (Indonesia)' },
            icon: { id: 'Ikon', en: 'Icon' },
            color: { id: 'Warna', en: 'Color' },
            searchBrand: { id: 'Cari merek...', en: 'Search brand...' },
            noBrandsInCategory: { id: 'Belum ada merek untuk kategori ini', en: 'No brands for this category' },
            noModels: { id: 'Belum ada model', en: 'No models' },
            save: { id: 'Simpan', en: 'Save' },
            others: { id: 'lainnya', en: 'others' },
            manageCategories: { id: 'Kategori', en: 'Categories' },
            exampleBrand: { id: 'Contoh: Toyota, Honda', en: 'Example: Toyota, Honda' },
            exampleModel: { id: 'Contoh: Avanza, Jazz', en: 'Example: Civic, Accord' },
            exampleVariants: { id: 'Contoh: G, E, S', en: 'Example: LX, EX, Sport' },
            variantsPlaceholder: { id: 'Varian (pisahkan dengan koma)', en: 'Variants (comma separated)' },
            exampleCatEn: { id: 'e.g. Bicycle', en: 'e.g. Bicycle' },
            exampleCatId: { id: 'e.g. Sepeda', en: 'e.g. Sepeda' },
        };
        return labels[key]?.[language === 'id' ? 'id' : 'en'] || labels[key]?.['en'] || key;
    };

    useEffect(() => {
        setCategories(getCategories());
        const storedTheme = localStorage.getItem('otohub_theme') as 'light' | 'dark' | null;
        if (storedTheme) setTheme(storedTheme);
    }, []);

    useEffect(() => {
        fetchBrands();
    }, [activeCategory]);

    const fetchBrands = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(
                `${API_URL}/vehicles/brands/list?category=${activeCategory}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (res.ok) {
                setBrands(await res.json());
            }
        } catch (err) {
            console.error('Error fetching brands:', err);
            setBrands([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBrand = async () => {
        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${API_URL}/vehicles/brands`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(brandForm),
            });
            setShowBrandModal(false);
            setBrandForm({ name: '', category: activeCategory });
            fetchBrands();
        } catch (err) {
            console.error('Error adding brand:', err);
        }
    };

    const handleAddModel = async () => {
        if (!selectedBrandId) return;
        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${API_URL}/vehicles/models`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    brandId: selectedBrandId,
                    name: modelForm.name,
                    variants: modelForm.variants || null,
                }),
            });
            setShowModelModal(false);
            setModelForm({ name: '', variants: '' });
            setSelectedBrandId(null);
            fetchBrands();
        } catch (err) {
            console.error('Error adding model:', err);
        }
    };

    const handleAddCategory = () => {
        if (!categoryForm.name || !categoryForm.nameId) return;
        addCategory({
            name: categoryForm.name,
            nameId: categoryForm.nameId,
            icon: categoryForm.icon,
            color: categoryForm.color,
        });
        setCategories(getCategories());
        setShowCategoryModal(false);
        setCategoryForm({ name: '', nameId: '', icon: 'circle', color: 'gray' });
    };

    const filteredBrands = brands.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase())
    );

    const getCategoryIcon = (iconKey: string) => {
        const icons: Record<string, React.ReactNode> = {
            car: <Car className="w-5 h-5" />,
            bike: <Bike className="w-5 h-5" />,
            truck: <Truck className="w-5 h-5" />,
            bus: <Bus className="w-5 h-5" />,
            wrench: <Wrench className="w-5 h-5" />,
            package: <Package className="w-5 h-5" />,
            circle: <CircleDot className="w-5 h-5" />,
        };
        return icons[iconKey] || icons.circle;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t.masterTitle}</h1>
                    <p className="text-gray-500 mt-1">{t.masterDesc}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${theme === 'dark'
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:text-[#00bfa5]'
                            }`}
                    >
                        <Settings className="w-5 h-5" /> {getLabel('manageCategories')}
                    </button>
                    <button
                        onClick={() => {
                            setBrandForm({ name: '', category: activeCategory });
                            setShowBrandModal(true);
                        }}
                        className="flex items-center gap-2 bg-[#00bfa5] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#00a896] transition-colors shadow-lg"
                    >
                        <Plus className="w-5 h-5" /> {t.addBrand}
                    </button>
                </div>
            </div>

            {/* Category Tabs - Now Dynamic */}
            <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${activeCategory === cat.id
                            ? 'bg-[#00bfa5] text-white shadow-lg'
                            : theme === 'dark'
                                ? 'bg-gray-700 text-gray-300 hover:text-[#00bfa5]'
                                : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:text-[#00bfa5]'
                            }`}
                    >
                        {getCategoryIcon(cat.icon)}
                        {language === 'id' ? cat.nameId : cat.name}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={getLabel('searchBrand')}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] ${theme === 'dark'
                        ? 'bg-gray-800 text-white placeholder-gray-400'
                        : 'bg-[#ecf0f3] text-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]'
                        }`}
                />
            </div>

            {/* Brands Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBrands.map((brand) => (
                    <div key={brand.id} className={`rounded-2xl p-5 ${theme === 'dark'
                        ? 'bg-gray-800'
                        : 'bg-[#ecf0f3] shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]'
                        }`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#00bfa5]/10 flex items-center justify-center text-[#00bfa5]">
                                    {getCategoryIcon(categories.find(c => c.id === brand.category)?.icon || 'circle')}
                                </div>
                                <div>
                                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{brand.name}</h3>
                                    <p className="text-xs text-gray-500">{brand.models?.length || 0} {t.modelName?.toLowerCase() || 'model'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedBrandId(brand.id);
                                    setModelForm({ name: '', variants: '' });
                                    setShowModelModal(true);
                                }}
                                className="text-[#00bfa5] hover:bg-[#00bfa5]/10 p-2 rounded-lg transition-colors"
                                title={t.addModel}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Models List */}
                        <div className="space-y-2">
                            {brand.models?.slice(0, 5).map((model) => (
                                <div key={model.id} className={`flex justify-between items-center py-2 px-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/50'
                                    }`}>
                                    <div>
                                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{model.name}</span>
                                        {model.variants && (
                                            <span className="text-xs text-gray-400 ml-2">
                                                ({model.variants.split(',').join(', ')})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!brand.models || brand.models.length === 0) && (
                                <p className="text-sm text-gray-400 italic">{getLabel('noModels')}</p>
                            )}
                            {brand.models && brand.models.length > 5 && (
                                <p className="text-xs text-[#00bfa5] text-center">+{brand.models.length - 5} {getLabel('others')}</p>
                            )}
                        </div>
                    </div>
                ))}

                {filteredBrands.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        {getLabel('noBrandsInCategory')}
                    </div>
                )}
            </div>

            {/* Add Brand Modal */}
            {showBrandModal && (
                <Modal title={t.addBrand} onClose={() => setShowBrandModal(false)} theme={theme}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{t.brandName}</label>
                            <input
                                type="text"
                                value={brandForm.name}
                                onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                                placeholder={getLabel('exampleBrand')}
                                className={`w-full px-4 py-3 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] ${theme === 'dark'
                                    ? 'bg-gray-700 text-white placeholder-gray-400'
                                    : 'bg-[#ecf0f3] text-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]'
                                    }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{t.manageCategories}</label>
                            <select
                                value={brandForm.category}
                                onChange={(e) => setBrandForm({ ...brandForm, category: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] ${theme === 'dark'
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-[#ecf0f3] text-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]'
                                    }`}
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{language === 'id' ? cat.nameId : cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleAddBrand}
                            className="w-full bg-[#00bfa5] text-white py-3 rounded-xl font-medium hover:bg-[#00a896] transition-colors"
                        >
                            {getLabel('save')}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Add Model Modal */}
            {showModelModal && (
                <Modal title={t.addModel} onClose={() => setShowModelModal(false)} theme={theme}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{t.modelName}</label>
                            <input
                                type="text"
                                value={modelForm.name}
                                onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                                placeholder={getLabel('exampleModel')}
                                className={`w-full px-4 py-3 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] ${theme === 'dark'
                                    ? 'bg-gray-700 text-white placeholder-gray-400'
                                    : 'bg-[#ecf0f3] text-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]'
                                    }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{getLabel('variantsPlaceholder')}</label>
                            <input
                                type="text"
                                value={modelForm.variants}
                                onChange={(e) => setModelForm({ ...modelForm, variants: e.target.value })}
                                placeholder={getLabel('exampleVariants')}
                                className={`w-full px-4 py-3 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] ${theme === 'dark'
                                    ? 'bg-gray-700 text-white placeholder-gray-400'
                                    : 'bg-[#ecf0f3] text-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]'
                                    }`}
                            />
                        </div>
                        <button
                            onClick={handleAddModel}
                            className="w-full bg-[#00bfa5] text-white py-3 rounded-xl font-medium hover:bg-[#00a896] transition-colors"
                        >
                            {getLabel('save')}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Add Category Modal */}
            {showCategoryModal && (
                <Modal title={getLabel('addCategory')} onClose={() => setShowCategoryModal(false)} theme={theme}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{getLabel('categoryNameEn')}</label>
                            <input
                                type="text"
                                value={categoryForm.name}
                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                placeholder={getLabel('exampleCatEn')}
                                className={`w-full px-4 py-3 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] ${theme === 'dark'
                                    ? 'bg-gray-700 text-white placeholder-gray-400'
                                    : 'bg-[#ecf0f3] text-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]'
                                    }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{getLabel('categoryNameId')}</label>
                            <input
                                type="text"
                                value={categoryForm.nameId}
                                onChange={(e) => setCategoryForm({ ...categoryForm, nameId: e.target.value })}
                                placeholder={getLabel('exampleCatId')}
                                className={`w-full px-4 py-3 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] ${theme === 'dark'
                                    ? 'bg-gray-700 text-white placeholder-gray-400'
                                    : 'bg-[#ecf0f3] text-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]'
                                    }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{getLabel('icon')}</label>
                            <div className="grid grid-cols-4 gap-2">
                                {ICON_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => setCategoryForm({ ...categoryForm, icon: opt.key })}
                                        className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${categoryForm.icon === opt.key
                                            ? 'bg-[#00bfa5]/20 ring-2 ring-[#00bfa5]'
                                            : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white/50 hover:bg-white'
                                            }`}
                                    >
                                        {getCategoryIcon(opt.key)}
                                        {/* Icons don't change names usually but we could map them if really needed. Keeping fixed for now or removing label to just show icon */}
                                        <span className="text-xs text-gray-500">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{getLabel('color')}</label>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => setCategoryForm({ ...categoryForm, color: opt.key })}
                                        className={`w-8 h-8 rounded-full ${opt.class} transition-transform ${categoryForm.color === opt.key ? 'ring-2 ring-offset-2 ring-[#00bfa5] scale-110' : ''
                                            }`}
                                        title={opt.label}
                                    />
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleAddCategory}
                            className="w-full bg-[#00bfa5] text-white py-3 rounded-xl font-medium hover:bg-[#00a896] transition-colors"
                        >
                            {getLabel('addCategory')}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function Modal({ title, children, onClose, theme }: { title: string; children: React.ReactNode; onClose: () => void; theme: 'light' | 'dark' }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl shadow-xl max-w-md w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-[#ecf0f3]'
                }`}>
                <div className={`flex justify-between items-center p-5 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{title}</h3>
                    <button onClick={onClose} className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-5">
                    {children}
                </div>
            </div>
        </div>
    );
}
