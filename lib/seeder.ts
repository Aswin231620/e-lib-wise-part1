import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

const SAMPLE_BOOKS = [
    {
        title: "Pride and Prejudice",
        description: "The famous novel by Jane Austen, following the turbulent relationship between Elizabeth Bennet and Fitzwilliam Darcy.",
        type: "Book",
        category: "General",
        tags: ["classic", "romance", "literature"],
        fileUrl: "https://www.gutenberg.org/files/1342/1342-pdf.pdf", // Note: Gutenberg might block CORS, checking safer options
        uploadedBy: "system_seeder",
        approved: true
    },
    {
        title: "JavaScript for Impatient Programmers",
        description: "A comprehensive guide to modern JavaScript.",
        type: "Book",
        category: "Academic",
        subject: "Computer Science",
        semester: "Shared",
        tags: ["programming", "javascript", "coding"],
        fileUrl: "https://exploringjs.com/impatient-js/downloads/impatient-js-preview.pdf",
        uploadedBy: "system_seeder",
        approved: true
    },
    {
        title: "The Theory of Relativity",
        description: "Key papers on the special and general theory of relativity.",
        type: "Article",
        category: "Academic",
        subject: "Physics",
        semester: "Research",
        tags: ["physics", "science", "einstein"],
        fileUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Einstein_Relativity.pdf", // Wikimedia often allows CORS
        uploadedBy: "system_seeder",
        approved: true
    }
]

// Fallback to a reliable PDF host if others fail (Mozilla Demo)
const RELIABLE_PDF = "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf"

export const seedDatabase = async () => {
    try {
        const materialsCollection = collection(db, "materials");

        for (const book of SAMPLE_BOOKS) {
            // Use reliable PDF for all for now to ensure "readable" experience if external links fail CORS
            // Ideally we'd have specific links, but for a demo, reliability is key.
            // Let's mix it up slightly but default to safe ones.
            const bookData = {
                ...book,
                fileUrl: book.title.includes("Relativity") ? book.fileUrl : RELIABLE_PDF,
                uploadedAt: serverTimestamp()
            }
            await addDoc(materialsCollection, bookData);
        }
        return true;
    } catch (error) {
        console.error("Error seeding database:", error);
        throw error;
    }
}
