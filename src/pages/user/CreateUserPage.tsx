import React, { useState, useEffect, useMemo } from 'react';
import { XCircle, CheckCircle, UserPlus, Sliders, User, Lock } from 'lucide-react';
import UserService from '../../services/UserServices'; // Sahi import
import { CreateUserRequest, UserListItem, UserProfile } from '../../modals/User';

type UserRole = 'admin' | 'agent' | 'subagent';
type CreatableType = 'agent' | 'subagent' | 'user';

interface FormData {
    userType: CreatableType;
    username: string;
    password: string; 
    phone_number: string;
    email_address: string;
    selectedAgentId: string;
    selectedSubagentId: string;
    commission: string;
}

// --- Helper function to sort users alphabetically ---
const sortUsers = (users: UserListItem[]): UserListItem[] => {
    return [...users].sort((a, b) => {
        const nameA = a.username?.toLowerCase() || '';
        const nameB = b.username?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
    });
};

// --- Helper function to find user ID ---
const getUserId = (userObject: any): string | null => {
    if (!userObject) return null;
    if (userObject._id) return userObject._id;
    if (userObject.id) return userObject.id;
    if (userObject.user && userObject.user._id) return userObject.user._id;
    if (userObject.user && userObject.user.id) return userObject.user.id;
    if (userObject.data && userObject.data._id) return userObject.data._id;
    if (userObject.data && userObject.data.id) return userObject.data.id;
    return null;
}

