"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { useUser } from "@/lib/user-context"
import { db, storage } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const MATERIAL_TYPES = ["Book", "Story", "Journal", "Magazine", "Article", "Notes", "PQs", "Assignments"]
const CATEGORIES = ["General", "Academic"]

export default function UploadPage() {
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("")
  const [category, setCategory] = useState("")
  const [subject, setSubject] = useState("")
  const [semester, setSemester] = useState("")
  const [tags, setTags] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !user) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select a file",
        variant: "destructive",
      })
      return
    }

    if (category === "Academic" && (!subject || !semester)) {
      toast({
        title: "Missing information",
        description: "Subject and semester are required for academic materials",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Create a unique file name
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const storageRef = ref(storage, `materials/${fileName}`)

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log(`Upload is ${progress}% done`)
          setUploadProgress(progress)
        },
        (error) => {
          console.error("Upload error:", error)
          toast({
            title: "Upload failed",
            description: error.message,
            variant: "destructive",
          })
          setUploading(false)
        },
        async () => {
          console.log("Upload completed, getting download URL...")
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

          // Save metadata to Firestore
          const materialData = {
            title,
            description,
            type,
            category,
            ...(category === "Academic" && { subject, semester }),
            tags: tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            fileUrl: downloadURL,
            uploadedBy: user.uid,
            approved: true, // Auto-approve all uploads
            uploadedAt: serverTimestamp(),
          }

          await addDoc(collection(db, "materials"), materialData)

          toast({
            title: "Success! Published.",
            description: "Your material is now live in the library.",
          })

          // Reset form
          setTitle("")
          setDescription("")
          setType("")
          setCategory("")
          setSubject("")
          setSemester("")
          setTags("")
          setFile(null)
          setUploadProgress(0)
          setUploading(false)

          // Redirect to home
          setTimeout(() => router.push("/"), 1500)
        },
      )
    } catch (error: any) {
      console.error("Error uploading material:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      setUploading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Upload Material</CardTitle>
            <CardDescription>
              Share educational materials with the community. Your submission will be reviewed by an admin before
              publication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter material title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={uploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a brief description of the material"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  disabled={uploading}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={type} onValueChange={setType} disabled={uploading} required>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => {
                      setCategory(value)
                      if (value === "General") {
                        setSubject("")
                        setSemester("")
                      }
                    }}
                    disabled={uploading}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {category === "Academic" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="e.g., Mathematics"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required={category === "Academic"}
                      disabled={uploading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester *</Label>
                    <Input
                      id="semester"
                      placeholder="e.g., 1st Semester"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      required={category === "Academic"}
                      disabled={uploading}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Enter tags separated by commas"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground">Example: physics, mechanics, thermodynamics</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">PDF File *</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={uploading}
                    required
                    className="cursor-pointer"
                  />
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? "Uploading..." : "Submit for Approval"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}
