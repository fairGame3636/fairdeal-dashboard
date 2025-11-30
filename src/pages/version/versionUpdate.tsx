import React, { useState, useEffect } from 'react';
import { XCircle, CheckCircle } from 'lucide-react';
import ConfigService from '../../services/configServices';

function AppVersionControl() {
  // --- State and Effects (No Change) ---
  const [version, setVersion] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    if (successMessage || error) {
      timer = window.setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000); 
    }
    return () => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [successMessage, error]);

  // --- Handlers (No Change) ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setSuccessMessage(null);

    const trimmedVersion = version.trim();

    if (!trimmedVersion) {
      setError('Please enter a version number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await ConfigService.updateAppVersion({ 
        version: trimmedVersion 
      });

      if (response.success && response.data) {
        setSuccessMessage(`Version updated successfully`);
        setVersion(''); 
      } else {
        setError(response.message || 'An unexpected error occurred.');
      }

    } catch (err: any) {
      console.error('Failed to update version:', err);
      setError(err.message || 'A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };  
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVersion(e.target.value);
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  // --- JSX (Updated for Mobile Responsiveness) ---
  return (
    // 🎨 CHANGED: p-4 (mobile) default, sm:p-6 and lg:p-8 for larger screens
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full font-sans">
      
      {/* 🎨 CHANGED: text-xl (mobile), md:text-3xl (dashboard). Margin mb-6 (mobile), md:mb-8 (dashboard) */}
      <h1 className="text-xl md:text-3xl font-bold text-green-800 mb-6 md:mb-8">
        App Version Control
      </h1>
      
      {/* 🎨 CHANGED: mt-8 (standard margin, fixed typo), p-5 (mobile), sm:p-6 (desktop) */}
      <div className="mt-18 bg-white p-5 sm:p-6 rounded-2xl shadow-lg border border-green-100 max-w-2xl mx-auto">
        
        <form onSubmit={handleSubmit} noValidate>
          
          <div className="mb-6 text-center space-y-4">
            {error && (
              // 🎨 CHANGED: p-2.5 (mobile) sm:p-3 (desktop)
              <p className="text-sm text-red-600 bg-red-50 p-2.5 sm:p-3 rounded-lg flex items-center justify-center gap-2">
                <XCircle size={16} />
                {error}
              </p>
            )}
            {successMessage && (
              // 🎨 CHANGED: px-4 py-2.5 (mobile) sm:py-3 (desktop)
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2.5 sm:py-3 rounded-xl relative flex items-center shadow-md" role="alert">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 flex-shrink-0" />
                <p className="text-sm lg:text-base">{successMessage}</p>
              </div>
            )}
          </div>

          <div>
            <label 
              htmlFor="version" 
              // 🎨 CHANGED: text-sm (mobile), md:text-md (dashboard)
              className="block text-sm md:text-md font-medium text-gray-700 mb-2"
            >
              Set Minimum Frontend Version
            </label>
            <input 
              type="text" 
              id="version" 
              name="version" 
              value={version}
              onChange={handleInputChange}
              placeholder="e.g., 1.1.0" 
              // 🎨 CHANGED: py-2.5 (mobile), sm:py-3 (desktop)
              className="w-full px-4 py-2.5 sm:py-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
         />
          </div>
          
          {/* 🎨 CHANGED: mt-8 (standard margin, fixed typo) */}
          <div className="mt-8 flex justify-center gap-4">
            <button 
              type="submit" 
              disabled={isSubmitting} 
              // 🎨 CHANGED: py-2.5 (mobile), md:py-3 (desktop)
              className="w-full md:w-auto px-6 py-2.5 text-base md:px-20 md:py-3 md:text-xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Version'}
           </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AppVersionControl;

