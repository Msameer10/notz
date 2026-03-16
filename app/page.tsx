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
    default:
      if (action === "github") {
        return "GitHub sign-in failed. Check the Firebase GitHub provider settings and try again.";
      }

      if (action === "google") {
        return "Google sign-in failed. Try again.";
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

  const clearAuthError = () => {
    setAuthError(null);
  };

  const setEmailPersistence = async (rememberDevice: boolean) => {
    await setPersistence(auth, rememberDevice ? browserLocalPersistence : browserSessionPersistence);
  };

  const login = async () => {
    setAuthError(null);
    setLoadingAction("google");

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error, "google"));
    } finally {
      setLoadingAction(null);
    }
  };

  const loginWithGithub = async () => {
    setAuthError(null);
    setLoadingAction("github");

    try {
      const provider = new GithubAuthProvider();
      provider.addScope("read:user");
      provider.addScope("user:email");
      await signInWithPopup(auth, provider);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error, "github"));
    } finally {
      setLoadingAction(null);
    }
  };

  const signInWithEmail = async (email: string, password: string, rememberDevice: boolean) => {
    setAuthError(null);
    setLoadingAction("email-signin");

    try {
      await setEmailPersistence(rememberDevice);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error, "email-signin"));
    } finally {
      setLoadingAction(null);
    }
  };

  const signUpWithEmail = async (email: string, password: string, rememberDevice: boolean) => {
    setAuthError(null);
    setLoadingAction("email-signup");

    try {
      await setEmailPersistence(rememberDevice);
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error, "email-signup"));
    } finally {
      setLoadingAction(null);
    }
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
        onLogin={login}
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
            className="shrink-0 rounded-lg border p-2 transition hover:scale-105 hover:shadow-md"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              boxShadow: "0 0 12px var(--card-2)",
            }}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
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
