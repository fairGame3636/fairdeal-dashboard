import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// --- NAYA ADD HUA: Icons for new modals ---
import { Trash2, AlertTriangle, Pencil } from 'lucide-react'; 
import Strings from '../../utils/strings';
import UserService from '../../services/UserServices';
import { UserListItem } from '../../modals/User';

// --- CSS for Animations (No Changes) ---
const animationStyles = `
  @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
  .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
  @keyframes fade-in-scale { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
  .animate-fade-in-scale { animation: fade-in-scale 0.3s ease-out forwards; }
`;

// --- (No Changes to AddCoinsModal) ---
interface AddCoinsModalProps {
  user: UserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: UserListItem) => void;
}
const AddCoinsModal: React.FC<AddCoinsModalProps> = ({ user, isOpen, onClose, onUpdateUser }) => {
    // ... (Aapka poora AddCoinsModal code yahan hai... koi change nahi)
    const [points, setPoints] = useState('');
    const [password, setPassword] = useState('');
    const [comments, setComments] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
    if (isOpen) {
        setPoints(''); setPassword(''); setComments(''); setError('');
    }
    }, [isOpen]);
    if (!isOpen || !user) return null;
    const handleAction = (action: 'ADD' | 'SUB') => {
    const pointsValue = parseInt(points, 10);
    if (isNaN(pointsValue) || pointsValue <= 0) {
        setError('Please enter a valid number of points.'); return;
    }
    if (!password) {
        setError('Transaction password is required.'); return;
    }
    const currentPoints = user.points ?? 0;
    const newPoints = action === 'ADD' ? currentPoints + pointsValue : currentPoints - pointsValue;
    onUpdateUser({ ...user, points: Math.max(0, newPoints) }); // Prevent negative points
    onClose();
    };
    return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300">
        <style>{animationStyles}</style>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-fade-in-scale">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-green-700">Add Coins</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
             {/* ... (inputs as before) ... */}
            <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Agent Points</label>
            <input type="text" readOnly value="990" className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed" />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
            <input type="text" readOnly value={user._id} className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg" />
            </div>
            <div>
            <label htmlFor="points" className="block text-sm font-medium text-gray-600 mb-1">Points</label>
            <input id="points" type="number" value={points} onChange={(e) => { setPoints(e.target.value); setError(''); }} placeholder="Enter points to add/sub" className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">Transaction Password</label>
            <input id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-600 mb-1">Comments</label>
            <textarea id="comments" rows={3} value={comments} onChange={(e) => setComments(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"></textarea>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}
        </div>
        <div className="flex justify-center space-x-4 p-4 sm:p-5 bg-gray-50 rounded-b-xl">
            <button onClick={() => handleAction('SUB')} className="w-full rounded-lg py-2 px-4 bg-red-500 text-white font-semibold hover:bg-red-600">SUB</button>
            <button onClick={() => handleAction('ADD')} className="w-full rounded-lg py-2 px-4 bg-green-500 text-white font-semibold hover:bg-green-600">ADD</button>
        </div>
        </div>
    </div>
    );
};

