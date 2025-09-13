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
} from "@material-tailwind/react";
import { PlusIcon, PencilIcon, EyeIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { employeeAPI, departmentAPI } from "@/lib/assetApi";

export function Employees() {
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        employee_id: "",
        phone_number: "",
        department: "",
    });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const params = {};
            if (selectedDepartment) params.department = selectedDepartment;
            if (searchTerm) params.search = searchTerm;

            const response = await employeeAPI.getAll(params);
            setEmployees(response.results || response);
        } catch (err) {
            setError("Failed to fetch employees");
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
            fetchEmployees();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedDepartment]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setError("");

        try {
            await employeeAPI.create(formData);
            setShowAddModal(false);
            setFormData({
                first_name: "",
                last_name: "",
                email: "",
                employee_id: "",
                phone_number: "",
                department: "",
            });
            fetchEmployees();
        } catch (err) {
            setError(err.message || "Failed to create employee");
        } finally {
            setFormLoading(false);
        }
    };

    const handleViewEmployee = async (employee) => {
        try {
            const response = await employeeAPI.getProfile(employee.id);
            setSelectedEmployee(response);
            setShowViewModal(true);
        } catch (err) {
            setError("Failed to fetch employee details");
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
                            Employees Management
                        </Typography>
                        <Button
                            className="flex items-center gap-3"
                            size="sm"
                            onClick={() => setShowAddModal(true)}
                        >
                            <PlusIcon strokeWidth={2} className="h-4 w-4" />
                            Add Employee
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
                                label="Search employees..."
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-72">
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
                    </div>

                    {/* Table */}
                    <div className="overflow-x-scroll">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {["Employee", "ID", "Department", "Phone", "Current Assets", "Actions"].map((el) => (
                                        <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((employee, key) => {
                                    const className = `py-3 px-5 ${key === employees.length - 1 ? "" : "border-b border-blue-gray-50"
                                        }`;

                                    return (
                                        <tr key={employee.id}>
                                            <td className={className}>
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <Typography variant="small" color="blue-gray" className="font-semibold">
                                                            {employee.name}
                                                        </Typography>
                                                        <Typography className="text-xs font-normal text-blue-gray-500">
                                                            {employee.email}
                                                        </Typography>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {employee.employee_id}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Chip
                                                    variant="gradient"
                                                    color="blue"
                                                    value={employee.department_name}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-normal text-blue-gray-500">
                                                    {employee.phone_number}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {employee.current_assets_count} items
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <div className="flex items-center gap-2">
                                                    <IconButton
                                                        variant="text"
                                                        color="blue-gray"
                                                        onClick={() => handleViewEmployee(employee)}
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

            {/* Add Employee Modal */}
            <Dialog open={showAddModal} handler={() => setShowAddModal(false)} size="md">
                <DialogHeader>Add New Employee</DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                required
                            />
                            <Input
                                label="Last Name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Employee ID"
                                name="employee_id"
                                value={formData.employee_id}
                                onChange={handleInputChange}
                                required
                            />
                            <Input
                                label="Phone Number"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
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
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={() => setShowAddModal(false)} className="mr-1">
                            Cancel
                        </Button>
                        <Button type="submit" loading={formLoading}>
                            Create Employee
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>

            {/* View Employee Modal */}
            <Dialog open={showViewModal} handler={() => setShowViewModal(false)} size="lg">
                {selectedEmployee && (
                    <>
                        <DialogHeader>Employee Profile - {selectedEmployee.employee.name}</DialogHeader>
                        <DialogBody className="max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                <span>{selectedEmployee.employee.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Employee ID:</span>
                                                <span>{selectedEmployee.employee.employee_id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Email:</span>
                                                <span>{selectedEmployee.employee.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Phone:</span>
                                                <span>{selectedEmployee.employee.phone_number}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Department:</span>
                                                <span>{selectedEmployee.employee.department_name}</span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card className="shadow-sm">
                                    <CardHeader color="green" className="relative h-16">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Statistics
                                        </Typography>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Current Assets:</span>
                                                <span>{selectedEmployee.stats.current_assets_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Total Issues:</span>
                                                <span>{selectedEmployee.stats.total_issues}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Total Returns:</span>
                                                <span>{selectedEmployee.stats.total_returns}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Total Transactions:</span>
                                                <span>{selectedEmployee.stats.total_transactions}</span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            {/* Current Assets */}
                            {selectedEmployee.current_assets.length > 0 && (
                                <Card className="mt-6 shadow-sm">
                                    <CardHeader color="orange" className="relative h-16">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Current Assets
                                        </Typography>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="overflow-x-auto">
                                            <table className="w-full table-auto">
                                                <thead>
                                                    <tr>
                                                        <th className="border-b border-blue-gray-50 py-3 px-5 text-left">Asset Name</th>
                                                        <th className="border-b border-blue-gray-50 py-3 px-5 text-left">Serial Number</th>
                                                        <th className="border-b border-blue-gray-50 py-3 px-5 text-left">Department</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedEmployee.current_assets.map((asset, index) => (
                                                        <tr key={asset.id}>
                                                            <td className={`py-3 px-5 ${index === selectedEmployee.current_assets.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                                                                <Typography variant="small" className="font-semibold">{asset.name}</Typography>
                                                            </td>
                                                            <td className={`py-3 px-5 ${index === selectedEmployee.current_assets.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                                                                <Typography variant="small">{asset.serial_number}</Typography>
                                                            </td>
                                                            <td className={`py-3 px-5 ${index === selectedEmployee.current_assets.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                                                                <Typography variant="small">{asset.department_name}</Typography>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
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

export default Employees;