import { useState, useEffect, useContext } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, addDoc, deleteDoc, orderBy, getDocs } from 'firebase/firestore';
import AuthContext from '../context/AuthContext';
import {
    Users, Calendar, Bell, Shield, Activity,
    CheckCircle2, XCircle, Search, Trash2, Save
} from 'lucide-react';

const AdminPanel = () => {
    const { user } = useContext(AuthContext);

    // State
    const [occupancy, setOccupancy] = useState(0);
    const [activeCoach, setActiveCoach] = useState(null);
    const [notices, setNotices] = useState({
        title_en: '', msg_en: '',
        title_si: '', msg_si: ''
    });
    const [closureDate, setClosureDate] = useState('');
    const [closures, setClosures] = useState([]);
    const [users, setUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [attendanceFeed, setAttendanceFeed] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial Data Fetch
    useEffect(() => {
        if (!user || user.role !== 'admin') return;

        // 1. Occupancy (Today)
        const today = new Date().toISOString().split('T')[0];
        const slotsQ = query(collection(db, "slots"), where("date", "==", today));
        const unsubSlots = onSnapshot(slotsQ, (snap) => {
            const total = snap.docs.reduce((acc, d) => acc + (d.data().bookedCount || 0), 0);
            setOccupancy(total);
        });

        // 2. Closures
        const closureQ = query(collection(db, "closures"), orderBy("date", "asc"));
        const unsubClosures = onSnapshot(closureQ, (snap) => {
            setClosures(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 3. Notices
        const noticeRef = doc(db, "system_config", "global_notices");
        const unsubNotice = onSnapshot(noticeRef, (docSnap) => {
            if (docSnap.exists()) {
                setNotices(docSnap.data());
            }
        });

        // 4. Attendance Feed (Live)
        const feedQ = query(
            collection(db, "bookings"),
            where("attended", "==", true),
            where("date", "==", today),
            orderBy("attendedAt", "desc")
        );
        const unsubFeed = onSnapshot(feedQ, (snap) => {
            setAttendanceFeed(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 5. Users List
        const fetchUsers = async () => {
            const snap = await getDocs(collection(db, "users"));
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        };
        fetchUsers();

        // Active Coach Logic
        const day = new Date().getDay();
        const hour = new Date().getHours();
        if (hour >= 8 && hour < 17 && day >= 1 && day <= 5) {
            const schedule = {
                1: { name: 'Coach Perera', image: 'Coach' },
                2: { name: 'Coach Sadun', image: 'Sadun' },
                3: { name: 'Coach Disanayake', image: 'Disanayake' },
                4: { name: 'Coach Asanka', image: 'Asanka' },
                5: { name: 'Coach Dilan', image: 'Dilan' },
            };
            setActiveCoach(schedule[day]);
        } else {
            setActiveCoach(null);
        }

        return () => {
            unsubSlots();
            unsubClosures();
            unsubNotice();
            unsubFeed();
        };
    }, [user]);

    // Handlers
    const handleSaveNotices = async () => {
        try {
            await setDoc(doc(db, "system_config", "global_notices"), notices);
            alert('Notices updated successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to update notices.');
        }
    };

    const handleAddClosure = async () => {
        if (!closureDate) return;
        try {
            await addDoc(collection(db, "closures"), { date: closureDate, reason: 'Maintenance' });
            setClosureDate('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteClosure = async (id) => {
        try {
            await deleteDoc(doc(db, "closures", id));
        } catch (err) {
            console.error(err);
        }
    };

    const toggleUserBlock = async (userId, currentStatus) => {
        try {
            await updateDoc(doc(db, "users", userId), { isBlocked: !currentStatus });
            // Refresh local list manually or rely on snapshot if we switched to snapshot
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: !currentStatus } : u));
        } catch (err) {
            console.error(err);
        }
    };

    if (!user || user.role !== 'admin') return <div className="p-10 text-center text-red-600 font-bold">Access Denied</div>;

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
                <p className="text-slate-500 font-medium">System Overview & Management</p>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Real-time Occupancy */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="relative w-20 h-20 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="40" cy="40" r="36" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                            <circle cx="40" cy="40" r="36" stroke="#38bdf8" strokeWidth="8" fill="transparent"
                                strokeDasharray={`${(occupancy / 60) * 226} 226`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-900">
                            {occupancy}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-slate-500 font-bold uppercase text-xs tracking-wider">Live Occupancy</h3>
                        <p className="text-2xl font-extrabold text-slate-900">{Math.round((occupancy / 60) * 100)}% <span className="text-sm font-medium text-slate-400">Full</span></p>
                    </div>
                </div>

                {/* Coach On Duty */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow">
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCoach ? activeCoach.image : 'NoCoach'}`}
                            alt="Coach"
                            className="w-full h-full"
                        />
                    </div>
                    <div>
                        <h3 className="text-slate-500 font-bold uppercase text-xs tracking-wider">Coach On Duty</h3>
                        {activeCoach ? (
                            <p className="text-xl font-bold text-slate-900">{activeCoach.name}</p>
                        ) : (
                            <p className="text-slate-400 font-medium italic">No Active Coach</p>
                        )}
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-5 h-5 text-green-500" />
                        <span className="font-bold text-slate-900">System Healthy</span>
                    </div>
                    <p className="text-xs text-slate-500">Database connected. All systems operational.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Management */}
                <div className="space-y-8">
                    {/* Notice Board Editor */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Bell className="w-5 h-5 text-sky-500" />
                            <h2 className="text-lg font-bold text-slate-900">Notice Board Editor</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">English Message</label>
                                <input
                                    type="text"
                                    placeholder="Title"
                                    className="w-full mb-2 p-2 border border-slate-200 rounded-lg text-sm font-bold"
                                    value={notices.title_en}
                                    onChange={e => setNotices({ ...notices, title_en: e.target.value })}
                                />
                                <textarea
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                    placeholder="Body text..."
                                    rows="2"
                                    value={notices.msg_en}
                                    onChange={e => setNotices({ ...notices, msg_en: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sinhala Message</label>
                                <input
                                    type="text"
                                    placeholder="Title (Sinhala)"
                                    className="w-full mb-2 p-2 border border-slate-200 rounded-lg text-sm font-bold font-sinhala"
                                    value={notices.title_si}
                                    onChange={e => setNotices({ ...notices, title_si: e.target.value })}
                                />
                                <textarea
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm font-sinhala"
                                    placeholder="Body text (Sinhala)..."
                                    rows="2"
                                    value={notices.msg_si}
                                    onChange={e => setNotices({ ...notices, msg_si: e.target.value })}
                                />
                            </div>
                            <button
                                onClick={handleSaveNotices}
                                className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                Publish Notices
                            </button>
                        </div>
                    </div>

                    {/* Closure Management */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Calendar className="w-5 h-5 text-red-500" />
                            <h2 className="text-lg font-bold text-slate-900">Holiday & Closures</h2>
                        </div>
                        <div className="flex gap-4 mb-6">
                            <input
                                type="date"
                                className="flex-1 p-2 border border-slate-200 rounded-lg text-sm font-bold"
                                value={closureDate}
                                onChange={e => setClosureDate(e.target.value)}
                            />
                            <button
                                onClick={handleAddClosure}
                                className="px-4 py-2 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200 transition-colors"
                            >
                                Mark Closed
                            </button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {closures.map(c => (
                                <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span className="font-bold text-slate-700 text-sm">{c.date}</span>
                                    <span className="text-xs text-slate-400 font-medium uppercase">{c.reason}</span>
                                    <button onClick={() => handleDeleteClosure(c.id)} className="text-slate-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {closures.length === 0 && <p className="text-center text-slate-400 text-xs py-2">No upcoming closures.</p>}
                        </div>
                    </div>
                </div>

                {/* Right Column: Feeds & Lists */}
                <div className="space-y-8">
                    {/* Attendance Feed */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-96 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <h2 className="text-lg font-bold text-slate-900">Live Attendance Feed</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {attendanceFeed.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Activity className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="text-sm">No check-ins yet today.</p>
                                </div>
                            ) : (
                                attendanceFeed.map(feed => (
                                    <div key={feed.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${feed.userId}`} alt="" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">Student ID: {feed.userId.substring(0, 6)}...</p>
                                            <p className="text-xs text-slate-500 font-medium">{feed.slotName || 'General Slot'}</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded">Checked In</span>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {feed.attendedAt?.seconds ? new Date(feed.attendedAt.seconds * 1000).toLocaleTimeString() : 'Just now'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* User Management */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-500" />
                                <h2 className="text-lg font-bold text-slate-900">User Control</h2>
                            </div>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold"
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100">
                                        <th className="py-2 pl-2">User</th>
                                        <th className="py-2">Role</th>
                                        <th className="py-2 text-right pr-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="py-3 pl-2">
                                                <p className="text-sm font-bold text-slate-900">{u.name}</p>
                                                <p className="text-[10px] text-slate-400">{u.email}</p>
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right pr-2">
                                                {u.role !== 'admin' && (
                                                    <button
                                                        onClick={() => toggleUserBlock(u.id, u.isBlocked)}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${u.isBlocked ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                                    >
                                                        {u.isBlocked ? 'Unblock' : 'Block'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
