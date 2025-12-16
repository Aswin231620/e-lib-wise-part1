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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { GraduationCap, FileText, ClipboardList, FileCheck } from "lucide-react"

interface Material {
  id: string
  title: string
  description: string
  type: string
  category: string
  subject: string
  semester: string
  tags?: string[]
  fileUrl: string
  uploadedAt: any
}

const TYPE_ICONS = {
  Notes: FileText,
  PQs: ClipboardList,
  Assignments: FileCheck,
}

export default function AcademicLibraryPage() {
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState("All")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [selectedSemester, setSelectedSemester] = useState("all")

  useEffect(() => {
    // Real-time listener for approved academic materials
    const q = query(collection(db, "materials"), where("category", "==", "Academic"), where("approved", "==", true))

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

  // Get unique subjects and semesters
  const subjects = ["all", ...Array.from(new Set(materials.map((m) => m.subject).filter(Boolean)))]
  const semesters = ["all", ...Array.from(new Set(materials.map((m) => m.semester).filter(Boolean)))]

  // Filter materials based on type, subject, and semester
  const filteredMaterials = materials.filter((m) => {
    const typeMatch = activeType === "All" || m.type === activeType
    const subjectMatch = selectedSubject === "all" || m.subject === selectedSubject
    const semesterMatch = selectedSemester === "all" || m.semester === selectedSemester
    return typeMatch && subjectMatch && semesterMatch
  })

  const types = ["All", "Notes", "PQs", "Assignments"]

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
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Academic Library</h1>
              <p className="text-muted-foreground">
                Access notes, past questions, and assignments by subject and semester
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subject-filter">Filter by Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger id="subject-filter">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject === "all" ? "All Subjects" : subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester-filter">Filter by Semester</Label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger id="semester-filter">
                    <SelectValue placeholder="All semesters" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((semester) => (
                      <SelectItem key={semester} value={semester}>
                        {semester === "all" ? "All Semesters" : semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeType} onValueChange={setActiveType} className="w-full">
          <TabsList className="mb-6 w-full justify-start">
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
                    <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">No materials available</h3>
                    <p className="text-center text-muted-foreground">
                      {type === "All"
                        ? "No academic materials match your current filters"
                        : `No ${type.toLowerCase()} match your current filters`}
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
                          <CardDescription className="line-clamp-2">{material.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto space-y-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Subject:</span>
                              <span className="font-medium">{material.subject}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Semester:</span>
                              <span className="font-medium">{material.semester}</span>
                            </div>
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
