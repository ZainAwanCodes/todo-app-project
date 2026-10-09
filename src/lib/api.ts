import type { Todo, CreateTodoInput, UpdateTodoInput } from "./types";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore JSON parse failures
    }
    throw new Error(message);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const todosApi = {
  getAll: (): Promise<Todo[]> => apiFetch("/api/todos"),

  create: (input: CreateTodoInput): Promise<Todo> =>
    apiFetch("/api/todos", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: number, input: UpdateTodoInput): Promise<Todo> =>
    apiFetch(`/api/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  delete: (id: number): Promise<void> =>
    apiFetch(`/api/todos/${id}`, { method: "DELETE" }),
};
