import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyAn_G7Na0l4S5Q30o41fnduDMXsGPOeiuk",
  authDomain: "studio-1431562460-90f23.firebaseapp.com",
  projectId: "studio-1431562460-90f23",
  storageBucket: "studio-1431562460-90f23.firebasestorage.app",
  messagingSenderId: "653033335338",
  appId: "1:653033335338:web:d3f674c9ba75bcd0207153",
}

// ✅ FIXED logic
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp()

const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)
const googleProvider = new GoogleAuthProvider()

export { app, auth, db, storage, googleProvider }
