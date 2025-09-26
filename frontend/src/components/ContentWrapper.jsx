// src/components/ContentWrapper.jsx
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export function ContentWrapper({ children, className = "" }) {
    const { isRTL } = useLanguage();

    const getWrapperClasses = () => {
        let classes = `transition-all duration-300 ${className}`;

        if (isRTL) {
            // RTL: sidebar on right, content needs margin from right
            classes += ' xl:mr-80 xl:ml-0';
        } else {
            // LTR: sidebar on left, content needs margin from left
            classes += ' xl:ml-80 xl:mr-0';
        }

        return classes;
    };

    return (
        <div className={getWrapperClasses()}>
            {children}
        </div>
    );
}

export default ContentWrapper;