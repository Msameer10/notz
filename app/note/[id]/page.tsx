"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { removeNote, updateNote } from "@/lib/notes";

function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, ms: number) {
  const timeoutRef = useMemo(() => ({ t: null as any }), []);
  return (...args: Parameters<T>) => {
    if (timeoutRef.t) clearTimeout(timeoutRef.t);
    timeoutRef.t = setTimeout(() => fn(...args), ms);
  };
}

export default function NotePage() {
  const { user, loading } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const noteId = params.id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!user) return;

    const ref = doc(db, `users/${user.uid}/notes/${noteId}`);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as any;
      setTitle(data.title ?? "");
      setContent(data.content ?? "");
    });

    return () => unsub();
  }, [user, noteId]);

  const saveDebounced = useDebouncedCallback(async (t: string, c: string) => {
    if (!user) return;
    await updateNote(user.uid, noteId, { title: t, content: c });
  }, 400);

  useEffect(() => {
    if (!user) return;
    saveDebounced(title, content);
  }, [title, content, user, saveDebounced]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6">Please sign in.</div>;

  const onDelete = async () => {
    await removeNote(user.uid, noteId);
    router.push("/");
  };

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="px-3 py-2 rounded-lg border">
          ← Back
        </Link>
        <button onClick={onDelete} className="px-3 py-2 rounded-lg border">
          Delete
        </button>
      </header>

      <div className="mt-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full text-2xl font-bold outline-none bg-transparent"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write something..."
          className="mt-4 w-full min-h-[60vh] outline-none bg-transparent resize-none"
        />
      </div>
    </div>
  );
}
