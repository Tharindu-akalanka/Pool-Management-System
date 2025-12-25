import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { Check, X } from 'lucide-react';

const Attendance = () => {
    const [scanResult, setScanResult] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const readerRef = useRef(null);

    useEffect(() => {
        // Initialize Scanner
        // Use a timeout to ensure DOM is ready
        const timeout = setTimeout(() => {
            if (!readerRef.current) return;

            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 5, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, onScanFailure);

            function onScanSuccess(decodedText) {
                if (scanResult !== decodedText) {
                    setScanResult(decodedText);
                    verifyAttendance(decodedText);
                    // scanner.clear(); // Optional: pause scanning after success
                }
            }

            function onScanFailure(error) {
                // handle scan failure, usually better to ignore and keep scanning
            }

            return () => {
                scanner.clear().catch(error => console.error("Failed to clear scanner", error));
            };
        }, 500);

        return () => clearTimeout(timeout);
    }, []);

    const verifyAttendance = async (userId) => {
        setStatus({ type: 'loading', message: 'Verifying booking...' });

        try {
            const today = new Date().toISOString().split('T')[0];
            const bookingsRef = collection(db, "bookings");
            const q = query(
                bookingsRef,
                where("userId", "==", userId),
                where("date", "==", today),
                where("status", "==", "booked")
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setStatus({ type: 'error', message: 'No active booking found for today!' });
                return;
            }

            // Mark the first found booking as attended
            const bookingDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, "bookings", bookingDoc.id), {
                attended: true,
                attendedAt: Timestamp.now()
            });

            setStatus({
                type: 'success',
                message: `Attendance Verified! Slot: ${bookingDoc.data().slotName} (${bookingDoc.data().slotTime})`
            });

            // Clear success message after 3 seconds
            setTimeout(() => {
                setStatus({ type: '', message: '' });
                setScanResult(null);
            }, 3000);

        } catch (error) {
            console.error("Verification error:", error);
            setStatus({ type: 'error', message: 'Verification failed. Try again.' });
        }
    };

    return (
        <div className="space-y-8 font-sans text-slate-900">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mark Attendance</h2>
                <p className="text-slate-500 mt-1 font-medium">Scan user QR code to verify booking and mark attendance.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Scanner Section */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">QR Scanner</h3>
                    <div id="reader" ref={readerRef} className="rounded-xl overflow-hidden bg-slate-100"></div>
                    <p className="text-center text-xs text-slate-400 mt-4">Point current camera at the Student ID QR Code</p>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900">Status</h3>

                    {status.message ? (
                        <div className={`p-8 rounded-2xl border-2 flex flex-col items-center justify-center text-center min-h-[250px] transition-all
                            ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                                status.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                                    'bg-sky-50 border-sky-200 text-sky-800'}`}
                        >
                            {status.type === 'success' ? (
                                <div className="p-4 bg-green-100 rounded-full mb-4">
                                    <Check className="w-12 h-12 text-green-600" />
                                </div>
                            ) : status.type === 'error' ? (
                                <div className="p-4 bg-red-100 rounded-full mb-4">
                                    <X className="w-12 h-12 text-red-600" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            )}

                            <h4 className="text-2xl font-extrabold mb-2">
                                {status.type === 'success' ? 'Verified!' :
                                    status.type === 'error' ? 'Failed' : 'Processing...'}
                            </h4>
                            <p className="font-medium text-lg max-w-xs">{status.message}</p>
                        </div>
                    ) : (
                        <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center min-h-[250px]">
                            <p className="text-slate-400 font-bold text-lg">Waiting for scan...</p>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-slate-100 p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Scan Result ID</p>
                        <p className="font-mono text-sm bg-slate-100 p-2 rounded text-slate-600 truncate">
                            {scanResult || '---'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
