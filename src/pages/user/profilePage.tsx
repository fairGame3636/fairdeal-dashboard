import React from 'react';

// Define the type for the component's props
type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Define the type for our dummy data structure
type ProfileData = {
  name: string;
  agentId: string;
  email: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
};

// Dummy data for the profile
const profileData: ProfileData = {
  name: 'John Doe',
  agentId: 'AGENT-8821',
  email: 'john.doe@casinoapp.com',
  status: 'Active',
  lastLogin: '29/09/2025, 04:30 PM',
};

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop Overlay
    <div
      className="w-full md:w-auto px-6 py-3 text-base md:px-20 md:py-3 md:text-xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg 
                bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 
                focus:outline-none focus:ring-4 focus:ring-green-300 
                disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()} // Prevents modal from closing when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-green-800">Agent Profile</h3>
          <button
            onClick={onClose}
            className="w-full md:w-auto px-6 py-3 text-base md:px-20 md:py-3 md:text-xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg 
                bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 
                focus:outline-none focus:ring-4 focus:ring-green-300 
                disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-xl font-extrabold text-gray-800">{profileData.name}</h4>
              <p className="text-md font-medium text-green-600">{profileData.agentId}</p>
            </div>
          </div>

          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email Address</dt>
              <dd className="mt-1 text-md text-gray-900 font-semibold">{profileData.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                  {profileData.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Login</dt>
              <dd className="mt-1 text-md text-gray-900 font-semibold">{profileData.lastLogin}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;