"use client";

import React from "react";
import { AuthProvider } from "../../contexts/AuthContext";
import QueryProvider from "./QueryProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>{children}</QueryProvider>
    </AuthProvider>
  );
}
