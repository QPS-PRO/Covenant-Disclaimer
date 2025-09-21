import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    Card,
    CardBody,
    CardHeader,
    Avatar,
    Typography,
    Tabs,
    TabsHeader,
    Tab,
    TabsBody,
    TabPanel,
    Button,
    Alert,
    Chip,
    IconButton,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Input,
    Textarea,
    Select,
    Option,
} from "@material-tailwind/react";
import {
    HomeIcon,
    ChatBubbleLeftEllipsisIcon,
    Cog6ToothIcon,
    ArrowLeftIcon,
    CameraIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserCircleIcon,
    ClipboardDocumentListIcon,
    CubeIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/solid";
import { employeeAPI, transactionAPI, formatters } from "@/lib/assetApi";
import FaceRecognitionComponent from "../../components/FaceRecognitionComponent";

export function EmployeeProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState({ type: '', text: '' });

    // Employee data state
    const [employee, setEmployee] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [currentAssets, setCurrentAssets] = useState([]);
    const [stats, setStats] = useState(null);

    // Return asset modal states
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [returnFormData, setReturnFormData] = useState({
        return_condition: '',
        damage_notes: '',
        notes: ''
    });
    const [returnLoading, setReturnLoading] = useState(false);
    const [faceVerificationData, setFaceVerificationData] = useState(null);

    useEffect(() => {
        if (id) {
            fetchEmployeeProfile();
        }
    }, [id]);

    const fetchEmployeeProfile = async () => {
        try {
            setLoading(true);
            const response = await employeeAPI.getProfile(id);

            setEmployee(response.employee);
            setTransactions(response.transaction_history || []);
            setCurrentAssets(response.current_assets || []);
            setStats(response.stats);
            setError("");
        } catch (err) {
            console.error("Error fetching employee profile:", err);
            setError("Failed to fetch employee profile");
        } finally {
            setLoading(false);
        }
    };

    const handleReturnAsset = useCallback((asset) => {
        setSelectedAsset(asset);
        setReturnFormData({
            return_condition: '',
            damage_notes: '',
            notes: ''
        });
        setShowReturnModal(true);
    }, []);

    const handleReturnFormSubmit = useCallback(() => {
        // Close return form and open face recognition
        setShowReturnModal(false);
        setTimeout(() => {
            setShowFaceModal(true);
        }, 300);
    }, []);

    const handleFaceVerificationSuccess = useCallback(async (verificationResult) => {
        try {
            setReturnLoading(true);
            setFaceVerificationData(verificationResult);

            // Create return transaction with face verification
            const transactionData = {
                asset: selectedAsset.id,
                employee: employee.id,
                transaction_type: 'return',
                return_condition: returnFormData.return_condition,
                damage_notes: returnFormData.damage_notes,
                notes: returnFormData.notes,
                face_verification_success: verificationResult.success,
                face_verification_confidence: verificationResult.confidence
            };

            await transactionAPI.create(transactionData);

            setMessage({
                type: 'success',
                text: `Asset "${selectedAsset.name}" returned successfully with face verification!`
            });

            // Refresh data
            await fetchEmployeeProfile();
            handleReturnModalClose();

        } catch (error) {
            console.error("Error processing return:", error);
            setError("Failed to process asset return");
            setShowFaceModal(false);
        } finally {
            setReturnLoading(false);
        }
    }, [selectedAsset, employee, returnFormData]);

    const handleFaceVerificationError = useCallback((error) => {
        setError(`Face verification failed: ${error.error || 'Unknown error'}`);
        setShowFaceModal(false);
    }, []);

    const handleReturnModalClose = useCallback(() => {
        setShowReturnModal(false);
        setShowFaceModal(false);
        setSelectedAsset(null);
        setReturnFormData({
            return_condition: '',
            damage_notes: '',
            notes: ''
        });
        setFaceVerificationData(null);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setReturnFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error && !employee) {
        return (
            <div className="mt-8">
                <Alert color="red" className="mb-4">
                    {error}
                </Alert>
                <Button onClick={() => navigate('/management/employees')} className="flex items-center gap-2">
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to Employees
                </Button>
            </div>
        );
    }

    return (
        <>
            {/* Header with background */}
            <div className="relative mt-8 h-72 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 bg-cover bg-center">
                <div className="absolute inset-0 h-full w-full bg-gray-900/20" />
                <div className="absolute top-4 left-4">
                    <Button
                        variant="text"
                        color="white"
                        onClick={() => navigate('/dashboard/employees')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back to Employees
                    </Button>
                </div>
            </div>

            <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
                <CardBody className="p-4">
                    {message.text && (
                        <Alert
                            color={message.type === 'success' ? 'green' : 'red'}
                            className="mb-6"
                            onClose={() => setMessage({ type: '', text: '' })}
                        >
                            {message.text}
                        </Alert>
                    )}

                    {error && (
                        <Alert
                            color="red"
                            className="mb-6"
                            onClose={() => setError('')}
                        >
                            {error}
                        </Alert>
                    )}

                    {employee && (
                        <>
                            {/* Employee Header */}
                            <div className="mb-10 flex items-center justify-between flex-wrap gap-6">
                                <div className="flex items-center gap-6">
                                    <Avatar
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=0d47a1&color=fff&size=128`}
                                        alt={employee.name}
                                        size="xl"
                                        variant="rounded"
                                        className="rounded-lg shadow-lg shadow-blue-gray-500/40"
                                    />
                                    <div>
                                        <Typography variant="h5" color="blue-gray" className="mb-1">
                                            {employee.name}
                                        </Typography>
                                        <Typography variant="small" className="font-normal text-blue-gray-600 mb-1">
                                            {employee.email}
                                        </Typography>
                                        <Typography variant="small" className="font-normal text-blue-gray-600">
                                            Employee ID: {employee.employee_id}
                                        </Typography>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Chip
                                                variant="gradient"
                                                color={employee.is_active ? "green" : "red"}
                                                value={employee.is_active ? "ACTIVE" : "INACTIVE"}
                                                className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                            />
                                            {employee.has_face_data ? (
                                                <div className="flex items-center gap-1">
                                                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                                    <Chip color="green" value="FACE REGISTERED" className="text-xs" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <XCircleIcon className="h-4 w-4 text-red-500" />
                                                    <Chip color="red" value="NO FACE DATA" className="text-xs" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-96">
                                    <Tabs value={activeTab} onChange={setActiveTab}>
                                        <TabsHeader>
                                            <Tab value="overview" onClick={() => setActiveTab("overview")}>
                                                <HomeIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                                                Overview
                                            </Tab>
                                            <Tab value="assets" onClick={() => setActiveTab("assets")}>
                                                <CubeIcon className="-mt-0.5 mr-2 inline-block h-5 w-5" />
                                                Assets
                                            </Tab>
                                            <Tab value="history" onClick={() => setActiveTab("history")}>
                                                <ClipboardDocumentListIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                                                History
                                            </Tab>
                                        </TabsHeader>
                                    </Tabs>
                                </div>
                            </div>

                            {/* Tab Content */}
                            <Tabs value={activeTab}>
                                <TabsBody>
                                    {/* Overview Tab */}
                                    <TabPanel value="overview" className="p-0">
                                        <div className="grid grid-cols-1 mb-12 gap-12 px-4 lg:grid-cols-2 xl:grid-cols-3">
                                            {/* Profile Information */}
                                            <div>
                                                <Card color="transparent" shadow={false}>
                                                    <CardHeader
                                                        color="transparent"
                                                        shadow={false}
                                                        floated={false}
                                                        className="mx-0 mt-0 mb-4 flex items-center justify-between gap-4"
                                                    >
                                                        <Typography variant="h6" color="blue-gray">
                                                            Profile Information
                                                        </Typography>
                                                    </CardHeader>
                                                    <CardBody className="p-0">
                                                        <Typography
                                                            variant="small"
                                                            className="font-normal text-blue-gray-500 mb-4"
                                                        >
                                                            Employee details and contact information.
                                                        </Typography>

                                                        <hr className="my-8 border-blue-gray-50" />

                                                        <ul className="flex flex-col gap-4 p-0">
                                                            <li className="flex items-center gap-4">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold capitalize min-w-[100px]"
                                                                >
                                                                    Name:
                                                                </Typography>
                                                                <Typography
                                                                    variant="small"
                                                                    className="font-normal text-blue-gray-500"
                                                                >
                                                                    {employee.name}
                                                                </Typography>
                                                            </li>

                                                            <li className="flex items-center gap-4">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold capitalize min-w-[100px]"
                                                                >
                                                                    Employee ID:
                                                                </Typography>
                                                                <Typography
                                                                    variant="small"
                                                                    className="font-normal text-blue-gray-500"
                                                                >
                                                                    {employee.employee_id}
                                                                </Typography>
                                                            </li>

                                                            <li className="flex items-center gap-4">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold capitalize min-w-[100px]"
                                                                >
                                                                    Email:
                                                                </Typography>
                                                                <Typography
                                                                    variant="small"
                                                                    className="font-normal text-blue-gray-500"
                                                                >
                                                                    {employee.email}
                                                                </Typography>
                                                            </li>

                                                            <li className="flex items-center gap-4">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold capitalize min-w-[100px]"
                                                                >
                                                                    Phone:
                                                                </Typography>
                                                                <Typography
                                                                    variant="small"
                                                                    className="font-normal text-blue-gray-500"
                                                                >
                                                                    {employee.phone_number}
                                                                </Typography>
                                                            </li>

                                                            <li className="flex items-center gap-4">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold capitalize min-w-[100px]"
                                                                >
                                                                    Department:
                                                                </Typography>
                                                                <Typography
                                                                    variant="small"
                                                                    className="font-normal text-blue-gray-500"
                                                                >
                                                                    {employee.department_name}
                                                                </Typography>
                                                            </li>

                                                            <li className="flex items-center gap-4">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold capitalize min-w-[100px]"
                                                                >
                                                                    Joined:
                                                                </Typography>
                                                                <Typography
                                                                    variant="small"
                                                                    className="font-normal text-blue-gray-500"
                                                                >
                                                                    {formatters.formatDate(employee.created_at)}
                                                                </Typography>
                                                            </li>
                                                        </ul>
                                                    </CardBody>
                                                </Card>
                                            </div>

                                            {/* Statistics */}
                                            {stats && (
                                                <div>
                                                    <Typography variant="h6" color="blue-gray" className="mb-3">
                                                        Activity Statistics
                                                    </Typography>
                                                    <div className="flex flex-col gap-6">
                                                        <Card className="shadow-sm border border-blue-gray-100">
                                                            <CardBody className="p-6">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="text-center">
                                                                        <Typography variant="h4" color="blue">
                                                                            {stats.current_assets_count || 0}
                                                                        </Typography>
                                                                        <Typography variant="small" color="gray">
                                                                            Current Assets
                                                                        </Typography>
                                                                    </div>

                                                                    <div className="text-center">
                                                                        <Typography variant="h4" color="green">
                                                                            {stats.total_transactions || 0}
                                                                        </Typography>
                                                                        <Typography variant="small" color="gray">
                                                                            Total Transactions
                                                                        </Typography>
                                                                    </div>

                                                                    <div className="text-center">
                                                                        <Typography variant="h4" color="blue">
                                                                            {stats.transactions_by_type?.issue || stats.total_issues || 0}
                                                                        </Typography>
                                                                        <Typography variant="small" color="gray">
                                                                            Assets Issued
                                                                        </Typography>
                                                                    </div>

                                                                    <div className="text-center">
                                                                        <Typography variant="h4" color="orange">
                                                                            {stats.transactions_by_type?.return || stats.total_returns || 0}
                                                                        </Typography>
                                                                        <Typography variant="small" color="gray">
                                                                            Assets Returned
                                                                        </Typography>
                                                                    </div>
                                                                </div>
                                                            </CardBody>
                                                        </Card>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Face Recognition Status */}
                                            <div>
                                                <Typography variant="h6" color="blue-gray" className="mb-3">
                                                    Security Settings
                                                </Typography>
                                                <Card className="shadow-sm border border-blue-gray-100">
                                                    <CardBody className="p-6">
                                                        <div className="text-center space-y-4">
                                                            <CameraIcon className="h-12 w-12 mx-auto text-blue-500" />
                                                            <Typography variant="h6">
                                                                Face Recognition
                                                            </Typography>

                                                            <div className="flex items-center justify-center gap-2">
                                                                <Typography variant="small" color="gray">
                                                                    Status:
                                                                </Typography>
                                                                {employee.has_face_data ? (
                                                                    <Chip color="green" value="REGISTERED" />
                                                                ) : (
                                                                    <Chip color="red" value="NOT REGISTERED" />
                                                                )}
                                                            </div>

                                                            <Typography variant="small" color="gray" className="text-center">
                                                                Face recognition is required for secure asset transactions
                                                            </Typography>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        </div>
                                    </TabPanel>

                                    {/* Current Assets Tab */}
                                    <TabPanel value="assets" className="p-0">
                                        <div className="px-4">
                                            <div className="mb-6">
                                                <Typography variant="h6" color="blue-gray" className="mb-2">
                                                    Current Assets ({currentAssets.length})
                                                </Typography>
                                                <Typography variant="small" color="gray">
                                                    Assets currently assigned to this employee
                                                </Typography>
                                            </div>

                                            {currentAssets.length === 0 ? (
                                                <Card className="shadow-sm border border-blue-gray-100">
                                                    <CardBody className="text-center py-12">
                                                        <CubeIcon className="h-12 w-12 mx-auto text-blue-gray-300 mb-4" />
                                                        <Typography variant="h6" color="blue-gray" className="mb-2">
                                                            No Assets Assigned
                                                        </Typography>
                                                        <Typography variant="small" color="gray">
                                                            This employee currently has no assets assigned to them.
                                                        </Typography>
                                                    </CardBody>
                                                </Card>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {currentAssets.map((asset) => (
                                                        <Card key={asset.id} className="shadow-sm border border-blue-gray-100">
                                                            <CardBody className="p-6">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <CubeIcon className="h-6 w-6 text-blue-500" />
                                                                            <Typography variant="h6" color="blue-gray">
                                                                                {asset.name}
                                                                            </Typography>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                                            <div>
                                                                                <Typography variant="small" color="gray" className="font-semibold">
                                                                                    Serial Number:
                                                                                </Typography>
                                                                                <Typography variant="small" color="blue-gray">
                                                                                    {asset.serial_number}
                                                                                </Typography>
                                                                            </div>

                                                                            <div>
                                                                                <Typography variant="small" color="gray" className="font-semibold">
                                                                                    Department:
                                                                                </Typography>
                                                                                <Typography variant="small" color="blue-gray">
                                                                                    {asset.department_name}
                                                                                </Typography>
                                                                            </div>

                                                                            <div>
                                                                                <Typography variant="small" color="gray" className="font-semibold">
                                                                                    Status:
                                                                                </Typography>
                                                                                <Chip
                                                                                    color={formatters.getAssetStatusColor(asset.status)}
                                                                                    value={asset.status?.toUpperCase()}
                                                                                    className="text-xs w-fit"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {asset.description && (
                                                                            <div className="mt-3">
                                                                                <Typography variant="small" color="gray" className="font-semibold">
                                                                                    Description:
                                                                                </Typography>
                                                                                <Typography variant="small" color="blue-gray">
                                                                                    {asset.description}
                                                                                </Typography>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="ml-4">
                                                                        <Button
                                                                            size="sm"
                                                                            color="orange"
                                                                            onClick={() => handleReturnAsset(asset)}
                                                                            className="flex items-center gap-2"
                                                                            disabled={!employee.has_face_data}
                                                                        >
                                                                            <ArrowPathIcon className="h-4 w-4" />
                                                                            Return Asset
                                                                        </Button>
                                                                        {!employee.has_face_data && (
                                                                            <Typography variant="tiny" color="red" className="text-center mt-1">
                                                                                Face data required
                                                                            </Typography>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </CardBody>
                                                        </Card>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TabPanel>

                                    {/* Transaction History Tab */}
                                    <TabPanel value="history" className="p-0">
                                        <div className="px-4">
                                            <div className="mb-6">
                                                <Typography variant="h6" color="blue-gray" className="mb-2">
                                                    Transaction History ({transactions.length})
                                                </Typography>
                                                <Typography variant="small" color="gray">
                                                    Complete history of asset transactions
                                                </Typography>
                                            </div>

                                            {transactions.length === 0 ? (
                                                <Card className="shadow-sm border border-blue-gray-100">
                                                    <CardBody className="text-center py-12">
                                                        <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-blue-gray-300 mb-4" />
                                                        <Typography variant="h6" color="blue-gray" className="mb-2">
                                                            No Transaction History
                                                        </Typography>
                                                        <Typography variant="small" color="gray">
                                                            This employee has no transaction history yet.
                                                        </Typography>
                                                    </CardBody>
                                                </Card>
                                            ) : (
                                                <div className="space-y-4">
                                                    {transactions.map((transaction) => (
                                                        <Card key={transaction.id} className="shadow-sm border border-blue-gray-100">
                                                            <CardBody className="p-6">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <Chip
                                                                            color={formatters.getTransactionTypeColor(transaction.transaction_type)}
                                                                            value={transaction.transaction_type?.toUpperCase()}
                                                                            className="text-xs"
                                                                        />
                                                                        <Typography variant="h6" color="blue-gray">
                                                                            {transaction.asset_name}
                                                                        </Typography>
                                                                    </div>

                                                                    <Typography variant="small" color="gray">
                                                                        {formatters.formatDate(transaction.transaction_date)}
                                                                    </Typography>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                                                    <div>
                                                                        <Typography variant="small" color="gray" className="font-semibold">
                                                                            Asset Serial:
                                                                        </Typography>
                                                                        <Typography variant="small" color="blue-gray">
                                                                            {transaction.asset_serial_number}
                                                                        </Typography>
                                                                    </div>

                                                                    <div>
                                                                        <Typography variant="small" color="gray" className="font-semibold">
                                                                            Processed By:
                                                                        </Typography>
                                                                        <Typography variant="small" color="blue-gray">
                                                                            {transaction.processed_by_name || 'System'}
                                                                        </Typography>
                                                                    </div>

                                                                    <div>
                                                                        <Typography variant="small" color="gray" className="font-semibold">
                                                                            Face Verification:
                                                                        </Typography>
                                                                        <div className="flex items-center gap-1">
                                                                            {transaction.face_verification_success ? (
                                                                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                                                            ) : (
                                                                                <XCircleIcon className="h-4 w-4 text-red-500" />
                                                                            )}
                                                                            <Typography variant="small" color="blue-gray">
                                                                                {transaction.verification_status}
                                                                            </Typography>
                                                                        </div>
                                                                    </div>

                                                                    {transaction.transaction_type === 'return' && transaction.return_condition && (
                                                                        <div>
                                                                            <Typography variant="small" color="gray" className="font-semibold">
                                                                                Return Condition:
                                                                            </Typography>
                                                                            <Typography variant="small" color="blue-gray">
                                                                                {transaction.return_condition}
                                                                            </Typography>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {transaction.notes && (
                                                                    <div className="mt-3 pt-3 border-t border-blue-gray-50">
                                                                        <Typography variant="small" color="gray" className="font-semibold mb-1">
                                                                            Notes:
                                                                        </Typography>
                                                                        <Typography variant="small" color="blue-gray">
                                                                            {transaction.notes}
                                                                        </Typography>
                                                                    </div>
                                                                )}

                                                                {transaction.damage_notes && (
                                                                    <div className="mt-2">
                                                                        <Typography variant="small" color="gray" className="font-semibold mb-1">
                                                                            Damage Notes:
                                                                        </Typography>
                                                                        <Typography variant="small" color="red">
                                                                            {transaction.damage_notes}
                                                                        </Typography>
                                                                    </div>
                                                                )}
                                                            </CardBody>
                                                        </Card>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TabPanel>
                                </TabsBody>
                            </Tabs>
                        </>
                    )}
                </CardBody>
            </Card>

            {/* Asset Return Form Modal */}
            <Dialog
                open={showReturnModal}
                handler={handleReturnModalClose}
                size="md"
            >
                <DialogHeader className="flex items-center gap-2">
                    <ArrowPathIcon className="h-6 w-6 text-orange-500" />
                    Return Asset: {selectedAsset?.name}
                </DialogHeader>
                <DialogBody className="space-y-4">
                    <Alert color="blue" className="mb-4">
                        <Typography variant="small">
                            Please provide the return condition and any additional notes. Face verification will be required to complete the return process.
                        </Typography>
                    </Alert>

                    <div className="space-y-4">
                        <Select
                            label="Asset Condition"
                            value={returnFormData.return_condition}
                            onChange={(value) => setReturnFormData(prev => ({ ...prev, return_condition: value }))}
                            required
                        >
                            <Option value="">Select Condition</Option>
                            <Option value="Good">Good - No issues</Option>
                            <Option value="Fair">Fair - Minor wear</Option>
                            <Option value="Damaged">Damaged - Needs repair</Option>
                            <Option value="Broken">Broken - Not functional</Option>
                        </Select>

                        {(returnFormData.return_condition === 'Damaged' || returnFormData.return_condition === 'Broken') && (
                            <Textarea
                                label="Damage Description"
                                name="damage_notes"
                                value={returnFormData.damage_notes}
                                onChange={handleInputChange}
                                placeholder="Describe the damage or issues with the asset..."
                                rows={3}
                            />
                        )}

                        <Textarea
                            label="Additional Notes (Optional)"
                            name="notes"
                            value={returnFormData.notes}
                            onChange={handleInputChange}
                            placeholder="Any additional information about the return..."
                            rows={3}
                        />
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="red"
                        onClick={handleReturnModalClose}
                        className="mr-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleReturnFormSubmit}
                        disabled={!returnFormData.return_condition}
                        className="flex items-center gap-2"
                    >
                        <CameraIcon className="h-4 w-4" />
                        Proceed to Face Verification
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* Face Recognition Modal for Asset Return */}
            <FaceRecognitionComponent
                open={showFaceModal}
                mode="verify"
                employeeId={employee?.id}
                employeeName={employee?.name}
                onClose={handleReturnModalClose}
                onSuccess={handleFaceVerificationSuccess}
                onError={handleFaceVerificationError}
                title={`Verify Identity - Returning ${selectedAsset?.name}`}
                loading={returnLoading}
            />
        </>
    );
}

export default EmployeeProfile;