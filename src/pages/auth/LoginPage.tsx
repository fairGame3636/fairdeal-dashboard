import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../../services/AuthServices';

// Client-side validation ke liye naya interface
interface FormErrors {
    username?: string;
    password?: string;
}

function LoginPage() {
    const navigate = useNavigate();

    // State updated to use username, role is removed.
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
        if (apiError) setApiError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: FormErrors = {};
        if (!formData.username) newErrors.username = 'Username is required';
        if (!formData.password) newErrors.password = 'Password is required';

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setIsSubmitting(true);
            setApiError(null);

            const response = await AuthService.login(formData);

            setIsSubmitting(false);

            if (response.success && response.data) {
                setSuccessMessage('Login successful! Redirecting...');
                localStorage.setItem('authToken', response.data.token);
                localStorage.setItem('userRole', response.data.user.role);
                localStorage.setItem('userData', JSON.stringify(response.data.user));

                setTimeout(() => {
                    const role = response.data!.user.role;
                    if (role === 'admin') navigate('/admin');
                    else if (role === 'agent') navigate('/agent');
                    else if (role === 'sub-agent') navigate('/subagent');
                }, 1500);
            } else {
                setApiError(response.message);
            }
        }
    };

    // --- The JSX below is restored to match your original design ---
    return (
        <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full">
                {/* Header Section (UI UNCHANGED) */}
                <div className="text-center mb-10">
                    <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-green-600 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Login Page</h1>
                    <p className="text-sm md:text-lg text-gray-600">Please authenticate to continue</p>
                </div>

                {/* Login Form */}
                <div className="bg-white border-2 border-green-200 rounded-2xl shadow-xl p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Username Field (Replaces Email) */}
                        <div className="mt-7 flex flex-col md:flex-row md:items-start">
                            <div className="w-full mb-2 text-left md:mb-0 md:w-1/3 md:pt-2">
                                <label htmlFor="username" className="text-sm md:text-lg font-semibold text-gray-800">
                                    Username:
                                </label>
                            </div>
                            <div className="w-full md:w-2/3">
                                <input 
                                    id="username" 
                                    name="username" 
                                    type="text" 
                                    required 
                                    value={formData.username} 
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 text-sm md:text-base border-2 rounded-lg ${errors.username ? 'border-red-400' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'}`}
                                    placeholder="Enter your username"
                                />
                                {errors.username && <p className="mt-2 text-xs md:text-sm text-left text-red-600 font-medium">{errors.username}</p>}
                            </div>
                        </div>

                        {/* Password Field (UI UNCHANGED) */}
                        <div className="flex flex-col md:flex-row md:items-start">
                            <div className="w-full mb-2 text-left md:mb-0 md:w-1/3 md:pt-2">
                                <label htmlFor="password" className="text-sm md:text-lg font-semibold text-gray-800">
                                    Password:
                                </label>
                            </div>
                            <div className="w-full md:w-2/3">
                                <input 
                                    id="password" 
                                    name="password" 
                                    type="password" 
                                    required 
                                    value={formData.password} 
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 text-sm md:text-base border-2 rounded-lg ${errors.password ? 'border-red-400' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'}`}
                                    placeholder="Enter Password"
                                />
                                {errors.password && <p className="mt-2 text-xs md:text-sm text-left text-red-600 font-medium">{errors.password}</p>}
                            </div>
                        </div>

                        {/* Display API Error (UI UNCHANGED) */}
                        {apiError && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3" role="alert">
                                <p className="font-bold text-sm">Login Failed</p>
                                <p className="text-sm">{apiError}</p>
                            </div>
                        )}

                        {/* Display Success Message (UI UNCHANGED) */}
                        {successMessage && (
                            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3" role="alert">
                                <p className="font-bold text-sm">Success</p>
                                <p className="text-sm">{successMessage}</p>
                            </div>
                        )}

                        {/* Submit Button (UI UNCHANGED) */}
                        <div className="mt-15 flex justify-center pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting || !!successMessage}
                                className="items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center space-x-3">
                                        <svg className="animate-spin h-5 w-5 md:h-6 md:w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="text-lg md:text-xl">Signing In...</span>
                                    </div>
                                ) : (
                                    <span className="tracking-wide">LOGIN</span>
                                )}
                            </button>
                        </div>

                    </form>
                </div>

                {/* Footer (UI UNCHANGED) */}
                <div className="text-center mt-8">
                    <p className="text-xs md:text-sm text-gray-600">© 2025 Company Name. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
