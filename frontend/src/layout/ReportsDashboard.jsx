// frontend/src/layout/ReportsDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
    FileText,
    Package,
    BarChart3,
    History,
    Building2,
    Download,
    FileSpreadsheet,
    Loader2,
    Calendar,
    Filter,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const ReportsDashboard = () => {
    const { t } = useTranslation();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingReport, setDownloadingReport] = useState(null);

    // in-card date filter state (used only for transaction history)
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/api/reports/`);
            if (!response.ok) {
                throw new Error('Failed to fetch reports');
            }
            const data = await response.json();
            setReports(data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const downloadBlob = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadReport = async (report, format) => {
        const downloadKey = `${report.id}-${format}`;

        try {
            setDownloadingReport(downloadKey);

            // Build URL using the endpoint from the report data
            let url = `${BASE_URL}${report.endpoint}?format=${format}`;

            // Add date filters for transaction history (if provided)
            if (report.id === 'transaction-history') {
                if (dateRange.startDate) url += `&start_date=${dateRange.startDate}`;
                if (dateRange.endDate) url += `&end_date=${dateRange.endDate}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Download error:', errorText);
                throw new Error(`Failed to download report: ${response.status}`);
            }

            // Get filename from Content-Disposition header or generate one
            let filename = `${report.id}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                if (filenameMatch) {
                    filename = filenameMatch[1].replace(/"/g, '');
                }
            }

            // Convert response to blob and download
            const blob = await response.blob();
            downloadBlob(blob, filename);

            toast.success(`${report.name} downloaded successfully`);
            // Optional sanity checks
            if (blob.size === 0) {
                toast.error('Received empty file from server');
                return;
            }

            // If we downloaded from the in-card filter, collapse it afterwards
            if (report.id === 'transaction-history' && showDateFilter) {
                setShowDateFilter(false);
                setSelectedReport(null);
                setDateRange({ startDate: '', endDate: '' });
            }
        } catch (error) {
            console.error('Error downloading report:', error);
            toast.error(error.message || 'Failed to download report');
        } finally {
            setDownloadingReport(null);
        }
    };

    const getReportIcon = (reportId) => {
        const icons = {
            'disclaimer-completion': FileText,
            'employee-assets': Package,
            'assets-by-status': BarChart3,
            'transaction-history': History,
            'department-summary': Building2
        };
        return icons[reportId] || FileText;
    };

    // Unified header style (single color for all report cards)
    const unifiedHeaderGradient = 'from-blue-600 to-blue-700';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">{t('reportsDashboard.loading')}</p>
                </div>
            </div>
        );
    }
    const localizeParam = (p) => {
        if (p.startsWith('start_date')) return t('reportsDashboard.params.startDateOptional');
        if (p.startsWith('end_date')) return t('reportsDashboard.params.endDateOptional');
        return p;
    };
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        {t('reportsDashboard.headerTitle')}
                    </h1>
                    <p className="text-lg text-gray-600">
                        {t('reportsDashboard.headerSubtitle')}
                    </p>
                </div>

                {/* Reports Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {reports.map((report) => {
                        const Icon = getReportIcon(report.id);
                        const localizedName = t(
                            `reportsDashboard.reports.${report.id}.name`,
                            { defaultValue: report.name }
                          );
                          const localizedDesc = t(
                            `reportsDashboard.reports.${report.id}.description`,
                            { defaultValue: report.description }
                          );
                        // Make the Transaction History card span a full row on large screens
                        const spanClass = report.id === 'transaction-history' ? 'lg:col-span-2' : '';

                        const isTxn = report.id === 'transaction-history';
                        const showThisFilter =
                            isTxn && showDateFilter && selectedReport?.id === 'transaction-history';

                        return (
                            <div
                                key={report.id}
                                className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden ${spanClass}`}
                            >
                                {/* Unified Gradient Header */}
                                <div className={`bg-gradient-to-r ${unifiedHeaderGradient} p-6 text-white`}>
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold mb-2">{localizedName}</h3>
                                            <p className="text-white text-opacity-90 text-sm">{localizedDesc}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {/* Optional parameters note */}
                                    {report.parameters && report.parameters.length > 0 && (
                                        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <Filter className="w-4 h-4 text-amber-600 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-900 mb-2">
                                                        {t('reportsDashboard.optionalFilters')}
                                                    </p>
                                                    <div className="text-sm text-amber-800 space-y-1">
                                                        {report.parameters?.map((param, idx) => (
                                                            <div key={idx} className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                                                                {localizeParam(param)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action area */}
                                    {isTxn ? (
                                        <>
                                            {/* Toggle to show the inline date filter */}
                                            <button
                                                onClick={() => {
                                                    setSelectedReport(report);
                                                    setShowDateFilter((v) => !v);
                                                }}
                                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                            >
                                                <Calendar className="w-5 h-5" />
                                                {t('reportsDashboard.configureDownload')}
                                                {showThisFilter && (
                                                    <XCircle className="w-4 h-4 opacity-80" aria-hidden="true" />
                                                )}
                                            </button>

                                            {/* Inline date filter + download buttons (single row on desktop) */}
                                            {showThisFilter && (
                                                <div className="mt-4 p-5 bg-gray-50 border border-gray-200 rounded-lg">
                                                    <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                                                        <div className="flex-1">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                {t('reportsDashboard.startDate')}
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={dateRange.startDate}
                                                                onChange={(e) =>
                                                                    setDateRange({ ...dateRange, startDate: e.target.value })
                                                                }
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                {t('reportsDashboard.endDate')}
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={dateRange.endDate}
                                                                onChange={(e) =>
                                                                    setDateRange({ ...dateRange, endDate: e.target.value })
                                                                }
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => handleDownloadReport(report, 'pdf')}
                                                                disabled={downloadingReport === `${report.id}-pdf`}
                                                                className="flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                                            >
                                                                {downloadingReport === `${report.id}-pdf` ? (
                                                                    <>
                                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                                        <span className="text-sm">{t('reportsDashboard.generatingPDF')}</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Download className="w-5 h-5" />
                                                                        <span>{t('reportsDashboard.downloadPDF')}</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownloadReport(report, 'excel')}
                                                                disabled={downloadingReport === `${report.id}-excel`}
                                                                className="flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                                            >
                                                                {downloadingReport === `${report.id}-excel` ? (
                                                                    <>
                                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                                        <span className="text-sm">{t('reportsDashboard.generatingExcel')}</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FileSpreadsheet className="w-5 h-5" />
                                                                        <span>{t('reportsDashboard.downloadExcel')}</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        // Non-transaction cards: simple two buttons
                                        <div className="grid grid-cols-2 gap-3">
                                            {report.formats.includes('pdf') && (
                                                <button
                                                    onClick={() => handleDownloadReport(report, 'pdf')}
                                                    disabled={downloadingReport === `${report.id}-pdf`}
                                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                                >
                                                    {downloadingReport === `${report.id}-pdf` ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            <span className="text-sm">{t('reportsDashboard.generatingPDF')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="w-5 h-5" />
                                                            <span>{t('reportsDashboard.downloadPDF')}</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {report.formats.includes('excel') && (
                                                <button
                                                    onClick={() => handleDownloadReport(report, 'excel')}
                                                    disabled={downloadingReport === `${report.id}-excel`}
                                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                                >
                                                    {downloadingReport === `${report.id}-excel` ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            <span className="text-sm">{t('reportsDashboard.generatingExcel')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileSpreadsheet className="w-5 h-5" />
                                                            <span>{t('reportsDashboard.downloadExcel')}</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Format info */}
                                    {/* <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            <span>{t('reportsDashboard.availableFormats')}</span>
                                            <div className="flex gap-2">
                                                {report.formats.map((format) => (
                                                    <span
                                                        key={format}
                                                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium uppercase"
                                                    >
                                                        {format}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div> */}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {reports.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                        <AlertCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {t('reportsDashboard.noReportsTitle')}
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            {t('reportsDashboard.noReportsBody')}
                        </p>
                    </div>
                )}

                {/* Info Banner */}
                {/* <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-1">
                                {t('reportsDashboard.aboutTitle')}
                            </h4>
                            <p className="text-sm text-blue-800">
                                {t('reportsDashboard.aboutBody')}
                            </p>
                        </div>
                    </div>
                </div> */}
            </div>
        </div>
    );
};

export default ReportsDashboard;
