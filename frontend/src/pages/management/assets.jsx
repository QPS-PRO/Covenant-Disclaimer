// frontend/src/pages/management/assets.jsx
import React, { useState, useEffect, useMemo } from "react";
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
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";

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

    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const locale = isRTL ? "ar-SA" : "en-US";
    const currencyLocale = isRTL ? "ar-SA" : "en-SA";

    // Status options (translated)
    const statusOptions = useMemo(
        () => [
            { value: "available", label: t("status.available"), color: "green" },
            { value: "assigned", label: t("status.assigned"), color: "blue" },
            { value: "maintenance", label: t("status.maintenance"), color: "orange" },
            { value: "retired", label: t("status.retired"), color: "red" },
        ],
        [t]
    );

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
            const dataArray = Array.isArray(response) ? response : response.results || [];
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
                    const dataArray = Array.isArray(fallback) ? fallback : fallback.results || [];
                    setAssets(dataArray);
                    setTotalPages(Number(fallback?.total_pages || 1));
                    setTotalCount(Number(fallback?.count || dataArray.length));
                    setPage(Number(fallback?.current_page || 1));
                    setError("");
                    return;
                } catch { }
            }

            setError(`${t("errors.failedToFetch")} ${t("nav.assets")}`);
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

    const fetchEmployees = async () => {
        try {
            const response = await employeeAPI.getAllForDropdown();
            setEmployees(response.results || response);
        } catch (err) {
            console.error("Failed to fetch employees:", err);
        }
    };

    useEffect(() => {
        if (!mounted) return;
        const timer = setTimeout(() => {
            if (page !== 1) setPage(1);
            else fetchAssets();
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
                const allowed = ["available", "maintenance", "retired"];
                if (!allowed.includes(formData.status)) {
                    setFormLoading(false);
                    setError("Status can only be changed to available, maintenance, or retired.");
                    return;
                }
                await assetAPI.update(selectedAsset.id, { status: formData.status });
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
                setError(err.message || t("errors.unexpectedError"));
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
                setError(err.message || t("errors.unexpectedError"));
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

    const getStatusLabel = (status) => {
        const opt = statusOptions.find((o) => o.value === status);
        const label = opt ? opt.label : status;
        return isRTL ? label : String(label).toUpperCase();
    };

    // put this near the top of the component (after isRTL/locale)
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined || amount === "") return t("common.noData");
        const num = Number(amount);
        if (Number.isNaN(num)) return t("common.noData");

        return new Intl.NumberFormat(currencyLocale, {
            style: "currency",
            currency: "SAR",
            currencyDisplay: "symbol", // ar-SA shows "ر.س", en-SA shows "SAR"
            maximumFractionDigits: 2,
        }).format(num);
    };


    const formatDate = (dateString) =>
        dateString ? new Date(dateString).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" }) : "N/A";

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
                            {t("assets.title")}
                        </Typography>
                        <Button className="flex items-center gap-3" size="sm" onClick={() => setShowAddModal(true)}>
                            <PlusIcon strokeWidth={2} className="h-4 w-4" />
                            {t("assets.addAsset")}
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
                                label={t("assets.searchAssets")}
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Department filter */}
                        <div className="w-full lg:w-60">
                            <Select
                                label={t("assets.filterByDepartment")}
                                value={selectedDepartment ?? ""}
                                onChange={(value) => setSelectedDepartment(value ?? "")}
                                menuProps={{ className: "select-menu-in-dialog", placement: "bottom-start" }}
                                selected={(element) => {
                                    if (React.isValidElement(element) && element.props?.children != null) return element.props.children;
                                    const raw =
                                        typeof element === "string" || typeof element === "number"
                                            ? String(element)
                                            : selectedDepartment ?? "";
                                    if (!raw) return t("assets.allDepartments");
                                    const d = departments.find((dep) => dep.id.toString() === raw);
                                    return d ? d.name : t("assets.allDepartments");
                                }}
                            >
                                <Option value="">{t("assets.allDepartments")}</Option>
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
                                label={t("assets.filterByStatus")}
                                value={selectedStatus ?? ""}
                                onChange={(value) => setSelectedStatus(value ?? "")}
                                selected={(element) => {
                                    if (React.isValidElement(element) && element.props?.children != null) return element.props.children;
                                    const raw =
                                        typeof element === "string" || typeof element === "number"
                                            ? String(element)
                                            : selectedStatus ?? "";
                                    if (!raw) return t("assets.allStatuses");
                                    const opt = statusOptions.find((s) => String(s.value) === raw);
                                    return opt ? opt.label : t("assets.allStatuses");
                                }}
                            >
                                <Option value="">{t("assets.allStatuses")}</Option>
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
                                    {[
                                        t("assets.assetName"),
                                        t("assets.serialNumber"),
                                        t("assets.department"),
                                        t("assets.status"),
                                        t("assets.currentHolder"),
                                        t("assets.purchaseCost"),
                                        t("departments.table.actions"),
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
                                                    value={getStatusLabel(asset.status)}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-normal text-blue-gray-500">
                                                    {asset.current_holder_name || t("assets.unassigned")}
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
                                                    <IconButton
                                                        variant="text"
                                                        color="blue-gray"
                                                        onClick={() => handleEdit(asset)}
                                                        disabled={asset.status === "assigned"}
                                                        className={asset.status === "assigned" ? "opacity-50 cursor-not-allowed" : ""}
                                                        aria-label={t("assets.editAsset")}
                                                        title={t("assets.editAsset")}
                                                    >
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
                                {t("assets.noAssetsFound")}
                            </Typography>
                        </div>
                    )}

                    {/* pager */}
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

            {/* Add/Edit Asset Modal */}
            <Dialog open={showAddModal || showEditModal} handler={handleModalClose} size="lg">
                <DialogHeader>
                    {selectedAsset && showEditModal ? t("assets.editAsset") : t("assets.addAsset")}
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        {error && <Alert color="red" className="mb-4">{error}</Alert>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t("assets.assetName")}
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                            <Input
                                label={t("assets.serialNumber")}
                                name="serial_number"
                                value={formData.serial_number}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label={t("assets.department")}
                                value={formData.department}
                                onChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
                                required
                                menuProps={{ className: "select-menu-in-dialog", placement: "bottom-start" }}
                            >
                                {departments.map((dept) => (
                                    <Option key={dept.id} value={dept.id.toString()}>
                                        {dept.name}
                                    </Option>
                                ))}
                            </Select>

                            <Select
                                label={t("assets.status")}
                                value={formData.status}
                                onChange={(value) => setFormData((p) => ({ ...p, status: value }))}
                                required
                                menuProps={{ className: "select-menu-in-dialog", placement: "bottom-start" }}
                            >
                                <Option value="available">{t("status.available")}</Option>
                                <Option value="maintenance">{t("status.maintenance")}</Option>
                                <Option value="retired">{t("status.retired")}</Option>
                            </Select>


                        </div>

                        {/* Current Holder field - only show if status is 'assigned' */}
                        {formData.status === "assigned" && (
                            <Select
                                label={t("assets.currentHolder")}
                                value={formData.current_holder ?? ""} // keep it a string
                                onChange={(value) => setFormData((prev) => ({ ...prev, current_holder: value ?? "" }))}
                                required
                                menuProps={{ className: "select-menu-in-dialog max-h-48 overflow-y-auto", placement: "bottom-start" }}
                                selected={(element) => {
                                    if (React.isValidElement(element) && element.props?.children != null) {
                                        return element.props.children;
                                    }
                                    const id =
                                        typeof element === "string" || typeof element === "number"
                                            ? String(element)
                                            : formData.current_holder ?? "";
                                    if (!id) return t("assets.selectEmployee");
                                    const e =
                                        (getDepartmentEmployees?.() || []).find((emp) => emp.id.toString() === id) ||
                                        (employees || []).find((emp) => emp.id.toString() === id);
                                    return e ? `${e.name} (${e.employee_id})` : t("assets.selectEmployee");
                                }}
                            >
                                <Option value="" disabled>
                                    {t("assets.selectEmployee")}
                                </Option>
                                {getDepartmentEmployees().map((employee) => (
                                    <Option key={employee.id} value={employee.id.toString()}>
                                        {employee.name} ({employee.employee_id})
                                    </Option>
                                ))}
                            </Select>
                        )}

                        <Textarea
                            label={t("assets.description")}
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t("assets.purchaseDate")}
                                name="purchase_date"
                                type="date"
                                value={formData.purchase_date}
                                onChange={handleInputChange}
                            />
                            <Input
                                label={t("assets.purchaseCost")}
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
                            {t("actions.cancel")}
                        </Button>
                        <Button type="submit" disabled={formLoading}>
                            {selectedAsset && showEditModal ? t("assets.updateAsset") : t("assets.createAsset")}
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>

            {/* View Asset Modal */}
            <Dialog open={showViewModal} handler={() => setShowViewModal(false)} size="lg">
                {showViewModal && selectedAsset && (
                    <>
                        <DialogHeader>
                            {t("assets.assetDetails")} - {selectedAsset.name}
                        </DialogHeader>

                        <DialogBody className="max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Information */}
                                <Card className="shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader floated={false} shadow={false} className="bg-blue-600 px-5 py-3">
                                        <Typography variant="h6" color="white" className="text-center">
                                            {t("assets.basicInformation")}
                                        </Typography>
                                    </CardHeader>
                                    <CardBody className="p-6">
                                        <dl className="divide-y divide-gray-100">
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("assets.name")}</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{selectedAsset.name}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("assets.serialNumber")}</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{selectedAsset.serial_number}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("assets.department")}</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">{selectedAsset.department_name}</dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("assets.status")}</dt>
                                                <dd className="col-span-3 flex justify-end">
                                                    <Chip
                                                        variant="gradient"
                                                        color={getStatusColor(selectedAsset.status)}
                                                        value={getStatusLabel(selectedAsset.status)}
                                                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                    />
                                                </dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("assets.currentHolder")}</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                    {selectedAsset.current_holder_name || t("assets.unassigned")}
                                                </dd>
                                            </div>
                                        </dl>
                                    </CardBody>
                                </Card>

                                {/* Purchase Information */}
                                <Card className="shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader floated={false} shadow={false} className="bg-green-600 px-5 py-3">
                                        <Typography variant="h6" color="white" className="text-center">
                                            {t("assets.purchaseInformation")}
                                        </Typography>
                                    </CardHeader>
                                    <CardBody className="p-6">
                                        <dl className="divide-y divide-gray-100">
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("assets.purchaseDate")}</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                    {formatDate(selectedAsset.purchase_date)}
                                                </dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("assets.purchaseCost")}</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                    {formatCurrency(selectedAsset.purchase_cost)}
                                                </dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("assets.created")}</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                    {formatDate(selectedAsset.created_at)}
                                                </dd>
                                            </div>
                                            <div className="grid grid-cols-5 items-center py-2">
                                                <dt className="col-span-2 text-sm font-medium text-gray-600">{t("assets.lastUpdated")}</dt>
                                                <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                    {formatDate(selectedAsset.updated_at)}
                                                </dd>
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
                                            {t("assets.description")}
                                        </Typography>
                                    </CardHeader>
                                    <CardBody className="p-6">
                                        <Typography className="text-sm text-gray-700">{selectedAsset.description}</Typography>
                                    </CardBody>
                                </Card>
                            )}
                        </DialogBody>

                        <DialogFooter>
                            <Button onClick={() => setShowViewModal(false)}>{t("actions.close")}</Button>
                        </DialogFooter>
                    </>
                )}
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} handler={() => setShowDeleteModal(false)} size="sm">
                <DialogHeader className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                    {t("assets.confirmDelete")}
                </DialogHeader>
                <DialogBody>
                    {error && <Alert color="red" className="mb-4">{error}</Alert>}

                    {selectedAsset?.can_be_deleted === false ? (
                        <div className="space-y-4">
                            <Alert color="amber" className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-5 w-5" />
                                <Typography variant="small">{t("assets.cannotDelete")}</Typography>
                            </Alert>

                            {selectedAsset && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Typography variant="small" className="font-semibold text-gray-800 mb-2">
                                        {t("assets.assetDetailsLabel")}
                                    </Typography>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <div>
                                            <strong>{t("assets.name")}:</strong> {selectedAsset.name}
                                        </div>
                                        <div>
                                            <strong>{t("assets.serial")}:</strong> {selectedAsset.serial_number}
                                        </div>
                                        <div>
                                            <strong>{t("assets.status")}:</strong> {getStatusLabel(selectedAsset.status)}
                                        </div>
                                        <div>
                                            <strong>{t("assets.assignedTo")}:</strong> {selectedAsset.current_holder_name}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Typography variant="small" className="text-gray-700">
                                {t("assets.returnAssetFirst")}
                            </Typography>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Typography variant="paragraph">{t("assets.deleteConfirmation")}</Typography>

                            {selectedAsset && (
                                <div className="p-3 bg-gray-100 rounded-lg">
                                    <Typography variant="small" className="font-semibold text-gray-800">
                                        {selectedAsset.name}
                                    </Typography>
                                    <Typography variant="small" className="text-gray-600">
                                        {t("assets.serial")}: {selectedAsset.serial_number}
                                    </Typography>
                                    <Typography variant="small" className="text-gray-600">
                                        {t("assets.status")}: {getStatusLabel(selectedAsset.status)}
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
                        {selectedAsset?.can_be_deleted === false ? t("actions.close") : t("actions.cancel")}
                    </Button>

                    {selectedAsset?.can_be_deleted !== false && (
                        <Button color="red" onClick={handleDelete} loading={formLoading}>
                            {t("assets.deleteAsset")}
                        </Button>
                    )}
                </DialogFooter>
            </Dialog>
        </div >
    );
}

export default Assets;
