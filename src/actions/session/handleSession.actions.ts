"use server";

import { handleSession } from "@/lib/utils/session";
import { cookies } from "next/headers";

/**
 * Clears the JWT session cookie.
 */
export async function clearSession() {
  await handleSession("", 0); // clears cookie
}

/**
 * Sets the Firebase JWT token in a cookie.
 * @param token - Firebase JWT
 */
export async function setSession(token: string) {
  await handleSession(token, 60 * 60 * 2); // 2 hours
}
