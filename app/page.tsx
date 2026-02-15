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
      <div className="min-h-screen flex justify-center pt-36 md:pt-48 p-6">
        {/* move the whole stack up */}
        <div className="w-full max-w-xl text-center -mt-24 md:-mt-32">
          {/* Background glow (subtle) */}
          <div
            className="mx-auto mb-10 h-40 w-40 rounded-full blur-3xl opacity-30"
            style={{ background: "var(--card-2)" }}
          />

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-widest anim-popIn brand-glow">
            NOTZ
          </h1>

          {/* x on its own line */}
          <div
            className="mt-4 text-base anim-fadeUp anim-delay-1"
            style={{ color: "var(--muted)" }}
          >
            x
          </div>

          {/* Sameerion on its own line (Cinzel) */}
         <a
            href="https://sameerion.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-2xl md:text-3xl anim-fadeUp anim-delay-2 inline-block transition hover:opacity-80"
            style={{
              color: "var(--fg)",
              fontFamily: "var(--font-cinzel), serif",
              letterSpacing: "0.06em",
            }}
          >
            Sameerion
          </a>

          <div className="mt-10 flex justify-center anim-fadeUp anim-delay-3">
            <button
              onClick={login}
              className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl border transition hover:scale-[1.03] active:scale-[0.99]"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow)",
              }}
            >
              {/* Google Icon */}
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.22 3.6l6.86-6.86C35.92 2.36 30.32 0 24 0 14.64 0 6.6 5.4 2.6 13.28l8.02 6.22C12.5 13.3 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.1 24.55c0-1.64-.15-3.21-.43-4.73H24v9h12.42c-.54 2.9-2.17 5.36-4.63 7.02l7.2 5.6C43.97 37.08 46.1 31.37 46.1 24.55z"/>
                <path fill="#FBBC05" d="M10.62 28.72a14.5 14.5 0 010-9.44l-8.02-6.22A23.97 23.97 0 000 24c0 3.87.92 7.54 2.6 10.94l8.02-6.22z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.92-2.14 15.9-5.82l-7.2-5.6c-2 1.35-4.56 2.15-8.7 2.15-6.26 0-11.5-3.8-13.38-9.1l-8.02 6.22C6.6 42.6 14.64 48 24 48z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
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
