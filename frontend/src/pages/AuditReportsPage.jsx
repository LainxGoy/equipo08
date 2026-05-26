import React, { useState, useEffect } from 'react';
import { ClipboardList, Filter, MapPin } from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';

export default function AuditReportsPage() {
  const [ajustes, setAjustes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedMotivo, setSelectedMotivo] = useState('ALL');
  const [selectedSucursal, setSelectedSucursal] = useState('ALL');

  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAj, resUsr, resSuc] = await Promise.all([
        api.get('/ajustes'),
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/sucursales').catch(() => ({ data: [] }))
      ]);
      setAjustes(resAj.data);
      setUsuarios(resUsr.data);
      setSucursales(resSuc.data);
    } catch (err) {
      console.error(err);
      toast.error('Error al descargar el registro analítico');
    } finally {
      setLoading(false);
    }
  };

  const formatMotivo = (motivo) => {
    switch(motivo) {
      case 'ERROR_REGISTRO': return 'Error de Registro';
      case 'DANO_MERMA': return 'Artículo Dañado / Extraviado';
      case 'ROBO_O_PERDIDA': return 'Robo / No Habido';
      case 'CADUCIDAD': return 'Vencido';
      default: return motivo;
    }
  };

  const filteredAjustes = ajustes.filter(a => {
    let validDate = true;
    if (startDate && endDate) {
       const rowDate = new Date(a.fecha);
       const start = new Date(startDate);
       const end = new Date(endDate);
       end.setHours(23, 59, 59, 999);
       validDate = rowDate >= start && rowDate <= end;
    }
    let validUser = true;
    if (selectedUser !== 'ALL') {
       validUser = a.usuario_id === selectedUser;
    }
    let validMotivo = true;
    if (selectedMotivo !== 'ALL') {
       validMotivo = a.motivo === selectedMotivo;
    }
    let validSucursal = true;
    if (selectedSucursal !== 'ALL') {
       validSucursal = a.sucursal_id === selectedSucursal;
    }
    return validDate && validUser && validMotivo && validSucursal;
  });

  const totalFilteredLoss = filteredAjustes.reduce((acc, a) => acc + Number(a.valor_perdido || 0), 0);

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-5 animate-fadein">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center">
          <ClipboardList size={18} strokeWidth={1.75} className="text-slate-400 mr-2" />
          Registro Analítico de Ajustes
        </h1>
        <button
          className="btn-secondary btn-sm"
          onClick={() => setShowFilters(prev => !prev)}
        >
          <Filter size={14} className="mr-1.5" />
          Filtros
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Loss Card */}
        <div className="card border-l-4 border-rose-400">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Pérdida Total Estimada
          </span>
          <p className="text-2xl font-bold text-rose-600 mt-1 font-mono">
            ${totalFilteredLoss.toFixed(2)}
          </p>
        </div>

        {/* Count Card */}
        <div className="card border-l-4 border-blue-400">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Ajustes Encontrados
          </span>
          <p className="text-2xl font-bold text-blue-700 mt-1 font-mono">
            {filteredAjustes.length}
          </p>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card animate-fadein">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Start Date */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Fecha Inicio
              </span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-9 border border-slate-200 rounded-lg px-3 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500 w-full"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Fecha Fin
              </span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-9 border border-slate-200 rounded-lg px-3 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500 w-full"
              />
            </div>

            {/* User Filter */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Operador
              </span>
              <select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                className="h-9 border border-slate-200 rounded-lg px-3 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500 w-full"
              >
                <option value="ALL">Todos</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre || u.email}</option>
                ))}
              </select>
            </div>

            {/* Motivo Filter */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Motivo
              </span>
              <select
                value={selectedMotivo}
                onChange={e => setSelectedMotivo(e.target.value)}
                className="h-9 border border-slate-200 rounded-lg px-3 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500 w-full"
              >
                <option value="ALL">Todos</option>
                <option value="ERROR_REGISTRO">Error de Registro</option>
                <option value="DANO_MERMA">Artículo Dañado / Extraviado</option>
                <option value="ROBO_O_PERDIDA">Robo / No Habido</option>
                <option value="CADUCIDAD">Vencido</option>
              </select>
            </div>

            {/* Sucursal Filter */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Sucursal
              </span>
              <select
                value={selectedSucursal}
                onChange={e => setSelectedSucursal(e.target.value)}
                className="h-9 border border-slate-200 rounded-lg px-3 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500 w-full"
              >
                <option value="ALL">Todas</option>
                {sucursales.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            {/* Clear Button */}
            <button
              className="btn-secondary btn-sm self-end"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedUser('ALL');
                setSelectedMotivo('ALL');
                setSelectedSucursal('ALL');
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="data-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Sucursal</th>
              <th>Operador</th>
              <th className="text-center">Delta</th>
              <th>Categoría</th>
              <th className="text-right">Déficit Est.</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="loading-state">
                  Cargando registros…
                </td>
              </tr>
            ) : filteredAjustes.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  <div className="empty-state-icon">
                    <ClipboardList size={20} className="text-slate-400" />
                  </div>
                  <p>No se encontraron ajustes con los filtros aplicados.</p>
                </td>
              </tr>
            ) : (
              filteredAjustes.map(a => {
                const deltaVal = Number(a.delta ?? 0);
                return (
                  <tr key={a.id}>
                    <td className="text-sm text-slate-500 whitespace-nowrap">
                      {new Date(a.fecha).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="font-medium text-slate-800">
                      {a.producto_nombre || a.producto_id}
                    </td>
                    <td className="text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} />
                        {a.sucursal_nombre || a.sucursal_id}
                      </span>
                    </td>
                    <td className="text-sm text-slate-700">
                      {a.usuario_nombre || a.usuario_id}
                    </td>
                    <td className="text-center">
                      <span
                        className={
                          deltaVal < 0
                            ? 'badge error text-xs'
                            : deltaVal > 0
                            ? 'badge success text-xs'
                            : 'badge neutral text-xs'
                        }
                      >
                        {deltaVal > 0 ? `+${deltaVal}` : deltaVal}
                      </span>
                    </td>
                    <td>
                      <span className="badge neutral text-xs">
                        {formatMotivo(a.motivo)}
                      </span>
                    </td>
                    <td className="text-right font-semibold text-rose-600 font-mono text-sm">
                      ${Number(a.valor_perdido || 0).toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
