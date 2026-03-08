import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAe0pSNl74KUW7_xcZJoRau1Y-e5SaddZc",
    authDomain: "meetsync-39a1b.firebaseapp.com",
    projectId: "meetsync-39a1b",
    storageBucket: "meetsync-39a1b.firebasestorage.app",
    messagingSenderId: "567723342998",
    appId: "1:567723342998:web:a107ae8c27971550ab16b7",
    measurementId: "G-TZWRLGFSKG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();