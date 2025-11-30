import React from 'react';
import ReactDOM from 'react-dom';

interface UserData {
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  wallet_amount?: number;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, userData }) => {
  if (!isOpen) {
    return null;
  }
  
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      
      {/* The modal card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md m-4 animate-fade-in-scale">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">User Profile</h2>
          <button 
            onClick={onClose} 
            className="md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg 
                           bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 
                           focus:outline-none focus:ring-4 focus:ring-green-300 
                           disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body - Profile Details */}
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-500">Name</label>
            <p className="text-lg font-semibold text-gray-900">{userData.name || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email Address</label>
            <p className="text-lg font-semibold text-gray-900">{userData.email || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Role</label>
            <p className="text-lg font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full inline-block">{userData.role || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Phone Number</label>
            <p className="text-lg font-semibold text-gray-900">{userData.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Wallet</label>
            <p className="text-lg font-semibold text-gray-900">{userData.wallet_amount || 'N/A'}</p>
          </div>
        </div>

      </div>
    </div>,
    modalRoot
  );
}

export default ProfileModal;