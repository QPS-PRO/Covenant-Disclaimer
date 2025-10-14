// AdminReportPermissions.jsx
import React, { useState, useEffect } from 'react';
import {
    Card, CardBody, CardHeader, Typography, Button,
    Dialog, DialogHeader, DialogBody, DialogFooter,
    Input, Textarea, Chip, Spinner, Alert, IconButton,
} from '@material-tailwind/react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/solid';
import { reportPermissionAPI } from '@/lib/reportsApi';
// import { apiGet } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { employeeAPI } from '@/lib/assetApi';

export default function AdminReportPermissions() {
    const { t } = useTranslation();

    const [permissions, setPermissions] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [openDialog, setOpenDialog] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);
    const [formData, setFormData] = useState({
        employee: '',
        can_access_reports: true,
        notes: ''
    });

    useEffect(() => { loadData(); }, []);

    const toArray = (v) => Array.isArray(v) ? v : v?.results ?? v?.employees ?? v?.data ?? [];

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [permissionsData, employeesDropdown] = await Promise.all([
                reportPermissionAPI.getAllPermissions(),
                employeeAPI.getAllForDropdown(),
            ]);

            setPermissions(toArray(permissionsData));
            setEmployees(toArray(employeesDropdown));
        } catch (err) {
            console.error('Error loading data:', err);
            setError(err.message || t('reportsPermissions.errors.load'));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (permission = null) => {
        if (permission) {
            setEditingPermission(permission);
            setFormData({
                employee: permission.employee,
                can_access_reports: permission.can_access_reports,
                notes: permission.notes || ''
            });
        } else {
            setEditingPermission(null);
            setFormData({ employee: '', can_access_reports: true, notes: '' });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingPermission(null);
        setFormData({ employee: '', can_access_reports: true, notes: '' });
    };

    const handleSubmit = async () => {
        try {
            setError(null);

            if (editingPermission) {
                await reportPermissionAPI.updatePermission(editingPermission.id, formData);
                setSuccess(t('reportsPermissions.messages.updateSuccess'));
            } else {
                await reportPermissionAPI.createPermission(formData);
                setSuccess(t('reportsPermissions.messages.createSuccess'));
            }

            handleCloseDialog();
            await loadData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error saving permission:', err);
            setError(err.message || t('reportsPermissions.errors.save'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('reportsPermissions.confirm.revoke'))) return;

        try {
            setError(null);
            await reportPermissionAPI.deletePermission(id);
            setSuccess(t('reportsPermissions.messages.deleteSuccess'));
            await loadData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error deleting permission:', err);
            setError(err.message || t('reportsPermissions.errors.delete'));
        }
    };

    const availableEmployees = Array.isArray(employees)
        ? employees.filter(emp => !permissions.some(perm => perm.employee === emp.id))
        : [];

    if (loading) {
        return (
            <div className="mt-12 mb-8 flex justify-center items-center h-64">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
            <Card>
                <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <Typography variant="h6" color="white">
                                {t('reportsPermissions.header.title')}
                            </Typography>
                            <Typography variant="small" color="white" className="opacity-80 mt-1">
                                {t('reportsPermissions.header.subtitle')}
                            </Typography>
                        </div>
                        <Button
                            color="white"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => handleOpenDialog()}
                        >
                            <PlusIcon className="h-4 w-4" />
                            {t('reportsPermissions.actions.grantAccess')}
                        </Button>
                    </div>
                </CardHeader>

                <CardBody>
                    {error && (<Alert color="red" className="mb-6">{error}</Alert>)}
                    {success && (<Alert color="green" className="mb-6">{success}</Alert>)}

                    {permissions.length === 0 ? (
                        <div className="text-center py-12">
                            <Typography variant="h6" color="gray">
                                {t('reportsPermissions.empty.title')}
                            </Typography>
                            <Typography variant="small" color="gray" className="mt-2">
                                {t('reportsPermissions.empty.subtitle')}
                            </Typography>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-max table-auto text-left">
                                <thead>
                                    <tr>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                {t('reportsPermissions.table.employee')}
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                {t('reportsPermissions.table.employeeId')}
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                {t('reportsPermissions.table.department')}
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                {t('reportsPermissions.table.status')}
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                {t('reportsPermissions.table.grantedBy')}
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                {t('reportsPermissions.table.actions')}
                                            </Typography>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {permissions.map((permission) => (
                                        <tr key={permission.id}>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Typography variant="small" color="blue-gray">
                                                    {permission.employee_name}
                                                </Typography>
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Typography variant="small" color="blue-gray">
                                                    {permission.employee_id_number}
                                                </Typography>
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Typography variant="small" color="blue-gray">
                                                    {permission.employee_department}
                                                </Typography>
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Chip
                                                    size="sm"
                                                    color={permission.can_access_reports ? 'green' : 'red'}
                                                    value={
                                                        permission.can_access_reports
                                                            ? t('reportsPermissions.status.active')
                                                            : t('reportsPermissions.status.revoked')
                                                    }
                                                />
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Typography variant="small" color="blue-gray">
                                                    {permission.granted_by_name || t('reportsPermissions.common.na')}
                                                </Typography>
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <div className="flex gap-2">
                                                    <IconButton
                                                        variant="text"
                                                        color="blue"
                                                        size="sm"
                                                        onClick={() => handleOpenDialog(permission)}
                                                        aria-label={t('reportsPermissions.actions.edit')}
                                                        title={t('reportsPermissions.actions.edit')}
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </IconButton>
                                                    <IconButton
                                                        variant="text"
                                                        color="red"
                                                        size="sm"
                                                        onClick={() => handleDelete(permission.id)}
                                                        aria-label={t('reportsPermissions.actions.delete')}
                                                        title={t('reportsPermissions.actions.delete')}
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </IconButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} handler={handleCloseDialog} size="md">
                <DialogHeader>
                    {editingPermission
                        ? t('reportsPermissions.dialog.editTitle')
                        : t('reportsPermissions.dialog.createTitle')}
                </DialogHeader>
                <DialogBody divider className="space-y-4">
                    <div>
                        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
                            {t('reportsPermissions.form.employee')} *
                        </Typography>
                        {editingPermission ? (
                            <Input
                                value={editingPermission.employee_name}
                                disabled
                                label={t('reportsPermissions.form.employee')}
                            />
                        ) : (
                            <div className="max-h-64 overflow-y-auto rounded-lg">
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    value={formData.employee}
                                    onChange={(e) => setFormData({ ...formData, employee: Number(e.target.value) })}
                                    required
                                >
                                    <option value="">{t('reportsPermissions.form.selectEmployee')}</option>
                                    {availableEmployees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} - {emp.employee_id} ({emp.department_name})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
                            {t('reportsPermissions.form.accessStatus')} *
                        </Typography>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            value={String(formData.can_access_reports)}
                            onChange={(e) =>
                                setFormData({ ...formData, can_access_reports: e.target.value === 'true' })
                            }
                        >
                            <option value="true">{t('reportsPermissions.form.status.active')}</option>
                            <option value="false">{t('reportsPermissions.form.status.revoked')}</option>
                        </select>
                    </div>

                    <div>
                        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
                            {t('reportsPermissions.form.notesOptional')}
                        </Typography>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            label={t('reportsPermissions.form.notesPlaceholder')}
                            rows={3}
                        />
                    </div>
                </DialogBody>
                <DialogFooter className="space-x-2">
                    <Button variant="text" color="gray" onClick={handleCloseDialog}>
                        {t('reportsPermissions.actions.cancel')}
                    </Button>
                    <Button
                        color="blue"
                        onClick={handleSubmit}
                        disabled={!formData.employee && !editingPermission}
                    >
                        {editingPermission
                            ? t('reportsPermissions.actions.update')
                            : t('reportsPermissions.actions.grant')}
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}