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
import { useTranslation } from 'react-i18next';
import { disclaimerAdminAPI } from '@/lib/disclaimerApi';
import { departmentAPI } from '@/lib/assetApi';

export default function AdminDisclaimerConfiguration() {
    const { t } = useTranslation();
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
            setError(err.message || t('adminDisclaimerConfig.errors.loadFailed'));
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
                await disclaimerAdminAPI.updateDepartmentConfig(existingConfig.id, {
                    requires_disclaimer: !currentValue,
                    is_active: true
                });
            } else {
                await disclaimerAdminAPI.createDepartmentConfig({
                    department: departmentId,
                    requires_disclaimer: true,
                    is_active: true
                });
            }

            setSuccess(t('adminDisclaimerConfig.success.updated'));
            await loadData();
        } catch (err) {
            setError(err.message || t('adminDisclaimerConfig.errors.updateFailed'));
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
                            {t('adminDisclaimerConfig.title')}
                        </Typography>
                        <Typography color="gray" className="font-normal">
                            {t('adminDisclaimerConfig.subtitle')}
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
                            {t('adminDisclaimerConfig.info')}
                        </Typography>
                    </Alert>

                    {departments.length === 0 ? (
                        <div className="text-center py-12">
                            <Typography color="gray">
                                {t('adminDisclaimerConfig.none')}
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
                                                                value={t('adminDisclaimerConfig.requiresChip')}
                                                                color="green"
                                                            />
                                                        )}
                                                    </div>
                                                    <Typography variant="small" color="gray">
                                                        {requiresDisclaimer
                                                            ? t('adminDisclaimerConfig.requiresYes')
                                                            : t('adminDisclaimerConfig.requiresNo')}
                                                    </Typography>
                                                </div>
                                                <Switch
                                                    checked={requiresDisclaimer}
                                                    onChange={() => handleToggle(dept.id, requiresDisclaimer)}
                                                    disabled={isUpdating}
                                                    label={isUpdating ? t('adminDisclaimerConfig.updating') : ''}
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
                            {t('adminDisclaimerConfig.notesTitle')}
                        </Typography>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            <li>{t('adminDisclaimerConfig.notes.a')}</li>
                            <li>{t('adminDisclaimerConfig.notes.b')}</li>
                            <li>{t('adminDisclaimerConfig.notes.c')}</li>
                        </ul>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}