// // frontend/src/pages/management/transactions.jsx
// import React, { useState, useEffect } from "react";
// import {
//     Card,
//     CardHeader,
//     CardBody,
//     Typography,
//     Button,
//     Chip,
//     IconButton,
//     Input,
//     Dialog,
//     DialogHeader,
//     DialogBody,
//     DialogFooter,
//     Select,
//     Option,
//     Alert,
//     Textarea,
//     Switch,
// } from "@material-tailwind/react";
// import { PlusIcon, EyeIcon, MagnifyingGlassIcon, ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
// import { transactionAPI, assetAPI, employeeAPI, departmentAPI } from "@/lib/assetApi";

// export function Transactions() {
//     const [transactions, setTransactions] = useState([]);
//     const [assets, setAssets] = useState([]);
//     const [employees, setEmployees] = useState([]);
//     const [departments, setDepartments] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");
//     const [searchTerm, setSearchTerm] = useState("");
//     const [selectedDepartment, setSelectedDepartment] = useState("");
//     const [selectedType, setSelectedType] = useState("");

//     // Modal states
//     const [showAddModal, setShowAddModal] = useState(false);
//     const [showViewModal, setShowViewModal] = useState(false);
//     const [selectedTransaction, setSelectedTransaction] = useState(null);

//     // Form states
//     const [formData, setFormData] = useState({
//         asset: "",
//         employee: "",
//         transaction_type: "issue",
//         notes: "",
//         face_verification_success: false,
//         return_condition: "",
//         damage_notes: "",
//     });
//     const [formLoading, setFormLoading] = useState(false);

//     const transactionTypeColors = {
//         issue: "green",
//         return: "orange",
//     };

//     useEffect(() => {
//         fetchTransactions();
//         fetchAssets();
//         fetchEmployees();
//         fetchDepartments();
//     }, []);

//     const fetchTransactions = async () => {
//         try {
//             setLoading(true);
//             const params = {};
//             if (selectedDepartment) params.asset__department = selectedDepartment;
//             if (selectedType) params.transaction_type = selectedType;
//             if (searchTerm) params.search = searchTerm;

