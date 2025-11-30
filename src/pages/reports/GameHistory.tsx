import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import ReportService from '../../services/ReportsServices';
import UserService from '../../services/UserServices';
import { PaginationInfo, UserListItem } from '../../modals/User';
import RoundViewerModal from '../../model/RoundViewerModal';
import Strings from '../../utils/strings';
import { GameHistoryItem, GameHistoryParams, BetDetail, GameHistoryResponse } from '../../modals/reports';

const gameNames = ['All', 'Teen Patti', 'Andar Bahar', 'Roulette', 'Blackjack'];

// --- Helper functions ---
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

const sortUsers = (users: UserListItem[]): UserListItem[] => {
    return [...users].sort((a, b) => {
        const nameA = a.username?.toLowerCase() || '';
        const nameB = b.username?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
    });
};

// --- Sub-component BetDetailsRow ---
const BetDetailsRow = ({ bets }: { bets: BetDetail[] }) => (
    <div className="p-4 bg-green-50">
        <h4 className="font-bold text-md text-gray-800 mb-2">Individual Bets in this Round:</h4>
        <ul className="space-y-2">
            {bets.map(bet => (
                <li key={bet.betId} className="flex justify-between items-center text-sm p-2 bg-white rounded-lg shadow-sm border border-gray-200">
                    <span className="font-semibold text-gray-900">{bet.betType} {bet.selection && `(${bet.selection})`}</span>
                    <div className="flex items-center space-x-4">
                        <span>Stake: <span className="font-bold">{(bet.stake || 0).toLocaleString('en-IN')}</span></span>
                        <span>Payout: <span className={`font-bold ${bet.status === 'won' ? 'text-green-600' : 'text-gray-600'}`}>{(bet.payout || 0).toLocaleString('en-IN')}</span></span>
                        <span className={`px-2 py-1 text-xs rounded-full font-bold ${bet.status === 'won' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {bet.status.toUpperCase()}
                        </span>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

function GameHistory() {
    // --- State variables ---
    const [userIsAdmin, setUserIsAdmin] = useState(false);
    const [canViewRound, setCanViewRound] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null); // Store the user role for navigation
    const navigate = useNavigate();
    const [tableData, setTableData] = useState<GameHistoryItem[]>([]);
    const [paginationData, setPaginationData] = useState<PaginationInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true); 
    const [isExporting, setIsExporting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [hasAppliedOnce, setHasAppliedOnce] = useState(false);

    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [userDropdownOptions, setUserDropdownOptions] = useState<UserListItem[]>([]);
    const [isDropdownLoading, setIsDropdownLoading] = useState(true);
    const [grandTotals, setGrandTotals] = useState({ stake: 0, payout: 0 });

    // --- YAHAN SE REPLACE KAREIN ---

    const FILTER_STORAGE_KEY = 'gameHistoryFilters';

    // 2. Default filters ka function
    const getDefaultFilters = () => ({
        gameName: 'All',
        userId: '',
        handId: '',
        startDate: '',
        endDate: '',
        dateRange: 'today'
    });

    // --- YEH NAYA useEffect ADD KAREIN (DATA LOADING KE LIYE) ---
    useEffect(() => {
        console.log("MOUNT useEffect: Calling handleSubmit with filters:", filters);
        handleSubmit(1);
        
        if (sessionStorage.getItem('navigatedFromHistory')) {
            console.log("MOUNT useEffect: Clearing navigation flag.");
            sessionStorage.removeItem('navigatedFromHistory');
        }

    }, []);

    // 3. Initial filters load karne ka function
    const getInitialFilters = () => {
        const savedFilters = sessionStorage.getItem(FILTER_STORAGE_KEY);
        const navigationFlag = sessionStorage.getItem('navigatedFromHistory');

        if (navigationFlag === 'true' && savedFilters) {
        console.log("getInitialFilters: Loading SAVED filters");
            try {
                return JSON.parse(savedFilters);
            } catch (e) {
                return getDefaultFilters();
            }
        }
        console.log("getInitialFilters: Loading DEFAULT filters (Today)");
        return getDefaultFilters();
    };

    // 4. useState ko us function se initial value dein
    const [filters, setFilters] = useState(getInitialFilters);

    // --- Hooks ---
    useEffect(() => {
        const role = localStorage.getItem('userRole')?.toLowerCase();
        setUserRole(role || null); // Store the role
        setUserIsAdmin(role === 'admin');
        
        const allowedRoles: (string | undefined)[] = ['admin', 'agent', 'sub-agent', 'subagent'];
        setCanViewRound(allowedRoles.includes(role));
    }, []);

    useEffect(() => {
        const fetchDropdownUsers = async () => {
            setIsDropdownLoading(true);
            try {
                const roleFromStorage = localStorage.getItem('userRole');
                const rolesToFetch: ('agent' | 'sub-agent' | 'user')[] = [];
                if (roleFromStorage === 'admin') rolesToFetch.push('agent', 'sub-agent', 'user');
                else if (roleFromStorage === 'agent') rolesToFetch.push('sub-agent', 'user');
                else if (roleFromStorage === 'sub-agent' || roleFromStorage === 'subagent') rolesToFetch.push('user');

                if (rolesToFetch.length === 0 && roleFromStorage !== 'user') {
                    setIsDropdownLoading(false);
                    return;
                }

                if (rolesToFetch.length > 0) {
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

                    if (fetchError && combinedUsers.length === 0) {
                        setApiError("Could not load user list filter.");
                    } else if (fetchError) {
                        console.warn("Some user lists failed to load for dropdown.");
                    }
                    const uniqueUsers = Array.from(new Map(combinedUsers.map(user => [user._id, user])).values());
                    setUserDropdownOptions(sortUsers(uniqueUsers));
                }
            } catch (err) {
                console.error("Failed to load users for dropdown:", err);
                setApiError("An unexpected error occurred loading user filter.");
            } finally {
                setIsDropdownLoading(false);
            }
        };
        fetchDropdownUsers();
    }, []);

    useEffect(() => {
        handleSubmit(1); 
    }, []); 


    useEffect(() => {
        sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
    }, [filters]); // Yeh tab chalega jab filters badlenge

    // --- Handlers ---
    const handleSubmit = async (pageToFetch: number = 1) => {
        setIsLoading(true);
        setApiError(null);
        setExpandedRow(null);
        setHasAppliedOnce(true);

        console.log("SUBMITTING: Saving filters to storage:", filters);
        sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));

        const params = {
            userName: filters.userId || undefined,
            gameName: filters.gameName === 'All' ? undefined : filters.gameName,
            roundId: filters.handId || undefined,
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            dateFilter: filters.dateRange ? (filters.dateRange as any) : undefined,
            page: pageToFetch,
            limit: 20,
        } as unknown as GameHistoryParams;

        const response = await ReportService.getGameHistory(params); 
        
        if (response.success && response.data) {
            setTableData(response.data.history || []);
            setPaginationData(response.data.pagination);
            
            setGrandTotals({
                stake: response.data.grandTotalStake || 0,
                payout: response.data.grandTotalPayout || 0
            });
            
        } else {
            setApiError(response.message || 'Failed to fetch game history.');
            setTableData([]);
            setPaginationData(null);
            setGrandTotals({ stake: 0, payout: 0 }); 
        }
        setIsLoading(false);
    };

    const handleExport = async () => {
        setIsExporting(true);
        setApiError(null);
        try {
            const params = {
                userName: filters.userId || undefined,
                gameName: filters.gameName === 'All' ? undefined : filters.gameName,
                roundId: filters.handId || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                dateFilter: filters.dateRange ? (filters.dateRange as any) : undefined,
            } as unknown as GameHistoryParams;
            const fileBlob = await ReportService.exportGameHistory(params);
            downloadFile(fileBlob, 'Game_History_Report.xlsx');
        } catch (err) {
            console.error("Export failed:", err);
            setApiError('Failed to export data. Please try again.');
        } finally { setIsExporting(false); }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let newFilters = { ...filters, [name]: value };
        if (name === 'dateRange' && value) {
            newFilters.startDate = '';
            newFilters.endDate = '';
        } else if ((name === 'startDate' || name === 'endDate') && value) {
            newFilters.dateRange = '';
        }
        setFilters(newFilters);
    };

    const handleClear = () => {
        setFilters(getDefaultFilters());
        setTableData([]);
        setPaginationData(null);
        setApiError(null);
        setExpandedRow(null);
        setGrandTotals({ stake: 0, payout: 0 });
        setHasAppliedOnce(false);
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

    const handleViewGameUI = async (record: GameHistoryItem) => {
        const roundId = record.roundId;
        if (!roundId) {
            setApiError("Cannot view details: Round ID is missing.");
            return;
        }
        setIsModalLoading(true);
        try {
            const response = await ReportService.getRoundDetails(roundId);
            if (response.success && response.data && response.data.data) {
                
                // Determine the base path from the userRole state
                let basePath = '';
                switch(userRole) {
                    case 'admin':
                        basePath = Strings.AdminDashboard; // e.g., '/admin'
                        break;
                    case 'agent':
                        basePath = Strings.AgentDashboard; // e.g., '/agent'
                        break;
                    case 'sub-agent': // From ProtectedRoute
                    case 'subagent': // From NavigateToRoleDashboard
                        basePath = Strings.SubAgentDashboard; // e.g., '/subagent'
                        break;
                    default:
                        console.error("Cannot navigate to GameUI: Unknown user role.", userRole);
                        setApiError("Navigation failed: Invalid user role.");
                        setIsModalLoading(false);
                        return;
                }

                // Construct the final path
                const navigationPath = `${basePath}/${Strings.GameUI}`;

                sessionStorage.setItem('navigatedFromHistory', 'true');
                navigate(navigationPath, { 
                    state: { 
                        roundData: response.data.data, 
                        betList: record.bets || [],
                        tableLabel: record.label || 'GREEN',
                        beforePoints: record.beforePlayPoints,
                        afterPoints: record.afterPlayPoints
                    } 
                });
                
                console.log("round data is:", response.data.data);
                console.log("bet list are:", record.bets);
            } else {
                setApiError(response.message || "Could not load round details.");
            }
        } catch (error) {
            console.error("Error fetching round details:", error);
            setApiError("An error occurred while fetching round details.");
        } finally {
            setIsModalLoading(false);
        }
    };

    // --- Table headers ---
    const tableHeaders = useMemo(() => {
        const base = [
            'S.No', 
            'Username', 
            'Agent', 
            'Sub Distributor', 
            'TABLETYPE',
            'Winning #', 
            'BEFORE POINT', 
            'PLAY',
            'WIN',
            'AFTER POINT',
            'Timestamp', 
            'Bet Details'
        ];
        if (canViewRound) base.push('View Round');
        return base;
    }, [canViewRound]);

    const filterButtonClasses = "w-full h-10 px-4 text-sm font-bold text-white rounded-lg transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed";

    const formatPoints = (points: number | undefined) => {
        const num = points || 0;
        return num.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen font-sans">
            <h1 className="text-3xl font-bold text-green-800 mb-6">Game History</h1>

            {/* --- Filter section --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-green-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="gameName" className="block text-sm font-medium text-gray-600 mb-1">Game Name:</label>
                        <select id="gameName" name="gameName" value={filters.gameName} onChange={handleFilterChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                            {gameNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="userId" className="block text-sm font-medium text-gray-600 mb-1">User Name:</label>
                        <select
                            id="userId"
                            name="userId"
                            value={filters.userId}
                            onChange={handleFilterChange}
                            disabled={isDropdownLoading}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">{isDropdownLoading ? 'Loading Users...' : 'All Users'}</option>
                            {userDropdownOptions.map(user => (
                                <option key={user._id} value={user.username}>{user.username}</option>
                            ))}
                        </select>
                    </div>
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
                        <select id="dateRange" name="dateRange" value={filters.dateRange} onChange={handleFilterChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                            <option value="">Select</option>
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="this_week">This Week</option>
                            <option value="last_week">Last Week</option>
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                        </select>
                    </div>
                    <div className="flex items-end gap-3 lg:col-start-3">
                        <button onClick={() => handleSubmit(1)} disabled={isLoading || isDropdownLoading || isExporting} className={filterButtonClasses}>{isLoading ? 'Searching...' : 'Submit'}</button>

                        <button onClick={handleClear} disabled={isLoading || isExporting} className={`${filterButtonClasses} !bg-gray-400 hover:!bg-gray-500 active:!bg-gray-600 focus:ring-gray-300`}>Clear</button>

                        <button onClick={handleExport} disabled={isExporting || isLoading || tableData.length === 0} className={`${filterButtonClasses} !bg-blue-500 hover:!bg-blue-600 active:!bg-blue-700 focus:ring-blue-300 flex items-center justify-center`}>
                            {isExporting ? <FileDown size={18}/> : <FileDown size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            {apiError && <div className="text-red-600 bg-red-100 p-4 rounded-lg mb-6">{apiError}</div>}

            {/* --- Results Table Section --- */}
            {hasAppliedOnce && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-green-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-green-200">
                            <thead className="bg-green-50">
                                <tr>
                                    {tableHeaders.map(header => <th key={header} className="px-3 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">{header}</th>)}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr><td colSpan={tableHeaders.length} className="text-center py-10 text-gray-500">Loading data...</td></tr>
                                ) : tableData.length > 0 ? (
                                    <>
                                        {tableData.map((record, index) => {
                                            const isExpanded = expandedRow === record.roundId;
                                            
                                            return (
                                                <React.Fragment key={record.roundId}>
                                                    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-green-50/50 hover:bg-green-100/50'}>
                                                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{paginationData ? ((paginationData.currentPage - 1) * 20) + index + 1 : index + 1}</td>
                                                        <td className="px-3 py-4 text-sm text-gray-600 max-w-[120px] truncate" title={record.userName}>
                                                            {record.userName}
                                                        </td>
                                                        <td className="px-3 py-4 text-sm text-gray-600 max-w-[120px] truncate" title={record.agentName || 'N/A'}>
                                                            {record.agentName || 'N/A'}
                                                        </td>
                                                        <td className="px-3 py-4 text-sm text-gray-600 max-w-[120px] truncate" title={record.subAgentName || 'N/A'}>
                                                            {record.subAgentName || 'N/A'}
                                                        </td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-sm font-semibold">
                                                            {record.label && (
                                                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                                                    record.label === 'GREEN' 
                                                                        ? 'bg-green-100 text-green-800' 
                                                                        : 'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                    {record.label}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{record.winningNumber || '-'}</td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">{formatPoints(record.beforePlayPoints)}</td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">{(record.totalStake || 0).toLocaleString('en-IN')}</td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{formatPoints(record.totalPayout)}</td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">{formatPoints(record.afterPlayPoints)}</td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">{record.DATETIME}</td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                                                            <button
                                                                onClick={() => setExpandedRow(isExpanded ? null : record.roundId)}
                                                                disabled={!record.bets || record.bets.length === 0}
                                                                className="flex items-center gap-1 px-3 py-1 rounded-md shadow-md font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                                                            >
                                                                {(record.bets?.length || 0)} Bets {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                            </button>
                                                        </td>
                                                        {/* View Round Button (conditionally rendered) */}
                                                        {canViewRound && (
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                <button onClick={() => handleViewGameUI(record)} disabled={!record.roundId || isModalLoading} className="items-end w-full md:w-auto px-6 py-2 text-sm font-bold text-white rounded-lg transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-7M00 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-blue-300 disabled:scale-100 disabled:cursor-not-allowed">
                                                                    {isModalLoading ? 'View' : 'View'}
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                    {/* Expanded Bet Details Row */}
                                                    {isExpanded && record.bets && record.bets.length > 0 && (
                                                        <tr><td colSpan={tableHeaders.length} className="p-0"><BetDetailsRow bets={record.bets} /></td></tr>
                                                    )}
                                                </React.Fragment>
                                            )
                                        })}
                                        
                                        {/* Grand Total Row */}
                                        <tr className="bg-green-100 border-t-2 border-green-300">
                                            <td className="px-3 py-4 whitespace-nowrap text-sm font-bold ...">
                                                Grand Total:
                                            </td>
                                            <td colSpan={6} className="px-3 py-4"></td> 
                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">
                                                {grandTotals.stake.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-green-700 font-bold">
                                                {formatPoints(grandTotals.payout)}
                                            </td>
                                            <td colSpan={tableHeaders.length - 9} className="px-6 py-4"></td> 
                                        </tr>
                                    </>
                                ) : (
                                    <tr><td colSpan={tableHeaders.length} className="text-center py-10 text-gray-500">No data available for the selected filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                     {/* Pagination */}
                    {paginationData && paginationData.totalRecords > 0 && paginationData.totalPages > 1 && (
                        <div className="mt-6 flex w-full items-center justify-between">
                            <p className='text-sm text-gray-600'>Page {paginationData.currentPage} of {paginationData.totalPages} ({paginationData.totalRecords} records)</p>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button onClick={handlePrevPage} disabled={paginationData.currentPage === 1 || isLoading} className="items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed">Previous</button>
                                <button onClick={handleNextPage} disabled={paginationData.currentPage === paginationData.totalPages || isLoading} className="ml-3 items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed">Next</button>
                            </nav>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <RoundViewerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} data={modalData} isLoading={isModalLoading}/>
        </div>
    );
}

export default GameHistory;