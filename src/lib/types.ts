export type Priority = "low" | "medium" | "high";

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  priority: Priority;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: Priority;
  due_date?: string;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string | null;
  priority?: Priority;
  due_date?: string | null;
  completed?: boolean;
}

export type FilterType = "all" | "active" | "completed" | "high" | "overdue";
export type SortType = "newest" | "oldest" | "priority" | "due_date";
export type NavView = "overview" | "mytasks" | "today" | "upcoming" | "completed";
