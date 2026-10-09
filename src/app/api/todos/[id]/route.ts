import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// GET /api/todos/[id]
export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const [todo] = await sql`
      SELECT id, title, description, priority, due_date, completed, created_at, updated_at
      FROM todos WHERE id = ${id}
    `;
    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }
    return NextResponse.json(todo);
  } catch (error) {
    console.error("GET /api/todos/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch todo" }, { status: 500 });
  }
}

// PATCH /api/todos/[id] — update fields
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Build partial update — only update fields that were supplied
    const { title, description, priority, due_date, completed } = body;

    const validPriorities = ["low", "medium", "high"];

    const [todo] = await sql`
      UPDATE todos SET
        title       = COALESCE(${title ?? null}, title),
        description = CASE WHEN ${Object.prototype.hasOwnProperty.call(body, "description")} THEN ${description ?? null} ELSE description END,
        priority    = CASE WHEN ${priority != null} AND ${validPriorities.includes(priority)} THEN ${priority} ELSE priority END,
        due_date    = CASE WHEN ${Object.prototype.hasOwnProperty.call(body, "due_date")} THEN ${due_date ?? null} ELSE due_date END,
        completed   = CASE WHEN ${completed != null} THEN ${completed} ELSE completed END,
        updated_at  = NOW()
      WHERE id = ${id}
      RETURNING id, title, description, priority, due_date, completed, created_at, updated_at
    `;
    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }
    return NextResponse.json(todo);
  } catch (error) {
    console.error("PATCH /api/todos/[id] error:", error);
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

// DELETE /api/todos/[id]
export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await sql`DELETE FROM todos WHERE id = ${id}`;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/todos/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
  }
}
