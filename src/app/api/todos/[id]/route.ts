import { NextResponse } from "next/server";
import { sql, safeLogError } from "@/lib/db";


type Params = { params: Promise<{ id: string }> };

function parseId(idStr: string): number | null {
  const num = Number(idStr);
  if (!Number.isInteger(num) || num <= 0) {
    return null;
  }
  return num;
}

// GET /api/todos/[id]
export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const numId = parseId(id);
    if (numId === null) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const [todo] = await sql`
      SELECT id::int, title, description, priority, due_date, completed, created_at, updated_at
      FROM todos
      WHERE id = ${numId}
    `;

    if (!todo) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(todo, { status: 200 });
  } catch (error) {
    safeLogError("GET /api/todos/[id]", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

// PATCH /api/todos/[id] — update fields
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const numId = parseId(id);
    if (numId === null) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
    }

    const { title, description, priority, due_date, completed } = body;

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
    }

    // Validate priority if provided
    const validPriorities = ["low", "medium", "high"];
    if (priority !== undefined && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: "Priority must be 'low', 'medium', or 'high'" },
        { status: 400 }
      );
    }

    // Validate due_date if provided
    let safeDueDate: string | null | undefined = undefined;
    if (due_date !== undefined) {
      if (due_date === null || due_date === "") {
        safeDueDate = null;
      } else {
        const parsedDate = new Date(due_date);
        if (isNaN(parsedDate.getTime())) {
          return NextResponse.json({ error: "Invalid due_date format" }, { status: 400 });
        }
        safeDueDate = parsedDate.toISOString();
      }
    }

    const safeTitle = title !== undefined ? title.trim() : null;
    const safeDesc = description !== undefined ? (typeof description === "string" ? description.trim() : null) : undefined;
    const safeCompleted = typeof completed === "boolean" ? completed : undefined;

    const [todo] = await sql`
      UPDATE todos SET
        title       = COALESCE(${safeTitle}, title),
        description = CASE WHEN ${description !== undefined} THEN ${safeDesc ?? null} ELSE description END,
        priority    = CASE WHEN ${priority !== undefined} THEN ${priority} ELSE priority END,
        due_date    = CASE WHEN ${safeDueDate !== undefined} THEN ${safeDueDate} ELSE due_date END,
        completed   = CASE WHEN ${safeCompleted !== undefined} THEN ${safeCompleted} ELSE completed END,
        updated_at  = NOW()
      WHERE id = ${numId}
      RETURNING id::int, title, description, priority, due_date, completed, created_at, updated_at
    `;

    if (!todo) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(todo, { status: 200 });
  } catch (error) {
    safeLogError("PATCH /api/todos/[id]", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/todos/[id]
export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const numId = parseId(id);
    if (numId === null) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const [deleted] = await sql`DELETE FROM todos WHERE id = ${numId} RETURNING id::int`;
    if (!deleted) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    safeLogError("DELETE /api/todos/[id]", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
