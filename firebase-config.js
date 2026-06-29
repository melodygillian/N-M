// ============================================================
//  FIREBASE CONFIGURATION
//  Follow SETUP.md to get your own values and paste them here
// ============================================================

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWd_VnlnBVohkMiO9NXuwYAFXxGPYHYOA",
  authDomain: "n-m-site.firebaseapp.com",
  databaseURL: "https://n-m-site-default-rtdb.firebaseio.com",
  projectId: "n-m-site",
  storageBucket: "n-m-site.firebasestorage.app",
  messagingSenderId: "132917603861",
  appId: "1:132917603861:web:54be9fbe0caf8141ec681c",
  measurementId: "G-X4DREMYXQW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();
