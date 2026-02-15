"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { Sun, Moon } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { auth } from "@/lib/firebase";
import { createNote, notesCol } from "@/lib/notes";
import NoticeBoardDrawer from "@/components/NoticeBoardDrawer";

type Note = {
  id: string;
  title?: string;
  content?: string;
};

export default function Home() {
  const { user, loading } = useAuth();
  const { theme, toggle } = useTheme();

  const [notes, setNotes] = useState<Note[]>([]);
  const [boardOpen, setBoardOpen] = useState(false);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  useEffect(() => {
    if (!user) return;

    const q = query(notesCol(user.uid), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    return () => unsub();
  }, [user]);

  if (loading) return <div className="p-6">Loading...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-8">
        <h1 className="text-6xl md:text-8xl font-bold tracking-wide">NOTZ</h1>

        <button
          onClick={login}
          className="px-6 py-3 rounded-lg border transition hover:scale-105"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  const onAdd = async () => {
    const id = await createNote(user.uid);
    window.location.href = `/note/${id}`;
  };

  return (
    <div className="min-h-screen p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notz</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="p-2 rounded-lg border transition hover:scale-105 hover:shadow-md"
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
            className="px-3 py-2 rounded-lg border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            Board
          </button>

          <button
            onClick={() => signOut(auth)}
            className="px-3 py-2 rounded-lg border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((n) => (
          <Link
            key={n.id}
            href={`/note/${n.id}`}
            className="rounded-xl border p-4 transition hover:shadow-md"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="font-semibold truncate">
              {n.title?.trim() ? n.title : "Untitled"}
            </div>
            <div className="mt-2 text-sm line-clamp-3" style={{ color: "var(--muted)" }}>
              {n.content?.trim() ? n.content : "No content"}
            </div>
          </Link>
        ))}
      </div>

      {/* Floating + Note button */}
      <button
        onClick={onAdd}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0
                   rounded-full px-6 py-3 border transition hover:shadow-lg"
        style={{
          background: "var(--card-2)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
        title="Add note"
      >
        + Note
      </button>

      <NoticeBoardDrawer
        uid={user.uid}
        open={boardOpen}
        onClose={() => setBoardOpen(false)}
      />
    </div>
  );
}
