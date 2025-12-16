"use client"

console.log("[v0] user-context.tsx loading...")

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { type User as FirebaseUser, onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./firebase"

console.log("[v0] user-context.tsx imports successful, auth:", !!auth, "db:", !!db)

interface UserData {
  userId: string
  name: string
  email: string
  role: "user" | "admin"
  createdAt: any
}

interface UserContextType {
  user: FirebaseUser | null
  userData: UserData | null
  loading: boolean
  isAdmin: boolean
}

const UserContext = createContext<UserContextType>({
  user: null,
  userData: null,
  loading: true,
  isAdmin: false,
})

export const useUser = () => useContext(UserContext)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        // Get or create user document
        const userDocRef = doc(db, "Users", firebaseUser.uid)
        const userDoc = await getDoc(userDocRef)

        if (!userDoc.exists()) {
          // Create new user document
          const newUserData: UserData = {
            userId: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            email: firebaseUser.email || "",
            role: "user",
            createdAt: serverTimestamp(),
          }
          await setDoc(userDocRef, newUserData)
          setUserData(newUserData)
        } else {
          setUserData(userDoc.data() as UserData)
        }
      } else {
        setUserData(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const isAdmin = userData?.role === "admin"

  return <UserContext.Provider value={{ user, userData, loading, isAdmin }}>{children}</UserContext.Provider>
}
