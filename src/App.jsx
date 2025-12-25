import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';

import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import BookingPage from './pages/BookingPage';
import AdminPanel from './pages/AdminPanel';
import Attendance from './pages/Attendance';
import Seeder from './pages/Seeder';
// Placeholders for now
// const Dashboard = () => <div className="p-10 text-2xl font-bold text-center">Dashboard (Coming Soon)</div>;
// const AdminPanel = () => <div className="p-10 text-2xl font-bold text-center">Admin Panel (Coming Soon)</div>;
// const Attendance = () => <div className="p-10 text-2xl font-bold text-center">Attendance (Coming Soon)</div>;
import { Link } from 'react-router-dom';

const Home = () => <div className="flex flex-col items-center justify-center h-screen bg-blue-50 text-blue-900"><h1 className="text-5xl font-bold mb-4">Welcome to PMS</h1><p className="text-xl">Smart Pool Management System</p><div className="mt-8"><Link to="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 font-bold mr-4">Login</Link><Link to="/register" className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg shadow hover:bg-gray-50 font-bold">Register</Link></div></div>;

function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <div className="min-h-screen bg-gray-50">
          {/* Navbar removed in favor of Sidebar Layout for protected routes */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes with Sidebar Layout */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/book" element={<BookingPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/seeder" element={<Seeder />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
