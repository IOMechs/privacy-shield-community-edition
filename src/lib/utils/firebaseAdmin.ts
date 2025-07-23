import "server-only";
import admin from "firebase-admin";
import { applicationDefault } from "firebase-admin/app";

import { log, error } from "@/lib/utils/logging";

export async function createFirebaseAdminApp(): Promise<admin.app.App> {
  try {
    log("Initializing Firebase Admin");

    if (admin.apps.length > 0) {
      return admin.app();
    }

    return admin.initializeApp({
      credential: applicationDefault(),
      databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL,
    });
  } catch (e) {
    error("Error While Initializing Firebase");
    throw new Error("Error While Initializing Firebase Error");
  }
}

export const adminApp = await createFirebaseAdminApp();

export const adminDb = admin.firestore(adminApp);
