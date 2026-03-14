"use client";

import Link from "next/link";

export type NoteCard = {
  id: string;
  title: string;
  content: string;
};

type NotesGridProps = {
  notes: NoteCard[];
  isLoading: boolean;
};

export default function NotesGrid({ notes, isLoading }: NotesGridProps) {
  if (isLoading) {
    return (
      <div
        className="mt-6 rounded-2xl border p-6"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Loading your notes...
        </p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div
        className="mt-6 rounded-2xl border p-8 text-center"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <h2 className="text-lg font-semibold">No notes yet</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Create your first note to start writing.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <Link
          key={note.id}
          href={`/note/${note.id}`}
          className="rounded-xl border p-4 transition hover:shadow-md"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="font-semibold truncate">{note.title.trim() ? note.title : "Untitled"}</div>
          <div className="mt-2 text-sm line-clamp-3" style={{ color: "var(--muted)" }}>
            {note.content.trim() ? note.content : "No content"}
          </div>
        </Link>
      ))}
    </div>
  );
}
