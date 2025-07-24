# 🛡️ Privacy Shield - Document Redaction Platform

![alt text](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![alt text](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![alt text](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

Privacy Shield is a web-based platform designed to help users protect sensitive information by redacting Personally Identifiable Information (PII) from their documents. It leverages Google's Gemini for intelligent, AI-powered redaction and provides a fallback to traditional regex-based methods for maximum flexibility.

## ✨ Features

- **AI-Powered Redaction**: Utilizes Google Gemini to intelligently find and remove PII from various document types.
- **Multiple Redaction Methods**: Choose between **Masking** (replacing PII with ████████) or **Replacing** (swapping PII with realistic fake data).
- **Broad File Support**: Process a wide range of document formats, including TXT, CSV, PDF, DOCX, and RTF.
- **Image Redaction**: Advanced capabilities to redact text and faces from images.
- **Customizable Rules**: Fine-tune redaction by specifying custom values to redact or ignore.
- **Secure User Authentication**: Full authentication system powered by Firebase Auth (Email/Password and Google OAuth).
- **File Management Dashboard**: A user-friendly dashboard to upload files, view processing history, and download redacted documents.
- **Secure Cloud Storage**: All original and redacted files are securely stored using Firebase Storage, with access controlled by strict rules.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Auth, Firestore, Storage, Functions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **AI**: [Google Gemini](https://ai.google.dev/)
- **State Management**: [React Query (@tanstack/react-query)](https://tanstack.com/query/latest)
- **File Processing**: pdfjs-dist, mammoth.js, jszip, papaparse
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### 1. Prerequisites

Make sure you have the following software installed on your machine:

- [Node.js](https://nodejs.org/) (v22.x or later recommended)
- [pnpm](https://pnpm.io/installation) (or npm/yarn)
- [Firebase CLI](https://firebase.google.com/docs/cli#install-cli-npm): npm install -g firebase-tools

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/privacy-shield.git
cd privacy-shield
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Environment Setup

The project can be run in two modes: using the **Firebase Emulator Suite** (recommended for local development) or connecting to a **live Firebase project**.

First, create an environment file by copying the example:

```bash
cp .env.example .env.local
```

Now, follow the instructions for your chosen mode.

---

### 💻 Running with Firebase Emulator Suite 

This is the easiest way to run the project locally without needing a live Firebase project. The emulators simulate the entire Firebase backend on your machine.

**Step 1: Configure Environment for Emulator**

In your .env.local file, make sure the emulator flag is set to true:

```env
# .env.local
NEXT_PUBLIC_USE_EMULATOR=true

# You can leave the other Firebase variables empty or as they are

# The Gemini API Key is still needed for AI features
GEMINI_API_KEY="your_google_gemini_api_key"
```

> **Note:** You still need a GEMINI_API_KEY from [Google AI Studio](https://aistudio.google.com/app/apikey) for the AI redaction features to work.

**Step 2: Login to Firebase**

If you haven't already, log in to your Google account via the Firebase CLI:

```bash
firebase login
```

**Step 3: Start the Emulators**

In your terminal, start the Firebase Emulator Suite. This will spin up local instances of Auth, Firestore, Storage, and Functions.

```bash
firebase emulators:start
```

Once running, you should see a table of running emulators and their ports. You can access the **Emulator UI** at http://localhost:4000 to view your local database, users, and stored files.

**Step 4: Run the Next.js Application**

In a **new terminal window**, start the Next.js development server:

```bash
pnpm dev
```

Your application will be running at http://localhost:3000 and will automatically connect to the local Firebase emulators.

----------

### ☁️ Running with a Live Firebase Project

Use this mode if you want to test against a real Firebase backend.

**Step 1: Create a Firebase Project**

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. **Enable Firestore**: Go to the Firestore Database section and create a database in production mode.
3. **Enable Storage**: Go to the Storage section and set it up.
4. **Enable Authentication**:
   - Go to the Authentication section.
   - Click on "Get Started".
   - Enable the **Email/Password** and **Google** sign-in providers.

**Step 2: Register a Web App**

1. In your project's settings, click "Add app" and select the "Web" icon (</>).
2. Register the app. You don't need to add the SDKs.
3. Firebase will provide you with a firebaseConfig object. Copy these keys.

**Step 3: Get Gemini API Key**

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create a new API key.

**Step 4: Configure Environment for Live Project**

Now, populate your .env.local file with the keys you just obtained.

```env
# .env.local

# Set to false to connect to your live Firebase project
NEXT_PUBLIC_USE_EMULATOR=false

# Paste your Web App config from the Firebase Console here
NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"

# Paste your Gemini API key here
GEMINI_API_KEY="your_google_gemini_api_key"

# This is used for the Firebase Admin SDK on the server-side
FIREBASE_ADMIN_DATABASE_URL="https://your_project_id.firebaseio.com"
```

**Step 5: Set up Service Account Credentials**

The backend needs admin privileges to communicate with Firebase securely.

1. In the Firebase Console, go to **Project Settings > Service accounts**.
2. Click **"Generate new private key"** and save the downloaded JSON file.
3. **Important**: Do not commit this file to Git. The .gitignore file is already configured to ignore it.
4. Set an environment variable that points to the location of this file. On Linux/macOS:

   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-file.json"
   ```

   On Windows (Command Prompt):

   ```cmd
   set GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\service-account-file.json"
   ```

**Step 6: Run the Next.js Application**

Start the Next.js development server:

```bash
pnpm dev
```

The application will now be connected to your live Firebase project.

## 📂 Project Structure

Here's a high-level overview of the key directories in the project:

```
.
├── functions/        # Firebase Cloud Functions (if any are added)
├── public/           # Static assets (images, svgs, etc.)
├── src/
│   ├── app/          # Next.js App Router: pages and API routes
│   │   ├── api/      # Backend API routes
│   │   ├── dashboard/ # Main application dashboard
│   │   └── (auth)/   # Route group for signin/signup pages
│   ├── components/   # React components
│   │   ├── composites/ # Application-specific components
│   │   └── ui/       # Reusable UI components from shadcn/ui
│   ├── contexts/     # React Context providers (Auth, etc.)
│   ├── lib/          # Core logic and utilities
│   │   ├── serverUtils/ # Server-side only utilities (e.g., AI redaction)
│   │   └── utils/    # Shared utilities (Firebase client, file handling)
│   ├── services/     # Functions for interacting with external services
│   └── types/        # TypeScript type definitions
├── .firebaserc       # Firebase project configuration
├── firebase.json     # Firebase services and emulator configuration
├── firestore.rules   # Firestore security rules
└── storage.rules     # Cloud Storage security rules
```

## 📜 Available Scripts

In the project directory, you can run:

- `pnpm dev`: Runs the app in development mode with Turbopack.
- `pnpm build`: Builds the app for production.
- `pnpm start`: Starts a production server.
- `pnpm lint`: Lints the codebase for errors and style issues.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
