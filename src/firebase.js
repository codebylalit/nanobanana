// Initialize Firebase app. Fill REACT_APP_FIREBASE_* env vars in .env
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAQAlTwva11rp-G-nnnpHe-xwcY2TUz2hE",
  authDomain: "nanobanana0.firebaseapp.com",
  projectId: "nanobanana0",
  storageBucket: "nanobanana0.firebasestorage.app",
  messagingSenderId: "442236679643",
  appId: "1:442236679643:web:3ec284d5062e8fa132e3fe",
  measurementId: "G-NCWMRZQP02"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();