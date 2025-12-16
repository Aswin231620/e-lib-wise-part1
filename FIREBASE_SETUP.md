# Firebase Setup Instructions

## Important: You must manually configure Firestore Security Rules

The Firestore security rules in `firestore.rules` and `storage.rules` files cannot be automatically deployed from this code project. You need to manually add them to your Firebase Console.

## Step 1: Update Firestore Security Rules

1. Go to https://console.firebase.google.com/
2. Select your project: **studio-1431562460-90f23**
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace the existing rules with the following:

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/Users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/Users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /Users/{userId} {
      // Allow users to read their own document
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to create their own document (first login)
      allow create: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.data.userId == userId &&
        request.resource.data.role == 'user'; // Prevent self-promotion to admin
      
      // Allow users to update their own profile (but not change role)
      allow update: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.data.role == resource.data.role; // Role cannot be changed by user
      
      // Admins can update any user (including roles)
      allow update: if isAdmin();
      
      // Admins can read all users
      allow read: if isAdmin();
    }
    
    // Materials collection
    match /Materials/{materialId} {
      // Anyone authenticated can read approved materials
      allow read: if request.auth != null && resource.data.approved == true;
      
      // Admins can read all materials (including pending)
      allow read: if isAdmin();
      
      // Authenticated users can create materials (must set approved=false)
      allow create: if (request.auth != null && 
        request.resource.data.approved == false &&
        request.resource.data.uploadedBy == request.auth.uid) ||
        // Allow automatic seeding
        (request.resource.data.uploadedBy == 'system_seeder');
      
      // Only admins can update or delete materials
      allow update, delete: if isAdmin();
    }
  }
}
\`\`\`

6. Click **Publish**

## Step 2: Update Storage Security Rules

1. In Firebase Console, click on **Storage** in the left sidebar
2. Click on the **Rules** tab
3. Replace the existing rules with the following:

\`\`\`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Materials folder - PDFs and documents
    match /materials/{fileName} {
      // Allow authenticated users to upload
      allow write: if request.auth != null;
      
      // Allow authenticated users to read
      allow read: if request.auth != null;
    }
    
    // Allow admins to delete any file
    match /{allPaths=**} {
      allow delete: if request.auth != null &&
        exists(/databases/$(database)/documents/Users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/Users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
\`\`\`

4. Click **Publish**

## Step 3: (Optional) Make Your First User an Admin

By default, all new users are created with the role "user". To make yourself an admin:

1. Sign up for an account in the app
2. Go to Firebase Console > Firestore Database
3. Click on the **Data** tab
4. Find the **Users** collection
5. Find your user document (it will have your UID)
6. Click on it and edit the `role` field from `"user"` to `"admin"`
7. Save the changes

Now you'll have admin access to approve/reject materials and manage the library.

## Troubleshooting

If you see "Missing or insufficient permissions" errors:
- Make sure you've published the Firestore rules
- Make sure you've published the Storage rules
- Try signing out and signing in again
- Check the Rules tab in Firebase Console to verify the rules are active
