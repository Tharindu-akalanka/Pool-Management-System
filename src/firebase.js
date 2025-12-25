import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDb27yu5CNyDeMfACsFdJPxOvTQHHD5gmE",
    authDomain: "pool-management-system-cf2fa.firebaseapp.com",
    projectId: "pool-management-system-cf2fa",
    storageBucket: "pool-management-system-cf2fa.firebasestorage.app",
    messagingSenderId: "361899505232",
    appId: "1:361899505232:web:3f0572b1c47e15e1634355",
    measurementId: "G-LS137KTYWX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
