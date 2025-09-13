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
} from "@heroicons/react/24/outline";
import { assetAPI, departmentAPI } from "@/lib/assetApi";

export function Assets() {
    const [assets, setAssets] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");

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
            await Promise.all([fetchAssets(), fetchDepartments()]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssets = async () => {
        try {
            const params = {};
            if (selectedDepartment) params.department = selectedDepartment;
            if (selectedStatus) params.status = selectedStatus;
            if (searchTerm) params.search = searchTerm;

            const response = await assetAPI.getAll(params);
            setAssets(response.results || response);
        } catch (err) {
            if (!mounted) return;
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

    // Debounced search effect
    useEffect(() => {
        if (!mounted) return;
        
        const timer = setTimeout(() => {
            fetchAssets();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedDepartment, selectedStatus, mounted]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
            };

            if (selectedAsset && showEditModal) {
                await assetAPI.update(selectedAsset.id, submitData);
                setShowEditModal(false);
            } else {
                await assetAPI.create(submitData);
                setShowAddModal(false);
            }

            resetForm();
            await fetchAssets();
        } catch (err) {
            setError(err.message || "Failed to save asset");
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
            setError("");
            await fetchAssets();
        } catch (err) {
            console.error("Delete error:", err);
            setError(err.message || "Failed to delete asset");
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
        const statusOption = statusOptions.find(opt => opt.value === status);
        return statusOption ? statusOption.color : "gray";
    };

    const formatCurrency = (amount) => {
        return amount ? `$${parseFloat(amount).toLocaleString()}` : "N/A";
    };

    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString() : "N/A";
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
                        <div className="w-full lg:w-60">
                            <Select
                                label="Filter by Department"
                                value={selectedDepartment}
                                onChange={(value) => setSelectedDepartment(value || "")}
                            >
                                <Option value="">All Departments</Option>
                                {departments.map((dept) => (
                                    <Option key={dept.id} value={dept.id.toString()}>
                                        {dept.name}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div className="w-full lg:w-60">
                            <Select
                                label="Filter by Status"
                                value={selectedStatus}
                                onChange={(value) => setSelectedStatus(value || "")}
                            >
                                <Option value="">All Statuses</Option>
                                {statusOptions.map((status) => (
                                    <Option key={status.value} value={status.value}>
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
                                                        color="red"
                                                        onClick={() => {
                                                            setSelectedAsset(asset);
                                                            setShowDeleteModal(true);
                                                        }}
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
                                {/* Basic Information Card */}
                                <Card className="shadow-sm">
                                    <CardHeader color="blue" className="relative h-16">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Basic Information
                                        </Typography>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Name:</span>
                                                <span>{selectedAsset.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Serial Number:</span>
                                                <span>{selectedAsset.serial_number}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Department:</span>
                                                <span>{selectedAsset.department_name}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold">Status:</span>
                                                <Chip
                                                    variant="gradient"
                                                    color={getStatusColor(selectedAsset.status)}
                                                    value={selectedAsset.status?.toUpperCase()}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Current Holder:</span>
                                                <span>{selectedAsset.current_holder_name || "Unassigned"}</span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* Purchase Information Card */}
                                <Card className="shadow-sm">
                                    <CardHeader color="green" className="relative h-16">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Purchase Information
                                        </Typography>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Purchase Date:</span>
                                                <span>{formatDate(selectedAsset.purchase_date)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Purchase Cost:</span>
                                                <span>{formatCurrency(selectedAsset.purchase_cost)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Created:</span>
                                                <span>{formatDate(selectedAsset.created_at)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Last Updated:</span>
                                                <span>{formatDate(selectedAsset.updated_at)}</span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            {/* Description */}
                            {selectedAsset.description && (
                                <Card className="mt-6 shadow-sm">
                                    <CardHeader color="orange" className="relative h-16">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Description
                                        </Typography>
                                    </CardHeader>
                                    <CardBody>
                                        <Typography className="text-sm text-gray-700">
                                            {selectedAsset.description}
                                        </Typography>
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
                <DialogHeader>Confirm Delete</DialogHeader>
                <DialogBody>
                    {error && (
                        <Alert color="red" className="mb-4">
                            {error}
                        </Alert>
                    )}
                    Are you sure you want to delete this asset? This action cannot be undone.
                    {selectedAsset && (
                        <div className="mt-2 p-2 bg-gray-100 rounded">
                            <Typography variant="small" className="font-semibold">
                                {selectedAsset.name}
                            </Typography>
                            <Typography variant="small" className="text-gray-600">
                                Serial: {selectedAsset.serial_number}
                            </Typography>
                        </div>
                    )}
                </DialogBody>
                <DialogFooter>
                    <Button variant="text" color="gray" onClick={() => {
                        setShowDeleteModal(false);
                        setError("");
                    }} className="mr-1">
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleDelete} loading={formLoading}>
                        Delete Asset
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}

export default Assets;