// src/components/Dashboard.jsx
import { useState, useEffect } from 'react';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get user data from localStorage (simplified version)
        const token = localStorage.getItem('token');

        if (!token) {
            window.location.href = '/';
            return;
        }

        // For demo purposes, we'll just set a default user
        // In a real app, you'd decode the JWT or fetch from the API
        setUser({
            name: 'Demo User',
            email: 'user@example.com',
            createdAt: new Date().toISOString()
        });
        setLoading(false);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-cyan-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-white">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <header className="bg-gray-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-300">Welcome, {user?.name}</span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">User Profile</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium mb-1">Full Name</h3>
                            <p className="text-white">{user?.name}</p>
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium mb-1">Email Address</h3>
                            <p className="text-white">{user?.email}</p>
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium mb-1">Member Since</h3>
                            <p className="text-white">{new Date(user?.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium mb-1">Account Status</h3>
                            <p className="text-green-500">Active</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Welcome to Your Dashboard</h2>
                    <p className="text-gray-300">
                        This is a simplified dashboard that doesn't rely on backend API calls.
                        In a real application, you would fetch user data from your backend API.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;