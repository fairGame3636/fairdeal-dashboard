import React from 'react';
import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import strings from '../utils/strings';
import ProfileModal from '../model/ProfileModel';
import UserService from '../services/UserServices';
import AuthService from '../services/AuthServices';
import logoImage from '../assets/images/image.png'; 

const subAgentSidebarOptions = [
    {
      groupLabel: 'Main',
      options: [
          { label: 'Dashboard', to: '/subagent' },
      ],
    },
    {
      groupLabel: 'User Management',
      options: [
          { label: 'Search user', to: strings.SearchUser },
          { label: 'Balance adjustment', to: strings.BalanceAdjustment },
          { label: 'Kickoff users', to: strings.KickoffUser },
          { label: 'Member List', to: strings.ListUsersPage },
      ],
    },
    {
      groupLabel: 'Sub-Agent Management',
      options: [
          { label: 'Create user', to: strings.CreateUser },
          { label: 'update status', to: strings.UpdateStatusPage },
      ],
    },
    {
      groupLabel: 'Reports',
      options: [
          { label: 'points file', to: strings.PointFile },
          { label: 'in points', to: strings.InPoints },
          { label: 'out points', to: strings.OutPoints },
          { label: 'game history', to: strings.GameHistory },
          { label: 'turn over', to: strings.TurnOver }
      ],
    },
    {
      groupLabel: 'Account',
      options: [
          { label: 'Reset Password', to: strings.resetPasswordRoute }
      ],
    },
];

function SubAgentDashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null); // --- CHANGE: State to hold user data
    const navigate = useNavigate();

    // --- CHANGE: Fetch real user data instead of dummy data ---
    useEffect(() => {
        const fetchProfile = async () => {
            const response = await UserService.getCurrentUserProfile();
            if (response.success && response.data) {
                const userData = {
                    name: response.data.name || response.data.username, 
                    username: response.data.username,
                    email: response.data.email || 'N/A',
                    role: response.data.role,
                    phone: response.data.phone_number || 'N/A',
                    wallet_amount: response.data.wallet?.current_balance ?? 0
                };
                setCurrentUser(userData);
            } else {
                console.error("Failed to fetch user profile:", response.message);
            }
        };

        fetchProfile();
    }, []);

    const handleLogout = async () => {
        try {
            AuthService.dashboardLogout();
        } catch (error) {
            console.error("Backend logout call failed, but logging out from frontend:", error);
        } finally {
            localStorage.clear();
            navigate('/');
        }
    };

    return (
        <div className="w-full h-screen bg-white flex flex-col overflow-hidden">
                      {/* --- Header (Updated for Mobile) --- */}
                      <header className="flex items-center justify-between h-20 px-4 sm:px-6 bg-white border-b-2 border-green-200 shadow-sm flex-shrink-0 z-40">
                            <div className="flex items-center">
                                <button
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className="md:hidden mr-3 p-2 rounded-full hover:bg-gray-100 flex items-center justify-center sm:px-4 sm:py-2 font-bold text-white transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:scale-105"
                                >
                                    {/* --- 1. SIDEBAR ICON size changed --- */}
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                                </button>
                                <div className="flex items-center">
                                     {/* Removed the icon div, logo is enough */}
                                    <div className="hidden sm:flex items-center"> {/* Keep items-center */}
                                        {/* --- THIS IS THE CHANGED LINE --- */}
                                        <img src={logoImage} alt="Casino App Logo" className="h-10 w-auto mr-3" /> {/* Adjusted height and added margin */}
                                        {/* ---------------------------------- */}
                                        <span className="text-lg font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full capitalize">{currentUser?.role}</span>
                                    </div>
                                     {/* --- Added mobile view for logo --- */}
                                     <div className="sm:hidden flex items-center">
                                          <img src={logoImage} alt="Casino App Logo" className="h-8 w-auto" /> {/* Smaller logo for mobile */}
                                     </div>
                                </div>
                            </div>
                      <div className="flex items-center space-x-2 sm:space-x-4">
                            {/* --- "Welcome" text is now hidden on mobile --- */}
                            <div className="text-right hidden sm:block">
                                <p className="text-green-700 font-semibold text-sm sm:text-base whitespace-nowrap">Welcome, {currentUser?.username || '...'}</p>
                            </div>
                            <button onClick={() => setIsProfileModalOpen(true)} className="p-2 rounded-full hover:bg-gray-100 flex items-center justify-center sm:px-4 sm:py-2 font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:scale-105" title="View Profile">
                                {/* --- 2. PROFILE ICON size changed for mobile --- */}
                                <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </button>
                            <button onClick={handleLogout} className="flex items-center justify-center p-2 sm:px-4 sm:py-2 font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:scale-105" title="Logout">
                                {/* --- 3. LOGOUT ICON size changed for mobile --- */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                <span className="hidden sm:inline ml-2">Logout</span>
                            </button>
                      </div>
                </header>

            {/* ... Rest of the component remains the same ... */}
            <div className="flex flex-1 overflow-hidden">
                 <aside className={`w-64 bg-gradient-to-b from-green-50 to-green-100 border-r-2 border-green-200 flex flex-col p-4 shadow-lg flex-shrink-0 transform transition-transform duration-300 ease-in-out z-30 fixed md:relative h-full ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                    <nav className="flex-1 mt-4 h-full overflow-y-auto">
                        {subAgentSidebarOptions.map((group) => (
                            <div key={group.groupLabel} className="mb-4">
                                <h3 className="px-3 mb-2 text-sm font-semibold text-green-500 uppercase tracking-wider">{group.groupLabel}</h3>
                                <div className="space-y-1">
                                    {group.options.map((option) => (
                                        <NavLink key={option.label} to={option.to} onClick={() => setIsSidebarOpen(false)} end={option.to === '/subagent'} className={({ isActive }) => `w-full flex items-center pl-6 pr-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 group ${isActive ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-md' : 'text-green-700 hover:bg-green-200/50'}`}>
                                            <span className="tracking-wide">{option.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                    <div className="mt-auto pt-8 text-center"><p className="text-sm text-green-600">© 2025 Casino App. All rights reserved.</p></div>
                </aside>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <main className="flex-1 bg-gray-50 overflow-y-auto"><Outlet /></main>
                </div>
            </div>
            {isSidebarOpen && (<div onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-20 transition-opacity" aria-hidden="true"></div>)}
            <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} userData={currentUser || {}} />
        </div>
    );
}

export default SubAgentDashboardLayout;