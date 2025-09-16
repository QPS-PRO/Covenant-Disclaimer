// frontend/src/pages/dashboard/home.jsx (Updated to use real API)
import React from "react";
import {
  Typography,
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
} from "@material-tailwind/react";
import {
  ArrowPathIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
  CubeIcon,
  BuildingOfficeIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/solid";
import { StatisticsCard } from "@/widgets/cards";
import Chart from "react-apexcharts";
import { useDashboard } from "@/hooks/useDashboard";

export function Home() {
  const {
    stats,
    recentTransactions,
    chartData,
    loading,
    error,
    refreshing,
    lastUpdated,
    refresh,
    hasData,
  } = useDashboard();

  if (loading && !hasData) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !hasData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-96">
        <Typography variant="h6" color="red" className="mb-4">
          Error loading dashboard data
        </Typography>
        <Typography variant="small" color="gray" className="mb-4">
          {error}
        </Typography>
        <Button onClick={refresh} color="blue">
          Try Again
        </Button>
      </div>
    );
  }

  // Statistics cards configuration using real API data
  const statisticsCardsConfig = [
    {
      color: "blue",
      icon: BuildingOfficeIcon,
      title: "Total Departments",
      value: stats?.total_departments?.toLocaleString() || "0",
      footer: {
        color: "text-green-500",
        value: "+3%",
        label: "than last month",
      },
    },
    {
      color: "green",
      icon: CubeIcon,
      title: "Total Assets",
      value: stats?.total_assets?.toLocaleString() || "0",
      footer: {
        color: "text-green-500",
        value: "+5%",
        label: "than last month",
      },
    },
    {
      color: "pink",
      icon: UsersIcon,
      title: "Total Employees",
      value: stats?.total_employees?.toLocaleString() || "0",
      footer: {
        color: "text-green-500",
        value: "+2%",
        label: "than last month",
      },
    },
    {
      color: "orange",
      icon: ArrowsRightLeftIcon,
      title: "Recent Transactions",
      value: stats?.recent_transactions?.toLocaleString() || "0",
      footer: {
        color: "text-green-500",
        value: "+12%",
        label: "than last week",
      },
    },
  ];

  // Chart configurations
  const assetStatusChart = {
    type: "pie",
    height: 280,
    series: chartData?.assetStatusChart?.series || [1],
    options: {
      chart: { toolbar: { show: false } },
      title: { show: false },
      dataLabels: { enabled: true },
      colors: ["#1e40af", "#10b981", "#f59e0b", "#ef4444"],
      labels: chartData?.assetStatusChart?.labels || ["No data"],
      legend: {
        show: true,
        position: "bottom",
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { position: 'bottom' }
        }
      }]
    },
  };

  const weeklyTransactionsChart = {
    type: "bar",
    height: 280,
    series: chartData?.weeklyChart?.series || [{ name: "No data", data: [0] }],
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
        categories: chartData?.weeklyChart?.categories || ["No data"],
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
  };

  const departmentAssetsChart = {
    type: "donut",
    height: 280,
    series: chartData?.departmentChart?.series || [1],
    options: {
      chart: { toolbar: { show: false } },
      title: { show: false },
      dataLabels: { enabled: true },
      colors: ["#1e40af", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"],
      labels: chartData?.departmentChart?.labels || ["No data"],
      legend: {
        show: true,
        position: "bottom",
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { position: 'bottom' }
        }
      }]
    },
  };

  const yearlyTrendsChart = {
    type: "line",
    height: 280,
    series: chartData?.monthlyChart?.series || [{ name: "No data", data: [0] }],
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
        categories: chartData?.monthlyChart?.categories || ["No data"],
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
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionColor = (type) => type === 'issue' ? 'green' : 'blue';
  const getTransactionIcon = (type) => type === 'issue' ? '📤' : '📥';

  return (
    <div className="mt-12">
      {/* Header with refresh button */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Typography variant="h4" color="blue-gray">
            Asset Management Dashboard
          </Typography>
          {lastUpdated && (
            <Typography variant="small" color="gray">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
        </div>
        <Button
          variant="outlined"
          size="sm"
          className="flex items-center gap-2"
          onClick={refresh}
          disabled={refreshing}
        >
          <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
        {statisticsCardsConfig.map(({ icon, title, value, footer, color }) => (
          <StatisticsCard
            key={title}
            color={color}
            value={value}
            title={title}
            icon={React.createElement(icon, {
              className: "w-6 h-6 text-white",
            })}
            footer={
              <Typography className="font-normal text-blue-gray-600">
                <strong className={footer.color}>{footer.value}</strong>
                &nbsp;{footer.label}
              </Typography>
            }
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-2 xl:grid-cols-2">
        {/* Asset Status Pie Chart */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader variant="gradient" floated={false} shadow={false}>
            <Chart {...assetStatusChart} />
          </CardHeader>
          <CardBody className="px-6 pt-0">
            <Typography variant="h6" color="blue-gray">
              Asset Status Distribution
            </Typography>
            <Typography variant="small" className="font-normal text-blue-gray-600">
              Current distribution of assets by status
            </Typography>
          </CardBody>
        </Card>

        {/* Weekly Transactions Chart */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader variant="gradient" floated={false} shadow={false}>
            <Chart {...weeklyTransactionsChart} />
          </CardHeader>
          <CardBody className="px-6 pt-0">
            <Typography variant="h6" color="blue-gray">
              Weekly Transactions
            </Typography>
            <Typography variant="small" className="font-normal text-blue-gray-600">
              Asset issues and returns over the past week
            </Typography>
          </CardBody>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-2 xl:grid-cols-2">
        {/* Department Assets Chart */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader variant="gradient" floated={false} shadow={false}>
            <Chart {...departmentAssetsChart} />
          </CardHeader>
          <CardBody className="px-6 pt-0">
            <Typography variant="h6" color="blue-gray">
              Assets by Department
            </Typography>
            <Typography variant="small" className="font-normal text-blue-gray-600">
              Distribution of assets across departments
            </Typography>
          </CardBody>
        </Card>

        {/* Yearly Trends Chart */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader variant="gradient" floated={false} shadow={false}>
            <Chart {...yearlyTrendsChart} />
          </CardHeader>
          <CardBody className="px-6 pt-0">
            <Typography variant="h6" color="blue-gray">
              Yearly Transaction Trends
            </Typography>
            <Typography variant="small" className="font-normal text-blue-gray-600">
              Monthly asset issues and returns throughout the year
            </Typography>
          </CardBody>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card className="overflow-hidden border border-blue-gray-100 shadow-sm">
        <CardHeader
          floated={false}
          shadow={false}
          color="transparent"
          className="m-0 flex items-center justify-between p-6"
        >
          <div>
            <Typography variant="h6" color="blue-gray" className="mb-1">
              Recent Transactions
            </Typography>
            <Typography
              variant="small"
              className="flex items-center gap-1 font-normal text-blue-gray-600"
            >
              <CalendarIcon strokeWidth={3} className="h-4 w-4 text-blue-gray-200" />
              Latest asset assignments and returns
            </Typography>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          {recentTransactions?.length > 0 ? (
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {["Asset", "Employee", "Type", "Date", "Verification"].map((el) => (
                    <th
                      key={el}
                      className="border-b border-blue-gray-50 py-3 px-6 text-left"
                    >
                      <Typography
                        variant="small"
                        className="text-[11px] font-medium uppercase text-blue-gray-400"
                      >
                        {el}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction, key) => {
                  const className = `py-3 px-5 ${key === recentTransactions.length - 1
                      ? ""
                      : "border-b border-blue-gray-50"
                    }`;

                  return (
                    <tr key={transaction.id}>
                      <td className={className}>
                        <div>
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-bold"
                          >
                            {transaction.asset?.name || 'N/A'}
                          </Typography>
                          <Typography className="text-xs font-normal text-blue-gray-500">
                            {transaction.asset?.serial_number || 'N/A'}
                          </Typography>
                        </div>
                      </td>
                      <td className={className}>
                        <Typography
                          variant="small"
                          className="font-medium text-blue-gray-600"
                        >
                          {transaction.employee?.user ?
                            `${transaction.employee.user.first_name} ${transaction.employee.user.last_name}` :
                            'N/A'}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Chip
                          variant="gradient"
                          color={getTransactionColor(transaction.transaction_type)}
                          value={
                            <div className="flex items-center gap-1">
                              <span>{getTransactionIcon(transaction.transaction_type)}</span>
                              <span className="capitalize">{transaction.transaction_type}</span>
                            </div>
                          }
                          className="py-0.5 px-2 text-[11px] font-medium"
                        />
                      </td>
                      <td className={className}>
                        <Typography
                          variant="small"
                          className="text-xs font-medium text-blue-gray-600"
                        >
                          {transaction.formattedDate || formatDate(transaction.transaction_date)}
                        </Typography>
                      </td>
                      <td className={className}>
                        <div className="flex items-center">
                          {transaction.face_verification_success ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 text-red-500" />
                          )}
                          <Typography
                            className={`ml-2 text-xs font-medium ${transaction.face_verification_success
                                ? 'text-green-600'
                                : 'text-red-600'
                              }`}
                          >
                            {transaction.face_verification_success ? 'Verified' : 'Not Verified'}
                          </Typography>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex justify-center items-center py-8">
              <Typography variant="small" color="gray">
                No recent transactions available
              </Typography>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default Home;