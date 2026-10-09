"use client";
import type { NavView } from "@/lib/types";
import { LayoutDashboard, ListTodo, CalendarDays, CalendarClock, CheckCheck, Plus } from "lucide-react";

const NAV_ITEMS: { view: NavView; label: string; icon: React.ElementType }[] = [
  { view: "overview",   label: "Overview",   icon: LayoutDashboard },
  { view: "mytasks",    label: "My Tasks",   icon: ListTodo },
  { view: "today",      label: "Today",      icon: CalendarDays },
  { view: "upcoming",   label: "Upcoming",   icon: CalendarClock },
  { view: "completed",  label: "Completed",  icon: CheckCheck },
];

interface SidebarProps {
  activeView: NavView;
  onNavigate: (v: NavView) => void;
  onNewTask: () => void;
  counts: Record<NavView, number>;
}

function DaymarkLogo() {
  return (
    <div className="sidebar-logo">
      <div className="sidebar-mark" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 9l4 4 8-8" stroke="#20231F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="sidebar-wordmark">DAYMARK</span>
    </div>
  );
}

export function Sidebar({ activeView, onNavigate, onNewTask, counts }: SidebarProps) {
  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <DaymarkLogo />
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Menu</span>
        {NAV_ITEMS.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            className={`nav-item${activeView === view ? " active" : ""}`}
            onClick={() => onNavigate(view)}
            aria-current={activeView === view ? "page" : undefined}
          >
            <Icon size={16} className="nav-icon" aria-hidden="true" />
            {label}
            {counts[view] > 0 && <span className="nav-count">{counts[view]}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-new-btn" onClick={onNewTask}>
          <Plus size={16} aria-hidden="true" />
          New task
        </button>
      </div>
    </aside>
  );
}

export function DrawerSidebar({ activeView, onNavigate, onNewTask, onClose, counts }: SidebarProps & { onClose: () => void }) {
  return (
    <>
      <div className="drawer-logo" style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <div className="mobile-mark" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M3 9l4 4 8-8" stroke="#20231F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="sidebar-wordmark">DAYMARK</span>
      </div>
      <nav style={{ flex: 1, padding: "10px 10px 0", display: "flex", flexDirection: "column", gap: 2 }}>
        <span className="sidebar-section-label">Menu</span>
        {NAV_ITEMS.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            className={`nav-item${activeView === view ? " active" : ""}`}
            onClick={() => { onNavigate(view); onClose(); }}
            aria-current={activeView === view ? "page" : undefined}
          >
            <Icon size={16} className="nav-icon" aria-hidden="true" />
            {label}
            {counts[view] > 0 && <span className="nav-count">{counts[view]}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-new-btn" onClick={() => { onNewTask(); onClose(); }}>
          <Plus size={16} aria-hidden="true" />
          New task
        </button>
      </div>
    </>
  );
}
