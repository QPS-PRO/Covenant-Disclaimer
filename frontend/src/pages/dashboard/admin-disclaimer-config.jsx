import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    Typography,
    Switch,
    Alert,
    Spinner,
    Chip
} from '@material-tailwind/react';
import { disclaimerAdminAPI } from '@/lib/disclaimerApi';
import { departmentAPI } from '@/lib/assetApi';

export default function AdminDisclaimerConfiguration() {
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [configs, setConfigs] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [updating, setUpdating] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [deptData, configData] = await Promise.all([
                departmentAPI.getAllForDropdown(),
                disclaimerAdminAPI.getDepartmentConfigs()
            ]);

            setDepartments(deptData);

            const configMap = {};
            configData.forEach(config => {
                configMap[config.department] = config;
            });
            setConfigs(configMap);
        } catch (err) {
            setError(err.message || 'Failed to load configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (departmentId, currentValue) => {
        setUpdating(prev => ({ ...prev, [departmentId]: true }));
        setError(null);

        try {
            const existingConfig = configs[departmentId];

            if (existingConfig) {
                // Update existing config
                await disclaimerAdminAPI.updateDepartmentConfig(existingConfig.id, {
                    requires_disclaimer: !currentValue,
                    is_active: true
                });
            } else {
                // Create new config
                await disclaimerAdminAPI.createDepartmentConfig({
                    department: departmentId,
                    requires_disclaimer: true,
                    is_active: true
                });
            }

            setSuccess('Configuration updated successfully!');
            await loadData();
        } catch (err) {
            setError(err.message || 'Failed to update configuration');
        } finally {
            setUpdating(prev => ({ ...prev, [departmentId]: false }));
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
                    <div className="mb-6">
                        <Typography variant="h4" color="blue-gray" className="mb-2">
                            Disclaimer Department Configuration
                        </Typography>
                        <Typography color="gray" className="font-normal">
                            Configure which departments require disclaimer clearance
                        </Typography>
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

                    <Alert color="blue" className="mb-6">
                        <Typography variant="small">
                            Enable disclaimer requirements for departments. Department managers will then configure
                            the order in which employees must clear these departments.
                        </Typography>
                    </Alert>

                    {departments.length === 0 ? (
                        <div className="text-center py-12">
                            <Typography color="gray">
                                No departments found. Please create departments first.
                            </Typography>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {departments.map((dept) => {
                                const config = configs[dept.id];
                                const requiresDisclaimer = config?.requires_disclaimer || false;
                                const isUpdating = updating[dept.id] || false;

                                return (
                                    <Card key={dept.id} className="border border-gray-200">
                                        <CardBody className="p-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <Typography variant="h6" color="blue-gray">
                                                            {dept.name}
                                                        </Typography>
                                                        {requiresDisclaimer && (
                                                            <Chip
                                                                size="sm"
                                                                value="Requires Disclaimer"
                                                                color="green"
                                                            />
                                                        )}
                                                    </div>
                                                    <Typography variant="small" color="gray">
                                                        {requiresDisclaimer
                                                            ? 'This department requires disclaimer clearance'
                                                            : 'This department does not require disclaimer clearance'}
                                                    </Typography>
                                                </div>
                                                <Switch
                                                    checked={requiresDisclaimer}
                                                    onChange={() => handleToggle(dept.id, requiresDisclaimer)}
                                                    disabled={isUpdating}
                                                    label={isUpdating ? 'Updating...' : ''}
                                                    color="green"
                                                />
                                            </div>
                                        </CardBody>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded p-4">
                        <Typography variant="small" className="font-semibold mb-2">
                            ⚠️ Important Notes:
                        </Typography>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            <li>Enabling disclaimer for a department allows it to be added to disclaimer flows</li>
                            <li>Department managers will configure the order of clearance for their employees</li>
                            <li>Disabling a department will remove it from all existing disclaimer flows</li>
                        </ul>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}