"use client";

import {
  GithubAuthProvider,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type AuthError,
} from "firebase/auth";
import { onSnapshot, orderBy, query, type QueryDocumentSnapshot } from "firebase/firestore";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import AuthHero from "@/components/AuthHero";
import NotesGrid, { type NoteCard } from "@/components/NotesGrid";
import NoticeBoardDrawer from "@/components/NoticeBoardDrawer";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { auth } from "@/lib/firebase";
import { createNote, isNoteColor, notesCol } from "@/lib/notes";

type NoteDocument = {
  title?: unknown;
  content?: unknown;
  color?: unknown;
};

type AuthAction = "google" | "github" | "email-signin" | "email-signup";

function mapNote(snapshot: QueryDocumentSnapshot<NoteDocument>): NoteCard {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    title: typeof data.title === "string" ? data.title : "",
    content: typeof data.content === "string" ? data.content : "",
    color: isNoteColor(data.color) ? data.color : "default",
  };
}

function getAuthErrorMessage(error: unknown, action?: AuthAction): string {
  const code = (error as AuthError | undefined)?.code;

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email or password is incorrect.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/email-already-in-use":
      return "That email is already in use.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with a different sign-in method.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled before it finished.";
    case "auth/cancelled-popup-request":
      return "Another sign-in window was already open.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Allow popups and try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled in Firebase yet.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for Firebase sign-in. Add it in Firebase Authentication > Settings > Authorized domains.";
    case "auth/invalid-api-key":
      return "Firebase configuration is invalid. Check your NEXT_PUBLIC_FIREBASE_* values.";
    case "auth/app-not-authorized":
      return "This Firebase app is not authorized for the configured sign-in provider. Check your Firebase project and OAuth settings.";
    default:
      if (action === "google") {
        return "Google sign-in failed. Check the browser console and confirm Google is enabled, the domain is authorized, and your Firebase env vars match the correct project.";
      }

      return "Authentication failed. Try again.";
  }
}

export default function Home() {
  const { user, loading } = useAuth();
  const { theme, toggle } = useTheme();

  const [notes, setNotes] = useState<NoteCard[]>([]);
  const [loadedNotesUserId, setLoadedNotesUserId] = useState<string | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<AuthAction | null>(null);

  const setAuthSessionPersistence = async (rememberDevice: boolean) => {
    await setPersistence(auth, rememberDevice ? browserLocalPersistence : browserSessionPersistence);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const runAuthAction = async (action: AuthAction, rememberDevice: boolean, operation: () => Promise<unknown>) => {
    setAuthError(null);
    setLoadingAction(action);

    try {
      await setAuthSessionPersistence(rememberDevice);
      await operation();
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setLoadingAction(null);
    }
  };

  const signInWithProvider = async (
    action: Extract<AuthAction, "google" | "github">,
    rememberDevice: boolean,
    provider: GoogleAuthProvider | GithubAuthProvider
  ) => {
    await runAuthAction(action, rememberDevice, async () => {
      const shouldUseRedirect = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;

      if (shouldUseRedirect) {
        await signInWithRedirect(auth, provider);
        return;
      }

      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        const code = (error as AuthError | undefined)?.code;

        if (code === "auth/popup-blocked") {
          await signInWithRedirect(auth, provider);
          return;
        }

        throw error;
      }
    });
  };

  const loginWithGoogle = async (rememberDevice: boolean) => {
    const provider = new GoogleAuthProvider();
    await signInWithProvider("google", rememberDevice, provider);
  };

  const loginWithGithub = async (rememberDevice: boolean) => {
    const provider = new GithubAuthProvider();
    provider.addScope("read:user");
    provider.addScope("user:email");
    await signInWithProvider("github", rememberDevice, provider);
  };

  const signInWithEmail = async (email: string, password: string, rememberDevice: boolean) => {
    await runAuthAction("email-signin", rememberDevice, () => signInWithEmailAndPassword(auth, email.trim(), password));
  };

  const signUpWithEmail = async (email: string, password: string, rememberDevice: boolean) => {
    await runAuthAction("email-signup", rememberDevice, () => createUserWithEmailAndPassword(auth, email.trim(), password));
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    setAuthError(null);

    const notesQuery = query(notesCol(user.uid), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
      setNotes(snapshot.docs.map(mapNote));
      setLoadedNotesUserId(user.uid);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return (
      <AuthHero
        authError={authError}
        loadingAction={loadingAction}
        onClearAuthError={clearAuthError}
        onEmailSignIn={signInWithEmail}
        onEmailSignUp={signUpWithEmail}
        onGithubLogin={loginWithGithub}
        onGoogleLogin={loginWithGoogle}
      />
    );
  }

  const onAdd = async () => {
    const id = await createNote(user.uid);
    window.location.href = `/note/${id}`;
  };

  const isNotesLoading = loadedNotesUserId !== user.uid;

  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-5 pb-28 sm:p-6 sm:pb-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Notz</h1>
          <p className="mt-1 max-w-[18rem] text-sm sm:max-w-none" style={{ color: "var(--muted)" }}>
            Your notes, kept simple.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <button
            onClick={toggle}
            className="theme-toggle shrink-0 border"
            data-theme-state={theme}
            aria-label="Toggle theme"
            title="Toggle theme"
            type="button"
          >
            <span className="theme-toggle-icon" data-theme-state={theme} aria-hidden="true">
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </span>
          </button>

          <button
            onClick={() => setBoardOpen(true)}
            className="shrink-0 rounded-lg border px-2.5 py-2 text-sm sm:px-3 sm:text-base"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            Board
          </button>

          <button
            onClick={() => signOut(auth)}
            className="button-blue shrink-0 rounded-lg border px-2.5 py-2 text-sm transition-colors sm:px-3 sm:text-base"
          >
            Logout
          </button>
        </div>
      </header>

      <NotesGrid notes={notes} isLoading={isNotesLoading} />

      <button
        onClick={onAdd}
        className="button-primary fixed bottom-4 left-4 right-4 z-30 rounded-xl border px-5 py-3 text-base font-semibold transition hover:-translate-y-0.5 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto sm:min-w-[9.5rem] sm:px-5 sm:py-3"
        title="Add note"
        aria-label="Add note"
      >
        + Note
      </button>

      <NoticeBoardDrawer uid={user.uid} open={boardOpen} onClose={() => setBoardOpen(false)} />
    </div>
  );
}