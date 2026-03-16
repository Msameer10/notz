"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";

import { handleGoogleRedirectResult } from "@/lib/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [redirectResolved, setRedirectResolved] = useState(false);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!isActive) {
        return;
      }

      setUser(u);
      setAuthResolved(true);
    });

    void handleGoogleRedirectResult()
      .catch((error) => {
        console.error("Google redirect sign-in failed:", error);
      })
      .finally(() => {
        if (isActive) {
          setRedirectResolved(true);
        }
      });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const loading = !authResolved || !redirectResolved;

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
