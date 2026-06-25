import React, { useState, useEffect } from 'react';
import { X, Loader2, ClipboardList, Info } from 'lucide-react';
import api from '../api';

export default function KardexModal({ isOpen, onClose, productId, productName }) {
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState([]);

  useEffect(() => {
    if (isOpen && productId) {
      loadKardex();
    }
  }, [isOpen, productId]);

  const loadKardex = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stock/kardex/${productId}`);
      setMovements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getBadgeClass = (tipo) => {
    switch (tipo) {
      case 'INGRESO':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30';
      case 'EGRESO':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-800/30';
      case 'TRANSFERENCIA':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-800/30';
      case 'AJUSTE':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-800/30';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-800/30';
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content !max-w-4xl" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-[var(--blue)]" size={20} />
            <div>
              <h3 className="text-sm font-semibold text-[var(--txt-primary)] leading-tight">Kardex de Inventario</h3>
              <p className="text-xs text-[var(--txt-secondary)] font-medium mt-0.5">{productName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }} className="pr-1">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-[var(--blue)] mb-2" size={24} />
              <p className="text-xs text-[var(--txt-secondary)] font-medium">Cargando movimientos...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-medium">
              <div className="flex flex-col items-center justify-center gap-2">
                <Info size={24} className="text-slate-300" />
                <span className="text-sm">No se encontraron movimientos registrados para este artículo.</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-premium !text-xs">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Sucursal</th>
                    <th>Variante / SKU</th>
                    <th className="text-center">Operación</th>
                    <th className="text-right">Cantidad</th>
                    <th className="text-right">Saldo Ant.</th>
                    <th className="text-right">Saldo Result.</th>
                    <th>Usuario</th>
                    <th>Motivo / Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td className="whitespace-nowrap font-medium text-slate-600 dark:text-slate-400">
                        {formatDate(m.fecha)}
                      </td>
                      <td className="font-semibold text-slate-700 dark:text-slate-300">
                        {m.sucursalNombre}
                      </td>
                      <td>
                        <div className="flex flex-col">
                          {m.sku && <span className="font-mono text-[10px] text-slate-400">{m.sku}</span>}
                          {m.variacionDetalle && Object.keys(m.variacionDetalle).length > 0 && (
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                              {Object.entries(m.variacionDetalle).map(([k, v]) => `${k}:${v}`).join(', ')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-md border ${getBadgeClass(m.tipo)}`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td className={`text-right font-bold ${m.cantidadDelta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {m.cantidadDelta > 0 ? `+${m.cantidadDelta}` : m.cantidadDelta}
                      </td>
                      <td className="text-right text-slate-500 font-semibold">{m.stockAnterior}</td>
                      <td className="text-right text-slate-700 dark:text-slate-300 font-black">{m.stockResultante}</td>
                      <td className="text-slate-600 dark:text-slate-400">{m.usuarioNombre}</td>
                      <td className="max-w-[150px] truncate text-slate-500" title={m.motivo}>
                        {m.motivo || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
