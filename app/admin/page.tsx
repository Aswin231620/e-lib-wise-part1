"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { useUser } from "@/lib/user-context"
import { db, storage } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore"
import { ref, deleteObject } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Shield, Check, X, Clock, FileText, Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { seedDatabase } from "@/lib/seeder"

export default function AdminPage() {
  // ... (existing state)
  const [seeding, setSeeding] = useState(false)

  // ... (existing fetchMaterials)

  const handleSeed = async () => {
    if (!confirm("This will add sample books to the library. Continue?")) return

    setSeeding(true)
    try {
      await seedDatabase()
      toast({
        title: "Library Seeded",
        description: "Sample books have been added successfully."
      })
      fetchMaterials() // Refresh list
    } catch (error) {
      console.error("Seeding error:", error)
      toast({
        title: "Seeding Failed",
        description: "Could not seed the library.",
        variant: "destructive"
      })
    } finally {
      setSeeding(false)
    }
  }

  // ... (existing handlers)

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage approvals and library content</p>
          </div>
        </div>
        <Button onClick={handleSeed} disabled={seeding} variant="outline">
          {seeding ? "Seeding..." : "Seed Library"}
        </Button>
      </div>

      <Alert className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Admin Access</AlertTitle>
        <AlertDescription>
          You are logged in as an administrator. You can approve pending uploads or remove existing materials.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="relative">
            Pending Approval
            {pendingMaterials.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-[10px]">
                {pendingMaterials.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Manage Library</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingMaterials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Check className="mb-4 h-12 w-12 text-primary" />
                <h3 className="mb-2 text-lg font-semibold">All caught up!</h3>
                <p className="text-center text-muted-foreground">
                  There are no materials waiting for approval.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {pendingMaterials.map((material) => (
                <Card key={material.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge>{material.category}</Badge>
                          <Badge variant="outline">{material.type}</Badge>
                        </div>
                        <CardTitle className="mt-2">{material.title}</CardTitle>
                        <CardDescription className="mt-1">{material.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {material.uploadedAt?.seconds ? new Date(material.uploadedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                      {material.subject && (
                        <div>
                          <span className="font-semibold text-muted-foreground block">Subject</span>
                          {material.subject}
                        </div>
                      )}
                      {material.semester && (
                        <div>
                          <span className="font-semibold text-muted-foreground block">Semester</span>
                          {material.semester}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-muted-foreground block">Tags</span>
                        {material.tags && material.tags.length > 0 ? material.tags.join(", ") : "-"}
                      </div>
                      <div>
                        <span className="font-semibold text-muted-foreground block">File</span>
                        <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          <FileText className="h-3 w-3" /> View PDF
                        </a>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-3 bg-muted/50 p-4">
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(material)}
                      disabled={!!processingId}
                    >
                      {processingId === material.id ? "Processing..." : "Reject"}
                    </Button>
                    <Button
                      onClick={() => handleApprove(material)}
                      disabled={!!processingId}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      {processingId === material.id ? "Processing..." : "Approve"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Recently Approved Materials</h3>
              <p className="text-sm text-muted-foreground">Showing last 50 items</p>
            </div>

            <div className="grid gap-4">
              {approvedMaterials.map((material) => (
                <Card key={material.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <FileText className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{material.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {material.category} • {material.type} • {material.subject || 'No Subject'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(material)}
                    className="text-muted-foreground hover:text-destructive"
                    title="Delete material"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
