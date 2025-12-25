import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { storage } from '../firebase'; // Ensure initialized
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student', // default
        studentId: '',
    });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        setError('');

        let photoURL = '';

        try {
            // Upload File if exists
            if (file) {
                // Generate a unique filename: uid-timestamp
                // However, we don't have UID yet. We can use date-random or just upload after auth creation?
                // Problem: 'register' function creates auth.
                // Approach: Upload with a temp name or just random ID, then save URL.
                const storageRef = ref(storage, `profile_pictures/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                photoURL = await getDownloadURL(storageRef);
            }

            const res = await register({ ...formData, photoURL });

            if (res.success) {
                navigate('/dashboard');
            } else {
                setError(res.message);
            }
        } catch (err) {
            console.error(err);
            setError('Upload failed or Registration error. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <h2 className="mb-6 text-2xl font-bold text-center text-blue-600">Register for PMS</h2>
                {error && <div className="p-2 mb-4 text-sm text-red-700 bg-red-100 rounded">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700">Name</label>
                        <input
                            type="text"
                            name="name"
                            className="w-full px-3 py-2 border rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="w-full px-3 py-2 border rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="w-full px-3 py-2 border rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700">Profile Picture (Optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full px-3 py-2 border rounded shadow bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700">Role</label>
                        <select
                            name="role"
                            className="w-full px-3 py-2 border rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="student">Student</option>
                            <option value="staff">Staff</option>
                            <option value="coach">Coach</option>
                        </select>
                    </div>
                    {(formData.role === 'student' || formData.role === 'staff') && (
                        <div className="mb-6">
                            <label className="block mb-2 text-sm font-bold text-gray-700">ID / Registration No.</label>
                            <input
                                type="text"
                                name="studentId"
                                className="w-full px-3 py-2 border rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.studentId}
                                onChange={handleChange}
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={uploading}
                        className={`w-full px-4 py-2 font-bold text-white transition rounded ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {uploading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-600">
                    Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
