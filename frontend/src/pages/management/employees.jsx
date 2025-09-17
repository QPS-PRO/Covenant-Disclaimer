// frontend/src/pages/management/employees.jsx (Fixed version)
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
    Tabs,
    TabsHeader,
    TabsBody,
    Tab,
    TabPanel,
} from "@material-tailwind/react";
import {
    PlusIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    CameraIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserCircleIcon
} from "@heroicons/react/24/outline";
import { employeeAPI, departmentAPI, formatters } from "@/lib/assetApi";
import FaceRecognitionComponent from "../../components/FaceRecognitionComponent";

export function Employees() {
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [mounted, setMounted] = useState(false);

    // Modal states - explicitly managing each modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [activeTab, setActiveTab] = useState("basic");

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
    const [faceRegistrationMode, setFaceRegistrationMode] = useState("register");

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
            await Promise.all([fetchEmployees(), fetchDepartments()]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const params = {};
            if (selectedDepartment) params.department = selectedDepartment;
            if (searchTerm) params.search = searchTerm;

            const response = await employeeAPI.getAll(params);
            setEmployees(response.results || response);
        } catch (err) {
            setError("Failed to fetch employees");
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

    // Debounced search/filter effect
    useEffect(() => {
        if (!mounted) return;
        const timer = setTimeout(() => {
            fetchEmployees();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedDepartment, mounted]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setFormLoading(true);
        setError("");

        try {
            if (showEditModal) {
                await employeeAPI.update(selectedEmployee.id, formData);
            } else {
                await employeeAPI.create(formData);
            }

            // Reset and refresh
            handleModalClose();
            await fetchEmployees();

        } catch (err) {
            setError(err.response?.data?.detail || err.message || "Failed to save employee");
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (employee) => {
        setSelectedEmployee(employee);
        setFormData({
            first_name: employee.user_data?.first_name || "",
            last_name: employee.user_data?.last_name || "",
            email: employee.user_data?.email || "",
            employee_id: employee.employee_id || "",
            phone_number: employee.phone_number || "",
            department: employee.department?.toString() || "",
        });
        setShowEditModal(true);
    };

    const handleView = async (employee) => {
        try {
            const response = await employeeAPI.getProfile(employee.id);
            setSelectedEmployee(response.employee);
            setShowViewModal(true);
        } catch (err) {
            setError("Failed to fetch employee details");
        }
    };

    const handleDelete = async (employee) => {
        if (window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
            try {
                await employeeAPI.delete(employee.id);
                await fetchEmployees();
            } catch (err) {
                setError("Failed to delete employee");
            }
        }
    };

    // Face registration handlers with proper modal management
    const handleFaceRegistration = useCallback((employee, mode = "register") => {
        console.log('Opening face registration for:', employee.name, 'Mode:', mode);

        // Close any open modals first
        setShowEditModal(false);
        setShowViewModal(false);
        setShowAddModal(false);

        // Small delay to ensure modals are closed
        setTimeout(() => {
            setSelectedEmployee(employee);
            setFaceRegistrationMode(mode);
            setShowFaceModal(true);
        }, 100);
    }, []);

    const handleFaceRegistrationSuccess = useCallback(async (result) => {
        console.log('Face registration success:', result);

        setShowFaceModal(false);
        setSelectedEmployee(null);

        // Refresh employees data
        await fetchEmployees();

        // Clear any errors
        setError("");

        // Show success message
        const action = faceRegistrationMode === "register" ? "registered" : "updated";
        setTimeout(() => {
            alert(`Face ${action} successfully!`);
        }, 100);
    }, [faceRegistrationMode]);

    const handleFaceRegistrationError = useCallback((error) => {
        console.log('Face registration error:', error);

        setShowFaceModal(false);
        setSelectedEmployee(null);

        setError(error.error || "Face registration failed");
    }, []);

    const handleFaceModalClose = useCallback(() => {
        console.log('Face modal close called');
        setShowFaceModal(false);
        setSelectedEmployee(null);
    }, []);

    const handleModalClose = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowViewModal(false);
        setSelectedEmployee(null);
        setFormData({
            first_name: "",
            last_name: "",
            email: "",
            employee_id: "",
            phone_number: "",
            department: "",
        });
        setError("");
        setActiveTab("basic");
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
                            Employee Management
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
                        <div className="w-full md:w-48">
                            <Select
                                label="Filter by Department"
                                value={selectedDepartment ?? ""}                      // keep it a string
                                onChange={(value) => setSelectedDepartment(value ?? "")}
                                selected={(element) => {
                                    // Case 1: MTW passes the actual <Option />
                                    if (React.isValidElement(element) && element.props?.children != null) {
                                        return element.props.children; // department name
                                    }
                                    // Case 2: raw value or undefined -> derive from state
                                    const raw =
                                        (typeof element === "string" || typeof element === "number")
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
                    </div>

                    {/* Table */}
                    <div className="overflow-x-scroll">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {["Employee", "ID", "Department", "Contact", "Face Data", "Status", "Actions"].map((el) => (
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
                                    const className = `py-3 px-5 ${key === employees.length - 1 ? "" : "border-b border-blue-gray-50"}`;

                                    return (
                                        <tr key={employee.id}>
                                            <td className={className}>
                                                <div className="flex items-center gap-3">
                                                    <UserCircleIcon className="h-9 w-9 text-blue-gray-500" />
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
                                                <Typography className="text-xs font-normal text-blue-gray-500">
                                                    {employee.department_name}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-normal text-blue-gray-500">
                                                    {employee.phone_number}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <div className="flex items-center gap-2">
                                                    {employee.has_face_data ? (
                                                        <div className="flex items-center gap-1">
                                                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                                            <Chip color="green" value="REGISTERED" className="text-xs" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            <XCircleIcon className="h-4 w-4 text-red-500" />
                                                            <Chip color="red" value="NOT REGISTERED" className="text-xs" />
                                                        </div>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="text"
                                                        color="blue"
                                                        className="p-1"
                                                        onClick={() => handleFaceRegistration(employee, employee.has_face_data ? "update" : "register")}
                                                    >
                                                        <CameraIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className={className}>
                                                <Chip
                                                    variant="gradient"
                                                    color={employee.is_active ? "green" : "red"}
                                                    value={employee.is_active ? "ACTIVE" : "INACTIVE"}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </td>
                                            <td className={className}>
                                                <div className="flex gap-2">
                                                    <IconButton
                                                        variant="text"
                                                        color="blue-gray"
                                                        onClick={() => handleView(employee)}
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                    </IconButton>
                                                    <IconButton
                                                        variant="text"
                                                        color="blue-gray"
                                                        onClick={() => handleEdit(employee)}
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </IconButton>
                                                    <IconButton
                                                        variant="text"
                                                        color="red"
                                                        onClick={() => handleDelete(employee)}
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
                </CardBody>
            </Card>

            {/* Add Employee Modal */}
            <Dialog open={showAddModal} handler={handleModalClose} size="lg">
                <DialogHeader>Add New Employee</DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="space-y-4">
                        <Tabs value={activeTab} onChange={setActiveTab}>
                            <TabsHeader>
                                <Tab value="basic">Basic Information</Tab>
                                <Tab value="face" disabled>Face Registration</Tab>
                            </TabsHeader>
                            <TabsBody>
                                <TabPanel value="basic" className="space-y-4">
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
                                        type="email"
                                        label="Email"
                                        name="email"
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
                                        value={formData.department ?? ""} // keep as string
                                        onChange={(value) =>
                                            setFormData((prev) => ({ ...prev, department: value ?? "" }))
                                        }
                                        required
                                        selected={(element) => {
                                            // If MTW hands us the actual <Option />, use its children (the label)
                                            if (React.isValidElement(element) && element.props?.children != null) {
                                                return element.props.children;
                                            }
                                            // Fallback: element may be raw value or undefined — derive from state
                                            const raw =
                                                (typeof element === "string" || typeof element === "number")
                                                    ? String(element)
                                                    : (formData.department ?? "");
                                            if (!raw) return "Select Department";
                                            const d = departments.find((dep) => dep.id.toString() === raw);
                                            return d ? d.name : "Select Department";
                                        }}
                                    >
                                        <Option value="">Select Department</Option>
                                        {departments.map((dept) => (
                                            <Option key={dept.id} value={dept.id.toString()}>
                                                {dept.name}
                                            </Option>
                                        ))}
                                    </Select>

                                </TabPanel>
                            </TabsBody>
                        </Tabs>

                        <Alert color="blue" className="mt-4">
                            <Typography variant="small">
                                Note: Face registration can be done after creating the employee profile.
                            </Typography>
                        </Alert>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={handleModalClose} className="mr-1">
                            Cancel
                        </Button>
                        <Button type="submit" loading={formLoading}>
                            Create Employee
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>

            {/* Edit Employee Modal */}
            <Dialog open={showEditModal} handler={handleModalClose} size="lg">
                <DialogHeader>Edit Employee</DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="space-y-4">
                        <Tabs value={activeTab} onChange={setActiveTab}>
                            <TabsHeader>
                                <Tab value="basic">Basic Information</Tab>
                                <Tab value="face">Face Management</Tab>
                            </TabsHeader>
                            <TabsBody>
                                <TabPanel value="basic" className="space-y-4">
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
                                        type="email"
                                        label="Email"
                                        name="email"
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
                                        value={formData.department ?? ""} // keep as string
                                        onChange={(value) =>
                                            setFormData((prev) => ({ ...prev, department: value ?? "" }))
                                        }
                                        required
                                        selected={(element) => {
                                            // If MTW hands us the actual <Option />, use its children (the label)
                                            if (React.isValidElement(element) && element.props?.children != null) {
                                                return element.props.children;
                                            }
                                            // Fallback: element may be raw value or undefined — derive from state
                                            const raw =
                                                (typeof element === "string" || typeof element === "number")
                                                    ? String(element)
                                                    : (formData.department ?? "");
                                            if (!raw) return "Select Department";
                                            const d = departments.find((dep) => dep.id.toString() === raw);
                                            return d ? d.name : "Select Department";
                                        }}
                                    >
                                        <Option value="">Select Department</Option>
                                        {departments.map((dept) => (
                                            <Option key={dept.id} value={dept.id.toString()}>
                                                {dept.name}
                                            </Option>
                                        ))}
                                    </Select>

                                </TabPanel>
                                <TabPanel value="face" className="space-y-4">
                                    <Card className="p-4">
                                        <div className="text-center space-y-4">
                                            <CameraIcon className="h-16 w-16 mx-auto text-blue-500" />
                                            <Typography variant="h6">
                                                Face Recognition Management
                                            </Typography>

                                            <div className="flex items-center justify-center gap-2">
                                                <Typography variant="small" color="gray">
                                                    Current Status:
                                                </Typography>
                                                {selectedEmployee?.has_face_data ? (
                                                    <Chip color="green" value="REGISTERED" />
                                                ) : (
                                                    <Chip color="red" value="NOT REGISTERED" />
                                                )}
                                            </div>

                                            <div className="flex justify-center gap-3">
                                                <Button
                                                    color="blue"
                                                    onClick={() => handleFaceRegistration(selectedEmployee, selectedEmployee?.has_face_data ? "update" : "register")}
                                                    className="flex items-center gap-2"
                                                >
                                                    <CameraIcon className="h-4 w-4" />
                                                    {selectedEmployee?.has_face_data ? "Update Face Data" : "Register Face Data"}
                                                </Button>
                                            </div>

                                            <Typography variant="small" color="gray" className="text-center">
                                                Face registration is required for secure asset transactions
                                            </Typography>
                                        </div>
                                    </Card>
                                </TabPanel>
                            </TabsBody>
                        </Tabs>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={handleModalClose} className="mr-1">
                            Cancel
                        </Button>
                        <Button type="submit" loading={formLoading}>
                            Update Employee
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>

            {/* View Employee Modal */}
            <Dialog open={showViewModal} handler={handleModalClose} size="xl">
                {selectedEmployee && (
                    <>
                        <DialogHeader>Employee Profile - {selectedEmployee.name}</DialogHeader>

                        <DialogBody className="max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <Card className="shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader
                                        floated={false}
                                        shadow={false}
                                        className="bg-blue-600 px-5 py-3"
                                    >
                                        <Typography variant="h6" color="white" className="text-center">
                                            Basic Information
                                        </Typography>
                                    </CardHeader>

                                    <CardBody className="p-6">
                                        <dl className="divide-y divide-gray-100">
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Name</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right truncate">{selectedEmployee.name}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Employee ID</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{selectedEmployee.employee_id}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Email</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right truncate">{selectedEmployee.email}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Phone</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{selectedEmployee.phone_number}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Department</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{selectedEmployee.department_name}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">Status</dt>
                                                <dd className="col-span-3 flex justify-end">
                                                    <Chip
                                                        color={selectedEmployee.is_active ? "green" : "red"}
                                                        value={selectedEmployee.is_active ? "ACTIVE" : "INACTIVE"}
                                                        className="text-xs"
                                                    />
                                                </dd>
                                            </div>
                                        </dl>
                                    </CardBody>
                                </Card>

                                {/* Face Recognition */}
                                <Card className="shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader
                                        floated={false}
                                        shadow={false}
                                        className="bg-green-600 px-5 py-3"
                                    >
                                        <Typography variant="h6" color="white" className="text-center">
                                            Face Recognition
                                        </Typography>
                                    </CardHeader>

                                    <CardBody className="p-6">
                                        <div className="flex flex-col items-center gap-4">
                                            <CameraIcon className="h-12 w-12 text-blue-500" />

                                            <div className="flex items-center gap-2">
                                                <Typography variant="small" color="gray">Status:</Typography>
                                                {selectedEmployee.has_face_data ? (
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                                        <Chip color="green" value="REGISTERED" className="text-xs" />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <XCircleIcon className="h-4 w-4 text-red-500" />
                                                        <Chip color="red" value="NOT REGISTERED" className="text-xs" />
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                size="sm"
                                                color="blue"
                                                onClick={() =>
                                                    handleFaceRegistration(
                                                        selectedEmployee,
                                                        selectedEmployee.has_face_data ? "update" : "register"
                                                    )
                                                }
                                                className="flex items-center gap-2"
                                            >
                                                <CameraIcon className="h-4 w-4" />
                                                {selectedEmployee.has_face_data ? "Update Face Data" : "Register Face Data"}
                                            </Button>

                                            <Typography variant="small" color="gray" className="text-center">
                                                Face data is required for secure transactions
                                            </Typography>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            {/* Statistics (unchanged) */}
                            {selectedEmployee.stats && (
                                <Card className="mt-6 shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader
                                        floated={false}
                                        shadow={false}
                                        className="bg-orange-500 px-5 py-3"
                                    >
                                        <Typography variant="h6" color="white" className="text-center">
                                            Activity Statistics
                                        </Typography>
                                    </CardHeader>
                                    <CardBody className="p-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="text-center">
                                                <Typography variant="h4" color="blue">
                                                    {selectedEmployee.stats.current_assets_count}
                                                </Typography>
                                                <Typography variant="small" color="gray">Current Assets</Typography>
                                            </div>
                                            <div className="text-center">
                                                <Typography variant="h4" color="green">
                                                    {selectedEmployee.stats.total_transactions}
                                                </Typography>
                                                <Typography variant="small" color="gray">Total Transactions</Typography>
                                            </div>
                                            <div className="text-center">
                                                <Typography variant="h4" color="orange">
                                                    {selectedEmployee.stats.face_verified_transactions}
                                                </Typography>
                                                <Typography variant="small" color="gray">Verified Transactions</Typography>
                                            </div>
                                            <div className="text-center">
                                                <Typography variant="h4" color="purple">
                                                    {Math.round(
                                                        (selectedEmployee.stats.face_verified_transactions /
                                                            selectedEmployee.stats.total_transactions) * 100
                                                    ) || 0}%
                                                </Typography>
                                                <Typography variant="small" color="gray">Verification Rate</Typography>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            )}
                        </DialogBody>

                        <DialogFooter>
                            <Button onClick={handleModalClose}>Close</Button>
                        </DialogFooter>
                    </>
                )}
            </Dialog>


            {/* Face Registration Modal - Rendered separately with proper state management */}
            <FaceRecognitionComponent
                open={showFaceModal}
                mode="register"
                employeeId={selectedEmployee?.id}
                employeeName={selectedEmployee?.name}
                onClose={handleFaceModalClose}
                onSuccess={handleFaceRegistrationSuccess}
                onError={handleFaceRegistrationError}
            />
        </div>
    );
}

export default Employees;