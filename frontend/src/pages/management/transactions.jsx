import React, { useState, useEffect, useCallback } from "react";
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
} from "@material-tailwind/react";
import {
    PlusIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    CameraIcon,
    CheckCircleIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import { transactionAPI, assetAPI, employeeAPI, departmentAPI, formatters } from "@/lib/assetApi";
import FaceRecognitionComponent from "../../components/FaceRecognitionComponent";

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
    const [mounted, setMounted] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(Number(import.meta.env.VITE_PAGE_SIZE || 15));
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Modal states - explicitly managing each modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [selectedEmployeeForVerification, setSelectedEmployeeForVerification] = useState(null);

    // Search states for dropdowns
    const [assetSearchTerm, setAssetSearchTerm] = useState("");
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");

    // Form states
    const [formData, setFormData] = useState({
        asset: "",
        employee: "",
        transaction_type: "issue",
        notes: "",
        face_verification_success: false,
        return_condition: "",
    });
    const [formLoading, setFormLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [capturedFaceData, setCapturedFaceData] = useState(null);

    const transactionTypeColors = {
        issue: "green",
        return: "orange",
    };
    const transactionTypeLabels = {
        issue: "Assign",
        return: "Return",
    };

    // Return condition options
    const returnConditionOptions = [
        { value: "excellent", label: "Excellent" },
        { value: "good", label: "Good" },
        { value: "fair", label: "Fair" },
        { value: "poor", label: "Poor" },
        { value: "damaged", label: "Damaged" },
    ];

    // Initialize data
    useEffect(() => {
        if (!mounted) {
            setMounted(true);
            initializeData();
        }
    }, [mounted]);

    const initializeData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchTransactions(),
                fetchAssets(),
                fetchEmployees(),
                fetchDepartments()
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const params = { page, page_size: pageSize };
            if (selectedDepartment) params.asset__department = selectedDepartment;
            if (selectedType) params.transaction_type = selectedType;
            if (searchTerm) params.search = searchTerm;

            const response = await transactionAPI.getAll(params);
            const dataArray = Array.isArray(response) ? response : (response.results || []);
            setTransactions(dataArray);

            setTotalPages(Number(response?.total_pages || 1));
            setTotalCount(Number(response?.count || dataArray.length));
            setPage(Number(response?.current_page || 1));
            setError(""); 
        } catch (err) {
            const status = err?.response?.status ?? err?.status;

            if (status === 404 && page > 1) {
                try {
                    const fallback = await transactionAPI.getAll({
                        page: 1,
                        page_size: pageSize,
                        ...(selectedDepartment ? { asset__department: selectedDepartment } : {}),
                        ...(selectedType ? { transaction_type: selectedType } : {}),
                        ...(searchTerm ? { search: searchTerm } : {}),
                    });

                    const dataArray = Array.isArray(fallback) ? fallback : (fallback.results || []);
                    setTransactions(dataArray);
                    setTotalPages(Number(fallback?.total_pages || 1));
                    setTotalCount(Number(fallback?.count || dataArray.length));
                    setPage(Number(fallback?.current_page || 1));
                    setError(""); 
                    return;
                } catch (e2) {
                }
            }

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

    useEffect(() => {
        if (!mounted) return;

        const timer = setTimeout(() => {
            if (page !== 1) {
                setPage(1);
            } else {
                fetchTransactions();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, selectedDepartment, selectedType, mounted]);

    useEffect(() => {
        if (!mounted) return;
        fetchTransactions();
    }, [page]);


    //Pager helpers
    const canPrev = page > 1;
    const canNext = page < totalPages;
    const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(page * pageSize, totalCount);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));

        // Reset face verification when employee changes
        if (name === 'employee') {
            setFormData(prev => ({
                ...prev,
                face_verification_success: false
            }));
            setVerificationResult(null);
            setCapturedFaceData(null);
        }
    };

    // Face verification handlers with proper modal management (FIXED LOGIC)
    const handleFaceVerificationSuccess = useCallback(async (result) => {
        console.log('Face verification success:', result);

        setVerificationResult(result);
        // Store the actual face image data that was used for verification
        setCapturedFaceData(result.face_image_data || result.capturedImage || null);
        setFormData(prev => ({
            ...prev,
            face_verification_success: result.success
        }));
        setShowFaceModal(false);
        setSelectedEmployeeForVerification(null);
        setError("");

        // Show success message
        // setTimeout(() => {
        //     alert(`Face verification successful! Confidence: ${formatters.formatConfidence(result.confidence)}`);
        // }, 100);
    }, []);

    const handleFaceVerificationError = useCallback((error) => {
        console.log('Face verification error:', error);

        setVerificationResult(error);
        setFormData(prev => ({
            ...prev,
            face_verification_success: false
        }));
        setShowFaceModal(false);
        setSelectedEmployeeForVerification(null);
        setError(error.error || "Face verification failed");
    }, []);

    const handleFaceModalClose = useCallback(() => {
        console.log('Face modal close called');
        setShowFaceModal(false);
        setSelectedEmployeeForVerification(null);
    }, []);

    const startFaceVerification = useCallback(() => {
        if (!formData.employee) {
            setError("Please select an employee first");
            return;
        }

        const selectedEmployee = employees.find(emp => emp.id.toString() === formData.employee);
        if (!selectedEmployee?.has_face_data) {
            setError("Employee does not have face recognition data registered. Please register face data first.");
            return;
        }

        console.log('Starting face verification for:', selectedEmployee.name);

        // Store the employee for verification but DON'T close the transaction modal
        setSelectedEmployeeForVerification(selectedEmployee);
        setError("");

        // Small delay to ensure state is updated
        setTimeout(() => {
            setShowFaceModal(true);
        }, 100);
    }, [formData.employee, employees]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate face verification requirement
        if (formData.employee && !formData.face_verification_success) {
            setError("Face verification is required and must be successful before creating a transaction.");
            return;
        }

        // Ensure we have face verification data if verification was successful
        if (formData.face_verification_success && !capturedFaceData) {
            setError("Face verification data is missing. Please verify face again.");
            return;
        }

        setFormLoading(true);
        setError("");

        try {
            // Create transaction with face verification data
            const transactionData = {
                ...formData,
                face_verification_data: capturedFaceData // This should contain the base64 image data
            };

            console.log('Creating transaction with data:', {
                ...transactionData,
                face_verification_data: capturedFaceData ? 'IMAGE_DATA_PRESENT' : null
            });

            await transactionAPI.create(transactionData);

            resetForm();
            handleModalClose();
            await fetchTransactions();

            // Show success message
            // setTimeout(() => {
            //     alert('Transaction created successfully!');
            // }, 100);

        } catch (err) {
            console.error('Transaction creation error:', err);

            let errorMessage = "Failed to create transaction";
            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data;
                } else if (err.response.data.detail) {
                    errorMessage = err.response.data.detail;
                } else if (err.response.data.error) {
                    errorMessage = err.response.data.error;
                } else {
                    // Handle field-specific errors
                    const errors = [];
                    Object.keys(err.response.data).forEach(field => {
                        if (Array.isArray(err.response.data[field])) {
                            errors.push(`${field}: ${err.response.data[field].join(', ')}`);
                        } else {
                            errors.push(`${field}: ${err.response.data[field]}`);
                        }
                    });
                    errorMessage = errors.join('; ') || errorMessage;
                }
            }

            setError(errorMessage);
        } finally {
            setFormLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            asset: "",
            employee: "",
            transaction_type: "issue",
            notes: "",
            face_verification_success: false,
            return_condition: "",
        });
        setVerificationResult(null);
        setCapturedFaceData(null);
        setError("");
        setAssetSearchTerm("");
        setEmployeeSearchTerm("");
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

    const handleModalClose = () => {
        // Ensure camera is stopped when modal is closed
        if (showFaceModal) {
            setShowFaceModal(false);
            setSelectedEmployeeForVerification(null);
        }

        setShowAddModal(false);
        setShowViewModal(false);
        resetForm();
    };

    const getFilteredAssets = () => {
        let filteredAssets;

        if (formData.transaction_type === "issue") {
            filteredAssets = assets.filter(asset => asset.status === "available");
        } else {
            filteredAssets = assets.filter(asset => asset.status === "assigned");
        }

        if (assetSearchTerm) {
            const searchLower = assetSearchTerm.toLowerCase();
            filteredAssets = filteredAssets.filter(asset =>
                asset.name.toLowerCase().includes(searchLower) ||
                asset.serial_number.toLowerCase().includes(searchLower) ||
                asset.department_name.toLowerCase().includes(searchLower)
            );
        }

        return filteredAssets;
    };

    const getFilteredEmployees = () => {
        let filteredEmployees;

        if (formData.transaction_type === "return" && formData.asset) {
            const selectedAsset = assets.find(a => a.id.toString() === formData.asset);
            filteredEmployees = selectedAsset?.current_holder
                ? employees.filter(emp => emp.id === selectedAsset.current_holder)
                : [];
        } else {
            filteredEmployees = employees.filter(emp => emp.is_active);
        }

        if (employeeSearchTerm) {
            const searchLower = employeeSearchTerm.toLowerCase();
            filteredEmployees = filteredEmployees.filter(employee =>
                employee.name.toLowerCase().includes(searchLower) ||
                employee.employee_id.toLowerCase().includes(searchLower) ||
                employee.department_name.toLowerCase().includes(searchLower)
            );
        }

        return filteredEmployees;
    };

    const getSelectedEmployee = () => {
        return employees.find(emp => emp.id.toString() === formData.employee);
    };

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
                                value={selectedDepartment ?? ""}
                                onChange={(value) => setSelectedDepartment(value ?? "")}
                                selected={(element) => {
                                    if (React.isValidElement(element) && element.props?.children != null) {
                                        return element.props.children;
                                    }

                                    const rawValue =
                                        (typeof element === "string" || typeof element === "number")
                                            ? String(element)
                                            : (selectedDepartment ?? "");

                                    if (!rawValue) return "All Departments";

                                    const d = departments.find(dep => dep.id.toString() === rawValue);
                                    return d ? d.name : "All Departments";
                                }}
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
                                <Option value="issue">Assign</Option>
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
                                                        value={transactionTypeLabels[transaction.transaction_type] ?? "—"}
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
                                                    {formatters.formatDate(transaction.transaction_date)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-normal text-blue-gray-500">
                                                    {transaction.processed_by_name || "System"}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <div className="flex items-center gap-1">
                                                    {transaction.face_verification_success ? (
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <XCircleIcon className="h-4 w-4 text-red-500" />
                                                    )}
                                                    <Chip
                                                        variant="gradient"
                                                        color={transaction.face_verification_success ? "green" : "red"}
                                                        value={transaction.face_verification_success ? "VERIFIED" : "NOT VERIFIED"}
                                                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                    />
                                                </div>
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
                    {/* Pager */}
                    <div className="flex items-center justify-between px-6 pb-2 text-sm text-blue-gray-600">
                        <span>
                            Showing <b>{rangeStart}</b>–<b>{rangeEnd}</b> of <b>{totalCount}</b>
                        </span>
                        <div className="flex items-center gap-2">
                            <Button variant="text" size="sm" onClick={() => setPage(1)} disabled={!canPrev}>First</Button>
                            <Button variant="text" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!canPrev}>Prev</Button>
                            <span className="px-2">Page <b>{page}</b> of <b>{totalPages}</b></span>
                            <Button variant="text" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={!canNext}>Next</Button>
                            <Button variant="text" size="sm" onClick={() => setPage(totalPages)} disabled={!canNext}>Last</Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Add Transaction Modal */}
            <Dialog open={showAddModal && !showFaceModal} handler={handleModalClose} size="md">
                <DialogHeader>Create New Transaction</DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                        <Select
                            label="Transaction Type"
                            value={formData.transaction_type}
                            onChange={(value) => setFormData(prev => ({
                                ...prev,
                                transaction_type: value,
                                asset: "", // Reset asset when type changes
                                employee: "", // Reset employee when type changes
                                face_verification_success: false
                            }))}
                            required
                        >
                            <Option value="issue">Assign Asset</Option>
                            <Option value="return">Return Asset</Option>
                        </Select>

                        {/* Searchable Asset Select */}
                        <div>
                            <Select
                                label={`Asset (${formData.transaction_type === 'issue' ? 'Available Only' : 'Assigned Only'})`}
                                value={formData.asset ?? ""}
                                onChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        asset: value ?? "",
                                        employee: formData.transaction_type === "return" ? "" : prev.employee,
                                        face_verification_success: false,
                                    }))
                                }
                                required
                                selected={(element) => {
                                    if (React.isValidElement(element) && element.props?.children != null) {
                                        return element.props.children;
                                    }
                                    const raw =
                                        typeof element === "string" || typeof element === "number"
                                            ? String(element)
                                            : formData.asset ?? "";
                                    if (!raw) return "Select Asset";

                                    const list = getFilteredAssets();
                                    const a =
                                        list.find((as) => as.id.toString() === raw) ||
                                        assets.find((as) => as.id.toString() === raw);
                                    if (!a) return "Select Asset";

                                    let label = `${a.name} (${a.serial_number})`;
                                    if (formData.transaction_type === "return" && a.current_holder) {
                                        const holder = employees.find((emp) => emp.id === a.current_holder);
                                        label += ` - ${holder?.name || "Unknown"}`;
                                    }
                                    return label;
                                }}
                                menuProps={{
                                    className: "max-h-48 overflow-y-auto"
                                }}
                            >
                                <Option
                                    value="__search"
                                    className="sticky top-0 z-10 bg-white cursor-default pointer-events-none"
                                >
                                    <div
                                        className="p-2 border-b border-gray-200 pointer-events-auto"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    >
                                        <Input
                                            placeholder="Search assets..."
                                            value={assetSearchTerm}
                                            onChange={(e) => setAssetSearchTerm(e.target.value)}
                                            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
                                            size="sm"
                                            className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                                            labelProps={{ className: "hidden" }}
                                        />
                                    </div>
                                </Option>

                                <Option value="">Select Asset</Option>
                                {getFilteredAssets().map((asset) => (
                                    <Option key={asset.id} value={asset.id.toString()}>
                                        <div>
                                            <div className="font-medium">
                                                {asset.name} ({asset.serial_number})
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {asset.department_name}
                                                {formData.transaction_type === "return" && asset.current_holder && (
                                                    <> • Currently with: {employees.find((emp) => emp.id === asset.current_holder)?.name || "Unknown"}</>
                                                )}
                                            </div>
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                            <Typography variant="small" color="gray" className="mt-1">
                                {formData.transaction_type === 'issue'
                                    ? `${getFilteredAssets().length} available assets found`
                                    : `${getFilteredAssets().length} assigned assets found`
                                }
                            </Typography>
                        </div>

                        {/* Searchable Employee Select */}
                        <div>
                            <Select
                                label="Employee"
                                value={formData.employee ?? ""}
                                onChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        employee: value ?? "",
                                        face_verification_success: false,
                                    }))
                                }
                                required
                                selected={(element) => {
                                    if (React.isValidElement(element) && element.props?.children != null) {
                                        return element.props.children;
                                    }
                                    const raw =
                                        typeof element === "string" || typeof element === "number"
                                            ? String(element)
                                            : formData.employee ?? "";
                                    if (!raw) return "Select Employee";

                                    const list = getFilteredEmployees();
                                    const e =
                                        list.find((emp) => emp.id.toString() === raw) ||
                                        employees.find((emp) => emp.id.toString() === raw);
                                    if (!e) return "Select Employee";

                                    return `${e.name} (${e.employee_id}) ${e.has_face_data ? " 🔒" : " ⚠️"}`;
                                }}
                                menuProps={{ className: "max-h-48 overflow-y-auto" }}
                            >
                                {/* SEARCH ROW (interactive, not selectable) */}
                                <Option
                                    value="__search"
                                    className="sticky top-0 z-10 bg-white cursor-default pointer-events-none"
                                >
                                    <div
                                        className="p-2 border-b border-gray-200 pointer-events-auto"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    >
                                        <Input
                                            placeholder="Search employees..."
                                            value={employeeSearchTerm}
                                            onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                                            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
                                            size="sm"
                                            className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                                            labelProps={{ className: "hidden" }}
                                        />
                                    </div>
                                </Option>

                                <Option value="">Select Employee</Option>
                                {getFilteredEmployees().map((employee) => (
                                    <Option key={employee.id} value={employee.id.toString()}>
                                        <div>
                                            <div className="font-medium flex items-center gap-1">
                                                {employee.name} ({employee.employee_id})
                                                {employee.has_face_data ? " 🔒" : " ⚠️"}
                                            </div>
                                            <div className="text-xs text-gray-500">{employee.department_name}</div>
                                        </div>
                                    </Option>
                                ))}
                            </Select>

                            <Typography variant="small" color="gray" className="mt-1">
                                {formData.transaction_type === 'return' && formData.asset
                                    ? "Showing employee currently assigned to this asset"
                                    : `${getFilteredEmployees().length} active employees found`
                                }
                            </Typography>
                        </div>

                        {/* Face Verification Section */}
                        {formData.employee && (
                            <Card className="p-4 border border-blue-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <CameraIcon className="h-5 w-5 text-blue-500" />
                                        <Typography variant="h6" color="blue-gray">
                                            Face Verification
                                        </Typography>
                                        <Chip
                                            color="red"
                                            value="REQUIRED"
                                            className="text-xs"
                                        />
                                    </div>
                                    {formData.face_verification_success && (
                                        <Chip
                                            color="green"
                                            value="VERIFIED"
                                            icon={<CheckCircleIcon className="h-4 w-4" />}
                                        />
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Typography variant="small" color="gray">
                                            Employee: {getSelectedEmployee()?.name}
                                        </Typography>
                                        <Typography variant="small" color={getSelectedEmployee()?.has_face_data ? "green" : "red"}>
                                            {getSelectedEmployee()?.has_face_data ? "Face data available ✓" : "No face data ⚠️"}
                                        </Typography>
                                    </div>

                                    {getSelectedEmployee()?.has_face_data ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Button
                                                    size="sm"
                                                    color={formData.face_verification_success ? "green" : "blue"}
                                                    onClick={startFaceVerification}
                                                    className="flex items-center gap-2"
                                                >
                                                    <CameraIcon className="h-4 w-4" />
                                                    {formData.face_verification_success ? "Re-verify Face" : "Verify Face"}
                                                </Button>

                                                {verificationResult && (
                                                    <Typography variant="small" color={verificationResult.success ? "green" : "red"}>
                                                        {verificationResult.success ?
                                                            `Confidence: ${formatters.formatConfidence(verificationResult.confidence)}` :
                                                            "Verification failed"
                                                        }
                                                    </Typography>
                                                )}
                                            </div>

                                            {!formData.face_verification_success && (
                                                <Alert color="orange">
                                                    <Typography variant="small">
                                                        Face verification is required before creating the transaction.
                                                        Click the "Verify Face" button above to proceed.
                                                    </Typography>
                                                </Alert>
                                            )}

                                            {verificationResult && !verificationResult.success && (
                                                <Alert color="red">
                                                    <Typography variant="small">
                                                        Face verification failed: {verificationResult.error}
                                                        {verificationResult.confidence && (
                                                            ` (Confidence: ${formatters.formatConfidence(verificationResult.confidence)}, Required: ${((verificationResult.threshold || 0.6) * 100).toFixed(0)}%)`
                                                        )}
                                                    </Typography>
                                                </Alert>
                                            )}
                                        </div>
                                    ) : (
                                        <Alert color="amber">
                                            <Typography variant="small">
                                                This employee doesn't have face recognition data registered.
                                                Please register face data in the employee management section first.
                                            </Typography>
                                        </Alert>
                                    )}
                                </div>
                            </Card>
                        )}

                        <Textarea
                            label="Notes (Optional)"
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                        />

                        {formData.transaction_type === "return" && (
                            <Select
                                label="Return Condition"
                                value={formData.return_condition ?? ""}
                                onChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        return_condition: value ?? "",
                                    }))
                                }
                                required={formData.transaction_type === "return"}
                                selected={(element) => {
                                    // If MTW passes the selected <Option/>, show its children
                                    if (React.isValidElement(element) && element.props?.children != null) {
                                        return element.props.children;
                                    }
                                    // Fallback: map stored value -> label
                                    const v =
                                        typeof element === "string" || typeof element === "number"
                                            ? String(element)
                                            : formData.return_condition ?? "";
                                    if (!v) return "Select Condition";
                                    return (
                                        returnConditionOptions.find((o) => o.value === v)?.label ||
                                        "Select Condition"
                                    );
                                }}
                            >
                                {/* Make placeholder non-selectable to avoid “sticking” */}
                                <Option value="" disabled>
                                    Select Condition
                                </Option>

                                {returnConditionOptions.map((option) => (
                                    <Option key={option.value} value={option.value}>
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>

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
                            color={formData.face_verification_success ? "green" : "gray"}
                        >
                            {formData.face_verification_success ? "Create Transaction" : "Verification Required"}
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>

            {/* Face Verification Modal - Rendered separately with proper state management */}
            {selectedEmployeeForVerification && (
                <FaceRecognitionComponent
                    open={showFaceModal}
                    mode="verify"
                    employeeId={selectedEmployeeForVerification.id}
                    employeeName={selectedEmployeeForVerification.name}
                    onClose={handleFaceModalClose}
                    onSuccess={handleFaceVerificationSuccess}
                    onError={handleFaceVerificationError}
                />
            )}

            {/* View Transaction Modal */}
            <Dialog open={showViewModal} handler={() => setShowViewModal(false)} size="lg">
                {selectedTransaction && (
                    <>
                        <DialogHeader>
                            Transaction Details - {transactionTypeLabels[selectedTransaction.transaction_type] ?? "—"}
                        </DialogHeader>

                        <DialogBody className="max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Transaction Info */}
                                <Card className="shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader floated={false} shadow={false} className="bg-blue-600 px-5 py-3">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Transaction Information
                                        </Typography>
                                    </CardHeader>
                                    <CardBody className="p-6">
                                        <dl className="divide-y divide-gray-100">
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Type</dt>
                                                <dd className="col-span-3 flex justify-end">
                                                    <Chip
                                                        variant="gradient"
                                                        color={transactionTypeColors[selectedTransaction.transaction_type] ?? "gray"}
                                                        value={transactionTypeLabels[selectedTransaction.transaction_type] ?? "—"}
                                                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                    />
                                                </dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Date</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                    {formatters.formatDate(selectedTransaction.transaction_date)}
                                                </dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Processed By</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                    {selectedTransaction.processed_by_name || "System"}
                                                </dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Face Verification</dt>
                                                <dd className="col-span-3 flex items-center justify-end gap-1">
                                                    {selectedTransaction.face_verification_success ? (
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <XCircleIcon className="h-4 w-4 text-red-500" />
                                                    )}
                                                    <Chip
                                                        variant="gradient"
                                                        color={selectedTransaction.face_verification_success ? "green" : "red"}
                                                        value={selectedTransaction.face_verification_success ? "VERIFIED" : "NOT VERIFIED"}
                                                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                    />
                                                </dd>
                                            </div>
                                            {selectedTransaction.face_verification_confidence > 0 && (
                                                <div className="grid grid-cols-5 items-center py-2">
                                                    <dt className="col-span-2 text-sm font-medium text-gray-600">Confidence</dt>
                                                    <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                        {formatters.formatConfidence(selectedTransaction.face_verification_confidence)}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>
                                    </CardBody>
                                </Card>

                                {/* Asset & Employee */}
                                <Card className="shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader floated={false} shadow={false} className="bg-green-600 px-5 py-3">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Asset & Employee Details
                                        </Typography>
                                    </CardHeader>
                                    <CardBody className="p-6">
                                        <dl className="divide-y divide-gray-100">
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Asset</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{selectedTransaction.asset_name}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Serial Number</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{selectedTransaction.asset_serial}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Employee</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{selectedTransaction.employee_name}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Employee ID</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{selectedTransaction.employee_id}</dd>
                                            </div>
                                        </dl>
                                    </CardBody>
                                </Card>
                            </div>

                            {(selectedTransaction.notes || selectedTransaction.return_condition) && (
                                <Card className="mt-6 shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader floated={false} shadow={false} className="bg-orange-500 px-5 py-3">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Additional Information
                                        </Typography>
                                    </CardHeader>
                                    <CardBody className="p-6">
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
                                                    <Chip
                                                        color={
                                                            selectedTransaction.return_condition === "excellent" ? "green" :
                                                                selectedTransaction.return_condition === "good" ? "blue" :
                                                                    selectedTransaction.return_condition === "fair" ? "orange" :
                                                                        selectedTransaction.return_condition === "poor" ? "amber" : "red"
                                                        }
                                                        value={selectedTransaction.return_condition.toUpperCase()}
                                                        className="text-xs"
                                                    />
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