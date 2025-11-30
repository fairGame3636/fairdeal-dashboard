// import React, { useState, useEffect, useMemo } from 'react';

// // --- (1) TYPE DEFINITIONS ---
// type UserRole = 'admin' | 'agent' | 'subagent';

// interface DashboardCardData {
//     title: string;
//     value: string;
//     valueColor?: string;
//     roles?: UserRole[];
// }

// // --- (2) MOCK DATA ---
// const baseCards: DashboardCardData[] = [
//     { title: 'Total Deposit', value: '₹27,00,001.00' },
//     { title: 'Today Deposit', value: '₹0' },
//     { title: 'Total Withdraw', value: '-₹1,00,000.00', valueColor: 'text-red-500' },
//     { title: 'Today Withdraw', value: '₹0' },
//     { title: 'Games Played', value: '29,203' },
//     { title: 'Today Games Played', value: '17,817' },
//     { title: 'Today Profit/Loss', value: '₹0' },
//     { title: 'Total Profit/Loss', value: '₹2,60,001' },
//     { title: 'Win Loss % (One Day)', value: '-83.63', valueColor: 'text-red-500' },
//     { title: 'Win Loss % (Config Day)', value: '-88.98', valueColor: 'text-red-500' },
// ];

// const roleBasedCards: DashboardCardData[] = [
//     { title: 'Total Agent', value: '6', roles: ['admin'] },
//     { title: 'Total Subagent', value: '27', roles: ['admin', 'agent'] },
//     { title: 'Total Users', value: '83', roles: ['admin', 'agent', 'subagent'] },
// ];

// // --- (3) HELPER & STYLING COMPONENTS (Updated for smaller size) ---

// const ChartBarIcon = () => (
//     // Icon size reduced from h-6 w-6 to h-5 w-5
//     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//         <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//     </svg>
// );

// // The card component with adjusted padding and font sizes
// const DashboardCard: React.FC<DashboardCardData> = ({ title, value, valueColor = 'text-gray-900' }) => (
//     // Padding reduced from p-5 to p-4
//     <div className="bg-white rounded-xl shadow-lg p-4 border-t-4 border-green-400 transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
//         {/* Gap reduced from gap-4 to gap-3 */}
//         <div className="flex items-center gap-3">
//             {/* Icon padding reduced from p-3 to p-2 */}
//             <div className="p-2 bg-green-500 rounded-full">
//                 <ChartBarIcon />
//             </div>
//             <p className="font-semibold text-gray-600 text-sm">{title}</p>
//         </div>
//         {/* Font size reduced from text-4xl to text-3xl, margin-top from mt-4 to mt-3 */}
//         <p className={`text-3xl font-bold mt-3 break-words ${valueColor}`}>{value}</p>
//     </div>
// );


// // --- (4) MAIN DASHBOARD COMPONENT ---
// function DashboardHome() {
//     const [userRole, setUserRole] = useState<UserRole>('admin');

//     useEffect(() => {
//         const role = (localStorage.getItem('userRole') as UserRole) || 'admin';
//         setUserRole(role);
//     }, []);

//     const visibleCards = useMemo(() => {
//         const extraCards = roleBasedCards.filter(card => card.roles?.includes(userRole));
//         return [...extraCards, ...baseCards];
//     }, [userRole]);

//     return (
//         <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen font-sans">
//             {/* --- Page Header --- */}
//             <div className="mb-8">
//                 <h1 className="text-4xl font-bold text-green-800">Dashboard Overview</h1>
//                 <p className="text-lg text-gray-500 mt-1">
//                     Here is the latest summary of your account activity.
//                 </p>
//             </div>

//             {/* --- Responsive Grid for Cards --- */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                 {visibleCards.map((card) => (
//                     <DashboardCard 
//                         key={card.title} 
//                         title={card.title} 
//                         value={card.value} 
//                         valueColor={card.valueColor}
//                     />
//                 ))}
//             </div>
//         </div>
//     );
// }

// export default DashboardHome;

// ---------------------------------------------

import React, { useState, useEffect, useMemo } from 'react';
import DashboardService from '../../services/DashboardServices'; // Corrected import path
import { DashboardData } from '../../modals/Dashboard'; // Corrected import path

// // --- (1) TYPE DEFINITIONS ---
// type UserRole = 'admin' | 'agent' | 'sub-agent' | 'subagent';

interface DashboardCardData {
    key: string; // Add a unique key for mapping
    title: string;
    value: string;
    valueColor?: string;
}

