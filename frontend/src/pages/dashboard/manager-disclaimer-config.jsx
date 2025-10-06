import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    Typography,
    Button,
    IconButton,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Select,
    Option,
    Alert,
    Spinner,
    Chip
} from '@material-tailwind/react';
import {
    PlusIcon,
    TrashIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    Bars3Icon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { disclaimerManagerAPI } from '@/lib/disclaimerApi';

export default function ManagerDisclaimerConfiguration() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [availableDepartments, setAvailableDepartments] = useState([]);
    const [department, setDepartment] = useState(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await disclaimerManagerAPI.getDisclaimerOrders();
            setOrders(data.orders || []);
            setAvailableDepartments(data.available_departments || []);
            setDepartment(data.department);
        } catch (err) {
            setError(err.message || t('managerDisclaimerConfig.errors.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddDepartment = async () => {
        if (!selectedDepartment) return;

        try {
            setSubmitting(true);
            setError(null);
            await disclaimerManagerAPI.createDisclaimerOrder({
                target_department: parseInt(selectedDepartment)
            });
            setSuccess(t('managerDisclaimerConfig.success.added'));
            setShowAddDialog(false);
            setSelectedDepartment('');
            await loadOrders();
        } catch (err) {
            setError(err.message || t('managerDisclaimerConfig.errors.addFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteDepartment = async (orderId) => {
        if (!window.confirm(t('managerDisclaimerConfig.confirmRemove'))) {
            return;
        }

        try {
            setError(null);
            await disclaimerManagerAPI.deleteDisclaimerOrder(orderId);
            setSuccess(t('managerDisclaimerConfig.success.removed'));
            await loadOrders();
        } catch (err) {
            setError(err.message || t('managerDisclaimerConfig.errors.removeFailed'));
        }
    };

    // const handleMoveUp = async (index) => {
    //     if (index === 0) return;
    //     const newOrders = [...orders];
    //     [newOrders[index - 1], newOrders[index]] = [newOrders[index], newOrders[index - 1]];
    //     await updateOrdersOnServer(newOrders);
    // };

    // const handleMoveDown = async (index) => {
    //     if (index === orders.length - 1) return;
    //     const newOrders = [...orders];
    //     [newOrders[index + 1], newOrders[index]] = [newOrders[index], newOrders[index + 1]];
    //     await updateOrdersOnServer(newOrders);
    // };

    const updateOrdersOnServer = async (newOrders) => {
        try {
            setError(null);
            const ordersData = newOrders.map((order, idx) => ({
                id: order.id,
                order: idx + 1
            }));
            const updatedOrders = await disclaimerManagerAPI.reorderDisclaimerOrders(ordersData);
            setOrders(updatedOrders);
            setSuccess(t('managerDisclaimerConfig.success.reordered'));
        } catch (err) {
            setError(err.message || t('managerDisclaimerConfig.errors.reorderFailed'));
            await loadOrders();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
            <Card>
                <CardBody>
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <Typography variant="h4" color="blue-gray" className="mb-2">
                                {t('managerDisclaimerConfig.title')}
                            </Typography>
                            <Typography color="gray" className="font-normal">
                                {t('managerDisclaimerConfig.subtitle')}
                            </Typography>
                            {department && (
                                <Chip
                                    value={t('managerDisclaimerConfig.managing', { name: department.name })}
                                    color="blue"
                                    className="mt-2"
                                />
                            )}
                        </div>
                        <Button
                            color="blue"
                            className="flex items-center gap-2"
                            onClick={() => setShowAddDialog(true)}
                            disabled={availableDepartments.length === 0}
                        >
                            <PlusIcon className="h-5 w-5" />
                            {t('managerDisclaimerConfig.addDept')}
                        </Button>
                    </div>

                    {error && (
                        <Alert color="red" className="mb-4" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert color="green" className="mb-4" onClose={() => setSuccess(null)}>
                            {success}
                        </Alert>
                    )}

                    {orders.length === 0 ? (
                        <div className="text-center py-12">
                            <Bars3Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <Typography color="gray" className="mb-4">
                                {t('managerDisclaimerConfig.empty.title')}
                            </Typography>
                            <Typography variant="small" color="gray">
                                {t('managerDisclaimerConfig.empty.body')}
                            </Typography>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orders.map((order, index) => (
                                <Card key={order.id} className="border border-gray-200">
                                    <CardBody className="p-4">
                                        <div className="flex items-center gap-4">
                                            {/* Step Number */}
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                                                    {index + 1}
                                                </div>
                                            </div>

                                            {/* Department Info */}
                                            <div className="flex-1">
                                                <Typography variant="h6" color="blue-gray">
                                                    {order.target_department_name}
                                                </Typography>
                                                <Typography variant="small" color="gray">
                                                    {t('managerDisclaimerConfig.stepBadge', { order: order.order })}
                                                </Typography>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                {/* <IconButton
                                                    variant="text"
                                                    color="blue-gray"
                                                    onClick={() => handleMoveUp(index)}
                                                    disabled={index === 0}
                                                >
                                                    <ArrowUpIcon className="h-5 w-5" />
                                                </IconButton>
                                                <IconButton
                                                    variant="text"
                                                    color="blue-gray"
                                                    onClick={() => handleMoveDown(index)}
                                                    disabled={index === orders.length - 1}
                                                >
                                                    <ArrowDownIcon className="h-5 w-5" />
                                                </IconButton> */}
                                                <IconButton
                                                    variant="text"
                                                    color="red"
                                                    onClick={() => handleDeleteDepartment(order.id)}
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </IconButton>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    )}

                    {availableDepartments.length === 0 && orders.length > 0 && (
                        <Alert color="blue" className="mt-4">
                            {t('managerDisclaimerConfig.allAdded')}
                        </Alert>
                    )}
                </CardBody>
            </Card>

            {/* Add Department Dialog */}
            <Dialog open={showAddDialog} handler={() => setShowAddDialog(false)} size="sm">
                <DialogHeader>{t('managerDisclaimerConfig.dialog.title')}</DialogHeader>
                <DialogBody divider>
                    <div className="space-y-4">
                        <Typography>
                            {t('managerDisclaimerConfig.dialog.help')}
                        </Typography>
                        <Select
                            label={t('managerDisclaimerConfig.dialog.selectLabel')}
                            value={selectedDepartment}
                            onChange={(val) => setSelectedDepartment(val)}
                        >
                            {availableDepartments.map((dept) => (
                                <Option key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                </Option>
                            ))}
                        </Select>
                        {availableDepartments.length === 0 && (
                            <Alert color="amber">
                                {t('managerDisclaimerConfig.dialog.noneLeft')}
                            </Alert>
                        )}
                    </div>
                </DialogBody>
                <DialogFooter className="gap-2">
                    <Button
                        variant="text"
                        color="gray"
                        onClick={() => {
                            setShowAddDialog(false);
                            setSelectedDepartment('');
                        }}
                        disabled={submitting}
                    >
                        {t('managerDisclaimerConfig.dialog.cancel')}
                    </Button>
                    <Button
                        color="blue"
                        onClick={handleAddDepartment}
                        disabled={submitting || !selectedDepartment}
                    >
                        {submitting ? t('managerDisclaimerConfig.dialog.adding') : t('managerDisclaimerConfig.dialog.add')}
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}
