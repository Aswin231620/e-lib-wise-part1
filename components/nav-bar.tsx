"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/lib/user-context"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { BookOpen, LogOut, Upload, Shield, Library, GraduationCap, Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function NavBar() {
  const { user, userData, isAdmin } = useUser()
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut(auth)
  }

  if (pathname === "/login") {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">LibWise</span>
          </Link>

          {user && (
            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/general"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/general" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Library className="h-4 w-4" />
                  General Library
                </div>
              </Link>
              <Link
                href="/academic"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/academic" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Academic Library
                </div>
              </Link>
              <Link
                href="/search"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/search" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </div>
              </Link>
              <Link
                href="/upload"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/upload" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </div>
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/admin" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </div>
                </Link>
              )}
            </nav>
          )}
        </div>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.photoURL || ""} alt={userData?.name} />
                  <AvatarFallback>{userData?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userData?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{userData?.email}</p>
                  {isAdmin && <p className="text-xs leading-none text-primary">Admin</p>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  )
}
