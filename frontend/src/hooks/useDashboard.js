// frontend/src/hooks/useDashboard.js
import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '@/lib/assetApi';

export const useDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [chartData, setChartData] = useState({
        assetStatusChart: { labels: [], series: [] },
        weeklyChart: { series: [], categories: [] },
        departmentChart: { labels: [], series: [] },
        monthlyChart: { series: [], categories: [] }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    const processChartData = useCallback((statsData) => {
        try {
            // Asset Status Pie Chart
            const assetStatusChart = {
                labels: ['Assigned', 'Available', 'Maintenance', 'Retired'],
                series: [
                    statsData.assets_assigned || 0,
                    statsData.assets_available || 0,
                    statsData.assets_maintenance || 0,
                    statsData.assets_retired || 0
                ]
            };

            // Weekly Transactions Bar Chart
            const weeklyData = statsData.weekly_data || [];
            const weeklyChart = {
                series: [
                    {
                        name: 'Issues',
                        data: weeklyData.map(day => day.issues || 0)
                    },
                    {
                        name: 'Returns',
                        data: weeklyData.map(day => day.returns || 0)
                    }
                ],
                categories: weeklyData.map(day => {
                    const date = new Date(day.date);
                    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                })
            };

            // FIXED: Department Assets Chart - using correct asset_count field
            const deptData = statsData.department_distribution || [];
            const departmentChart = {
                labels: deptData.map(dept => dept.name || 'Unknown'),
                series: deptData.map(dept => dept.asset_count || 0)
            };

            // Monthly Trends Line Chart
            const monthlyData = statsData.monthly_data || [];
            const monthlyChart = {
                series: [
                    {
                        name: 'Issues',
                        data: monthlyData.map(month => month.issues || 0)
                    },
                    {
                        name: 'Returns',
                        data: monthlyData.map(month => month.returns || 0)
                    }
                ],
                categories: monthlyData.map(month => month.month_name || 'Unknown')
            };

            return {
                assetStatusChart,
                weeklyChart,
                departmentChart,
                monthlyChart
            };
        } catch (error) {
            console.error('Error processing chart data:', error);
            return {
                assetStatusChart: { labels: ['No data'], series: [1] },
                weeklyChart: { series: [{ name: 'No data', data: [0] }], categories: ['No data'] },
                departmentChart: { labels: ['No data'], series: [1] },
                monthlyChart: { series: [{ name: 'No data', data: [0] }], categories: ['No data'] }
            };
        }
    }, []);

    const formatTransactionData = useCallback((transactions) => {
        if (!Array.isArray(transactions)) return [];

        return transactions.map(transaction => ({
            ...transaction,
            formattedDate: new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
        }));
    }, []);

    // FIXED: Remove dependencies that cause infinite loop
    const fetchDashboardData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const dashboardData = await dashboardAPI.getAllDashboardData();

            if (dashboardData.stats) {
                setStats(dashboardData.stats);

                // Process chart data
                const processedChartData = processChartData(dashboardData.stats);
                setChartData(processedChartData);
            }

            if (dashboardData.recentTransactions) {
                const formattedTransactions = formatTransactionData(dashboardData.recentTransactions);
                setRecentTransactions(formattedTransactions);
            }

            setLastUpdated(new Date());

        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            setError(err.message || 'Failed to load dashboard data');

            // Set fallback data to prevent crashes
            setStats(prevStats => prevStats || {
                total_employees: 0,
                total_assets: 0,
                total_departments: 0,
                recent_transactions: 0,
                assets_assigned: 0,
                assets_available: 0,
                assets_maintenance: 0,
                assets_retired: 0
            });

            setChartData(prevChartData => {
                if (prevChartData.assetStatusChart.labels.length === 0) {
                    return {
                        assetStatusChart: { labels: ['No data'], series: [1] },
                        weeklyChart: { series: [{ name: 'No data', data: [0] }], categories: ['No data'] },
                        departmentChart: { labels: ['No data'], series: [1] },
                        monthlyChart: { series: [{ name: 'No data', data: [0] }], categories: ['No data'] }
                    };
                }
                return prevChartData;
            });

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [processChartData, formatTransactionData]); // FIXED: Only include stable callbacks

    const refresh = useCallback(() => {
        fetchDashboardData(true);
    }, [fetchDashboardData]);

    // FIXED: Remove fetchDashboardData from dependency array to prevent infinite loop
    useEffect(() => {
        let isMounted = true;

        const loadInitialData = async () => {
            if (isMounted) {
                await fetchDashboardData(false);
            }
        };

        loadInitialData();

        return () => {
            isMounted = false;
        };
    }, []); // Empty dependency array for initial load only

    // FIXED: Separate auto-refresh effect with proper cleanup
    useEffect(() => {
        let intervalId;

        const setupAutoRefresh = () => {
            intervalId = setInterval(() => {
                if (!loading && !refreshing) {
                    fetchDashboardData(true);
                }
            }, 5 * 60 * 1000); // 5 minutes
        };

        // Only setup auto-refresh after initial load
        if (!loading && stats) {
            setupAutoRefresh();
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [loading, refreshing, stats, fetchDashboardData]);

    return {
        stats,
        recentTransactions,
        chartData,
        loading,
        error,
        refreshing,
        lastUpdated,
        refresh,
        hasData: Boolean(stats && chartData.assetStatusChart.labels.length > 0),
    };
};