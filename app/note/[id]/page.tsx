"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, type DocumentData, type DocumentSnapshot } from "firebase/firestore";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { removeNote, updateNote } from "@/lib/notes";

type NoteFields = {
  title: string;
  content: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function readNoteFields(snapshot: DocumentSnapshot<DocumentData>): NoteFields | null {
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    title: typeof data.title === "string" ? data.title : "",
    content: typeof data.content === "string" ? data.content : "",
  };
}

function areNoteFieldsEqual(left: NoteFields | null, right: NoteFields | null) {
  return left?.title === right?.title && left?.content === right?.content;
}

function BackButton() {
  return (
    <Link href="/" className="button-neutral inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors">
      <span aria-hidden="true">{"\u2190"}</span>
      <span>Back</span>
    </Link>
  );
}

function renderNoteState(message: string, secondaryMessage?: string) {
  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <div
        className="mt-16 rounded-2xl border p-8"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <BackButton />
        <h1 className="mt-6 text-2xl font-semibold">{message}</h1>
        {secondaryMessage ? (
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {secondaryMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function NotePage() {
  const { user, loading } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const noteId = params.id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [resolvedNoteId, setResolvedNoteId] = useState<string | null>(null);
  const [noteExists, setNoteExists] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const hasHydratedRef = useRef(false);
  const isDirtyRef = useRef(false);
  const draftRef = useRef<NoteFields>({ title: "", content: "" });
  const lastServerSnapshotRef = useRef<NoteFields | null>(null);
  const saveRequestIdRef = useRef(0);

  const isNoteLoading = resolvedNoteId !== noteId;
  const isReady = !isNoteLoading && noteExists;

  useEffect(() => {
    draftRef.current = { title, content };
  }, [content, title]);

  useEffect(() => {
    hasHydratedRef.current = false;
    isDirtyRef.current = false;
    lastServerSnapshotRef.current = null;
    saveRequestIdRef.current = 0;
    draftRef.current = { title: "", content: "" };

    if (!user) {
      return;
    }

    const noteRef = doc(db, `users/${user.uid}/notes/${noteId}`);
    const unsubscribe = onSnapshot(noteRef, (snapshot) => {
      const nextFields = readNoteFields(snapshot);

      setResolvedNoteId(noteId);

      if (!nextFields) {
        hasHydratedRef.current = true;
        isDirtyRef.current = false;
        lastServerSnapshotRef.current = null;
        setNoteExists(false);
        setSaveState("idle");
        return;
      }

      const currentDraft = draftRef.current;
      const hasUnsyncedLocalEdits = isDirtyRef.current;
      lastServerSnapshotRef.current = nextFields;
      setNoteExists(true);

      if (!hasHydratedRef.current) {
        hasHydratedRef.current = true;
        isDirtyRef.current = false;
        draftRef.current = nextFields;
        setTitle(nextFields.title);
        setContent(nextFields.content);
        setSaveState("idle");
        return;
      }

      if (hasUnsyncedLocalEdits) {
        if (areNoteFieldsEqual(nextFields, currentDraft)) {
          isDirtyRef.current = false;
          setSaveState("saved");
        }

        return;
      }

      if (!areNoteFieldsEqual(nextFields, currentDraft)) {
        draftRef.current = nextFields;
        setTitle(nextFields.title);
        setContent(nextFields.content);
      }

      setSaveState("idle");
    });

    return () => unsubscribe();
  }, [noteId, user]);

  useEffect(() => {
    if (!user || !isReady || !isDirtyRef.current) {
      return;
    }

    const currentDraft = draftRef.current;
    const lastServerSnapshot = lastServerSnapshotRef.current;

    if (areNoteFieldsEqual(currentDraft, lastServerSnapshot)) {
      isDirtyRef.current = false;
      return;
    }

    const requestId = saveRequestIdRef.current + 1;
    saveRequestIdRef.current = requestId;

    const timeoutId = window.setTimeout(async () => {
      try {
        await updateNote(user.uid, noteId, currentDraft);

        if (saveRequestIdRef.current !== requestId || !isDirtyRef.current) {
          return;
        }

        if (areNoteFieldsEqual(lastServerSnapshotRef.current, draftRef.current)) {
          isDirtyRef.current = false;
          setSaveState("saved");
        }
      } catch {
        if (saveRequestIdRef.current === requestId) {
          setSaveState("error");
        }
      }
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [content, isReady, noteId, title, user]);

  if (loading) {
    return renderNoteState("Loading note...");
  }

  if (!user) {
    return renderNoteState("Please sign in.", "You need an active session to view this note.");
  }

  if (isNoteLoading) {
    return renderNoteState("Loading note...");
  }

  if (!noteExists) {
    return renderNoteState("Note not found.", "This note may have been deleted or never existed.");
  }

  const onTitleChange = (nextTitle: string) => {
    isDirtyRef.current = true;
    draftRef.current = { title: nextTitle, content };
    setTitle(nextTitle);
    setSaveState("saving");
  };

  const onContentChange = (nextContent: string) => {
    isDirtyRef.current = true;
    draftRef.current = { title, content: nextContent };
    setContent(nextContent);
    setSaveState("saving");
  };

  const onDelete = async () => {
    await removeNote(user.uid, noteId);
    router.push("/");
  };

  const saveStatusLabel =
    saveState === "saving"
      ? "Saving..."
      : saveState === "saved"
        ? "All changes saved"
        : saveState === "error"
          ? "Could not save changes"
          : "Ready";

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between gap-3">
        <BackButton />

        <div className="flex items-center gap-3">
          <div className="text-sm" style={{ color: saveState === "error" ? "#ef4444" : "var(--muted)" }}>
            {saveStatusLabel}
          </div>
          <button onClick={onDelete} className="button-danger px-3 py-2 rounded-lg border transition-colors">
            Delete
          </button>
        </div>
      </header>

      <div className="mt-6">
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Title"
          className="w-full text-2xl font-bold outline-none bg-transparent"
        />
        <textarea
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="Write something..."
          className="mt-4 w-full min-h-[60vh] outline-none bg-transparent resize-none"
        />
      </div>
    </div>
  );
}
