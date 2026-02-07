'use client';

import { useState, useEffect } from 'react';
import translations, { Language, TranslationKeys } from '@/lib/translations';

export type { Language } from '@/lib/translations';

export function useLanguage() {
    const [language, setLanguageState] = useState<Language>('id');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedLang = localStorage.getItem('app_lang') as Language | null;
        if (savedLang && ['id', 'en', 'th', 'ph', 'vi'].includes(savedLang)) {
            setLanguageState(savedLang);
        }
    }, []);

    const changeLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('app_lang', lang);
    };

    const t: TranslationKeys = translations[language] || translations.id;

    return {
        language,
        changeLanguage,
        setLanguage: changeLanguage, // alias for Header
        t,
        mounted,
    };
}

export default useLanguage;

