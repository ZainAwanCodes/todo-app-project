import type { Todo } from "@/lib/types";
import { TaskItem } from "./TaskItem";
import { ClipboardList, SearchX } from "lucide-react";

interface TaskListProps {
  todos: Todo[];
  allEmpty: boolean;
  filteredEmpty: boolean;
  isFiltered: boolean;
  onToggle: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onCreateFirst: () => void;
  onClearFilters: () => void;
}

export function TaskList({
  todos, allEmpty, filteredEmpty, isFiltered,
  onToggle, onEdit, onDelete, onCreateFirst, onClearFilters
}: TaskListProps) {
  if (allEmpty) {
    return (
      <div className="empty-state">
        <div className="empty-illustration">
          <ClipboardList size={32} />
        </div>
        <h2 className="empty-title">A fresh page.</h2>
        <p className="empty-sub">Your next big thing can start with one small task. Add your first one now.</p>
        <button className="empty-cta" onClick={onCreateFirst}>
          + Create your first task
        </button>
      </div>
    );
  }

  if (filteredEmpty) {
    return (
      <div className="empty-state">
        <div className="empty-illustration" style={{ background: "var(--muted)", color: "var(--text-secondary)" }}>
          <SearchX size={32} />
        </div>
        <h2 className="empty-title">No tasks match.</h2>
        <p className="empty-sub">No tasks match these filters. Try a different search or filter.</p>
        {isFiltered && (
          <button className="empty-cta" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }} onClick={onClearFilters}>
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <ul className="task-list" aria-label="Task list">
      {todos.map(todo => (
        <TaskItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
