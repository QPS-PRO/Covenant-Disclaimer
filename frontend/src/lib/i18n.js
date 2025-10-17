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
            settings: "Settings",
            myProfile: "Profile",
            myDisclaimer: "My Disclaimer",
            disclaimerRequests: "Disclaimer Requests",
            disclaimerSetup: "Disclaimer Setup",
            adminDisclaimerConfig: "Disclaimer Departments",
            disclaimerHistory: "Disclaimer Request History",
            reportPermissions: "Report Permissions",


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
            totalTransactions: "Total Transactions",
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
        },

        // Admin Disclaimer Config
        adminDisclaimerConfig: {
            title: "Disclaimer Department Configuration",
            subtitle: "Configure which departments require disclaimer clearance",
            info: "Enable disclaimer requirements for departments. Department managers will then configure the order in which employees must clear these departments.",
            none: "No departments found. Please create departments first.",
            requiresChip: "Requires Disclaimer",
            requiresYes: "This department requires disclaimer clearance",
            requiresNo: "This department does not require disclaimer clearance",
            updating: "Updating...",
            notesTitle: "⚠️ Important Notes:",
            notes: {
                a: "Enabling disclaimer for a department allows it to be added to disclaimer flows",
                b: "Department managers will configure the order of clearance for their employees",
                c: "Disabling a department will remove it from all existing disclaimer flows"
            },
            errors: {
                loadFailed: "Failed to load configuration",
                updateFailed: "Failed to update configuration"
            },
            success: {
                updated: "Configuration updated successfully!"
            }
        },

        // Admin Disclaimer Setup
        adminDisclaimerSetup: {
            header: "Admin Disclaimer Setup Management",
            departments: "Departments",
            chipRequires: "Requires Disclaimer",
            chipNone: "No Disclaimer",
            stepsCount_one: "{{count}} step configured",
            stepsCount_other: "{{count}} steps configured",
            flowFor: "Disclaimer Flow for {{name}}",
            addDepartment: "Add Department",
            emptyTitle: "No disclaimer flow configured",
            emptyHelp: "Add departments to create the disclaimer flow",
            stepBadge: "Step {{order}} in disclaimer process",
            selectPrompt: "Select a department to configure its disclaimer flow",
            confirmRemove: "Are you sure you want to remove this department from the flow?",
            dialog: {
                title: "Add Department to Disclaimer Flow",
                help: "Select a department to add to the disclaimer flow for {{name}}",
                selectLabel: "Select Department",
                cancel: "Cancel",
                add: "Add Department",
                adding: "Adding..."
            },
            errors: {
                loadDepartments: "Failed to load departments",
                loadDepartment: "Failed to load department configuration",
                addFailed: "Failed to add department",
                deleteFailed: "Failed to remove department",
                reorderFailed: "Failed to update order"
            },
            success: {
                added: "Department added to disclaimer flow successfully",
                removed: "Department removed from disclaimer flow",
                reordered: "Order updated successfully"
            }
        },

        // Employee Disclaimer Histpry
        employeeDisclaimerHistory: {
            header: "My Disclaimer Request History",
            none: "No disclaimer requests found",
            step: "Step {{num}}",
            createdAt: "{{date}}",
            myNotes: "My Notes:",
            managerResponse: "Manager Response:",
            rejectionReason: "Rejection Reason:",
            reviewedAt: "Reviewed: {{date}}",
            subtitle: "View all your disclaimer processes and their progress",
            noneHint: "You haven't started any disclaimer processes yet",
            processLabel: "Process #{{num}}",
            startedOn: "Started {{date}}",
            days: "days",
            stepsSummary: "{{done}} / {{total}} Steps",
            progressPercent: "{{percent}}% Complete",
            errors: { loadFailed: "Failed to load history" }
        },

        // Employee Disclaimer
        employeeDisclaimer: {
            title: "Disclaimer Request Process",
            subtitle: "Complete all department clearances to finalize your disclaimer",
            start: {
                noActive: "You don't have an active disclaimer process.",
                cta: "Start Disclaimer Process",
                starting: "Starting..."
            },
            noFlow: "No disclaimer flow configured for your department. Please contact your department manager.",
            progress: "Progress: Step {{current}} of {{total}}",
            stepTitle: "Step {{num}}: {{name}}",
            submitRequest: "Submit Request",
            resubmitRequest: "Resubmit Request",
            yourNotes: "Your Notes:",
            lockedMsg: "🔒 Complete previous steps to unlock this department",
            waitingReview: "⏳ Waiting for department manager review...",
            completedTitle: "✅ Disclaimer Process Completed!",
            completedBody: "All departments have approved your disclaimer request.",
            dialog: {
                title: "Submit Request to {{name}}",
                body: "You are submitting a disclaimer clearance request to the {{name}} department.",
                notesLabel: "Notes (Optional)",
                notesPlaceholder: "Add any notes or comments for the department manager...",
                cancel: "Cancel",
                submit: "Submit Request",
                submitting: "Submitting..."
            },
            alerts: {
                loadFailed: "Failed to load disclaimer status",
                startSuccess: "Disclaimer process started successfully!",
                startFailed: "Failed to start disclaimer process",
                submitSuccess: "Request submitted to {{name}}",
                submitFailed: "Failed to submit request"
            }
        },

        //Manager Disclaimer Config
        managerDisclaimerConfig: {
            title: "Disclaimer Flow Configuration",
            subtitle: "Configure the order of departments for disclaimer clearance",
            managing: "Managing: {{name}}",
            addDept: "Add Department",
            empty: {
                title: "No departments configured yet",
                body: "Add departments to create the disclaimer flow for your employees"
            },
            stepBadge: "Step {{order}} in the disclaimer flow",
            allAdded: "All available disclaimer departments have been added to the flow.",
            dialog: {
                title: "Add Department to Disclaimer Flow",
                help: "Select a department to add to the disclaimer flow:",
                selectLabel: "Select Department",
                noneLeft: "No more departments available to add. All configured departments are already in the flow.",
                cancel: "Cancel",
                add: "Add Department",
                adding: "Adding..."
            },
            errors: {
                loadFailed: "Failed to load disclaimer configuration",
                addFailed: "Failed to add department",
                removeFailed: "Failed to remove department",
                reorderFailed: "Failed to update order"
            },
            success: {
                added: "Department added successfully!",
                removed: "Department removed successfully!",
                reordered: "Order updated successfully!"
            },
            confirmRemove: "Are you sure you want to remove this department from the disclaimer flow?"
        },

        //Manager Disclaimer History
        managerDisclaimerHistory: {
            stats: {
                total: "Total Requests",
                pending: "Pending",
                approved: "Approved",
                rejected: "Rejected"
            },
            header: "Disclaimer Request History",
            tabs: {
                all: "All ({{count}})",
                pending: "Pending ({{count}})",
                approved: "Approved ({{count}})",
                rejected: "Rejected ({{count}})"
            },
            none: "No {{which}}requests found",
            stepIn: "Step {{num}} • {{dept}}",
            createdAt: "{{date}}",
            employeeNotes: "Employee Notes:",
            yourResponse: "Your Response:",
            rejectionReason: "Rejection Reason:",
            reviewed: "Reviewed: {{date}}",
            errors: { loadFailed: "Failed to load data" }
        },

        // Manager pending Requests
        managerPendingRequests: {
            title: "Pending Disclaimer Requests",
            subtitle: "Review and approve or reject disclaimer clearance requests",
            empty: {
                title: "No pending requests",
                body: "All disclaimer requests have been reviewed"
            },
            review: "Review",
            chips: { step: "Step {{num}}" },
            fields: {
                employeeId: "Employee ID: {{id}}",
                department: "Department: {{dept}}",
                submitted: "Submitted: {{date}}",
                reviewedBy: "Reviewed By"
            },
            dialog: {
                title: "Review Disclaimer Request",
                decision: "Decision *",
                approve: "Approve",
                reject: "Reject",
                notesLabel: "Manager Notes (Optional)",
                notesPlaceholder: "Add any comments or feedback...",
                reasonLabel: "Rejection Reason *",
                reasonPlaceholder: "Please provide a clear reason for rejection...",
                cancel: "Cancel",
                submitting: "Submitting...",
                submitApprove: "Approve",
                submitReject: "Reject"
            },
            toasts: {
                needReason: "Rejection reason is required when rejecting a request",
                successApprove: "Request approved successfully!",
                successReject: "Request rejected successfully!",
                submitFailed: "Failed to submit review",
                loadFailed: "Failed to load pending requests"
            }
        },

        //Reports Dashboard
        reportsDashboard: {
            headerTitle: "Reports Center",
            headerSubtitle: "Generate comprehensive reports in PDF or Excel format",
            loading: "Loading reports...",
            configureDownload: "Configure & Download",
            selectDateRange: "Select Date Range",
            startDate: "Start Date",
            endDate: "End Date",
            downloadPDF: "Download PDF",
            downloadExcel: "Download Excel",
            generatingPDF: "Generating PDF...",
            generatingExcel: "Generating Excel...",
            generating: "Generating...",
            optionalFilters: "Optional Filters:",
            availableFormats: "Available formats:",
            noReportsTitle: "No Reports Available",
            noReportsBody: "Reports are currently being configured. Please check back later.",
            aboutTitle: "About Reports",
            aboutBody:
                "All reports are generated in real-time with the latest data. PDF reports are optimized for printing, while Excel reports allow for further analysis and filtering.",
            reports: {
                'transaction-history': {
                    name: 'Asset Transaction History',
                    description: 'Complete history of all asset transactions with face verification details'
                },
                'disclaimer-completion': {
                    name: 'Disclaimer Completion Report',
                    description: "Shows which employees have completed disclaimer process vs those who haven't"
                },
                'employee-assets': {
                    name: 'Employee Assets Report',
                    description: 'Shows employees with current assigned assets vs those without any assets'
                },
                'assets-by-status': {
                    name: 'Assets by Status Report',
                    description: 'Categorizes all assets by their status (available, assigned, maintenance, retired)'
                },
                'department-summary': {
                    name: 'Department Summary Report',
                    description: 'Comprehensive overview of each department including employees, assets, and disclaimer completion'
                }
            },
            params: {
                startDateOptional: 'start_date (optional)',
                endDateOptional: 'end_date (optional)'
            }
        },

        reportsListSimple: {
            loading: "Loading...",
            headerTitle: "Reports",
            headerSubtitle: "Generate and download reports in PDF or Excel format",
            table: {
                report: "Report",
                description: "Description",
                formats: "Formats",
                actions: "Actions"
            },
            hasOptionalFilters: "Has optional filters",
            dateRangeOptional: "Date Range (Optional):",
            startDate: "Start Date",
            endDate: "End Date",
            to: "to",
            clear: "Clear",
            downloadPdfTitle: "Download PDF",
            downloadExcelTitle: "Download Excel",
            pdf: "PDF",
            excel: "Excel",
            emptyTitle: "No reports available",
            emptyBody: "Check back later for available reports",
            // Toasts / errors / success
            toast: {
                loadFailed: "Failed to load reports",
                startBeforeEnd: "Start date must be before end date",
                unknownType: "Unknown report type",
                downloadFailed: "Failed to download report",
                emptyFile: "Received empty file from server",
                downloaded: "{{name}} downloaded successfully"
            }
        },

        reportsPermissions: {
            header: {
                title: 'Report Access Permissions',
                subtitle: 'Manage which employees can access and download reports',
            },
            actions: {
                grantAccess: 'Grant Access',
                edit: 'Edit',
                delete: 'Delete',
                cancel: 'Cancel',
                update: 'Update',
                grant: 'Grant Access',
            },
            table: {
                employee: 'Employee',
                employeeId: 'Employee ID',
                department: 'Department',
                status: 'Status',
                grantedBy: 'Granted By',
                actions: 'Actions',
            },
            status: {
                active: 'Active',
                revoked: 'Revoked',
            },
            empty: {
                title: 'No Report Permissions Granted',
                subtitle: 'Click "Grant Access" to allow employees to view reports',
            },
            dialog: {
                createTitle: 'Grant Report Access',
                editTitle: 'Edit Report Permission',
            },
            form: {
                employee: 'Employee',
                selectEmployee: 'Select an employee...',
                accessStatus: 'Access Status',
                status: {
                    active: 'Active - Can Access Reports',
                    revoked: 'Revoked - Cannot Access Reports',
                },
                notesOptional: 'Notes (Optional)',
                notesPlaceholder: 'Add any notes about this permission...',
            },
            messages: {
                createSuccess: 'Permission granted successfully',
                updateSuccess: 'Permission updated successfully',
                deleteSuccess: 'Permission revoked successfully',
            },
            confirm: {
                revoke: 'Are you sure you want to revoke this report access permission?',
            },
            errors: {
                load: 'Failed to load data',
                save: 'Failed to save permission',
                delete: 'Failed to revoke permission',
            },
            common: {
                na: 'N/A',
            },
        }


    }
};

