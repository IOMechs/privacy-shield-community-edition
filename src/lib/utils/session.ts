import { cookies } from "next/headers";

export const handleSession = async (token: string, expiry: number) => {
  (await cookies()).set("authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: expiry, // 2 hours
  });
};
