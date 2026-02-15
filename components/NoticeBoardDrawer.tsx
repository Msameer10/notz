"use client";

import { useEffect, useState } from "react";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { boardCol, createBoardItem, removeBoardItem, updateBoardItem } from "@/lib/board";

type BoardItem = { id: string; title?: string; content?: string };

export default function NoticeBoardDrawer({
  uid,
  open,
  onClose,
}: {
  uid: string;
  open: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<BoardItem[]>([]);

  useEffect(() => {
    if (!uid) return;
    const q = query(boardCol(uid), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
  }, [uid]);

  const add = async () => {
    await createBoardItem(uid);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.35)" }}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 right-0 z-50 h-screen w-[90vw] max-w-[560px] border-l
                    transition-transform duration-200 ease-out
                    ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "var(--bg)", borderColor: "var(--border)" }}
      >
        <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: "var(--border)" }}>
          <div className="font-bold text-lg">Notice Board</div>
          <div className="flex gap-2">
            <button onClick={add} className="px-3 py-2 rounded-lg border">+ Item</button>
            <button onClick={onClose} className="px-3 py-2 rounded-lg border">Close</button>
          </div>
        </div>

        <div className="p-4 space-y-3 overflow-auto h-[calc(100vh-64px)]">
          {items.map((it) => (
            <div key={it.id} className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
              <input
                className="w-full font-semibold bg-transparent outline-none"
                value={it.title ?? ""}
                onChange={(e) => updateBoardItem(uid, it.id, { title: e.target.value })}
              />
              <textarea
                className="mt-2 w-full bg-transparent outline-none resize-none min-h-[90px]"
                value={it.content ?? ""}
                onChange={(e) => updateBoardItem(uid, it.id, { content: e.target.value })}
              />
              <div className="mt-2 flex justify-end">
                <button onClick={() => removeBoardItem(uid, it.id)} className="px-3 py-2 rounded-lg border">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