// Arabic translations
const arTranslations = {
    translation: {
        // Navigation
        nav: {
            qurtubahSchools: "مدارس قرطبة",
            dashboard: "لوحة القيادة",
            home: "الرئيسية",
            assets: "الأصول",
            departments: "الأقسام",
            employees: "الموظفون",
            transactions: "المعاملات",
            reports: "التقارير",
            settings: "الإعدادات",
            myProfile: "الملف الشخصي",
            myDisclaimer: " إخلاء الطرف",
            disclaimerRequests: "طلبات إخلاء الطرف",
            disclaimerSetup: "إدارة مسارات إخلاء الطرف ",
            adminDisclaimerConfig: "إعداد أقسام إخلاء الطرف",
            disclaimerHistory: "سجل طلبات إخلاء الطرف ",
            reportPermissions: "صلاحيات التقارير",

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
            totalTransactions: "إجمالي المعاملات",
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
        },

        // Admin Disclaimer Config
        adminDisclaimerConfig: {
            title: "إعداد أقسام إخلاء الطرف",
            subtitle: "قم بتحديد الأقسام التي تتطلب إخلاء طرف",
            info: "تفعيل متطلبات إخلاء الطرف للقسم. سيقوم مديرو الأقسام بعد ذلك بتحديد ترتيب الأقسام التي يجب على الموظفين إخلاؤها.",
            none: "لا توجد أقسام. يرجى إنشاء الأقسام أولاً.",
            requiresChip: "يتطلب إخلاء طرف",
            requiresYes: "هذا القسم يتطلب إخلاء طرف",
            requiresNo: "هذا القسم لا يتطلب إخلاء طرف",
            updating: "جاري التحديث...",
            notesTitle: "⚠️ ملاحظات مهمة:",
            notes: {
                a: "تفعيل الإخلاء لقسم يسمح بإضافته إلى مسارات إخلاء الطرف",
                b: "سيقوم مديرو الأقسام بتحديد ترتيب الإخلاء لموظفيهم",
                c: "إيقاف القسم سيزيله من جميع مسارات الإخلاء الحالية"
            },
            errors: {
                loadFailed: "فشل في تحميل الإعدادات",
                updateFailed: "فشل في تحديث الإعداد"
            },
            success: {
                updated: "تم تحديث الإعدادات بنجاح!"
            }
        },

        // Admin Disclaimer Setup
        adminDisclaimerSetup: {
            header: "إدارة إعداد مسارات إخلاء الطرف",
            departments: "الأقسام",
            chipRequires: "يتطلب إخلاء طرف",
            chipNone: "لا يتطلب إخلاء طرف",
            stepsCount_one: "{{count}} خطوة مُعدّة",
            stepsCount_other: "{{count}} خطوات مُعدّة",
            flowFor: "مسار الإخلاء لقسم {{name}}",
            addDepartment: "إضافة قسم",
            emptyTitle: "لا يوجد مسار إخلاء مُعد",
            emptyHelp: "أضف أقسامًا لإنشاء مسار الإخلاء",
            stepBadge: "الخطوة {{order}} في عملية الإخلاء",
            selectPrompt: "اختر قسمًا لضبط مسار الإخلاء الخاص به",
            confirmRemove: "هل أنت متأكد أنك تريد إزالة هذا القسم من المسار؟",
            dialog: {
                title: "إضافة قسم إلى مسار إخلاء الطرف",
                help: "اختر قسمًا لإضافته إلى مسار الإخلاء لقسم {{name}}",
                selectLabel: "اختر القسم",
                cancel: "إلغاء",
                add: "إضافة قسم",
                adding: "جاري الإضافة..."
            },
            errors: {
                loadDepartments: "فشل في تحميل الأقسام",
                loadDepartment: "فشل في تحميل إعدادات القسم",
                addFailed: "فشل في إضافة القسم",
                deleteFailed: "فشل في إزالة القسم",
                reorderFailed: "فشل في تحديث الترتيب"
            },
            success: {
                added: "تمت إضافة القسم إلى مسار الإخلاء بنجاح",
                removed: "تمت إزالة القسم من مسار الإخلاء",
                reordered: "تم تحديث الترتيب بنجاح"
            }
        },

        // Employee Disclaimer Histpry
        employeeDisclaimerHistory: {
            header: "سجل طلبات إخلاء الطرف الخاص بي",
            none: "لا توجد طلبات إخلاء طرف",
            step: "الخطوة {{num}}",
            createdAt: "{{date}}",
            myNotes: "ملاحظاتي:",
            managerResponse: "رد المدير:",
            rejectionReason: "سبب الرفض:",
            reviewedAt: "تمت المراجعة: {{date}}",
            subtitle: "اعرض جميع عمليات إخلاء الطرف الخاصة بك وتقدمها",
            noneHint: "لم تبدأ أي عملية إخلاء طرف بعد",
            processLabel: "عملية رقم {{num}}",
            startedOn: "بدأت في {{date}}",
            days: "يومًا",
            stepsSummary: "{{done}} / {{total}} خطوة",
            progressPercent: "{{percent}}٪ مكتمل",
            errors: { loadFailed: "فشل في تحميل السجل" }
        },

        // Employee Disclaimer
        employeeDisclaimer: {
            title: "عملية طلب إخلاء الطرف",
            subtitle: "أكمل إخلاء الطرف من جميع الأقسام لإنهاء الإجراء",
            start: {
                noActive: "لا يوجد لديك إجراء إخلاء طرف نشط.",
                cta: "بدء عملية إخلاء الطرف",
                starting: "جاري البدء..."
            },
            noFlow: "لا يوجد مسار إخلاء طرف مُعد لقسمك. يرجى التواصل مع مدير القسم.",
            progress: "التقدم: الخطوة {{current}} من {{total}}",
            stepTitle: "الخطوة {{num}}: {{name}}",
            submitRequest: "تقديم طلب",
            resubmitRequest: "إعادة تقديم الطلب",
            yourNotes: "ملاحظاتك:",
            lockedMsg: "🔒 أكمل الخطوات السابقة لفتح هذا القسم",
            waitingReview: "⏳ في انتظار مراجعة مدير القسم...",
            completedTitle: "✅ تم اكتمال عملية إخلاء الطرف!",
            completedBody: "جميع الأقسام وافقت على طلب إخلاء الطرف الخاص بك.",
            dialog: {
                title: "تقديم طلب إلى {{name}}",
                body: "أنت تقوم بتقديم طلب إخلاء طرف إلى قسم {{name}}.",
                notesLabel: "ملاحظات (اختياري)",
                notesPlaceholder: "أضف أي ملاحظات أو تعليقات لمدير القسم...",
                cancel: "إلغاء",
                submit: "تقديم الطلب",
                submitting: "جاري الإرسال..."
            },
            alerts: {
                loadFailed: "فشل في تحميل حالة إخلاء الطرف",
                startSuccess: "تم بدء عملية إخلاء الطرف بنجاح!",
                startFailed: "فشل في بدء عملية إخلاء الطرف",
                submitSuccess: "تم إرسال الطلب إلى {{name}}",
                submitFailed: "فشل في إرسال الطلب"
            }
        },

        //Manager Disclaimer Config
        managerDisclaimerConfig: {
            title: "إعداد مسار إخلاء الطرف",
            subtitle: "اضبط ترتيب الأقسام لإخلاء الطرف",
            managing: "القسم المُدار: {{name}}",
            addDept: "إضافة قسم",
            empty: {
                title: "لا توجد أقسام مُعدة بعد",
                body: "أضف أقسامًا لإنشاء مسار إخلاء الطرف للموظفين"
            },
            stepBadge: "الخطوة {{order}} في مسار الإخلاء",
            allAdded: "تمت إضافة جميع أقسام الإخلاء المتاحة إلى المسار.",
            dialog: {
                title: "إضافة قسم إلى مسار إخلاء الطرف",
                help: "اختر قسمًا لإضافته إلى مسار إخلاء الطرف:",
                selectLabel: "اختر القسم",
                noneLeft: "لا توجد أقسام أخرى لإضافتها. جميع الأقسام مضافة بالفعل.",
                cancel: "إلغاء",
                add: "إضافة قسم",
                adding: "جاري الإضافة..."
            },
            errors: {
                loadFailed: "فشل في تحميل إعدادات إخلاء الطرف",
                addFailed: "فشل في إضافة القسم",
                removeFailed: "فشل في إزالة القسم",
                reorderFailed: "فشل في تحديث الترتيب"
            },
            success: {
                added: "تمت إضافة القسم بنجاح!",
                removed: "تمت إزالة القسم بنجاح!",
                reordered: "تم تحديث الترتيب بنجاح!"
            },
            confirmRemove: "هل أنت متأكد من إزالة هذا القسم من المسار؟"
        },

        //Manager Disclaimer History
        managerDisclaimerHistory: {
            stats: {
                total: "إجمالي الطلبات",
                pending: "قيد الانتظار",
                approved: "مقبول",
                rejected: "مرفوض"
            },
            header: "سجل طلبات إخلاء الطرف",
            tabs: {
                all: "الكل ({{count}})",
                pending: "قيد الانتظار ({{count}})",
                approved: "مقبول ({{count}})",
                rejected: "مرفوض ({{count}})"
            },
            none: "لا توجد {{which}}طلبات",
            stepIn: "الخطوة {{num}} • {{dept}}",
            createdAt: "{{date}}",
            employeeNotes: "ملاحظات الموظف:",
            yourResponse: "ردك:",
            rejectionReason: "سبب الرفض:",
            reviewed: "تمت المراجعة: {{date}}",
            errors: { loadFailed: "فشل في تحميل البيانات" }
        },

        // Manager pending Requests
        managerPendingRequests: {
            title: "طلبات إخلاء الطرف قيد الانتظار",
            subtitle: "قم بمراجعة الطلبات بالموافقة أو الرفض",
            empty: {
                title: "لا توجد طلبات قيد الانتظار",
                body: "تمت مراجعة جميع طلبات إخلاء الطرف"
            },
            review: "مراجعة",
            chips: { step: "الخطوة {{num}}" },
            fields: {
                employeeId: "رقم الموظف: {{id}}",
                department: "القسم: {{dept}}",
                submitted: "التقديم: {{date}}",
                reviewedBy: "تم مراجعة بواسطة"
            },
            dialog: {
                title: "مراجعة طلب إخلاء الطرف",
                decision: "القرار *",
                approve: "قبول",
                reject: "رفض",
                notesLabel: "ملاحظات المدير (اختياري)",
                notesPlaceholder: "أضف أي تعليقات أو ملاحظات...",
                reasonLabel: "سبب الرفض *",
                reasonPlaceholder: "يرجى توضيح سبب الرفض...",
                cancel: "إلغاء",
                submitting: "جاري الإرسال...",
                submitApprove: "قبول",
                submitReject: "رفض"
            },
            toasts: {
                needReason: "سبب الرفض مطلوب عند رفض الطلب",
                successApprove: "تم قبول الطلب بنجاح!",
                successReject: "تم رفض الطلب بنجاح!",
                submitFailed: "فشل في إرسال المراجعة",
                loadFailed: "فشل في تحميل الطلبات قيد الانتظار"
            }
        },

        // Reports Dashboard
        reportsDashboard: {
            headerTitle: "مركز التقارير",
            headerSubtitle: "قم بإنشاء تقارير شاملة بصيغة PDF أو Excel",
            loading: "جاري تحميل التقارير...",
            configureDownload: "تهيئة وتحميل",
            selectDateRange: "حدد نطاق التاريخ",
            startDate: "تاريخ البدء",
            endDate: "تاريخ الانتهاء",
            downloadPDF: "تحميل PDF",
            downloadExcel: "تحميل Excel",
            generatingPDF: "جاري إنشاء PDF...",
            generatingExcel: "جاري إنشاء Excel...",
            generating: "جاري الإنشاء...",
            optionalFilters: "مرشحات اختيارية:",
            availableFormats: "الصيغ المتاحة:",
            noReportsTitle: "لا توجد تقارير",
            noReportsBody: "يتم حالياً إعداد التقارير. يرجى المحاولة لاحقاً.",
            aboutTitle: "حول التقارير",
            aboutBody: "يتم إنشاء جميع التقارير في الوقت الحقيقي بأحدث البيانات. تقارير PDF مهيأة للطباعة، بينما تقارير Excel مناسبة للتحليل والتصفية.",
            reports: {
                'transaction-history': {
                    name: 'سجل معاملات الأصول',
                    description: 'سجل كامل لجميع معاملات الأصول مع تفاصيل التحقق بالوجه'
                },
                'disclaimer-completion': {
                    name: 'تقرير إتمام إخلاء الطرف ',
                    description: 'يعرض الموظفين الذين أكملوا إجراء إخلاء الطرف ومن لم يكملوه'
                },
                'employee-assets': {
                    name: 'تقرير أصول الموظفين',
                    description: 'يعرض الموظفين الذين لديهم أصول مسندة حاليًا مقابل من لا يملكون أي أصول'
                },
                'assets-by-status': {
                    name: 'تقرير الأصول حسب الحالة',
                    description: 'يصنّف جميع الأصول حسب حالتها (متاح، مسند، صيانة، متقاعد)'
                },
                'department-summary': {
                    name: 'تقرير ملخص الأقسام',
                    description: 'نظرة عامة شاملة على كل قسم بما في ذلك الموظفين والأصول وإكمال إخلاء المسؤولية'
                }
            },
            params: {
                startDateOptional: 'تاريخ البدء (اختياري)',
                endDateOptional: 'تاريخ الإنتهاء (اختياري)'
            }
        },

        reportsListSimple: {
            loading: "جارٍ التحميل...",
            headerTitle: "التقارير",
            headerSubtitle: "إنشاء وتنزيل التقارير بصيغة PDF أو Excel",
            table: {
                report: "التقرير",
                description: "الوصف",
                formats: "الصيغ",
                actions: "الإجراءات"
            },
            hasOptionalFilters: "يحتوي على عوامل تصفية اختيارية",
            dateRangeOptional: "نطاق التاريخ (اختياري):",
            startDate: "تاريخ البدء",
            endDate: "تاريخ الانتهاء",
            to: "إلى",
            clear: "مسح",
            downloadPdfTitle: "تنزيل PDF",
            downloadExcelTitle: "تنزيل Excel",
            pdf: "PDF",
            excel: "Excel",
            emptyTitle: "لا توجد تقارير متاحة",
            emptyBody: "تحقق لاحقًا لعرض التقارير المتاحة",
            toast: {
                loadFailed: "فشل تحميل التقارير",
                startBeforeEnd: "يجب أن يكون تاريخ البدء قبل تاريخ الانتهاء",
                unknownType: "نوع تقرير غير معروف",
                downloadFailed: "فشل تنزيل التقرير",
                emptyFile: "تم استلام ملف فارغ من الخادم",
                downloaded: "تم تنزيل {{name}} بنجاح"
            }
        },

        reportsPermissions: {
            header: {
                title: 'صلاحيات الوصول للتقارير',
                subtitle: 'إدارة الموظفين المسموح لهم بالوصول وتحميل التقارير',
            },
            actions: {
                grantAccess: 'منح صلاحية',
                edit: 'تعديل',
                delete: 'حذف',
                cancel: 'إلغاء',
                update: 'تحديث',
                grant: 'منح الصلاحية',
            },
            table: {
                employee: 'الموظف',
                employeeId: 'رقم الموظف',
                department: 'القسم',
                status: 'الحالة',
                grantedBy: 'مُنِحت بواسطة',
                actions: 'إجراءات',
            },
            status: {
                active: 'ساري',
                revoked: 'مُلغى',
            },
            empty: {
                title: 'لا توجد صلاحيات تقارير مُنحت',
                subtitle: 'اضغط "منح صلاحية" للسماح للموظفين بعرض التقارير',
            },
            dialog: {
                createTitle: 'منح صلاحية الوصول للتقارير',
                editTitle: 'تعديل صلاحية التقارير',
            },
            form: {
                employee: 'الموظف',
                selectEmployee: 'اختر موظفًا...',
                accessStatus: 'حالة الصلاحية',
                status: {
                    active: 'ساري - يمكنه الوصول للتقارير',
                    revoked: 'مُلغى - لا يمكنه الوصول للتقارير',
                },
                notesOptional: 'ملاحظات (اختياري)',
                notesPlaceholder: 'أضف أي ملاحظات عن هذه الصلاحية...',
            },
            messages: {
                createSuccess: 'تم منح الصلاحية بنجاح',
                updateSuccess: 'تم تحديث الصلاحية بنجاح',
                deleteSuccess: 'تم إلغاء الصلاحية بنجاح',
            },
            confirm: {
                revoke: 'هل أنت متأكد أنك تريد إلغاء صلاحية الوصول للتقارير؟',
            },
            errors: {
                load: 'فشل في تحميل البيانات',
                save: 'فشل في حفظ الصلاحية',
                delete: 'فشل في إلغاء الصلاحية',
            },
            common: {
                na: 'غير متاح',
            },
        },
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