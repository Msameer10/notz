"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { createNote, notesCol } from "@/lib/notes";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import NoticeBoardDrawer from "@/components/NoticeBoardDrawer";

type Note = {
  id: string;
  title?: string;
  content?: string;
  updatedAt?: any;
};

export default function Home() {
  const { user, loading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const { theme, toggle } = useTheme();
  const [boardOpen, setBoardOpen] = useState(false);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  useEffect(() => {
    if (!user) return;

    const q = query(notesCol(user.uid), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setNotes(data);
    });

    return () => unsub();
  }, [user]);

  if (loading) return <div className="p-6">Loading...</div>;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <button
          onClick={login}
          className="px-6 py-3 bg-black text-white rounded-lg"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  const onAdd = async () => {
    const id = await createNote(user.uid);
    // go straight to the note editor page
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
              boxShadow: "0 0 12px var(--card-2)"
            }}
          >
            {theme === "dark" ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>
          <button onClick={() => setBoardOpen(true)} className="px-3 py-2 rounded-lg border">
            Board
          </button>

          <button onClick={() => signOut(auth)} className="px-3 py-2 rounded-lg border">
            Logout
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((n) => (
          <Link
            key={n.id}
            href={`/note/${n.id}`}
            className="rounded-xl border p-4 hover:shadow-sm transition"
          >
            <div className="font-semibold truncate">
              {n.title?.trim() ? n.title : "Untitled"}
            </div>
            <div className="mt-2 text-sm opacity-70 line-clamp-3">
              {n.content?.trim() ? n.content : "No content"}
            </div>
          </Link>
        ))}
      </div>

      <button onClick={onAdd} className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto 
        sm:right-6 sm:translate-x-0 rounded-full px-6 py-3 border shadow-md backdrop-blur 
        hover:shadow-lg transition" title="Add note"> + Note </button>

        <NoticeBoardDrawer
          uid={user.uid}
          open={boardOpen}
          onClose={() => setBoardOpen(false)}
        />

    </div>
  );
}
