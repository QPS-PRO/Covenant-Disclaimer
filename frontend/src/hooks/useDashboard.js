import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI, transactionAPI } from '@/lib/assetApi';

// Dashboard hook with real API integration
export const useDashboard = (refreshInterval = 5 * 60 * 1000) => {
    const [stats, setStats] = useState(null);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch dashboard data from your API
    const fetchDashboardData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Fetch data from your actual API endpoints
            const [dashboardStats, transactionsResponse] = await Promise.all([
                // This calls /api/dashboard/stats/
                dashboardAPI.getStats(),
                // This calls /api/transactions/ with recent filter
                transactionAPI.getAll({
                    ordering: '-transaction_date',
                    limit: 10
                })
            ]);

            // Handle paginated response
            const transactions = Array.isArray(transactionsResponse)
                ? transactionsResponse
                : (transactionsResponse.results || []);

            setStats(dashboardStats);
            setRecentTransactions(transactions);
            setLastUpdated(new Date());

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message);

            // Fallback data if API fails
            if (!stats) {
                setStats({
                    total_departments: 0,
                    total_assets: 0,
                    total_employees: 0,
                    assets_assigned: 0,
                    assets_available: 0,
                    assets_maintenance: 0,
                    assets_retired: 0,
                    recent_transactions: 0,
                    weekly_data: [],
                    department_distribution: [],
                });
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
    }, []);

    // Auto-refresh interval
    useEffect(() => {
        if (refreshInterval && refreshInterval > 0) {
            const interval = setInterval(() => {
                fetchDashboardData(true);
            }, refreshInterval);

            return () => clearInterval(interval);
        }
    }, [refreshInterval, fetchDashboardData]);

    // Process chart data
    const processedData = {
        // Asset status for pie chart
        assetStatusChart: stats ? {
            series: [
                stats.assets_assigned || 0,
                stats.assets_available || 0,
                stats.assets_maintenance || 0,
                stats.assets_retired || 0,
            ].filter(value => value > 0),
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
        } : null,

        // Weekly transactions for bar chart
        weeklyChart: stats?.weekly_data ? {
            categories: stats.weekly_data.map(item =>
                new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                })
            ),
            series: [
                {
                    name: "Issues",
                    data: stats.weekly_data.map(item => item.issues || 0),
                },
                {
                    name: "Returns", 
                    data: stats.weekly_data.map(item => item.returns || 0),
                },
            ],
        } : null,

        // Department distribution for donut chart
        departmentChart: stats?.department_distribution ? {
            series: stats.department_distribution.map(dept => dept.asset_count || 0),
            labels: stats.department_distribution.map(dept => dept.name),
        } : null,

        // Generate monthly data from weekly data or use mock data
        monthlyChart: stats?.monthly_data || generateMockMonthlyData(),
    };

    // Format transactions for display
    const formattedTransactions = recentTransactions.map(transaction => ({
        ...transaction,
        formattedDate: new Date(transaction.transaction_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }),
    }));

    return {
        // Raw data
        stats,
        recentTransactions: formattedTransactions,
        
        // Processed data for charts
        chartData: processedData,
        
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

// Helper function to generate mock monthly data if not available from API
function generateMockMonthlyData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
        categories: months,
        series: [
            {
                name: "Issues",
                data: months.map(() => Math.floor(Math.random() * 30) + 10),
            },
            {
                name: "Returns",
                data: months.map(() => Math.floor(Math.random() * 25) + 8),
            },
        ],
    };
}

export default useDashboard;