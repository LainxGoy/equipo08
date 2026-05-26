import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Icon + Title */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-rose-500" strokeWidth={1.75} />
          </div>
          <div className="pt-0.5">
            <h3 className="text-sm font-semibold text-slate-900 leading-tight">{title}</h3>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-slate-500 leading-relaxed mb-6 pl-12">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5">
          <button onClick={onCancel} className="btn-secondary btn-sm">
            Cancelar
          </button>
          <button onClick={onConfirm} className="btn-danger btn-sm">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
