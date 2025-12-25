import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, LifeBuoy, LogOut, Settings } from 'lucide-react';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    let navItems = [];

    if (user && user.role === 'admin') {
        navItems = [
            { label: 'Dashboard', path: '/admin', icon: LayoutDashboard }, // Admin Panel as main Dashboard
            { label: 'Bookings', path: '/book', icon: Calendar },
            { label: 'Staff', path: '/attendance', icon: Users },
            { label: 'My Profile', path: '/profile', icon: Users },
        ];
    } else {
        // Standard view for Student/Coach
        navItems = [
            { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { label: 'Bookings', path: '/book', icon: Calendar },
            { label: 'My Profile', path: '/profile', icon: Users },
        ];

        if (user && user.role === 'coach') {
            navItems.splice(2, 0, { label: 'Staff', path: '/attendance', icon: Users });
        }
    }

    const handleLogout = async () => {
        await logout();
        window.location.href = '/login'; // Force full redirect to ensure state clear
    };

    return (
        <div className="flex flex-col h-screen w-72 bg-slate-900 text-slate-300 border-r border-slate-800 shadow-2xl">
            {/* Logo Area */}
            <div className="p-8 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-500/10 rounded-lg">
                        <LifeBuoy className="w-8 h-8 text-sky-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold font-sans tracking-tight text-white">PoolManager</h1>
                        <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">System v1.0</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-8 px-4 space-y-2">
                <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-medium ${isActive(item.path)
                            ? 'bg-sky-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)]'
                            : 'hover:text-white hover:bg-slate-800/50'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                        {item.label}
                    </Link>
                ))}
            </div>

            {/* User Profile */}
            <div className="p-6 border-t border-slate-800/50 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-lg border-2 border-slate-900">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-sky-400 border border-slate-700 capitalize">
                            {user?.role}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent rounded-lg transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
