"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Library, GraduationCap } from "lucide-react"

interface Material {
  id: string
  title: string
  description: string
  type: string
  category: string
  subject?: string
  semester?: string
  tags?: string[]
  fileUrl: string
}

export default function SearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!searchQuery.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const materialsRef = collection(db, "materials")
      const q = query(materialsRef, where("approved", "==", true))
      const snapshot = await getDocs(q)

      const allMaterials = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Material[]

      // Filter materials based on search query
      const searchLower = searchQuery.toLowerCase()
      const filtered = allMaterials.filter((material) => {
        const titleMatch = material.title.toLowerCase().includes(searchLower)
        const descMatch = material.description.toLowerCase().includes(searchLower)
        const subjectMatch = material.subject?.toLowerCase().includes(searchLower)
        const tagsMatch = material.tags?.some((tag) => tag.toLowerCase().includes(searchLower))

        return titleMatch || descMatch || subjectMatch || tagsMatch
      })

      setResults(filtered)
    } catch (error) {
      console.error("Error searching materials:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenMaterial = (material: Material) => {
    router.push(`/viewer?id=${material.id}`)
  }

  return (
    <AuthGuard>
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Search Library</h1>
              <p className="text-muted-foreground">Find materials across both general and academic libraries</p>
            </div>
          </div>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search by title, subject, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : searched ? (
          results.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No results found</h3>
                <p className="text-center text-muted-foreground">
                  Try different keywords or browse the library directly
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Found {results.length} {results.length === 1 ? "result" : "results"}
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {results.map((material) => (
                  <Card key={material.id} className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          {material.category === "General" ? (
                            <Library className="h-5 w-5 text-primary" />
                          ) : (
                            <GraduationCap className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <Badge variant="secondary">{material.type}</Badge>
                      </div>
                      <CardTitle className="line-clamp-2">{material.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{material.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="outline">{material.category}</Badge>
                        {material.category === "Academic" && (
                          <>
                            {material.subject && <Badge variant="outline">{material.subject}</Badge>}
                            {material.semester && <Badge variant="outline">{material.semester}</Badge>}
                          </>
                        )}
                      </div>

                      {material.tags && material.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {material.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Button onClick={() => handleOpenMaterial(material)} className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        Read Material
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Start your search</h3>
              <p className="text-center text-muted-foreground">Enter keywords to search for materials in the library</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  )
}
