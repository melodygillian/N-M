const firebaseConfig = {
  apiKey: "AIzaSyAWd_VnlnBVohkMiO9NXuwYAFXxGPYHYOA",
  authDomain: "n-m-site.firebaseapp.com",
  databaseURL: "https://n-m-site-default-rtdb.firebaseio.com",
  projectId: "n-m-site",
  storageBucket: "n-m-site.firebasestorage.app",
  messagingSenderId: "132917603861",
  appId: "1:132917603861:web:54be9fbe0caf8141ec681c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
// const storage = firebase.storage();
