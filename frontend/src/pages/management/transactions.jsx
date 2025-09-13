// frontend/src/pages/management/transactions.jsx (fixed)
import React, { useState, useEffect } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    Button,
    Chip,
    IconButton,
    Input,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Select,
    Option,
    Alert,
    Textarea,
    Switch,
} from "@material-tailwind/react";
import { 
    PlusIcon, 
    EyeIcon, 
    MagnifyingGlassIcon, 
    ArrowRightIcon, 
    ArrowLeftIcon,
    CameraIcon 
} from "@heroicons/react/24/outline";
import { transactionAPI, assetAPI, employeeAPI, departmentAPI } from "@/lib/assetApi";

export function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [assets, setAssets] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedType, setSelectedType] = useState("");

    // NEW: prevent double-loading (StrictMode)
    const [mounted, setMounted] = useState(false);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        asset: "",
        employee: "",
        transaction_type: "issue",
        notes: "",
        face_verification_success: false,
        return_condition: "",
        damage_notes: "",
    });
    const [formLoading, setFormLoading] = useState(false);
    const [faceVerificationInProgress, setFaceVerificationInProgress] = useState(false);
    const [capturedFaceData, setCapturedFaceData] = useState(null);
    const [videoRef, setVideoRef] = useState(null);
    const [stream, setStream] = useState(null);

    const transactionTypeColors = {
        issue: "green",
        return: "orange",
    };

    // NEW: one-shot initializer like assets.jsx
    useEffect(() => {
        if (!mounted) {
            setMounted(true);
            initializeData();
        }
    }, [mounted]);

    const initializeData = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchTransactions(), fetchAssets(), fetchEmployees(), fetchDepartments()]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const params = {};
            if (selectedDepartment) params.asset__department = selectedDepartment;
            if (selectedType) params.transaction_type = selectedType;
            if (searchTerm) params.search = searchTerm;

            const response = await transactionAPI.getAll(params);
            setTransactions(response.results || response);
        } catch (err) {
            setError("Failed to fetch transactions");
            console.error(err);
        }
    };

    const fetchAssets = async () => {
        try {
            const response = await assetAPI.getAll();
            setAssets(response.results || response);
        } catch (err) {
            console.error("Failed to fetch assets:", err);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await employeeAPI.getAll();
            setEmployees(response.results || response);
        } catch (err) {
            console.error("Failed to fetch employees:", err);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await departmentAPI.getAll();
            setDepartments(response.results || response);
        } catch (err) {
            console.error("Failed to fetch departments:", err);
        }
    };

    // Debounced search/filter effect — skip until mounted
    useEffect(() => {
        if (!mounted) return;
        const timer = setTimeout(() => {
            fetchTransactions();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedDepartment, selectedType, mounted]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    // Face verification functions
    const startFaceVerification = async () => {
        setFaceVerificationInProgress(true);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef) {
                videoRef.srcObject = mediaStream;
            }
            setShowFaceModal(true);
        } catch (error) {
            setError("Failed to access camera for face verification");
            setFaceVerificationInProgress(false);
        }
    };

    const captureFaceData = async () => {
        if (!videoRef) return;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = videoRef.videoWidth;
        canvas.height = videoRef.videoHeight;
        context.drawImage(videoRef, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedFaceData(imageData);
        
        // Stop the video stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowFaceModal(false);
        
        await simulateFaceVerification(imageData);
    };

    const simulateFaceVerification = async (faceData) => {
        try {
            const selectedEmployee = employees.find(emp => emp.id.toString() === formData.employee);
            if (selectedEmployee && selectedEmployee.face_recognition_data) {
                const verificationSuccess = Math.random() > 0.3; // demo only
                setFormData(prev => ({
                    ...prev,
                    face_verification_success: verificationSuccess
                }));
                if (!verificationSuccess) {
                    setError("Face verification failed. The captured face does not match the employee's registered face.");
                } else {
                    setError("");
                }
            } else {
                setError("Employee does not have face recognition data registered.");
                setFormData(prev => ({
                    ...prev,
                    face_verification_success: false
                }));
            }
        } catch (error) {
            setError("Face verification service error");
            setFormData(prev => ({
                ...prev,
                face_verification_success: false
            }));
        }
        setFaceVerificationInProgress(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.employee && !formData.face_verification_success) {
            setError("Face verification is required and must be successful before creating a transaction.");
            return;
        }

        setFormLoading(true);
        setError("");

        try {
            await transactionAPI.create(formData);
            setShowAddModal(false);
            setFormData({
                asset: "",
                employee: "",
                transaction_type: "issue",
                notes: "",
                face_verification_success: false,
                return_condition: "",
                damage_notes: "",
            });
            setCapturedFaceData(null);
            await fetchTransactions();
        } catch (err) {
            setError(err.message || "Failed to create transaction");
        } finally {
            setFormLoading(false);
        }
    };

    const handleViewTransaction = async (transaction) => {
        try {
            const response = await transactionAPI.getById(transaction.id);
            setSelectedTransaction(response);
            setShowViewModal(true);
        } catch (err) {
            setError("Failed to fetch transaction details");
        }
    };

    // Filter assets based on transaction type
    const getAvailableAssets = () => {
        if (formData.transaction_type === "issue") {
            return assets.filter(asset => asset.status === "available");
        } else {
            return assets.filter(asset => asset.status === "assigned");
        }
    };

    // Filter employees based on selected asset for returns
    const getAvailableEmployees = () => {
        if (formData.transaction_type === "return" && formData.asset) {
            const selectedAsset = assets.find(a => a.id.toString() === formData.asset);
            return selectedAsset?.current_holder
                ? employees.filter(emp => emp.id === selectedAsset.current_holder)
                : [];
        }
        return employees;
    };

    const handleModalClose = () => {
        setShowAddModal(false);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowFaceModal(false);
        setCapturedFaceData(null);
        setError("");
        setFormData({
            asset: "",
            employee: "",
            transaction_type: "issue",
            notes: "",
            face_verification_success: false,
            return_condition: "",
            damage_notes: "",
        });
    };

    // (Optional) cleanup on unmount to avoid camera leak in StrictMode
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
            <Card>
                <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
                    <div className="flex items-center justify-between">
                        <Typography variant="h6" color="white">
                            Asset Transactions
                        </Typography>
                        <Button
                            className="flex items-center gap-3"
                            size="sm"
                            onClick={() => setShowAddModal(true)}
                        >
                            <PlusIcon strokeWidth={2} className="h-4 w-4" />
                            New Transaction
                        </Button>
                    </div>
                </CardHeader>

                <CardBody className="px-0 pt-0 pb-2">
                    {error && (
                        <Alert color="red" className="mb-6 mx-6">
                            {error}
                        </Alert>
                    )}

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6 px-6">
                        <div className="w-full md:w-72">
                            <Input
                                label="Search transactions..."
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Select
                                label="Filter by Department"
                                value={selectedDepartment}
                                onChange={(value) => setSelectedDepartment(value)}
                            >
                                <Option value="">All Departments</Option>
                                {departments.map((dept) => (
                                    <Option key={dept.id} value={dept.id.toString()}>
                                        {dept.name}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div className="w-full md:w-48">
                            <Select
                                label="Filter by Type"
                                value={selectedType}
                                onChange={(value) => setSelectedType(value)}
                            >
                                <Option value="">All Types</Option>
                                <Option value="issue">Issue</Option>
                                <Option value="return">Return</Option>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-scroll">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {["Type", "Asset", "Employee", "Date", "Processed By", "Verification", "Actions"].map((el) => (
                                        <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction, key) => {
                                    const className = `py-3 px-5 ${key === transactions.length - 1 ? "" : "border-b border-blue-gray-50"}`;

                                    return (
                                        <tr key={transaction.id}>
                                            <td className={className}>
                                                <div className="flex items-center gap-2">
                                                    {transaction.transaction_type === "issue" ? (
                                                        <ArrowRightIcon className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <ArrowLeftIcon className="h-4 w-4 text-orange-500" />
                                                    )}
                                                    <Chip
                                                        variant="gradient"
                                                        color={transactionTypeColors[transaction.transaction_type]}
                                                        value={transaction.transaction_type.toUpperCase()}
                                                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                    />
                                                </div>
                                            </td>
                                            <td className={className}>
                                                <div>
                                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                                        {transaction.asset_name}
                                                    </Typography>
                                                    <Typography className="text-xs font-normal text-blue-gray-500">
                                                        SN: {transaction.asset_serial}
                                                    </Typography>
                                                </div>
                                            </td>
                                            <td className={className}>
                                                <div>
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {transaction.employee_name}
                                                    </Typography>
                                                    <Typography className="text-xs font-normal text-blue-gray-500">
                                                        ID: {transaction.employee_id}
                                                    </Typography>
                                                </div>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-normal text-blue-gray-500">
                                                    {new Date(transaction.transaction_date).toLocaleDateString()}
                                                    <br />
                                                    {new Date(transaction.transaction_date).toLocaleTimeString()}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-normal text-blue-gray-500">
                                                    {transaction.processed_by_name || "System"}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Chip
                                                    variant="gradient"
                                                    color={transaction.face_verification_success ? "green" : "red"}
                                                    value={transaction.face_verification_success ? "VERIFIED" : "NOT VERIFIED"}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </td>
                                            <td className={className}>
                                                <IconButton
                                                    variant="text"
                                                    color="blue-gray"
                                                    onClick={() => handleViewTransaction(transaction)}
                                                >
                                                    <EyeIcon className="h-4 w-4" />
                                                </IconButton>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            {/* Add Transaction Modal */}
            <Dialog open={showAddModal} handler={handleModalClose} size="md">
                <DialogHeader>Create New Transaction</DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        <Select
                            label="Transaction Type"
                            value={formData.transaction_type}
                            onChange={(value) => setFormData(prev => ({ ...prev, transaction_type: value }))}
                            required
                        >
                            <Option value="issue">Issue Asset</Option>
                            <Option value="return">Return Asset</Option>
                        </Select>

                        <Select
                            label="Asset"
                            value={formData.asset}
                            onChange={(value) => setFormData(prev => ({ ...prev, asset: value }))}
                            required
                        >
                            <Option value="">Select Asset</Option>
                            {getAvailableAssets().map((asset) => (
                                <Option key={asset.id} value={asset.id.toString()}>
                                    {asset.name} ({asset.serial_number}) - {asset.department_name}
                                </Option>
                            ))}
                        </Select>

                        <Select
                            label="Employee"
                            value={formData.employee}
                            onChange={(value) => setFormData(prev => ({ ...prev, employee: value }))}
                            required
                        >
                            <Option value="">Select Employee</Option>
                            {getAvailableEmployees().map((employee) => (
                                <Option key={employee.id} value={employee.id.toString()}>
                                    {employee.name} ({employee.employee_id}) - {employee.department_name}
                                </Option>
                            ))}
                        </Select>

                        {formData.employee && (
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CameraIcon className="h-5 w-5 text-blue-500" />
                                    <span className="text-sm">Face Verification</span>
                                    {formData.face_verification_success && (
                                        <Chip color="green" value="VERIFIED" className="text-xs" />
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    color={formData.face_verification_success ? "green" : "blue"}
                                    onClick={startFaceVerification}
                                    loading={faceVerificationInProgress}
                                    disabled={faceVerificationInProgress}
                                >
                                    {formData.face_verification_success ? "Re-verify" : "Verify Face"}
                                </Button>
                            </div>
                        )}

                        <Textarea
                            label="Notes (Optional)"
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                        />

                        {formData.transaction_type === "return" && (
                            <>
                                <Input
                                    label="Return Condition"
                                    name="return_condition"
                                    value={formData.return_condition}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Good, Fair, Damaged"
                                />
                                <Textarea
                                    label="Damage Notes (if any)"
                                    name="damage_notes"
                                    value={formData.damage_notes}
                                    onChange={handleInputChange}
                                />
                            </>
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={handleModalClose} className="mr-1">
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            loading={formLoading}
                            disabled={formData.employee && !formData.face_verification_success}
                        >
                            Create Transaction
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>

            {/* Face Verification Modal */}
            <Dialog open={showFaceModal} handler={() => setShowFaceModal(false)} size="md">
                <DialogHeader>Face Verification</DialogHeader>
                <DialogBody className="text-center">
                    <div className="mb-4">
                        <video
                            ref={setVideoRef}
                            autoPlay
                            muted
                            className="w-full max-w-md mx-auto rounded-lg border"
                        />
                    </div>
                    <Typography className="mb-4 text-sm text-gray-600">
                        Position your face in the camera frame and click capture to verify your identity.
                    </Typography>
                </DialogBody>
                <DialogFooter>
                    <Button variant="text" color="red" onClick={() => {
                        if (stream) {
                            stream.getTracks().forEach(track => track.stop());
                            setStream(null);
                        }
                        setShowFaceModal(false);
                    }} className="mr-1">
                        Cancel
                    </Button>
                    <Button onClick={captureFaceData}>
                        Capture & Verify
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* View Transaction Modal */}
            <Dialog open={showViewModal} handler={() => setShowViewModal(false)} size="lg">
                {selectedTransaction && (
                    <>
                        <DialogHeader>
                            Transaction Details - {selectedTransaction.transaction_type.toUpperCase()}
                        </DialogHeader>
                        <DialogBody className="max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="shadow-sm">
                                    <CardHeader color="blue" className="relative h-16">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Transaction Information
                                        </Typography>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Type:</span>
                                                <Chip
                                                    variant="gradient"
                                                    color={transactionTypeColors[selectedTransaction.transaction_type]}
                                                    value={selectedTransaction.transaction_type.toUpperCase()}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Date:</span>
                                                <span>{new Date(selectedTransaction.transaction_date).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Processed By:</span>
                                                <span>{selectedTransaction.processed_by_name || "System"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Face Verification:</span>
                                                <Chip
                                                    variant="gradient"
                                                    color={selectedTransaction.face_verification_success ? "green" : "red"}
                                                    value={selectedTransaction.face_verification_success ? "VERIFIED" : "NOT VERIFIED"}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card className="shadow-sm">
                                    <CardHeader color="green" className="relative h-16">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Asset & Employee Details
                                        </Typography>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Asset:</span>
                                                <span>{selectedTransaction.asset_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Serial Number:</span>
                                                <span>{selectedTransaction.asset_serial}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Employee:</span>
                                                <span>{selectedTransaction.employee_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Employee ID:</span>
                                                <span>{selectedTransaction.employee_id}</span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            {(selectedTransaction.notes || selectedTransaction.return_condition || selectedTransaction.damage_notes) && (
                                <Card className="mt-6 shadow-sm">
                                    <CardHeader color="orange" className="relative h-16">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Additional Information
                                        </Typography>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="space-y-3">
                                            {selectedTransaction.notes && (
                                                <div>
                                                    <span className="font-semibold">Notes:</span>
                                                    <p className="mt-1 text-sm text-gray-700">{selectedTransaction.notes}</p>
                                                </div>
                                            )}
                                            {selectedTransaction.return_condition && (
                                                <div className="flex justify-between">
                                                    <span className="font-semibold">Return Condition:</span>
                                                    <span>{selectedTransaction.return_condition}</span>
                                                </div>
                                            )}
                                            {selectedTransaction.damage_notes && (
                                                <div>
                                                    <span className="font-semibold">Damage Notes:</span>
                                                    <p className="mt-1 text-sm text-gray-700">{selectedTransaction.damage_notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            )}
                        </DialogBody>
                        <DialogFooter>
                            <Button onClick={() => setShowViewModal(false)}>Close</Button>
                        </DialogFooter>
                    </>
                )}
            </Dialog>
        </div>
    );
}

export default Transactions;
