import React from "react";
import {
  Typography,
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Select,
  Option,
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
import { Link } from "react-router-dom";
import { transactionAPI } from "@/lib/assetApi";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";

export function Home() {
  const {
    stats,
    chartData,
    loading,
    error,
    refreshing,
    lastUpdated,
    refresh,
    hasData,
  } = useDashboard();

  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const [recentLimit, setRecentLimit] = React.useState(5);
  const [recentRows, setRecentRows] = React.useState([]);
  const [recentLoading, setRecentLoading] = React.useState(false);
  const [recentError, setRecentError] = React.useState("");

  const fetchRecent = React.useCallback(async (limit) => {
    try {
      setRecentLoading(true);
      setRecentError("");
      const resp = await transactionAPI.getRecent(limit);
      const list = Array.isArray(resp) ? resp : (resp.results || []);
      setRecentRows(list);
    } catch (e) {
      console.error("Failed to fetch recent transactions:", e);
      setRecentError(t('errors.failedToFetch') + " recent transactions");
      setRecentRows([]);
    } finally {
      setRecentLoading(false);
    }
  }, [t]);

  const handleRefresh = async () => {
    await refresh();
    await fetchRecent(recentLimit);
  };

  React.useEffect(() => {
    fetchRecent(recentLimit);
  }, [fetchRecent, recentLimit]);

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
          {t('errors.loadingDashboard')}
        </Typography>
        <Typography variant="small" color="gray" className="mb-4">
          {error}
        </Typography>
        <Button onClick={refresh} color="blue">
          {t('actions.tryAgain')}
        </Button>
      </div>
    );
  }

  // ---- Cards config with translations
  const statisticsCardsConfig = [
    {
      color: "blue",
      icon: BuildingOfficeIcon,
      title: t('dashboard.totalDepartments'),
      value: stats?.total_departments?.toLocaleString() || "0",
      to: "/dashboard/departments",
    },
    {
      color: "green",
      icon: CubeIcon,
      title: t('dashboard.totalAssets'),
      value: stats?.total_assets?.toLocaleString() || "0",
      to: "/dashboard/assets",
    },
    {
      color: "pink",
      icon: UsersIcon,
      title: t('dashboard.totalEmployees'),
      value: stats?.total_employees?.toLocaleString() || "0",
      to: "/dashboard/employees",
    },
    {
      color: "orange",
      icon: ArrowsRightLeftIcon,
      title: t('dashboard.totalTransactions'),
      value: stats?.total_transactions?.toLocaleString() || "0",
      to: "/dashboard/transactions",
    },
  ];

  // ---- Charts setup with translation-aware labels
  const normalizeLabel = (label) => {
    const L = String(label).trim().toLowerCase();
    if (L === "issue" || L === "issues" || L === "issued") return t('transactions.assign');
    if (L === "assigned") return t('status.assigned');
    if (L === "return" || L === "returns" || L === "returned") return t('transactions.return');
    return label;
  };

  const rawStatusLabels = chartData?.assetStatusChart?.labels || [t('common.noData')];
  const displayStatusLabels = rawStatusLabels.map(normalizeLabel);

  const assetStatusChart = {
    type: "pie",
    height: 280,
    series: chartData?.assetStatusChart?.series || [1],
    options: {
      chart: { toolbar: { show: false } },
      title: { show: false },
      dataLabels: { enabled: true },
      colors: ["#1e40af", "#10b981", "#f59e0b", "#ef4444"],
      labels: displayStatusLabels,
      legend: {
        show: true,
        position: "bottom",
        formatter: (seriesName) => normalizeLabel(seriesName),
      },
      tooltip: {
        y: {
          formatter: (value, { seriesIndex }) => {
            const name = displayStatusLabels[seriesIndex] || "";
            return `${name}: ${value}`;
          },
        },
      },
      responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: "bottom" } } }],
    },
  };

  const rawWeeklySeries = chartData?.weeklyChart?.series || [{ name: "No data", data: [0] }];
  const weeklySeriesDisplay = rawWeeklySeries.map((s) => ({ ...s, name: normalizeLabel(s.name) }));
  const weeklyMax = Math.max(0, ...weeklySeriesDisplay.flatMap((s) => s.data ?? []));
  const yMaxInt = Math.max(1, Math.ceil(weeklyMax));

  const weeklyTransactionsChart = {
    type: "bar",
    height: 280,
    series: weeklySeriesDisplay,
    options: {
      chart: { toolbar: { show: false } },
      title: { show: false },
      dataLabels: { enabled: false },
      colors: ["#2aaf1e", "#f59e0b"],
      plotOptions: { bar: { columnWidth: "40%", borderRadius: 2 } },
      xaxis: {
        categories: chartData?.weeklyChart?.categories || ["No data"],
        axisTicks: { show: false },
        axisBorder: { show: false },
        labels: { style: { colors: "#616161", fontSize: "12px", fontFamily: "inherit", fontWeight: 400 } },
      },
      yaxis: {
        min: 0,
        max: yMaxInt,
        tickAmount: yMaxInt,
        labels: { formatter: (val) => `${Math.round(val)}`, style: { colors: "#616161", fontSize: "12px", fontFamily: "inherit", fontWeight: 400 } },
      },
      legend: { show: true, position: "bottom", formatter: (seriesName) => normalizeLabel(seriesName) },
      grid: { show: true, borderColor: "#dddddd", strokeDashArray: 5, xaxis: { lines: { show: true } }, padding: { top: 5, right: 20 } },
      fill: { opacity: 0.8 },
      tooltip: { theme: "dark", y: { formatter: (val) => `${Math.round(val)}` } },
    },
  };

  const rawMonthlySeries = chartData?.monthlyChart?.series || [{ name: "No data", data: [0] }];
  const monthlySeriesDisplay = rawMonthlySeries.map((s) => ({ ...s, name: s.name }));
  const monthlyMax = Math.max(0, ...monthlySeriesDisplay.flatMap((s) => s.data ?? []));
  const yMaxMonthly = Math.max(1, Math.ceil(monthlyMax));

  const yearlyTrendsChart = {
    type: "line",
    height: 280,
    series: monthlySeriesDisplay,
    options: {
      chart: { toolbar: { show: false } },
      title: { show: false },
      dataLabels: { enabled: false },
      colors: ["#2aaf1e", "#f59e0b"],
      stroke: { lineCap: "round", curve: "smooth", width: 3 },
      markers: { size: 4 },
      xaxis: {
        categories: chartData?.monthlyChart?.categories || ["No data"],
        axisTicks: { show: false },
        axisBorder: { show: false },
        labels: { style: { colors: "#616161", fontSize: "12px", fontFamily: "inherit", fontWeight: 400 } },
      },
      yaxis: {
        min: 0,
        max: yMaxMonthly,
        tickAmount: yMaxMonthly,
        labels: { formatter: (val) => `${Math.round(val)}`, style: { colors: "#616161", fontSize: "12px", fontFamily: "inherit", fontWeight: 400 } },
      },
      grid: { show: true, borderColor: "#dddddd", strokeDashArray: 5, xaxis: { lines: { show: true } }, padding: { top: 5, right: 20 } },
      fill: { opacity: 0.8 },
      tooltip: { theme: "dark", y: { formatter: (val) => `${Math.round(val)}` } },
    },
  };

  // ---- Helpers for table display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTransactionColor = (type) => (type === "issue" ? "green" : "orange");
  const getTransactionIcon = (type) => (type === "issue" ? "📤" : "📥");
  const getTransactionLabel = (type) => {
    if (type === "issue") return t('transactions.assign');
    if (type === "return") return t('transactions.return');
    return type ? type[0].toUpperCase() + type.slice(1) : "—";
  };

  const getAssetName = (t) => t.asset_name ?? t.asset?.name ?? "N/A";
  const getAssetSerial = (t) => t.asset_serial_number ?? t.asset?.serial_number ?? "N/A";
  const getEmployeeName = (t) =>
    t.employee_name ?? t.employee?.name ?? (t.employee?.user ? `${t.employee.user.first_name} ${t.employee.user.last_name}` : null) ?? "N/A";
  const getDashboardClasses = () => {
    let classes = "mt-12 dashboard-container";
    if (isRTL) {
      classes += " rtl";
    }
    return classes;
  };
  return (
    <div className={getDashboardClasses()}>
      {/* Header with refresh button */}
      <div className={`mb-6 flex justify-between items-center dashboard-header ${isRTL ? 'rtl' : ''}`}>
        <div className={`dashboard-title ${isRTL ? 'text-right order-1' : 'order-1'}`}>
          <Typography variant="h4" color="blue-gray" className={isRTL ? 'text-right' : ''}>
            {t('dashboard.title')}
          </Typography>
          {lastUpdated && (
            <Typography variant="small" color="gray" className={isRTL ? 'text-right' : ''}>
              {t('dashboard.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
        </div>
        <Button
          variant="outlined"
          size="sm"
          className={`flex items-center gap-2 dashboard-refresh-btn ${isRTL ? 'order-2 flex-row-reverse' : 'order-2'}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <ArrowPathIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}
        </Button>
      </div>


      {/* Statistics Cards */}
      <div className={`mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4 statistics-grid ${isRTL ? 'rtl' : ''}`}>
        {statisticsCardsConfig.map(({ icon, title, value, color, to }) => (
          <Link
            key={title}
            to={to}
            className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Go to ${title}`}
          >
            <div className={`statistics-card ${isRTL ? 'rtl' : ''}`}>
              <StatisticsCard
                color={color}
                value={value}
                title={title}
                icon={React.createElement(icon, {
                  className: `w-6 h-6 text-white icon-container ${isRTL ? 'rtl-icon' : ''}`
                })}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${isRTL ? 'rtl-card' : ''}`}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-2 xl:grid-cols-2">
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader variant="gradient" floated={false} shadow={false}>
            <Chart {...assetStatusChart} />
          </CardHeader>
          <CardBody className="px-6 pt-0">
            <Typography variant="h6" color="blue-gray">
              {t('dashboard.assetStatusDistribution')}
            </Typography>
            <Typography variant="small" className="font-normal text-blue-gray-600">
              {t('dashboard.currentDistribution')}
            </Typography>
          </CardBody>
        </Card>

        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader variant="gradient" floated={false} shadow={false}>
            <Chart {...weeklyTransactionsChart} />
          </CardHeader>
          <CardBody className="px-6 pt-0">
            <Typography variant="h6" color="blue-gray">{t('dashboard.weeklyTransactions')}</Typography>
            <Typography variant="small" className="font-normal text-blue-gray-600">{t('dashboard.weeklyAssignsReturns')}</Typography>
          </CardBody>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-2 xl:grid-cols-2">
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader variant="gradient" floated={false} shadow={false}>
            <Chart
              type="donut"
              height={280}
              series={chartData?.departmentChart?.series || [1]}
              options={{
                chart: { toolbar: { show: false } },
                title: { show: false },
                dataLabels: { enabled: true },
                colors: ["#1e40af", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"],
                labels: chartData?.departmentChart?.labels || ["No data"],
                legend: { show: true, position: "bottom" },
                responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: "bottom" } } }],
              }}
            />
          </CardHeader>
          <CardBody className="px-6 pt-0">
            <Typography variant="h6" color="blue-gray">{t('dashboard.assetsByDepartment')}</Typography>
            <Typography variant="small" className="font-normal text-blue-gray-600">{t('dashboard.departmentDistribution')}</Typography>
          </CardBody>
        </Card>

        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader variant="gradient" floated={false} shadow={false}>
            <Chart {...{
              type: "line",
              height: 280,
              series: chartData?.monthlyChart?.series || [{ name: "No data", data: [0] }],
              options: {
                chart: { toolbar: { show: false } },
                title: { show: false },
                dataLabels: { enabled: false },
                colors: ["#1e40af", "#f59e0b"],
                stroke: { lineCap: "round", curve: "smooth", width: 3 },
                markers: { size: 4 },
                xaxis: {
                  categories: chartData?.monthlyChart?.categories || ["No data"],
                  axisTicks: { show: false },
                  axisBorder: { show: false },
                  labels: { style: { colors: "#616161", fontSize: "12px", fontFamily: "inherit", fontWeight: 400 } },
                },
                yaxis: {
                  min: 0,
                  max: Math.max(1, Math.ceil(Math.max(0, ...(chartData?.monthlyChart?.series || [{ data: [0] }]).flatMap(s => s.data ?? [])))),
                  tickAmount: Math.max(1, Math.ceil(Math.max(0, ...(chartData?.monthlyChart?.series || [{ data: [0] }]).flatMap(s => s.data ?? [])))),
                  labels: { formatter: (v) => `${Math.round(v)}`, style: { colors: "#616161", fontSize: "12px", fontFamily: "inherit", fontWeight: 400 } },
                },
                grid: { show: true, borderColor: "#dddddd", strokeDashArray: 5, xaxis: { lines: { show: true } }, padding: { top: 5, right: 20 } },
                fill: { opacity: 0.8 },
                tooltip: { theme: "dark", y: { formatter: (v) => `${Math.round(v)}` } },
              }
            }} />
          </CardHeader>
          <CardBody className="px-6 pt-0">
            <Typography variant="h6" color="blue-gray">{t('dashboard.yearlyTrends')}</Typography>
            <Typography variant="small" className="font-normal text-blue-gray-600">{t('dashboard.monthlyTrends')}</Typography>
          </CardBody>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card className="overflow-visible border border-blue-gray-100 shadow-sm">
        <CardHeader
          floated={false}
          shadow={false}
          color="transparent"
          className="m-0 flex items-center justify-between p-6 overflow-visible"
        >
          <div className={isRTL ? 'text-right' : ''}>
            <Typography variant="h6" color="blue-gray" className="mb-1">
              {t('dashboard.recentTransactions')}
            </Typography>
            <Typography
              variant="small"
              className="flex items-center gap-1 font-normal text-blue-gray-600"
            >
              <CalendarIcon strokeWidth={3} className="h-4 w-4 text-blue-gray-200" />
              {t('dashboard.latestTransactions')}
            </Typography>
          </div>

          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Typography variant="small" className="text-blue-gray-600">
              {t('common.show')}
            </Typography>
            <Select
              label=" "
              value={String(recentLimit)}
              onChange={(v) => setRecentLimit(Number(v || 5))}
              size="md"
              variant="outlined"
              className="w-24"
              containerProps={{ className: "min-w-[96px] z-[60]" }}
              labelProps={{ className: "hidden" }}
              menuProps={{
                className: "z-[70] max-h-56 overflow-y-auto",
                placement: isRTL ? "bottom-start" : "bottom-end",
              }}
            >
              <Option value="5">5</Option>
              <Option value="10">10</Option>
              <Option value="15">15</Option>
            </Select>
          </div>
        </CardHeader>

        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          {recentError && (
            <div className="px-6 py-2">
              <Typography variant="small" color="red">{recentError}</Typography>
            </div>
          )}

          {recentLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : recentRows?.length > 0 ? (
            <table className={`w-full min-w-[640px] table-auto ${isRTL ? 'text-right' : ''}`}>
              <thead>
                <tr>
                  {[t('common.asset'), t('common.employee'), t('common.type'), t('common.date'), t('common.verification')].map((el, index) => (
                    <th key={el} className={`border-b border-blue-gray-50 py-3 px-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                        {el}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentRows.map((transaction, key) => {
                  const className = `py-3 px-6 ${key === recentRows.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                  return (
                    <tr key={transaction.id}>
                      <td className={className}>
                        <div>
                          <Typography variant="small" color="blue-gray" className="font-bold">
                            {getAssetName(transaction)}
                          </Typography>
                          <Typography className="text-xs font-normal text-blue-gray-500">
                            {getAssetSerial(transaction)}
                          </Typography>
                        </div>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="font-medium text-blue-gray-600">
                          {getEmployeeName(transaction)}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Chip
                          variant="gradient"
                          color={getTransactionColor(transaction.transaction_type)}
                          value={
                            <div className="flex items-center gap-1">
                              <span>{getTransactionIcon(transaction.transaction_type)}</span>
                              <span>{getTransactionLabel(transaction.transaction_type)}</span>
                            </div>
                          }
                          className="py-0.5 px-2 text-[11px] font-medium"
                        />
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="text-xs font-medium text-blue-gray-600">
                          {transaction.formattedDate || formatDate(transaction.transaction_date)}
                        </Typography>
                      </td>
                      <td className={className}>
                        <div className="flex items-center">
                          {transaction.face_verification_success ? (
                            <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 text-red-500" />
                          )}
                          <Typography
                            className={`${isRTL ? 'mr-2' : 'ml-2'} text-xs font-medium ${transaction.face_verification_success ? "text-blue-600" : "text-red-600"
                              }`}
                          >
                            {transaction.face_verification_success ? t('common.verified') : t('common.notVerified')}
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
                {t('dashboard.noRecentTransactions')}
              </Typography>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default Home;
