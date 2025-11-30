import React, { useState, useEffect, useMemo } from 'react';
// --- NEW: (1) Search icon import kiya ---
import { Percent, UserCheck, Search } from 'lucide-react';
import UserService from '../../services/UserServices';
import { UserListItem } from '../../modals/User';

// --- Type Definitions ---
type UserRole = 'admin' | 'agent' | 'subagent';
type TargetUserType = 'agent' | 'subagent';

function UpdateCommissionPage() {
    // --- State Management ---
    const [loggedInUserRole, setLoggedInUserRole] = useState<UserRole | null>(null);
    const [selectedUserType, setSelectedUserType] = useState<TargetUserType>('agent');
    const [usersForDropdown, setUsersForDropdown] = useState<UserListItem[]>([]);

    // --- Search filter ke liye state ---
    const [searchTerm, setSearchTerm] = useState<string>('');

    const [targetUserId, setTargetUserId] = useState<string>('');
    const [newCommission, setNewCommission] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // --- Effects ---

    // 1. Get the logged-in user's role
    useEffect(() => {
        const roleFromStorage = localStorage.getItem('userRole');
        const normalizedRole = roleFromStorage === 'sub-agent' ? 'subagent' : roleFromStorage as UserRole;
        if (normalizedRole) {
            setLoggedInUserRole(normalizedRole);
            if (normalizedRole === 'agent') {
                setSelectedUserType('subagent');
            }
        }
    }, []);

    // 2. Fetch the list of users based on role and selection
    useEffect(() => {
        if (!loggedInUserRole) return;

        const fetchData = async () => {
            setIsLoading(true);
            setUsersForDropdown([]);
            setTargetUserId('');
            setFeedback(null);
            
            const roleForApi = selectedUserType === 'subagent' ? 'sub-agent' : selectedUserType;
            // Bahut saare users ho sakte hain, limit badha di
            const response = await UserService.listUser({ role: roleForApi, limit: 10000 }); 
            
            if (response.success && response.data) {
                const allUsers = response.data.users || [];

                const sortedUsers = allUsers.sort((a, b) => {
                    const nameA = a.username?.toLowerCase() || '';
                    const nameB = b.username?.toLowerCase() || '';
                    return nameA.localeCompare(nameB);
                });

                setUsersForDropdown(sortedUsers); 

                if (sortedUsers.length === 0) {
                    setFeedback({ type: 'error', message: `No users found for the selected role.` });
                }
            } else {
                setFeedback({ type: 'error', message: response.message || `Failed to fetch ${selectedUserType} list.` });
            }
            setIsLoading(false);
        };

        fetchData();
    }, [loggedInUserRole, selectedUserType]);

    // 3. Auto-hide feedback messages
    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    // --- Memoized list jo search ke hisaab se filter hogi ---
    const filteredUsers = useMemo(() => {
        if (!searchTerm) {
            return usersForDropdown; // Agar search khaali hai, toh poori list dikhao
        }
        return usersForDropdown.filter(user =>
            user.username?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [usersForDropdown, searchTerm]);

    // --- Logic and Handlers ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const commissionValue = parseFloat(newCommission);

        // Validation 1: User select kiya hai?
        if (!targetUserId) {
            setFeedback({ type: 'error', message: 'Please select a user to update.' });
            return;
        }
        // Validation 2: Valid positive number hai?
        if (isNaN(commissionValue) || commissionValue < 0) {
            setFeedback({ type: 'error', message: 'Please enter a valid, non-negative commission.' });
            return;
        }

        // --- NEW VALIDATION (MAX 2.5) ---
        if (commissionValue > 2.5) {
            setFeedback({ type: 'error', message: 'Commission cannot be more than 2.5%.' });
            return;
        }
        // --- END OF NEW VALIDATION ---

        setIsSubmitting(true);
        setFeedback(null);
        
        try {
            const response = await UserService.updateCommission({
                target_id: targetUserId,
                commission: commissionValue,
            });

            if (response.success && response.data) {
                setFeedback({ type: 'success', message: response.data.message || 'Commission updated successfully!' });
                const updatedUsers = usersForDropdown.map(user => 
                    user._id === targetUserId ? { ...user, commission: commissionValue } : user
                );
                // Re-sort the list after update
                const reSortedUsers = updatedUsers.sort((a, b) => {
                    const nameA = a.username?.toLowerCase() || '';
                    const nameB = b.username?.toLowerCase() || '';
                    return nameA.localeCompare(nameB);
                });
                setUsersForDropdown(reSortedUsers);
                setNewCommission('');
            } else {
                throw new Error(response.message || 'An unknown error occurred.');
            }
        } catch (error: any) {
            setFeedback({ type: 'error', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!loggedInUserRole) {
        return <div className="p-8 text-center">Loading user data...</div>;
    }

    // --- JSX / Rendering (UPDATED) ---
    return (
        <div className="p-4 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-2xl mx-auto mt-9">
                {/* Header (Unchanged) */}
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8 border-2 border-green-200 text-center">
                    <h1 className="text-xl sm:text-3xl font-bold text-green-800 flex items-center justify-center gap-2">
                        <UserCheck className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                        Update Commission
                    </h1>
                    <p className="text-sm sm:text-lg text-green-600 mt-1">Select a user and set their new commission rate.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-green-200">
                    {/* Feedback (Unchanged) */}
                    {feedback && (
                        <div className={`border px-4 py-3 rounded-xl relative mb-6 text-center shadow-sm ${
                            feedback.type === 'success' 
                            ? 'bg-green-100 border-green-400 text-green-800' 
                            : 'bg-red-100 border-red-400 text-red-800'
                        }`}>
                            {feedback.message}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {loggedInUserRole === 'admin' && (
                            <div>
                                <label htmlFor="userType" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">Select Role to Update</label>
                                <select 
                                    id="userType" 
                                    value={selectedUserType} 
                                    onChange={(e) => {
                                        setSelectedUserType(e.target.value as TargetUserType);
                                        setSearchTerm(''); // Reset search
                                    }}
                                    className="w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition bg-white"
                                >
                                    <option value="agent">Agent</option>
                                    <option value="subagent">Sub-agent</option>
                                </select>
                            </div>
                        )}

                        {/* User Selection */}
                        <div>
                            <label htmlFor="targetUser" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">
                                { selectedUserType === 'subagent' ? 'Select Sub-agent' : 'Select Agent' }
                            </label>

                            {/* --- Search Bar --- */}
                            <div className="relative mb-4">
                                <input
                                    type="text"
                                    placeholder="Type to search for a user..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    disabled={isLoading || usersForDropdown.length === 0}
                                    className="w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition pl-10 disabled:bg-gray-100" // Icon ke liye padding
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            </div>
                            {/* --- End Search Bar --- */}

                            <select 
                                id="targetUser" 
                                value={targetUserId}
                                onChange={(e) => setTargetUserId(e.target.value)}
                                disabled={isLoading || usersForDropdown.length === 0}
                                className="w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition disabled:bg-gray-100 bg-white"
                            >
                                <option value="">
                                    {isLoading 
                                        ? 'Loading users...' 
                                        : `-- Select a ${selectedUserType === 'subagent' ? 'Sub-agent' : 'Agent'} --`
                                    }
                                </option>
                                {/* --- Ab yahan filteredUsers se map hoga --- */}
                                {filteredUsers.map(user => (
                                    <option key={user._id} value={user._id}>
                                        {user.username} (Current: {user.commission ?? 0}%) 
                                    </option>
                                ))}
                            </select>

                            {/* --- Filter message --- */}
                            {filteredUsers.length === 0 && usersForDropdown.length > 0 && (
                                <p className="text-gray-500 text-xs sm:text-sm mt-2">No users found matching "{searchTerm}".</p>
                            )}
                        </div>
                        
                        {/* New Commission input (Unchanged) */}
                        <div>
                            <label htmlFor="newCommission" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">New Commission (%)</label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input 
                                    type="number" 
                                    id="newCommission" 
                                    value={newCommission} 
                                    onChange={(e) => setNewCommission(e.target.value)}
                                    placeholder="e.g., 2.5"
                                    step="0.01"
                                    min="0"
                                    max="2.5" // HTML validation bhi add kar di
                                    disabled={!targetUserId}
                                    className="w-full pl-10 sm:pl-12 pr-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition disabled:bg-gray-100"
                                />
                            </div>
                        </div>
                        
                        {/* Submit Button (Unchanged) */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !targetUserId}
                            className="w-full items-end md:w-auto px-6 py-2.5 text-base sm:px-8 sm:py-3 sm:text-lg md:px-24 md:py-4 md:text-xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Updating...' : 'Update Commission'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UpdateCommissionPage;
