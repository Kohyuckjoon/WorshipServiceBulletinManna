// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // 추가
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB1jAZI4vimjNIMNUUwScSAdcSUMiZdmcQ",
  authDomain: "mannayouthbulletinonline.firebaseapp.com",
  projectId: "mannayouthbulletinonline",
  storageBucket: "mannayouthbulletinonline.firebasestorage.app",
  messagingSenderId: "905546238842",
  appId: "1:905546238842:web:1ce99f67b822096a0a24c3",
  measurementId: "G-TDLL8YP15T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// db database 접근
export const db = getFirestore(app);

// 인증 기능
export const auth = getAuth(app);