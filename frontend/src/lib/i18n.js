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
            qurtubahSchools: "Qurtubah Schools",
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

        //Departments
        departments: {
            title: "Departments Management",
            add: "Add Department",
            edit: "Edit Department",
            create: "Create Department",
            update: "Update Department",
            headerAdd: "Add New Department",
            headerEdit: "Edit Department",
            name: "Department Name",
            managerOptional: "Manager (Optional)",
            noManager: "No manager",
            noManagerAssigned: "No manager assigned",
            table: {
                name: "Department Name",
                manager: "Manager",
                employees: "Employees",
                assets: "Assets",
                created: "Created",
                actions: "Actions"
            },

            searchPlaceholder: "Search departments...",
            noneFound: "No departments found.",
            viewTitle: "Department Details - {{name}}",
            infoHeader: "Department Information",
            info: {
                name: "Name",
                manager: "Manager",
                activeEmployees: "Active Employees",
                totalAssets: "Total Assets",
                created: "Created",
                lastUpdated: "Last Updated"
            },
            deleteTitle: "Confirm Delete",
            deleteBody:
                "Are you sure you want to delete this department? This action cannot be undone and will fail if the department has employees or assets assigned."
        },

        //Employees
        employees: {
            title: "Employee Management",
            add: "Add Employee",
            edit: "Edit Employee",
            create: "Create Employee",
            update: "Update Employee",
            searchPlaceholder: "Search employees...",
            filterByDepartment: "Filter by Department",
            allDepartments: "All Departments",
            selectDepartment: "Select Department",
            table: {
                employee: "Employee",
                id: "ID",
                department: "Department",
                contact: "Contact",
                faceData: "Face Data",
                status: "Status",
                actions: "Actions"
            },
            registered: "REGISTERED",
            notRegistered: "NOT REGISTERED",
            active: "ACTIVE",
            inactive: "INACTIVE",
            quickView: "Quick View",
            editEmployee: "Edit Employee",
            deleteEmployee: "Delete Employee",
            viewProfile: "View Full Profile",
            close: "Close",
            confirmDeletePrompt: "Are you sure you want to delete {{name}}?",
            errors: {
                fetchList: "Failed to fetch employees",
                fetchDetails: "Failed to fetch employee details",
                saveFailed: "Failed to save employee",
                deleteFailed: "Failed to delete employee"
            },
            tabs: {
                basicInfo: "Basic Information",
                faceRegistration: "Face Registration",
                faceManagement: "Face Management"
            },
            face: {
                sectionHeader: "Face Recognition",
                manageHeader: "Face Recognition Management",
                statusLabel: "Status:",
                currentStatus: "Current Status:",
                register: "Register Face Data",
                update: "Update Face Data",
                note: "Face data is required for secure transactions",
                noteCreateFirst: "Note: Face registration can be done after creating the employee profile.",
                registeredChip: "FACE REGISTERED",
                noDataChip: "NO FACE DATA"
            },
            profile: {
                quickTitle: "Employee Profile - {{name}}",
                fullProfile: "Full Profile",
                basicInfo: "Basic Information",
                name: "Name",
                employeeId: "Employee ID",
                email: "Email",
                phone: "Phone",
                department: "Department",
                status: "Status",
                activityStats: "Activity Statistics",
                currentAssets: "Current Assets",
                totalTransactions: "Total Transactions",
                issues: "Issues",
                returns: "Returns",
                pageTitle: "Employee Profile",
                tabs: { overview: "Overview", assets: "Current Assets", history: "Transaction History" },
                employeeDetails: "Employee Details",
                processedBy: "Processed by",
                returnCondition: "Return Condition",
                damageNotes: "Damage Notes",
                notes: "Notes",
                returnAsset: "Return Asset",
                noCurrentAssets: "No Current Assets",
                noCurrentAssetsHelp: "This employee doesn't have any assets assigned currently.",
                loadMoreHistory: "Load More History",
                noHistory: "No Transaction History",
                noHistoryHelp: "This employee hasn't completed any transactions yet.",
                errors: {
                    notFound: "Employee not found",
                    fetchProfile: "Failed to fetch employee profile",
                    fetchAssets: "Failed to fetch current assets",
                    fetchHistory: "Failed to fetch transaction history",
                    faceFailed: "Face registration failed",
                    returnFailed: "Asset return failed"
                }
            }
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
        },

        //Transactions
        transactionsPage: {
            title: "Asset Transactions",
            newTransaction: "New Transaction",
            searchPlaceholder: "Search transactions...",
            filterByType: "Filter by Type",
            allTypes: "All Types",
            table: {
                type: "Type",
                asset: "Asset",
                employee: "Employee",
                date: "Date",
                processedBy: "Processed By",
                verification: "Verification",
                actions: "Actions"
            },
            createTitle: "Create New Transaction",
            typeLabel: "Transaction Type",
            issueAsset: "Assign Asset",
            returnAsset: "Return Asset",
            selectAsset: "Select Asset",
            selectEmployee: "Select Employee",
            availableOnly: "Available Only",
            assignedOnly: "Assigned Only",
            foundAvailable: "{{count}} available assets found",
            foundAssigned: "{{count}} assigned assets found",
            foundEmployees: "{{count}} active employees found",
            showingEmployeeForAsset: "Showing employee currently assigned to this asset",
            currentlyWith: "Currently with",
            notesOptional: "Notes (Optional)",
            returnCondition: "Return Condition",
            selectCondition: "Select Condition",
            face: {
                section: "Face Verification",
                required: "REQUIRED",
                verified: "VERIFIED",
                verify: "Verify Face",
                reverify: "Re-verify Face",
                faceDataAvailable: "Face data available ✓",
                noFaceData: "No face data ⚠️",
                requiredMsg: "Face verification is required before creating the transaction.",
                mustBeSuccessful: "Face verification is required and must be successful before creating a transaction.",
                missingData: "Face verification data is missing. Please verify face again.",
                employeeNeedsRegistration: "Employee does not have face recognition data registered. Please register face data first."
            },
            detailsTitle: "Transaction Details",
            infoCard: "Transaction Information",
            assetEmployeeCard: "Asset & Employee Details",
            additionalInfo: "Additional Information",
            confidence: "Confidence",
            system: "System",
            viewClose: "Close",
            createBtn: "Create Transaction",
            verificationRequiredBtn: "Verification Required",
            errors: {
                fetchTransactions: "Failed to fetch transactions",
                fetchDetails: "Failed to fetch transaction details",
                selectEmployeeFirst: "Please select an employee first",
                faceFailed: "Face verification failed",
                createFailed: "Failed to create transaction"
            }
        },
        conditions: {
            excellent: "Excellent",
            good: "Good",
            fair: "Fair",
            poor: "Poor",
            damaged: "Damaged"
        },

        //Face Recognition
        faceComponent: {
            titleRegister: "Face Registration",
            titleVerify: "Face Verification",
            startingCamera: "Starting camera...",
            cameraNotReady: "Camera not ready",
            positionFace: "Position your face within the circle and click capture",
            imageQualityIssues: "Image Quality Issues:",
            recommendations: "Recommendations:",
            registrationSuccessful: "Registration Successful!",
            verificationSuccessful: "Verification Successful!",
            registrationFailed: "Registration Failed",
            verificationFailed: "Verification Failed",
            confidenceScore: "Confidence Score",
            imageQualityScore: "Image Quality Score",
            processingRegistration: "Processing registration...",
            processingVerification: "Processing verification...",
            capturePhoto: "Capture Photo",
            retake: "Retake",
            continue: "Continue",
            issues: "Issues:",
            threshold: "Threshold",
            errors: {
                displayFeedFailed: "Failed to display camera feed",
                accessCameraFailed: "Failed to access camera",
                cameraNotReady: "Camera not ready",
                captureFailed: "Failed to capture image"
            }
        }
    }
};

