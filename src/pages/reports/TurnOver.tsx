import React, { useState, useEffect, useRef, useMemo } from 'react'; // <-- useMemo Add kiya hai
import { FileDown, XCircle, CheckCircle, ChevronRight, Home } from 'lucide-react';
import ReportService from '../../services/ReportsServices';
import UserService from '../../services/UserServices';
import { TurnoverRecord, TurnoverSummary, LedgerParams, TurnoverResponse } from '../../modals/reports';
import { PaginationInfo, UserListItem } from '../../modals/User';

// Helper to download the file blob (Unchanged)
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

const getISODate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

// Helper function to get date N days ago (Unchanged)
const getDateNDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return getISODate(date);
};

// Helper to sort users alphabetically (Unchanged)
const sortUsers = (users: UserListItem[]): UserListItem[] => {
    return [...users].sort((a, b) => {
        const nameA = a.username?.toLowerCase() || '';
        const nameB = b.username?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
    });
};

// Define Breadcrumb type (Unchanged)
interface Breadcrumb {
    id: string;
    name: string;
    level: 'agent' | 'subagent';
}

// Define specific params type for API call (Unchanged)
type TurnoverApiParams = LedgerParams & {
    agentId?: string;
    subAgentId?: string;
    export?: boolean; 
};

// NAYA: Agent Role type definition
type UserRole = 'admin' | 'agent' | 'subagent' | 'user';


