"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Plus, Menu, X, RefreshCw } from "lucide-react";
import { todosApi } from "@/lib/api";
import type { Todo, CreateTodoInput, FilterType, SortType, NavView } from "@/lib/types";
import { isPast, isToday, isFuture, getGreeting, formatDisplayDate } from "@/lib/dateUtils";
import { ToastProvider, useToast } from "@/components/ToastProvider";
import { Sidebar, DrawerSidebar } from "@/components/Sidebar";
import { SummaryCards, computeNavCounts } from "@/components/SummaryCards";
import { Toolbar } from "@/components/Toolbar";
import { TaskList } from "@/components/TaskList";
import { TaskSkeleton } from "@/components/TaskSkeleton";
import { TaskDialog } from "@/components/TaskDialog";
import { DeleteTaskDialog } from "@/components/DeleteTaskDialog";

/* ─── Reducer ──────────────────────────────────────────────────────────────── */
type State = {
  todos: Todo[];
  loading: boolean;
  error: string | null;
};
type Action =
  | { type: "LOADING" }
  | { type: "LOADED"; todos: Todo[] }
  | { type: "ERROR"; error: string }
  | { type: "ADD"; todo: Todo }
  | { type: "UPDATE"; todo: Todo }
  | { type: "REMOVE"; id: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOADING": return { ...state, loading: true, error: null };
    case "LOADED":  return { todos: action.todos, loading: false, error: null };
    case "ERROR":   return { ...state, loading: false, error: action.error };
    case "ADD":     return { ...state, todos: [action.todo, ...state.todos] };
    case "UPDATE":  return { ...state, todos: state.todos.map(t => t.id === action.todo.id ? action.todo : t) };
    case "REMOVE":  return { ...state, todos: state.todos.filter(t => t.id !== action.id) };
    default: return state;
  }
}

/* ─── View helpers ─────────────────────────────────────────────────────────── */
const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

function applyViewFilter(todos: Todo[], view: NavView): Todo[] {
  switch (view) {
    case "overview":  return todos.filter(t => !t.completed).slice(0, 12);
    case "mytasks":   return todos;
    case "today":     return todos.filter(t => isToday(t.due_date));
    case "upcoming":  return todos.filter(t => !t.completed && (isFuture(t.due_date) || isPast(t.due_date)));
    case "completed": return todos.filter(t => t.completed);
    default: return todos;
  }
}

function applyFilterSort(
  todos: Todo[],
  filter: FilterType,
  sort: SortType,
  search: string
): Todo[] {
  let result = [...todos];

  // Filter
  if (filter === "active")    result = result.filter(t => !t.completed);
  if (filter === "completed") result = result.filter(t => t.completed);
  if (filter === "high")      result = result.filter(t => t.priority === "high");
  if (filter === "overdue")   result = result.filter(t => !t.completed && t.due_date && isPast(t.due_date));

  // Search
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q)
    );
  }

  // Sort
  result.sort((a, b) => {
    if (sort === "newest")   return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === "oldest")   return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sort === "priority") return (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
    if (sort === "due_date") {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return 0;
  });

  return result;
}

function getViewMeta(view: NavView): { title: string; subtitle: string } {
  const greeting = getGreeting();
  const date = formatDisplayDate();
  switch (view) {
    case "overview":  return { title: "Make today count.", subtitle: date };
    case "mytasks":   return { title: "My Tasks",          subtitle: "Everything in one place." };
    case "today":     return { title: "Today",             subtitle: date };
    case "upcoming":  return { title: "Upcoming",          subtitle: "Plan ahead, stay on track." };
    case "completed": return { title: "Completed",         subtitle: "A little progress adds up." };
    default:          return { title: "DAYMARK",           subtitle: "" };
  }
}

