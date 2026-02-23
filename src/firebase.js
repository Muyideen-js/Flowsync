import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDNawcApLJ-aJxl6ap3Rrpz2wK_lnegKiY",
    authDomain: "ai-automation-7a526.firebaseapp.com",
    projectId: "ai-automation-7a526",
    storageBucket: "ai-automation-7a526.firebasestorage.app",
    messagingSenderId: "892062311707",
    appId: "1:892062311707:web:59c3bd4b348ee2ee975fbe",
    measurementId: "G-S38J96MK8Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

let analytics = null;
isSupported().then((supported) => {
    if (supported) {
        analytics = getAnalytics(app);
    }
}).catch(console.error);

export { auth, db, googleProvider, githubProvider, analytics };
export default app;
