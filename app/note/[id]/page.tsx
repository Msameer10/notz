"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, type DocumentData, type DocumentSnapshot } from "firebase/firestore";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { NOTE_COLORS, isNoteColor, removeNote, updateNote, type NoteColor } from "@/lib/notes";

type NoteFields = {
  title: string;
  content: string;
  color: NoteColor;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const NOTE_COLOR_LABELS: Record<NoteColor, string> = {
  default: "Default",
  yellow: "Yellow",
  orange: "Orange",
  red: "Red",
  pink: "Pink",
  purple: "Purple",
  blue: "Blue",
  teal: "Teal",
  green: "Green",
};

function readNoteFields(snapshot: DocumentSnapshot<DocumentData>): NoteFields | null {
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    title: typeof data.title === "string" ? data.title : "",
    content: typeof data.content === "string" ? data.content : "",
    color: isNoteColor(data.color) ? data.color : "default",
  };
}

function areNoteFieldsEqual(left: NoteFields | null, right: NoteFields | null) {
  return (
    left?.title === right?.title &&
    left?.content === right?.content &&
    left?.color === right?.color
  );
}

function BackButton() {
  return (
    <Link href="/" className="button-neutral inline-flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors">
      <span aria-hidden="true">{"\u2190"}</span>
      <span>Back</span>
    </Link>
  );
}

function renderNoteState(message: string, secondaryMessage?: string) {
  return (
    <div className="mx-auto min-h-screen max-w-3xl p-6">
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
  const [color, setColor] = useState<NoteColor>("default");
  const [resolvedNoteId, setResolvedNoteId] = useState<string | null>(null);
  const [noteExists, setNoteExists] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const hasHydratedRef = useRef(false);
  const isDirtyRef = useRef(false);
  const draftRef = useRef<NoteFields>({ title: "", content: "", color: "default" });
  const lastServerSnapshotRef = useRef<NoteFields | null>(null);
  const saveRequestIdRef = useRef(0);

  const isNoteLoading = resolvedNoteId !== noteId;
  const isReady = !isNoteLoading && noteExists;

  useEffect(() => {
    draftRef.current = { title, content, color };
  }, [color, content, title]);

  useEffect(() => {
    hasHydratedRef.current = false;
    isDirtyRef.current = false;
    lastServerSnapshotRef.current = null;
    saveRequestIdRef.current = 0;
    draftRef.current = { title: "", content: "", color: "default" };

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
        setColor(nextFields.color);
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
        setColor(nextFields.color);
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
  }, [color, content, isReady, noteId, title, user]);

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
    draftRef.current = { title: nextTitle, content, color };
    setTitle(nextTitle);
    setSaveState("saving");
  };

  const onContentChange = (nextContent: string) => {
    isDirtyRef.current = true;
    draftRef.current = { title, content: nextContent, color };
    setContent(nextContent);
    setSaveState("saving");
  };

  const onColorChange = (nextColor: NoteColor) => {
    isDirtyRef.current = true;
    draftRef.current = { title, content, color: nextColor };
    setColor(nextColor);
    setSaveState("saving");
  };

  const onDelete = async () => {
    await removeNote(user.uid, noteId);
    router.push("/");
  };

  const isVisiblySaving = saveState === "saving" || saveState === "error";
  const saveStatusLabel = isVisiblySaving ? "Saving" : "Saved";
  const saveStatusState = isVisiblySaving ? "saving" : "saved";

  return (
    <div className="mx-auto min-h-screen max-w-3xl p-6">
      <header className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
        <BackButton />

        <div className="min-w-0 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="note-toolbar mx-auto flex w-max items-center gap-2 rounded-full border px-3 py-2">
            {NOTE_COLORS.map((noteColor) => (
              <button
                key={noteColor}
                type="button"
                title={NOTE_COLOR_LABELS[noteColor]}
                onClick={() => onColorChange(noteColor)}
                aria-label={`Set note color to ${NOTE_COLOR_LABELS[noteColor]}`}
                aria-pressed={color === noteColor}
                data-note-color={noteColor}
                className={`note-color-swatch ${color === noteColor ? "is-selected" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <div className="min-w-[9.5rem] text-right text-sm">
            <span className="note-status" data-state={saveStatusState}>
              <span className="note-status-dot" aria-hidden="true" />
              <span>{saveStatusLabel}</span>
            </span>
          </div>
          <button onClick={onDelete} className="button-danger rounded-lg border px-3 py-2 transition-colors">
            Delete
          </button>
        </div>
      </header>

      <div data-note-color={color} className="note-surface mt-6 rounded-2xl border px-5 py-5 sm:px-6 sm:py-6">
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Untitled"
          className="w-full bg-transparent text-2xl font-bold outline-none"
        />
        <textarea
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="Write something..."
          className="editor-scroll mt-4 w-full min-h-[74svh] resize-none bg-transparent pr-2 outline-none sm:min-h-[78svh]"
        />
      </div>
    </div>
  );
}
