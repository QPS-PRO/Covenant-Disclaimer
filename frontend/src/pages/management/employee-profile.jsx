// frontend/src/pages/management/employee-profile.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    Button,
    Chip,
    IconButton,
    Alert,
    Tabs,
    TabsHeader,
    TabsBody,
    Tab,
    TabPanel,
} from "@material-tailwind/react";
import {
    ArrowLeftIcon,
    CameraIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserCircleIcon,
    CubeIcon,
    ClockIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
    employeeAPI,
    formatters,
    profileFormatters,
    PROFILE_CONSTANTS,
} from "@/lib/assetApi";
import FaceRecognitionComponent from "../../components/FaceRecognitionComponent";
import AssetReturnComponent from "../../components/AssetReturnComponent";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";

export function EmployeeProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    const [employee, setEmployee] = useState(null);
    const [stats, setStats] = useState(null);

    const [currentAssets, setCurrentAssets] = useState([]);
    const [assetsLoading, setAssetsLoading] = useState(false);

    const [transactionHistory, setTransactionHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [activeTab, setActiveTab] = useState(PROFILE_CONSTANTS.TABS.OVERVIEW);

    // Modals
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);

    // Initial profile load (prefill assets/history if backend returns them)
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const response = await employeeAPI.getProfile(id);

                setEmployee(response.employee);
                setStats(response.stats);

                if (Array.isArray(response.current_assets)) {
                    setCurrentAssets(response.current_assets);
                }
                if (Array.isArray(response.transaction_history)) {
                    setTransactionHistory(response.transaction_history);
                    setHistoryPage(1);
                }
                setError("");
            } catch (err) {
                console.error(err);
                setError(t("employees.profile.errors.fetchProfile"));
            } finally {
                setLoading(false);
            }
        })();
    }, [id, t]);

    // Fetch current assets
    const fetchCurrentAssets = useCallback(async () => {
        try {
            setAssetsLoading(true);
            const response = await employeeAPI.getCurrentAssets(id);
            setCurrentAssets(response.current_assets ?? []);
            setError("");
        } catch (err) {
            console.error("Error fetching current assets:", err);
            setError(t("employees.profile.errors.fetchAssets"));
        } finally {
            setAssetsLoading(false);
        }
    }, [id, t]);

    // Fetch transaction history (paginated)
    const fetchTransactionHistory = useCallback(
        async (page = 1) => {
            try {
                setHistoryLoading(true);
                const response = await employeeAPI.getTransactionHistory(id, {
                    page,
                    page_size: PROFILE_CONSTANTS.PAGINATION.DEFAULT_PAGE_SIZE,
                });

                if (page === 1) {
                    setTransactionHistory(response.transactions ?? []);
                } else {
                    setTransactionHistory((prev) => [...prev, ...(response.transactions ?? [])]);
                }

                setHistoryTotalPages(response.pagination?.total_pages ?? 1);
                setHistoryPage(page);
                setError("");
            } catch (err) {
                console.error("Failed to fetch transaction history:", err);
                setError(t("employees.profile.errors.fetchHistory"));
            } finally {
                setHistoryLoading(false);
            }
        },
        [id, t]
    );

    // Load data when active tab changes
    useEffect(() => {
        if (!id) return;

        if (activeTab === PROFILE_CONSTANTS.TABS.ASSETS && currentAssets.length === 0) {
            fetchCurrentAssets();
        }
        if (activeTab === PROFILE_CONSTANTS.TABS.HISTORY && transactionHistory.length === 0) {
            fetchTransactionHistory(1);
        }
    }, [
        activeTab,
        id,
        currentAssets.length,
        transactionHistory.length,
        fetchCurrentAssets,
        fetchTransactionHistory,
    ]);

    // Face registration handlers
    const handleFaceRegistration = useCallback(() => {
        setShowFaceModal(true);
    }, []);

    const handleFaceRegistrationSuccess = useCallback(async () => {
        setShowFaceModal(false);
        try {
            const response = await employeeAPI.getProfile(id);
            setEmployee(response.employee);
            setStats(response.stats);
            setError("");
        } catch {
            /* ignore */
        }
    }, [id]);

    const handleFaceRegistrationError = useCallback((err) => {
        setShowFaceModal(false);
        setError(err?.error || t("employees.profile.errors.faceFailed"));
    }, [t]);

    // Asset return handlers
    const handleAssetReturn = useCallback((asset) => {
        setSelectedAsset(asset);
        setShowReturnModal(true);
    }, []);

    const handleReturnSuccess = useCallback(async () => {
        setShowReturnModal(false);
        setSelectedAsset(null);

        // Refresh profile stats and the assets list
        await Promise.all([
            employeeAPI
                .getProfile(id)
                .then((res) => {
                    setEmployee(res.employee);
                    setStats(res.stats);
                })
                .catch(() => { }),
            fetchCurrentAssets(),
        ]);

        if (activeTab === PROFILE_CONSTANTS.TABS.HISTORY) {
            fetchTransactionHistory(1);
        }
        setError("");
    }, [id, activeTab, fetchCurrentAssets, fetchTransactionHistory]);

    const handleReturnError = useCallback((err) => {
        setShowReturnModal(false);
        setSelectedAsset(null);
        setError(err?.error || t("employees.profile.errors.returnFailed"));
    }, [t]);

    const handleLoadMoreHistory = () => {
        if (historyPage < historyTotalPages && !historyLoading) {
            fetchTransactionHistory(historyPage + 1);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="mt-12 mb-8">
                <Alert color="red">{t("employees.profile.errors.notFound")}</Alert>
            </div>
        );
    }

    const formattedEmployee = profileFormatters.formatEmployeeData
        ? profileFormatters.formatEmployeeData(employee)
        : employee;

    return (
        <div className="mt-12 mb-8 flex flex-col gap-6">
            {/* Header */}
            <Card>
                <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <IconButton
                                variant="text"
                                color="white"
                                onClick={() => navigate("/dashboard/employees")}
                                aria-label={t("actions.back")}
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </IconButton>
                            <Typography variant="h6" color="white">
                                {t("employees.profile.pageTitle")}
                            </Typography>
                        </div>
                    </div>
                </CardHeader>

                <CardBody>
                    {error && <Alert color="red" className="mb-6">{error}</Alert>}

                    {/* Employee Header Info */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div>
                                <Typography variant="h4" color="blue-gray">
                                    {formattedEmployee.displayName || employee.name}
                                </Typography>
                                <Typography variant="small" color="gray">
                                    {t("employees.profile.employeeId")}: {employee.employee_id} • {employee.department_name}
                                </Typography>
                                <Typography variant="small" color="gray">{employee.email}</Typography>
                            </div>
                        </div>

                        <div className={`flex flex-col md:flex-row gap-2 ${isRTL ? "md:mr-auto" : "md:ml-auto"}`}>
                            <div className="flex items-center gap-2">
                                <Chip
                                    color={employee.is_active ? "green" : "red"}
                                    value={employee.is_active ? t("employees.active") : t("employees.inactive")}
                                    className="text-xs"
                                />
                                {employee.has_face_data ? (
                                    <Chip color="green" value={t("employees.face.registeredChip")} className="text-xs" />
                                ) : (
                                    <Chip color="red" value={t("employees.face.noDataChip")} className="text-xs" />
                                )}
                            </div>
                            <Button
                                size="sm"
                                color="blue"
                                onClick={handleFaceRegistration}
                                className="flex items-center gap-2"
                            >
                                <CameraIcon className="h-4 w-4" />
                                {employee.has_face_data ? t("employees.face.update") : t("employees.face.register")}
                            </Button>
                        </div>
                    </div>

                    <Tabs value={activeTab} onChange={(val) => setActiveTab(val)}>
                        <TabsHeader>
                            <Tab value={PROFILE_CONSTANTS.TABS.OVERVIEW}>
                                <UserCircleIcon className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                                {t("employees.profile.tabs.overview")}
                            </Tab>
                            <Tab value={PROFILE_CONSTANTS.TABS.ASSETS}>
                                <CubeIcon className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                                {t("employees.profile.tabs.assets")} ({stats?.current_assets_count || 0})
                            </Tab>
                            <Tab value={PROFILE_CONSTANTS.TABS.HISTORY}>
                                <ClockIcon className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                                {t("employees.profile.tabs.history")}
                            </Tab>
                        </TabsHeader>

                        <TabsBody>
                            {/* Overview */}
                            <TabPanel value={PROFILE_CONSTANTS.TABS.OVERVIEW}>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Employee Details */}
                                    <Card className="lg:col-span-2">
                                        <CardHeader floated={false} shadow={false} className="bg-blue-50 p-4">
                                            <Typography variant="h6" color="blue-gray">
                                                {t("employees.profile.employeeDetails")}
                                            </Typography>
                                        </CardHeader>
                                        <CardBody>
                                            <dl className="divide-y divide-gray-100">
                                                <div className="py-3 grid grid-cols-3 gap-4">
                                                    <dt className="text-sm font-medium text-gray-500">{t("employees.profile.name")}</dt>
                                                    <dd className="text-sm text-gray-900 col-span-2">{employee.name}</dd>
                                                </div>
                                                <div className="py-3 grid grid-cols-3 gap-4">
                                                    <dt className="text-sm font-medium text-gray-500">{t("employees.profile.employeeId")}</dt>
                                                    <dd className="text-sm text-gray-900 col-span-2">{employee.employee_id}</dd>
                                                </div>
                                                <div className="py-3 grid grid-cols-3 gap-4">
                                                    <dt className="text-sm font-medium text-gray-500">{t("employees.profile.email")}</dt>
                                                    <dd className="text-sm text-gray-900 col-span-2">{employee.email}</dd>
                                                </div>
                                                <div className="py-3 grid grid-cols-3 gap-4">
                                                    <dt className="text-sm font-medium text-gray-500">{t("employees.profile.phone")}</dt>
                                                    <dd className="text-sm text-gray-900 col-span-2">{employee.phone_number}</dd>
                                                </div>
                                                <div className="py-3 grid grid-cols-3 gap-4">
                                                    <dt className="text-sm font-medium text-gray-500">{t("employees.profile.department")}</dt>
                                                    <dd className="text-sm text-gray-900 col-span-2">{employee.department_name}</dd>
                                                </div>
                                                <div className="py-3 grid grid-cols-3 gap-4">
                                                    <dt className="text-sm font-medium text-gray-500">{t("employees.profile.status")}</dt>
                                                    <dd className="text-sm text-gray-900 col-span-2">
                                                        <Chip
                                                            size="sm"
                                                            color={employee.is_active ? "green" : "red"}
                                                            value={employee.is_active ? t("employees.active") : t("employees.inactive")}
                                                        />
                                                    </dd>
                                                </div>
                                                <div className="py-3 grid grid-cols-3 gap-4">
                                                    <dt className="text-sm font-medium text-gray-500">{t("employees.face.sectionHeader")}</dt>
                                                    <dd className="text-sm text-gray-900 col-span-2">
                                                        <div className="flex items-center gap-2">
                                                            {employee.has_face_data ? (
                                                                <>
                                                                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                                                    <span className="text-green-600">{t("employees.registered")}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <XCircleIcon className="h-4 w-4 text-red-500" />
                                                                    <span className="text-red-600">{t("employees.notRegistered")}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </dd>
                                                </div>
                                            </dl>
                                        </CardBody>
                                    </Card>

                                    {/* Statistics */}
                                    <Card>
                                        <CardHeader floated={false} shadow={false} className="bg-green-50 p-4">
                                            <Typography variant="h6" color="blue-gray">
                                                {t("employees.profile.activityStats")}
                                            </Typography>
                                        </CardHeader>
                                        <CardBody className="space-y-4">
                                            {stats ? (
                                                <>
                                                    <div className="text-center">
                                                        <Typography variant="h3" color="blue">
                                                            {stats.current_assets_count || 0}
                                                        </Typography>
                                                        <Typography variant="small" color="gray">
                                                            {t("employees.profile.currentAssets")}
                                                        </Typography>
                                                    </div>
                                                    <div className="text-center">
                                                        <Typography variant="h3" color="green">
                                                            {stats.total_transactions || 0}
                                                        </Typography>
                                                        <Typography variant="small" color="gray">
                                                            {t("employees.profile.totalTransactions")}
                                                        </Typography>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-center">
                                                        <div>
                                                            <Typography variant="h5" color="blue">
                                                                {stats.transactions_by_type?.issue ?? stats.total_issues ?? 0}
                                                            </Typography>
                                                            <Typography variant="small" color="gray">
                                                                {t("employees.profile.issues")}
                                                            </Typography>
                                                        </div>
                                                        <div>
                                                            <Typography variant="h5" color="orange">
                                                                {stats.transactions_by_type?.return ?? stats.total_returns ?? 0}
                                                            </Typography>
                                                            <Typography variant="small" color="gray">
                                                                {t("employees.profile.returns")}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <Typography variant="small" color="gray" className="text-center">
                                                    {t("common.noData")}
                                                </Typography>
                                            )}
                                        </CardBody>
                                    </Card>
                                </div>
                            </TabPanel>

                            {/* Current Assets */}
                            <TabPanel value={PROFILE_CONSTANTS.TABS.ASSETS}>
                                {assetsLoading ? (
                                    <div className="flex justify-center items-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                                    </div>
                                ) : currentAssets.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {currentAssets.map((asset) => (
                                            <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                                                <CardBody>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            <Typography variant="h6" color="blue-gray" className="mb-1">
                                                                {asset.name}
                                                            </Typography>
                                                            <Typography variant="small" color="gray" className="mb-2">
                                                                <strong>{t("assets.serialNumber")}:</strong> {asset.serial_number}
                                                            </Typography>
                                                            <Chip size="sm" color="blue" value={asset.status || "assigned"} className="mb-2" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 mb-4">
                                                        {asset.department_name && (
                                                            <Typography variant="small" color="gray">
                                                                <strong>{t("assets.department")}:</strong> {asset.department_name}
                                                            </Typography>
                                                        )}
                                                        {asset.description && (
                                                            <Typography variant="small" color="gray" className="line-clamp-2">
                                                                <strong>{t("assets.description")}:</strong> {asset.description}
                                                            </Typography>
                                                        )}
                                                        {asset.purchase_date && (
                                                            <Typography variant="small" color="gray">
                                                                <strong>{t("assets.purchaseDate")}:</strong>{" "}
                                                                {formatters.formatDate(asset.purchase_date)}
                                                            </Typography>
                                                        )}
                                                        {asset.purchase_cost && (
                                                            <Typography variant="small" color="gray">
                                                                <strong>{t("assets.purchaseCost")}:</strong>{" "}
                                                                {formatters.formatCurrency(asset.purchase_cost)}
                                                            </Typography>
                                                        )}
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        color="orange"
                                                        onClick={() => handleAssetReturn(asset)}
                                                        className="flex items-center gap-2 w-full"
                                                        variant="filled"
                                                    >
                                                        <ArrowPathIcon className="h-4 w-4" />
                                                        {t("employees.profile.returnAsset")}
                                                    </Button>
                                                </CardBody>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <CubeIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                        <Typography variant="h6" color="gray">
                                            {t("employees.profile.noCurrentAssets")}
                                        </Typography>
                                        <Typography variant="small" color="gray">
                                            {t("employees.profile.noCurrentAssetsHelp")}
                                        </Typography>
                                    </div>
                                )}
                            </TabPanel>

                            {/* Transaction History */}
                            <TabPanel value={PROFILE_CONSTANTS.TABS.HISTORY}>
                                {historyLoading ? (
                                    <div className="flex justify-center items-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                                    </div>
                                ) : transactionHistory.length > 0 ? (
                                    <div className="space-y-4">
                                        {transactionHistory.map((transaction) => (
                                            <Card key={transaction.id} className="hover:shadow-lg transition-shadow">
                                                <CardBody>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <Typography variant="h6" color="blue-gray">
                                                                    {transaction.asset_name}
                                                                </Typography>
                                                                <Chip
                                                                    size="sm"
                                                                    color={transaction.transaction_type === "issue" ? "green" : "blue"}
                                                                    value={
                                                                        transaction.transaction_type === "issue"
                                                                            ? t("transactions.issue")
                                                                            : t("transactions.return")
                                                                    }
                                                                />
                                                            </div>

                                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                                                <span>
                                                                    <strong>{t("common.date")}:</strong>{" "}
                                                                    {formatters.formatDate(transaction.transaction_date)}
                                                                </span>
                                                                {transaction.asset_serial_number && (
                                                                    <span>
                                                                        <strong>{t("assets.serial")}:</strong> {transaction.asset_serial_number}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {transaction.return_condition && (
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Typography variant="small" color="gray">
                                                                        <strong>{t("employees.profile.returnCondition")}:</strong>
                                                                    </Typography>
                                                                    <Chip
                                                                        size="sm"
                                                                        color={
                                                                            profileFormatters.formatAssetCondition
                                                                                ? profileFormatters.formatAssetCondition(
                                                                                    transaction.return_condition
                                                                                ).color
                                                                                : "gray"
                                                                        }
                                                                        value={transaction.return_condition}
                                                                    />
                                                                </div>
                                                            )}

                                                            {transaction.processed_by_name && (
                                                                <Typography variant="small" color="gray">
                                                                    <strong>{t("employees.profile.processedBy")}:</strong>{" "}
                                                                    {transaction.processed_by_name}
                                                                </Typography>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col items-end gap-2">
                                                            {transaction.face_verification_success ? (
                                                                <div className="flex items-center gap-1 text-green-600">
                                                                    <CheckCircleIcon className="h-4 w-4" />
                                                                    <Typography variant="small">
                                                                        {t("common.verified")}
                                                                        {transaction.face_verification_confidence &&
                                                                            ` (${(transaction.face_verification_confidence * 100).toFixed(1)}%)`}
                                                                    </Typography>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1 text-red-600">
                                                                    <XCircleIcon className="h-4 w-4" />
                                                                    <Typography variant="small">{t("common.notVerified")}</Typography>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {(transaction.notes || transaction.damage_notes) && (
                                                        <div className="mt-4 p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                                                            {transaction.damage_notes && (
                                                                <div className="mb-2">
                                                                    <Typography variant="small" color="red" className="font-semibold mb-1">
                                                                        {t("employees.profile.damageNotes")}:
                                                                    </Typography>
                                                                    <Typography variant="small" color="gray">
                                                                        {transaction.damage_notes}
                                                                    </Typography>
                                                                </div>
                                                            )}
                                                            {transaction.notes && (
                                                                <div>
                                                                    <Typography
                                                                        variant="small"
                                                                        color="blue-gray"
                                                                        className="font-semibold mb-1"
                                                                    >
                                                                        {t("employees.profile.notes")}:
                                                                    </Typography>
                                                                    <Typography variant="small" color="gray">
                                                                        {transaction.notes}
                                                                    </Typography>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </CardBody>
                                            </Card>
                                        ))}

                                        {historyPage < historyTotalPages && (
                                            <div className="text-center">
                                                <Button
                                                    variant="outlined"
                                                    onClick={handleLoadMoreHistory}
                                                    loading={historyLoading}
                                                    className="flex items-center gap-2"
                                                >
                                                    <ClockIcon className="h-4 w-4" />
                                                    {t("employees.profile.loadMoreHistory")}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <ClockIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                        <Typography variant="h6" color="gray">
                                            {t("employees.profile.noHistory")}
                                        </Typography>
                                        <Typography variant="small" color="gray">
                                            {t("employees.profile.noHistoryHelp")}
                                        </Typography>
                                    </div>
                                )}
                            </TabPanel>
                        </TabsBody>
                    </Tabs>
                </CardBody>
            </Card>

            {/* Face Registration Modal */}
            <FaceRecognitionComponent
                open={showFaceModal}
                mode="register"
                employeeId={employee?.id}
                employeeName={employee?.name}
                onClose={() => setShowFaceModal(false)}
                onSuccess={handleFaceRegistrationSuccess}
                onError={handleFaceRegistrationError}
            />

            {/* Asset Return Modal */}
            <AssetReturnComponent
                open={showReturnModal}
                onClose={() => setShowReturnModal(false)}
                asset={selectedAsset}
                employee={employee}
                onSuccess={handleReturnSuccess}
                onError={handleReturnError}
            />
        </div>
    );
}

export default EmployeeProfile;
