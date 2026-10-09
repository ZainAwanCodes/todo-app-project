import type { Todo } from "@/lib/types";
import { PriorityBadge } from "./PriorityBadge";
import { Clock, Pencil, Trash2 } from "lucide-react";

// ─── Inline date helpers (avoids IDE TS-server cache issues with @/lib/dateUtils) ─
function _startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function _parse(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}
function _isToday(raw: string | null | undefined): boolean {
  const d = _parse(raw);
  if (!d) return false;
  return _startOfDay(new Date()).getTime() === _startOfDay(d).getTime();
}
function _isTomorrow(raw: string | null | undefined): boolean {
  const d = _parse(raw);
  if (!d) return false;
  const tom = _startOfDay(new Date());
  tom.setDate(tom.getDate() + 1);
  return tom.getTime() === _startOfDay(d).getTime();
}
function _isPast(raw: string | null | undefined): boolean {
  const d = _parse(raw);
  return d ? d.getTime() < Date.now() : false;
}
function _friendlyDate(raw: string | null | undefined): string {
  const d = _parse(raw);
  if (!d) return "";
  if (_isToday(raw))    return `Today at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (_isTomorrow(raw)) return `Tomorrow at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
// ─────────────────────────────────────────────────────────────────────────────

interface TaskItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

export function TaskItem({ todo, onToggle, onEdit, onDelete }: TaskItemProps) {
  const overdue = !todo.completed && !!todo.due_date && _isPast(todo.due_date);
  const dueClass = overdue ? "overdue" : _isToday(todo.due_date) ? "today" : "";

  function stopPropagation(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <li
      className={`task-item${todo.completed ? " completed" : ""}${overdue ? " overdue" : ""}`}
      onClick={() => onEdit(todo)}
      aria-label={`Task: ${todo.title}${todo.completed ? " (completed)" : ""}`}
    >
      {/* Checkbox */}
      <button
        className={`check-btn${todo.completed ? " checked" : ""}`}
        onClick={e => { stopPropagation(e); onToggle(todo); }}
        aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
        aria-pressed={todo.completed}
      >
        {todo.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
            <path
              d="M1 4l2.5 2.5L9 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="task-body">
        <p className="task-title">{todo.title}</p>
        {todo.description && (
          <p className="task-desc">{todo.description}</p>
        )}
        <div className="task-meta">
          <PriorityBadge priority={todo.priority} />
          {todo.due_date && (
            <span className={`due-label ${dueClass}`}>
              <Clock size={11} aria-hidden="true" />
              {overdue ? "Overdue · " : ""}
              {_friendlyDate(todo.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="task-actions" onClick={stopPropagation}>
        <button
          className="task-action-btn"
          onClick={() => onEdit(todo)}
          aria-label={`Edit "${todo.title}"`}
        >
          <Pencil size={14} />
        </button>
        <button
          className="task-action-btn danger"
          onClick={() => onDelete(todo)}
          aria-label={`Delete "${todo.title}"`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
