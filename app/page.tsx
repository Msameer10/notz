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
import { createNote, notesCol } from "@/lib/notes";

type NoteDocument = {
  title?: unknown;
  content?: unknown;
};

function mapNote(snapshot: QueryDocumentSnapshot<NoteDocument>): NoteCard {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    title: typeof data.title === "string" ? data.title : "",
    content: typeof data.content === "string" ? data.content : "",
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
    <div className="min-h-screen overflow-x-hidden px-4 py-5 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Notz</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Your notes, kept simple.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={toggle}
            className="shrink-0 p-2 rounded-lg border transition hover:scale-105 hover:shadow-md"
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
            className="shrink-0 px-3 py-2 rounded-lg border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            Board
          </button>

          <button
            onClick={() => signOut(auth)}
            className="button-blue shrink-0 px-3 py-2 rounded-lg border transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <NotesGrid notes={notes} isLoading={isNotesLoading} />

      <button
        onClick={onAdd}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 rounded-full px-6 py-3 border transition hover:shadow-lg"
        style={{
          background: "var(--card-2)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
        title="Add note"
      >
        + Note
      </button>

      <NoticeBoardDrawer uid={user.uid} open={boardOpen} onClose={() => setBoardOpen(false)} />
    </div>
  );
}