// --- (2) FORMATTING HELPERS ---
const formatCurrency = (value: number = 0) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatNumber = (value: number = 0) => value.toLocaleString('en-IN');
const formatPercentage = (value: number = 0) => `${value.toFixed(2)}%`;


// --- (3) HELPER & STYLING COMPONENTS (Preserved from your original code) ---
const ChartBarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const DashboardCard: React.FC<Omit<DashboardCardData, 'key'>> = ({ title, value, valueColor = 'text-gray-900' }) => (
    // --- CHANGED LINE 4 --- Made card padding and shadow responsive
    <div className="bg-white rounded-xl shadow-md sm:shadow-lg p-3 sm:p-4 border-t-4 border-green-400 transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-full">
                <ChartBarIcon />
            </div>
            <p className="font-semibold text-gray-600 text-sm">{title}</p>
        </div>
        <p className={`text-xl sm:text-3xl font-bold mt-3 break-words ${valueColor}`}>{value}</p>
    </div>
);


// --- (4) MAIN DASHBOARD COMPONENT ---
function DashboardHome() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Fetch data from the backend when the component mounts
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await DashboardService.getDashboardData();
                if (response.success && response.data) {
                    setDashboardData(response.data.data);
                } else {
                    throw new Error(response.message || 'Failed to fetch dashboard data.');
                }
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Memoized transformation of API data into card data
    const visibleCards = useMemo((): DashboardCardData[] => {
        if (!dashboardData) return [];

        const data = dashboardData;
        const cards: DashboardCardData[] = [];

        // Role-based user counts
        if (data.totalAgents !== undefined) cards.push({ key: 'totalAgents', title: 'Total Agents', value: formatNumber(data.totalAgents) });
        if (data.totalSubAgents !== undefined) cards.push({ key: 'totalSubAgents', title: 'Total Subagents', value: formatNumber(data.totalSubAgents) });
        if (data.totalUsers !== undefined) cards.push({ key: 'totalUsers', title: 'Total Users', value: formatNumber(data.totalUsers) });

        // Financials and other stats
        cards.push(
            { key: 'totalDeposit', title: 'Total Deposit', value: formatCurrency(data.totalDeposit) },
            { key: 'todayDeposit', title: 'Today Deposit', value: formatCurrency(data.todayDeposit) },
            { key: 'totalWithdraw', title: 'Total Withdraw', value: formatCurrency(data.totalWithdraw), valueColor: 'text-red-500' },
            { key: 'todayWithdraw', title: 'Today Withdraw', value: formatCurrency(data.todayWithdraw), valueColor: 'text-red-500' },
            { key: 'gamesPlayed', title: 'Games Played', value: formatNumber(data.gamesPlayed) },
            { key: 'todayGamesPlayed', title: 'Today Games Played', value: formatNumber(data.todayGamesPlayed) },
            { key: 'todayProfitLoss', title: 'Today Profit/Loss', value: formatCurrency(data.todayProfitLoss), valueColor: data.todayProfitLoss && data.todayProfitLoss < 0 ? 'text-red-500' : 'text-green-600' },
            { key: 'totalProfitLoss', title: 'Total Profit/Loss', value: formatCurrency(data.totalProfitLoss), valueColor: data.totalProfitLoss && data.totalProfitLoss < 0 ? 'text-red-500' : 'text-green-600' },
            { key: 'profitLossPercentage', title: 'Total P/L %', value: formatPercentage(data.profitLossPercentage), valueColor: data.profitLossPercentage && data.profitLossPercentage < 0 ? 'text-red-500' : 'text-green-600' },
        );

        return cards;
    }, [dashboardData]);
    
    // --- RENDER LOGIC ---

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><p className="text-xl text-gray-500">Loading Dashboard...</p></div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen"><p className="text-xl text-red-500 p-8 bg-red-100 rounded-lg">Error: {error}</p></div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen font-sans">
            <div className="mb-8">
                {/* Made font size responsive */}
                <h1 className="text-2xl sm:text-4xl font-bold text-green-800">Dashboard Overview</h1>
                {/* Made font size responsive */}
                <p className="text-base sm:text-lg text-gray-500 mt-1">
                    Here is the latest summary of your account activity.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleCards.map((card) => (
                    <DashboardCard 
                        key={card.key} 
                        title={card.title} 
                        value={card.value} 
                        valueColor={card.valueColor}
                    />
                ))}
            </div>
        </div>
    );
}

export default DashboardHome;