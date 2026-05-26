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

  const [stock, setStock] = useState([]);
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAj, resUsr, resSuc, resStock] = await Promise.all([
        api.get('/ajustes'),
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/sucursales').catch(() => ({ data: [] })),
        api.get('/stock').catch(() => ({ data: [] }))
      ]);
      setAjustes(resAj.data);
      setUsuarios(resUsr.data);
      setSucursales(resSuc.data);
      setStock(resStock.data);
    } catch (err) {
      console.error(err);
      toast.error('Error al descargar el registro analítico');
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (a) => {
    if (a.producto?.name) return a.producto.name;
    if (a.producto?.nombre) return a.producto.nombre;
    const s = stock.find(st => st.producto_id === a.producto_id);
    if (s && s.producto?.name) return s.producto.name;
    return a.producto_id || 'Producto Desconocido';
  };

  const getProductSku = (a) => {
    if (a.producto?.sku) return a.producto.sku;
    const s = stock.find(st => st.producto_id === a.producto_id);
    if (s && s.producto?.sku) return s.producto.sku;
    return null;
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
    <div className="full-width-container animate-fadein space-y-8">
      {/* Header */}
      <div className="page-header-bar">
        <div>
          <h1>Registro Analítico de Ajustes</h1>
          <p>Historial y auditoría de variaciones físicas de stock detectadas.</p>
        </div>
        <button
          className={`py-2 px-5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
            showFilters ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-white/20 hover:bg-white/30 text-white'
          }`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          {showFilters ? 'Ocultar Filtros' : 'Buscar / Filtrar'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Loss Card */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 border border-rose-600 rounded-2xl p-6 shadow-md text-white">
          <span className="text-xs font-bold text-rose-100 uppercase tracking-wide">
            Pérdida Total Estimada
          </span>
          <p className="text-2xl font-black text-white mt-1 font-mono drop-shadow-sm">
            Bs {totalFilteredLoss.toFixed(2)}
          </p>
        </div>

        {/* Count Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm border-l-4 border-l-blue-500">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Ajustes Encontrados
          </span>
          <p className="text-2xl font-bold text-blue-700 mt-1 font-mono">
            {filteredAjustes.length}
          </p>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row flex-wrap items-end md:items-center gap-4 animate-fadeIn">
          {/* Start Date */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          {/* End Date */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          {/* Operador */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Operador</label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="ALL">-- Todos --</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.name || u.nombre || u.email}</option>
              ))}
            </select>
          </div>
          {/* Motivo */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Motivo</label>
            <select
              value={selectedMotivo}
              onChange={e => setSelectedMotivo(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="ALL">-- Todos --</option>
              <option value="ERROR_REGISTRO">Error de Registro</option>
              <option value="DANO_MERMA">Artículo Dañado / Extraviado</option>
              <option value="ROBO_O_PERDIDA">Robo / No Habido</option>
              <option value="CADUCIDAD">Vencido</option>
            </select>
          </div>
          {/* Sucursal */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sucursal</label>
            <select
              value={selectedSucursal}
              onChange={e => setSelectedSucursal(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="ALL">-- Todas --</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.name || s.nombre}</option>
              ))}
            </select>
          </div>

          <div className="w-full flex justify-end mt-2 md:mt-0 md:w-auto">
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedUser('ALL');
                setSelectedMotivo('ALL');
                setSelectedSucursal('ALL');
              }}
              className="text-slate-400 hover:text-rose-600 text-xs font-bold uppercase tracking-wider transition-colors mb-2"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-premium-wrapper">
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Fecha</th>
                <th style={{ width: '30%' }}>Producto</th>
                <th style={{ width: '20%' }}>Sucursal</th>
                <th style={{ width: '15%' }}>Operador</th>
                <th className="text-center" style={{ width: '8%' }}>Delta</th>
                <th className="text-center" style={{ width: '12%' }}>Categoría</th>
                <th className="text-right" style={{ width: '10%' }}>Déficit Est.</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    Cargando registros…
                  </td>
                </tr>
              ) : filteredAjustes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 font-medium">
                    <p className="m-0">No se encontraron ajustes con los filtros aplicados.</p>
                  </td>
                </tr>
              ) : (
                filteredAjustes.map(a => {
                  const cantFisica = Number(a.cantidad_fisica) || 0;
                  const cantSistema = Number(a.cantidad_sistema) || 0;
                  // Si no hay cantidad_sistema registrada, intentamos buscarla en el stock actual (solo como fallback visual)
                  const fallbackStock = stock.find(s => s.producto_id === a.producto_id)?.cantidadTotal || 0;
                  const sistemaReal = a.cantidad_sistema !== null && a.cantidad_sistema !== undefined ? cantSistema : fallbackStock;
                  const deltaVal = cantFisica - sistemaReal;

                  return (
                    <tr key={a.id}>
                      <td className="text-sm text-slate-700 font-semibold whitespace-nowrap">
                        {new Date(a.fecha).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="font-bold text-slate-900 text-lg">
                        {getProductName(a)}
                        {getProductSku(a) && (
                          <span className="block font-mono text-xs text-slate-500 font-bold uppercase tracking-wider mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded">SKU: {getProductSku(a)}</span>
                        )}
                      </td>
                      <td className="text-base text-slate-800 font-bold">
                        {a.sucursal?.name || a.sucursal_nombre || a.sucursal_id || 'Sucursal Desconocida'}
                      </td>
                      <td className="text-base text-slate-800 font-semibold">
                        {a.usuario?.name || a.usuario_nombre || a.usuario_id || 'Operador Desconocido'}
                      </td>
                      <td className="text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg border shadow-sm font-extrabold text-base ${
                            deltaVal < 0
                              ? 'bg-rose-100 text-rose-700 border-rose-200'
                              : deltaVal > 0
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {deltaVal > 0 ? `+${deltaVal}` : deltaVal}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge neutral text-sm font-semibold px-3 py-1">
                          {formatMotivo(a.motivo)}
                        </span>
                      </td>
                      <td className="text-right font-black text-rose-600 font-mono text-lg">
                        Bs {Number(a.valor_perdido || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
