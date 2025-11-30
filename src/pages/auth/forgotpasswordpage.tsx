import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthServices';

// Interface for form errors
interface FormErrors {
    username?: string;
    password?: string;
    confirm_password?: string;
}

function ForgotPasswordPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirm_password: '',
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
        if (formData.password.length < 4) newErrors.password = 'Password must be at least 4 characters';
        if (!formData.confirm_password) newErrors.confirm_password = 'Please confirm your password';
        if (formData.password && formData.confirm_password && formData.password !== formData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setIsSubmitting(true);
            setApiError(null);

            const response = await AuthService.publicForgotPassword(formData);
            setIsSubmitting(false);

            if (response.success) {
                setSuccessMessage('Password reset! Redirecting to login...');
                setTimeout(() => {
                    navigate('/'); // Redirect to login page
                }, 2000);
            } else {
                setApiError(response.message);
            }
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-10">
                    {/* ... (You can copy the header/logo from LoginPage) ... */}
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Reset Password</h1>
                    <p className="text-sm md:text-lg text-gray-600">Enter your username and new password.</p>
                </div>

                <div className="bg-white border-2 border-green-200 rounded-2xl shadow-xl p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Username Field */}
                        <div className="flex flex-col md:flex-row md:items-start">
                            <div className="w-full mb-2 text-left md:mb-0 md:w-1/3 md:pt-2">
                                <label htmlFor="username" className="text-sm md:text-lg font-semibold text-gray-800">Username:</label>
                            </div>
                            <div className="w-full md:w-2/3">
                                <input id="username" name="username" type="text" required value={formData.username} onChange={handleInputChange}
                                    className={`w-full px-3 py-2 text-sm md:text-base border-2 rounded-lg ${errors.username ? 'border-red-400' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'}`}
                                    placeholder="Enter your username"
                                />
                                {errors.username && <p className="mt-2 text-xs md:text-sm text-left text-red-600 font-medium">{errors.username}</p>}
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col md:flex-row md:items-start">
                            <div className="w-full mb-2 text-left md:mb-0 md:w-1/3 md:pt-2">
                                <label htmlFor="password" className="text-sm md:text-lg font-semibold text-gray-800">New Password:</label>
                            </div>
                            <div className="w-full md:w-2/3">
                                <input id="password" name="password" type="password" required value={formData.password} onChange={handleInputChange}
                                    className={`w-full px-3 py-2 text-sm md:text-base border-2 rounded-lg ${errors.password ? 'border-red-400' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'}`}
                                    placeholder="Enter new password"
                                />
                                {errors.password && <p className="mt-2 text-xs md:text-sm text-left text-red-600 font-medium">{errors.password}</p>}
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="flex flex-col md:flex-row md:items-start">
                            <div className="w-full mb-2 text-left md:mb-0 md:w-1/3 md:pt-2">
                                <label htmlFor="confirm_password" className="text-sm md:text-lg font-semibold text-gray-800">Confirm Password:</label>
                            </div>
                            <div className="w-full md:w-2/3">
                                <input id="confirm_password" name="confirm_password" type="password" required value={formData.confirm_password} onChange={handleInputChange}
                                    className={`w-full px-3 py-2 text-sm md:text-base border-2 rounded-lg ${errors.confirm_password ? 'border-red-400' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'}`}
                                    placeholder="Confirm new password"
                                />
                                {errors.confirm_password && <p className="mt-2 text-xs md:text-sm text-left text-red-600 font-medium">{errors.confirm_password}</p>}
                            </div>
                        </div>

                        {/* ... (Copy APIError and SuccessMessage sections from LoginPage) ... */}
                        {apiError && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3" role="alert">
                                <p className="font-bold text-sm">Error</p>
                                <p className="text-sm">{apiError}</p>
                            </div>
                        )}
                        {successMessage && (
                             <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3" role="alert">
                                <p className="font-bold text-sm">Success</p>
                                <p className="text-sm">{successMessage}</p>
                            </div>
                        )}


                        {/* Submit Button */}
                        <div className="mt-15 flex justify-center pt-4">
                            <button type="submit" disabled={isSubmitting || !!successMessage}
                                className="items-end w-full md:w-auto px-8 md:px-24 py-3 md:py-4 text-xl md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-400 disabled:scale-100 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>

                    
                    <div className="text-center mt-8">
                        <Link to="/" className="font-medium text-green-600 hover:text-green-500">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;