// src/components/AuthPanel.jsx
import { useState, useCallback } from 'react';
import axios from 'axios';

// Create an axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Your backend URL
  timeout: 10000, // 10 seconds timeout
});

// Add a request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response);
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Provide more specific error messages
    if (error.code === 'ERR_NETWORK') {
      error.customMessage = 'Unable to connect to the server. Please make sure the backend is running.';
    } else if (error.code === 'ECONNABORTED') {
      error.customMessage = 'Request timed out. Please try again.';
    } else if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      error.customMessage = error.response.data?.msg || 'Server error occurred.';
    } else if (error.request) {
      // The request was made but no response was received
      error.customMessage = 'No response from server. Please check your network connection.';
    } else {
      // Something happened in setting up the request that triggered an Error
      error.customMessage = 'An error occurred while processing your request.';
    }
    
    return Promise.reject(error);
  }
);

const InputField = ({ id, name, type, label, icon, value, onChange, error }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full px-4 pt-6 pb-2 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300 ${
            error ? 'border-red-500' : focused || value ? 'border-cyan-500' : 'border-gray-700'
          }`}
          placeholder=" "
        />
        <label
          htmlFor={id}
          className={`absolute left-4 top-4 text-gray-400 transition-all duration-300 pointer-events-none ${
            focused || value ? 'text-xs text-cyan-500 -translate-y-2' : 'text-base'
          }`}
        >
          {label}
        </label>
        <div className="absolute right-4 top-4 text-gray-500">
          {icon}
        </div>
      </div>
      {error && <p className="mt-1 text-red-400 text-sm">{error}</p>}
    </div>
  );
};

const AuthPanel = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    resetEmail: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [authError, setAuthError] = useState('');

  // Memoized input change handler for better performance
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (showForgotPassword) {
      if (!formData.resetEmail.trim()) {
        newErrors.resetEmail = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.resetEmail)) {
        newErrors.resetEmail = 'Email is invalid';
      }
    } else if (activeTab === 'signup') {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (!showForgotPassword) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, showForgotPassword, activeTab]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setAuthError('');

        if (validateForm()) {
            setIsLoading(true);

            try {
                let response;

                if (showForgotPassword) {
                    // Forgot password flow
                    response = await api.post('/auth/forgot-password', {
                        email: formData.resetEmail
                    });

                    setResetSuccess(true);
                    console.log('Password reset email sent to:', formData.resetEmail);
                } else {
                    // Login or signup flow
                    const endpoint = activeTab === 'login' ? '/auth/login' : '/auth/register';
                    const payload = activeTab === 'login'
                        ? { email: formData.email, password: formData.password }
                        : { name: formData.name, email: formData.email, password: formData.password };

                    response = await api.post(endpoint, payload);

                    // Store JWT token in localStorage
                    localStorage.setItem('token', response.data.token);

                    console.log(`${activeTab} successful:`, response.data);

                    // Redirect to dashboard after successful login
                    window.location.href = '/dashboard';
                }
            } catch (err) {
                console.error(err);
                setAuthError(err.customMessage || err.response?.data?.msg || 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        }
    }, [validateForm, showForgotPassword, activeTab, formData]);

  const handleForgotPassword = useCallback((e) => {
    e.preventDefault();
    setShowForgotPassword(true);
    setErrors({});
    setResetSuccess(false);
    setAuthError('');
  }, []);

  const handleBackToLogin = useCallback((e) => {
    e.preventDefault();
    setShowForgotPassword(false);
    setErrors({});
    setResetSuccess(false);
    setAuthError('');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
          {/* Header with animated tabs */}
          {!showForgotPassword && (
            <div className="relative">
              <div className="flex">
                <button
                  className={`flex-1 py-6 text-center font-medium transition-colors duration-300 ${
                    activeTab === 'login'
                      ? 'text-cyan-400'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  onClick={() => setActiveTab('login')}
                >
                  Sign In
                </button>
                <button
                  className={`flex-1 py-6 text-center font-medium transition-colors duration-300 ${
                    activeTab === 'signup'
                      ? 'text-cyan-400'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  onClick={() => setActiveTab('signup')}
                >
                  Register
                </button>
              </div>
              
              {/* Animated indicator */}
              <div 
                className={`absolute bottom-0 h-1 bg-cyan-500 rounded-full transition-all duration-500 ease-in-out ${
                  activeTab === 'login' ? 'left-0 w-1/2' : 'left-1/2 w-1/2'
                }`}
              ></div>
            </div>
          )}

          {/* Form content with slide animation */}
          <div className="p-8">
            <div className="mb-8 text-center">
              {showForgotPassword ? (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
                  <p className="text-gray-400">
                    {resetSuccess 
                      ? 'Check your email for reset instructions' 
                      : 'Enter your email to receive password reset instructions'}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h1>
                  <p className="text-gray-400">
                    {activeTab === 'login' 
                      ? 'Enter your credentials to access your account' 
                      : 'Fill in the details to create your account'}
                  </p>
                </>
              )}
            </div>

            {authError && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {authError}
                {authError.includes('Unable to connect to the server') && (
                  <div className="mt-2 text-xs">
                    Make sure your backend server is running on port 5000.
                  </div>
                )}
              </div>
            )}

            {resetSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Email Sent!</h3>
                <p className="text-gray-400 mb-6">
                  We've sent password reset instructions to your email address.
                </p>
                <button
                  onClick={handleBackToLogin}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {showForgotPassword ? (
                  <InputField
                    id="resetEmail"
                    name="resetEmail"
                    type="email"
                    label="Email Address"
                    value={formData.resetEmail}
                    onChange={handleInputChange}
                    error={errors.resetEmail}
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    }
                  />
                ) : (
                  <>
                    {activeTab === 'signup' && (
                      <InputField
                        id="name"
                        name="name"
                        type="text"
                        label="Full Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        error={errors.name}
                        icon={
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        }
                      />
                    )}

                    <InputField
                      id="email"
                      name="email"
                      type="email"
                      label="Email Address"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={errors.email}
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      }
                    />

                    <InputField
                      id="password"
                      name="password"
                      type="password"
                      label="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      error={errors.password}
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      }
                    />

                    {activeTab === 'signup' && (
                      <InputField
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        label="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        error={errors.confirmPassword}
                        icon={
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        }
                      />
                    )}
                  </>
                )}

                <div className="mb-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : showForgotPassword ? (
                      'Send Reset Instructions'
                    ) : activeTab === 'login' ? (
                      'Sign In'
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </form>
            )}

            {!showForgotPassword && !resetSuccess && (
              <>
                {activeTab === 'login' && (
                  <div className="text-center mb-6">
                    <button
                      onClick={handleForgotPassword}
                      className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-300"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}

                <div className="text-center">
                  <p className="text-gray-400">
                    {activeTab === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <button
                      className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-300"
                      onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
                    >
                      {activeTab === 'login' ? 'Register' : 'Sign In'}
                    </button>
                  </p>
                </div>
              </>
            )}

            {showForgotPassword && !resetSuccess && (
              <div className="text-center mt-6">
                <button
                  onClick={handleBackToLogin}
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-300"
                >
                  ← Back to Login
                </button>
              </div>
            )}

            {/* Social login - only show on main forms */}
            {!showForgotPassword && !resetSuccess && (
              <div className="mt-8">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-800 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition duration-300">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </button>
                  <button className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition duration-300">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>© 2023 MyApp. All rights reserved.</p>
          <p className="mt-1">
            <a href="#" className="hover:text-cyan-400 transition-colors duration-300">Privacy Policy</a> • 
            <a href="#" className="hover:text-cyan-400 transition-colors duration-300 ml-1">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPanel;