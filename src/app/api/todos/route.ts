import { NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";

// GET /api/todos — fetch all todos ordered by created_at desc
export async function GET() {
  try {
    await initDb();
    const todos = await sql`
      SELECT id, title, description, priority, due_date, completed, created_at, updated_at
      FROM todos
      ORDER BY created_at DESC
    `;
    return NextResponse.json(todos);
  } catch (error) {
    console.error("GET /api/todos error:", error);
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 });
  }
}

// POST /api/todos — create a new todo
export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { title, description, priority, due_date } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const validPriorities = ["low", "medium", "high"];
    const safePriority = validPriorities.includes(priority) ? priority : "medium";
    const safeDueDate = due_date || null;

    const [todo] = await sql`
      INSERT INTO todos (title, description, priority, due_date)
      VALUES (
        ${title.trim()},
        ${description?.trim() || null},
        ${safePriority},
        ${safeDueDate}
      )
      RETURNING id, title, description, priority, due_date, completed, created_at, updated_at
    `;
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("POST /api/todos error:", error);
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}
