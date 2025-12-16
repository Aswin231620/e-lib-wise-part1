"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Library, BookOpen, FileText, BookMarked, Newspaper, ScrollText } from "lucide-react"

interface Material {
  id: string
  title: string
  description: string
  type: string
  category: string
  tags?: string[]
  fileUrl: string
  uploadedAt: any
}

const TYPE_ICONS = {
  Book: BookOpen,
  Story: ScrollText,
  Journal: BookMarked,
  Magazine: Newspaper,
  Article: FileText,
}

export default function GeneralLibraryPage() {
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState("All")

  useEffect(() => {
    // Real-time listener for approved general materials
    const q = query(collection(db, "materials"), where("category", "==", "General"), where("approved", "==", true))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const materialsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Material[]

        // Sort by upload date (newest first)
        materialsData.sort((a, b) => {
          const timeA = a.uploadedAt?.seconds || 0
          const timeB = b.uploadedAt?.seconds || 0
          return timeB - timeA
        })

        setMaterials(materialsData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching materials:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const filteredMaterials = activeType === "All" ? materials : materials.filter((m) => m.type === activeType)

  const types = ["All", "Book", "Story", "Journal", "Magazine", "Article"]

  const handleOpenMaterial = (material: Material) => {
    router.push(`/viewer?id=${material.id}`)
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Library className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">General Library</h1>
              <p className="text-muted-foreground">Browse books, stories, journals, magazines, and articles</p>
            </div>
          </div>
        </div>

        <Tabs value={activeType} onValueChange={setActiveType} className="w-full">
          <TabsList className="mb-6 w-full justify-start overflow-x-auto">
            {types.map((type) => (
              <TabsTrigger key={type} value={type}>
                {type}
              </TabsTrigger>
            ))}
          </TabsList>

          {types.map((type) => (
            <TabsContent key={type} value={type}>
              {filteredMaterials.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Library className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">No materials available</h3>
                    <p className="text-center text-muted-foreground">
                      {type === "All"
                        ? "There are no materials in the general library yet"
                        : `No ${type.toLowerCase()}s have been uploaded yet`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredMaterials.map((material) => {
                    const Icon = TYPE_ICONS[material.type as keyof typeof TYPE_ICONS] || FileText
                    return (
                      <Card key={material.id} className="flex flex-col transition-shadow hover:shadow-lg">
                        <CardHeader>
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <Badge variant="secondary">{material.type}</Badge>
                          </div>
                          <CardTitle className="line-clamp-2">{material.title}</CardTitle>
                          <CardDescription className="line-clamp-3">{material.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto">
                          {material.tags && material.tags.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-1">
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
                    )
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AuthGuard>
  )
}