function CreateUserPage() {
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [loggedInUser, setLoggedInUser] = useState<UserProfile | null>(null);
    
    const [agentsList, setAgentsList] = useState<UserListItem[]>([]);
    const [subagentsList, setSubagentsList] = useState<UserListItem[]>([]);
    const [apiError, setApiError] = useState<string | null>(null);
    
    const [formData, setFormData] = useState<FormData>({
        userType: 'agent',
        username: '',
        password: '',
        phone_number: '',
        email_address: '',
        selectedAgentId: '',
        selectedSubagentId: '',
        commission: '',
    });
    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Effect 1: Determine role and set *initial* (incomplete) user data from localStorage
    useEffect(() => {
        const roleFromStorage = localStorage.getItem('userRole');
        const userDataString = localStorage.getItem('userData');
        
        const normalizedRole: UserRole = roleFromStorage === 'sub-agent' ? 'subagent' : (roleFromStorage as UserRole);
        
        if (normalizedRole) {
            setUserRole(normalizedRole);
            if (userDataString) {
                setLoggedInUser(JSON.parse(userDataString)); // Store incomplete data
            }
            
            let initialType: CreatableType = 'agent';
            if (normalizedRole === 'agent') initialType = 'subagent';
            if (normalizedRole === 'subagent') initialType = 'user';
            setFormData(prev => ({ ...prev, userType: initialType }));
        }
    }, []);

    // --- FIX: Effect 2 ---
    // Fetches lists AND full user profile for Agent/Subagent
    useEffect(() => {
        if (!userRole) return; // Wait for role to be set

        const getMyId = () => {
             const idFromState = getUserId(loggedInUser);
             if (idFromState) return idFromState;
             // Fallback to localStorage just in case state isn't set yet
             const userDataString = localStorage.getItem('userData');
             const localUser = userDataString ? JSON.parse(userDataString) : null;
             const localId = getUserId(localUser);
             if(!localId) {
                setApiError("Critical Error: Could not find your user ID. Please log in again.");
             }
             return localId;
        }

        if (userRole === 'admin') {
            const fetchAgents = async () => {
                const response = await UserService.listUser({ role: 'agent', limit: 10000 });
                if (response.success && response.data) {
                    setAgentsList(sortUsers(response.data.users));
                } else {
                    setApiError(response.message || "Failed to fetch agents list.");
                }
            };
            fetchAgents();
        } 
        else if (userRole === 'agent') {
            const fetchAgentData = async () => {
                const loggedInAgentId = getMyId();
                if (!loggedInAgentId) return;

                // 1. Fetch this agent's full profile (to get commission for validation)
                try {
                    const profileResponse = await UserService.getProfile();
                    if (profileResponse.success && profileResponse.data) {
                        setLoggedInUser(profileResponse.data.user || profileResponse.data);
                    } else {
                        setApiError(profileResponse.message || "Failed to load your profile.");
                    }
                } catch (err) {
                     setApiError("Error fetching profile.");
                }

                // 2. Fetch this agent's subagents list
                const response = await UserService.listUser({ role: 'sub-agent', agent_id: loggedInAgentId, limit: 10000 });
                if (response.success && response.data) {
                    setSubagentsList(sortUsers(response.data.users));
                } else {
                    setApiError(response.message || "Failed to fetch your sub-agents.");
                }
            };
            fetchAgentData();
        }
        else if (userRole === 'subagent') {
            // This is the main fix for the subagent bug
            const fetchMyFullProfile = async () => {
                try {
                    const response = await UserService.getProfile(); // Call the new API
                    if (response.success && response.data) {
                        // Overwrite incomplete localStorage data with full profile
                        // This profile WILL contain 'agent_id'
                        setLoggedInUser(response.data.user || response.data);
                    } else {
                        setApiError(response.message || "Failed to load your full profile. Cannot create users.");
                    }
                } catch (err) {
                     console.error("Failed to fetch profile:", err);
                     setApiError("Failed to fetch profile. Please check UserService.getProfile().");
                }
            };
            fetchMyFullProfile();
        }

    }, [userRole]); // Runs once when userRole is determined

    // Effect 3: (Unchanged) Fetch sub-agents for Admin
    useEffect(() => {
        if (userRole === 'admin' && formData.selectedAgentId) {
            const fetchFilteredSubagents = async () => {
                const response = await UserService.listUser({ role: 'sub-agent', agent_id: formData.selectedAgentId, limit: 10000 }); 
                if (response.success && response.data) {
                    setSubagentsList(sortUsers(response.data.users));
                } else {
                    setApiError(response.message || "Failed to fetch sub-agents for the selected agent.");
                    setSubagentsList([]);
                }
            };
            fetchFilteredSubagents();
        } else if (userRole === 'admin' && !formData.selectedAgentId) {
            setSubagentsList([]);
        }
    }, [userRole, formData.selectedAgentId]);

     // Effect 4: Auto-hide success/error messages (Unchanged)
     useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (successMessage || apiError) {
            timer = setTimeout(() => {
                setSuccessMessage(null);
                setApiError(null);
            }, 5000); 
        }
        return () => clearTimeout(timer);
    }, [successMessage, apiError]);

    // handleInputChange (Unchanged)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setApiError(null); 
        setSuccessMessage(null); 
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'userType') {
                newState.selectedAgentId = '';
                newState.selectedSubagentId = '';
                newState.commission = ''; 
                if (userRole === 'admin') {
                    setSubagentsList([]);
                }
            }
            if (name === 'selectedAgentId' && userRole === 'admin') {
                newState.selectedSubagentId = '';
                setSubagentsList([]); 
            }
            return newState;
        });
        if (errors[name as keyof FormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };
    
    // validateForm (UPDATED with 2.5 limit)
    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};
        
        // if (!formData.username.trim()) newErrors.username = 'Username is required';
        // else if (formData.username.length < 4) newErrors.username = 'Username must be at least 4 characters long';
        if (!formData.username) { // .trim() is not really needed since we remove spaces
            newErrors.username = 'Username is required';
        } else if (/\s/.test(formData.username)) {
            newErrors.username = 'Username cannot contain spaces.';
        } else if (/[A-Z]/.test(formData.username)) {
            newErrors.username = 'Username must be in lowercase.';
        } else if (formData.username.length < 4) {
            newErrors.username = 'Username must be at least 4 characters long';
        }
        

        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 4) newErrors.password = 'Password must be at least 4 characters long'; 

        if (formData.email_address.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_address)) {
            newErrors.email_address = 'If provided, please enter a valid email';
        }

        if (formData.userType === 'agent' || formData.userType === 'subagent') {
            const commissionValue = parseFloat(formData.commission);
            if (formData.commission.trim() === '') {
                newErrors.commission = 'Commission is required for Agents and Sub-agents.';
            } else if (isNaN(commissionValue) || commissionValue < 0) {
                newErrors.commission = 'Commission must be a positive number.';
            } 
            // --- NEW VALIDATION (MAX 2.5) ---
            else if (commissionValue > 2.5) {
                newErrors.commission = 'Commission cannot be more than 2.5%.';
            }
            // --- END NEW VALIDATION ---
            else if (userRole === 'agent' && formData.userType === 'subagent' && loggedInUser?.commission !== undefined) {
                if (commissionValue > loggedInUser.commission) {
                    newErrors.commission = `Commission cannot exceed your own commission of ${loggedInUser.commission}%.`;
                }
            }
             else if (userRole === 'admin' && formData.userType === 'subagent' && formData.selectedAgentId) {
                const parentAgent = agentsList.find(a => a._id === formData.selectedAgentId);
                if (parentAgent?.commission !== undefined && commissionValue > parentAgent.commission) {
                     newErrors.commission = `Commission cannot exceed parent agent's commission of ${parentAgent.commission}%.`;
                }
            }
        }

        if (userRole === 'admin') {
            if (formData.userType === 'subagent' && !formData.selectedAgentId) newErrors.selectedAgentId = 'Please select an agent for the sub-agent.';
            if (formData.userType === 'user' && !formData.selectedAgentId) newErrors.selectedAgentId = 'Please select an agent for the user.';
        }
        
        if (formData.userType === 'user') {
            if ((userRole === 'agent' || (userRole === 'admin' && formData.selectedAgentId)) && !formData.selectedSubagentId) {
                 newErrors.selectedSubagentId = 'Please select a sub-agent for the user.';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    // handleSubmit (Unchanged)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!loggedInUser) {
            setApiError("User profile is still loading, please wait and try again.");
            return;
        }

        if (!validateForm()) return;
        setIsSubmitting(true);
        setApiError(null);
        setSuccessMessage(null);
        
        const payload: CreateUserRequest = {
            username: formData.username,
            password: formData.password,
            phone_number: formData.phone_number || undefined,
            email: formData.email_address || undefined,
            type: formData.userType === 'subagent' ? 'sub-agent' : formData.userType,
        };
        
        if (formData.userType === 'agent' || formData.userType === 'subagent') {
            payload.commission = parseFloat(formData.commission);
        }
        
        if (userRole === 'admin') {
            if (formData.userType === 'subagent' || formData.userType === 'user') {
                payload.agent_id = formData.selectedAgentId;
                if (formData.userType === 'user') {
                    payload.subagent_id = formData.selectedSubagentId;
                }
            }
        } else if (userRole === 'agent') {
            const loggedInAgentId = getUserId(loggedInUser);
            if (!loggedInAgentId) {
                setApiError("Critical Error: Could not find logged-in agent's ID. Please log in again.");
                setIsSubmitting(false);
                return;
            }
            payload.agent_id = loggedInAgentId; 
            if (formData.userType === 'user') {
                payload.subagent_id = formData.selectedSubagentId;
            }
        } else if (userRole === 'subagent') {
            // --- FIX: This block will now work ---
            // `loggedInUser` is the full profile from getProfile()
            
            // The profile data will have 'agent_id'
            const parentAgentId = (loggedInUser as any)?.agent_id;
            const loggedInSubagentId = getUserId(loggedInUser);

            if (!parentAgentId || !loggedInSubagentId) {
                console.error("Failed to find IDs. ParentAgentID:", parentAgentId, "SubagentID:", loggedInSubagentId);
                console.error("Full loggedInUser object:", loggedInUser);
                setApiError("Critical Error: Could not determine parent IDs. Please log in again.");
                setIsSubmitting(false);
                return;
            }
            payload.agent_id = parentAgentId;
            payload.subagent_id = loggedInSubagentId;
        }

        const response = await UserService.createUser(payload);
        if (response.success && response.data) {
            setSuccessMessage(response.data.message || "User created successfully!");
             const initialUserType = userRole === 'admin' ? 'agent' : userRole === 'agent' ? 'subagent' : 'user';
            setFormData({ 
                userType: initialUserType, 
                username: '', 
                password: '', 
                phone_number: '', 
                email_address: '', 
                selectedAgentId: '', 
                selectedSubagentId: '', 
                commission: '' 
            });
            setErrors({});
        } else {
            setApiError(response.message || 'Failed to create user.');
        }
        setIsSubmitting(false);
    };

    // creatableOptions (Unchanged)
    const creatableOptions = () => {
        if (userRole === 'admin') return ['agent', 'subagent', 'user'];
        if (userRole === 'agent') return ['subagent', 'user'];
        if (userRole === 'subagent') return ['user'];
        return [];
    };

    if (!userRole) {
        // Simple text loading indicator, as ReadMe is not defined here.
        return <div>Loading...</div>;
    }

    // --- (JSX is unchanged) ---
    return (
        <div className="min-h-screen bg-gray-50 p-4 font-sans">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8 border-2 border-green-200 text-center">
                    <h1 className="text-xl sm:text-3xl font-extrabold text-green-800 flex items-center justify-center gap-2">
                        <UserPlus className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" /> Create New User
                    </h1>
                    <p className="text-sm sm:text-lg text-green-600 mt-1">Fill in the details below to create a new entity.</p>
                    <span className="mt-4 inline-block bg-green-100 text-green-800 text-xs sm:text-sm font-bold px-3 py-1 rounded-full shadow-inner">Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>
                </div>
                
                {/* Feedback Messages */}
                {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl relative mb-6 flex items-center shadow-md animate-fadeIn"><CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" /><span className="block font-medium">{successMessage}</span></div>}
                {apiError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6 flex items-center shadow-md animate-fadeIn"><XCircle className="h-6 w-6 mr-3 flex-shrink-0" /><span className="block font-medium">{apiError}</span></div>}
                
                {/* Form */}
                <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 border-2 border-green-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {userRole !== 'subagent' && (
                            <div>
                                <label htmlFor="userType" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">User Type to Create *</label>
                                <select id="userType" name="userType" value={formData.userType} onChange={handleInputChange} className="w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition shadow-sm">
                                    {creatableOptions().map(type => (<option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>))}
                                </select>
                            </div>
                        )}
                        
                        {/* Fields for hierarchy selection */}
                        {userRole === 'admin' && (formData.userType === 'subagent' || formData.userType === 'user') && (
                                <div>
                                    <label htmlFor="selectedAgentId" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">Assign to Agent *</label>
                                    <select id="selectedAgentId" name="selectedAgentId" value={formData.selectedAgentId} onChange={handleInputChange} className={`w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition shadow-sm ${errors.selectedAgentId ? 'border-red-400 focus:ring-red-500' : 'border-green-300 focus:ring-green-500'}`}>
                                        <option value="">Select an Agent</option>
                                        {agentsList.map(agent => <option key={agent._id} value={agent._id}>{agent.username}</option>)}
                                    </select>
                                    {errors.selectedAgentId && <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center"><XCircle className="w-4 h-4 mr-1"/>{errors.selectedAgentId}</p>}
                                </div>
                        )}
                        {formData.userType === 'user' && (userRole === 'agent' || userRole === 'admin') && (
                                <div>
                                    <label htmlFor="selectedSubagentId" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">Assign to Sub-agent *</label>
                                    <select id="selectedSubagentId" name="selectedSubagentId" value={formData.selectedSubagentId} onChange={handleInputChange} disabled={(userRole === 'admin' && !formData.selectedAgentId) || (userRole === 'agent' && subagentsList.length === 0)} className={`w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition shadow-sm disabled:bg-gray-100 ${errors.selectedSubagentId ? 'border-red-400 focus:ring-red-500' : 'border-green-300 focus:ring-green-500'}`}>
                                        <option value="">{ userRole === 'agent' && subagentsList.length === 0 ? 'You have no sub-agents' : 'Select a Sub-agent'}</option>
                                        {subagentsList.map(sub => <option key={sub._id} value={sub._id}>{sub.username}</option>)}
                                    </select>
                                    {errors.selectedSubagentId && <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center"><XCircle className="w-4 h-4 mr-1"/>{errors.selectedSubagentId}</p>}
                                </div>
                        )}
                        
                        {/* User detail fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="username" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">Username *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} placeholder="Enter a unique username" className={`w-full pl-10 pr-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition shadow-sm ${errors.username ? 'border-red-400 focus:ring-red-500' : 'border-green-300 focus:ring-green-500'}`} />
                                </div>
                                {errors.username && <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center"><XCircle className="w-4 h-4 mr-1"/>{errors.username}</p>}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">Password *</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Min. 4 characters" className={`w-full pl-10 pr-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition shadow-sm ${errors.password ? 'border-red-400 focus:ring-red-500' : 'border-green-300 focus:ring-green-500'}`} />
                                </div>
                                {errors.password && <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center"><XCircle className="w-4 h-4 mr-1"/>{errors.password}</p>}
                            </div>
                        </div>

                        {(formData.userType === 'agent' || formData.userType === 'subagent') && (
                            <div>
                                <label htmlFor="commission" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">Commission (%) *</label>
                                <div className="relative">
                                    <Sliders className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input type="number" step="0.01" min="0" max="2.5" id="commission" name="commission" value={formData.commission} onChange={handleInputChange} placeholder="Enter commission (e.g., 2.5)" className={`w-full pl-10 pr-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition shadow-sm ${errors.commission ? 'border-red-400 focus:ring-red-500' : 'border-green-300 focus:ring-green-500'}`} />
                                </div>
                                {errors.commission && <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center"><XCircle className="w-4 h-4 mr-1"/>{errors.commission}</p>}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email_address" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">Email Address (Optional)</label>
                            <input type="email" id="email_address" name="email_address" value={formData.email_address} onChange={handleInputChange} placeholder="Enter email address" className={`w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition shadow-sm ${errors.email_address ? 'border-red-400 focus:ring-red-500' : 'border-green-300 focus:ring-green-500'}`} />
                            {errors.email_address && <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center"><XCircle className="w-4 h-4 mr-1"/>{errors.email_address}</p>}
                        </div>

                        <div>
                            <label htmlFor="phone_number" className="block text-sm sm:text-md font-semibold text-gray-700 mb-2">Phone Number (Optional)</label>
                            <input type="tel" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleInputChange} placeholder="Enter 10-digit phone number" maxLength={10} className={`w-full px-4 py-2.5 text-sm sm:py-3 sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition shadow-sm ${errors.phone_number ? 'border-red-400 focus:ring-red-500' : 'border-green-300 focus:ring-green-500'}`} />
                            {errors.phone_number && <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center"><XCircle className="w-4 h-4 mr-1"/>{errors.phone_number}</p>}
                        </div>
                        
                        <div className="flex justify-center pt-4">
                            <button type="submit" disabled={isSubmitting} className={`w-full sm:w-auto px-8 py-2.5 text-base sm:px-16 sm:py-3 sm:text-lg font-bold text-white rounded-xl transition-all duration-300 shadow-lg disabled:cursor-not-allowed ${isSubmitting ? '!bg-green-600' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transform hover:scale-105'}`}>
                                {isSubmitting ? (<span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating...</span>) : (`Create ${formData.userType.charAt(0).toUpperCase() + formData.userType.slice(1)}`)}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateUserPage;

