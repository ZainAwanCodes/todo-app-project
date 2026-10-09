"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";
import type { Todo, CreateTodoInput, Priority } from "@/lib/types";

interface TaskFormProps {
  initial?: Partial<Todo>;
  onSubmit: (data: CreateTodoInput & { completed?: boolean }) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isEdit?: boolean;
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function TaskForm({ initial, onSubmit, onCancel, submitLabel = "Create task", isEdit }: TaskFormProps) {
  const [title, setTitle]         = useState(initial?.title ?? "");
  const [desc, setDesc]           = useState(initial?.description ?? "");
  const [priority, setPriority]   = useState<Priority>(initial?.priority ?? "medium");
  const [dueDate, setDueDate]     = useState(
    initial?.due_date ? initial.due_date.slice(0, 16) : ""
  );
  const [titleError, setTitleError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const validate = useCallback(() => {
    if (!title.trim()) { setTitleError("Task title is required."); return false; }
    setTitleError("");
    return true;
  }, [title]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: desc.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Title */}
      <div className="form-field">
        <label htmlFor="task-title" className="form-label">
          Title <span aria-hidden="true">*</span>
        </label>
        <input
          id="task-title"
          ref={titleRef}
          className={`form-input${titleError ? " error" : ""}`}
          value={title}
          onChange={e => { setTitle(e.target.value); if (titleError) setTitleError(""); }}
          onBlur={validate}
          placeholder="What needs to be done?"
          aria-describedby={titleError ? "title-error" : undefined}
          aria-required="true"
          autoComplete="off"
        />
        {titleError && <span id="title-error" className="form-error" role="alert">{titleError}</span>}
      </div>

      {/* Description */}
      <div className="form-field">
        <label htmlFor="task-desc" className="form-label">Description</label>
        <textarea
          id="task-desc"
          className="form-textarea"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Add more context… (optional)"
          rows={3}
        />
      </div>

      {/* Priority + Due Date */}
      <div className="form-row">
        <div className="form-field" style={{ marginBottom: 0 }}>
          <span className="form-label" id="priority-label">Priority</span>
          <div className="priority-group" role="group" aria-labelledby="priority-label">
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                type="button"
                className={`priority-option ${priority === p.value ? `selected-${p.value}` : ""}`}
                onClick={() => setPriority(p.value)}
                aria-pressed={priority === p.value}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field" style={{ marginBottom: 0 }}>
          <label htmlFor="task-due" className="form-label">Due date</label>
          <input
            id="task-due"
            type="datetime-local"
            className="form-input"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>
      </div>

      {/* Footer buttons live in parent dialog */}
      <div style={{ display: "none" }} aria-hidden="true">
        <button type="submit" />
      </div>

      {/* Actual submit row */}
      <div className="dialog-footer" style={{ padding: "20px 0 0" }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting || !title.trim()}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
