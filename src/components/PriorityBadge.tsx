import { Priority } from "@/lib/types";

const config: Record<Priority, { label: string; className: string }> = {
  high:   { label: "High",   className: "priority-badge high" },
  medium: { label: "Medium", className: "priority-badge medium" },
  low:    { label: "Low",    className: "priority-badge low" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, className } = config[priority] ?? config.medium;
  return <span className={className} aria-label={`Priority: ${label}`}>{label}</span>;
}
