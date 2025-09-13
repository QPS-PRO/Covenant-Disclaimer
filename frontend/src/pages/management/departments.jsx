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
import { PlusIcon, PencilIcon, EyeIcon, MagnifyingGlassIcon, UsersIcon, CubeIcon } from "@heroicons/react/24/outline";
import { departmentAPI, employeeAPI } from "@/lib/assetApi";

export function Departments() {
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        manager: "",
    });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchDepartments();
        fetchUsers();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchTerm) params.search = searchTerm;

            const response = await departmentAPI.getAll(params);
            setDepartments(response.results || response);
        } catch (err) {
            setError("Failed to fetch departments");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await employeeAPI.getAll();
            const employeeData = response.results || response;
            // Extract user data from employees for manager selection
            const userData = employeeData.map(emp => ({
                id: emp.user_data.id,
                name: emp.name,
                email: emp.user_data.email
            }));
            setUsers(userData);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDepartments();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

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
                name: formData.name,
                manager: formData.manager || null,
            };
            await departmentAPI.create(submitData);
            setShowAddModal(false);
            setFormData({
                name: "",
                manager: "",
            });
            fetchDepartments();
        } catch (err) {
            setError(err.message || "Failed to create department");
        } finally {
            setFormLoading(false);
        }
    };

    const handleViewDepartment = async (department) => {
        try {
            const response = await departmentAPI.getById(department.id);
            setSelectedDepartment(response);
            setShowViewModal(true);
        } catch (err) {
            setError("Failed to fetch department details");
        }
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
                        <Alert color="red" className="mb-6 mx-6">
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
                                    {["Department Name", "Manager", "Employees", "Assets", "Created", "Actions"].map((el) => (
                                        <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {departments.map((department, key) => {
                                    const className = `py-3 px-5 ${key === departments.length - 1 ? "" : "border-b border-blue-gray-50"
                                        }`;

                                    return (
                                        <tr key={department.id}>
                                            <td className={className}>
                                                <Typography variant="small" color="blue-gray" className="font-semibold">
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
                                                    <IconButton variant="text" color="blue-gray">
                                                        <PencilIcon className="h-4 w-4" />
                                                    </IconButton>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            {/* Add Department Modal */}
            <Dialog open={showAddModal} handler={() => setShowAddModal(false)} size="md">
                <DialogHeader>Add New Department</DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        <Input
                            label="Department Name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                        <Select
                            label="Manager (Optional)"
                            value={formData.manager}
                            onChange={(value) => setFormData(prev => ({ ...prev, manager: value }))}
                        >
                            <Option value="">No manager</Option>
                            {users.map((user) => (
                                <Option key={user.id} value={user.id.toString()}>
                                    {user.name} ({user.email})
                                </Option>
                            ))}
                        </Select>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={() => setShowAddModal(false)} className="mr-1">
                            Cancel
                        </Button>
                        <Button type="submit" loading={formLoading}>
                            Create Department
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>

            {/* View Department Modal */}
            <Dialog open={showViewModal} handler={() => setShowViewModal(false)} size="md">
                {selectedDepartment && (
                    <>
                        <DialogHeader>Department Details - {selectedDepartment.name}</DialogHeader>
                        <DialogBody>
                            <Card className="shadow-sm">
                                <CardHeader color="blue" className="relative h-16">
                                    <Typography variant="h6" color="white" className="text-center">
                                        Department Information
                                    </Typography>
                                </CardHeader>
                                <CardBody>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Name:</span>
                                            <span>{selectedDepartment.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Manager:</span>
                                            <span>{selectedDepartment.manager_name || "No manager assigned"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Active Employees:</span>
                                            <div className="flex items-center gap-1">
                                                <UsersIcon className="h-4 w-4 text-blue-500" />
                                                <span>{selectedDepartment.employee_count}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Total Assets:</span>
                                            <div className="flex items-center gap-1">
                                                <CubeIcon className="h-4 w-4 text-green-500" />
                                                <span>{selectedDepartment.asset_count}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Created:</span>
                                            <span>{new Date(selectedDepartment.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Last Updated:</span>
                                            <span>{new Date(selectedDepartment.updated_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
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