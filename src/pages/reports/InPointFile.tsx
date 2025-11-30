import React, { useState, useEffect } from 'react';
import { FileDown, XCircle, CheckCircle } from 'lucide-react'; // Added icons
import ReportService from '../../services/ReportsServices';
import UserService from '../../services/UserServices'; // Added UserService
import { LedgerItem, LedgerParams } from '../../modals/reports';
import { PaginationInfo, UserListItem } from '../../modals/User'; // Added UserListItem
import { formatDate, formatTransId } from '../../utils/formatDate';

// Utility function to trigger a file download (Unchanged)
const downloadFile = (blob: Blob, filename: string) => {
    try {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading file:", error);
    }
};

// --- Helper to sort users alphabetically --- (Unchanged)
const sortUsers = (users: UserListItem[]): UserListItem[] => {
    return [...users].sort((a, b) => {
        const nameA = a.username?.toLowerCase() || '';
        const nameB = b.username?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
    });
};


function InPointsReport() {
    // --- States ---
    const [tableData, setTableData] = useState<LedgerItem[]>([]);
    const [paginationData, setPaginationData] = useState<PaginationInfo | null>(null);
    const [totalIn, setTotalIn] = useState(0);
    const [isLoading, setIsLoading] = useState(true); // --- UPDATED: Set to true
    const [isExporting, setIsExporting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [hasAppliedOnce, setHasAppliedOnce] = useState(true); // --- UPDATED: Set to true
    const [filters, setFilters] = useState<LedgerParams>({
        // receiveBy is not used in this report's filters
        sendBy: '',
        startDate: '',
        endDate: '',
        dateRange: 'today', // --- UPDATED: Set to 'today'
    });

    // --- NEW State for Dropdown (Unchanged) ---
    const [userDropdownOptions, setUserDropdownOptions] = useState<UserListItem[]>([]);
    const [isDropdownLoading, setIsDropdownLoading] = useState(true);

     // --- Effect to fetch users for dropdown ONCE (Unchanged) ---
    useEffect(() => {
        const fetchDropdownUsers = async () => {
            setIsDropdownLoading(true);
            setApiError(null);
            try {
                const roleFromStorage = localStorage.getItem('userRole');
                const rolesToFetch: ('agent' | 'sub-agent' | 'user')[] = [];
                // Fetch ALL relevant roles under the current user for the dropdown
                if (roleFromStorage === 'admin') rolesToFetch.push('agent', 'sub-agent', 'user');
                else if (roleFromStorage === 'agent') rolesToFetch.push('sub-agent', 'user');
                else if (roleFromStorage === 'sub-agent' || roleFromStorage === 'subagent') rolesToFetch.push('user');

                if (rolesToFetch.length === 0 && roleFromStorage !== 'user' ) { // Allow user role
                     setIsDropdownLoading(false);
                     return;
                }

                 if(rolesToFetch.length > 0) { // Only fetch if roles identified
                    const promises = rolesToFetch.map(role => UserService.listUser({ role, limit: 10000 }));
                    const results = await Promise.all(promises);

                    let combinedUsers: UserListItem[] = [];
                    let fetchError = false;
                    results.forEach(response => {
                        if (response.success && response.data) {
                            combinedUsers.push(...response.data.users);
                        } else {
                             console.error("Failed to fetch role:", response.message);
                             fetchError = true;
                        }
                    });

                     if (fetchError && combinedUsers.length === 0) {
                         setApiError("Could not load user list for 'Sent By' filter.");
                     } else if (fetchError) {
                         console.warn("Some user lists failed to load for dropdown.");
                     }

                    const uniqueUsers = Array.from(new Map(combinedUsers.map(user => [user._id, user])).values());
                    setUserDropdownOptions(sortUsers(uniqueUsers)); // Set sorted users
                 }

            } catch (err) {
                console.error("Failed to load users for dropdowns:", err);
                setApiError("An unexpected error occurred while loading user list.");
            } finally {
                setIsDropdownLoading(false);
            }
        };
        fetchDropdownUsers();
    }, []); // Runs once on mount

    // --- UPDATED: New useEffect to fetch data on initial load ---
    useEffect(() => {
        handleSubmit(1); // This will run once when the component mounts
    }, []); // Empty dependency array ensures it runs only once

    // --- (handleFilterChange, handleSubmit, handleExport, pagination handlers - Unchanged) ---
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let newFilters = { ...filters, [name]: value };
        if (name === 'dateRange' && value) {
            newFilters.startDate = '';
            newFilters.endDate = '';
        } else if ((name === 'startDate' || name === 'endDate') && value) {
            newFilters.dateRange = undefined;
        }
        setFilters(newFilters as LedgerParams); // Ensure type safety
    };

    const handleClear = () => {
        setFilters({ sendBy: '', startDate: '', endDate: '', dateRange: undefined });
        setTableData([]);
        setPaginationData(null);
        setTotalIn(0);
        // setHasAppliedOnce(false); // --- UPDATED: Removed this line so table stays visible
        setApiError(null);
    };

    const handleSubmit = async (pageToFetch: number = 1) => {
        setIsLoading(true);
        setApiError(null);
        // setHasAppliedOnce(true); // No longer needed, set in state
        const params: LedgerParams = {
            sendBy: filters.sendBy || undefined, // Send username or undefined
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            dateRange: filters.dateRange ? (filters.dateRange as any) : undefined,
            page: pageToFetch,
            limit: 20,
        };

        const response = await ReportService.getInPoints(params);

        if (response.success && response.data) {
            setTableData(response.data.records || []);
            setPaginationData(response.data.pagination);
            const totalFromResponse = (response.data as any).totalIN ?? (response.data as any).totalIn ?? (response.data as any).summary?.totalIn ?? 0;
            setTotalIn(Number(totalFromResponse) || 0);
        } else {
            setApiError(response.message || 'Failed to fetch In Points report.');
            setTableData([]);
            setPaginationData(null);
            setTotalIn(0); // Reset total on error
        }
        setIsLoading(false);
    };

     const handleExport = async () => {
         setIsExporting(true);
         setApiError(null);
         try {
              const paramsToExport: LedgerParams & { export?: boolean } = { // Added export flag type
                   sendBy: filters.sendBy || undefined,
                   startDate: filters.startDate || undefined,
                   endDate: filters.endDate || undefined,
                   dateRange: filters.dateRange ? (filters.dateRange as any) : undefined,
                   export: true // Pass export flag to backend
             };
             const fileBlob = await ReportService.exportInPoints(paramsToExport);
             downloadFile(fileBlob, 'In_Points_Report.xlsx');
         } catch (err) {
             console.error("Export failed:", err);
             setApiError('Failed to export data. Please try again.');
         } finally {
             setIsExporting(false);
      }
    };

    const handleNextPage = () => {
        if (paginationData && paginationData.currentPage < paginationData.totalPages) {
            handleSubmit(paginationData.currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (paginationData && paginationData.currentPage > 1) {
         handleSubmit(paginationData.currentPage - 1);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full font-sans">
            <h1 className="text-3xl font-bold text-green-800 mb-6">In Points Report</h1>

            <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-green-100">
                 {/* --- Filter Section (Unchanged) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* --- Sent By Dropdown --- */}
                    <div className="lg:col-span-1">
                   <label htmlFor="sendBy" className="block text-sm font-medium text-gray-600 mb-1">Sent By:</label>
                        <select
                            id="sendBy"
                            name="sendBy"
                            value={filters.sendBy}
                            onChange={handleFilterChange}
                            disabled={isDropdownLoading}
className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">{isDropdownLoading ? 'Loading...' : 'All Users'}</option>
                            {userDropdownOptions.map(user => (
                                <option key={user._id + '-send'} value={user.username}>{user.username}</option>
                            ))}
                        </select>
                    </div>

                    {/* --- Date Filters (Unchanged) --- */}
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-600 mb-1">Start Date:</label>
                        <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-600 mb-1">End Date:</label>
                        <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                    </div>
                    <div>
                        <label htmlFor="dateRange" className="block text-sm font-medium text-gray-600 mb-1">Date Range:</label>
                        <select id="dateRange" name="dateRange" value={filters.dateRange ?? ''} onChange={handleFilterChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                            <option value="">Select</option>
                    	       <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="this_week">This Week</option>
                            <option value="last_week">Last Week</option>
                     	     <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                        </select>
                    </div>

                    {/* --- Buttons (Unchanged) --- */}
                 <div className="md:col-span-2 lg:col-span-4 flex justify-end items-end gap-3">
                         <button onClick={() => handleSubmit(1)} disabled={isLoading || isDropdownLoading || isExporting} className="items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed">
                             {isLoading && !isExporting ? "Searching..." : 'Submit'}
                         </button>
                        <button onClick={handleClear} disabled={isLoading || isExporting} className="items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed">
                             Clear
                         </button>
                        <button onClick={handleExport} disabled={isExporting || isLoading || tableData.length === 0} className="flex justify-center items-center w-auto px-6 py-3 text-xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-blue-400 disabled:scale-100 disabled:cursor-not-allowed">
                             {isExporting ? <FileDown size={18}/> : <FileDown size={24} />}
                         </button>
                    </div>
                </div>
           </div> {/* End Filter Section */}

            {apiError && <div className="text-center p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{apiError}</div>}

            {hasAppliedOnce && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-green-100">

                    {/* --- Table --- */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-green-200">
                     <thead className="bg-green-50">
                                <tr>
                                    {['S.No', 'Trans. Id', 'Date', 'Receiver', 'Old Points', 'In', 'New Points', 'Sender', 'Comments'].map(header => (
                                        <th key={header} className="px-6 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">{header}</th>
                             ))}
                               </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr><td colSpan={9} className="text-center py-10 text-gray-500">Loading...</td></tr>

                           ) : tableData.length > 0 ? (
                                    <>
                                 {tableData.map((t, index) => (
                                            <tr key={t.TRANS_ID || index} className={index % 2 === 0 ? 'bg-white' : 'bg-green-50/50 hover:bg-green-100/50'}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.SNO}</td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatTransId(t.TRANS_ID)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(t.DATE)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{t.RECEIVER || '-'}</td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{(t.OLD_POINTS ?? 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{(t.IN ?? 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{(t.NEW_POINTS ?? 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{t.SENDER || <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">System</span>}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{t.COMMENTS || '-'}</td>
                                            </tr>
                                 ))}

                                        {/* --- *** UPDATED TOTAL ROW *** --- */}
                                        <tr className="bg-green-100 border-t-2 border-green-300">
                                             {/* Total Label - Spans S.No column, aligned left */}
                                           <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-800 text-left">
                                               Total:
                                            </td>
                                           {/* Empty cells to push value to the correct column (4 columns: Trans Id, Date, Receiver, Old Points) */}
                                            <td colSpan={4} className="px-6 py-4"></td>

                                     {/* In Total Value - Aligned under 'In' column */}
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-bold">
                                                {(totalIn || 0).toLocaleString()}
                                            </td>

                                         {/* Empty cells for remaining columns (3 columns: New Points, Sender, Comments) */}
                                         <td colSpan={3} className="px-6 py-4"></td>
                                        </tr>
                                        {/* --- *** END OF UPDATED ROW *** --- */}
                                    </>
                                ) : (
                                 <tr><td colSpan={9} className="text-center py-10 text-gray-500">No transactions found for the selected filters.</td></tr>
                                )}
                         </tbody>
                        </table>
                    </div>
                      {/* --- Pagination (Unchanged) --- */}
                    {paginationData && paginationData.totalRecords > 0 && paginationData.totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                             <p className="text-sm text-gray-700">Page {paginationData.currentPage} of {paginationData.totalPages} ({paginationData.totalRecords} records)</p>
                             <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                               <button onClick={handlePrevPage} disabled={paginationData.currentPage === 1 || isLoading} className="items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed">Previous</button>
                                 <button onClick={handleNextPage} disabled={paginationData.currentPage === paginationData.totalPages || isLoading} className="ml-3 items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed">Next</button>
                             </nav>
                         </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default InPointsReport;