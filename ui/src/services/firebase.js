// ui/src/services/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: این اطلاعات را باید از کنسول Firebase پروژه خودتان کپی کنید
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXX",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:1234567890abcdef"
};

// مقداردهی اولیه برنامه Firebase
const app = initializeApp(firebaseConfig);

// گرفتن دسترسی به دیتابیس Firestore و خروجی گرفتن از آن برای استفاده در برنامه
export const db = getFirestore(app);