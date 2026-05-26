import React, { createContext, useContext, useState, useCallback } from 'react';
import { XCircle, CheckCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    error:   (msg) => addToast(msg, 'error'),
    success: (msg) => addToast(msg, 'success'),
    info:    (msg) => addToast(msg, 'info'),
  };

  const iconMap = {
    error:   <XCircle    size={16} className="text-rose-500"    strokeWidth={1.75} />,
    success: <CheckCircle size={16} className="text-emerald-500" strokeWidth={1.75} />,
    info:    <Info        size={16} className="text-blue-500"    strokeWidth={1.75} />,
  };

  const labelMap = {
    error:   'Error',
    success: 'Completado',
    info:    'Información',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card toast-${t.type}`}>
            <div className="toast-icon">{iconMap[t.type]}</div>
            <div className="toast-content">
              <strong>{labelMap[t.type]}</strong>
              <p>{t.message}</p>
            </div>
            <button className="toast-close" onClick={() => removeToast(t.id)}>
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
