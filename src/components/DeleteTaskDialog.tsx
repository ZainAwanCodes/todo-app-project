"use client";
import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface DeleteTaskDialogProps {
  taskTitle: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function DeleteTaskDialog({ taskTitle, onConfirm, onCancel, isDeleting }: DeleteTaskDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="dialog-overlay"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      aria-describedby="delete-desc"
    >
      <div className="confirm-dialog">
        <div className="confirm-icon"><AlertTriangle size={22} /></div>
        <h2 className="confirm-title" id="delete-title">Delete task?</h2>
        <p className="confirm-body" id="delete-desc">
          <span className="confirm-task-name">&ldquo;{taskTitle}&rdquo;</span> will be permanently removed.
          This action cannot be undone.
        </p>
        <div className="confirm-actions">
          <button ref={cancelRef} className="btn btn-ghost btn-sm" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting…" : "Delete task"}
          </button>
        </div>
      </div>
    </div>
  );
}
