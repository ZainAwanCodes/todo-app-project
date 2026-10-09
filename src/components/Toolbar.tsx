"use client";
import { Search, X, ArrowUpDown } from "lucide-react";
import type { FilterType, SortType } from "@/lib/types";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "active",    label: "Active" },
  { value: "completed", label: "Done" },
  { value: "high",      label: "High Priority" },
  { value: "overdue",   label: "Overdue" },
];

const SORTS: { value: SortType; label: string }[] = [
  { value: "newest",   label: "Newest first" },
  { value: "oldest",   label: "Oldest first" },
  { value: "priority", label: "Priority" },
  { value: "due_date", label: "Due date" },
];

interface ToolbarProps {
  search: string;
  filter: FilterType;
  sort: SortType;
  onSearch: (v: string) => void;
  onFilter: (v: FilterType) => void;
  onSort: (v: SortType) => void;
}

export function Toolbar({ search, filter, sort, onSearch, onFilter, onSort }: ToolbarProps) {
  return (
    <div className="toolbar" role="search">
      {/* Search */}
      <div className="search-wrap">
        <Search size={15} className="search-icon" aria-hidden="true" />
        <input
          id="task-search"
          type="search"
          className="search-input"
          placeholder="Search tasks…"
          value={search}
          onChange={e => onSearch(e.target.value)}
          aria-label="Search tasks"
          autoComplete="off"
        />
        {search && (
          <button className="search-clear" onClick={() => onSearch("")} aria-label="Clear search">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="filter-chips" role="group" aria-label="Filter tasks">
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`filter-chip${filter === f.value ? " active" : ""}`}
            onClick={() => onFilter(f.value)}
            aria-pressed={filter === f.value}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        className="sort-select"
        value={sort}
        onChange={e => onSort(e.target.value as SortType)}
        aria-label="Sort tasks"
      >
        {SORTS.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}
