import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
