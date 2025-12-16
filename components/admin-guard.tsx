"use client"

import type React from "react"

import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { userData, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && userData?.role !== "admin") {
      router.push("/")
    }
  }, [userData, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (userData?.role !== "admin") {
    return null
  }

  return <>{children}</>
}
