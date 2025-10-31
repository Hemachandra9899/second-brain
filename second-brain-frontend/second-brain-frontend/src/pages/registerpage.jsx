import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearRegisterError } from '../redux/aothSlice.js'; // ✅ adjust path if needed
import { useNavigate,Link } from 'react-router-dom';
export const RegisterPage = () => {
    const dispatch = useDispatch();

    // ✅ use the correct slice name key from your store
    const { loading, error, isAuth, user } = useSelector((state) => state.aoth);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = (e) => {
        e.preventDefault();
        dispatch(clearRegisterError());
        dispatch(registerUser(formData));
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
                <h1 className="text-3xl font-bold text-center mb-6 text-purple-400">
                    Create Account
                </h1>
                <Link to='/'><button>---- Back</button></Link>
                

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            className="w-full p-3 bg-gray-800 rounded-md border border-gray-700 
                                       focus:border-purple-500 focus:ring focus:ring-purple-400 
                                       focus:ring-opacity-30 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className="w-full p-3 bg-gray-800 rounded-md border border-gray-700 
                                       focus:border-purple-500 focus:ring focus:ring-purple-400 
                                       focus:ring-opacity-30 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            className="w-full p-3 bg-gray-800 rounded-md border border-gray-700 
                                       focus:border-purple-500 focus:ring focus:ring-purple-400 
                                       focus:ring-opacity-30 outline-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full p-3 mt-3 font-semibold rounded-md transition-all duration-300 ${
                            loading
                                ? 'bg-gray-700 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                {/* ✅ Show error */}
                {error && (
                    <p className="mt-4 text-red-400 text-sm text-center bg-gray-800 p-2 rounded">
                        {error}
                    </p>
                )}

                {/* ✅ Show success */}
                {isAuth && user && (
                    <p className="mt-4 text-green-400 text-sm text-center bg-gray-800 p-2 rounded">
                        🎉 Welcome, {user.name || 'User'}! Registration successful.
                    </p>
                )}
            </div>
        </div>
    );
};

export default RegisterPage;
