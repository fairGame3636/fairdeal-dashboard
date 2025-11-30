import { useState, useEffect, useMemo } from 'react';
import React from 'react';
// --- NEW: Search icon import kiya ---
import { XCircle, CheckCircle, Search } from 'lucide-react'; 
import UserService from '../../services/UserServices';
import FundService from '../../services/FundServices';
import { UserListItem, UserProfile } from '../../modals/User'; // UserProfile import kiya

type UserRole = 'admin' | 'agent' | 'subagent';
type TargetType = 'agent' | 'subagent' | 'user';

const typeOptionsByRole: { [key in UserRole]: TargetType[] } = {
  admin: ['agent', 'subagent', 'user'],
  agent: ['subagent', 'user'],
  subagent: ['user'],
};

// --- Helper function to sort users alphabetically ---
const sortUsers = (users: UserListItem[]): UserListItem[] => {
    return [...users].sort((a, b) => {
        const nameA = a.username?.toLowerCase() || '';
        const nameB = b.username?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
    });
};

function PartnerAdjustment() {
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [currentId, setCurrentId] = useState<string>('');

  // --- NEW: Logged-in user ka balance state ---
  const [myBalance, setMyBalance] = useState<number | null>(null);
  const [isMyBalanceLoading, setIsMyBalanceLoading] = useState(true);

  // Data loading state
  const [agents, setAgents] = useState<UserListItem[]>([]);
  const [subagents, setSubagents] = useState<UserListItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // --- NEW: Search term state ---
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    type: '',
    partner: '', // This will now store the user ID
    adjust: '',
    amount: '',
    comments: '',
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect 1: Fetch logged-in user's role, ID, and *balance*
  useEffect(() => {
    const roleFromStorage = localStorage.getItem('userRole') || 'admin';
    const normalizedRole: UserRole = roleFromStorage === 'sub-agent' ? 'subagent' : roleFromStorage as UserRole;
    const userData = localStorage.getItem('userData') || '';
    
    let id = '';
    try {
        const LoggedInUser = JSON.parse(userData);
        id = LoggedInUser.id || LoggedInUser._id || LoggedInUser.user?.id || LoggedInUser.user?._id;
    } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
        setError("Session error. Please log in again.");
        return;
    }
    
    if (!id) {
        setError("Could not find your ID. Please log in again.");
        return;
    }
    
    setUserRole(normalizedRole);
    setCurrentId(id);
    setFormData(prev => ({ ...prev, type: typeOptionsByRole[normalizedRole][0] || '' }));

    // --- FIX: Admin ke liye balance fetch mat karo ---
    if (normalizedRole === 'admin') {
        // Admin has unlimited points
        setIsMyBalanceLoading(false);
        setMyBalance(null); // null represents "unlimited"
    } else {
        // Agent/Subagent ke liye profile fetch karo
        const fetchMyProfile = async () => {
            setIsMyBalanceLoading(true);
            try {
                const response = await UserService.getCurrentUserProfile(); 
                if (response.success && response.data) {
                    const profile = response.data;
                    const balance = profile.wallet?.current_balance; 
                    setMyBalance(balance ?? 0);
                } else {
                    console.error("Could not fetch user balance:", response.message);
                    setMyBalance(0); 
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                setMyBalance(0);
            } finally {
                setIsMyBalanceLoading(false);
            }
        };
        fetchMyProfile();
    }
    // --- END OF FIX ---
  }, []); // Runs once on load

  // Effect 2: Fetch user lists based on role and ID
  useEffect(() => {
    if (!currentId || !userRole) return; 

    const fetchUsers = async () => {
        setIsDataLoading(true);
        try {
            if (userRole === 'admin') {
                const [agentRes, subagentRes, userRes] = await Promise.all([
                    UserService.listUser({ role: 'agent', limit: 10000 }),
                    UserService.listUser({ role: 'sub-agent', limit: 10000 }),
                    UserService.listUser({ role: 'user', limit: 10000 }),
                ]);
                if (agentRes.success) setAgents(sortUsers(agentRes.data?.users || []));
                if (subagentRes.success) setSubagents(sortUsers(subagentRes.data?.users || []));
                if (userRes.success) setUsers(sortUsers(userRes.data?.users || []));
            } else if (userRole === 'agent') {
                const [subagentRes, userRes] = await Promise.all([
                    UserService.listUser({ role: 'sub-agent', agent_id: currentId, limit: 10000 }),
                    UserService.listUser({ role: 'user', agent_id: currentId, limit: 10000 }),
                ]);
                if (subagentRes.success) setSubagents(sortUsers(subagentRes.data?.users || []));
                if (userRes.success) setUsers(sortUsers(userRes.data?.users || []));
            } else if (userRole === 'subagent') {
                const userRes = await UserService.listUser({ role: 'user', subagent_id: currentId, limit: 10000 });
                if (userRes.success) setUsers(sortUsers(userRes.data?.users || []));
            }
        } catch (err) {
            setError('Failed to load partner data.');
        } finally {
            setIsDataLoading(false);
        }
    };
    
    fetchUsers();
  }, [userRole, currentId]); 

  // Effect 3: Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // partnerOptions (Unchanged)
  const partnerOptions = useMemo(() => {
    let list: UserListItem[] = [];
    if (!formData.type || isDataLoading) return [];

    switch (formData.type) {
      case 'agent': list = agents; break;
      case 'subagent': list = subagents; break;
      case 'user': list = users; break;
      default: return [];
    }
    
    if (!searchTerm) {
        return list; 
    }
    return list.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [formData.type, agents, subagents, users, isDataLoading, searchTerm]); 

  // handleInputChange (Unchanged)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    if (name === 'type') {
      newFormData.partner = ''; 
      setSearchTerm(''); 
    }
    
    setFormData(newFormData);
    setError('');
    setSuccessMessage(null);
  };

  // handleClear (Unchanged)
  const handleClear = () => {
    setFormData({ type: typeOptionsByRole[userRole][0] || '', partner: '', adjust: '', amount: '', comments: '' });
    setError('');
    setSearchTerm(''); 
  };

  // handleSubmit (FIXED)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const { type, partner, adjust, amount } = formData;
    if (!type || !partner || !adjust || !amount) {
      setError('Please fill out all required fields.');
      return;
    }
    if (parseFloat(amount) <= 0) {
        setError('Amount must be greater than zero.');
        return;
    }
    
    // --- FIX: Balance check sirf non-admin users ke liye ---
    if (userRole !== 'admin' && adjust === 'add' && myBalance !== null && parseFloat(amount) > myBalance) {
        setError('Insufficient balance. You cannot add more points than you have.');
        return;
    }
    // --- END OF FIX ---

    setIsSubmitting(true);
    setError('');

    try {
        let allLists = [...agents, ...subagents, ...users];
        const partnerName = allLists.find(p => p._id === partner)?.username || 'the user';
        const apiType = type === 'subagent' ? 'sub-agent' : type;

        const response = await FundService.adjustBalance({
            target_id: partner,
            target_role: apiType as 'agent' | 'sub-agent' | 'user',
            amount: parseFloat(amount),
            action: adjust as 'add' | 'subtract',
            comments: formData.comments || undefined
        });

        if (response.success && response.data?.ok) {
            setSuccessMessage(`${amount} has been ${adjust === 'add' ? 'added to' : 'subtracted from'} ${partnerName}'s account.`);
            
            // Refresh my balance (admin ke liye myBalance null hai, toh yeh skip ho jaayega)
            if (myBalance !== null) { 
                const newBalance = adjust === 'add' 
                    ? myBalance - parseFloat(amount) 
                    : myBalance + parseFloat(amount);
                setMyBalance(newBalance);
            }

            const adjustedAmount = parseFloat(formData.amount);
            const action = formData.adjust; // 'add' ya 'subtract'
            const targetId = formData.partner;
            const targetType = formData.type; 

            // Sahi state list ko update karo
            if (targetType === 'agent') {
                const updatedAgents = agents.map(user => {
                    if (user._id === targetId) {
                        const oldPoints = user.points ?? 0;
                        const newPoints = action === 'add' ? (oldPoints + adjustedAmount) : (oldPoints - adjustedAmount);
                        return { ...user, points: newPoints }; // Naye points ke saath update
                    }
                    return user; // Baaki users ko waise hi rehne do
                });
                setAgents(updatedAgents); // State update karo

            } else if (targetType === 'subagent') {
                const updatedSubagents = subagents.map(user => {
                    if (user._id === targetId) {
                        const oldPoints = user.points ?? 0;
                        const newPoints = action === 'add' ? (oldPoints + adjustedAmount) : (oldPoints - adjustedAmount);
                        return { ...user, points: newPoints };
                    }
                    return user;
                });
                setSubagents(updatedSubagents); // State update karo

            } else if (targetType === 'user') {
                const updatedUsers = users.map(user => {
                    if (user._id === targetId) {
                      	 const oldPoints = user.points ?? 0;
                        const newPoints = action === 'add' ? (oldPoints + adjustedAmount) : (oldPoints - adjustedAmount);
                        return { ...user, points: newPoints };
                    }
                    return user;
             });
                setUsers(updatedUsers); // State update karo
            }
            
            handleClear(); 
        } else {
            setError(response.message || 'An unexpected error occurred.');
        }

    } catch (err: any) {
        setError(err.message || 'Failed to submit the adjustment.');
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- JSX (UPDATED) ---
  return (
    <div className="p-4 bg-gray-50 min-h-full font-sans">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-green-800 mb-6 sm:mb-8">Partner Adjustment</h1>
      
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-green-100 max-w-4xl mx-auto">
        
        {/* --- FIX: Balance Display (Admin ke liye "Unlimited") --- */}
        <div className="mb-6 text-center bg-green-50 p-2 rounded-lg border border-green-200">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Your Current Balance</h3>
            <p className="text-xl sm:text-2xl font-bold text-green-600 mt-0">
                {isMyBalanceLoading ? 
                    'Loading...' : 
                    (userRole === 'admin' ? 'Unlimited' : (myBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                }
            </p>
        </div>
        {/* --- END OF FIX --- */}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-6 text-center space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center justify-center gap-2"><XCircle size={16} />{error}</p>}
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl relative mb-6 flex items-center shadow-md animate-fadeIn" role="alert">
                <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                <p>{successMessage}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label htmlFor="type" className="block text-sm sm:text-md font-medium text-gray-700 mb-2">Type *</label>
              <select id="type" name="type" value={formData.type} onChange={handleInputChange} className="w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                <option value="" disabled>Select Type</option>
                {userRole && typeOptionsByRole[userRole].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            
            {/* Partner Selection Block (with Search) */}
            <div>
              <label htmlFor="partner" className="block text-sm sm:text-md font-medium text-gray-700 mb-2">Partner *</label>
              
              <div className="relative mb-2">
                <input
                    type="text"
                    placeholder="Type to search partner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={!formData.type || isDataLoading}
                    className="w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 pl-10 disabled:opacity-50"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              
              <select 
                id="partner" 
                name="partner" 
                value={formData.partner} 
                onChange={handleInputChange} 
                disabled={!formData.type || isDataLoading} 
                className="w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>{isDataLoading ? 'Loading...' : (formData.type ? `Select ${formData.type}` : 'Select Type First')}</option>
                
                {partnerOptions.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.username} (Points: {p.points?.toLocaleString() ?? 0})
                  </option>
                ))}
              </select>
              {partnerOptions.length === 0 && searchTerm && !isDataLoading && (
                 <p className="text-gray-500 text-xs sm:text-sm mt-1">No user found matching "{searchTerm}".</p>
              )}
            </div>

            <div>
              <label htmlFor="adjust" className="block text-sm sm:text-md font-medium text-gray-700 mb-2">Adjust *</label>
              <select id="adjust" name="adjust" value={formData.adjust} onChange={handleInputChange} className="w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                <option value="" disabled>Select Add or Subtract</option>
                <option value="add">Add</option>
                <option value="subtract">Subtract</option>
              </select>
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm sm:text-md font-medium text-gray-700 mb-2">Amount *</label>
              <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="Enter adjustment amount" className="w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"/>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="comments" className="block text-sm sm:text-md font-medium text-gray-700 mb-2">Comments</label>
              <textarea id="comments" name="comments" rows={5} value={formData.comments} onChange={handleInputChange} placeholder="Enter any comments here..." className="w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"/>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">

            <button type="submit" disabled={isSubmitting || isMyBalanceLoading} className="w-full md:w-auto px-6 py-2.5 text-base sm:py-3 md:px-20 md:py-3 md:text-xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PartnerAdjustment;

