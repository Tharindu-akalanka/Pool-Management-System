import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    increment,
    serverTimestamp
} from 'firebase/firestore';
import { Calendar, Clock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const BookingPage = () => {
    const [slots, setSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [msgType, setMsgType] = useState('');

    const DEFAULT_SLOTS = [
        { name: 'Morning Slot', startTime: '08:00', endTime: '12:00', capacity: 30 },
        { name: 'Afternoon Slot', startTime: '13:00', endTime: '17:00', capacity: 30 }
    ];

    useEffect(() => {
        const fetchSlots = async () => {
            try {
                // 1. Check Global Closures first
                const closureQ = query(collection(db, "closures"), where("date", "==", selectedDate));
                const closureSnap = await getDocs(closureQ);

                if (!closureSnap.empty) {
                    // Entire day is closed
                    const reason = closureSnap.docs[0].data().reason || "Pool Closed";
                    setSlots(DEFAULT_SLOTS.map(s => ({ ...s, isClosed: true, isVirtual: true, bookedCount: 0, closureReason: reason })));
                    setMessage(`Closed: ${reason}`);
                    setMsgType('error');
                    return;
                } else {
                    // Clear previous error if date changes to open day
                    setMessage('');
                    setMsgType('');
                }

                const q = query(collection(db, "slots"), where("date", "==", selectedDate));
                const querySnapshot = await getDocs(q);
                const dbSlots = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Merge Defaults with DB Slots
                const finalSlots = DEFAULT_SLOTS.map(def => {
                    const found = dbSlots.find(s => s.name === def.name);
                    if (found) return found; // Use DB version if exists (has bookings/closure)
                    return { ...def, id: 'virtual-' + def.name, bookedCount: 0, isClosed: false, isVirtual: true };
                });

                setSlots(finalSlots);
            } catch (error) {
                console.error(error);
            }
        };
        fetchSlots();
    }, [selectedDate]);

    const handleBook = async (slot) => {
        if (!user) { navigate('/login'); return; }

        // Day Validation
        const day = new Date(selectedDate).getDay();
        if (day === 0 || day === 6) { // Weekends Closed
            setMsgType('error');
            setMessage('Pool is closed on Weekends.');
            return;
        }

        // Role Restrictions
        if (user.role === 'student' && day === 5) { // Friday
            setMsgType('error');
            setMessage('Students cannot book on Fridays (Staff only).');
            return;
        }
        if (user.role === 'staff' && day !== 5) {
            setMsgType('error');
            setMessage('Staff slots are only available on Fridays.');
            return;
        }

        setLoading(true);
        setMessage('');
        setMsgType('');

        try {
            // Check existing bookings
            const bookingQ = query(
                collection(db, "bookings"),
                where("userId", "==", user.uid),
                where("date", "==", selectedDate),
                where("status", "==", "booked")
            );
            const existing = await getDocs(bookingQ);
            if (!existing.empty) throw new Error('You already have a booking for this date.');

            let realSlotId = slot.id;

            // LAZY CREATION: If virtual, create slot first
            if (slot.isVirtual) {
                const slotRef = await addDoc(collection(db, "slots"), {
                    name: slot.name,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    date: selectedDate,
                    capacity: slot.capacity,
                    bookedCount: 0,
                    isClosed: false
                });
                realSlotId = slotRef.id;
            }

            // Create Booking
            await addDoc(collection(db, "bookings"), {
                userId: user.uid,
                slotId: realSlotId,
                slotName: slot.name,
                slotTime: `${slot.startTime} - ${slot.endTime}`,
                date: selectedDate,
                status: 'booked',
                attended: false,
                createdAt: serverTimestamp(),
                qrCodeData: `${user.uid}-${realSlotId}-${Date.now()}`
            });

            // Increment Count
            await updateDoc(doc(db, "slots", realSlotId), {
                bookedCount: increment(1)
            });

            setMsgType('success');
            setMessage('Booking Confirmed! (1/30)'); // Immediate feedback
            setTimeout(() => navigate('/dashboard'), 1500);

            // Optimistic UI Update
            setSlots(prev => prev.map(s => {
                if (s.name === slot.name) {
                    return {
                        ...s,
                        isVirtual: false,
                        id: realSlotId,
                        bookedCount: (s.bookedCount || 0) + 1
                    };
                }
                return s;
            }));

        } catch (error) {
            setMsgType('error');
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 font-sans text-slate-900">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Book a Session</h2>
                <p className="text-slate-500 mt-1 font-medium">Select a date. Weekdays are open 08:00 - 17:00.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Date</label>
                <div className="relative max-w-sm">
                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                        type="date"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${msgType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {msgType === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-bold text-sm">{message}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {slots.map((slot) => {
                    const isFull = (slot.bookedCount || 0) >= slot.capacity;
                    const fillPercent = ((slot.bookedCount || 0) / slot.capacity) * 100;
                    const isClosed = slot.isClosed;

                    return (
                        <div key={slot.id || slot.name} className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all hover:shadow-lg ${isClosed ? 'opacity-60 grayscale' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
                                    <Clock className="w-6 h-6" />
                                </div>
                                {isClosed ? (
                                    <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full uppercase">CLOSED</span>
                                ) : isFull ? (
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full uppercase">Full</span>
                                ) : (
                                    <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full uppercase">Open</span>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-1">{slot.name}</h3>
                            <p className="text-slate-500 font-medium text-sm mb-6">{slot.startTime} - {slot.endTime}</p>

                            {/* Progress Bar with "1/30" text as requested */}
                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Occupancy</span>
                                    <span className={isFull ? 'text-red-500' : 'text-slate-600'}>{slot.bookedCount || 0} / {slot.capacity}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-400' : 'bg-sky-500'}`}
                                        style={{ width: `${Math.min(fillPercent, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => handleBook(slot)}
                                disabled={loading || isFull || isClosed}
                                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                            ${loading || isFull || isClosed
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-slate-900 text-white hover:bg-sky-500 hover:shadow-lg'
                                    }`}
                            >
                                {isClosed ? 'Pool Closed' : isFull ? 'Slot Full' : 'Book Now'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BookingPage;
