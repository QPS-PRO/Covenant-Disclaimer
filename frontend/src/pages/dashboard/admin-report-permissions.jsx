import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Typography,
    Button,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Input,
    Textarea,
    Chip,
    Spinner,
    Alert,
    IconButton,
} from '@material-tailwind/react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/solid';
import { reportPermissionAPI } from '@/lib/reportsApi';
import { apiGet } from '@/lib/api';

export default function AdminReportPermissions() {
    const [permissions, setPermissions] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);
    const [formData, setFormData] = useState({
        employee: '',
        can_access_reports: true,
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const toArray = (v) =>
        Array.isArray(v) ? v
            : v?.results ?? v?.employees ?? v?.data ?? [];
    
    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [permissionsData, employeesData] = await Promise.all([
                reportPermissionAPI.getAllPermissions(),
                apiGet('/api/employees/'),
            ]);

            setPermissions(toArray(permissionsData));
            setEmployees(toArray(employeesData));
        } catch (err) {
            console.error('Error loading data:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (permission = null) => {
        if (permission) {
            // Editing existing permission
            setEditingPermission(permission);
            setFormData({
                employee: permission.employee,
                can_access_reports: permission.can_access_reports,
                notes: permission.notes || ''
            });
        } else {
            // Creating new permission
            setEditingPermission(null);
            setFormData({
                employee: '',
                can_access_reports: true,
                notes: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingPermission(null);
        setFormData({
            employee: '',
            can_access_reports: true,
            notes: ''
        });
    };

    const handleSubmit = async () => {
        try {
            setError(null);

            if (editingPermission) {
                // Update existing permission
                await reportPermissionAPI.updatePermission(editingPermission.id, formData);
                setSuccess('Permission updated successfully');
            } else {
                // Create new permission
                await reportPermissionAPI.createPermission(formData);
                setSuccess('Permission granted successfully');
            }

            handleCloseDialog();
            await loadData();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error saving permission:', err);
            setError(err.message || 'Failed to save permission');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to revoke this report access permission?')) {
            return;
        }

        try {
            setError(null);
            await reportPermissionAPI.deletePermission(id);
            setSuccess('Permission revoked successfully');
            await loadData();

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error deleting permission:', err);
            setError(err.message || 'Failed to revoke permission');
        }
    };

    // Get employees who don't have permissions yet
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
                                Report Access Permissions
                            </Typography>
                            <Typography variant="small" color="white" className="opacity-80 mt-1">
                                Manage which employees can access and download reports
                            </Typography>
                        </div>
                        <Button
                            color="white"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => handleOpenDialog()}
                        >
                            <PlusIcon className="h-4 w-4" />
                            Grant Access
                        </Button>
                    </div>
                </CardHeader>

                <CardBody>
                    {error && (
                        <Alert color="red" className="mb-6">
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert color="green" className="mb-6">
                            {success}
                        </Alert>
                    )}

                    {permissions.length === 0 ? (
                        <div className="text-center py-12">
                            <Typography variant="h6" color="gray">
                                No Report Permissions Granted
                            </Typography>
                            <Typography variant="small" color="gray" className="mt-2">
                                Click "Grant Access" to allow employees to view reports
                            </Typography>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-max table-auto text-left">
                                <thead>
                                    <tr>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                Employee
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                Employee ID
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                Department
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                Status
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                Granted By
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                Actions
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
                                                    value={permission.can_access_reports ? 'Active' : 'Revoked'}
                                                />
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Typography variant="small" color="blue-gray">
                                                    {permission.granted_by_name || 'N/A'}
                                                </Typography>
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <div className="flex gap-2">
                                                    <IconButton
                                                        variant="text"
                                                        color="blue"
                                                        size="sm"
                                                        onClick={() => handleOpenDialog(permission)}
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </IconButton>
                                                    <IconButton
                                                        variant="text"
                                                        color="red"
                                                        size="sm"
                                                        onClick={() => handleDelete(permission.id)}
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
                    {editingPermission ? 'Edit Report Permission' : 'Grant Report Access'}
                </DialogHeader>
                <DialogBody divider className="space-y-4">
                    <div>
                        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
                            Employee *
                        </Typography>
                        {editingPermission ? (
                            <Input
                                value={editingPermission.employee_name}
                                disabled
                                label="Employee"
                            />
                        ) : (
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={formData.employee}
                                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                                required
                            >
                                <option value="">Select an employee...</option>
                                {availableEmployees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name} - {emp.employee_id} ({emp.department_name})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
                            Access Status *
                        </Typography>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            value={formData.can_access_reports}
                            onChange={(e) => setFormData({ ...formData, can_access_reports: e.target.value === 'true' })}
                        >
                            <option value="true">Active - Can Access Reports</option>
                            <option value="false">Revoked - Cannot Access Reports</option>
                        </select>
                    </div>

                    <div>
                        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
                            Notes (Optional)
                        </Typography>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            label="Add any notes about this permission..."
                            rows={3}
                        />
                    </div>
                </DialogBody>
                <DialogFooter className="space-x-2">
                    <Button variant="text" color="gray" onClick={handleCloseDialog}>
                        Cancel
                    </Button>
                    <Button
                        color="blue"
                        onClick={handleSubmit}
                        disabled={!formData.employee && !editingPermission}
                    >
                        {editingPermission ? 'Update' : 'Grant Access'}
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}