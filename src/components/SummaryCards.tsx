import type { Todo, FilterType } from "@/lib/types";
import type { NavView } from "@/lib/types";
import { isPast, isToday, isFuture } from "@/lib/dateUtils";

interface SummaryCardsProps {
  todos: Todo[];
  activeFilter: FilterType;
  onFilterChange: (f: FilterType) => void;
}

interface CardDef {
  label: string;
  filter: FilterType;
  count: (todos: Todo[]) => number;
  extraClass?: string;
}

const cards: CardDef[] = [
  { label: "Total",     filter: "all",       count: t => t.length },
  { label: "Pending",   filter: "active",    count: t => t.filter(x => !x.completed).length },
  { label: "Done",      filter: "completed", count: t => t.filter(x => x.completed).length },
  { label: "Overdue",   filter: "overdue",   count: t => t.filter(x => !x.completed && isPast(x.due_date) && x.due_date !== null).length, extraClass: "overdue-card" },
];

export function SummaryCards({ todos, activeFilter, onFilterChange }: SummaryCardsProps) {
  return (
    <div className="summary-grid" role="list">
      {cards.map(({ label, filter, count, extraClass }) => {
        const n = count(todos);
        const isActive = activeFilter === filter;
        const hasOverdue = extraClass === "overdue-card" && n > 0;
        return (
          <button
            key={filter}
            role="listitem"
            className={`summary-card${isActive ? " active" : ""}${extraClass ? ` ${extraClass}` : ""}${hasOverdue ? " has-overdue" : ""}`}
            onClick={() => onFilterChange(filter)}
            aria-pressed={isActive}
            aria-label={`${label}: ${n} tasks`}
          >
            <p className="summary-label">{label}</p>
            <p className="summary-value">{n}</p>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Per-view computed counts for sidebar badges ── */
export function computeNavCounts(todos: Todo[]): Record<NavView, number> {
  const today    = todos.filter(t => !t.completed && isToday(t.due_date)).length;
  const upcoming = todos.filter(t => !t.completed && isFuture(t.due_date) && !isToday(t.due_date)).length;
  const active   = todos.filter(t => !t.completed).length;
  const done     = todos.filter(t =>  t.completed).length;
  return {
    overview:  active,
    mytasks:   todos.length,
    today,
    upcoming,
    completed: done,
  };
}
