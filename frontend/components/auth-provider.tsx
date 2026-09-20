"use client";

import { useEffect } from "react";

import { initializeAuthTokenProvider } from "../lib/auth";

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initializeAuthTokenProvider();
  }, []);

  return children;
}