//             const response = await transactionAPI.getAll(params);
//             setTransactions(response.results || response);
//         } catch (err) {
//             setError("Failed to fetch transactions");
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchAssets = async () => {
//         try {
//             const response = await assetAPI.getAll();
//             setAssets(response.results || response);
//         } catch (err) {
//             console.error("Failed to fetch assets:", err);
//         }
//     };

//     const fetchEmployees = async () => {
//         try {
//             const response = await employeeAPI.getAll();
//             setEmployees(response.results || response);
//         } catch (err) {
//             console.error("Failed to fetch employees:", err);
//         }
//     };

//     const fetchDepartments = async () => {
//         try {
//             const response = await departmentAPI.getAll();
//             setDepartments(response.results || response);
//         } catch (err) {
//             console.error("Failed to fetch departments:", err);
//         }
//     };

//     useEffect(() => {
//         const timer = setTimeout(() => {
//             fetchTransactions();
//         }, 300);
//         return () => clearTimeout(timer);
//     }, [searchTerm, selectedDepartment, selectedType]);

//     const handleInputChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         setFormData(prev => ({
//             ...prev,
//             [name]: type === "checkbox" ? checked : value
//         }));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setFormLoading(true);
//         setError("");

//         try {
//             await transactionAPI.create(formData);
//             setShowAddModal(false);
//             setFormData({
//                 asset: "",
//                 employee: "",
//                 transaction_type: "issue",
//                 notes: "",
//                 face_verification_success: false,
//                 return_condition: "",
//                 damage_notes: "",
//             });
//             fetchTransactions();
//         } catch (err) {
//             setError(err.message || "Failed to create transaction");
//         } finally {
//             setFormLoading(false);
//         }
//     };

//     const handleViewTransaction = async (transaction) => {
//         try {
//             const response = await transactionAPI.getById(transaction.id);
//             setSelectedTransaction(response);
//             setShowViewModal(true);
//         } catch (err) {
//             setError("Failed to fetch transaction details");
//         }
//     };

//     // Filter assets based on transaction type
//     const getAvailableAssets = () => {
//         if (formData.transaction_type === "issue") {
//             return assets.filter(asset => asset.status === "available");
//         } else {
//             return assets.filter(asset => asset.status === "assigned");
//         }
//     };

//     // Filter employees based on selected asset for returns
//     const getAvailableEmployees = () => {
//         if (formData.transaction_type === "return" && formData.asset) {
//             const selectedAsset = assets.find(a => a.id.toString() === formData.asset);
//             return selectedAsset?.current_holder
//                 ? employees.filter(emp => emp.id === selectedAsset.current_holder)
//                 : [];
//         }
//         return employees;
//     };

//     if (loading) {
//         return (
//             <div className="flex justify-center items-center min-h-screen">
//                 <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
//             </div>
//         );
//     }

//     return (
//         <div className="mt-12 mb-8 flex flex-col gap-12">
//             <Card>
//                 <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
//                     <div className="flex items-center justify-between">
//                         <Typography variant="h6" color="white">
//                             Asset Transactions
//                         </Typography>
//                         <Button
//                             className="flex items-center gap-3"
//                             size="sm"
//                             onClick={() => setShowAddModal(true)}
//                         >
//                             <PlusIcon strokeWidth={2} className="h-4 w-4" />
//                             New Transaction
//                         </Button>
//                     </div>
//                 </CardHeader>

//                 <CardBody className="px-0 pt-0 pb-2">
//                     {error && (
//                         <Alert color="red" className="mb-6 mx-6">
//                             {error}
//                         </Alert>
//                     )}

//                     {/* Filters */}
//                     <div className="flex flex-col md:flex-row gap-4 mb-6 px-6">
//                         <div className="w-full md:w-72">
//                             <Input
//                                 label="Search transactions..."
//                                 icon={<MagnifyingGlassIcon className="h-5 w-5" />}
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                             />
//                         </div>
//                         <div className="w-full md:w-48">
//                             <Select
//                                 label="Filter by Department"
//                                 value={selectedDepartment}
//                                 onChange={(value) => setSelectedDepartment(value)}
//                             >
//                                 <Option value="">All Departments</Option>
//                                 {departments.map((dept) => (
//                                     <Option key={dept.id} value={dept.id.toString()}>
//                                         {dept.name}
//                                     </Option>
//                                 ))}
//                             </Select>
//                         </div>
//                         <div className="w-full md:w-48">
//                             <Select
//                                 label="Filter by Type"
//                                 value={selectedType}
//                                 onChange={(value) => setSelectedType(value)}
//                             >
//                                 <Option value="">All Types</Option>
//                                 <Option value="issue">Issue</Option>
//                                 <Option value="return">Return</Option>
//                             </Select>
//                         </div>
//                     </div>

//                     {/* Table */}
//                     <div className="overflow-x-scroll">
//                         <table className="w-full min-w-[640px] table-auto">
//                             <thead>
//                                 <tr>
//                                     {["Type", "Asset", "Employee", "Date", "Processed By", "Verification", "Actions"].map((el) => (
//                                         <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
//                                             <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
//                                                 {el}
//                                             </Typography>
//                                         </th>
//                                     ))}
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {transactions.map((transaction, key) => {
//                                     const className = `py-3 px-5 ${key === transactions.length - 1 ? "" : "border-b border-blue-gray-50"
//                                         }`;

//                                     return (
//                                         <tr key={transaction.id}>
//                                             <td className={className}>
//                                                 <div className="flex items-center gap-2">
//                                                     {transaction.transaction_type === "issue" ? (
//                                                         <ArrowRightIcon className="h-4 w-4 text-green-500" />
//                                                     ) : (
//                                                         <ArrowLeftIcon className="h-4 w-4 text-orange-500" />
//                                                     )}
//                                                     <Chip