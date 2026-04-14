import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, onSnapshot, getDocs, updateDoc, runTransaction } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// TODO: Replace this with your actual firebaseConfig from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyD9TUsL3m_6rqZ3i-w6LdRKoGhbaspQOjU",
  authDomain: "pitch-er-perfect-2.firebaseapp.com",
  projectId: "pitch-er-perfect-2",
  storageBucket: "pitch-er-perfect-2.firebasestorage.app",
  messagingSenderId: "574083811674",
  appId: "1:574083811674:web:134c6eb2f52f5354ff4b63",
  measurementId: "G-CY0NQX853S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { 
  auth, db, 
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
  collection, doc, getDoc, setDoc, onSnapshot, getDocs, updateDoc, runTransaction
};
