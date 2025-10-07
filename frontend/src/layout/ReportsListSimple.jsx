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
    AlertCircle
} from 'lucide-react';
import { reportsAPI, reportsUtils } from '../lib/reportsApi';
import toast from 'react-hot-toast';

const ReportsListSimple = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingReport, setDownloadingReport] = useState(null);
    const [transactionFilters, setTransactionFilters] = useState({
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
        
        // Validate date range for transaction history
        if (report.id === 'transaction-history' && transactionFilters.startDate && transactionFilters.endDate) {
            if (new Date(transactionFilters.startDate) > new Date(transactionFilters.endDate)) {
                toast.error('Start date must be before end date');
                return;
            }
        }

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
                        transactionFilters.startDate || null, 
                        transactionFilters.endDate || null
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
            toast.success(`${report.name} downloaded successfully`);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
                <p className="text-gray-600">
                    Generate and download reports in PDF or Excel format
                </p>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                    Report
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                    Description
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                    Formats
                                </th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reports.map((report) => {
                                const Icon = getReportIcon(report.id);
                                
                                return (
                                    <React.Fragment key={report.id}>
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <Icon className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {report.name}
                                                        </p>
                                                        {report.parameters && report.parameters.length > 0 && (
                                                            <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Has optional filters
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600">
                                                    {report.description}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
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
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {report.formats.includes('pdf') && (
                                                        <button
                                                            onClick={() => handleDownloadReport(report, 'pdf')}
                                                            disabled={downloadingReport === `${report.id}-pdf`}
                                                            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                                            title="Download PDF"
                                                        >
                                                            {downloadingReport === `${report.id}-pdf` ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Download className="w-4 h-4" />
                                                                    PDF
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                    {report.formats.includes('excel') && (
                                                        <button
                                                            onClick={() => handleDownloadReport(report, 'excel')}
                                                            disabled={downloadingReport === `${report.id}-excel`}
                                                            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                                            title="Download Excel"
                                                        >
                                                            {downloadingReport === `${report.id}-excel` ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <FileSpreadsheet className="w-4 h-4" />
                                                                    Excel
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        
                                        {/* Transaction History Filters */}
                                        {report.id === 'transaction-history' && (
                                            <tr className="bg-gray-50">
                                                <td colSpan="4" className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <Calendar className="w-5 h-5 text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Date Range (Optional):
                                                        </span>
                                                        <input
                                                            type="date"
                                                            value={transactionFilters.startDate}
                                                            onChange={(e) => setTransactionFilters({
                                                                ...transactionFilters,
                                                                startDate: e.target.value
                                                            })}
                                                            placeholder="Start Date"
                                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                        <span className="text-gray-400">to</span>
                                                        <input
                                                            type="date"
                                                            value={transactionFilters.endDate}
                                                            onChange={(e) => setTransactionFilters({
                                                                ...transactionFilters,
                                                                endDate: e.target.value
                                                            })}
                                                            placeholder="End Date"
                                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                        {(transactionFilters.startDate || transactionFilters.endDate) && (
                                                            <button
                                                                onClick={() => setTransactionFilters({ startDate: '', endDate: '' })}
                                                                className="text-sm text-gray-600 hover:text-gray-900"
                                                            >
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Empty State */}
            {reports.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No reports available
                    </h3>
                    <p className="text-gray-600">
                        Check back later for available reports
                    </p>
                </div>
            )}
        </div>
    );
};

export default ReportsListSimple;