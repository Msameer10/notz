import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

export const NOTE_COLORS = [
  "default",
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "blue",
  "teal",
  "green",
] as const;

export type NoteColor = (typeof NOTE_COLORS)[number];

type NoteUpdate = {
  title?: string;
  content?: string;
  color?: NoteColor;
};

export function isNoteColor(value: unknown): value is NoteColor {
  return typeof value === "string" && NOTE_COLORS.includes(value as NoteColor);
}

export function notesCol(uid: string) {
  return collection(db, `users/${uid}/notes`);
}

export async function createNote(uid: string) {
  const ref = await addDoc(notesCol(uid), {
    title: "",
    content: "",
    color: "default",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateNote(uid: string, noteId: string, data: NoteUpdate) {
  const ref = doc(db, `users/${uid}/notes/${noteId}`);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function removeNote(uid: string, noteId: string) {
  const ref = doc(db, `users/${uid}/notes/${noteId}`);
  await deleteDoc(ref);
}
