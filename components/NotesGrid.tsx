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
        className="mt-6 rounded-2xl border p-5 sm:p-6"
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
        className="mt-6 rounded-2xl border p-6 text-center sm:p-8"
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
    <div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
      {notes.map((note) => (
        <Link
          key={note.id}
          href={`/note/${note.id}`}
          className="min-w-0 overflow-hidden rounded-xl border p-4 transition hover:shadow-md sm:p-5"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="min-w-0 text-base font-semibold leading-6 break-words [overflow-wrap:anywhere]">
            {note.title.trim() ? note.title : "Untitled"}
          </div>
          <div
            className="mt-2 min-w-0 text-sm leading-6 note-preview"
            style={{ color: "var(--muted)" }}
          >
            {note.content.trim() ? note.content : "No content"}
          </div>
        </Link>
      ))}
    </div>
  );
}
