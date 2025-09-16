// frontend/src/hooks/useDashboard.js
import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI, transactionAPI } from '@/lib/assetApi';

// Fallback data
const fallbackDashboardData = {
    total_departments: 0,
    total_assets: 0,
    total_employees: 0,
    assets_assigned: 0,
    assets_available: 0,
    recent_transactions: 0,
    weekly_data: [],
    department_distribution: [],
};

// Dashboard helpers
const dashboardHelpers = {
    processWeeklyData: (weeklyData) => {
        if (!weeklyData || !Array.isArray(weeklyData)) return { categories: [], series: [] };

        const categories = weeklyData.map(item =>
            new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            })
        );

        const series = [
            {
                name: "Issues",
                data: weeklyData.map(item => item.issues || 0),
            },
            {
                name: "Returns",
                data: weeklyData.map(item => item.returns || 0),
            },
        ];

        return { categories, series };
    },

    processDepartmentData: (departmentData) => {
        if (!departmentData || !Array.isArray(departmentData)) return { labels: [], series: [] };

        const labels = departmentData.map(dept => dept.name);
        const series = departmentData.map(dept => dept.asset_count || 0);

        return { labels, series };
    },

    generateMockYearlyData: () => {
        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        const issues = months.map(() => Math.floor(Math.random() * 50) + 10);
        const returns = months.map(() => Math.floor(Math.random() * 40) + 5);

        return {
            categories: months,
            series: [
                { name: "Issues", data: issues },
                { name: "Returns", data: returns },
            ],
        };
    },

    formatTransactionForTable: (transaction) => {
        return {
            ...transaction,
            formattedDate: new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
        };
    },
};

export const useDashboard = (refreshInterval = 5 * 60 * 1000) => { // 5 minutes default
    const [stats, setStats] = useState(null);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Fetch data from API
            const [dashboardStats, transactionsResponse] = await Promise.all([
                dashboardAPI.getStats(),
                transactionAPI.getAll({
                    ordering: '-transaction_date',
                    limit: 10
                })
            ]);

            // Handle different response formats (paginated vs direct array)
            const transactions = Array.isArray(transactionsResponse)
                ? transactionsResponse
                : (transactionsResponse.results || []);

            setStats(dashboardStats);
            setRecentTransactions(transactions);
            setLastUpdated(new Date());

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message);

            // Use fallback data if API fails
            if (!stats) {
                console.log('Using fallback dashboard data');
                setStats(fallbackDashboardData);
                setRecentTransactions([]);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [stats]);

    // Manual refresh function
    const refresh = useCallback(() => {
        fetchDashboardData(true);
    }, [fetchDashboardData]);

    // Initial load
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Auto-refresh interval
    useEffect(() => {
        if (refreshInterval && refreshInterval > 0) {
            const interval = setInterval(() => {
                fetchDashboardData(true);
            }, refreshInterval);

            return () => clearInterval(interval);
        }
    }, [refreshInterval, fetchDashboardData]);

    // Computed values
    const computedStats = {
        ...stats,
        // Add computed metrics
        totalAssetsWithStatus: stats ? stats.assets_assigned + stats.assets_available : 0,
        assignmentRate: stats ?
            Math.round((stats.assets_assigned / (stats.assets_assigned + stats.assets_available)) * 100) : 0,
        // Process chart data
        weeklyChartData: stats?.weekly_data ?
            dashboardHelpers.processWeeklyData(stats.weekly_data) : null,
        departmentChartData: stats?.department_distribution ?
            dashboardHelpers.processDepartmentData(stats.department_distribution) : null,
    };

    // Format transactions for display
    const formattedTransactions = recentTransactions.map(transaction =>
        dashboardHelpers.formatTransactionForTable(transaction)
    );

    return {
        // Data
        stats: computedStats,
        recentTransactions: formattedTransactions,

        // State
        loading,
        error,
        refreshing,
        lastUpdated,

        // Actions
        refresh,

        // Computed values
        hasData: !!stats,
        isEmpty: !loading && !stats,
        isError: !!error,
    };
};

// Hook for individual chart data
export const useChartData = (chartType, stats) => {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        if (!stats) return;

        switch (chartType) {
            case 'assetStatus':
                setChartData({
                    series: [
                        stats.assets_assigned || 0,
                        stats.assets_available || 0,
                        stats.assets_maintenance || 0,
                        stats.assets_retired || 0,
                    ].filter(value => value > 0), // Only show non-zero values
                    labels: [
                        'Assigned',
                        'Available',
                        'Maintenance',
                        'Retired',
                    ].filter((_, index) => [
                        stats.assets_assigned || 0,
                        stats.assets_available || 0,
                        stats.assets_maintenance || 0,
                        stats.assets_retired || 0,
                    ][index] > 0),
                });
                break;

            case 'weeklyTransactions':
                if (stats.weekly_data) {
                    const processedData = dashboardHelpers.processWeeklyData(stats.weekly_data);
                    setChartData({
                        series: processedData.series,
                        categories: processedData.categories,
                    });
                }
                break;

            case 'departmentAssets':
                if (stats.department_distribution) {
                    const processedData = dashboardHelpers.processDepartmentData(stats.department_distribution);
                    setChartData({
                        series: processedData.series,
                        labels: processedData.labels,
                    });
                }
                break;

            case 'yearlyTrends':
                // Generate mock yearly data since it's not in the API yet
                setChartData(dashboardHelpers.generateMockYearlyData());
                break;

            default:
                setChartData(null);
        }
    }, [chartType, stats]);

    return chartData;
};

export default useDashboard;