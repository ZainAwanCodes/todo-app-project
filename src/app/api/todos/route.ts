import { NextResponse } from "next/server";
import { sql, ensureSchema, safeLogError } from "@/lib/db";


interface NeonError {
  code?: string;
  message?: string;
}

// GET /api/todos — fetch all todos ordered by created_at desc
export async function GET() {
  try {
    let todos;
    try {
      todos = await sql`
        SELECT id::int, title, description, priority, due_date, completed, created_at, updated_at
        FROM todos
        ORDER BY created_at DESC
      `;
    } catch (dbError: unknown) {
      const err = dbError as NeonError;
      // If table doesn't exist yet (PostgreSQL error code 42P01: undefined_table), create it and retry
      if (err?.code === "42P01") {
        await ensureSchema();
        todos = await sql`
          SELECT id::int, title, description, priority, due_date, completed, created_at, updated_at
          FROM todos
          ORDER BY created_at DESC
        `;
      } else {
        throw dbError;
      }
    }

    return NextResponse.json(todos, { status: 200 });
  } catch (error) {
    safeLogError("GET /api/todos", error);
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 });
  }
}

// POST /api/todos — create a new todo
export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { title, description, priority, due_date } = body ?? {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const validPriorities = ["low", "medium", "high"];
    const safePriority = validPriorities.includes(priority) ? priority : "medium";

    let safeDueDate: string | null = null;
    if (due_date) {
      const parsedDate = new Date(due_date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Invalid due_date format" }, { status: 400 });
      }
      safeDueDate = parsedDate.toISOString();
    }

    const trimmedTitle = title.trim();
    const trimmedDesc = typeof description === "string" && description.trim() ? description.trim() : null;

    let result;
    try {
      result = await sql`
        INSERT INTO todos (title, description, priority, due_date)
        VALUES (
          ${trimmedTitle},
          ${trimmedDesc},
          ${safePriority},
          ${safeDueDate}
        )
        RETURNING id::int, title, description, priority, due_date, completed, created_at, updated_at
      `;
    } catch (dbError: unknown) {
      const err = dbError as NeonError;
      if (err?.code === "42P01") {
        await ensureSchema();
        result = await sql`
          INSERT INTO todos (title, description, priority, due_date)
          VALUES (
            ${trimmedTitle},
            ${trimmedDesc},
            ${safePriority},
            ${safeDueDate}
          )
          RETURNING id::int, title, description, priority, due_date, completed, created_at, updated_at
        `;
      } else {
        throw dbError;
      }
    }

    const [todo] = result;
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    safeLogError("POST /api/todos", error);
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}
