"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { TaskForm } from "./TaskForm";
import type { Todo, CreateTodoInput } from "@/lib/types";

interface TaskDialogProps {
  mode: "create" | "edit";
  task?: Todo;
  onSubmit: (data: CreateTodoInput) => Promise<void>;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function TaskDialog({ mode, task, onSubmit, onClose, triggerRef }: TaskDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap + ESC
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'input, textarea, button, select, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'input, textarea, button, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !('disabled' in el && (el as { disabled: boolean }).disabled));
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      (triggerRef?.current ?? prev)?.focus();
    };
  }, [onClose, triggerRef]);

  return (
    <div className="dialog-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="dialog" ref={dialogRef}>
        <div className="dialog-header">
          <h2 className="dialog-title" id="dialog-title">
            {mode === "create" ? "New task" : "Edit task"}
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <div className="dialog-body">
          <TaskForm
            initial={task}
            onSubmit={onSubmit}
            onCancel={onClose}
            submitLabel={mode === "create" ? "Create task" : "Save changes"}
            isEdit={mode === "edit"}
          />
        </div>
      </div>
    </div>
  );
}
