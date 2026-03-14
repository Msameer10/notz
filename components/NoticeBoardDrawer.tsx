"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { onSnapshot, orderBy, query, type QueryDocumentSnapshot } from "firebase/firestore";
import { Trash2 } from "lucide-react";

import { boardCol, createBoardItem, removeBoardItem, updateBoardItem } from "@/lib/board";

type BoardItemDocument = {
  title?: unknown;
  content?: unknown;
};

type BoardItem = {
  id: string;
  title: string;
  content: string;
};

function mapBoardItem(snapshot: QueryDocumentSnapshot<BoardItemDocument>): BoardItem {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    title: typeof data.title === "string" ? data.title : "",
    content: typeof data.content === "string" ? data.content : "",
  };
}

function autosizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) {
    return;
  }

  textarea.style.height = "0px";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

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
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    if (!uid) {
      return;
    }

    const boardQuery = query(boardCol(uid), orderBy("updatedAt", "desc"));

    return onSnapshot(boardQuery, (snapshot) => {
      setItems(snapshot.docs.map(mapBoardItem));
    });
  }, [uid]);

  useLayoutEffect(() => {
    Object.values(textareaRefs.current).forEach(autosizeTextarea);
  }, [items, open]);

  const add = async () => {
    await createBoardItem(uid);
  };

  return (
    <>
      <div
        className={`board-overlay fixed inset-0 z-40 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />

      <aside
        className={`board-panel fixed top-0 right-0 z-50 h-screen w-[92vw] max-w-[560px] transition-transform duration-200 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="board-header border-b px-4 py-4 sm:px-5">
          <div className="board-header-copy min-w-0">
            <h2 className="text-lg font-semibold sm:text-xl">Notice Board</h2>
          </div>

          <div className="board-actions">
            <button onClick={add} className="button-primary rounded-lg border px-3 py-2 text-sm font-medium transition-colors">
              + Item
            </button>
            <button onClick={onClose} className="button-neutral rounded-lg border px-3 py-2 text-sm font-medium transition-colors">
              Close
            </button>
          </div>
        </div>

        <div className="board-list editor-scroll px-4 py-4 sm:px-5 sm:py-5">
          {items.map((item) => (
            <div key={item.id} className="board-card rounded-2xl border p-4">
              <div className="board-card-header flex items-start justify-between gap-3">
                <input
                  className="board-title-input min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none"
                  value={item.title}
                  placeholder="Untitled item"
                  onChange={(event) => updateBoardItem(uid, item.id, { title: event.target.value })}
                />
                <button
                  onClick={() => removeBoardItem(uid, item.id)}
                  className="board-delete-button button-danger inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
                  aria-label="Delete item"
                  title="Delete item"
                >
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              </div>
              <textarea
                ref={(node) => {
                  textareaRefs.current[item.id] = node;
                  autosizeTextarea(node);
                }}
                rows={1}
                className="board-content-input mt-2.5 block w-full resize-none bg-transparent text-sm leading-6 outline-none"
                value={item.content}
                placeholder="Write something..."
                onChange={(event) => {
                  autosizeTextarea(event.currentTarget);
                  updateBoardItem(uid, item.id, { content: event.target.value });
                }}
              />
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