// Arabic translations
const arTranslations = {
    translation: {
        // Navigation
        nav: {
            qurtubahSchools: "مدارس قرطباء",
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

        //Departments
        departments: {
            title: "إدارة الأقسام",
            add: "إضافة قسم",
            edit: "تعديل القسم",
            create: "إنشاء قسم",
            update: "تحديث القسم",
            headerAdd: "إضافة قسم جديد",
            headerEdit: "تعديل القسم",
            name: "اسم القسم",
            managerOptional: "المدير (اختياري)",
            noManager: "بدون مدير",
            noManagerAssigned: "لا يوجد مدير محدد",
            table: {
                name: "اسم القسم",
                manager: "المدير",
                employees: "الموظفون",
                assets: "الأصول",
                created: "تاريخ الإنشاء",
                actions: "الإجراءات"
            },
            searchPlaceholder: "البحث في الأقسام...",
            noneFound: "لم يتم العثور على أقسام.",
            viewTitle: "تفاصيل القسم - {{name}}",
            infoHeader: "معلومات القسم",
            info: {
                name: "الاسم",
                manager: "المدير",
                activeEmployees: "الموظفون النشطون",
                totalAssets: "إجمالي الأصول",
                created: "تاريخ الإنشاء",
                lastUpdated: "آخر تحديث"
            },
            deleteTitle: "تأكيد الحذف",
            deleteBody:
                "هل أنت متأكد أنك تريد حذف هذا القسم؟ لا يمكن التراجع عن هذا الإجراء، وسيفشل إذا كان للقسم موظفون أو أصول مخصصة."
        },

        //Employees
        employees: {
            title: "إدارة الموظفين",
            add: "إضافة موظف",
            edit: "تعديل الموظف",
            create: "إنشاء موظف",
            update: "تحديث الموظف",
            searchPlaceholder: "البحث في الموظفين...",
            filterByDepartment: "تصفية حسب القسم",
            allDepartments: "جميع الأقسام",
            selectDepartment: "اختر القسم",
            table: {
                employee: "الموظف",
                id: "المعرف",
                department: "القسم",
                contact: "التواصل",
                faceData: "بيانات الوجه",
                status: "الحالة",
                actions: "الإجراءات"
            },
            registered: "مسجل",
            notRegistered: "غير مسجل",
            active: "نشط",
            inactive: "غير نشط",
            quickView: "عرض سريع",
            editEmployee: "تعديل الموظف",
            deleteEmployee: "حذف الموظف",
            viewProfile: "عرض الملف الكامل",
            close: "إغلاق",
            confirmDeletePrompt: "هل أنت متأكد من حذف {{name}}؟",
            errors: {
                fetchList: "فشل في جلب الموظفين",
                fetchDetails: "فشل في جلب تفاصيل الموظف",
                saveFailed: "فشل في حفظ بيانات الموظف",
                deleteFailed: "فشل في حذف الموظف"
            },
            tabs: {
                basicInfo: "المعلومات الأساسية",
                faceRegistration: "تسجيل الوجه",
                faceManagement: "إدارة بيانات الوجه"
            },
            face: {
                sectionHeader: "التعرف على الوجه",
                manageHeader: "إدارة التعرف على الوجه",
                statusLabel: "الحالة:",
                currentStatus: "الحالة الحالية:",
                register: "تسجيل بيانات الوجه",
                update: "تحديث بيانات الوجه",
                note: "بيانات الوجه مطلوبة للعمليات الآمنة",
                noteCreateFirst: "ملاحظة: يمكن تسجيل الوجه بعد إنشاء ملف الموظف.",
                registeredChip: "تم تسجيل الوجه",
                noDataChip: "لا توجد بيانات وجه"
            },
            profile: {
                quickTitle: "ملف الموظف - {{name}}",
                fullProfile: "الملف الكامل",
                basicInfo: "المعلومات الأساسية",
                name: "الاسم",
                employeeId: "معرف الموظف",
                email: "البريد الإلكتروني",
                phone: "الهاتف",
                department: "القسم",
                status: "الحالة",
                activityStats: "إحصائيات النشاط",
                currentAssets: "الأصول الحالية",
                totalTransactions: "إجمالي المعاملات",
                issues: "إصدارات",
                returns: "إرجاعات",
                pageTitle: "ملف الموظف",
                tabs: { overview: "نظرة عامة", assets: "الأصول الحالية", history: "سجل المعاملات" },
                employeeDetails: "تفاصيل الموظف",
                processedBy: "تمت المعالجة بواسطة",
                returnCondition: "حالة الإرجاع",
                damageNotes: "ملاحظات التلف",
                notes: "ملاحظات",
                returnAsset: "إرجاع الأصل",
                noCurrentAssets: "لا توجد أصول حالية",
                noCurrentAssetsHelp: "لا توجد أصول مخصصة لهذا الموظف حالياً.",
                loadMoreHistory: "تحميل المزيد من السجل",
                noHistory: "لا يوجد سجل معاملات",
                noHistoryHelp: "لم يُنجز هذا الموظف أي معاملات حتى الآن.",
                errors: {
                    notFound: "الموظف غير موجود",
                    fetchProfile: "فشل في جلب ملف الموظف",
                    fetchAssets: "فشل في جلب الأصول الحالية",
                    fetchHistory: "فشل في جلب سجل المعاملات",
                    faceFailed: "فشل تسجيل الوجه",
                    returnFailed: "فشل إرجاع الأصل"
                }
            }
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
        },

        //Transactions
        transactionsPage: {
            title: "معاملات الأصول",
            newTransaction: "معاملة جديدة",
            searchPlaceholder: "ابحث في المعاملات...",
            filterByType: "تصفية حسب النوع",
            allTypes: "كل الأنواع",
            table: {
                type: "النوع",
                asset: "الأصل",
                employee: "الموظف",
                date: "التاريخ",
                processedBy: "تمت المعالجة بواسطة",
                verification: "التحقق",
                actions: "إجراءات"
            },
            createTitle: "إنشاء معاملة جديدة",
            typeLabel: "نوع المعاملة",
            issueAsset: "تخصيص أصل",
            returnAsset: "إرجاع أصل",
            selectAsset: "اختر الأصل",
            selectEmployee: "اختر الموظف",
            availableOnly: "المتاح فقط",
            assignedOnly: "المخصص فقط",
            foundAvailable: "تم العثور على {{count}} من الأصول المتاحة",
            foundAssigned: "تم العثور على {{count}} من الأصول المخصصة",
            foundEmployees: "تم العثور على {{count}} موظف نشط",
            showingEmployeeForAsset: "عرض الموظف المخصص لهذا الأصل حالياً",
            currentlyWith: "لدى",
            notesOptional: "ملاحظات (اختياري)",
            returnCondition: "حالة الإرجاع",
            selectCondition: "اختر الحالة",
            face: {
                section: "التحقق بالوجه",
                required: "مطلوب",
                verified: "تم التحقق",
                verify: "تحقق بالوجه",
                reverify: "إعادة التحقق بالوجه",
                faceDataAvailable: "بيانات الوجه متوفرة ✓",
                noFaceData: "لا توجد بيانات وجه ⚠️",
                requiredMsg: "التحقق بالوجه مطلوب قبل إنشاء المعاملة.",
                mustBeSuccessful: "يجب أن يكون التحقق بالوجه ناجحاً قبل إنشاء المعاملة.",
                missingData: "بيانات التحقق بالوجه مفقودة. يرجى إعادة التحقق.",
                employeeNeedsRegistration: "لا توجد بيانات تعرف وجه للموظف. يرجى تسجيل بيانات الوجه أولاً."
            },
            detailsTitle: "تفاصيل المعاملة",
            infoCard: "معلومات المعاملة",
            assetEmployeeCard: "تفاصيل الأصل والموظف",
            additionalInfo: "معلومات إضافية",
            confidence: "نسبة الثقة",
            system: "النظام",
            viewClose: "إغلاق",
            createBtn: "إنشاء المعاملة",
            verificationRequiredBtn: "التحقق مطلوب",
            errors: {
                fetchTransactions: "فشل في جلب المعاملات",
                fetchDetails: "فشل في جلب تفاصيل المعاملة",
                selectEmployeeFirst: "يرجى اختيار موظف أولاً",
                faceFailed: "فشل التحقق بالوجه",
                createFailed: "فشل إنشاء المعاملة"
            }
        },

        conditions: {
            excellent: "ممتاز",
            good: "جيد",
            fair: "متوسط",
            poor: "ضعيف",
            damaged: "متضرر"
        },

        //Face Recognition
        faceComponent: {
            titleRegister: "تسجيل الوجه",
            titleVerify: "التحقق بالوجه",
            startingCamera: "جاري تشغيل الكاميرا...",
            cameraNotReady: "الكاميرا غير جاهزة",
            positionFace: "ضع وجهك داخل الدائرة ثم اضغط التقاط",
            imageQualityIssues: "مشاكل جودة الصورة:",
            recommendations: "التوصيات:",
            registrationSuccessful: "تم التسجيل بنجاح!",
            verificationSuccessful: "تم التحقق بنجاح!",
            registrationFailed: "فشل التسجيل",
            verificationFailed: "فشل التحقق",
            confidenceScore: "درجة الثقة",
            imageQualityScore: "درجة جودة الصورة",
            processingRegistration: "جاري معالجة التسجيل...",
            processingVerification: "جاري معالجة التحقق...",
            capturePhoto: "التقاط صورة",
            retake: "إعادة الالتقاط",
            continue: "متابعة",
            issues: "المشكلات:",
            threshold: "الحد الأدنى",
            errors: {
                displayFeedFailed: "فشل عرض بث الكاميرا",
                accessCameraFailed: "فشل الوصول إلى الكاميرا",
                cameraNotReady: "الكاميرا غير جاهزة",
                captureFailed: "فشل التقاط الصورة"
            }
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