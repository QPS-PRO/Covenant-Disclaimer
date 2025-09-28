// src/lib/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
const enTranslations = {
    translation: {
        // Navigation
        nav: {
            qurtubahSchools:"Qurtubah Schools",
            dashboard: "Dashboard",
            home: "Home",
            assets: "Assets",
            departments: "Departments",
            employees: "Employees",
            transactions: "Transactions",
            reports: "Reports",
            settings: "Settings"
        },

        // Authentication
        auth: {
            signIn: "Sign In",
            signUp: "Sign Up",
            email: "Email",
            password: "Password",
            confirmPassword: "Confirm Password",
            firstName: "First Name",
            lastName: "Last Name",
            rememberMe: "Remember me",
            forgotPassword: "Forgot Password",
            createAccount: "Create account",
            alreadyHaveAccount: "Already have an account?",
            notRegistered: "Not registered?",
            signingIn: "Signing In...",
            creatingAccount: "Creating Account...",
            registerNow: "Register Now",
            agreeTerms: "I agree to the Terms and Conditions",
            enterEmailPassword: "Enter your email and password to Sign In.",
            enterDetailsCreate: "Enter your details to create your account.",
            joinUsToday: "Join Us Today",
            registrationSuccessful: "Registration successful! Redirecting to dashboard...",
            loginFailed: "Login failed. Please try again.",
            registrationFailed: "Registration failed. Please try again."
        },

        // Dashboard
        dashboard: {
            title: "Asset Management Dashboard",
            lastUpdated: "Last updated",
            refresh: "Refresh",
            refreshing: "Refreshing...",
            totalDepartments: "Total Departments",
            totalAssets: "Total Assets",
            totalEmployees: "Total Employees",
            recentTransactions: "Recent Transactions",
            assetStatusDistribution: "Asset Status Distribution",
            weeklyTransactions: "Weekly Transactions",
            assetsByDepartment: "Assets by Department",
            yearlyTrends: "Yearly Transaction Trends",
            currentDistribution: "Current distribution of assets by status",
            weeklyAssignsReturns: "Assets assigns and returns over the past week",
            departmentDistribution: "Distribution of assets across departments",
            monthlyTrends: "Monthly assets assigns and returns throughout the year",
            latestTransactions: "Latest asset assignments and returns",
            noRecentTransactions: "No recent transactions available"
        },

        // Assets
        assets: {
            title: "Assets Management",
            addAsset: "Add Asset",
            editAsset: "Edit Asset",
            assetDetails: "Asset Details",
            createAsset: "Create Asset",
            updateAsset: "Update Asset",
            deleteAsset: "Delete Asset",
            assetName: "Asset Name",
            serialNumber: "Serial Number",
            department: "Department",
            status: "Status",
            currentHolder: "Current Holder",
            purchaseDate: "Purchase Date",
            purchaseCost: "Purchase Cost",
            description: "Description",
            basicInformation: "Basic Information",
            purchaseInformation: "Purchase Information",
            searchAssets: "Search assets...",
            filterByDepartment: "Filter by Department",
            filterByStatus: "Filter by Status",
            allDepartments: "All Departments",
            allStatuses: "All Statuses",
            noAssetsFound: "No assets found.",
            selectEmployee: "Select Employee",
            confirmDelete: "Confirm Delete",
            deleteConfirmation: "Are you sure you want to delete this asset? This action cannot be undone.",
            cannotDelete: "This asset cannot be deleted because it is currently assigned to an employee.",
            returnAssetFirst: "To delete this asset, please return it first by creating a return transaction.",
            assetDetailsLabel: "Asset Details:",
            name: "Name",
            serial: "Serial",
            assignedTo: "Assigned to",
            created: "Created",
            lastUpdated: "Last Updated",
            unassigned: "Unassigned"
        },

        // Status options
        status: {
            available: "Available",
            assigned: "Assigned",
            maintenance: "Under Maintenance",
            retired: "Retired"
        },

        // Transaction types
        transactions: {
            assign: "Assign",
            return: "Return",
            issue: "Issue",
            issues: "Issues",
            assigned: "Assigned",
            returned: "Return",
            returns: "Returns"
        },

        // Common actions
        actions: {
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
            edit: "Edit",
            view: "View",
            close: "Close",
            add: "Add",
            update: "Update",
            create: "Create",
            search: "Search",
            filter: "Filter",
            refresh: "Refresh",
            submit: "Submit",
            reset: "Reset",
            back: "Back",
            next: "Next",
            previous: "Previous",
            first: "First",
            last: "Last",
            tryAgain: "Try Again"
        },

        // Common labels
        common: {
            loading: "Loading...",
            error: "Error",
            success: "Success",
            warning: "Warning",
            info: "Information",
            noData: "No data",
            page: "Page",
            of: "of",
            showing: "Showing",
            total: "Total",
            date: "Date",
            type: "Type",
            employee: "Employee",
            asset: "Asset",
            verification: "Verification",
            verified: "Verified",
            notVerified: "Not Verified",
            show: "Show"
        },

        // Error messages
        errors: {
            loadingDashboard: "Error loading dashboard data",
            failedToFetch: "Failed to fetch",
            unexpectedError: "An unexpected error occurred.",
            requiredField: "This field is required",
            invalidEmail: "Please enter a valid email",
            passwordTooShort: "Password must be at least 8 characters long",
            passwordsDontMatch: "Passwords do not match",
            agreeToTerms: "You must agree to the terms and conditions"
        },

        // User interface
        ui: {
            profile: "Profile",
            logout: "Logout",
            user: "User",
            settings: "Settings",
            notifications: "Notifications"
        }
    }
};

