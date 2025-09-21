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
    // Avatar,
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

export function EmployeeProfile() {
    const { id } = useParams();
    const navigate = useNavigate();

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

                // Prefill data (so tabs show immediately on first click)
                if (Array.isArray(response.current_assets)) {
                    setCurrentAssets(response.current_assets);
                }
                if (Array.isArray(response.transaction_history)) {
                    setTransactionHistory(response.transaction_history);
                    setHistoryPage(1);
                    // If the profile endpoint doesn’t return pagination, we’ll fetch it when switching tab
                }

                setError("");
            } catch (err) {
                console.error(err);
                setError("Failed to fetch employee profile");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // Fetch current assets
    const fetchCurrentAssets = useCallback(async () => {
        try {
            setAssetsLoading(true);
            const response = await employeeAPI.getCurrentAssets(id);
            setCurrentAssets(response.current_assets ?? []);
            setError("");
        } catch (err) {
            console.error("Error fetching current assets:", err);
            setError("Failed to fetch current assets");
        } finally {
            setAssetsLoading(false);
        }
    }, [id]);

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
                    setTransactionHistory((prev) => [
                        ...prev,
                        ...(response.transactions ?? []),
                    ]);
                }

                setHistoryTotalPages(response.pagination?.total_pages ?? 1);
                setHistoryPage(page);
                setError("");
            } catch (err) {
                console.error("Failed to fetch transaction history:", err);
                setError("Failed to fetch transaction history");
            } finally {
                setHistoryLoading(false);
            }
        },
        [id]
    );

    // 👉 Load data when active tab changes
    useEffect(() => {
        if (!id) return;

        if (
            activeTab === PROFILE_CONSTANTS.TABS.ASSETS &&
            currentAssets.length === 0
        ) {
            fetchCurrentAssets();
        }

        if (
            activeTab === PROFILE_CONSTANTS.TABS.HISTORY &&
            transactionHistory.length === 0
        ) {
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
        // refresh profile (will update stats + flags)
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
        setError(err?.error || "Face registration failed");
    }, []);

    // Asset return handlers
    const handleAssetReturn = useCallback((asset) => {
        setSelectedAsset(asset);
        setShowReturnModal(true);
    }, []);

    const handleReturnSuccess = useCallback(async () => {
        setShowReturnModal(false);
        setSelectedAsset(null);

        // Refresh profile stats and the assets list
        await Promise.all([employeeAPI.getProfile(id).then((res) => {
            setEmployee(res.employee);
            setStats(res.stats);
        }).catch(() => { }), fetchCurrentAssets()]);

        // If on history tab, refresh it too
        if (activeTab === PROFILE_CONSTANTS.TABS.HISTORY) {
            fetchTransactionHistory(1);
        }
        setError("");
    }, [id, activeTab, fetchCurrentAssets, fetchTransactionHistory]);

    const handleReturnError = useCallback((err) => {
        setShowReturnModal(false);
        setSelectedAsset(null);
        setError(err?.error || "Asset return failed");
    }, []);

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
                <Alert color="red">Employee not found</Alert>
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
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </IconButton>
                            <Typography variant="h6" color="white">
                                Employee Profile
                            </Typography>
                        </div>
                    </div>
                </CardHeader>

                <CardBody>
                    {error && (
                        <Alert color="red" className="mb-6">
                            {error}
                        </Alert>
                    )}

                    {/* Employee Header Info */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            {/* <Avatar
                src={formattedEmployee.avatar}
                alt={formattedEmployee.displayName || employee.name}
                size="xl"
                className="ring-2 ring-blue-500"
              /> */}
                            <div>
                                <Typography variant="h4" color="blue-gray">
                                    {formattedEmployee.displayName || employee.name}
                                </Typography>
                                <Typography variant="small" color="gray">
                                    ID: {employee.employee_id} • {employee.department_name}
                                </Typography>
                                <Typography variant="small" color="gray">
                                    {employee.email}
                                </Typography>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-2 md:ml-auto">
                            <div className="flex items-center gap-2">
                                <Chip
                                    color={employee.is_active ? "green" : "red"}
                                    value={employee.is_active ? "ACTIVE" : "INACTIVE"}
                                    className="text-xs"
                                />
                                {employee.has_face_data ? (
                                    <Chip color="green" value="FACE REGISTERED" className="text-xs" />
                                ) : (
                                    <Chip color="red" value="NO FACE DATA" className="text-xs" />
                                )}
                            </div>
                            <Button
                                size="sm"
                                color="blue"
                                onClick={handleFaceRegistration}
                                className="flex items-center gap-2"
                            >
                                <CameraIcon className="h-4 w-4" />
                                {employee.has_face_data ? "Update Face" : "Register Face"}
                            </Button>
                        </div>
                    </div>

                    <Tabs value={activeTab} onChange={(val) => setActiveTab(val)}>
                        <TabsHeader>
                            <Tab value={PROFILE_CONSTANTS.TABS.OVERVIEW}>
                                <UserCircleIcon className="w-5 h-5 mr-2" />
                                Overview
                            </Tab>
                            <Tab value={PROFILE_CONSTANTS.TABS.ASSETS}>
                                <CubeIcon className="w-5 h-5 mr-2" />
                                Current Assets ({stats?.current_assets_count || 0})
                            </Tab>
                            <Tab value={PROFILE_CONSTANTS.TABS.HISTORY}>
                                <ClockIcon className="w-5 h-5 mr-2" />
                                Transaction History
                            </Tab>
                        </TabsHeader>

                        {/* Debug box – keep OUTSIDE TabsBody */}
                        {/* {process.env.NODE_ENV === "development" && (
                            <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                <strong>Debug:</strong> Active Tab: {activeTab}, Current Assets:{" "}
                                {currentAssets.length}, Transaction History:{" "}
                                {transactionHistory.length}, Employee ID: {id}
                            </div>
                        )} */}

                        <TabsBody>
                            {/* Overview */}
                            <TabPanel value={PROFILE_CONSTANTS.TABS.OVERVIEW}>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Employee Details */}
                                    <Card className="lg:col-span-2">
                                        <CardHeader
                                            floated={false}
                                            shadow={false}
                                            className="bg-blue-50 p-4"
                                        >
                                            <Typography variant="h6" color="blue-gray">
                                                Employee Details
                                            </Typography>
                                        </CardHeader>
                                        <CardBody>
                                            <dl className="divide-y divide-gray-100">
                                                <div className="py-3 grid grid-cols-3 gap-4">
                                                    <dt className="text-sm font-medium text-gray-500">
                                                        Full Name
                                                    </dt>
                                                    <dd className="text-sm text-gray-900 col-span-2">
                                                        {employee.name}
                                                    </dd>
                                                </div>
                                                <div className="py-3 grid grid-cols-3 gap-4">
                                                    <dt className="text-sm font-medium text-gray-500">
                                                        Employee ID
                                                    </dt>
                                                    <dd className="text-sm text-gray-900 col-span-2">
                                                        {employee.employee_id}
                                                    </dd>
                                                </div>
                                                <div className="py-3 grid grid-cols-3 gap-4">
                                                    <dt className="text-sm font-medium text-gray-500">
                                                        Email
                                                    </dt>
                                                    <dd className="text-sm text-gray-900 col-span-2">
                                                        {employee.email}
                                                    </dd>
                                                </div>
                                                <div className="py-3 grid grid-cols-3 gap-4">
                                                    <dt className="text-sm font-medium text-gray-500">
                                                        Phone
                                                    </dt>
                                                    <dd className="text-sm text-gray-900 col-span-2">
                                                        {employee.phone_number}
                                                    </dd>
                                                </div>
                                                <div className="py-3 grid grid-cols-3 gap-4">
                                                    <dt className="text-sm font-medium text-gray-500">
                                                        Department
                                                    </dt>
                                                    <dd className="text-sm text-gray-900 col-span-2">
                                                        {employee.department_name}
                                                    </dd>
                                                </div>
                                                <div className="py-3 grid grid-cols-3 gap-4">
                                                    <dt className="text-sm font-medium text-gray-500">
                                                        Status
                                                    </dt>
                                                    <dd className="text-sm text-gray-900 col-span-2">
                                                        <Chip
                                                            size="sm"
                                                            color={employee.is_active ? "green" : "red"}
                                                            value={employee.is_active ? "Active" : "Inactive"}
                                                        />
                                                    </dd>
                                                </div>
                                                <div className="py-3 grid grid-cols-3 gap-4">
                                                    <dt className="text-sm font-medium text-gray-500">
                                                        Face Recognition
                                                    </dt>
                                                    <dd className="text-sm text-gray-900 col-span-2">
                                                        <div className="flex items-center gap-2">
                                                            {employee.has_face_data ? (
                                                                <>
                                                                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                                                    <span className="text-green-600">
                                                                        Registered
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <XCircleIcon className="h-4 w-4 text-red-500" />
                                                                    <span className="text-red-600">
                                                                        Not Registered
                                                                    </span>
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
                                        <CardHeader
                                            floated={false}
                                            shadow={false}
                                            className="bg-green-50 p-4"
                                        >
                                            <Typography variant="h6" color="blue-gray">
                                                Activity Statistics
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
                                                            Current Assets
                                                        </Typography>
                                                    </div>
                                                    <div className="text-center">
                                                        <Typography variant="h3" color="green">
                                                            {stats.total_transactions || 0}
                                                        </Typography>
                                                        <Typography variant="small" color="gray">
                                                            Total Transactions
                                                        </Typography>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-center">
                                                        <div>
                                                            <Typography variant="h5" color="blue">
                                                                {stats.transactions_by_type?.issue ||
                                                                    stats.total_issues ||
                                                                    0}
                                                            </Typography>
                                                            <Typography variant="small" color="gray">
                                                                Issues
                                                            </Typography>
                                                        </div>
                                                        <div>
                                                            <Typography variant="h5" color="orange">
                                                                {stats.transactions_by_type?.return ||
                                                                    stats.total_returns ||
                                                                    0}
                                                            </Typography>
                                                            <Typography variant="small" color="gray">
                                                                Returns
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <Typography
                                                    variant="small"
                                                    color="gray"
                                                    className="text-center"
                                                >
                                                    No statistics available
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
                                            <Card
                                                key={asset.id}
                                                className="hover:shadow-lg transition-shadow"
                                            >
                                                <CardBody>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            <Typography
                                                                variant="h6"
                                                                color="blue-gray"
                                                                className="mb-1"
                                                            >
                                                                {asset.name}
                                                            </Typography>
                                                            <Typography
                                                                variant="small"
                                                                color="gray"
                                                                className="mb-2"
                                                            >
                                                                Serial: {asset.serial_number}
                                                            </Typography>
                                                            <Chip
                                                                size="sm"
                                                                color="blue"
                                                                value={asset.status || "assigned"}
                                                                className="mb-2"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 mb-4">
                                                        {asset.department_name && (
                                                            <Typography variant="small" color="gray">
                                                                <strong>Department:</strong>{" "}
                                                                {asset.department_name}
                                                            </Typography>
                                                        )}
                                                        {asset.description && (
                                                            <Typography
                                                                variant="small"
                                                                color="gray"
                                                                className="line-clamp-2"
                                                            >
                                                                <strong>Description:</strong>{" "}
                                                                {asset.description}
                                                            </Typography>
                                                        )}
                                                        {asset.purchase_date && (
                                                            <Typography variant="small" color="gray">
                                                                <strong>Purchase Date:</strong>{" "}
                                                                {formatters.formatDate(asset.purchase_date)}
                                                            </Typography>
                                                        )}
                                                        {asset.purchase_cost && (
                                                            <Typography variant="small" color="gray">
                                                                <strong>Purchase Cost:</strong>{" "}
                                                                {formatters.formatCurrency(
                                                                    asset.purchase_cost
                                                                )}
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
                                                        Return Asset
                                                    </Button>
                                                </CardBody>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <CubeIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                        <Typography variant="h6" color="gray">
                                            No Current Assets
                                        </Typography>
                                        <Typography variant="small" color="gray">
                                            This employee doesn't have any assets assigned currently.
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
                                            <Card
                                                key={transaction.id}
                                                className="hover:shadow-lg transition-shadow"
                                            >
                                                <CardBody>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <Typography variant="h6" color="blue-gray">
                                                                    {transaction.asset_name}
                                                                </Typography>
                                                                <Chip
                                                                    size="sm"
                                                                    color={
                                                                        transaction.transaction_type === "issue"
                                                                            ? "green"
                                                                            : "blue"
                                                                    }
                                                                    value={transaction.transaction_type?.toUpperCase()}
                                                                />
                                                            </div>

                                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                                                <span>
                                                                    <strong>Date:</strong>{" "}
                                                                    {formatters.formatDate(
                                                                        transaction.transaction_date
                                                                    )}
                                                                </span>
                                                                {transaction.asset_serial_number && (
                                                                    <span>
                                                                        <strong>Serial:</strong>{" "}
                                                                        {transaction.asset_serial_number}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {transaction.return_condition && (
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Typography variant="small" color="gray">
                                                                        <strong>Return Condition:</strong>
                                                                    </Typography>
                                                                    <Chip
                                                                        size="sm"
                                                                        color={
                                                                            profileFormatters.formatAssetCondition
                                                                                ? profileFormatters
                                                                                    .formatAssetCondition(
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
                                                                    <strong>Processed by:</strong>{" "}
                                                                    {transaction.processed_by_name}
                                                                </Typography>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col items-end gap-2">
                                                            {transaction.face_verification_success ? (
                                                                <div className="flex items-center gap-1 text-green-600">
                                                                    <CheckCircleIcon className="h-4 w-4" />
                                                                    <Typography variant="small">
                                                                        Verified
                                                                        {transaction.face_verification_confidence &&
                                                                            ` (${(
                                                                                transaction.face_verification_confidence *
                                                                                100
                                                                            ).toFixed(1)}%)`}
                                                                    </Typography>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1 text-red-600">
                                                                    <XCircleIcon className="h-4 w-4" />
                                                                    <Typography variant="small">
                                                                        Not Verified
                                                                    </Typography>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {(transaction.notes || transaction.damage_notes) && (
                                                        <div className="mt-4 p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                                                            {transaction.damage_notes && (
                                                                <div className="mb-2">
                                                                    <Typography
                                                                        variant="small"
                                                                        color="red"
                                                                        className="font-semibold mb-1"
                                                                    >
                                                                        Damage Notes:
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
                                                                        Notes:
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
                                                    Load More History
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <ClockIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                        <Typography variant="h6" color="gray">
                                            No Transaction History
                                        </Typography>
                                        <Typography variant="small" color="gray">
                                            This employee hasn't completed any transactions yet.
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

