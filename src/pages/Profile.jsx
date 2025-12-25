import { useState, useContext, useEffect, useRef } from 'react';
import AuthContext from '../context/AuthContext';
import { db, storage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import QRCode from 'react-qr-code';
import { User, Mail, Hash, Save, Check, Shield, Download, Camera } from 'lucide-react';
import html2canvas from 'html2canvas';

const Profile = () => {
    const { user } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [file, setFile] = useState(null); // New file state
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const cardRef = useRef(null);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setStudentId(user.studentId || '');
            setPhotoURL(user.photoURL || '');
        }
    }, [user]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            // Optional: Create object URL for preview
            setPhotoURL(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        try {
            let finalPhotoURL = photoURL;

            // Upload new file if selected
            if (file) {
                const storageRef = ref(storage, `profile_pictures/${user.uid}_${Date.now()}`);
                await uploadBytes(storageRef, file);
                finalPhotoURL = await getDownloadURL(storageRef);
            }

            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                name: name,
                studentId: studentId,
                photoURL: finalPhotoURL
            });

            // Update local state if successful to reflect the remote URL instead of blob
            setPhotoURL(finalPhotoURL);
            setFile(null);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        const element = cardRef.current;
        if (!element) return;

        try {
            // "Proxy" the image by converting to Base64 to bypass CORS issues within html2canvas
            const imgElement = element.querySelector('img');
            let originalSrc = '';

            if (imgElement && imgElement.src) {
                originalSrc = imgElement.src;
                try {
                    const response = await fetch(originalSrc);
                    const blob = await response.blob();
                    const base64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                    imgElement.src = base64;
                } catch (fetchErr) {
                    console.error("Image Fetch/CORS Error:", fetchErr);
                    // Continue anyway, maybe html2canvas can handle it or it will render blank
                }
            }

            const canvas = await html2canvas(element, {
                backgroundColor: '#0f172a',
                scale: 3,
                logging: false, // Turn off logging
                useCORS: true,
            });

            // Restore original image
            if (imgElement && originalSrc) {
                imgElement.src = originalSrc;
            }

            const link = document.createElement('a');
            link.download = `Pool-ID-${user.studentId || user.name.replace(/\s+/g, '-')}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (err) {
            console.error("Download failed:", err);
            // More descriptive error
            alert(`Failed to download ID. Error: ${err.message || err}`);
        }
    };

    if (!user) return <div>Loading...</div>;

    // Pre-defined avatars
    const avatars = [
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka`,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=Zack`,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=Molly`,
    ];

    // Use property directly. The handleDownload function now manually handles CORS via Base64.
    const displayPhotoURL = photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`;

    return (
        <div className="space-y-8 font-sans text-slate-900">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Profile</h2>
                <p className="text-slate-500 mt-1 font-medium">Manage your personal information and view your digital ID.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Digital ID Card Column */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-900">Digital ID</h3>
                        <button
                            onClick={handleDownload}
                            className="text-xs flex items-center gap-1 font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" /> Download JPG
                        </button>
                    </div>

                    {/* Capture Target */}
                    <div ref={cardRef} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group w-full max-w-sm mx-auto transform transition-all hover:scale-[1.02]">
                        {/* Decorative Circles */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-sky-500 opacity-10 rounded-full -ml-8 -mb-8"></div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-white p-1 rounded-full mb-4 shadow-lg overflow-hidden border-4 border-white/20">
                                <img
                                    src={displayPhotoURL}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                />
                            </div>

                            <h2 className="text-xl font-bold tracking-wide">{name}</h2>
                            <p className="text-slate-400 text-sm mb-4">{user.email}</p>

                            <div className="bg-white p-2 rounded-xl mb-4 shadow-sm inline-block">
                                <QRCode
                                    size={100}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    value={user.uid}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>

                            <div className="w-full bg-slate-800/50 rounded-xl p-3 flex justify-between items-center border border-slate-700/50 backdrop-blur-sm">
                                <div className="text-left">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Role</p>
                                    <div className="flex items-center gap-1.5 text-sky-400 font-bold text-sm capitalize">
                                        <Shield className="w-3.5 h-3.5" /> {user.role}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Student ID</p>
                                    <p className="font-mono text-sm font-bold text-white tracking-wider">
                                        {studentId || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-center text-slate-400">
                        Scan this QR code at the entrance for attendance.
                        <br />
                        <span className="opacity-70">(Click 'Download' to save as image)</span>
                    </p>
                </div>

                {/* Edit Form Column */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-slate-900">Personal Details</h3>
                    <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
                        {/* Avatar Selection */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Profile Picture</label>

                            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-sky-100 text-slate-500 group-hover:text-sky-600 transition-colors">
                                        <Camera className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-700">Upload Custom Photo</p>
                                        <p className="text-xs text-slate-400">Click to choose a file</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>

                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Or Choose an Avatar</p>
                            <div className="flex gap-4 flex-wrap">
                                {avatars.map((ava, idx) => (
                                    <button
                                        type="button"
                                        key={idx}
                                        onClick={() => { setPhotoURL(ava); setFile(null); }}
                                        className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${photoURL === ava ? 'border-sky-500 ring-2 ring-sky-200' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <img src={ava} alt={`Avatar ${idx}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Display Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Student / Staff ID</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                                        value={studentId}
                                        onChange={(e) => setStudentId(e.target.value)}
                                        placeholder="ST-12345"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        disabled
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium"
                                        value={user.email}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Email address cannot be changed for security reasons.</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all
                                    ${success
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : 'bg-slate-900 hover:bg-sky-500'
                                    } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {success ? (
                                    <>
                                        <Check className="w-4 h-4" /> Saved!
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" /> Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
};

export default Profile;
