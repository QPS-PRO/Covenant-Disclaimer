// frontend/src/pages/management/employees.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
    UserCircleIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import { employeeAPI, departmentAPI } from "@/lib/assetApi";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import FaceRecognitionComponent from "../../components/FaceRecognitionComponent";

export function Employees() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [mounted, setMounted] = useState(false);

    // pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(Number(import.meta.env.VITE_PAGE_SIZE || 15));
    const [totalCount, setTotalCount] = useState(0);

    // modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [activeTab, setActiveTab] = useState("basic");
    const [faceRegistrationMode, setFaceRegistrationMode] = useState("register");

    const locale = isRTL ? "ar-SA" : "en-SA";

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
            const params = { page, page_size: pageSize };
            if (selectedDepartment) params.department = selectedDepartment;
            if (searchTerm) params.search = searchTerm;

            const response = await employeeAPI.getAll(params);
            const dataArray = Array.isArray(response) ? response : response.results || [];
            setEmployees(dataArray);

            setTotalPages(Number(response?.total_pages || 1));
            setTotalCount(Number(response?.count || dataArray.length));
            setPage(Number(response?.current_page || 1));
            setError("");
        } catch (err) {
            const status = err?.response?.status ?? err?.status;
            if (status === 404 && page > 1) {
                try {
                    const fallback = await employeeAPI.getAll({
                        page: 1,
                        page_size: pageSize,
                        ...(selectedDepartment ? { department: selectedDepartment } : {}),
                        ...(searchTerm ? { search: searchTerm } : {}),
                    });
                    const dataArray = Array.isArray(fallback) ? fallback : fallback.results || [];
                    setEmployees(dataArray);
                    setTotalPages(Number(fallback?.total_pages || 1));
                    setTotalCount(Number(fallback?.count || dataArray.length));
                    setPage(Number(fallback?.current_page || 1));
                    setError("");
                    return;
                } catch { }
            }
            setError(`${t("errors.failedToFetch")} ${t("nav.employees")}`);
            console.error(err);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await departmentAPI.getAllForDropdown();
            setDepartments(response.results || response);
        } catch (err) {
            console.error("Failed to fetch departments:", err);
        }
    };

    useEffect(() => {
        if (!mounted) return;
        const tmr = setTimeout(() => {
            if (page !== 1) setPage(1);
            else fetchEmployees();
        }, 300);
        return () => clearTimeout(tmr);
    }, [searchTerm, selectedDepartment, mounted]);

    useEffect(() => {
        if (!mounted) return;
        fetchEmployees();
    }, [page]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        employee_id: "",
        phone_number: "",
        department: "",
    });
    const [formLoading, setFormLoading] = useState(false);

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
            handleModalClose();
            setPage(1);
            await fetchEmployees();
        } catch (err) {
            setError(err.response?.data?.detail || err.message || t("employees.errors.saveFailed"));
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
            setSelectedEmployee({
                ...response.employee,
                stats: response.stats,
                transaction_history: response.transaction_history,
                current_assets: response.current_assets,
            });
            setShowViewModal(true);
        } catch (err) {
            setError(t("employees.errors.fetchDetails"));
        }
    };

    const handleProfile = (employee) => {
        navigate(`/dashboard/employees/${employee.id}/profile`);
    };

    const handleDelete = async (employee) => {
        // translated confirm
        if (window.confirm(t("employees.confirmDeletePrompt", { name: employee.name }))) {
            try {
                await employeeAPI.delete(employee.id);
                await fetchEmployees();
                if (employees.length === 1 && page > 1) setPage((p) => Math.max(1, p - 1));
            } catch (err) {
                setError(t("employees.errors.deleteFailed"));
            }
        }
    };

    // Face registration handlers
    const handleFaceRegistration = useCallback((employee, mode = "register") => {
        setShowEditModal(false);
        setShowViewModal(false);
        setShowAddModal(false);
        setTimeout(() => {
            setSelectedEmployee(employee);
            setFaceRegistrationMode(mode);
            setShowFaceModal(true);
        }, 100);
    }, []);

    const handleFaceRegistrationSuccess = useCallback(async () => {
        setShowFaceModal(false);
        setSelectedEmployee(null);
        await fetchEmployees();
        setError("");
    }, []);

    const handleFaceRegistrationError = useCallback((error) => {
        setShowFaceModal(false);
        setSelectedEmployee(null);
        setError(error.error || t("employees.errors.saveFailed"));
    }, [t]);

    const handleFaceModalClose = useCallback(() => {
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
                            {t("employees.title")}
                        </Typography>
                        <Button className="flex items-center gap-3" size="sm" onClick={() => setShowAddModal(true)}>
                            <PlusIcon strokeWidth={2} className="h-4 w-4" />
                            {t("employees.add")}
                        </Button>
                    </div>
                </CardHeader>

                <CardBody className="px-0 pt-0 pb-2">
                    {error && <Alert color="red" className="mb-6 mx-6">{error}</Alert>}

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6 px-6">
                        <div className="w-full md:w-72">
                            <Input
                                label={t("employees.searchPlaceholder")}
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Select
                                label={t("employees.filterByDepartment")}
                                value={selectedDepartment ?? ""}
                                onChange={(value) => setSelectedDepartment(value ?? "")}
                                menuProps={{ className: "select-menu-in-dialog", placement: "bottom-start" }}
                                selected={(element) => {
                                    if (React.isValidElement(element) && element.props?.children != null) {
                                        return element.props.children;
                                    }
                                    const raw =
                                        typeof element === "string" || typeof element === "number"
                                            ? String(element)
                                            : selectedDepartment ?? "";
                                    if (!raw) return t("employees.allDepartments");
                                    const d = departments.find((dep) => dep.id.toString() === raw);
                                    return d ? d.name : t("employees.allDepartments");
                                }}
                            >
                                <Option value="">{t("employees.allDepartments")}</Option>
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
                                    {[
                                        t("employees.table.employee"),
                                        t("employees.table.id"),
                                        t("employees.table.department"),
                                        t("employees.table.contact"),
                                        t("employees.table.faceData"),
                                        t("employees.table.status"),
                                        t("employees.table.actions"),
                                    ].map((el) => (
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
                                                    <UserCircleIcon className="h-9 w-9 text-blue-500" onClick={() => handleProfile(employee)} />
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
                                                            <Chip color="green" value={t("employees.registered")} className="text-xs" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            <XCircleIcon className="h-4 w-4 text-red-500" />
                                                            <Chip color="red" value={t("employees.notRegistered")} className="text-xs" />
                                                        </div>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="text"
                                                        color="blue"
                                                        className="p-1"
                                                        onClick={() =>
                                                            handleFaceRegistration(employee, employee.has_face_data ? "update" : "register")
                                                        }
                                                        title={employee.has_face_data ? t("employees.face.update") : t("employees.face.register")}
                                                    >
                                                        <CameraIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className={className}>
                                                <Chip
                                                    variant="gradient"
                                                    color={employee.is_active ? "blue" : "red"}
                                                    value={employee.is_active ? t("employees.active") : t("employees.inactive")}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </td>
                                            <td className={className}>
                                                <div className="flex gap-1">
                                                    <IconButton
                                                        variant="text"
                                                        color="blue-gray"
                                                        onClick={() => handleView(employee)}
                                                        title={t("employees.quickView")}
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                    </IconButton>
                                                    <IconButton
                                                        variant="text"
                                                        color="blue-gray"
                                                        onClick={() => handleEdit(employee)}
                                                        title={t("employees.editEmployee")}
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </IconButton>
                                                    <IconButton
                                                        variant="text"
                                                        color="red"
                                                        onClick={() => handleDelete(employee)}
                                                        title={t("employees.deleteEmployee")}
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

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 text-sm text-blue-gray-600">
                        <span>
                            {t("common.showing")} <b>{rangeStart}</b>–<b>{rangeEnd}</b> {t("common.of")} <b>{totalCount}</b>
                        </span>
                        <div className="flex items-center gap-2">
                            <Button variant="text" size="sm" onClick={goFirst} disabled={!canPrev}>
                                {t("actions.first")}
                            </Button>
                            <Button variant="text" size="sm" onClick={goPrev} disabled={!canPrev}>
                                {t("actions.previous")}
                            </Button>
                            <span className="px-2">
                                {t("common.page")} <b>{page}</b> {t("common.of")} <b>{totalPages}</b>
                            </span>
                            <Button variant="text" size="sm" onClick={goNext} disabled={!canNext}>
                                {t("actions.next")}
                            </Button>
                            <Button variant="text" size="sm" onClick={goLast} disabled={!canNext}>
                                {t("actions.last")}
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Add Employee Modal */}
            <Dialog open={showAddModal} handler={handleModalClose} size="lg">
                <DialogHeader>{t("employees.add")}</DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="space-y-4">
                        <Tabs value={activeTab} onChange={setActiveTab}>
                            <TabsHeader>
                                <Tab value="basic">{t("employees.tabs.basicInfo")}</Tab>
                                <Tab value="face" disabled>{t("employees.tabs.faceRegistration")}</Tab>
                            </TabsHeader>
                            <TabsBody>
                                <TabPanel value="basic" className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label={t("auth.firstName")}
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <Input
                                            label={t("auth.lastName")}
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <Input
                                        type="email"
                                        label={t("auth.email")}
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label={t("employees.profile.employeeId")}
                                            name="employee_id"
                                            value={formData.employee_id}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <Input
                                            label={t("employees.profile.phone")}
                                            name="phone_number"
                                            value={formData.phone_number}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <Select
                                        label={t("assets.department")}
                                        value={formData.department ?? ""}
                                        onChange={(value) => setFormData((prev) => ({ ...prev, department: value ?? "" }))}
                                        required
                                        menuProps={{ className: "select-menu-in-dialog", placement: "bottom-start" }}
                                        selected={(element) => {
                                            if (React.isValidElement(element) && element.props?.children != null) return element.props.children;
                                            const raw =
                                                typeof element === "string" || typeof element === "number"
                                                    ? String(element)
                                                    : formData.department ?? "";
                                            if (!raw) return t("employees.selectDepartment");
                                            const d = departments.find((dep) => dep.id.toString() === raw);
                                            return d ? d.name : t("employees.selectDepartment");
                                        }}
                                    >
                                        <Option value="">{t("employees.selectDepartment")}</Option>
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
                            <Typography variant="small">{t("employees.face.noteCreateFirst")}</Typography>
                        </Alert>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={handleModalClose} className="mr-1">
                            {t("actions.cancel")}
                        </Button>
                        <Button type="submit" loading={formLoading}>
                            {t("employees.create")}
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>

            {/* Edit Employee Modal */}
            <Dialog open={showEditModal} handler={handleModalClose} size="lg">
                <DialogHeader>{t("employees.edit")}</DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="space-y-4">
                        <Tabs value={activeTab} onChange={setActiveTab}>
                            <TabsHeader>
                                <Tab value="basic">{t("employees.tabs.basicInfo")}</Tab>
                                <Tab value="face">{t("employees.tabs.faceManagement")}</Tab>
                            </TabsHeader>
                            <TabsBody>
                                <TabPanel value="basic" className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label={t("auth.firstName")}
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <Input
                                            label={t("auth.lastName")}
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <Input
                                        type="email"
                                        label={t("auth.email")}
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label={t("employees.profile.employeeId")}
                                            name="employee_id"
                                            value={formData.employee_id}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <Input
                                            label={t("employees.profile.phone")}
                                            name="phone_number"
                                            value={formData.phone_number}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <Select
                                        label={t("assets.department")}
                                        value={formData.department ?? ""}
                                        onChange={(value) => setFormData((prev) => ({ ...prev, department: value ?? "" }))}
                                        required
                                        menuProps={{ className: "select-menu-in-dialog", placement: "bottom-start" }}
                                        selected={(element) => {
                                            if (React.isValidElement(element) && element.props?.children != null) return element.props.children;
                                            const raw =
                                                typeof element === "string" || typeof element === "number"
                                                    ? String(element)
                                                    : formData.department ?? "";
                                            if (!raw) return t("employees.selectDepartment");
                                            const d = departments.find((dep) => dep.id.toString() === raw);
                                            return d ? d.name : t("employees.selectDepartment");
                                        }}
                                    >
                                        <Option value="">{t("employees.selectDepartment")}</Option>
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
                                            <Typography variant="h6">{t("employees.face.manageHeader")}</Typography>

                                            <div className="flex items-center justify-center gap-2">
                                                <Typography variant="small" color="gray">
                                                    {t("employees.currentStatus") || t("employees.face.currentStatus")}
                                                </Typography>
                                                {selectedEmployee?.has_face_data ? (
                                                    <Chip color="green" value={t("employees.registered")} />
                                                ) : (
                                                    <Chip color="red" value={t("employees.notRegistered")} />
                                                )}
                                            </div>

                                            <div className="flex justify-center gap-3">
                                                <Button
                                                    color="blue"
                                                    onClick={() =>
                                                        handleFaceRegistration(
                                                            selectedEmployee,
                                                            selectedEmployee?.has_face_data ? "update" : "register"
                                                        )
                                                    }
                                                    className="flex items-center gap-2"
                                                >
                                                    <CameraIcon className="h-4 w-4" />
                                                    {selectedEmployee?.has_face_data ? t("employees.face.update") : t("employees.face.register")}
                                                </Button>
                                            </div>

                                            <Typography variant="small" color="gray" className="text-center">
                                                {t("employees.face.note")}
                                            </Typography>
                                        </div>
                                    </Card>
                                </TabPanel>
                            </TabsBody>
                        </Tabs>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={handleModalClose} className="mr-1">
                            {t("actions.cancel")}
                        </Button>
                        <Button type="submit" loading={formLoading}>
                            {t("employees.update")}
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>

            {/* Quick View Employee Modal */}
            <Dialog open={showViewModal} handler={handleModalClose} size="xl">
                {selectedEmployee && (
                    <>
                        <DialogHeader className="flex items-center justify-between">
                            <span>{t("employees.profile.quickTitle", { name: selectedEmployee.name })}</span>
                            <Button
                                size="sm"
                                color="blue"
                                onClick={() => handleProfile(selectedEmployee)}
                                className="flex items-center gap-2"
                            >
                                <UserIcon className="h-4 w-4" />
                                {t("employees.profile.fullProfile")}
                            </Button>
                        </DialogHeader>

                        <DialogBody className="max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <Card className="shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader floated={false} shadow={false} className="bg-blue-600 px-5 py-3">
                                        <Typography variant="h6" color="white" className="text-center">
                                            {t("employees.profile.basicInfo")}
                                        </Typography>
                                    </CardHeader>

                                    <CardBody className="p-6">
                                        <dl className="divide-y divide-gray-100">
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("employees.profile.name")}</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right truncate">
                                                    {selectedEmployee.name}
                                                </dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("employees.profile.employeeId")}</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                    {selectedEmployee.employee_id}
                                                </dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("employees.profile.email")}</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right truncate">
                                                    {selectedEmployee.email}
                                                </dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("employees.profile.phone")}</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                    {selectedEmployee.phone_number}
                                                </dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("employees.profile.department")}</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                    {selectedEmployee.department_name}
                                                </dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("employees.profile.status")}</dt>
                                                <dd className="col-span-3 flex justify-end">
                                                    <Chip
                                                        color={selectedEmployee.is_active ? "green" : "red"}
                                                        value={selectedEmployee.is_active ? t("employees.active") : t("employees.inactive")}
                                                        className="text-xs"
                                                    />
                                                </dd>
                                            </div>
                                        </dl>
                                    </CardBody>
                                </Card>

                                {/* Face Recognition */}
                                <Card className="shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader floated={false} shadow={false} className="bg-green-600 px-5 py-3">
                                        <Typography variant="h6" color="white" className="text-center">
                                            {t("employees.face.sectionHeader")}
                                        </Typography>
                                    </CardHeader>

                                    <CardBody className="p-6">
                                        <div className="flex flex-col items-center gap-4">
                                            <CameraIcon className="h-12 w-12 text-blue-500" />

                                            <div className="flex items-center gap-2">
                                                <Typography variant="small" color="gray">
                                                    {t("employees.face.statusLabel")}
                                                </Typography>
                                                {selectedEmployee.has_face_data ? (
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                                        <Chip color="green" value={t("employees.registered")} className="text-xs" />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <XCircleIcon className="h-4 w-4 text-red-500" />
                                                        <Chip color="red" value={t("employees.notRegistered")} className="text-xs" />
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
                                                {selectedEmployee.has_face_data ? t("employees.face.update") : t("employees.face.register")}
                                            </Button>

                                            <Typography variant="small" color="gray" className="text-center">
                                                {t("employees.face.note")}
                                            </Typography>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            {/* Statistics */}
                            {selectedEmployee.stats && (
                                <Card className="mt-6 shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader floated={false} shadow={false} className="bg-orange-500 px-5 py-3">
                                        <Typography variant="h6" color="white" className="text-center">
                                            {t("employees.profile.activityStats")}
                                        </Typography>
                                    </CardHeader>
                                    <CardBody className="p-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="text-center">
                                                <Typography variant="h4" color="blue">
                                                    {selectedEmployee.stats.current_assets_count}
                                                </Typography>
                                                <Typography variant="small" color="gray">
                                                    {t("employees.profile.currentAssets")}
                                                </Typography>
                                            </div>

                                            <div className="text-center">
                                                <Typography variant="h4" color="green">
                                                    {selectedEmployee.stats.total_transactions}
                                                </Typography>
                                                <Typography variant="small" color="gray">
                                                    {t("employees.profile.totalTransactions")}
                                                </Typography>
                                            </div>

                                            <div className="text-center">
                                                <Typography variant="h4" color="blue">
                                                    {selectedEmployee.stats.transactions_by_type?.issue ??
                                                        selectedEmployee.stats.total_issues ??
                                                        0}
                                                </Typography>
                                                <Typography variant="small" color="gray">
                                                    {t("employees.profile.issues")}
                                                </Typography>
                                            </div>

                                            <div className="text-center">
                                                <Typography variant="h4" color="orange">
                                                    {selectedEmployee.stats.transactions_by_type?.return ??
                                                        selectedEmployee.stats.total_returns ??
                                                        0}
                                                </Typography>
                                                <Typography variant="small" color="gray">
                                                    {t("employees.profile.returns")}
                                                </Typography>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            )}
                        </DialogBody>

                        <DialogFooter>
                            <Button onClick={handleModalClose}>{t("employees.close")}</Button>
                        </DialogFooter>
                    </>
                )}
            </Dialog>

            {/* Face Registration Modal */}
            <FaceRecognitionComponent
                open={showFaceModal}
                mode={faceRegistrationMode}
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
