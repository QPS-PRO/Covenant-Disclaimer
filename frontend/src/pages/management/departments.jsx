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
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";

export function Departments() {
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [mounted, setMounted] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(Number(import.meta.env.VITE_PAGE_SIZE || 15));
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    // Form
    const [formData, setFormData] = useState({ name: "", manager: "" });
    const [formLoading, setFormLoading] = useState(false);

    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const locale = isRTL ? "ar-SA" : "en-US";

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
                } catch { }
            }
            setError(`${t("errors.failedToFetch")} ${t("nav.departments")}`);
            console.error(err);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await employeeAPI.getAllForDropdown();
            const employeeData = Array.isArray(response) ? response : (response.results || response || []);
            const userData = employeeData.map((emp) => ({
                id: emp.user_data?.id || emp.id,
                name:
                    emp.name ||
                    `${emp.user_data?.first_name || ""} ${emp.user_data?.last_name || ""}`.trim() ||
                    "User",
                email: emp.user_data?.email || emp.email || "",
                first_name: emp.user_data?.first_name || emp.first_name || "",
                last_name: emp.user_data?.last_name || emp.last_name || "",
            }));
            setUsers(userData);
        } catch (err) {
            console.error("Failed to fetch users:", err);
            setError(`${t("errors.failedToFetch")} ${t("common.user")}`);
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
            const submitData = { name: formData.name, manager: formData.manager || null };
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
            setError(err.message || t("errors.unexpectedError"));
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
                t("departments.deleteBody")
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
            setError(`${t("errors.failedToFetch")} ${t("departments.title")}`);
        }
    };

    const resetForm = () => {
        setFormData({ name: "", manager: "" });
        setSelectedDepartment(null);
    };

    const handleModalClose = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowViewModal(false);
        resetForm();
        setError("");
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
            </div>
        );
    }

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
            <Card>
                <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
                    <div className="flex items-center justify-between">
                        <Typography variant="h6" color="white">
                            {t("departments.title")}
                        </Typography>
                        <Button className="flex items-center gap-3" size="sm" onClick={() => setShowAddModal(true)}>
                            <PlusIcon strokeWidth={2} className="h-4 w-4" />
                            {t("departments.add")}
                        </Button>
                    </div>
                </CardHeader>

                <CardBody className="px-0 pt-0 pb-2">
                    {error && (
                        <Alert color="red" className="mb-6 mx-6" dismissible onClose={() => setError("")}>
                            {error}
                        </Alert>
                    )}

                    {/* Search */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6 px-6">
                        <div className="w-full md:w-72">
                            <Input
                                label={t("departments.searchPlaceholder")}
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
                                        t("departments.table.name"),
                                        t("departments.table.manager"),
                                        t("departments.table.employees"),
                                        t("departments.table.assets"),
                                        t("departments.table.created"),
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
                                {departments.map((department, key) => {
                                    const className = `py-3 px-5 ${key === departments.length - 1 ? "" : "border-b border-blue-gray-50"}`;
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
                                                        {t("departments.noManagerAssigned")}
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
                                                    {formatDate(department.created_at)}
                                                </Typography>
                                            </td>

                                            <td className={className}>
                                                <div className="flex items-center gap-2">
                                                    <IconButton variant="text" color="blue-gray" onClick={() => handleViewDepartment(department)}>
                                                        <EyeIcon className="h-4 w-4" />
                                                    </IconButton>
                                                    <IconButton variant="text" color="blue-gray" onClick={() => handleEdit(department)}>
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
                                {t("departments.noneFound")}
                            </Typography>
                        </div>
                    )}

                    {/* Pager */}
                    <div className="flex items-center justify-between px-6 pb-2 text-sm text-blue-gray-600">
                        <span>
                            {t("common.showing")} <b>{rangeStart}</b>–<b>{rangeEnd}</b> {t("common.of")} <b>{totalCount}</b>
                        </span>
                        <div className="flex items-center gap-2">
                            <Button variant="text" size="sm" onClick={() => setPage(1)} disabled={!canPrev}>
                                {t("actions.first")}
                            </Button>
                            <Button variant="text" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev}>
                                {t("actions.previous")}
                            </Button>
                            <span className="px-2">
                                {t("common.page")} <b>{page}</b> {t("common.of")} <b>{totalPages}</b>
                            </span>
                            <Button
                                variant="text"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={!canNext}
                            >
                                {t("actions.next")}
                            </Button>
                            <Button variant="text" size="sm" onClick={() => setPage(totalPages)} disabled={!canNext}>
                                {t("actions.last")}
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Add/Edit Modal */}
            <Dialog open={showAddModal || showEditModal} handler={handleModalClose} size="md">
                <DialogHeader>
                    {selectedDepartment && showEditModal ? t("departments.headerEdit") : t("departments.headerAdd")}
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        {error && <Alert color="red" className="mb-4">{error}</Alert>}

                        <Input
                            label={t("departments.name")}
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />

                        <Select
                            label={t("departments.managerOptional")}
                            value={formData.manager ?? ""}
                            onChange={(value) => setFormData((prev) => ({ ...prev, manager: value ?? "" }))}
                            menuProps={{ className: "select-menu-in-dialog", placement: "bottom-start" }}
                            selected={(element) => {
                                if (React.isValidElement(element) && element.props?.children != null) {
                                    return element.props.children;
                                }
                                const raw = (typeof element === "string" || typeof element === "number")
                                    ? String(element)
                                    : (formData.manager ?? "");
                                if (!raw) return t("departments.noManager");
                                const u = users.find((usr) => usr.id.toString() === raw);
                                if (!u) return t("departments.noManager");
                                const name =
                                    u.name || [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || t("common.user");
                                const email = u.email ? ` (${u.email})` : "";
                                return `${name}${email}`;
                            }}
                        >
                            <Option value="">{t("departments.noManager")}</Option>
                            {users.map((user) => (
                                <Option key={user.id} value={user.id.toString()}>
                                    {(user.name ||
                                        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
                                        user.email ||
                                        t("common.user"))}
                                    {user.email ? ` (${user.email})` : ""}
                                </Option>
                            ))}
                        </Select>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={handleModalClose} className="mr-1">
                            {t("actions.cancel")}
                        </Button>
                        <Button type="submit" loading={formLoading}>
                            {selectedDepartment && showEditModal ? t("departments.update") : t("departments.create")}
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={showDeleteModal} handler={() => setShowDeleteModal(false)} size="sm">
                <DialogHeader>{t("departments.deleteTitle")}</DialogHeader>
                <DialogBody>
                    {error && <Alert color="red" className="mb-4">{error}</Alert>}

                    {t("departments.deleteBody")}

                    {selectedDepartment && (
                        <div className="mt-2 p-2 bg-gray-100 rounded">
                            <Typography variant="small" className="font-semibold">
                                {selectedDepartment.name}
                            </Typography>
                            <Typography variant="small" className="text-gray-600">
                                {t("departments.table.employees")}: {selectedDepartment.employee_count} | {t("departments.table.assets")}: {selectedDepartment.asset_count}
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
                        {t("actions.cancel")}
                    </Button>
                    <Button color="red" onClick={handleDelete} loading={formLoading}>
                        {t("actions.delete")}
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* View Modal */}
            <Dialog open={showViewModal} handler={() => setShowViewModal(false)} size="md">
                {selectedDepartment && (
                    <>
                        <DialogHeader>
                            {t("departments.viewTitle", { name: selectedDepartment.name })}
                        </DialogHeader>
                        <DialogBody className="max-h-[70vh] overflow-y-auto">
                            <Card className="shadow-sm rounded-xl overflow-hidden">
                                <CardHeader floated={false} shadow={false} className="bg-blue-600 px-5 py-3">
                                    <Typography variant="h6" color="white" className="text-center">
                                        {t("departments.infoHeader")}
                                    </Typography>
                                </CardHeader>
                                <CardBody className="p-6">
                                    <dl className="divide-y divide-gray-100">
                                        <div className="grid grid-cols-5 items-center py-2">
                                            <dt className="col-span-2 text-sm font-medium text-gray-600">
                                                {t("departments.info.name")}
                                            </dt>
                                            <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                {selectedDepartment.name}
                                            </dd>
                                        </div>
                                        <div className="grid grid-cols-5 items-center py-2">
                                            <dt className="col-span-2 text-sm font-medium text-gray-600">
                                                {t("departments.info.manager")}
                                            </dt>
                                            <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                {selectedDepartment.manager_name || t("departments.noManagerAssigned")}
                                            </dd>
                                        </div>
                                        <div className="grid grid-cols-5 items-center py-2">
                                            <dt className="col-span-2 text-sm font-medium text-gray-600">
                                                {t("departments.info.activeEmployees")}
                                            </dt>
                                            <dd className="col-span-3 flex items-center justify-end gap-1 text-sm text-gray-900">
                                                <UsersIcon className="h-4 w-4 text-blue-500" />
                                                {selectedDepartment.employee_count}
                                            </dd>
                                        </div>
                                        <div className="grid grid-cols-5 items-center py-2">
                                            <dt className="col-span-2 text-sm font-medium text-gray-600">
                                                {t("departments.info.totalAssets")}
                                            </dt>
                                            <dd className="col-span-3 flex items-center justify-end gap-1 text-sm text-gray-900">
                                                <CubeIcon className="h-4 w-4 text-green-500" />
                                                {selectedDepartment.asset_count}
                                            </dd>
                                        </div>
                                        <div className="grid grid-cols-5 items-center py-2">
                                            <dt className="col-span-2 text-sm font-medium text-gray-600">
                                                {t("departments.info.created")}
                                            </dt>
                                            <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                {formatDate(selectedDepartment.created_at)}
                                            </dd>
                                        </div>
                                        <div className="grid grid-cols-5 items-center py-2">
                                            <dt className="col-span-2 text-sm font-medium text-gray-600">
                                                {t("departments.info.lastUpdated")}
                                            </dt>
                                            <dd className="col-span-3 text-sm text-gray-900 text-right">
                                                {formatDate(selectedDepartment.updated_at)}
                                            </dd>
                                        </div>
                                    </dl>
                                </CardBody>
                            </Card>
                        </DialogBody>
                        <DialogFooter>
                            <Button onClick={() => setShowViewModal(false)}>{t("actions.close")}</Button>
                        </DialogFooter>
                    </>
                )}
            </Dialog>
        </div>
    );
}

export default Departments;
