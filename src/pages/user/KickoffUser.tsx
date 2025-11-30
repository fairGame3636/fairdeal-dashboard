import React, { useState, useEffect, useMemo, useCallback } from 'react';
import UserService from '../../services/UserServices';
import { UserListItem, PaginationInfo } from '../../modals/User'; 
import { ChevronLeft, ChevronRight } from 'lucide-react';

// --- Reusable Confirmation Modal (Koi Change Nahi) ---
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    userName: string;
    isSubmitting: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, userName, isSubmitting }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md text-center p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-2">Confirm Kickoff</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                    Are you sure you want to kick off the user <strong className="text-green-600">{userName}</strong>?
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={onClose} disabled={isSubmitting} className="items-end w-full md:w-auto px-6 py-2.5 text-base sm:text-lg md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={isSubmitting} className="items-end w-full md:w-auto px-6 py-2.5 text-base sm:text-lg md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Kicking off...' : 'Yes, Kick Off'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component (Polling Logic + Feedback Timer ke saath) ---
function KickoffUser() {
    const [allPlayingUsers, setAllPlayingUsers] = useState<UserListItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [userToKick, setUserToKick] = useState<UserListItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const FRONTEND_PAGE_SIZE = 10;

    // Data fetching function (List ko 'REPLACE' karega)
    const fetchUsers = useCallback(async (isPolling = false) => {
        if (!isPolling) {
            setIsLoading(true);
        }
        setApiError(null);

        try {
            const response = await UserService.listActivePlayingUsers({
                page: 1,
                limit: 1000, // Saare users ek saath
            });

            if (response.success && response.data) {
                setAllPlayingUsers(response.data.users);
            } else {
                setApiError(response.message || "Failed to fetch users.");
            }
        } catch (error) {
            if (!isPolling) {
                setApiError("An unexpected error occurred.");
            }
            console.error(error);
        } finally {
            if (!isPolling) {
                setIsLoading(false);
            }
        }
    }, []);

    // 1. Initial Load: Component load hone par ek baar data fetch karo
    useEffect(() => {
        fetchUsers(false); // false = Spinner dikhao
    }, [fetchUsers]);

    // 2. Polling: Har 5 second mein data ko background mein refresh karo
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchUsers(true); // true = Spinner mat dikhao
        }, 5000); // 5000ms = 5 seconds

        return () => clearInterval(intervalId);
    }, [fetchUsers]);

    // --- NAYA (Feedback Timer) ---
    // 3. Feedback: Message ko 2 second baad hata do
    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => {
                setFeedback(null);
            }, 2000); // 2000ms = 2 seconds

            // Cleanup
            return () => clearTimeout(timer);
        }
    }, [feedback]); // Jab bhi 'feedback' state badlega, yeh chalega
    // --- END NAYA ---

    // Kickoff confirmation logic (Koi Change Nahi)
    const handleConfirmKickoff = async () => {
        if (!userToKick) return;
        setIsSubmitting(true);
        
        const response = await UserService.kickoffUser(userToKick._id);

        if (response.success) {
            setFeedback({ type: 'success', message: response.data?.message || `User ${userToKick.username} has been kicked off.` });
            setAllPlayingUsers(prev => prev.filter(u => u._id !== userToKick._id));
        } else {
            setFeedback({ type: 'error', message: response.message || 'Failed to kick off user.' });
        }
        
        setIsSubmitting(false);
        setUserToKick(null);
    };
    
    // Memoized frontend pagination (Koi Change Nahi)
    const totalPlayingUsers = allPlayingUsers.length;
    
    const paginatedAndFilteredUsers = useMemo(() => {
        const searchedUsers = searchTerm
            ? allPlayingUsers.filter(user => user.username?.toLowerCase().includes(searchTerm.toLowerCase()))
            : allPlayingUsers;
        
        const startIndex = (currentPage - 1) * FRONTEND_PAGE_SIZE;
        return searchedUsers.slice(startIndex, startIndex + FRONTEND_PAGE_SIZE);
    }, [allPlayingUsers, currentPage, searchTerm]);

    // Recalculate total pages (Koi Change Nahi)
    const totalFrontendPages = useMemo(() => {
        const searchedUsersCount = searchTerm
            ? allPlayingUsers.filter(user => user.username?.toLowerCase().includes(searchTerm.toLowerCase())).length
            : totalPlayingUsers;
        return Math.ceil(searchedUsersCount / FRONTEND_PAGE_SIZE);
    }, [allPlayingUsers, searchTerm, totalPlayingUsers]);

    const totalPoints = useMemo(() => {
        return paginatedAndFilteredUsers.reduce((sum, user) => sum + (user.points || 0), 0);
    }, [paginatedAndFilteredUsers]);
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Intl.DateTimeFormat('en-IN', {
                year: 'numeric', month: 'short', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hour12: true
            }).format(new Date(dateString));
        } catch (e) {
            return 'Invalid Date';
        }
    };

    // --- Baaki ka poora JSX (HTML part) jaisa tha waisa hi hai ---
    return (
        <>
            <ConfirmationModal
                isOpen={!!userToKick}
                onClose={() => setUserToKick(null)}
                onConfirm={handleConfirmKickoff}
                userName={userToKick?.username || ''}
                isSubmitting={isSubmitting}
            />
            
            <div className={`p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full font-sans transition-all duration-300 ${userToKick ? 'blur-sm' : ''}`}>
                <h1 className="text-xl sm:text-3xl font-bold text-green-800 mb-4 sm:mb-6">View Online Users</h1>

                <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg mb-8 border border-green-100 max-w-3xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-end gap-4">
                        <div className="w-full">
                            <label htmlFor="userName" className="block text-sm font-medium text-gray-600 mb-1">User Name</label>
                            <input
                                type="text"
                                id="userName"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                                placeholder="Enter user name to search"
                            />
                        </div>
                        <button onClick={() => setSearchTerm('')} className="items-end w-full sm:w-auto px-6 py-2.5 text-base sm:text-lg md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed">
                            Clear
                        </button>
                    </div>
                </div>

                {feedback && (
                    <div className={`p-4 mb-6 rounded-lg text-center font-semibold ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {feedback.message}
                    </div>
                )}

                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-green-100">
                    <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm sm:text-md font-semibold text-green-800">
                        <span>Total Users: <span className="text-base sm:text-lg text-green-600 font-bold">{totalPlayingUsers}</span></span>
                        <span>Total Points (on this page): <span className="text-base sm:text-lg text-green-600 font-bold">{totalPoints.toLocaleString()}</span></span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-green-200 table-fixed">
                            <thead className="bg-green-50">
                                <tr>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">User Name</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">Points</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">Last Login</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">Action</th>
                     </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading && paginatedAndFilteredUsers.length === 0 ? (
                             <tr><td colSpan={4} className="text-center py-10 text-gray-500">Loading online users...</td></tr>
                                ) : apiError ? (
                                    <tr><td colSpan={4} className="text-center py-10 text-red-500">{apiError}</td></tr>
                                ) : paginatedAndFilteredUsers.length > 0 ? paginatedAndFilteredUsers.map((user, index) => (
                                    <tr key={user._id} className={index % 2 === 0 ? 'bg-white' : 'bg-green-50/50'}>
                                 <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">{user.username}</td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-left">{user.points?.toLocaleString() ?? 'N/A'}</td>
                             <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-left">{formatDate(user.lastlogin)}</td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-left">
                                            <button onClick={() => setUserToKick(user)} className="items-end w-full md:w-auto px-6 py-2.5 text-base sm:text-lg md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed">
                                                Kickoff
                                       </button>
                                        </td>
                                    </tr>
                                )) : (
                                <tr><td colSpan={4} className="text-center py-10 text-gray-500">No users are currently playing{searchTerm && ' with that name'}.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                 {totalFrontendPages > 0 && (
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t pt-4 border-gray-200 gap-4 sm:gap-0">
                            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isLoading} className="items-end w-full sm:w-auto px-6 py-2.5 text-base sm:text-lg md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                               Previous
                            </button>
                            <span className="text-sm text-gray-700 order-first sm:order-none">Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalFrontendPages}</span></span>
                     <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage >= totalFrontendPages || isLoading} className="items-end w-full sm:w-auto px-6 py-2.5 text-base sm:text-lg md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                       Next
                            </button>
                        </div>
                    )}
                </div>
         </div>
        </>
    );
}

export default KickoffUser;