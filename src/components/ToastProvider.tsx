"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  removing?: boolean;
}

interface ToastCtx {
  toast: (msg: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function useToast(): ToastCtx {
  return useContext(ToastContext);
}

let _nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    // Start exit animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
    // Remove from DOM after animation
    const t = setTimeout(
      () => setToasts(prev => prev.filter(t => t.id !== id)),
      220
    );
    timers.current.set(id, t);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++_nextId;
      setToasts(prev => [...prev, { id, message, type }]);
      const t = setTimeout(() => remove(id), 3500);
      timers.current.set(id, t);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="toast-container"
        role="status"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Notifications"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast${t.type === "error" ? " error" : t.type === "success" ? " success" : ""}${t.removing ? " removing" : ""}`}
          >
            {t.type === "success" && <CheckCircle size={15} aria-hidden="true" />}
            {t.type === "error"   && <XCircle    size={15} aria-hidden="true" />}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              aria-label="Dismiss"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "inherit", padding: 0, display: "flex", alignItems: "center",
                opacity: 0.7
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