// --- (No Changes to UserLockStatus) ---
interface UserLockStatusProps {
  user: UserListItem;
  onBack: () => void;
  onSuccess: () => void; // Callback to trigger a data refresh
}
const UserLockStatus: React.FC<UserLockStatusProps> = ({ user, onBack, onSuccess }) => {
    // ... (Aapka poora UserLockStatus code yahan hai... koi change nahi)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleToggleLockStatus = async () => {
    setIsSubmitting(true);
    setError('');
    setMessage('');
    
    const nextStatus = (user.lock_status || 'unlocked') === 'locked' ? 'unlocked' : 'locked';
    const response = await UserService.updateLockStatus(user._id, nextStatus);

    if (response.success) {
        setMessage(response.data?.message || `User status has been updated to ${nextStatus}.`);
        setTimeout(() => {
        onSuccess();
        onBack();
        }, 1500);
    } else {
        setError(response.message || 'Failed to update lock status.');
        setIsSubmitting(false);
    }
    };
    
    return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full font-sans animate-fade-in">
         {/* ... (content as before) ... */}
        <div className="flex items-center mb-6 sm:mb-8">
        <button
            onClick={onBack}
            className="mr-3 items-end w-auto px-4 py-2 text-base sm:px-8 sm:py-3 sm:text-xl md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
        >
            <svg className="w-5 h-5 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-green-800">User Lock Status - {user.username}</h1>
        </div>
        <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-lg border border-green-100 max-w-3xl mx-auto">
        <div className="mb-6 text-center space-y-4">
            {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-lg" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
            )}
            {message && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-lg" role="alert">
                <p className="font-bold">Success</p>
                <p>{message}</p>
            </div>
            )}
        </div>
        <div className="space-y-6">
            <div>
            <label className="block text-md font-medium text-gray-700 mb-2">User Lock Status</label>
            <input type="text" readOnly value={(user.lock_status || 'N/A').toUpperCase()} className="w-full px-4 py-3 text-base bg-gray-100 border border-gray-300 rounded-lg" />
            </div>
        </div>
        <div className="mt-10 flex justify-center">
            <button
                onClick={handleToggleLockStatus}
                disabled={isSubmitting}
                className="w-full md:w-auto px-4 py-2 text-base sm:px-8 sm:py-3 sm:text-xl md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Updating...' : ((user.lock_status || '') === 'locked' ? 'Unlock User' : 'Lock User')}
            </button>
        </div>
        </div>
    </div>
    );
};
// --- NAYA ADD HUA: Reusable Confirmation Modal ---
// --- (*** FIXED & RESPONSIVE ***) ---
// ----------------------------------------------------
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Yes",
  cancelText = "Cancel",
  isConfirming = false,
}) => {
  if (!isOpen) return null;

  return (
    // z-index 60 taaki ye UserProfileModal (z-50) ke upar aaye
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-[60] p-4 transition-opacity duration-300"> 
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-fade-in-scale">
        {/* Title */}
        <div className="flex flex-col items-center justify-center p-5 border-b border-gray-200">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
        
        {/* Message */}
        <div className="p-6 text-center">
          <p className="text-sm text-gray-600">{message}</p>
        </div>

        {/* Buttons (Responsive) */}
        <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-3 sm:space-y-0 p-5 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="w-full sm:w-auto px-8 py-2.5 text-base font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg 
                       bg-gradient-to-r from-green-500 to-green-600 
                       hover:from-green-600 hover:to-green-700 
                       active:from-green-700 active:to-green-800 
                       hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 
                       disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="w-full sm:w-auto px-8 py-2.5 text-base font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg 
                       bg-gradient-to-r from-red-500 to-red-600 
                       hover:from-red-600 hover:to-red-700 
                       active:from-red-700 active:to-red-800 
                       hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300 
                       disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isConfirming ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};


// ======================================================================
// === 2. USER PROFILE MODAL (FIXED HEADER KE SAATH) ===
// ======================================================================

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserListItem | null;
  allAgents: UserListItem[];
  allSubagents: UserListItem[];
  onUserUpdate: () => void; // List ko refresh karne ke liye
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  allAgents,
  allSubagents,
  onUserUpdate,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [newAgentId, setNewAgentId] = useState(user?.agent_id || '');
  const [newSubagentId, setNewSubagentId] = useState(user?.subagent_id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setNewAgentId(user?.agent_id || '');
      setNewSubagentId(user?.subagent_id || '');
      setIsEditMode(false);
      setError('');
      setSuccess('');
      setIsDeleting(false);
      setIsConfirmModalOpen(false);
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
 
    if (!user) {
      setError('No user selected.');
      setIsSaving(false);
      return;
    }
 
    try {
      // NOTE: Make sure 'UserService' is imported in your file
      const response = await UserService.updateUserAgents({
        userId: user._id,
        agent_id: newAgentId,
        subagent_id: newSubagentId,
      });
 
      if (response.success) {
        setSuccess('User updated successfully!');
        setIsSaving(false);
        setIsEditMode(false);
        setTimeout(() => {
          onUserUpdate();
          onClose();
        }, 1000);
      } else {
        setError(response.message || 'Failed to update user.');
        setIsSaving(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!user) return;
    setIsConfirmModalOpen(true); // Open the custom confirmation modal
  };

  const onConfirmDelete = async () => {
    if (!user) return;

    setIsDeleting(true);
    setError('');
    setSuccess('');

    try {
      // API call
      // NOTE: Make sure 'UserService' is imported in your file
      const response = await UserService.deleteUser(user._id); 

      if (response.success) {
        setSuccess('User deleted successfully!');
        setIsDeleting(false);
        setIsConfirmModalOpen(false); // Naya modal band karo
        
        setTimeout(() => {
          onUserUpdate(); // List ko refresh karega
          onClose();      // Profile modal band karega
        }, 1000);
      } else {
        setError(response.message || 'Failed to delete user.');
        setIsDeleting(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during deletion.');
      setIsDeleting(false);
    }
  };


  const handleCancel = () => {
    setNewAgentId(user?.agent_id || '');
    setNewSubagentId(user?.subagent_id || '');
    setIsEditMode(false);
    setError('');
  };

  // Helper function to render details
  const renderDetailRow = (label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 py-3 border-b border-gray-100 items-center">
      <dt className="text-sm font-medium text-gray-500 col-span-1">{label}</dt>
      <dd className="text-sm text-gray-900 col-span-2 font-semibold break-words">
        {value}
      </dd>
    </div>
  );
  
  const isLoading = isSaving || isDeleting;

  if (!isOpen || !user) return null;

  return (
    <>
      {/* Modal 1: UserProfileModal */}
      <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md animate-fade-in-scale"
          onClick={(e) => e.stopPropagation()} 
        >
          {/* --- HEADER --- (YAHAN CHANGES KIYE GAYE HAIN) --- */}
          <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-green-700">
              User Profile
            </h2>
            {/* `flex-nowrap` add kiya taaki buttons wrap na hon */}
            <div className="flex items-center flex-nowrap space-x-2">
              {!isEditMode && (
                <>
                  {/* --- FIXED: DELETE BUTTON --- */}
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    // `p-2` (icon only) default, `sm:px-3` (with text) badi screen par
                    className="flex items-center justify-center gap-1 w-auto p-2 sm:px-3 text-sm font-bold text-white rounded-lg transition-all duration-200 transform shadow-lg 
                            bg-gradient-to-r from-red-500 to-red-600 
                            hover:from-red-600 hover:to-red-700 
                            active:from-red-700 active:to-red-800 
                            hover:scale-105 
                            focus:outline-none focus:ring-4 focus:ring-red-300 
                            disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                    {/* Text ko `sm` screen par show kiya */}
                    <span className="hidden sm:inline">Delete</span>
                  </button>

                  {/* --- FIXED: Edit Button --- */}
                  {/* --- FIXED: Edit Button --- */}
              <button
                onClick={() => setIsEditMode(true)}
                disabled={isLoading}
                // `p-2` (icon only) default, `sm:px-4` (with text) badi screen par
                className="flex items-center justify-center gap-1 w-auto p-2 sm:px-4 text-sm font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg 
                        bg-gradient-to-r from-green-500 to-green-600 
                        hover:from-green-600 hover:to-green-700 
                        active:from-green-700 active:to-green-800 
                        hover:scale-105 
                        focus:outline-none focus:ring-4 focus:ring-green-300 
                        disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              >
                <Pencil size={16} />
                {/* Text ko `sm` screen par show kiya */}
                <span className="hidden sm:inline">Edit</span>
              </button>
            </>
          )}

          {/* --- FIXED: Close Button --- */}
          {/* Iski classes ab Edit button (icon-only state) se match karengi */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-auto p-2 text-sm font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg 
                       bg-gradient-to-r from-green-500 to-green-600 
                       hover:from-green-600 hover:to-green-700 
                       active:from-green-700 active:to-green-800 
                       hover:scale-105 
                       focus:outline-none focus:ring-4 focus:ring-green-300 
                       disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4 sm:w-6 sm:h-6" 
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
            </div>
          </div>


          {/* Body (No changes) */}
          <div className="p-4 sm:p-6">
            <dl>
              {renderDetailRow('Username', user.username)}
              {renderDetailRow('Points', user.points || 0)}
              {renderDetailRow(
                'Status',
                <span
                  className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.status ? user.status.toUpperCase() : 'N/A'}
                </span>
              )}

              {/* Agent Row (Editable) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 py-3 border-b border-gray-100 items-center">
                <dt className="text-sm font-medium text-gray-500 col-span-1">
                  Agent
                </dt>
                <dd className="text-sm text-gray-900 col-span-2 font-semibold">
                  {isEditMode ? (
                    <select
                      value={newAgentId}
                      onChange={(e) => setNewAgentId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-sm"
                    >
                      <option value="">-- Select Agent --</option>
                      {allAgents.map((agent) => (
                        <option key={agent._id} value={agent._id}>
                          {agent.username}
                        </option>
                      ))}
                    </select>
                  ) : (
                    user.agentName || 'N/A'
                  )}
                </dd>
              </div>

              {/* Subagent Row (Editable) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 py-3 items-center">
                <dt className="text-sm font-medium text-gray-500 col-span-1">
                  Sub Agent
                </dt>
                <dd className="text-sm text-gray-900 col-span-2 font-semibold">
                  {isEditMode ? (
                    <select
                      value={newSubagentId}
                      onChange={(e) => setNewSubagentId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-sm"
                    >
                      <option value="">-- Select Subagent --</option>
                      {allSubagents.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.username}
                        </option>
                      ))}
                    </select>
                  ) : (
                    user.subagentName || 'N/A'
                  )}
                </dd>
              </div>
            </dl>

            {/* Error/Success Messages */}
            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </p>
            )}
            {success && (
              <p className="mt-4 text-sm text-green-600 bg-green-50 p-3 rounded-md">
                {success}
              </p>
            )}
          </div>

          {/* Footer (Aapka diya gaya code pehle se responsive tha) */}
          {isEditMode && (
            <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0 p-4 bg-gray-50 rounded-b-xl">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-2.5 text-base font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg 
                           bg-gradient-to-r from-green-500 to-green-600 
                           hover:from-green-600 hover:to-green-700 
                           active:from-green-700 active:to-green-800 
                           hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 
                           disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-2.5 text-base font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg 
                           bg-gradient-to-r from-green-500 to-green-600 
                           hover:from-green-600 hover:to-green-700 
                           active:from-green-700 active:to-green-800 
                           hover:scale-105 
                           focus:outline-none focus:ring-4 focus:ring-green-300 
                           disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal 2: ConfirmationModal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={onConfirmDelete}
        title="Confirm Deletion"
        // Message ko user.username ke saath dynamically update kiya
        message={`Are you sure you want to delete the user ${user.username}? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isConfirming={isDeleting}
      />
    </>
  );
}

// ----------------------------------------------------
// --- *** END UserProfileModal CHANGES *** ---
// ----------------------------------------------------

// --- Main SearchUsers Component (Rest of the file - UNCHANGED) ---
// --- Isme koi changes ki zaroorat nahi hai ---
function SearchUsers() {
  const navigate = useNavigate();
  const [masterUserList, setMasterUserList] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [view, setView] = useState<'table' | 'lockStatus'>('table');
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [formData, setFormData] = useState({ userName: '', email: '', lockStatus: 'all', status: 'all' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5; 

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserListItem | null>(null);

  const allAgents = useMemo(() => 
      masterUserList
          .filter(u => u.role === 'agent')
          .sort((a, b) => (a.username || '').localeCompare(b.username || ''))
  , [masterUserList]);
  
  const allSubagents = useMemo(() => 
      masterUserList
          .filter(u => (u.role || '').toString().toLowerCase().includes('sub'))
          .sort((a, b) => (a.username || '').localeCompare(b.username || ''))
  , [masterUserList]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
        const roleFromStorage = localStorage.getItem('userRole');
        const rolesToFetch: ('agent' | 'sub-agent' | 'user')[] = [];

        if (roleFromStorage === 'admin') rolesToFetch.push('agent', 'sub-agent', 'user');
        else if (roleFromStorage === 'agent') rolesToFetch.push('sub-agent', 'user');
        else if (roleFromStorage === 'sub-agent' || roleFromStorage === 'subagent') rolesToFetch.push('user');
        
            let combinedUsers: UserListItem[] = [];
        
            if (rolesToFetch.length === 1) {
                const res = await UserService.listUser({ role: rolesToFetch[0], limit: 5000 });
                if (res.success && res.data) {
                    combinedUsers = res.data.users;
                }
            } else if (rolesToFetch.length > 1) {
                const results = await Promise.all(rolesToFetch.map(role => UserService.listUser({ role, limit: 5000 })));
                results.forEach(response => {
                    if (response.success && response.data) {
                        combinedUsers.push(...response.data.users);
                    }
                });
            } else {
                const res = await UserService.listUser({ role: 'user', limit: 5000 });
                if (res.success && res.data) {
                    combinedUsers = res.data.users;
                }
            }
        
        const uniqueUsers = Array.from(new Map(combinedUsers.map(user => [user._id, user])).values());

        const sortedUsers = uniqueUsers.sort((a, b) => {
            const nameA = a.username?.toLowerCase() || '';
            const nameB = b.username?.toLowerCase() || '';
            return nameA.localeCompare(nameB);
        });
        
        setMasterUserList(sortedUsers); 

    } catch (err) {
        setApiError("Failed to load user data. Please try again.");
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };
  
  const handleClear = () => {
    setFormData({ userName: '', email: '', lockStatus: 'all', status: 'all' });
    setCurrentPage(1);
  };

  const filteredUsers = useMemo(() => {
    return masterUserList.filter(user => {
      const userNameMatch = (user.username || '').toLowerCase().includes(formData.userName.toLowerCase());
      const emailMatch = (user.email || '').toLowerCase().includes(formData.email.toLowerCase());
      const lockStatusMatch = formData.lockStatus === 'all' || (user.lock_status || '').toLowerCase() === formData.lockStatus;
      const statusMatch = formData.status === 'all' || (user.status || '').toLowerCase() === formData.status;
      return userNameMatch && emailMatch && lockStatusMatch && statusMatch;
    });
  }, [masterUserList, formData]);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'NONE';
    try {
        return new Date(dateString).toLocaleString('en-IN', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return 'Invalid Date';
    }
  };

  const formatRole = (role?: string | null) => {
    if (!role) return 'N/A';
    return role.replace('-', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (view === 'lockStatus' && selectedUser) {
    return <UserLockStatus user={selectedUser} onBack={() => setView('table')} onSuccess={fetchData} />;
  }

  const handleNavigation = () => {
    const roleFromStorage = localStorage.getItem('userRole');
    if (!roleFromStorage) return; 
    const urlRole = roleFromStorage.replace('-', ''); 
    navigate(`/${urlRole}/${Strings.BalanceAdjustment}`);
  };

  return (
    <>
      <style>{animationStyles}</style>

      {/* --- Profile Modal (ab ye naya confirm modal bhi render karega) --- */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={selectedUserProfile}
        allAgents={allAgents}
        allSubagents={allSubagents}
        onUserUpdate={() => {
          setIsProfileModalOpen(false);
          fetchData(); // List ko refresh karein
        }}
      />
      
      <div className="p-4 bg-gray-50 min-h-full font-sans animate-fade-in">
        {/* --- Search/Filter Form (styling simplified) --- */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-8 border border-green-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-600 mb-1">User Name</label>
              <input type="text" id="userName" name="userName" value={formData.userName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="e.g., W1" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input type="text" id="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="e.g., w1@example.com" />
            </div>
            <div>
              <label htmlFor="lockStatus" className="block text-sm font-medium text-gray-600 mb-1">Lock Status</label>
              <select id="lockStatus" name="lockStatus" value={formData.lockStatus} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                <option value="all">All</option>
                <option value="locked">Locked</option>
                <option value="unlocked">Unlocked</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-600 mb-1">Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end items-end mt-6 space-y-3 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={() => setCurrentPage(1)} 
              className="items-end w-full sm:w-auto px-6 py-2.5 text-base sm:text-lg md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-7L700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
            >
              Submit
            </button>
            <button 
              onClick={handleClear} 
              className="items-end w-full sm:w-auto px-6 py-2.5 text-base sm:text-lg md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-7L700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </div>

        {/* --- User Table (styling simplified) --- */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-green-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-green-200">
              <thead className="bg-green-50">
                <tr>
                  {['Player', 'Role', 'Points', 'Last Login', 'Lock Status', 'Email', 'Status', 'Action'].map(header => (
                    <th key={header} className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-500">Loading users...</td></tr>
                ) : apiError ? (
                  <tr><td colSpan={8} className="text-center py-10 text-red-500">{apiError}</td></tr>
                ) : currentUsers.length > 0 ? currentUsers.map((user, index) => (
                  <tr key={user._id} className={index % 2 === 0 ? 'bg-white' : 'bg-green-50/50 hover:bg-green-100/50'}>
                    
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                            onClick={() => {
                                setSelectedUserProfile(user);
                                setIsProfileModalOpen(true);
                            }}
                            className="items-end w-full sm:w-auto px-6 py-2.5 text-base sm:text-lg md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-7L700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                            {user.username}
                        </button>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{formatRole(user.role)}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.points}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(user.lastlogin)}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => { setSelectedUser(user); setView('lockStatus'); }} 
                        className={`items-end w-full sm:w-auto px-6 py-2.5 text-base sm:text-lg md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-7L700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed ${
                            (user.lock_status || 'unlocked') === 'locked' 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {(user.lock_status || 'unlocked').toUpperCase()}
                      </button>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                        {(user.status || 'N/A').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={handleNavigation}
                        className="items-end w-full sm:w-auto px-6 py-2.5 text-base sm:text-lg md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-7L700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
                      >
                        Transfer Points
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* --- Pagination (styling simplified) --- */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <span className="text-sm text-gray-700 mb-2 sm:mb-0">Page {currentPage} of {totalPages}</span>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1} 
                    className="items-end w-full sm:w-auto px-6 py-2.5 text-base sm:text-lg md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-7L700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages} 
                    className="ml-3 items-end w-full sm:w-auto px-6 py-2.5 text-base sm:text-lg md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-7L700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
                >
                    Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SearchUsers;