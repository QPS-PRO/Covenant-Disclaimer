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

const ReportsDashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingReport, setDownloadingReport] = useState(null);
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

            // Add date filters for transaction history
            if (report.id === 'transaction-history') {
                if (dateRange.startDate) url += `&start_date=${dateRange.startDate}`;
                if (dateRange.endDate) url += `&end_date=${dateRange.endDate}`;
            }

            console.log('Downloading from:', url);

            // Fetch the file
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
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

            // Reset date filter if it was used
            if (report.id === 'transaction-history' && showDateFilter) {
                setShowDateFilter(false);
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

    const getReportColor = (reportId) => {
        const colors = {
            'disclaimer-completion': 'from-blue-500 to-blue-600',
            'employee-assets': 'from-green-500 to-green-600',
            'assets-by-status': 'from-purple-500 to-purple-600',
            'transaction-history': 'from-orange-500 to-orange-600',
            'department-summary': 'from-indigo-500 to-indigo-600'
        };
        return colors[reportId] || 'from-gray-500 to-gray-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Reports Center</h1>
                    <p className="text-lg text-gray-600">
                        Generate comprehensive reports in PDF or Excel format
                    </p>
                </div>

                {/* Date Range Filter */}
                {showDateFilter && selectedReport?.id === 'transaction-history' && (
                    <div className="mb-6 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                Select Date Range
                            </h3>
                            <button
                                onClick={() => {
                                    setShowDateFilter(false);
                                    setSelectedReport(null);
                                    setDateRange({ startDate: '', endDate: '' });
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => handleDownloadReport(selectedReport, 'pdf')}
                                disabled={downloadingReport}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {downloadingReport === `${selectedReport.id}-pdf` ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating PDF...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Download PDF
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => handleDownloadReport(selectedReport, 'excel')}
                                disabled={downloadingReport}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {downloadingReport === `${selectedReport.id}-excel` ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating Excel...
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="w-5 h-5" />
                                        Download Excel
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Reports Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {reports.map((report) => {
                        const Icon = getReportIcon(report.id);
                        const gradientClass = getReportColor(report.id);

                        return (
                            <div
                                key={report.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
                            >
                                {/* Gradient Header */}
                                <div className={`bg-gradient-to-r ${gradientClass} p-6 text-white`}>
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold mb-2">
                                                {report.name}
                                            </h3>
                                            <p className="text-white text-opacity-90 text-sm">
                                                {report.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {/* Parameters */}
                                    {report.parameters && report.parameters.length > 0 && (
                                        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <Filter className="w-4 h-4 text-amber-600 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-900 mb-2">
                                                        Optional Filters:
                                                    </p>
                                                    <div className="text-sm text-amber-800 space-y-1">
                                                        {report.parameters.map((param, idx) => (
                                                            <div key={idx} className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                                                                {param}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Download Buttons */}
                                    <div className="space-y-3">
                                        {report.id === 'transaction-history' ? (
                                            <button
                                                onClick={() => {
                                                    setSelectedReport(report);
                                                    setShowDateFilter(true);
                                                }}
                                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                            >
                                                <Calendar className="w-5 h-5" />
                                                Configure & Download
                                            </button>
                                        ) : (
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
                                                                <span className="text-sm">Generating...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Download className="w-5 h-5" />
                                                                <span>PDF</span>
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
                                                                <span className="text-sm">Generating...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FileSpreadsheet className="w-5 h-5" />
                                                                <span>Excel</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Format info */}
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            <span>Available formats:</span>
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
                                    </div>
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
                            No Reports Available
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Reports are currently being configured. Please check back later.
                        </p>
                    </div>
                )}

                {/* Info Banner */}
                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-1">About Reports</h4>
                            <p className="text-sm text-blue-800">
                                All reports are generated in real-time with the latest data. PDF reports are
                                optimized for printing, while Excel reports allow for further analysis and filtering.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsDashboard;