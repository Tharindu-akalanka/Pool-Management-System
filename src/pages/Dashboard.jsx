import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import { Clock, Users, ArrowRight, Activity, Bell, Radio } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [slots, setSlots] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [activeOccupancy, setActiveOccupancy] = useState(0);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Date Logic
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
    const isFriday = dayOfWeek === 5;
    const maxCapacity = 60;

    // Active Coach Logic (8 AM - 5 PM)
    const currentHour = new Date().getHours();
    const isWorkingHours = currentHour >= 8 && currentHour < 17;

    const coachSchedule = {
        1: { name: 'Coach Perera', image: 'Coach' }, // Monday
        2: { name: 'Coach Sadun', image: 'Sadun' }, // Tuesday
        3: { name: 'Coach Disanayake', image: 'Disanayake' }, // Wednesday
        4: { name: 'Coach Asanka', image: 'Asanka' }, // Thursday
        5: { name: 'Coach Dilan', image: 'Dilan' }, // Friday
    };

    const activeCoach = isWorkingHours && coachSchedule[dayOfWeek]
        ? coachSchedule[dayOfWeek]
        : null;

    // Load Slots
    useEffect(() => {
        // For students, always show today. For staff, show selectedDate.
        const queryDate = (user?.role === 'staff' || user?.role === 'admin') ? selectedDate : today;

        const q = query(collection(db, "slots"), where("date", "==", queryDate));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const slotsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            slotsData.sort((a, b) => a.startTime.localeCompare(b.startTime));
            setSlots(slotsData);

            // Calculate active occupancy only for TODAY
            if (queryDate === today) {
                const totalBooked = slotsData.reduce((acc, slot) => acc + (slot.bookedCount || 0), 0);
                setActiveOccupancy(totalBooked);
            }
        });
        return () => unsubscribe();
    }, [selectedDate, user, today]);

    // Load My Bookings
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "bookings"), where("userId", "==", user.uid), where("status", "==", "booked"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMyBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    // Coach View (Staff)
    if (user && (user.role === 'staff' || user.role === 'admin')) {
        return (
            <div className="space-y-8 font-sans text-slate-900">
                <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Coach Dashboard</h2>
                        <p className="text-slate-500 mt-1 font-medium">Overview of sessions and bookings.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-slate-500">Select Date:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5 font-bold shadow-sm"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Bookings for <span className="text-sky-600">{selectedDate}</span></h3>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total: {slots.reduce((acc, s) => acc + (s.bookedCount || 0), 0)} Students</span>
                    </div>

                    {slots.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            No slots scheduled/active for this date.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Time Slot</th>
                                        <th className="px-6 py-4">Slot Name</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Occupancy</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {slots.map((slot) => (
                                        <tr key={slot.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900 tabular-nums">
                                                {slot.startTime} - {slot.endTime}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-700">{slot.name}</td>
                                            <td className="px-6 py-4">
                                                {slot.isClosed ? (
                                                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold uppercase">Closed</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-bold uppercase">Active</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-700">{slot.bookedCount || 0}</span>
                                                    <span className="text-xs text-slate-400">/ {slot.capacity}</span>
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-2">
                                                        <div
                                                            className="h-full bg-sky-500 rounded-full"
                                                            style={{ width: `${Math.min(((slot.bookedCount || 0) / slot.capacity) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Student View (Standard)
    return (
        <div className="space-y-8 font-sans text-slate-900">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h2>
                    <p className="text-slate-500 mt-1 font-medium">Welcome back, {user?.name.split(' ')[0]} 👋</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="relative p-2 text-slate-400 hover:text-sky-500 transition-colors">
                        <Bell className="w-6 h-6" />
                        <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</p>
                        <p className="text-sm font-bold text-slate-900">{new Date().toDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Glassmorphism Alert */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 p-1 shadow-lg shadow-sky-200">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6 text-white border border-white/20">
                    <div className="p-3 bg-white/20 rounded-full animate-pulse">
                        <Radio className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold">Special Notice</h3>
                            <span className="text-sky-200 opacity-60">|</span>
                            <h3 className="text-lg font-bold font-sinhala">විශේෂ දැන්වීමයි</h3>
                        </div>
                        <p className="text-sky-100/90 text-sm leading-relaxed max-w-2xl">
                            The pool will be closed for maintenance next Sunday.
                            <br />
                            <span className="opacity-80 font-sinhala">කරුණාකර ඊළඟ ඉරිදා පිහිනුම් තටාකය වසා තබන බව සලකන්න.</span>
                        </p>
                    </div>
                    <div className="px-4 py-2 bg-white/20 rounded-lg text-xs font-bold uppercase tracking-wider text-white">
                        Live Update
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Occupancy Card (Circular) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform"></div>
                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-4">Total Occupancy</h3>
                    <div className="flex items-center gap-6">
                        {/* Simple Circular Progress with SVG */}
                        <div className="relative w-20 h-20">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="40" cy="40" r="36" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                                <circle cx="40" cy="40" r="36" stroke="#38bdf8" strokeWidth="8" fill="transparent"
                                    strokeDasharray={`${(activeOccupancy / maxCapacity) * 226} 226`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900">
                                {Math.round((activeOccupancy / maxCapacity) * 100)}%
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold text-slate-900">{activeOccupancy} <span className="text-base text-slate-400 font-medium">/ {maxCapacity}</span></div>
                            <p className="text-xs text-sky-500 font-bold mt-1">Users Checked In</p>
                        </div>
                    </div>
                </div>

                {/* Active Coach */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-4">Active Coach</h3>
                    <div className="flex items-center gap-4">
                        {activeCoach ? (
                            <>
                                <div className="w-16 h-16 rounded-full bg-slate-200 border-4 border-white shadow-lg overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCoach.image}`} alt="Coach" className="w-full h-full" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-slate-900">{activeCoach.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                        </span>
                                        <span className="text-xs font-bold text-green-600 uppercase tracking-wide">On Duty</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-slate-100 border-4 border-white shadow-inner flex items-center justify-center">
                                    <Users className="w-8 h-8 text-slate-300" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-slate-400">No Coach</p>
                                    <p className="text-xs text-slate-400">8 AM - 5 PM Weekdays</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-4">System Status</h3>
                    <div className="flex flex-col h-20 justify-center">
                        <div className="flex items-center gap-3">
                            <Activity className="w-8 h-8 text-green-500" />
                            <span className="text-2xl font-extrabold text-slate-900">Online</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 font-medium">Synced just now</p>
                    </div>
                </div>
            </div>

            {/* Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Slots Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-900">Today's Slots</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {slots.length === 0 && (
                            <div className="col-span-2 p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                                <p className="text-slate-400 font-medium">No slots scheduled for today.</p>
                            </div>
                        )}
                        {slots.map((slot) => {
                            const isFull = (slot.bookedCount || 0) >= slot.capacity;
                            const isRestricted = user?.role === 'student' && isFriday;
                            const fillPercent = ((slot.bookedCount || 0) / slot.capacity) * 100;

                            return (
                                <div key={slot.id} className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-sky-200 ${isRestricted || isFull ? 'opacity-70' : ''}`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full mb-2 uppercase tracking-wide">
                                                {slot.name}
                                            </span>
                                            <h4 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                                {slot.startTime}
                                                <ArrowRight className="w-4 h-4 text-slate-300" />
                                                {slot.endTime}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Capacity */}
                                    <div className="space-y-2 mb-6">
                                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            <span>Capacity</span>
                                            <span>{slot.bookedCount}/{slot.capacity}</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${isFull ? 'bg-slate-400' : 'bg-sky-500'}`}
                                                style={{ width: `${Math.min(fillPercent, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        disabled={isFull || isRestricted}
                                        className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide shadow-lg transition-all transform active:scale-95
                                            ${isFull
                                                ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                                                : isRestricted
                                                    ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sky-200 hover:shadow-sky-300'
                                            }`}
                                    >
                                        {isFull ? 'FULL' : isRestricted ? 'STAFF ONLY' : 'BOOK NOW'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* My Schedule (Empty State) */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900">Your Schedule</h3>
                    <div className="bg-white rounded-2xl border border-slate-100 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                        {myBookings.length > 0 ? (
                            <div className="w-full space-y-4">
                                {myBookings.map(b => (
                                    <div key={b.id} className="p-4 bg-sky-50 rounded-xl border border-sky-100 text-left">
                                        <p className="font-bold text-sky-900">{b.slotName}</p>
                                        <p className="text-sm text-sky-700">{b.slotTime}</p>
                                        <div className="mt-2 text-xs font-bold text-sky-500 uppercase tracking-wider bg-white inline-block px-2 py-1 rounded">Confirmed</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <Clock className="w-12 h-12 text-slate-300" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 mb-2">No active bookings</h4>
                                <p className="text-slate-400 text-sm leading-relaxed max-w-[200px]">
                                    You haven't booked any slots yet. Check the available times and jump in!
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
