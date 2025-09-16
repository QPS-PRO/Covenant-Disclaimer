// frontend/src/data/dashboard-data.js
import {
    UsersIcon,
    CubeIcon,
    BuildingOfficeIcon,
    ArrowsRightLeftIcon,
} from "@heroicons/react/24/solid";

// Statistics cards configuration
export const statisticsCardsConfig = [
    {
        color: "blue",
        icon: BuildingOfficeIcon,
        title: "Total Departments",
        key: "total_departments",
        footer: {
            color: "text-green-500",
            value: "+3%",
            label: "than last month",
        },
    },
    {
        color: "pink",
        icon: CubeIcon,
        title: "Total Assets",
        key: "total_assets",
        footer: {
            color: "text-green-500",
            value: "+5%",
            label: "than yesterday",
        },
    },
    {
        color: "green",
        icon: UsersIcon,
        title: "Total Employees",
        key: "total_employees",
        footer: {
            color: "text-red-500",
            value: "-2%",
            label: "than yesterday",
        },
    },
    {
        color: "orange",
        icon: ArrowsRightLeftIcon,
        title: "Recent Transactions",
        key: "recent_transactions",
        footer: {
            color: "text-green-500",
            value: "+12%",
            label: "than last week",
        },
    },
];

// Chart configurations
export const chartConfigurations = {
    assetStatusChart: {
        type: "pie",
        height: 280,
        options: {
            chart: {
                toolbar: { show: false },
            },
            title: { show: false },
            dataLabels: { enabled: true },
            colors: ["#1e40af", "#f59e0b", "#ef4444", "#6b7280"],
            labels: ["Assigned Assets", "Available Assets", "Under Maintenance", "Retired"],
            legend: {
                show: true,
                position: "bottom",
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        },
    },

    weeklyTransactionsChart: {
        type: "bar",
        height: 280,
        options: {
            chart: { toolbar: { show: false } },
            title: { show: false },
            dataLabels: { enabled: false },
            colors: ["#1e40af", "#f59e0b"],
            plotOptions: {
                bar: {
                    columnWidth: "40%",
                    borderRadius: 2,
                },
            },
            xaxis: {
                axisTicks: { show: false },
                axisBorder: { show: false },
                labels: {
                    style: {
                        colors: "#616161",
                        fontSize: "12px",
                        fontFamily: "inherit",
                        fontWeight: 400,
                    },
                },
                categories: [],
            },
            yaxis: {
                labels: {
                    style: {
                        colors: "#616161",
                        fontSize: "12px",
                        fontFamily: "inherit",
                        fontWeight: 400,
                    },
                },
            },
            grid: {
                show: true,
                borderColor: "#dddddd",
                strokeDashArray: 5,
                xaxis: { lines: { show: true } },
                padding: { top: 5, right: 20 },
            },
            fill: { opacity: 0.8 },
            tooltip: { theme: "dark" },
        },
    },

    departmentAssetsChart: {
        type: "donut",
        height: 280,
        options: {
            chart: { toolbar: { show: false } },
            title: { show: false },
            dataLabels: { enabled: true },
            colors: ["#1e40af", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"],
            labels: [],
            legend: {
                show: true,
                position: "bottom",
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        },
    },

    yearlyTrendsChart: {
        type: "line",
        height: 280,
        options: {
            chart: { toolbar: { show: false } },
            title: { show: false },
            dataLabels: { enabled: false },
            colors: ["#1e40af", "#f59e0b"],
            stroke: {
                lineCap: "round",
                curve: "smooth",
                width: 3,
            },
            markers: {
                size: 4,
            },
            xaxis: {
                axisTicks: { show: false },
                axisBorder: { show: false },
                labels: {
                    style: {
                        colors: "#616161",
                        fontSize: "12px",
                        fontFamily: "inherit",
                        fontWeight: 400,
                    },
                },
                categories: [
                    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ],
            },
            yaxis: {
                labels: {
                    style: {
                        colors: "#616161",
                        fontSize: "12px",
                        fontFamily: "inherit",
                        fontWeight: 400,
                    },
                },
            },
            grid: {
                show: true,
                borderColor: "#dddddd",
                strokeDashArray: 5,
                xaxis: { lines: { show: true } },
                padding: { top: 5, right: 20 },
            },
            fill: { opacity: 0.8 },
            tooltip: { theme: "dark" },
        },
    },
};

// Chart titles and descriptions
export const chartMetadata = {
    assetStatusPieChart: {
        title: "Asset Status Distribution",
        description: "Current distribution of assets by status",
    },
    weeklyTransactionsChart: {
        title: "Weekly Transactions",
        description: "Asset issues and returns over the past week",
    },
    departmentAssetsChart: {
        title: "Assets by Department",
        description: "Distribution of assets across departments",
    },
    yearlyTrendsChart: {
        title: "Yearly Trends",
        description: "Monthly transaction trends throughout the year",
    },
};

// Transaction status configurations
export const transactionConfig = {
    types: {
        issue: {
            label: "Issue",
            color: "green",
            icon: "📤",
            bgColor: "bg-green-50",
            textColor: "text-green-700",
        },
        return: {
            label: "Return",
            color: "blue",
            icon: "📥",
            bgColor: "bg-blue-50",
            textColor: "text-blue-700",
        },
    },
    verificationStatus: {
        true: {
            label: "Verified",
            color: "green",
            icon: "✅",
        },
        false: {
            label: "Not Verified",
            color: "red",
            icon: "❌",
        },
    },
};

export default {
    statisticsCardsConfig,
    chartConfigurations,
    chartMetadata,
    transactionConfig,
};