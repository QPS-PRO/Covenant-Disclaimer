import React, { useState, useEffect } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    Button,
    IconButton,
    Input,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Select,
    Option,
    Alert,
} from "@material-tailwind/react";
import {
    PlusIcon,
    PencilIcon,
    EyeIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    UsersIcon,
    CubeIcon,
} from "@heroicons/react/24/outline";
import { departmentAPI, employeeAPI } from "@/lib/assetApi";

export function Departments() {
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // NEW: prevent double-loading like assets.jsx
    const [mounted, setMounted] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(Number(import.meta.env.VITE_PAGE_SIZE || 15));
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        manager: "",
    });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        if (!mounted) {
            setMounted(true);
            initializeData();
        }
    }, [mounted]);

    const initializeData = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchDepartments(), fetchUsers()]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const params = { page, page_size: pageSize };
            if (searchTerm) params.search = searchTerm;

            const response = await departmentAPI.getAll(params);
            const dataArray = Array.isArray(response) ? response : (response.results || []);
            setDepartments(dataArray);

            setTotalPages(Number(response?.total_pages || 1));
            setTotalCount(Number(response?.count || dataArray.length));
            setPage(Number(response?.current_page || 1));
            setError(""); 
        } catch (err) {
            const status = err?.response?.status ?? err?.status;
            if (status === 404 && page > 1) {
                try {
                    const fallback = await departmentAPI.getAll({
                        page: 1,
                        page_size: pageSize,
                        ...(searchTerm ? { search: searchTerm } : {}),
                    });
                    const dataArray = Array.isArray(fallback) ? fallback : (fallback.results || []);
                    setDepartments(dataArray);
                    setTotalPages(Number(fallback?.total_pages || 1));
                    setTotalCount(Number(fallback?.count || dataArray.length));
                    setPage(Number(fallback?.current_page || 1));
                    setError(""); 
                    return;
                } catch (e2) {
                }
            }
            setError("Failed to fetch departments");
            console.error(err);
        }
    };



    const fetchUsers = async () => {
        try {
            const response = await employeeAPI.getAll();
            const employeeData = response.results || response;
            const userData = employeeData.map((emp) => ({
                id: emp.user_data.id,
                name: emp.name,
                email: emp.user_data.email,
            }));
            setUsers(userData);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    };

    useEffect(() => {
        if (!mounted) return;

        const timer = setTimeout(() => {
            if (page !== 1) {
                setPage(1);
            } else {
                fetchDepartments();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, mounted]);


    useEffect(() => {
        if (!mounted) return;
        fetchDepartments();
    }, [page]);


    // Pager helpers
    const canPrev = page > 1;
    const canNext = page < totalPages;
    const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(page * pageSize, totalCount);

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
                name: formData.name,
                manager: formData.manager || null,
            };

            if (selectedDepartment && showEditModal) {
                await departmentAPI.update(selectedDepartment.id, submitData);
                setShowEditModal(false);
            } else {
                await departmentAPI.create(submitData);
                setShowAddModal(false);
            }

            resetForm();
            await fetchDepartments();
        } catch (err) {
            setError(err.message || "Failed to save department");
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (department) => {
        setSelectedDepartment(department);
        setFormData({
            name: department.name,
            manager: department.manager ? department.manager.toString() : "",
        });
        setShowEditModal(true);
    };

    const handleDelete = async () => {
        if (!selectedDepartment) return;

        setFormLoading(true);
        setError("");

        try {
            await departmentAPI.delete(selectedDepartment.id);
            setShowDeleteModal(false);
            setSelectedDepartment(null);
            setError("");
            await fetchDepartments();
        } catch (err) {
            console.error("Delete error:", err);
            setError(
                err.message ||
                "Failed to delete department. Make sure it has no employees or assets assigned."
            );
        } finally {
            setFormLoading(false);
        }
    };

    const handleViewDepartment = async (department) => {
        try {
            setError("");
            const response = await departmentAPI.getById(department.id);
            setSelectedDepartment(response);
            setShowViewModal(true);
        } catch (err) {
            console.error("View department error:", err);
            setError("Failed to fetch department details");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            manager: "",
        });
        setSelectedDepartment(null);
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
                            Departments Management
                        </Typography>
                        <Button
                            className="flex items-center gap-3"
                            size="sm"
                            onClick={() => setShowAddModal(true)}
                        >
                            <PlusIcon strokeWidth={2} className="h-4 w-4" />
                            Add Department
                        </Button>
                    </div>
                </CardHeader>

                <CardBody className="px-0 pt-0 pb-2">
                    {error && (
                        <Alert
                            color="red"
                            className="mb-6 mx-6"
                            dismissible
                            onClose={() => setError("")}
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Search */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6 px-6">
                        <div className="w-full md:w-72">
                            <Input
                                label="Search departments..."
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-scroll">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {[
                                        "Department Name",
                                        "Manager",
                                        "Employees",
                                        "Assets",
                                        "Created",
                                        "Actions",
                                    ].map((el) => (
                                        <th
                                            key={el}
                                            className="border-b border-blue-gray-50 py-3 px-5 text-left"
                                        >
                                            <Typography
                                                variant="small"
                                                className="text-[11px] font-bold uppercase text-blue-gray-400"
                                            >
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {departments.map((department, key) => {
                                    const className = `py-3 px-5 ${key === departments.length - 1
                                        ? ""
                                        : "border-b border-blue-gray-50"
                                        }`;

                                    return (
                                        <tr key={department.id}>
                                            <td className={className}>
                                                <Typography
                                                    variant="small"
                                                    color="blue-gray"
                                                    className="font-semibold"
                                                >
                                                    {department.name}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                {department.manager_name ? (
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {department.manager_name}
                                                    </Typography>
                                                ) : (
                                                    <Typography className="text-xs font-normal text-blue-gray-500">
                                                        No manager assigned
                                                    </Typography>
                                                )}
                                            </td>
                                            <td className={className}>
                                                <div className="flex items-center gap-1">
                                                    <UsersIcon className="h-4 w-4 text-blue-500" />
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {department.employee_count}
                                                    </Typography>
                                                </div>
                                            </td>
                                            <td className={className}>
                                                <div className="flex items-center gap-1">
                                                    <CubeIcon className="h-4 w-4 text-green-500" />
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {department.asset_count}
                                                    </Typography>
                                                </div>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-normal text-blue-gray-500">
                                                    {new Date(department.created_at).toLocaleDateString()}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <div className="flex items-center gap-2">
                                                    <IconButton
                                                        variant="text"
                                                        color="blue-gray"
                                                        onClick={() => handleViewDepartment(department)}
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                    </IconButton>
                                                    <IconButton
                                                        variant="text"
                                                        color="blue-gray"
                                                        onClick={() => handleEdit(department)}
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </IconButton>
                                                    <IconButton
                                                        variant="text"
                                                        color="red"
                                                        onClick={() => {
                                                            setSelectedDepartment(department);
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

                    {departments.length === 0 && !loading && (
                        <div className="text-center py-8">
                            <Typography color="blue-gray" className="font-normal">
                                No departments found.
                            </Typography>
                        </div>
                    )}
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

            {/* Add/Edit Department Modal */}
            <Dialog open={showAddModal || showEditModal} handler={handleModalClose} size="md">
                <DialogHeader>
                    {selectedDepartment && showEditModal
                        ? "Edit Department"
                        : "Add New Department"}
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        {error && (
                            <Alert color="red" className="mb-4">
                                {error}
                            </Alert>
                        )}

                        <Input
                            label="Department Name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                        <Select
                            label="Manager (Optional)"
                            value={formData.manager ?? ""} // keep it a string
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, manager: value ?? "" }))
                            }
                            selected={(element) => {
                                // Case 1: MTW passes the actual <Option />
                                if (React.isValidElement(element) && element.props?.children != null) {
                                    return element.props.children; // e.g., "Jane Doe (jane@acme.com)"
                                }

                                // Case 2: raw value or undefined -> derive from current state
                                const raw =
                                    (typeof element === "string" || typeof element === "number")
                                        ? String(element)
                                        : (formData.manager ?? "");

                                if (!raw) return "No manager";

                                const u = users.find((usr) => usr.id.toString() === raw);
                                if (!u) return "No manager";

                                const name = u.name || [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || "User";
                                const email = u.email ? ` (${u.email})` : "";
                                return `${name}${email}`;
                            }}
                        >
                            <Option value="">No manager</Option>
                            {users.map((user) => (
                                <Option key={user.id} value={user.id.toString()}>
                                    {(user.name || [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "User")}
                                    {user.email ? ` (${user.email})` : ""}
                                </Option>
                            ))}
                        </Select>

                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={handleModalClose} className="mr-1">
                            Cancel
                        </Button>
                        <Button type="submit" loading={formLoading}>
                            {selectedDepartment && showEditModal
                                ? "Update Department"
                                : "Create Department"}
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
                    Are you sure you want to delete this department? This action cannot be undone and will fail if the department has employees or assets assigned.
                    {selectedDepartment && (
                        <div className="mt-2 p-2 bg-gray-100 rounded">
                            <Typography variant="small" className="font-semibold">
                                {selectedDepartment.name}
                            </Typography>
                            <Typography variant="small" className="text-gray-600">
                                Employees: {selectedDepartment.employee_count} | Assets: {selectedDepartment.asset_count}
                            </Typography>
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
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleDelete} loading={formLoading}>
                        Delete Department
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* View Department Modal */}
            <Dialog open={showViewModal} handler={() => setShowViewModal(false)} size="md">
                {selectedDepartment && (
                    <>
                        <DialogHeader>Department Details - {selectedDepartment.name}</DialogHeader>

                        <DialogBody className="max-h-[70vh] overflow-y-auto">
                            <Card className="shadow-sm rounded-xl overflow-hidden">
                                <CardHeader floated={false} shadow={false} className="bg-blue-600 px-5 py-3">
                                    <Typography variant="h6" color="white" className="text-center">
                                        Department Information
                                    </Typography>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <dl className="divide-y divide-gray-100">
                                        <div className="grid grid-cols-5 items-center py-2">
                                            <dt className="col-span-2 text-sm font-medium text-gray-600">Name</dt>
                                            <dd className="col-span-3 text-sm text-gray-900 text-right">{selectedDepartment.name}</dd>
                                        </div>
                                        <div className="grid grid-cols-5 items-center py-2">
                                            <dt className="col-span-2 text-sm font-medium text-gray-600">Manager</dt>
                                            <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                {selectedDepartment.manager_name || "No manager assigned"}
                                            </dd>
                                        </div>
                                        <div className="grid grid-cols-5 items-center py-2">
                                            <dt className="col-span-2 text-sm font-medium text-gray-600">Active Employees</dt>
                                            <dd className="col-span-3 flex items-center justify-end gap-1 text-sm text-gray-900">
                                                <UsersIcon className="h-4 w-4 text-blue-500" />
                                                {selectedDepartment.employee_count}
                                            </dd>
                                        </div>
                                        <div className="grid grid-cols-5 items-center py-2">
                                            <dt className="col-span-2 text-sm font-medium text-gray-600">Total Assets</dt>
                                            <dd className="col-span-3 flex items-center justify-end gap-1 text-sm text-gray-900">
                                                <CubeIcon className="h-4 w-4 text-green-500" />
                                                {selectedDepartment.asset_count}
                                            </dd>
                                        </div>
                                        <div className="grid grid-cols-5 items-center py-2">
                                            <dt className="col-span-2 text-sm font-medium text-gray-600">Created</dt>
                                            <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                {new Date(selectedDepartment.created_at).toLocaleDateString()}
                                            </dd>
                                        </div>
                                        <div className="grid grid-cols-5 items-center py-2">
                                            <dt className="col-span-2 text-sm font-medium text-gray-600">Last Updated</dt>
                                            <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                {new Date(selectedDepartment.updated_at).toLocaleDateString()}
                                            </dd>
                                        </div>
                                    </dl>
                                </CardBody>
                            </Card>
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

export default Departments;
