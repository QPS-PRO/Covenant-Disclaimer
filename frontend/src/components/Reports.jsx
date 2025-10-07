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
    Filter
} from 'lucide-react';
import { reportsAPI, reportsUtils } from '../lib/reportsApi';
import toast from 'react-hot-toast';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingReport, setDownloadingReport] = useState(null);
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await reportsAPI.getReportsList();
            setReports(data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async (report, format) => {
        const downloadKey = `${report.id}-${format}`;
        try {
            setDownloadingReport(downloadKey);
            let blob;

            switch (report.id) {
                case 'disclaimer-completion':
                    blob = await reportsAPI.getDisclaimerCompletionReport(format);
                    break;
                case 'employee-assets':
                    blob = await reportsAPI.getEmployeeAssetsReport(format);
                    break;
                case 'assets-by-status':
                    blob = await reportsAPI.getAssetsByStatusReport(format);
                    break;
                case 'transaction-history':
                    blob = await reportsAPI.getTransactionHistoryReport(
                        format,
                        dateRange.startDate,
                        dateRange.endDate
                    );
                    break;
                case 'department-summary':
                    blob = await reportsAPI.getDepartmentSummaryReport(format);
                    break;
                default:
                    throw new Error('Unknown report type');
            }

            const filename = reportsUtils.generateFilename(report.id, format);
            reportsUtils.downloadReport(blob, filename);
            toast.success('Report downloaded successfully');
        } catch (error) {
            console.error('Error downloading report:', error);
            toast.error('Failed to download report');
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

    const getReportColor = (reportId) => {
        const colors = {
            'disclaimer-completion': 'bg-blue-100 text-blue-600',
            'employee-assets': 'bg-green-100 text-green-600',
            'assets-by-status': 'bg-purple-100 text-purple-600',
            'transaction-history': 'bg-orange-100 text-orange-600',
            'department-summary': 'bg-indigo-100 text-indigo-600'
        };
        return colors[reportId] || 'bg-gray-100 text-gray-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
                <p className="text-gray-600">
                    Generate and download various reports in PDF or Excel format
                </p>
            </div>

            {/* Date Range Filter (for transaction history) */}
            {showDateFilter && (
                <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <span className="font-medium text-gray-700">Date Range:</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setDateRange({ startDate: '', endDate: '' });
                                    setShowDateFilter(false);
                                }}
                                className="mt-6 px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => {
                    const Icon = getReportIcon(report.id);
                    const colorClass = getReportColor(report.id);

                    return (
                        <div
                            key={report.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                {/* Icon and Title */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`p-3 rounded-lg ${colorClass}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                            {report.name}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {report.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Parameters */}
                                {report.parameters && report.parameters.length > 0 && (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Parameters:</p>
                                        <div className="text-xs text-gray-600">
                                            {report.parameters.map((param, idx) => (
                                                <div key={idx}>• {param}</div>
                                            ))}
                                        </div>
                                        {report.id === 'transaction-history' && (
                                            <button
                                                onClick={() => setShowDateFilter(!showDateFilter)}
                                                className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                            >
                                                <Filter className="w-3 h-3" />
                                                {showDateFilter ? 'Hide' : 'Show'} Date Filter
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Download Buttons */}
                                <div className="flex gap-2">
                                    {report.formats.includes('pdf') && (
                                        <button
                                            onClick={() => handleDownloadReport(report, 'pdf')}
                                            disabled={downloadingReport === `${report.id}-pdf`}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {downloadingReport === `${report.id}-pdf` ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-sm">Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4" />
                                                    <span className="text-sm">PDF</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {report.formats.includes('excel') && (
                                        <button
                                            onClick={() => handleDownloadReport(report, 'excel')}
                                            disabled={downloadingReport === `${report.id}-excel`}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {downloadingReport === `${report.id}-excel` ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-sm">Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FileSpreadsheet className="w-4 h-4" />
                                                    <span className="text-sm">Excel</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {reports.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reports available</h3>
                    <p className="text-gray-600">Check back later for available reports</p>
                </div>
            )}
        </div>
    );
};

export default Reports;