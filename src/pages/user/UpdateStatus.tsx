import React, { useState, useEffect, useMemo, useRef } from 'react';
// --- NEW: (1) Search icon import kiya ---
import { XCircle, CheckCircle, Lock, Search } from 'lucide-react'; 
import UserService from '../../services/UserServices';
import { UserListItem } from '../../modals/User';

// --- Type Definitions (Frontend specific) ---
type UserRole = 'admin' | 'agent' | 'subagent';
type TargetUserType = 'agent' | 'subagent' | 'user';
// The action to be performed, maps to backend's lock/unlock
type UserAction = 'active' | 'deactivate';

// --- Main Component ---
function UpdateStatusPage() {
    // --- State Management ---
    const [loggedInUserRole, setLoggedInUserRole] = useState<UserRole | null>(null);
    const [selectedUserType, setSelectedUserType] = useState<TargetUserType>('agent');
    const [usersForDropdown, setUsersForDropdown] = useState<UserListItem[]>([]);

    // --- NEW: (2) Search filter ke liye state ---
    const [searchTerm, setSearchTerm] = useState<string>('');

    const [targetUserId, setTargetUserId] = useState<string>('');
    const [selectedAction, setSelectedAction] = useState<UserAction>('active');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    const prevSelectedUserTypeRef = useRef<TargetUserType>();

    // --- Effects ---

    // 1. Set the logged-in user's role (Unchanged)
    useEffect(() => {
        const roleFromStorage = localStorage.getItem('userRole');
        const normalizedRole = (roleFromStorage === 'sub-agent' ? 'subagent' : roleFromStorage) as UserRole;

        if (normalizedRole) {
            setLoggedInUserRole(normalizedRole);

            let initialType: TargetUserType = 'agent';
            if (normalizedRole === 'agent') initialType = 'subagent';
            if (normalizedRole === 'subagent') initialType = 'user';
            setSelectedUserType(initialType);

            prevSelectedUserTypeRef.current = initialType; 
        }
    }, []);

    // 2. Fetch users (Unchanged)
    useEffect(() => {
        if (!loggedInUserRole) return;

        const fetchData = async () => {
            setIsLoading(true);
            setUsersForDropdown([]); 
            setTargetUserId(''); 

            if (prevSelectedUserTypeRef.current !== selectedUserType) {
                setFeedback(null); 
            }

            const apiUserType = selectedUserType === 'subagent' ? 'sub-agent' : selectedUserType;
            const response = await UserService.listUser({ role: apiUserType, limit: 1000 });

            if (response.success && response.data) {
                const sortedUsers = response.data.users.sort((a, b) => {
                    const nameA = a.username?.toLowerCase() || '';
                    const nameB = b.username?.toLowerCase() || '';
                    return nameA.localeCompare(nameB);
                });
                setUsersForDropdown(sortedUsers);
                if (sortedUsers.length === 0 && prevSelectedUserTypeRef.current !== selectedUserType) {
                    setFeedback({ type: 'error', message: `No ${selectedUserType}s found.` });
                }
            } else {
                if (prevSelectedUserTypeRef.current !== selectedUserType) {
                    setFeedback({ type: 'error', message: response.message || `Failed to fetch ${selectedUserType} list.` });
                }
            }
            setIsLoading(false);
        };

        fetchData();
        prevSelectedUserTypeRef.current = selectedUserType;
    }, [loggedInUserRole, selectedUserType, refetchTrigger]);

    // 3. Auto-hide feedback messages (Unchanged)
    useEffect(() => {
        if (!feedback) return;
        const timeout = setTimeout(() => setFeedback(null), 3000);
        return () => clearTimeout(timeout);
    }, [feedback]);

    // --- Logic and Handlers ---

    const updatableUserTypes = useMemo<TargetUserType[]>(() => {
        if (loggedInUserRole === 'admin') return ['agent', 'subagent', 'user'];
        if (loggedInUserRole === 'agent') return ['subagent', 'user'];
        if (loggedInUserRole === 'subagent') return ['user'];
        return [];
    }, [loggedInUserRole]);

    // --- NEW: (3) Memoized list jo search ke hisaab se filter hogi ---
    const filteredUsers = useMemo(() => {
        if (!searchTerm) {
            return usersForDropdown; // Agar search khaali hai, toh poori list dikhao
        }
        return usersForDropdown.filter(user =>
            user.username?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [usersForDropdown, searchTerm]);


    // handleSubmit (Unchanged)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetUserId) {
            setFeedback({ type: 'error', message: 'Please select a user to update.' });
            return;
        }

        setIsSubmitting(true);
        setFeedback(null);

        const lockStatus: 'unlocked' | 'locked' = selectedAction === 'active' ? 'unlocked' : 'locked';
        const response = await UserService.updateLockStatus(targetUserId, lockStatus);

        if (response.success) {
            setFeedback({ type: 'success', message: response.data?.message || `User status updated successfully!` });
            setRefetchTrigger(c => c + 1); 
        } else {
            setFeedback({ type: 'error', message: response.message || 'Failed to update user status.' });
        }

        setIsSubmitting(false);
    };

    if (!loggedInUserRole) {
        return <div>Loading user data...</div>;
    }

    // --- JSX (RENDER) ---
    return (
        <div className="min-h-screen bg-gray-50 p-4 font-sans">
            <div className="max-w-3xl mx-auto">
                {/* Header (Unchanged) */}
                <div className="mt-8 bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8 border-2 border-green-200 text-center">
                    <h1 className="text-xl sm:text-3xl font-bold text-green-800 flex items-center justify-center gap-2">
                        <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                        Lock / Unlock User
                    </h1>
                    <p className="text-sm sm:text-lg text-green-600 mt-1">Select a user and choose an action to apply.</p>
                    <span className="mt-4 inline-block bg-green-100 text-green-800 text-xs sm:text-sm font-semibold px-3 py-1 rounded-full">
                        Logged in as: {loggedInUserRole.charAt(0).toUpperCase() + loggedInUserRole.slice(1)}
                    </span>
                </div>

                {/* Form Body */}
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-green-200">
                    {/* Feedback (Unchanged) */}
                    {feedback && (
                        <div className={`border px-4 py-3 rounded-xl relative mb-6 flex items-center shadow-md animate-fadeIn ${
                                feedback.type === 'success'
                                ? 'bg-green-100 border-green-400 text-green-800'
                                : 'bg-red-100 border-red-400 text-red-800'
                            }`}>
                            {feedback.type === 'success' ? <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-3"/> : <XCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-3"/>}
                            <span className="text-sm sm:text-base">{feedback.message}</span>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Role Selector (Unchanged) */}
                        {updatableUserTypes.length > 1 && (
                            <div>
                                <label htmlFor="userType" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">Select Role to Update</label>
                                <select
                                    id="userType"
                                    value={selectedUserType}
                                    onChange={(e) => {
                                        setSelectedUserType(e.target.value as TargetUserType);
                                        setTargetUserId('');
                                        // --- NEW: (4) Role badalne par search clear karo ---
                                        setSearchTerm(''); 
                                    }}
                                    className="w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                                >
                                    {updatableUserTypes.map(type => (
                                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* User Selector Block */}
                        <div>
                            <label htmlFor="targetUser" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">
                                {selectedUserType === 'agent' ? 'Select Agent' : selectedUserType === 'subagent' ? 'Select Sub-Agent' : 'Select User'}
                            </label>

                            {/* --- NEW: (5) Search Bar add kiya --- */}
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
                                onChange={(e) => {
                                    setTargetUserId(e.target.value);
                                    setFeedback(null); 
                                    const user = usersForDropdown.find(u => u._id === e.target.value);
                                    if (user) {
                                        setSelectedAction(user.status === 'active' ? 'deactivate' : 'active');
                                    }
                                }}
                                disabled={isLoading || usersForDropdown.length === 0}
                                className="w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition disabled:bg-gray-100"
                            >
                                <option value="">{isLoading ? 'Loading...' : `-- Select a ${selectedUserType} --`}</option>
                                
                                {/* --- NEW: (6) filteredUsers se map kiya --- */}
                                {filteredUsers.map(user => (
                                    <option key={user._id} value={user._id}>{user.username} (Current: {user.status})</option>
                                ))}
                            </select>

                            {/* --- NEW: Agar filter se koi result na mile toh message dikhao --- */}
                            {filteredUsers.length === 0 && usersForDropdown.length > 0 && (
                                <p className="text-gray-500 text-xs sm:text-sm mt-2">No users found matching "{searchTerm}".</p>
                            )}
                        </div>

                        {/* Action Selector (Unchanged) */}
                        <div>
                            <label htmlFor="newAction" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">Action</label>
                            <select
                                id="newAction"
                                value={selectedAction}
                                onChange={(e) => setSelectedAction(e.target.value as UserAction)}
                                className="w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                            >
                                <option value="active">Active (Unlock)</option>
                                <option value="deactivate">Deactivate (Lock)</option>
                            </select>
                        </div>

                        {/* Submit Button (Unchanged) */}
                        <div className="flex justify-center pt-4">
                            <button type="submit" disabled={isSubmitting || !targetUserId} className={`w-full sm:w-auto px-8 py-2.5 text-base sm:px-16 sm:py-3 sm:text-lg font-bold text-white rounded-xl transition-all duration-300 shadow-lg disabled:cursor-not-allowed disabled:bg-green-300 ${isSubmitting ? '!bg-green-600' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transform hover:scale-105'}`}>
                                {isSubmitting ? 'Updating...' : 'Update Status'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UpdateStatusPage;