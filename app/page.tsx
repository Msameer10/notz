"use client";

import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
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

function mapNote(snapshot: QueryDocumentSnapshot<NoteDocument>): NoteCard {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    title: typeof data.title === "string" ? data.title : "",
    content: typeof data.content === "string" ? data.content : "",
    color: isNoteColor(data.color) ? data.color : "default",
  };
}

export default function Home() {
  const { user, loading } = useAuth();
  const { theme, toggle } = useTheme();

  const [notes, setNotes] = useState<NoteCard[]>([]);
  const [loadedNotesUserId, setLoadedNotesUserId] = useState<string | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  useEffect(() => {
    if (!user) {
      return;
    }

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
    return <AuthHero onLogin={login} />;
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
