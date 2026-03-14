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
  return left?.title === right?.title && left?.content === right?.content && left?.color === right?.color;
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
      <div className="mt-16 rounded-2xl border p-8" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
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
  const [isMobileColorMenuOpen, setIsMobileColorMenuOpen] = useState(false);

  const hasHydratedRef = useRef(false);
  const isDirtyRef = useRef(false);
  const draftRef = useRef<NoteFields>({ title: "", content: "", color: "default" });
  const lastServerSnapshotRef = useRef<NoteFields | null>(null);
  const saveRequestIdRef = useRef(0);
  const mobileColorMenuRef = useRef<HTMLDivElement | null>(null);

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
    if (!isMobileColorMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!mobileColorMenuRef.current?.contains(event.target as Node)) {
        setIsMobileColorMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isMobileColorMenuOpen]);

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
      <header className="grid grid-cols-[auto_1fr_auto] items-start gap-2 sm:gap-3">
        <BackButton />

        <div className="min-w-0 py-1">
          <div className="hidden overflow-x-auto [scrollbar-width:none] sm:block [&::-webkit-scrollbar]:hidden">
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

          <div className="sm:hidden">
            <div ref={mobileColorMenuRef} className="relative ml-auto w-fit">
              <button
                type="button"
                onClick={() => setIsMobileColorMenuOpen((open) => !open)}
                className="note-color-trigger note-toolbar inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5"
                aria-haspopup="menu"
                aria-expanded={isMobileColorMenuOpen}
                aria-label="Open note color menu"
              >
                <span className="note-color-trigger-dot" data-note-color={color} aria-hidden="true" />
                <span className="text-sm">Color</span>
              </button>

              {isMobileColorMenuOpen ? (
                <div className="note-color-menu absolute right-0 z-20 mt-2 w-44 rounded-2xl border p-2 shadow-xl">
                  {NOTE_COLORS.map((noteColor) => (
                    <button
                      key={noteColor}
                      type="button"
                      onClick={() => {
                        onColorChange(noteColor);
                        setIsMobileColorMenuOpen(false);
                      }}
                      className="note-color-menu-item flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm"
                      aria-pressed={color === noteColor}
                    >
                      <span className="note-color-trigger-dot" data-note-color={noteColor} aria-hidden="true" />
                      <span className="flex-1">{NOTE_COLOR_LABELS[noteColor]}</span>
                      {color === noteColor ? <span className="note-color-menu-check" aria-hidden="true" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <div className="min-w-[1rem] text-right text-sm sm:min-w-[9.5rem]">
            <span className="note-status" data-state={saveStatusState}>
              <span className="note-status-dot" aria-hidden="true" />
              <span className="hidden sm:inline">{saveStatusLabel}</span>
            </span>
          </div>
          <button onClick={onDelete} className="button-danger rounded-lg border px-2.5 py-2 transition-colors sm:px-3">
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