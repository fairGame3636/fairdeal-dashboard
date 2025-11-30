import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, KeyRound } from 'lucide-react';
import UserService from '../../services/UserServices';
import AuthService from '../../services/AuthServices';
import { UserListItem } from '../../modals/User';

type UserRole = 'admin' | 'agent' | 'subagent';
type TargetType = 'agent' | 'subagent' | 'user';

function ResetPasswordPage() {
    // --- User and Target State ---
    const [userRole, setUserRole] = useState<UserRole>('admin');
    const [currentId, setCurrentId] = useState<string>('');
    const [resetType, setResetType] = useState<'self' | 'others'>('self');
    const [targetType, setTargetType] = useState<TargetType>('agent');
    const [selectedTargetId, setSelectedTargetId] = useState('');

    // --- Data Loading State ---
    const [agents, setAgents] = useState<UserListItem[]>([]);
    const [subagents, setSubagents] = useState<UserListItem[]>([]);
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    // --- Form State ---
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

    // --- Effects ---

    // 1. Load user role, id, and all subordinate users on mount
    useEffect(() => {
        // --- FIX: Normalize role from localStorage ---
        const roleFromStorage = localStorage.getItem('userRole') || 'admin';
        const normalizedRole: UserRole = roleFromStorage === "sub-agent" ? 'subagent' : (roleFromStorage as UserRole);
        
        const LoggedInUserData = localStorage.getItem('userData') || '{}';
        const userData = JSON.parse(LoggedInUserData); 
        const id = userData.id;
        
        setUserRole(normalizedRole); // Use the corrected role
        setCurrentId(id);

        const fetchAllUsers = async () => {
            setIsDataLoading(true);
            try {
                const [agentRes, subagentRes, userRes] = await Promise.all([
                    UserService.listUser({ role: 'agent', limit: 10000 }),
                    UserService.listUser({ role: 'sub-agent', limit: 10000 }),
                    UserService.listUser({ role: 'user', limit: 10000 }),
                ]);
                if (agentRes.success) setAgents(agentRes.data?.users || []);
                if (subagentRes.success) setSubagents(subagentRes.data?.users || []);
                if (userRes.success) setUsers(userRes.data?.users || []);
            } catch (error) {
                setApiError("Failed to load user lists. Please refresh the page.");
            }
            setIsDataLoading(false);
        };
        fetchAllUsers();
    }, []);

    // 2. Reset form when reset type or user role changes
    useEffect(() => {
        if (resetType === 'self') {
            setTargetType('self' as any);
        } else {
            if (userRole === 'admin') setTargetType('agent');
            else if (userRole === 'agent') setTargetType('subagent');
            else if (userRole === 'subagent') setTargetType('user');
        }
        setSelectedTargetId('');
        setPassword('');
        setConfirmPassword('');
        setErrors({});
        setApiError(null);
    }, [resetType, userRole]);

    // 3. Reset target selection when target type changes
    useEffect(() => {
        setSelectedTargetId('');
        setErrors(prev => ({ ...prev, selectedTargetId: '' }));
    }, [targetType]);

    // --- Memoized Calculations ---

    const availableTargetTypes = useMemo(() => {
        if (userRole === 'admin') return ['agent', 'subagent', 'user'] as TargetType[];
        if (userRole === 'agent') return ['subagent', 'user'] as TargetType[];
        return ['user'] as TargetType[];
    }, [userRole]);

    const availableTargets = useMemo(() => {
        if (resetType === 'self' || isDataLoading) return [];

        switch (targetType) {
            case 'agent':
                return userRole === 'admin' ? agents : [];
            case 'subagent':
                if (userRole === 'admin') return subagents;
                if (userRole === 'agent') return subagents.filter(sub => sub.agent_id === currentId);
                return [];
            case 'user':
                if (userRole === 'admin') return users;
                if (userRole === 'agent') {
                    const subagentIds = subagents.filter(sub => sub.agent_id === currentId).map(sub => sub._id);
                    return users.filter(user => user.subagent_id && subagentIds.includes(user.subagent_id));
                }
                if (userRole === 'subagent') {
                    return users.filter(user => user.subagent_id === currentId);
                }
                return [];
            default:
                return [];
        }
    }, [resetType, targetType, userRole, currentId, agents, subagents, users, isDataLoading]);

    // --- Helper Functions ---

    const getTargetName = () => {
        const allTargets = [...agents, ...subagents, ...users];
        const target = allTargets.find(t => t._id === selectedTargetId);
        return target?.name || selectedTargetId;
    };
    
    const validateForm = () => {
        const next: any = {};
        if (!password) next.password = 'Password is required';
       
        if (resetType === 'self') {
            if (!confirmPassword) next.confirmPassword = 'Confirm your password';
            else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
        }

        if (resetType === 'others' && !selectedTargetId) {
            next.selectedTargetId = `Please select a ${targetType}.`;
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    // --- Submit Handler ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError(null);
        if (!validateForm()) return;
        setIsSubmitting(true);

        try {
            let response;
            if (resetType === 'self') {
                response = await AuthService.selfResetPassword({
                    password,
                    confirm_password: confirmPassword
                });
            } else {
                response = await AuthService.otherResetPassword({
                    user_id: selectedTargetId,
                    password
                });
            }

            if (response.success) {
                const targetName = resetType === 'self' ? 'Your' : `${getTargetName()}'s`;
                setSuccessMessage(`${targetName} password has been updated successfully!`);
                setPassword('');
                setConfirmPassword('');
                setSelectedTargetId('');
                setErrors({});
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                setApiError(response.message || 'An unknown error occurred.');
            }
        } catch (error: any) {
            setApiError(error.message || 'Failed to connect to the server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isDataLoading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-lg text-green-700">Loading user data...</p></div>;
    }

    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-sans">
          <div className="max-w-3xl mx-auto">
              {/* --- Header Card --- */}
              {/* 🎨 CHANGED: p-5 (mobile) sm:p-8 (desktop) */}
              <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 mb-8 border-2 border-green-200 text-center">
                  {/* 🎨 CHANGED: text-2xl (mobile) sm:text-3xl (desktop) */}
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-green-800 flex items-center justify-center gap-2 sm:gap-3">
                      {/* 🎨 CHANGED: h-6 w-6 (mobile) sm:h-8 sm:w-8 (desktop) */}
                      <KeyRound className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" /> Reset Password
                  </h1>
                  {/* 🎨 CHANGED: text-base (mobile) sm:text-lg (desktop) */}
                  <p className="text-base sm:text-lg text-green-600 mt-1">Change your password or reset for those under your hierarchy.</p>
                  <span className="mt-4 inline-block bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full shadow-inner">
                      Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </span>
              </div>

              {/* --- Form Card --- */}
              {/* 🎨 CHANGED: p-5 (mobile) sm:p-8 (desktop) */}
              <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 border-2 border-green-200">
                  {successMessage && (
                      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl relative mb-6 flex items-center shadow-md animate-fadeIn">
                          <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                          <span className="block font-medium">{successMessage}</span>
                      </div>
                  )}
                  {apiError && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6 flex items-center shadow-md animate-fadeIn">
                           <XCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                           <span className="block font-medium">{apiError}</span>
                       </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                          {/* 🎨 CHANGED: text-sm (mobile) sm:text-md (desktop) */}
                          <label className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">What do you want to do? *</label>
                          {/* 🎨 CHANGED: py-2.5 (mobile) sm:py-3 (desktop) */}
                          <select value={resetType} onChange={e => setResetType(e.target.value as 'self' | 'others')} className="w-full px-4 py-2.5 sm:py-3 text-base border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition shadow-sm">
                              <option value="self">Reset My Own Password</option>
                              <option value="others">Reset Someone Else's Password</option>
                          </select>
                      </div>

                   {resetType === 'others' && (
                        <>
                          <div>
                              {/* 🎨 CHANGED: text-sm (mobile) sm:text-md (desktop) */}
                              <label className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">Select who you want to reset password for? *</label>
                              {/* 🎨 CHANGED: py-2.5 (mobile) sm:py-3 (desktop) */}
                              <select value={targetType} onChange={e => setTargetType(e.target.value as TargetType)} className="w-full px-4 py-2.5 sm:py-3 text-base border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition shadow-sm">
                                  {availableTargetTypes.map(type => (
                                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                  ))}
                              </select>
                          </div>
                           <div>
                               {/* 🎨 CHANGED: text-sm (mobile) sm:text-md (desktop) */}
                               <label htmlFor="selectedTargetId" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">Select {targetType} *</label>
                               {/* 🎨 CHANGED: py-2.5 (mobile) sm:py-3 (desktop) */}
                               <select id="selectedTargetId" value={selectedTargetId} onChange={e => setSelectedTargetId(e.target.value)} className={`w-full px-4 py-2.5 sm:py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition shadow-sm ${errors.selectedTargetId ? 'border-red-400 focus:ring-red-500' : 'border-green-300 focus:ring-green-500'}`}>
                                   <option value="">-- Select a {targetType} --</option>
                                   {availableTargets.map(target => (
                                       <option key={target._id} value={target._id}>{target.username}</option>
                                   ))}
                               </select>
                               {errors.selectedTargetId && (
                                   <p className="text-red-500 text-sm mt-1 flex items-center"><XCircle className="w-4 h-4 mr-1"/> {errors.selectedTargetId}</p>
                               )}
                           </div>
                         </>
                      )}

                      <div>
                          {/* 🎨 CHANGED: text-sm (mobile) sm:text-md (desktop) */}
                          <label htmlFor="password" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">{resetType === 'self' ? 'Your New Password *' : 'New Password *'}</label>
                          {/* 🎨 CHANGED: py-2.5 (mobile) sm:py-3 (desktop) */}
                          <input type="password" autoComplete="new-password" id="password" value={password} onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }} className={`w-full px-4 py-2.5 sm:py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition shadow-sm ${errors.password ? 'border-red-400 focus:ring-red-500' : 'border-green-300 focus:ring-green-500'}`} placeholder="Create password" />
                          {errors.password && (<p className="text-red-500 text-sm mt-1 flex items-center"><XCircle className="w-4 h-4 mr-1"/> {errors.password}</p>)}
                      </div>

                    {resetType === 'self' && (
                          <div>
                              {/* 🎨 CHANGED: text-sm (mobile) sm:text-md (desktop) */}
                              <label htmlFor="confirmPassword" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">Confirm Password *</label>
                              {/* 🎨 CHANGED: py-2.5 (mobile) sm:py-3 (desktop) */}
                              <input type="password" autoComplete="new-password" id="confirmPassword" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: '' })); }} className={`w-full px-4 py-2.5 sm:py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition shadow-sm ${errors.confirmPassword ? 'border-red-400 focus:ring-red-500' : 'border-green-300 focus:ring-green-500'}`} placeholder="Confirm password" />
                              {errors.confirmPassword && (<p className="text-red-500 text-sm mt-1 flex items-center"><XCircle className="w-4 h-4 mr-1"/> {errors.confirmPassword}</p>)}
                          </div>
                      )}
                      
                      <div className="flex justify-center pt-4">
                          {/* 🎨 CHANGED: py-2.5 text-lg (mobile) md:py-4 md:text-2xl (desktop). Also fixed typo 'tems-end'. */}
                          <button type="submit" disabled={isSubmitting} className={`w-full md:w-auto px-8 py-2.5 text-lg md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed ${isSubmitting ? 'bg-green-600' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transform hover:scale-105'}`}>
                              {isSubmitting ? (
                                  <span className="flex items-center justify-center">
                                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                      Updating...
                                  </span>
                              ) : (
                                  resetType === 'self' ? 'Update My Password' : `Reset ${targetType}'s Password`
                              )}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
  );
}

export default ResetPasswordPage;