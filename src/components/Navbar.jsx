import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-blue-600 shadow-md">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
                            <img src="/logo.png" alt="Logo" className="h-8 w-8 bg-white rounded-full p-0.5" />
                            Pool Booking
                        </Link>
                    </div>
                    <div className="block">
                        <div className="flex items-center ml-10 space-x-4">
                            {user ? (
                                <>
                                    <Link to="/dashboard" className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-blue-700">Dashboard</Link>
                                    {user.role === 'admin' && (
                                        <Link to="/admin" className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-blue-700">Admin</Link>
                                    )}
                                    {user.role === 'coach' && (
                                        <Link to="/attendance" className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-blue-700">Attendance</Link>
                                    )}
                                    <span className="text-sm text-blue-200">Hi, {user.name}</span>
                                    <button
                                        onClick={handleLogout}
                                        className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-blue-700">Login</Link>
                                    <Link to="/register" className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Register</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
