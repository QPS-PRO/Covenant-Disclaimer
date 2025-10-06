import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Typography,
    Button,
    Chip,
    Spinner,
    Alert,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Select,
    Option,
    IconButton,
} from '@material-tailwind/react';
import {
    PlusIcon,
    TrashIcon,
    Cog6ToothIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { disclaimerAdminAPI } from '@/lib/disclaimerApi';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function AdminDisclaimerSetup() {
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [orders, setOrders] = useState([]);
    const [availableDepartments, setAvailableDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Dialog states
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [selectedTargetDept, setSelectedTargetDept] = useState(null);

    useEffect(() => {
        loadDepartmentsSummary();
    }, []);

    const loadDepartmentsSummary = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await disclaimerAdminAPI.getDepartmentsSummary();
            setDepartments(data || []);
        } catch (err) {
            console.error('Error loading departments:', err);
            setError(err.message || 'Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    const loadDepartmentOrders = async (departmentId) => {
        try {
            setLoading(true);
            setError(null);
            const data = await disclaimerAdminAPI.getDepartmentDisclaimerOrders(departmentId);
            setOrders(data.orders || []);
            setAvailableDepartments(data.available_departments || []);
            setSelectedDepartment(data.department);
        } catch (err) {
            console.error('Error loading department orders:', err);
            setError(err.message || 'Failed to load department configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleDepartmentSelect = (dept) => {
        loadDepartmentOrders(dept.id);
    };

    const handleAddOrder = async () => {
        if (!selectedTargetDept || !selectedDepartment) return;

        try {
            setSaving(true);
            setError(null);

            await disclaimerAdminAPI.createDepartmentDisclaimerOrder(
                selectedDepartment.id,
                { target_department: selectedTargetDept }
            );

            setSuccess('Department added to disclaimer flow successfully');
            setAddDialogOpen(false);
            setSelectedTargetDept(null);

            // Reload orders
            await loadDepartmentOrders(selectedDepartment.id);
            await loadDepartmentsSummary();
        } catch (err) {
            console.error('Error adding order:', err);
            setError(err.message || 'Failed to add department');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!selectedDepartment) return;

        if (!confirm('Are you sure you want to remove this department from the flow?')) {
            return;
        }

        try {
            setSaving(true);
            setError(null);

            await disclaimerAdminAPI.deleteDepartmentDisclaimerOrder(
                selectedDepartment.id,
                orderId
            );

            setSuccess('Department removed from disclaimer flow');

            // Reload orders
            await loadDepartmentOrders(selectedDepartment.id);
            await loadDepartmentsSummary();
        } catch (err) {
            console.error('Error deleting order:', err);
            setError(err.message || 'Failed to remove department');
        } finally {
            setSaving(false);
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination || !selectedDepartment) return;

        const items = Array.from(orders);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update local state optimistically
        setOrders(items);

        // Prepare data for API
        const reorderedData = items.map((item, index) => ({
            id: item.id,
            order: index + 1,
        }));

        try {
            setSaving(true);
            setError(null);

            await disclaimerAdminAPI.reorderDepartmentDisclaimerOrders(
                selectedDepartment.id,
                reorderedData
            );

            setSuccess('Order updated successfully');
        } catch (err) {
            console.error('Error reordering:', err);
            setError(err.message || 'Failed to update order');
            // Reload to revert changes
            await loadDepartmentOrders(selectedDepartment.id);
        } finally {
            setSaving(false);
        }
    };

    if (loading && !selectedDepartment) {
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
                    <Typography variant="h6" color="white">
                        Admin Disclaimer Setup Management
                    </Typography>
                </CardHeader>

                <CardBody>
                    {error && (
                        <Alert color="red" className="mb-6" dismissible onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert color="green" className="mb-6" dismissible onClose={() => setSuccess(null)}>
                            {success}
                        </Alert>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Department List */}
                        <div className="lg:col-span-1">
                            <Typography variant="h6" color="blue-gray" className="mb-4">
                                Departments
                            </Typography>

                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {departments.map((dept) => (
                                    <Card
                                        key={dept.id}
                                        className={`cursor-pointer transition-all ${selectedDepartment?.id === dept.id
                                                ? 'ring-2 ring-blue-500'
                                                : 'hover:shadow-md'
                                            }`}
                                        onClick={() => handleDepartmentSelect(dept)}
                                    >
                                        <CardBody className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <Typography variant="h6" color="blue-gray">
                                                        {dept.name}
                                                    </Typography>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {dept.requires_disclaimer ? (
                                                            <Chip
                                                                size="sm"
                                                                color="green"
                                                                value="Requires Disclaimer"
                                                                icon={<CheckCircleIcon className="h-4 w-4" />}
                                                            />
                                                        ) : (
                                                            <Chip
                                                                size="sm"
                                                                color="gray"
                                                                value="No Disclaimer"
                                                                icon={<XCircleIcon className="h-4 w-4" />}
                                                            />
                                                        )}
                                                    </div>
                                                    <Typography variant="small" color="gray" className="mt-1">
                                                        {dept.disclaimer_steps_count} step{dept.disclaimer_steps_count !== 1 ? 's' : ''} configured
                                                    </Typography>
                                                </div>
                                                <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Configuration Panel */}
                        <div className="lg:col-span-2">
                            {selectedDepartment ? (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <Typography variant="h6" color="blue-gray">
                                            Disclaimer Flow for {selectedDepartment.name}
                                        </Typography>
                                        <Button
                                            color="blue"
                                            size="sm"
                                            className="flex items-center gap-2"
                                            onClick={() => setAddDialogOpen(true)}
                                            disabled={availableDepartments.length === 0}
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                            Add Department
                                        </Button>
                                    </div>

                                    {orders.length === 0 ? (
                                        <Card className="border-2 border-dashed border-gray-300">
                                            <CardBody className="text-center py-12">
                                                <Typography variant="h6" color="gray" className="mb-2">
                                                    No disclaimer flow configured
                                                </Typography>
                                                <Typography variant="small" color="gray">
                                                    Add departments to create the disclaimer flow
                                                </Typography>
                                            </CardBody>
                                        </Card>
                                    ) : (
                                        <DragDropContext onDragEnd={handleDragEnd}>
                                            <Droppable droppableId="orders">
                                                {(provided) => (
                                                    <div
                                                        {...provided.droppableProps}
                                                        ref={provided.innerRef}
                                                        className="space-y-3"
                                                    >
                                                        {orders.map((order, index) => (
                                                            <Draggable
                                                                key={order.id}
                                                                draggableId={String(order.id)}
                                                                index={index}
                                                            >
                                                                {(provided, snapshot) => (
                                                                    <Card
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className={`${snapshot.isDragging
                                                                                ? 'shadow-lg ring-2 ring-blue-500'
                                                                                : ''
                                                                            }`}
                                                                    >
                                                                        <CardBody className="p-4">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                                                                                        {order.order}
                                                                                    </div>
                                                                                    <div>
                                                                                        <Typography variant="h6" color="blue-gray">
                                                                                            {order.target_department_name}
                                                                                        </Typography>
                                                                                        <Typography variant="small" color="gray">
                                                                                            Step {order.order} in disclaimer process
                                                                                        </Typography>
                                                                                    </div>
                                                                                </div>
                                                                                <IconButton
                                                                                    variant="text"
                                                                                    color="red"
                                                                                    onClick={() => handleDeleteOrder(order.id)}
                                                                                    disabled={saving}
                                                                                >
                                                                                    <TrashIcon className="h-5 w-5" />
                                                                                </IconButton>
                                                                            </div>
                                                                        </CardBody>
                                                                    </Card>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </DragDropContext>
                                    )}
                                </>
                            ) : (
                                <Card className="border-2 border-dashed border-gray-300">
                                    <CardBody className="text-center py-12">
                                        <Typography variant="h6" color="gray">
                                            Select a department to configure its disclaimer flow
                                        </Typography>
                                    </CardBody>
                                </Card>
                            )}
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Add Department Dialog */}
            <Dialog open={addDialogOpen} handler={() => setAddDialogOpen(false)}>
                <DialogHeader>Add Department to Disclaimer Flow</DialogHeader>
                <DialogBody>
                    <div className="space-y-4">
                        <Typography variant="small" color="gray">
                            Select a department to add to the disclaimer flow for {selectedDepartment?.name}
                        </Typography>

                        <Select
                            label="Select Department"
                            value={selectedTargetDept}
                            onChange={(value) => setSelectedTargetDept(value)}
                        >
                            {availableDepartments.map((dept) => (
                                <Option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </Option>
                            ))}
                        </Select>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="gray"
                        onClick={() => {
                            setAddDialogOpen(false);
                            setSelectedTargetDept(null);
                        }}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        color="blue"
                        onClick={handleAddOrder}
                        disabled={!selectedTargetDept || saving}
                    >
                        {saving ? 'Adding...' : 'Add Department'}
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}