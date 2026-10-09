export function TaskSkeleton() {
  return (
    <div className="task-list" aria-busy="true" aria-label="Loading tasks">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton-row">
          <div className="skeleton" style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ height: 14, width: `${60 + i * 7}%` }} />
            <div className="skeleton" style={{ height: 11, width: `${30 + i * 5}%` }} />
          </div>
          <div className="skeleton" style={{ width: 48, height: 20, borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );
}
