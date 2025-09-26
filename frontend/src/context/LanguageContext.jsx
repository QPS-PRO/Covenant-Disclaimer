import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const { i18n } = useTranslation();

    const currentLanguage = i18n.language || 'en';
    const isRTL = currentLanguage === 'ar';

    const changeLanguage = (language) => {
        i18n.changeLanguage(language);
    };

    const toggleLanguage = () => {
        const newLanguage = currentLanguage === 'en' ? 'ar' : 'en';
        changeLanguage(newLanguage);
    };

    useEffect(() => {
        // Update document direction and language
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = currentLanguage;

        // Update body classes for styling
        document.body.classList.toggle('rtl', isRTL);
        document.body.classList.toggle('ltr', !isRTL);

        // Update Tailwind direction classes on root element
        document.documentElement.classList.toggle('rtl', isRTL);
        document.documentElement.classList.toggle('ltr', !isRTL);

    }, [currentLanguage, isRTL]);

    const value = {
        currentLanguage,
        isRTL,
        changeLanguage,
        toggleLanguage,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};