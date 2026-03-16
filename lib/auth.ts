"use client";

import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type UserCredential,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();
const mobileUserAgentPattern = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i;

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    mobile?: boolean;
  };
};

export function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const { userAgent, userAgentData } = navigator as NavigatorWithUserAgentData;

  if (typeof userAgentData?.mobile === "boolean") {
    return userAgentData.mobile;
  }

  return mobileUserAgentPattern.test(userAgent);
}

export async function signInWithGoogle(): Promise<UserCredential | void> {
  if (isMobileBrowser()) {
    await signInWithRedirect(auth, googleProvider);
    return;
  }

  return signInWithPopup(auth, googleProvider);
}

export async function handleGoogleRedirectResult(): Promise<UserCredential | null> {
  return getRedirectResult(auth);
}
