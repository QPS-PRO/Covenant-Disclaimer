// src/components/LanguageToggle.jsx
import React from 'react';
import {
    IconButton,
    Menu,
    MenuHandler,
    MenuList,
    MenuItem,
    Typography,
} from '@material-tailwind/react';
import { LanguageIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/context/LanguageContext';

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export function LanguageToggle() {
    const { currentLanguage, changeLanguage } = useLanguage();

    const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

    return (
        <Menu placement="bottom-end">
            <MenuHandler>
                <IconButton variant="text" color="blue-gray">
                    <div className="flex items-center gap-2">
                        <LanguageIcon className="h-5 w-5" />
                        <span className="text-sm">{currentLang.flag}</span>
                    </div>
                </IconButton>
            </MenuHandler>
            <MenuList className="min-w-[120px]">
                {languages.map((language) => (
                    <MenuItem
                        key={language.code}
                        onClick={() => changeLanguage(language.code)}
                        className={`flex items-center gap-2 ${currentLanguage === language.code
                                ? 'bg-blue-50 text-blue-600'
                                : ''
                            }`}
                    >
                        <span className="text-lg">{language.flag}</span>
                        <Typography variant="small" className="font-medium">
                            {language.name}
                        </Typography>
                        {currentLanguage === language.code && (
                            <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                    </MenuItem>
                ))}
            </MenuList>
        </Menu>
    );
}