/* ─── Inner App (has toast context) ────────────────────────────────────────── */
function AppInner() {
  const { toast } = useToast();
  const [state, dispatch] = useReducer(reducer, { todos: [], loading: true, error: null });
  const [view, setView] = useState<NavView>("overview");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Todo | null>(null);
  const [deleteTask, setDeleteTask] = useState<Todo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const newTaskBtnRef = useRef<HTMLButtonElement>(null);

  // ── Load todos ──────────────────────────────────────────────────────────
  async function loadTodos() {
    dispatch({ type: "LOADING" });
    try {
      const todos = await todosApi.getAll();
      dispatch({ type: "LOADED", todos });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not load tasks.";
      dispatch({ type: "ERROR", error: msg });
    }
  }

  useEffect(() => { 
    setMounted(true);
    loadTodos(); 
  }, []);

  // ── Create ──────────────────────────────────────────────────────────────
  async function handleCreate(data: CreateTodoInput) {
    const todo = await todosApi.create(data);
    dispatch({ type: "ADD", todo });
    setCreateOpen(false);
    toast("Task created.", "success");
  }

  // ── Edit ────────────────────────────────────────────────────────────────
  async function handleEdit(data: CreateTodoInput) {
    if (!editTask) return;
    const updated = await todosApi.update(editTask.id, data);
    dispatch({ type: "UPDATE", todo: updated });
    setEditTask(null);
    toast("Task updated.", "success");
  }

  // ── Toggle ──────────────────────────────────────────────────────────────
  async function handleToggle(todo: Todo) {
    // Optimistic update
    dispatch({ type: "UPDATE", todo: { ...todo, completed: !todo.completed } });
    try {
      const updated = await todosApi.update(todo.id, { completed: !todo.completed });
      dispatch({ type: "UPDATE", todo: updated });
      toast(updated.completed ? "Task completed!" : "Task reopened.", "success");
    } catch {
      dispatch({ type: "UPDATE", todo }); // revert
      toast("Could not update task.", "error");
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────
  async function handleDeleteConfirm() {
    if (!deleteTask) return;
    setIsDeleting(true);
    try {
      await todosApi.delete(deleteTask.id);
      dispatch({ type: "REMOVE", id: deleteTask.id });
      setDeleteTask(null);
      toast("Task deleted.", "info");
    } catch {
      toast("Could not delete task.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const viewTodos  = useMemo(() => applyViewFilter(state.todos, view), [state.todos, view]);
  const displayed  = useMemo(() => applyFilterSort(viewTodos, filter, sort, search), [viewTodos, filter, sort, search]);
  const navCounts  = useMemo(() => computeNavCounts(state.todos), [state.todos]);
  const { title, subtitle } = mounted ? getViewMeta(view) : { title: "DAYMARK", subtitle: "" };

  const isFiltered = filter !== "all" || !!search.trim();
  const allEmpty   = state.todos.length === 0 && !state.loading;
  const filtEmpty  = !allEmpty && displayed.length === 0;

  function handleNavigate(v: NavView) {
    setView(v);
    setFilter("all");
    setSearch("");
  }

  function openCreate() { setCreateOpen(true); }

  return (
    <div className="app-shell">
      {/* ── Desktop Sidebar ── */}
      <Sidebar
        activeView={view}
        onNavigate={handleNavigate}
        onNewTask={openCreate}
        counts={navCounts}
      />

      {/* ── Mobile Top Bar ── */}
      <header className="mobile-topbar">
        <button
          className="icon-btn"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          aria-controls="mobile-drawer"
        >
          <Menu size={20} />
        </button>
        <div className="mobile-logo">
          <div className="mobile-mark" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M3 9l4 4 8-8" stroke="#20231F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="mobile-wordmark">DAYMARK</span>
        </div>
        <button className="icon-btn" onClick={openCreate} aria-label="New task">
          <Plus size={20} />
        </button>
      </header>

      {/* ── Mobile Drawer ── */}
      <div
        className={`drawer-overlay${drawerOpen ? " open" : ""}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <div
        id="mobile-drawer"
        className={`drawer${drawerOpen ? " open" : ""}`}
        role="dialog"
        aria-label="Navigation"
        aria-hidden={!drawerOpen}
      >
        <DrawerSidebar
          activeView={view}
          onNavigate={handleNavigate}
          onNewTask={openCreate}
          onClose={() => setDrawerOpen(false)}
          counts={navCounts}
        />
      </div>

      {/* ── Main Workspace ── */}
      <main className="workspace">
        <div className="workspace-inner">

          {/* Page Header */}
          <div className="page-header">
            <div className="page-header-left">
              {view === "overview" && (
                <p className="page-greeting">{mounted ? getGreeting() : ""} ·</p>
              )}
              <h1 className="page-title">{title}</h1>
              <p className="page-subtitle">{subtitle}</p>
            </div>
            <button
              ref={newTaskBtnRef}
              id="new-task-btn"
              className="new-task-btn"
              onClick={openCreate}
            >
              <Plus size={16} aria-hidden="true" />
              New task
            </button>
          </div>

          {/* Error banner */}
          {state.error && (
            <div
              role="alert"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 16px", marginBottom: 20,
                background: "var(--error-soft)", border: "1px solid #fca5a5",
                borderRadius: "var(--radius)", fontSize: "0.875rem", color: "var(--error)"
              }}
            >
              <span style={{ flex: 1 }}>{state.error}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={loadTodos}
                style={{ gap: 4 }}
              >
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          {/* Summary Cards — Overview + My Tasks only */}
          {(view === "overview" || view === "mytasks") && !state.loading && (
            <SummaryCards
              todos={state.todos}
              activeFilter={filter}
              onFilterChange={setFilter}
            />
          )}

          {/* Toolbar — My Tasks / Upcoming */}
          {(view === "mytasks" || view === "upcoming" || view === "today") && (
            <Toolbar
              search={search}
              filter={filter}
              sort={sort}
              onSearch={setSearch}
              onFilter={setFilter}
              onSort={setSort}
            />
          )}

          {/* Simple search for overview */}
          {view === "overview" && (
            <Toolbar
              search={search}
              filter="all"
              sort={sort}
              onSearch={setSearch}
              onFilter={() => {}}
              onSort={setSort}
            />
          )}

          {/* Task list / skeleton */}
          {state.loading ? (
            <TaskSkeleton />
          ) : (
            <TaskList
              todos={displayed}
              allEmpty={allEmpty}
              filteredEmpty={filtEmpty}
              isFiltered={isFiltered}
              onToggle={handleToggle}
              onEdit={setEditTask}
              onDelete={setDeleteTask}
              onCreateFirst={openCreate}
              onClearFilters={() => { setFilter("all"); setSearch(""); }}
            />
          )}
        </div>
      </main>

      {/* ── Create Dialog ── */}
      {createOpen && (
        <TaskDialog
          mode="create"
          onSubmit={handleCreate}
          onClose={() => setCreateOpen(false)}
          triggerRef={newTaskBtnRef}
        />
      )}

      {/* ── Edit Dialog ── */}
      {editTask && (
        <TaskDialog
          mode="edit"
          task={editTask}
          onSubmit={handleEdit}
          onClose={() => setEditTask(null)}
        />
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTask && (
        <DeleteTaskDialog
          taskTitle={deleteTask.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTask(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}

/* ─── Root export ───────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
