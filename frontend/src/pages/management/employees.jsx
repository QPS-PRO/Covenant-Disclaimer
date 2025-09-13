import React, { useState, useEffect, useRef } from "react";
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
import {
    PlusIcon,
    PencilIcon,
    EyeIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    CameraIcon,
} from "@heroicons/react/24/outline";
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
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showFaceModal, setShowFaceModal] = useState(false);
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
    const [faceRecording, setFaceRecording] = useState(false);
    const [capturedFaceData, setCapturedFaceData] = useState(null);

    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);

    // Prevent double loading
    const [mounted, setMounted] = useState(false);

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
            if (!mounted) return; // Prevent setting error if component unmounted
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

    useEffect(() => {
        if (!mounted) return;
        const timer = setTimeout(() => {
            fetchEmployees();
        }, 300);
        return () => clearTimeout(timer);}, [searchTerm, selectedDepartment, mounted]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const startFaceRecording = async () => {
        try {
            setFaceRecording(true);
            setError("");

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            setStream(mediaStream);
            setShowFaceModal(true);

            // Wait for modal to be shown and video element to be available
            setTimeout(() => {
                if (videoRef.current && mediaStream) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play().catch(console.error);
                    };
                }
            }, 100);
        } catch (error) {
            console.error("Camera access error:", error);
            setError("Failed to access camera. Please ensure camera permissions are granted.");
            setFaceRecording(false);
        }
    };

    const captureFaceData = async () => {
        if (!videoRef.current || !videoRef.current.videoWidth) {
            setError("Video not ready for capture. Please wait for camera to initialize.");
            return;
        }

        try {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);
            const imageData = canvas.toDataURL("image/jpeg", 0.8);
            const processedFaceData = btoa(JSON.stringify({
                image: imageData,
                timestamp: new Date().toISOString(),
                quality: 'good'
            }));

            setCapturedFaceData(processedFaceData);

            // Stop the video stream
            stopVideoStream();

            setError("");
            console.log("Face data captured successfully");
        } catch (error) {
            console.error("Face capture error:", error);
            setError("Failed to capture face data");
        }
    };

    const stopVideoStream = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setShowFaceModal(false);
        setFaceRecording(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setError("");

        try {
            const submitData = {
                ...formData,
                face_recognition_data: capturedFaceData || "",
            };

            if (selectedEmployee && showEditModal) {
                await employeeAPI.update(selectedEmployee.id, submitData);
                setShowEditModal(false);
            } else {
                await employeeAPI.create(submitData);
                setShowAddModal(false);
            }

            resetForm();
            await fetchEmployees(); // Refresh the list
        } catch (err) {
            setError(err.message || "Failed to save employee");
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

        // If employee has face data, we'll preserve it
        setCapturedFaceData(employee.has_face_data ? "existing" : null);
        setShowEditModal(true);
    };

    const handleDelete = async () => {
        if (!selectedEmployee) return;

        setFormLoading(true);
        setError("");

        try {
            await employeeAPI.delete(selectedEmployee.id);
            setShowDeleteModal(false);
            setSelectedEmployee(null);
            setError("");
            await fetchEmployees(); // Refresh the list
        } catch (err) {
            console.error("Delete error:", err);
            setError(err.message || "Failed to delete employee");
        } finally {
            setFormLoading(false);
        }
    };

    const handleViewEmployee = async (employee) => {
        try {
            setError("");
            const response = await employeeAPI.getProfile(employee.id);
            setSelectedEmployee(response);
            setShowViewModal(true);
        } catch (err) {
            console.error("View employee error:", err);
            setError("Failed to fetch employee details");
        }
    };

    const resetForm = () => {
        setFormData({
            first_name: "",
            last_name: "",
            email: "",
            employee_id: "",
            phone_number: "",
            department: "",
        });
        setCapturedFaceData(null);
        setSelectedEmployee(null);
        stopVideoStream();
    };

    const handleModalClose = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowFaceModal(false);
        stopVideoStream();
        resetForm();
        setError("");
    };

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
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

    // Safe data access for view modal
    const profileEmp = selectedEmployee?.employee || selectedEmployee || null;
    const profileStats = selectedEmployee?.stats || null;
    const currentAssets = Array.isArray(selectedEmployee?.current_assets)
        ? selectedEmployee.current_assets
        : [];

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
            <Card>
                <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
                    <div className="flex items-center justify-between">
                        <Typography variant="h6" color="white">
                            Employees Management
                        </Typography>
                        <Button className="flex items-center gap-3" size="sm" onClick={() => setShowAddModal(true)}>
                            <PlusIcon strokeWidth={2} className="h-4 w-4" />
                            Add Employee
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
                    </div>

                    {/* Table */}
                    <div className="overflow-x-scroll">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {["Employee", "ID", "Department", "Phone", "Current Assets", "Face ID", "Actions"].map((el) => (
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
                                                <Typography className="text-xs font-semibold text-blue-gray-600">{employee.employee_id}</Typography>
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
                                                <Typography className="text-xs font-normal text-blue-gray-500">{employee.phone_number}</Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {employee.current_assets_count} items
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Chip
                                                    variant="gradient"
                                                    color={employee.has_face_data ? "green" : "red"}
                                                    value={employee.has_face_data ? "REGISTERED" : "NOT REGISTERED"}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </td>
                                            <td className={className}>
                                                <div className="flex items-center gap-2">
                                                    <IconButton variant="text" color="blue-gray" onClick={() => handleViewEmployee(employee)}>
                                                        <EyeIcon className="h-4 w-4" />
                                                    </IconButton>
                                                    <IconButton variant="text" color="blue-gray" onClick={() => handleEdit(employee)}>
                                                        <PencilIcon className="h-4 w-4" />
                                                    </IconButton>
                                                    <IconButton
                                                        variant="text"
                                                        color="red"
                                                        onClick={() => {
                                                            setSelectedEmployee(employee);
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

                    {employees.length === 0 && !loading && (
                        <div className="text-center py-8">
                            <Typography color="blue-gray" className="font-normal">
                                No employees found.
                            </Typography>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Add/Edit Employee Modal */}
            <Dialog open={showAddModal || showEditModal} handler={handleModalClose} size="lg">
                <DialogHeader>{selectedEmployee && showEditModal ? "Edit Employee" : "Add New Employee"}</DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        {error && (
                            <Alert color="red" className="mb-4">
                                {error}
                            </Alert>
                        )}

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
                            onChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
                            required
                        >
                            {departments.map((dept) => (
                                <Option key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                </Option>
                            ))}
                        </Select>

                        {/* Face Recognition Section */}
                        <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <CameraIcon className="h-5 w-5 text-blue-500" />
                                    <Typography variant="small" className="font-semibold">
                                        Face Recognition Setup
                                    </Typography>
                                </div>
                                {(capturedFaceData && capturedFaceData !== "existing") && (
                                    <Chip color="green" value="CAPTURED" className="text-xs" />
                                )}
                                {capturedFaceData === "existing" && (
                                    <Chip color="blue" value="EXISTING DATA" className="text-xs" />
                                )}
                            </div>
                            <Typography variant="small" className="text-gray-600 mb-3">
                                Capture the employee's face for identity verification during transactions.
                            </Typography>
                            <Button
                                type="button"
                                size="sm"
                                color={(capturedFaceData && capturedFaceData !== "existing") ? "green" : "blue"}
                                onClick={startFaceRecording}
                                disabled={faceRecording}
                                className="flex items-center gap-2"
                            >
                                <CameraIcon className="h-4 w-4" />
                                {capturedFaceData === "existing" ? "Update Face Data" :
                                    capturedFaceData ? "Re-capture Face" : "Capture Face"}
                            </Button>
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={handleModalClose} className="mr-1">
                            Cancel
                        </Button>
                        <Button type="submit" loading={formLoading}>
                            {selectedEmployee && showEditModal ? "Update Employee" : "Create Employee"}
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>

            {/* Face Capture Modal */}
            <Dialog open={showFaceModal} handler={stopVideoStream} size="md">
                <DialogHeader>Capture Face for Recognition</DialogHeader>
                <DialogBody className="text-center">
                    <div className="mb-4">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full max-w-md mx-auto rounded-lg border"
                            style={{ maxHeight: '360px' }}
                        />
                    </div>
                    <Typography className="mb-4 text-sm text-gray-600">
                        Position the employee's face in the camera frame and click capture to register their face ID.
                    </Typography>
                    {error && (
                        <Alert color="red" className="mb-4">
                            {error}
                        </Alert>
                    )}
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="red"
                        onClick={stopVideoStream}
                        className="mr-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={captureFaceData}
                        disabled={!videoRef.current || faceRecording}
                        loading={faceRecording}
                    >
                        Capture Face
                    </Button>
                </DialogFooter>
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
                    Are you sure you want to delete this employee? This action cannot be undone.
                    {selectedEmployee && (
                        <div className="mt-2 p-2 bg-gray-100 rounded">
                            <Typography variant="small" className="font-semibold">
                                {selectedEmployee.name}
                            </Typography>
                            <Typography variant="small" className="text-gray-600">
                                ID: {selectedEmployee.employee_id}
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
                        Delete Employee
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* View Employee Modal */}
            <Dialog open={showViewModal} handler={() => setShowViewModal(false)} size="lg">
                {showViewModal && selectedEmployee && (
                    <>
                        <DialogHeader>
                            Employee Profile - {profileEmp?.name || selectedEmployee.name || "Employee"}
                        </DialogHeader>
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
                                                <span>{profileEmp?.name || selectedEmployee.name || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Employee ID:</span>
                                                <span>{profileEmp?.employee_id || selectedEmployee.employee_id || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Email:</span>
                                                <span>{profileEmp?.email || selectedEmployee.email || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Phone:</span>
                                                <span>{profileEmp?.phone_number || selectedEmployee.phone_number || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Department:</span>
                                                <span>{profileEmp?.department_name || selectedEmployee.department_name || "—"}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold">Face ID Status:</span>
                                                <Chip
                                                    variant="gradient"
                                                    color={(profileEmp?.has_face_data || selectedEmployee.has_face_data) ? "green" : "red"}
                                                    value={(profileEmp?.has_face_data || selectedEmployee.has_face_data) ? "REGISTERED" : "NOT REGISTERED"}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* Statistics Card */}
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
                                                <span>
                                                    {profileStats?.current_assets_count ||
                                                        selectedEmployee.current_assets_count ||
                                                        currentAssets.length || 0}
                                                </span>
                                            </div>
                                            {profileStats && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span className="font-semibold">Total Issues:</span>
                                                        <span>{profileStats.total_issues}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-semibold">Total Returns:</span>
                                                        <span>{profileStats.total_returns}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-semibold">Total Transactions:</span>
                                                        <span>{profileStats.total_transactions}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            {/* Current Assets Table */}
                            {currentAssets.length > 0 && (
                                <Card className="mt-6 shadow-sm">
                                    <CardHeader color="orange" className="relative h-16">
                                        <Typography variant="h6" color="white" className="text-center">
                                            Current Assets ({currentAssets.length})
                                        </Typography>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="overflow-x-auto">
                                            <table className="w-full table-auto">
                                                <thead>
                                                    <tr>
                                                        <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                                Asset Name
                                                            </Typography>
                                                        </th>
                                                        <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                                Serial Number
                                                            </Typography>
                                                        </th>
                                                        <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                                Department
                                                            </Typography>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentAssets.map((asset, index) => (
                                                        <tr key={asset.id || index}>
                                                            <td className={`py-3 px-5 ${index === currentAssets.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                                                                <Typography variant="small" className="font-semibold">
                                                                    {asset.name}
                                                                </Typography>
                                                            </td>
                                                            <td className={`py-3 px-5 ${index === currentAssets.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                                                                <Typography variant="small">{asset.serial_number}</Typography>
                                                            </td>
                                                            <td className={`py-3 px-5 ${index === currentAssets.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
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