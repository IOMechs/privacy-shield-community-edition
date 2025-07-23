# PRIVACY SHIELD

## 📄 Description

**Privacy Shield** is a document redaction platform that allows users to hide Personally Identifiable Information (PII) in their documents using Gemini or custom logic. It also supports replacing PII with specific placeholders for clarity or compliance.

The platform supports free, monthly, and yearly subscription plans, with billing powered by Stripe.

---

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- Firebase Emulator Suite
- TypeScript / JavaScript

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Install dependencies
pnpm install
# or
npm install
# or
yarn install

# Firebase Console Usage

If you want to use firebase console:

SET NEXT_PUBLIC_USE_EMULATOR=false
and make sure all the relevant API_KEYS are set in environemnt variables

# Firebase Emulator Usage

If you want to use emulator:

SET SET NEXT_PUBLIC_USE_EMULATOR=true

🔧 Firebase Emulator Setup
1. Install Firebase CLI

npm install -g firebase-tools

2. Login to Firebase

firebase login

3. Run Firebase Emulator

firebase emulators:start

```