// Arabic translations
const arTranslations = {
    translation: {
        // Navigation
        nav: {
            qurtubahSchools:"مدارس قرطباء",
            dashboard: "لوحة القيادة",
            home: "الرئيسية",
            assets: "الأصول",
            departments: "الأقسام",
            employees: "الموظفون",
            transactions: "المعاملات",
            reports: "التقارير",
            settings: "الإعدادات"
        },

        // Authentication
        auth: {
            signIn: "تسجيل الدخول",
            signUp: "إنشاء حساب",
            email: "البريد الإلكتروني",
            password: "كلمة المرور",
            confirmPassword: "تأكيد كلمة المرور",
            firstName: "الاسم الأول",
            lastName: "اسم العائلة",
            rememberMe: "تذكرني",
            forgotPassword: "نسيت كلمة المرور",
            createAccount: "إنشاء حساب",
            alreadyHaveAccount: "لديك حساب بالفعل؟",
            notRegistered: "غير مسجل؟",
            signingIn: "جاري تسجيل الدخول...",
            creatingAccount: "جاري إنشاء الحساب...",
            registerNow: "سجل الآن",
            agreeTerms: "أوافق على الشروط والأحكام",
            enterEmailPassword: "أدخل بريدك الإلكتروني وكلمة المرور لتسجيل الدخول.",
            enterDetailsCreate: "أدخل بياناتك لإنشاء حسابك.",
            joinUsToday: "انضم إلينا اليوم",
            registrationSuccessful: "تم التسجيل بنجاح! جاري التحويل إلى لوحة القيادة...",
            loginFailed: "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.",
            registrationFailed: "فشل التسجيل. يرجى المحاولة مرة أخرى."
        },

        // Dashboard
        dashboard: {
            title: "لوحة قيادة إدارة الأصول",
            lastUpdated: "آخر تحديث",
            refresh: "تحديث",
            refreshing: "جاري التحديث...",
            totalDepartments: "إجمالي الأقسام",
            totalAssets: "إجمالي الأصول",
            totalEmployees: "إجمالي الموظفين",
            recentTransactions: "المعاملات الأخيرة",
            assetStatusDistribution: "توزيع حالة الأصول",
            weeklyTransactions: "المعاملات الأسبوعية",
            assetsByDepartment: "الأصول حسب القسم",
            yearlyTrends: "اتجاهات المعاملات السنوية",
            currentDistribution: "التوزيع الحالي للأصول حسب الحالة",
            weeklyAssignsReturns: "تخصيص وإرجاع الأصول خلال الأسبوع الماضي",
            departmentDistribution: "توزيع الأصول عبر الأقسام",
            monthlyTrends: "تخصيص وإرجاع الأصول الشهري على مدار السنة",
            latestTransactions: "أحدث تخصيصات وإرجاع الأصول",
            noRecentTransactions: "لا توجد معاملات حديثة متاحة"
        },

        // Assets
        assets: {
            title: "إدارة الأصول",
            addAsset: "إضافة أصل",
            editAsset: "تعديل الأصل",
            assetDetails: "تفاصيل الأصل",
            createAsset: "إنشاء أصل",
            updateAsset: "تحديث الأصل",
            deleteAsset: "حذف الأصل",
            assetName: "اسم الأصل",
            serialNumber: "الرقم التسلسلي",
            department: "القسم",
            status: "الحالة",
            currentHolder: "الحائز الحالي",
            purchaseDate: "تاريخ الشراء",
            purchaseCost: "تكلفة الشراء",
            description: "الوصف",
            basicInformation: "المعلومات الأساسية",
            purchaseInformation: "معلومات الشراء",
            searchAssets: "البحث في الأصول...",
            filterByDepartment: "تصفية حسب القسم",
            filterByStatus: "تصفية حسب الحالة",
            allDepartments: "جميع الأقسام",
            allStatuses: "جميع الحالات",
            noAssetsFound: "لم يتم العثور على أصول.",
            selectEmployee: "اختر الموظف",
            confirmDelete: "تأكيد الحذف",
            deleteConfirmation: "هل أنت متأكد من رغبتك في حذف هذا الأصل؟ لا يمكن التراجع عن هذا الإجراء.",
            cannotDelete: "لا يمكن حذف هذا الأصل لأنه مخصص حالياً لموظف.",
            returnAssetFirst: "لحذف هذا الأصل، يرجى إرجاعه أولاً عن طريق إنشاء معاملة إرجاع.",
            assetDetailsLabel: "تفاصيل الأصل:",
            name: "الاسم",
            serial: "التسلسلي",
            assignedTo: "مخصص لـ",
            created: "تم الإنشاء",
            lastUpdated: "آخر تحديث",
            unassigned: "غير مخصص"
        },

        // Status options
        status: {
            available: "متاح",
            assigned: "مخصص",
            maintenance: "قيد الصيانة",
            retired: "خارج الخدمة"
        },

        // Transaction types
        transactions: {
            assign: "تخصيص",
            return: "إرجاع",
            issue: "إصدار",
            issues: "إصدارات",
            assigned: "مخصص",
            returned: "مُرجع",
            returns: "إرجاع"
        },

        // Common actions
        actions: {
            save: "حفظ",
            cancel: "إلغاء",
            delete: "حذف",
            edit: "تعديل",
            view: "عرض",
            close: "إغلاق",
            add: "إضافة",
            update: "تحديث",
            create: "إنشاء",
            search: "بحث",
            filter: "تصفية",
            refresh: "تحديث",
            submit: "إرسال",
            reset: "إعادة تعيين",
            back: "رجوع",
            next: "التالي",
            previous: "السابق",
            first: "الأول",
            last: "الأخير",
            tryAgain: "حاول مرة أخرى"
        },

        // Common labels
        common: {
            loading: "جاري التحميل...",
            error: "خطأ",
            success: "نجح",
            warning: "تحذير",
            info: "معلومات",
            noData: "لا توجد بيانات",
            page: "صفحة",
            of: "من",
            showing: "عرض",
            total: "المجموع",
            date: "التاريخ",
            type: "النوع",
            employee: "الموظف",
            asset: "الأصل",
            verification: "التحقق",
            verified: "تم التحقق",
            notVerified: "غير محقق",
            show: "عرض"
        },

        // Error messages
        errors: {
            loadingDashboard: "خطأ في تحميل بيانات لوحة القيادة",
            failedToFetch: "فشل في الجلب",
            unexpectedError: "حدث خطأ غير متوقع.",
            requiredField: "هذا الحقل مطلوب",
            invalidEmail: "يرجى إدخال بريد إلكتروني صحيح",
            passwordTooShort: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
            passwordsDontMatch: "كلمات المرور غير متطابقة",
            agreeToTerms: "يجب أن توافق على الشروط والأحكام"
        },

        // User interface
        ui: {
            profile: "الملف الشخصي",
            logout: "تسجيل الخروج",
            user: "المستخدم",
            settings: "الإعدادات",
            notifications: "الإشعارات"
        }
    }
};

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        debug: process.env.NODE_ENV === 'development',

        interpolation: {
            escapeValue: false,
        },

        detection: {
            order: ['localStorage', 'cookie', 'htmlTag', 'navigator'],
            caches: ['localStorage', 'cookie'],
        },

        resources: {
            en: enTranslations,
            ar: arTranslations,
        },
    });

export default i18n;