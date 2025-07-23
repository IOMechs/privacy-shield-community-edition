import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const useEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === "true";
const firebaseConfig = {
  apiKey: useEmulator ? "localhost" : process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Emulator connection
// Use environment variable to decide whether to connect to the emulator
console.log("here");
if (useEmulator) {
  console.log("Using Firebase Emulator");
  const emulatorHost =
    process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST || "localhost";
  const functionsEmulatorPort =
    Number(process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT) || 5001;
  const firestoreEmulatorPort =
    Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT) || 8080;
  console.log(
    `Connecting to Firebase Functions emulator at http://${emulatorHost}:${functionsEmulatorPort}`
  );
  connectFunctionsEmulator(functions, emulatorHost, functionsEmulatorPort);
  connectFirestoreEmulator(db, emulatorHost, firestoreEmulatorPort);
  connectStorageEmulator(storage, "localhost", 9199);
  // Connect to Auth emulator
  const authEmulatorHost =
    process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST || "127.0.0.1";
  const authEmulatorPort = Number(
    process.env.NEXT_PUBLIC_AUTH_EMULATOR_PORT || 9099
  );
  console.log(
    `Connecting to Firebase Auth emulator at http://${authEmulatorHost}:${authEmulatorPort}`
  );
  connectAuthEmulator(auth, `http://${authEmulatorHost}:${authEmulatorPort}`);
}
