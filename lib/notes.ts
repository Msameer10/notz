import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

export function notesCol(uid: string) {
  return collection(db, `users/${uid}/notes`);
}

export async function createNote(uid: string) {
  const ref = await addDoc(notesCol(uid), {
    title: "Untitled",
    content: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateNote(uid: string, noteId: string, data: { title?: string; content?: string }) {
  const ref = doc(db, `users/${uid}/notes/${noteId}`);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function removeNote(uid: string, noteId: string) {
  const ref = doc(db, `users/${uid}/notes/${noteId}`);
  await deleteDoc(ref);
}
