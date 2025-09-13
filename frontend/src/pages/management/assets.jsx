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
import { PlusIcon, PencilIcon, EyeIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
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

    const statusColors = {
        available: "green",
        assigned: "blue",
        maintenance: "orange",
        retired: "red",
    };

    useEffect(() => {
        fetchAssets();
        fetchDepartments();
    }, []);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const params = {};
            if (selectedDepartment) params.department = selectedDepartment;
            if (selectedStatus) params.status = selectedStatus;
            if (searchTerm) params.search = searchTerm;

            const response = await assetAPI.getAll(params);
            setAssets(response.results || response);
        } catch (err) {
            setError("Failed to fetch assets");
            console.error(err);
        } finally {
            setLoading(false);
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
        const timer = setTimeout(() => {
            fetchAssets();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedDepartment, selectedStatus]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setError("");

        try {
            const submitData = {
                ...formData,
                purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
            };

            if (selectedAsset && showEditModal) {
                await assetAPI.update(selectedAsset.id, submitData);
                setShowEditModal(false);
            } else {
                await assetAPI.create(submitData);
                setShowAddModal(false);
            }

            resetForm();
            fetchAssets();
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
            fetchAssets();
            setError("");
        } catch (err) {
            console.error("Delete error:", err);
            setError(err.message || "Failed to delete asset");
        } finally {
            setFormLoading(false);
        }
    };

    const handleViewAsset = async (asset) => {
        try {
            setError("");
            const response = await assetAPI.getById(asset.id);
            setSelectedAsset(response);
            setShowViewModal(true);
        } catch (err) {
            console.error("View asset error:", err);
            setError("Failed to fetch asset details");
        }
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
        resetForm();
        setError("");
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
                        <Button
                            className="flex items-center gap-3"
                            size="sm"
                            onClick={() => setShowAddModal(true)}
                        >
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
                    <div className="flex flex-col md:flex-row gap-4 mb-6 px-6">
                        <div className="w-full md:w-72">
                            <Input
                                label="Search assets..."
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-48">
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
                        <div className="w-full md:w-48">
                            <Select
                                label="Filter by Status"
                                value={selectedStatus}
                                onChange={(value) => setSelectedStatus(value || "")}
                            >
                                <Option value="">All Status</Option>
                                <Option value="available">Available</Option>
                                <Option value="assigned">Assigned</Option>
                                <Option value="maintenance">Maintenance</Option>
                                <Option value="retired">Retired</Option>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-scroll">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {["Asset", "Serial Number", "Department", "Status", "Holder", "Actions"].map((el) => (
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
                                    const className = `py-3 px-5 ${key === assets.length - 1 ? "" : "border-b border-blue-gray-50"
                                        }`;

                                    return (
                                        <tr key={asset.id}>
                                            <td className={className}>
                                                <div>
                                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                                        {asset.name}
                                                    </Typography>
                                                    {asset.description && (
                                                        <Typography className="text-xs font-normal text-blue-gray-500">
                                                            {asset.description.length > 50
                                                                ? `${asset.description.substring(0, 50)}...`
                                                                : asset.description}
                                                        </Typography>
                                                    )}
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
                                                    color={statusColors[asset.status]}
                                                    value={asset.status.replace('_', ' ').toUpperCase()}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </td>
                                            <td className={className}>
                                                {asset.current_holder_name ? (
                                                    <div>
                                                        <Typography className="text-xs font-semibold text-blue-gray-600">
                                                            {asset.current_holder_name}
                                                        </Typography>
                                                        <Typography className="text-xs font-normal text-blue-gray-500">
                                                            ID: {asset.current_holder_employee_id}
                                                        </Typography>
                                                    </div>
                                                ) : (
                                                    <Typography className="text-xs font-normal text-blue-gray-500">
                                                        Not assigned
                                                    </Typography>
                                                )}
                                            </td>
                                            <td className={className}>
                                                <div className="flex items-center gap-2">
                                                    <IconButton
                                                        variant="text"
                                                        color="blue-gray"
                                                        onClick={() => handleViewAsset(asset)}
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                    </IconButton>
                                                    <IconButton 
                                                        variant="text" 
                                                        color="blue-gray"
                                                        onClick={() => handleEdit(asset)}
                                                    >
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
            <Dialog open={showAddModal || showEditModal} handler={handleModalClose} size="md">
                <DialogHeader>
                    {selectedAsset && showEditModal ? "Edit Asset" : "Add New Asset"}
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        {error && (
                            <Alert color="red" className="mb-4">
                                {error}
                            </Alert>
                        )}

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
                        <Select
                            label="Department"
                            value={formData.department}
                            onChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                            required
                        >
                            {departments.map((dept) => (
                                <Option key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                </Option>
                            ))}
                        </Select>
                        <Textarea
                            label="Description (Optional)"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Purchase Date (Optional)"
                                name="purchase_date"
                                type="date"
                                value={formData.purchase_date}
                                onChange={handleInputChange}
                            />
                            <Input
                                label="Purchase Cost (Optional)"
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
                            <Typography variant="small" className="text-gray-600">
                                Status: {selectedAsset.status}
                            </Typography>
                        </div>
                    )}
                </DialogBody>
                <DialogFooter>
                    <Button variant="text" color="gray" onClick={() => setShowDeleteModal(false)} className="mr-1">
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleDelete} loading={formLoading}>
                        Delete Asset
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* View Asset Modal */}
            <Dialog open={showViewModal} handler={() => setShowViewModal(false)} size="md">
                {selectedAsset && (
                    <>
                        <DialogHeader>Asset Details - {selectedAsset.name}</DialogHeader>
                        <DialogBody className="max-h-[70vh] overflow-y-auto">
                            <div className="space-y-4">
                                <Card className="shadow-sm">
                                    <CardHeader color="blue" className="relative h-16">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Asset Information
                                        </Typography>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="space-y-3">
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
                                                    color={statusColors[selectedAsset.status]}
                                                    value={selectedAsset.status.replace('_', ' ').toUpperCase()}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </div>
                                            {selectedAsset.current_holder_name && (
                                                <div className="flex justify-between">
                                                    <span className="font-semibold">Current Holder:</span>
                                                    <span>
                                                        {selectedAsset.current_holder_name} 
                                                        <br />
                                                        <span className="text-sm text-gray-600">
                                                            (ID: {selectedAsset.current_holder_employee_id})
                                                        </span>
                                                    </span>
                                                </div>
                                            )}
                                            {selectedAsset.description && (
                                                <div>
                                                    <span className="font-semibold">Description:</span>
                                                    <p className="mt-1 text-sm text-gray-700">{selectedAsset.description}</p>
                                                </div>
                                            )}
                                            {selectedAsset.purchase_date && (
                                                <div className="flex justify-between">
                                                    <span className="font-semibold">Purchase Date:</span>
                                                    <span>{new Date(selectedAsset.purchase_date).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {selectedAsset.purchase_cost && (
                                                <div className="flex justify-between">
                                                    <span className="font-semibold">Purchase Cost:</span>
                                                    <span>${selectedAsset.purchase_cost}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Created:</span>
                                                <span>{new Date(selectedAsset.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {selectedAsset.updated_at && selectedAsset.updated_at !== selectedAsset.created_at && (
                                                <div className="flex justify-between">
                                                    <span className="font-semibold">Last Updated:</span>
                                                    <span>{new Date(selectedAsset.updated_at).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
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

export default Assets;