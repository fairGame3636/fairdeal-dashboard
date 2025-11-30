import React, { useState, useEffect, useMemo } from 'react';
import UserService from '../../services/UserServices';
import { UserListItem, PaginationInfo } from '../../modals/User';

type UserRole = 'admin' | 'agent' | 'subagent';
type SelectedType = 'agent' | 'subagent' | 'user';

function ListUserPage() {
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [pendingSelectedType, setPendingSelectedType] = useState<SelectedType>('agent');
    const [appliedSelectedType, setAppliedSelectedType] = useState<SelectedType>('agent');
    const [hasAppliedOnce, setHasAppliedOnce] = useState(false);
    const [tableData, setTableData] = useState<UserListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    
    const [paginationData, setPaginationData] = useState<PaginationInfo | null>(null);

    const dropdownOptions = useMemo((): SelectedType[] => {
        if (userRole === 'admin') return ['agent', 'subagent', 'user'];
        if (userRole === 'agent') return ['subagent', 'user'];
        return [];
    }, [userRole]);

    useEffect(() => {
        const roleFromStorage = localStorage.getItem('userRole');
        const normalizedRole: UserRole = roleFromStorage === 'sub-agent' ? 'subagent' : (roleFromStorage as UserRole);

        if (normalizedRole) {
            setUserRole(normalizedRole);
            let initialType: SelectedType = 'agent';
            if (normalizedRole === 'agent') initialType = 'subagent';
            if (normalizedRole === 'subagent') initialType = 'user';
            
            setPendingSelectedType(initialType);
            if (normalizedRole === 'subagent') {
                handleShow(initialType, 1); // Auto-fetch for subagent
            }
        }
    }, []);

    const handleShow = async (typeOverride?: SelectedType, page: number = 1) => {
        const typeToFetch = typeOverride || pendingSelectedType;
        setIsLoading(true);
        setApiError(null);
        setTableData([]);
        setPaginationData(null);

        const apiType = typeToFetch === 'subagent' ? 'sub-agent' : typeToFetch;
        
        // --- NOTE: API response mein agentName, subagentName, aur commission hona chahiye ---
        const response = await UserService.listUser({ role: apiType, page, limit: 20 });

        if (response.success && response.data) {
            console.log(response.data);
            const sortedUsers = response.data.users.sort((a, b) => {
                const nameA = a.username?.toLowerCase() || '';
                const nameB = b.username?.toLowerCase() || '';
                return nameA.localeCompare(nameB);
            });
            setTableData(sortedUsers); 
            setPaginationData(response.data.pagination);
        } else {
            setApiError(response.message || 'Failed to fetch user data.');
        }

        setIsLoading(false);
        setAppliedSelectedType(typeToFetch);
        setHasAppliedOnce(true);
    };

    const handleNextPage = () => {
        if (paginationData?.hasNextPage && paginationData.currentPage) {
            handleShow(appliedSelectedType, paginationData.currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (paginationData?.hasPrevPage && paginationData.currentPage) {
            handleShow(appliedSelectedType, paginationData.currentPage - 1);
        }
    };

    // --- (1) MODIFIED: tableHeaders mein 'Commission (%)' add kiya ---
    const tableHeaders = useMemo(() => {
        let headers = ['S.No', 'Username'];

        if (appliedSelectedType === 'agent') {
            headers.push('Commission (%)'); // <-- ADDED
        } 
        else if (appliedSelectedType === 'subagent') {
            headers.push('Parent Agent');
            headers.push('Commission (%)'); // <-- ADDED
        } 
        else if (appliedSelectedType === 'user') {
            headers.push('Parent Agent');
            headers.push('Parent Subagent');
            // User ke liye commission nahi
        }

        // Suffix columns (points and status)
        headers.push('Points', 'Status');
        return headers;
    }, [appliedSelectedType]); // Dependency array unchanged

    // --- (2) MODIFIED: renderTableRow mein commissionCell add kiya ---
    const renderTableRow = (item: UserListItem, index: number) => {
        const statusText = item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase() : 'N/A';
        const isStatusActive = statusText === 'Active';

        // Base cells (always present)
        const snoCell = (
            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {paginationData ? ((paginationData.currentPage - 1) * 20) + index + 1 : index + 1}
            </td>
        );
        const usernameCell = (
            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.username ?? 'N/A'}</td>
        );
        const pointsCell = (
            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">{item.points?.toLocaleString() ?? '0'}</td>
        );
        const statusCell = (
            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isStatusActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {statusText}
                </span>
            </td>
        );
        
        // Helper for parent cells
        const parentCell = (name: string | undefined) => (
            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{name ?? 'N/A'}</td>
        );

        // --- NEW: Commission cell definition ---
        const commissionCell = (
             <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                {item.commission ?? 0}%
            </td>
        );

        // Dynamically build the row
        let cells: JSX.Element[] = [];
        cells.push(snoCell, usernameCell);

        // Add parent columns based on the *exact same logic* as tableHeaders
        if (appliedSelectedType === 'agent') {
            cells.push(commissionCell); // <-- ADDED
        } 
        else if (appliedSelectedType === 'subagent') {
            cells.push(parentCell(item.agentName)); // Parent Agent
            cells.push(commissionCell); // <-- ADDED
        } 
        else if (appliedSelectedType === 'user') {
            cells.push(parentCell(item.agentName)); // Parent Agent
            cells.push(parentCell(item.subagentName)); // Parent Subagent
        }
        
        cells.push(pointsCell, statusCell);

        return (
            <tr key={item._id} className={index % 2 === 0 ? 'bg-white' : 'bg-green-50/50'}>
                {/* React.cloneElement se har cell ko unique key milti hai */}
                {cells.map((cell, i) => React.cloneElement(cell, { key: i }))}
            </tr>
        );
    };

    if (!userRole) {
        return <div>Loading...</div>
    }

    return (
        // --- (JSX is unchanged) ---
        <div className="p-4 bg-gray-50 min-h-full font-sans">
            <h1 className="text-xl sm:text-3xl font-bold text-green-800 mb-4 sm:mb-6">User List</h1>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-8 border border-green-100">
                {userRole !== 'subagent' ? (
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <select
                                id="userTypeSelect"
                                value={pendingSelectedType}
                                onChange={e => setPendingSelectedType(e.target.value as SelectedType)}
                                className="px-3 py-2.5 text-sm sm:px-4 sm:py-3 sm:text-base border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full md:w-96"
                            >
                                {dropdownOptions.map(type => (
                                    <option key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => handleShow(undefined, 1)}
                                disabled={isLoading}
                                className="px-6 py-2.5 text-base sm:px-8 sm:py-3 sm:text-lg font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50"
                                style={{ minWidth: '100px' }}
                            >
                                {isLoading ? 'Showing...' : 'Show'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-base sm:text-lg text-gray-700">Displaying all users under your account.</p>
                )}
            </div>
            {apiError && <div className="text-red-600 bg-red-100 p-4 rounded-lg mb-6">{apiError}</div>}
            
            {hasAppliedOnce && (
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-green-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-green-200">
                            <thead className="bg-green-50">
                                <tr>
                                    {tableHeaders.map(header => (
                                        <th key={header} className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr><td colSpan={tableHeaders.length} className="text-center py-10 text-gray-500">Loading data...</td></tr>
                                ) : tableData.length > 0 ? (
                                    tableData.map((item, index) => renderTableRow(item, index))
                                ) : (
                                    <tr><td colSpan={tableHeaders.length} className="text-center py-10 text-gray-500">No users found for the selected type.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {paginationData && paginationData.totalRecords > 0 && (
                        <div className="mt-6 flex flex-col sm:flex-row w-full items-center justify-between gap-4">
                            <p className='text-sm text-gray-600'>
                                Page {paginationData.currentPage} of {paginationData.totalPages} ({paginationData.totalRecords} records)
                            </p>
                            <nav className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={!paginationData.hasPrevPage || isLoading}
                                    className="items-end w-full sm:w-auto px-6 py-2.5 text-base md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={!paginationData.hasNextPage || isLoading}
                                    className="items-end w-full sm:w-auto px-6 py-2.5 text-base md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ListUserPage;

