"use client"

import { useEffect, useRef } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, addDoc, serverTimestamp, query, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

const SAMPLE_MATERIALS = [
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    type: "Book",
    category: "General",
  },
  {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    type: "Book",
    category: "Academic",
  },
  {
    title: "The Yellow Wallpaper",
    author: "Charlotte Perkins Gilman",
    type: "Story",
    category: "General",
  },
  {
    title: "Nature",
    author: "Ralph Waldo Emerson",
    type: "Journal",
    category: "General",
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    type: "Book",
    category: "General",
  },
]

export function DbSeeder() {
  const { toast } = useToast()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    console.log("🚀 DbSeeder mounted")

    const seed = async () => {
      console.log("🔥 Seeder function started")

      const ref = collection(db, "materials")
      const snap = await getDocs(query(ref, limit(1)))

      if (!snap.empty) {
        console.log("✅ Firestore already seeded")
        return
      }

      console.log("📚 Seeding Firestore...")
      toast({ title: "Setting up your library..." })

      await Promise.all(
        SAMPLE_MATERIALS.map(item =>
          addDoc(ref, {
            ...item,
            approved: true,
            createdAt: serverTimestamp(),
          })
        )
      )

      toast({ title: "Library ready!" })
    }

    seed()
  }, [toast])

  return null
}
