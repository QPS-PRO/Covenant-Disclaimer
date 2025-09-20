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
} from "@material-tailwind/react";
import {
    PlusIcon,
    PencilIcon,
    EyeIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { assetAPI, departmentAPI, employeeAPI } from "@/lib/assetApi";

export function Assets() {
    const [assets, setAssets] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");

    // pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(Number(import.meta.env.VITE_PAGE_SIZE || 15));
    const [totalCount, setTotalCount] = useState(0);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        serial_number: "",
        department: "",
        status: "available",
        current_holder: "",
        description: "",
        purchase_date: "",
        purchase_cost: "",
    });
    const [formLoading, setFormLoading] = useState(false);

    // Prevent double loading
    const [mounted, setMounted] = useState(false);

    // Status options
    const statusOptions = [
        { value: "available", label: "Available", color: "green" },
        { value: "assigned", label: "Assigned", color: "blue" },
        { value: "maintenance", label: "Under Maintenance", color: "orange" },
        { value: "retired", label: "Retired", color: "red" },
    ];

    useEffect(() => {
        if (!mounted) {
            setMounted(true);
            initializeData();
        }
    }, [mounted]);

    const initializeData = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchAssets(), fetchDepartments(), fetchEmployees()]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssets = async () => {
        try {
            const params = { page, page_size: pageSize };
            if (selectedDepartment) params.department = selectedDepartment;
            if (selectedStatus) params.status = selectedStatus;
            if (searchTerm) params.search = searchTerm;

            const response = await assetAPI.getAll(params);
            const dataArray = Array.isArray(response) ? response : (response.results || []);
            setAssets(dataArray);

            setTotalPages(Number(response?.total_pages || 1));
            setTotalCount(Number(response?.count || dataArray.length));
            setPage(Number(response?.current_page || 1));
            setError("");
        } catch (err) {
            if (!mounted) return;
            const status = err?.response?.status ?? err?.status;

            if (status === 404 && page > 1) {
                try {
                    const fallback = await assetAPI.getAll({
                        page: 1,
                        page_size: pageSize,
                        ...(selectedDepartment ? { department: selectedDepartment } : {}),
                        ...(selectedStatus ? { status: selectedStatus } : {}),
                        ...(searchTerm ? { search: searchTerm } : {}),
                    });
                    const dataArray = Array.isArray(fallback) ? fallback : (fallback.results || []);
                    setAssets(dataArray);
                    setTotalPages(Number(fallback?.total_pages || 1));
                    setTotalCount(Number(fallback?.count || dataArray.length));
                    setPage(Number(fallback?.current_page || 1));
                    setError(""); 
                    return;
                } catch (e2) {
                }
            }

            setError("Failed to fetch assets");
            console.error(err);
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

    const fetchEmployees = async () => {
        try {
            const response = await employeeAPI.getAll();
            setEmployees(response.results || response);
        } catch (err) {
            console.error("Failed to fetch employees:", err);
        }
    };

    useEffect(() => {
        if (!mounted) return;

        const timer = setTimeout(() => {
            if (page !== 1) {
                setPage(1);      
            } else {
                fetchAssets();   
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, selectedDepartment, selectedStatus, mounted]);


    useEffect(() => {
        if (!mounted) return;
        fetchAssets();
    }, [page]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            status: value,
            current_holder: value === "assigned" ? prev.current_holder : "",
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setError("");

        try {
            const submitData = {
                ...formData,
                purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
                purchase_date: formData.purchase_date || null,
                current_holder: formData.current_holder || null,
            };

            if (selectedAsset && showEditModal) {
                await assetAPI.update(selectedAsset.id, submitData);
                setShowEditModal(false);
            } else {
                await assetAPI.create(submitData);
                setShowAddModal(false);
            }

            resetForm();
            setPage(1);
            await fetchAssets();
        } catch (err) {
            console.error("Submit error:", err);
            if (err.response?.data) {
                if (typeof err.response.data === "string") {
                    setError(err.response.data);
                } else if (err.response.data.error) {
                    setError(err.response.data.error);
                } else if (err.response.data.non_field_errors) {
                    setError(err.response.data.non_field_errors[0]);
                } else {
                    const errorMessages = Object.entries(err.response.data)
                        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
                        .join("; ");
                    setError(errorMessages);
                }
            } else {
                setError(err.message || "Failed to save asset");
            }
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (asset) => {
        setSelectedAsset(asset);
        setFormData({
            name: asset.name || "",
            serial_number: asset.serial_number || "",
            department: asset.department?.toString() || "",
            status: asset.status || "available",
            current_holder: asset.current_holder?.toString() || "",
            description: asset.description || "",
            purchase_date: asset.purchase_date || "",
            purchase_cost: asset.purchase_cost || "",
        });
        setShowEditModal(true);
    };

    const handleDelete = async () => {
        if (!selectedAsset) return;
        setFormLoading(true);
        setError("");

        try {
            await assetAPI.delete(selectedAsset.id);
            setShowDeleteModal(false);
            setSelectedAsset(null);
            await fetchAssets();
            if (assets.length === 1 && page > 1) setPage((p) => Math.max(1, p - 1));
        } catch (err) {
            console.error("Delete error:", err);
            if (err.response?.data) {
                if (err.response.data.error) setError(err.response.data.error);
                else if (typeof err.response.data === "string") setError(err.response.data);
                else setError(JSON.stringify(err.response.data));
            } else {
                setError(err.message || "Failed to delete asset");
            }
        } finally {
            setFormLoading(false);
        }
    };

    const handleViewAsset = (asset) => {
        setSelectedAsset(asset);
        setShowViewModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            serial_number: "",
            department: "",
            status: "available",
            current_holder: "",
            description: "",
            purchase_date: "",
            purchase_cost: "",
        });
        setSelectedAsset(null);
    };

    const handleModalClose = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowViewModal(false);
        setShowDeleteModal(false);
        resetForm();
        setError("");
    };

    const getStatusColor = (status) => {
        const statusOption = statusOptions.find((opt) => opt.value === status);
        return statusOption ? statusOption.color : "gray";
    };

    const formatCurrency = (amount) => (amount ? `$${parseFloat(amount).toLocaleString()}` : "N/A");
    const formatDate = (dateString) => (dateString ? new Date(dateString).toLocaleDateString() : "N/A");

    const getDepartmentEmployees = () => {
        if (!formData.department) return employees;
        return employees.filter((emp) => emp.department.toString() === formData.department);
    };

    // pagination helpers
    const canPrev = page > 1;
    const canNext = page < totalPages;
    const goFirst = () => canPrev && setPage(1);
    const goPrev = () => canPrev && setPage((p) => p - 1);
    const goNext = () => canNext && setPage((p) => p + 1);
    const goLast = () => canNext && setPage(totalPages);
    const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(page * pageSize, totalCount);

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
                            Assets Management
                        </Typography>
                        <Button className="flex items-center gap-3" size="sm" onClick={() => setShowAddModal(true)}>
                            <PlusIcon strokeWidth={2} className="h-4 w-4" />
                            Add Asset
                        </Button>
                    </div>
                </CardHeader>

                <CardBody className="px-0 pt-0 pb-2">
                    {error && (
                        <Alert color="red" className="mb-6 mx-6" dismissible onClose={() => setError("")}>
                            {error}
                        </Alert>
                    )}

                    {/* Filters */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-6 px-6">
                        <div className="w-full lg:w-72">
                            <Input
                                label="Search assets..."
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Department filter */}
                        <div className="w-full lg:w-60">
                            <Select
                                label="Filter by Department"
                                value={selectedDepartment ?? ""}
                                onChange={(value) => setSelectedDepartment(value ?? "")}
                                selected={(element) => {
                                    if (React.isValidElement(element) && element.props?.children != null) {
                                        return element.props.children;
                                    }
                                    const raw = typeof element === "string" || typeof element === "number"
                                        ? String(element)
                                        : (selectedDepartment ?? "");
                                    if (!raw) return "All Departments";
                                    const d = departments.find(dep => dep.id.toString() === raw);
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

                        {/* Status filter */}
                        <div className="w-full lg:w-60">
                            <Select
                                label="Filter by Status"
                                value={selectedStatus ?? ""}
                                onChange={(value) => setSelectedStatus(value ?? "")}
                                selected={(element) => {
                                    if (React.isValidElement(element) && element.props?.children != null) {
                                        return element.props.children;
                                    }
                                    const raw = typeof element === "string" || typeof element === "number"
                                        ? String(element)
                                        : (selectedStatus ?? "");
                                    if (!raw) return "All Statuses";
                                    const opt = statusOptions.find(s => String(s.value) === raw);
                                    return opt ? opt.label : "All Statuses";
                                }}
                            >
                                <Option value="">All Statuses</Option>
                                {statusOptions.map((status) => (
                                    <Option key={status.value} value={String(status.value)}>
                                        {status.label}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-scroll">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {["Asset", "Serial Number", "Department", "Status", "Current Holder", "Purchase Cost", "Actions"].map((el) => (
                                        <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map((asset, key) => {
                                    const className = `py-3 px-5 ${key === assets.length - 1 ? "" : "border-b border-blue-gray-50"}`;

                                    return (
                                        <tr key={asset.id}>
                                            <td className={className}>
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <Typography variant="small" color="blue-gray" className="font-semibold">
                                                            {asset.name}
                                                        </Typography>
                                                        <Typography className="text-xs font-normal text-blue-gray-500">
                                                            {asset.description?.substring(0, 50)}
                                                            {asset.description?.length > 50 ? "..." : ""}
                                                        </Typography>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {asset.serial_number}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Chip
                                                    variant="gradient"
                                                    color="blue"
                                                    value={asset.department_name}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </td>
                                            <td className={className}>
                                                <Chip
                                                    variant="gradient"
                                                    color={getStatusColor(asset.status)}
                                                    value={asset.status?.toUpperCase()}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-normal text-blue-gray-500">
                                                    {asset.current_holder_name || "Unassigned"}
                                                </Typography>
                                                {asset.current_holder_employee_id && (
                                                    <Typography className="text-xs font-normal text-blue-gray-400">
                                                        ID: {asset.current_holder_employee_id}
                                                    </Typography>
                                                )}
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {formatCurrency(asset.purchase_cost)}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <div className="flex items-center gap-2">
                                                    <IconButton variant="text" color="blue-gray" onClick={() => handleViewAsset(asset)}>
                                                        <EyeIcon className="h-4 w-4" />
                                                    </IconButton>
                                                    <IconButton variant="text" color="blue-gray" onClick={() => handleEdit(asset)}>
                                                        <PencilIcon className="h-4 w-4" />
                                                    </IconButton>
                                                    <IconButton
                                                        variant="text"
                                                        color={asset.can_be_deleted === false ? "gray" : "red"}
                                                        onClick={() => {
                                                            setSelectedAsset(asset);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        disabled={asset.can_be_deleted === false}
                                                        className={asset.can_be_deleted === false ? "opacity-50 cursor-not-allowed" : ""}
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </IconButton>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {assets.length === 0 && !loading && (
                        <div className="text-center py-8">
                            <Typography color="blue-gray" className="font-normal">
                                No assets found.
                            </Typography>
                        </div>
                    )}
                    {/* pager */}
                    <div className="flex items-center justify-between px-6 py-4 text-sm text-blue-gray-600">
                        <span>
                            Showing <b>{rangeStart}</b>–<b>{rangeEnd}</b> of <b>{totalCount}</b>
                        </span>
                        <div className="flex items-center gap-2">
                            <Button variant="text" size="sm" onClick={() => setPage(1)} disabled={!canPrev}>First</Button>
                            <Button variant="text" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev}>Prev</Button>
                            <span className="px-2">
                                Page <b>{page}</b> of <b>{totalPages}</b>
                            </span>
                            <Button variant="text" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={!canNext}>Next</Button>
                            <Button variant="text" size="sm" onClick={() => setPage(totalPages)} disabled={!canNext}>Last</Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Add/Edit Asset Modal */}
            <Dialog open={showAddModal || showEditModal} handler={handleModalClose} size="lg">
                <DialogHeader>{selectedAsset && showEditModal ? "Edit Asset" : "Add New Asset"}</DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        {error && (
                            <Alert color="red" className="mb-4">
                                {error}
                            </Alert>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Asset Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                            <Input
                                label="Serial Number"
                                name="serial_number"
                                value={formData.serial_number}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Department"
                                value={formData.department}
                                onChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
                                required
                            >
                                {departments.map((dept) => (
                                    <Option key={dept.id} value={dept.id.toString()}>
                                        {dept.name}
                                    </Option>
                                ))}
                            </Select>

                            <Select
                                label="Status"
                                value={formData.status}
                                onChange={handleStatusChange}
                                required
                            >
                                {statusOptions.map((status) => (
                                    <Option key={status.value} value={status.value}>
                                        {status.label}
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        {/* Current Holder field - only show if status is 'assigned' */}
                        {formData.status === 'assigned' && (
                            <Select
                                label="Current Holder"
                                value={formData.current_holder ?? ""}                // keep it a string
                                onChange={(value) =>
                                    setFormData((prev) => ({ ...prev, current_holder: value ?? "" }))
                                }
                                required
                                selected={(element) => {
                                    // If MTW gives us the selected <Option/>, show its children
                                    if (React.isValidElement(element) && element.props?.children != null) {
                                        return element.props.children;
                                    }

                                    // Fallback: map the stored id -> "Name (EMPID)"
                                    const id =
                                        typeof element === "string" || typeof element === "number"
                                            ? String(element)
                                            : formData.current_holder ?? "";

                                    if (!id) return "Select Employee";

                                    const e =
                                        (getDepartmentEmployees?.() || []).find((emp) => emp.id.toString() === id) ||
                                        (employees || []).find((emp) => emp.id.toString() === id); // extra fallback

                                    return e ? `${e.name} (${e.employee_id})` : "Select Employee";
                                }}
                                menuProps={{ className: "max-h-48 overflow-y-auto" }}
                            >
                                {/* Make placeholder non-selectable */}
                                <Option value="" disabled>
                                    Select Employee
                                </Option>

                                {getDepartmentEmployees().map((employee) => (
                                    <Option key={employee.id} value={employee.id.toString()}>
                                        {employee.name} ({employee.employee_id})
                                    </Option>
                                ))}
                            </Select>

                        )}

                        <Textarea
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Purchase Date"
                                name="purchase_date"
                                type="date"
                                value={formData.purchase_date}
                                onChange={handleInputChange}
                            />
                            <Input
                                label="Purchase Cost"
                                name="purchase_cost"
                                type="number"
                                step="0.01"
                                value={formData.purchase_cost}
                                onChange={handleInputChange}
                            />
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={handleModalClose} className="mr-1">
                            Cancel
                        </Button>
                        <Button type="submit" loading={formLoading}>
                            {selectedAsset && showEditModal ? "Update Asset" : "Create Asset"}
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>

            {/* View Asset Modal */}
            <Dialog open={showViewModal} handler={() => setShowViewModal(false)} size="lg">
                {showViewModal && selectedAsset && (
                    <>
                        <DialogHeader>Asset Details - {selectedAsset.name}</DialogHeader>

                        <DialogBody className="max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Information */}
                                <Card className="shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader floated={false} shadow={false} className="bg-blue-600 px-5 py-3">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Basic Information
                                        </Typography>
                                    </CardHeader>
                                    <CardBody className="p-6">
                                        <dl className="divide-y divide-gray-100">
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Name</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{selectedAsset.name}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Serial Number</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{selectedAsset.serial_number}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Department</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{selectedAsset.department_name}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Status</dt>
                                                <dd className="col-span-3 flex justify-end">
                                                    <Chip
                                                        variant="gradient"
                                                        color={getStatusColor(selectedAsset.status)}
                                                        value={selectedAsset.status?.toUpperCase()}
                                                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                    />
                                                </dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Current Holder</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                    {selectedAsset.current_holder_name || "Unassigned"}
                                                </dd>
                                            </div>
                                        </dl>
                                    </CardBody>
                                </Card>

                                {/* Purchase Information */}
                                <Card className="shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader floated={false} shadow={false} className="bg-green-600 px-5 py-3">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Purchase Information
                                        </Typography>
                                    </CardHeader>
                                    <CardBody className="p-6">
                                        <dl className="divide-y divide-gray-100">
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Purchase Date</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{formatDate(selectedAsset.purchase_date)}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Purchase Cost</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{formatCurrency(selectedAsset.purchase_cost)}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Created</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{formatDate(selectedAsset.created_at)}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Last Updated</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{formatDate(selectedAsset.updated_at)}</dd>
                                            </div>
                                        </dl>
                                    </CardBody>
                                </Card>
                            </div>

                            {/* Description */}
                            {selectedAsset.description && (
                                <Card className="mt-6 shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader floated={false} shadow={false} className="bg-orange-500 px-5 py-3">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Description
                                        </Typography>
                                    </CardHeader>
                                    <CardBody className="p-6">
                                        <Typography className="text-sm text-gray-700">{selectedAsset.description}</Typography>
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

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} handler={() => setShowDeleteModal(false)} size="sm">
                <DialogHeader className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                    Confirm Delete
                </DialogHeader>
                <DialogBody>
                    {error && (
                        <Alert color="red" className="mb-4">
                            {error}
                        </Alert>
                    )}

                    {selectedAsset?.can_be_deleted === false ? (
                        <div className="space-y-4">
                            <Alert color="amber" className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-5 w-5" />
                                <Typography variant="small">
                                    This asset cannot be deleted because it is currently assigned to an employee.
                                </Typography>
                            </Alert>

                            {selectedAsset && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Typography variant="small" className="font-semibold text-gray-800 mb-2">
                                        Asset Details:
                                    </Typography>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <div><strong>Name:</strong> {selectedAsset.name}</div>
                                        <div><strong>Serial:</strong> {selectedAsset.serial_number}</div>
                                        <div><strong>Status:</strong> {selectedAsset.status?.toUpperCase()}</div>
                                        <div><strong>Assigned to:</strong> {selectedAsset.current_holder_name}</div>
                                    </div>
                                </div>
                            )}

                            <Typography variant="small" className="text-gray-700">
                                To delete this asset, please return it first by creating a return transaction.
                            </Typography>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Typography variant="paragraph">
                                Are you sure you want to delete this asset? This action cannot be undone.
                            </Typography>

                            {selectedAsset && (
                                <div className="p-3 bg-gray-100 rounded-lg">
                                    <Typography variant="small" className="font-semibold text-gray-800">
                                        {selectedAsset.name}
                                    </Typography>
                                    <Typography variant="small" className="text-gray-600">
                                        Serial: {selectedAsset.serial_number}
                                    </Typography>
                                    <Typography variant="small" className="text-gray-600">
                                        Status: {selectedAsset.status?.toUpperCase()}
                                    </Typography>
                                </div>
                            )}
                        </div>
                    )}
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="gray"
                        onClick={() => {
                            setShowDeleteModal(false);
                            setError("");
                        }}
                        className="mr-1"
                    >
                        {selectedAsset?.can_be_deleted === false ? "Close" : "Cancel"}
                    </Button>

                    {selectedAsset?.can_be_deleted !== false && (
                        <Button
                            color="red"
                            onClick={handleDelete}
                            loading={formLoading}
                        >
                            Delete Asset
                        </Button>
                    )}
                </DialogFooter>
            </Dialog>
        </div>
    );
}

export default Assets;