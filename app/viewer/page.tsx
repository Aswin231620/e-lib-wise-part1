"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ZoomIn, ZoomOut, Download, ExternalLink } from "lucide-react"

interface Material {
  id: string
  title: string
  description: string
  type: string
  category: string
  subject?: string
  semester?: string
  fileUrl: string
  previewLink?: string
}

function ViewerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const materialId = searchParams.get("id")

  const [material, setMaterial] = useState<Material | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    if (!materialId) {
      router.push("/")
      return
    }

    const fetchMaterial = async () => {
      try {
        const docRef = doc(db, "materials", materialId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setMaterial({ id: docSnap.id, ...docSnap.data() } as Material)
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error("Error fetching material:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchMaterial()
  }, [materialId, router])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50))
  }

  const handleDownload = () => {
    if (material?.fileUrl) {
      window.open(material.fileUrl, "_blank")
    }
  }

  const handleExternalPreview = () => {
    if (material?.previewLink || material?.fileUrl) {
      window.open(material.previewLink || material.fileUrl, "_blank")
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!material) {
    return null
  }

  // Check if it's a PDF (uploaded file) or an external link (Google Books)
  // Assuming uploaded files are in Firebase Storage (contain "firebasestorage") or end in .pdf
  const isPdf = material.fileUrl?.includes("firebasestorage") || material.fileUrl?.endsWith(".pdf")

  return (
    <div className="container max-w-6xl py-6">
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{material.title}</h1>
              <p className="text-sm text-muted-foreground">
                {material.category === "Academic"
                  ? `${material.subject} - ${material.semester}`
                  : `${material.type} - ${material.category}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPdf ? (
              <>
                <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="min-w-[4rem] text-center text-sm">{zoom}%</span>
                <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </>
            ) : (
              <Button onClick={handleExternalPreview}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open on Google Books
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative h-[calc(100vh-12rem)] overflow-auto bg-muted/30 flex items-center justify-center">
            {isPdf ? (
              <div className="h-full w-full flex flex-col">
                <object
                  data={material.fileUrl}
                  type="application/pdf"
                  className="w-full flex-1 min-h-[500px]"
                >
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(material.fileUrl)}&embedded=true`}
                    className="h-full w-full border-0"
                    title={material.title}
                  />
                </object>
              </div>
            ) : (
              <div className="text-center p-12">
                <div className="mb-4">
                  <ExternalLink className="mx-auto h-16 w-16 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">External Preview</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  This book is hosted by an external provider (Google Books).
                  You can read it by opening the preview link.
                </p>
                <Button size="lg" onClick={handleExternalPreview}>
                  Open Book Preview
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ViewerPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
        <ViewerContent />
      </Suspense>
    </AuthGuard>
  )
}
