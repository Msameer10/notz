import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

export function boardCol(uid: string) {
  return collection(db, `users/${uid}/board`);
}

export async function createBoardItem(uid: string) {
  const ref = await addDoc(boardCol(uid), {
    title: "New board item",
    content: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBoardItem(
  uid: string,
  id: string,
  data: { title?: string; content?: string }
) {
  const ref = doc(db, `users/${uid}/board/${id}`);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function removeBoardItem(uid: string, id: string) {
  const ref = doc(db, `users/${uid}/board/${id}`);
  await deleteDoc(ref);
}