function TurnOver() {
    // --- States (Unchanged) ---
    const [tableData, setTableData] = useState<TurnoverRecord[]>([]);
    const [summary, setSummary] = useState<TurnoverSummary | null>(null);
    const [paginationData, setPaginationData] = useState<PaginationInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [filters, setFilters] = useState<LedgerParams>({
        username: '',
        startDate: getISODate(),
        endDate: getISODate(),   
        dateRange: 'today', 
    });

    // --- Dropdown States (Unchanged) ---
    const [userDropdownOptions, setUserDropdownOptions] = useState<UserListItem[]>([]);
    const [isDropdownLoading, setIsDropdownLoading] = useState(true);

    // --- Drill-Down States (Unchanged) ---
    const [drillDown, setDrillDown] = useState<{ agentId: string | null, subAgentId: string | null }>({
        agentId: null,
        subAgentId: null,
    });
    const [viewLevel, setViewLevel] = useState<'agent' | 'subagent' | 'user' | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

    // --- NAYA: State logged-in user ka role store karne ke liye ---
    const [loggedInUserRole, setLoggedInUserRole] = useState<UserRole | null>(null);

    // --- Ref to track initial mount (Unchanged) ---
    const isInitialMount = useRef(true); 

    const agentProfit = useMemo(() => {
        if (loggedInUserRole === 'agent' && viewLevel === 'subagent' && summary) {
            
            if (summary.totalProfit !== undefined && summary.totalProfit !== null) {
                return summary.totalProfit;
            }
        }
        return null;
    
    }, [loggedInUserRole, viewLevel, summary]);

    // --- Effect to fetch users for dropdown (Updated to store role) ---
    useEffect(() => {
        const fetchDropdownUsers = async () => {
            setIsDropdownLoading(true);
            try {
                const roleFromStorage = (localStorage.getItem('userRole') || 'user') as UserRole;
                
                // --- Role ko state mein save kiya ---
                setLoggedInUserRole(roleFromStorage);

                const rolesToFetch: ('agent' | 'sub-agent' | 'user')[] = [];
                if (roleFromStorage === 'admin') rolesToFetch.push('agent', 'sub-agent', 'user');
                else if (roleFromStorage === 'agent') rolesToFetch.push('sub-agent', 'user');
                else if (roleFromStorage === 'subagent') rolesToFetch.push('user');

                if (rolesToFetch.length === 0 && roleFromStorage !== 'user') {
                    setIsDropdownLoading(false);
                    return;
                }

                if(rolesToFetch.length > 0) {
                    const promises = rolesToFetch.map(role => UserService.listUser({ role, limit: 10000 }));
                    const results = await Promise.all(promises);

                    let combinedUsers: UserListItem[] = [];
                    let fetchError = false;
                    results.forEach(response => {
                        if (response.success && response.data) {
                            combinedUsers.push(...response.data.users);
                        } else {
                            console.error("Failed to fetch role for dropdown:", response.message);
                            fetchError = true;
                        }
                    });

                    if (fetchError && combinedUsers.length === 0 && apiError === null) { 
                        setApiError("Could not load user list filter.");
                    } else if (fetchError) {
                        console.warn("Some user lists failed to load for dropdown.");
                    }

                    const uniqueUsers = Array.from(new Map(combinedUsers.map(user => [user._id, user])).values());
                    setUserDropdownOptions(sortUsers(uniqueUsers));
                }
            } catch (err) {
                console.error("Failed to load users for dropdown:", err);
                 if (apiError === null) {
                    setApiError("An unexpected error occurred loading user filter.");
                 }
            } finally {
                setIsDropdownLoading(false);
            }
        };
        fetchDropdownUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Runs once on mount

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            let newFilters = { ...filters, [name]: value };

        if (name === 'dateRange' && value) {
            // LOGIC to calculate dates and put them in the state
            const now = new Date();
            now.setHours(0, 0, 0, 0); 

            let startDate = new Date(now);
            let endDate = new Date(now);

            switch (value) {
                case 'today':
                    break;
                case 'yesterday':
                    startDate.setDate(now.getDate() - 1);
                    endDate.setDate(now.getDate() - 1);
                    break;
                case 'this_week':
                    // Assuming week starts on Monday (Day 1)
                    const currentDay = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
                    const diffToMonday = (currentDay === 0) ? 6 : (currentDay - 1);
                    startDate.setDate(now.getDate() - diffToMonday);
                    
                    endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 6);
                    break;
                case 'last_week':
                    const thisMondayDay = now.getDate() - ((now.getDay() === 0) ? 6 : (now.getDay() - 1));
                    startDate.setDate(thisMondayDay - 7);
                    
                    endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 6);
                    break;
                case 'this_month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); 
                    break;
                case 'last_month':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    endDate = new Date(now.getFullYear(), now.getMonth(), 0); 
                    break;
                default:
                    newFilters.startDate = '';
                    newFilters.endDate = '';
                    setFilters(newFilters as LedgerParams); 
                    return;
            }
            
            // Use your new, correct getISODate helper
            newFilters.startDate = getISODate(startDate);
            newFilters.endDate = getISODate(endDate);

        } else if ((name === 'startDate' || name === 'endDate') && value) {
            newFilters.dateRange = undefined;
        }

        setFilters(newFilters as LedgerParams);
    };

    const handleClear = () => {
        setFilters({ username: '', startDate: '', endDate: '', dateRange: undefined }); 
        setTableData([]);
        setSummary(null);
        setPaginationData(null);
        setApiError(null);
        setDrillDown({ agentId: null, subAgentId: null });
        setViewLevel(null);
        setBreadcrumbs([]);
    };

    const handleSubmit = async (pageToFetch: number = 1) => {
        setIsLoading(true);
        setApiError(null); 
        const params: TurnoverApiParams = {
            username: viewLevel === 'user' ? filters.username || undefined : undefined,
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            dateRange: filters.dateRange ? (filters.dateRange as any) : undefined,
            page: pageToFetch,
            limit: 20,
            agentId: drillDown.agentId || undefined,
            subAgentId: drillDown.subAgentId || undefined,
            export: false 
        };
        try { 
            const response = await ReportService.getTurnover(params);
            if (response.success && response.data) {
                setTableData(response.data.report || []);
                setSummary(response.data.summary);
                setPaginationData(response.data.pagination);
                setViewLevel(response.data.viewLevel);
            } else {
                setApiError(response.message || 'Failed to fetch turnover report.');
                setTableData([]);
                setSummary(null);
                setPaginationData(null);
                setViewLevel(null); 
            }
        } catch (error) {
            console.error("API Error in handleSubmit:", error);
            setApiError("An unexpected error occurred while fetching the report.");
            setTableData([]);
            setSummary(null);
            setPaginationData(null);
            setViewLevel(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        setApiError(null);
        try {
            const paramsToExport: TurnoverApiParams = {
                 username: viewLevel === 'user' ? filters.username || undefined : undefined,
                 startDate: filters.startDate || undefined,
                 endDate: filters.endDate || undefined,
                 dateRange: filters.dateRange ? (filters.dateRange as any) : undefined,
                 agentId: drillDown.agentId || undefined,
                 subAgentId: drillDown.subAgentId || undefined,
                 export: true 
            };
            const fileBlob = await ReportService.exportTurnover(paramsToExport);
            downloadFile(fileBlob, 'Turnover_Report.xlsx');
        } catch (err) {
            console.error("Export failed:", err);
            setApiError('Failed to export data. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        handleSubmit(1);
       // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else {
            handleSubmit(1);
        }
       // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drillDown]); 

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

    const handleNameClick = (record: TurnoverRecord) => {
        if (viewLevel === 'agent') {
            setDrillDown({ agentId: record.id, subAgentId: null });
            setBreadcrumbs([{ id: record.id, name: record.name, level: 'agent' }]);
            setFilters(f => ({ ...f, username: '' })); 
        } else if (viewLevel === 'subagent') {
            setDrillDown(prev => ({ ...prev, subAgentId: record.id }));
            setBreadcrumbs(prev => [...prev, { id: record.id, name: record.name, level: 'subagent' }]);
             setFilters(f => ({ ...f, username: '' })); 
        }
    };

    const handleBreadcrumbClick = (index: number) => {
        let newAgentId: string | null = null;
        let newSubAgentId: string | null = null;
        let newBreadcrumbs: Breadcrumb[] = [];
        if (index !== -1) { 
            newAgentId = breadcrumbs[0]?.id || null; 
             if (index === 0 && breadcrumbs[0]?.level === 'agent') { 
                newBreadcrumbs = breadcrumbs.slice(0, 1);
            }
        }
        setDrillDown({ agentId: newAgentId, subAgentId: newSubAgentId });
        setBreadcrumbs(newBreadcrumbs);
        setFilters(f => ({ ...f, username: '' })); 
    };

    // --- Baaki ka poora JSX neeche ---
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full font-sans">
            <h1 className="text-3xl font-bold text-green-800 mb-6">Turn Over Report</h1>

            {/* --- Filter Section (Unchanged) --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                    {/* --- Username Dropdown (Unchanged) --- */}
                    <div className="lg:col-span-1">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-600 mb-1">
                            Username: {viewLevel !== 'user' && viewLevel !== null && <span className="text-xs text-gray-400">(Filter at User level)</span>}
                        </label>
                        <select
                            id="username"
                            name="username"
                            value={filters.username}
                            onChange={handleFilterChange}
                            disabled={isDropdownLoading || viewLevel !== 'user'}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">{isDropdownLoading ? 'Loading Users...' : 'All Users'}</option>
                            {userDropdownOptions.map(user => (
                                <option key={user._id} value={user.username}>{user.username}</option>
                            ))}
                        </select>
                    </div>

                    {/* --- Date Filters (Unchanged) --- */}
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-600 mb-1">Start Date:</label>
                        <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-600 mb-1">End Date:</label>
                        <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="dateRange" className="block text-sm font-medium text-gray-600 mb-1">Date Range:</label>
                        <select id="dateRange" name="dateRange" value={filters.dateRange ?? ''} onChange={handleFilterChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
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
                        <button onClick={() => handleSubmit(1)} disabled={isLoading || isDropdownLoading || isExporting} className="items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? 'Submit' : 'Submit'}
                        </button>
                        <button onClick={handleClear} disabled={isLoading || isExporting} className="items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed">
                             Clear
                        </button>
                        <button onClick={handleExport} disabled={isExporting || isLoading || tableData.length === 0} className="flex justify-center items-center w-auto px-6 py-3 text-xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-blue-400 disabled:scale-100 disabled:cursor-not-allowed">
                             {isExporting ? <FileDown size={18}/> : <FileDown size={24} />}
                         </button>
                    </div>
                </div>
            </div> 

            {/* --- API Error Display (Unchanged) --- */}
            {apiError && <div className="text-red-500 bg-red-100 p-3 rounded-lg mb-6">{apiError}</div>}

            {/* --- (2) NAYA: Summary Display (AGENT PROFIT KE SAATH) --- */}
            <div className="bg-white p-4 rounded-xl shadow-lg mb-8 border border-gray-200 flex flex-wrap gap-x-6 gap-y-2 justify-around text-center">
                 <p className="text-sm text-gray-600"><strong>Start Date:</strong> <span className="font-bold text-gray-800">{filters.startDate || getISODate(new Date(0)) }</span></p>
                 <p className="text-sm text-gray-600"><strong>End Date:</strong> <span className="font-bold text-gray-800">{filters.endDate || getISODate() }</span></p>
                 <p className="text-sm text-gray-600"><strong>Total Play Points:</strong> <span className="font-bold text-gray-800">{(summary?.totalPlayPoints || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></p>
                 <p className="text-sm text-gray-600"><strong>Total Won Points:</strong> <span className="font-bold text-gray-800">{(summary?.totalWonPoints || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></p>
                 <p className="text-sm text-gray-600"><strong>Total End Points:</strong> <span className="font-bold text-gray-800">{(summary?.totalEndPoints || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></p>
                 <p className="text-sm text-gray-600"><strong>Total Margin:</strong> <span className="font-bold text-gray-800">{(summary?.totalMargin || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></p>
                 <p className="text-sm text-gray-600"><strong>Total Net:</strong> <span className="font-bold text-gray-800">{(summary?.totalNet || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></p>
            
                {/* --- YEH NAYA CODE ADD KIYA GAYA HAI --- */}
                {/* Yeh 'agentProfit' useMemo se aa raha hai */}
                {agentProfit !== null && (
                    <p className="text-sm text-gray-600">
                        <strong>Agent Profit:</strong> 
                        <span className="font-bold text-gray-800 ml-1">
                            {(agentProfit).toLocaleString('en-US', {minimumFractionDigits: 2})}
                        </span>
                    </p>
                )}
                {/* --- END NAYA CODE --- */}
            </div>

            {/* --- Breadcrumbs Navigation (Unchanged) --- */}
            <nav className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-4">
                <button
                    onClick={() => handleBreadcrumbClick(-1)}
                    className="items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed"
                     disabled={isLoading || isExporting}
                >
                    Home
                </button>
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id}>
                        <ChevronRight size={16} />
                        <button
                            onClick={() => handleBreadcrumbClick(index)}
                            className={`items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed ${index === breadcrumbs.length - 1 ? 'text-green-800 font-bold cursor-default' : 'cursor-pointer'}`}
                            disabled={index === breadcrumbs.length - 1 || isLoading || isExporting}
                        >
                            {crumb.name}
                        </button>
                    </React.Fragment>
                ))}
            </nav>

            {/* --- Results Table (Unchanged) --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                {['Name', 'Play Points', 'Won Points', 'End Points', 'Margin', 'Net', 'Last Play'].map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-10 text-gray-500">Loading...</td></tr>
                            ) : tableData.length > 0 ? (
                                <>
                                    {tableData.map((record, index) => (
                                        <tr key={record.id || index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {viewLevel === 'user' ? (
                                                    <span>{record.name}</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleNameClick(record)}
                                                        className="items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed"
                                                        disabled={isLoading || isExporting} 
                                                 >
                                                        {record.name}
                                                    </button>
                                                )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.playPoints.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.wonPoints.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                       <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${record.endPoints >= 0 ? 'text-green-600' : 'text-red-500'}`}>{record.endPoints.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.margin.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">{record.net.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.createdAt}</td>
                                    </tr>
                                    ))}

                                    {/* --- Total Row (Unchanged) --- */}
                                    {summary && (
                                        <tr className="bg-green-100 border-t-2 border-green-300">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-800 text-left">
                                                Grand Total:
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                                           {(summary.totalPlayPoints || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                                                {(summary.totalWonPoints || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                            </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                                                {(summary.totalEndPoints || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                            </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                                         {(summary.totalMargin || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                            </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                                                {(summary.totalNet || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                            </td>
                                           <td className="px-6 py-4"></td> 
                               </tr>
                                    )}
                                 
                                </>
                     ) : (
                               <tr><td colSpan={7} className="text-center py-10 text-gray-500">No turnover data found for the selected filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* --- Pagination (Unchanged) --- */}
                {paginationData && paginationData.totalRecords > 0 && paginationData.totalPages > 1 && (
                     <div className="mt-6 flex items-center justify-between">
                         <p className="text-sm text-gray-700">Page {paginationData.currentPage} of {paginationData.totalPages} ({paginationData.totalRecords} records)</p>
                         <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                           <button onClick={handlePrevPage} disabled={paginationData.currentPage === 1 || isLoading || isExporting} className="items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed">Previous</button>
                             <button onClick={handleNextPage} disabled={paginationData.currentPage === paginationData.totalPages || isLoading || isExporting} className="ml-3 items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed">Next</button>
                         </nav>
                     </div>
                )}
            </div>
        </div>
    );
}

export default TurnOver;