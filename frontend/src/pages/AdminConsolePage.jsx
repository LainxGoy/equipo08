import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Building2, CheckCircle2, XCircle, 
  Clock, ShieldAlert, BarChart3, Activity 
} from 'lucide-react';
import { useToast } from '../components/ToastContext';

export default function AdminConsolePage() {
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, approved: 0 });
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/tenants')
      ]);
      setMetrics(mRes.data);
      setTenants(tRes.data);
    } catch (err) {
      toast.error('Error cargando consola global');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/tenants/${id}/status`, { status });
      toast.success(`Tienda marcada como ${status}`);
      loadData();
    } catch (err) {
      toast.error('Error actualizando estado');
    }
  };

  if (loading) return <div className="p-8 text-slate-400">Cargando consola...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <ShieldAlert className="text-rose-500" size={32} />
          Supervisión Global del Mall
        </h1>
        <p className="text-slate-500 font-medium mt-2">Control maestro de todas las tiendas registradas en el sistema.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tiendas', value: metrics.total, icon: Building2, color: 'text-slate-600', bg: 'bg-slate-100' },
          { label: 'Pendientes', value: metrics.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Aprobadas', value: metrics.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Sistema', value: 'Operativo', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((m, i) => (
          <div key={i} className={`${m.bg} p-5 rounded-2xl border border-slate-200/50 flex items-center gap-4`}>
            <div className={`p-3 rounded-xl bg-white shadow-sm ${m.color}`}>
              <m.icon size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{m.label}</div>
              <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Building2 size={18} className="text-slate-400" /> Directorio de Tiendas
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Tienda / Dominio</th>
                <th className="px-6 py-4">Contacto (Admin)</th>
                <th className="px-6 py-4">Fecha Registro</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">{t.domain}.bolclick.app</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700">{t.email}</div>
                    {t.phone && <div className="text-xs text-slate-500 mt-1">{t.phone}</div>}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      t.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      t.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {t.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => updateStatus(t.id, 'APPROVED')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Aprobar">
                          <CheckCircle2 size={18} />
                        </button>
                        <button onClick={() => updateStatus(t.id, 'REJECTED')} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Rechazar">
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                    {t.status === 'APPROVED' && (
                      <button onClick={() => updateStatus(t.id, 'SUSPENDED')} className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">
                        Suspender
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">No hay tiendas registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
