import React from "react";

const ToastContext = React.createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const remove = React.useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const show = React.useCallback(
    (toast) => {
      const id = nextId++;
      const item = {
        id,
        title: toast.title || "",
        message: toast.message || "",
        type: toast.type || "info",
        timeoutMs: toast.timeoutMs ?? 3500,
      };
      setToasts((ts) => [item, ...ts]);
      if (item.timeoutMs > 0) {
        setTimeout(() => remove(id), item.timeoutMs);
      }
      return id;
    },
    [remove]
  );

  const value = React.useMemo(() => ({ show, remove }), [show, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function iconFor(type) {
  switch (type) {
    case "success":
      return (
        <svg
          className="w-5 h-5 text-green-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "error":
      return (
        <svg
          className="w-5 h-5 text-red-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm1-8a1 1 0 00-1 1v5a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    default:
      return (
        <svg
          className="w-5 h-5 text-yellow-300"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9 2a1 1 0 012 0v2a1 1 0 11-2 0V2zM4.222 4.222a1 1 0 011.415 0l1.414 1.415a1 1 0 11-1.414 1.414L4.222 5.636a1 1 0 010-1.414zM2 9a1 1 0 100 2h2a1 1 0 100-2H2zm12 0a1 1 0 100 2h2a1 1 0 100-2h-2zm-1.05 5.364a1 1 0 011.414-1.415l1.415 1.415a1 1 0 01-1.415 1.414l-1.414-1.414zM9 16a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" />
        </svg>
      );
  }
}

function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            "rounded-xl border p-4 shadow-xl min-w-[280px] max-w-[360px] bg-black/80 backdrop-blur " +
            (t.type === "success"
              ? "border-green-400/30 text-green-200"
              : t.type === "error"
              ? "border-red-400/30 text-red-200"
              : "border-white/20 text-white/90")
          }
        >
          <div className="flex items-start gap-3">
            {iconFor(t.type)}
            <div className="flex-1">
              {t.title ? <div className="font-bold">{t.title}</div> : null}
              {t.message ? (
                <div className="text-sm opacity-90 leading-snug">
                  {t.message}
                </div>
              ) : null}
            </div>
            <button
              onClick={() => onClose(t.id)}
              className="text-white/70 hover:text-white"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
