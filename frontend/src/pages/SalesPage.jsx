import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { Download, Search, Filter } from 'lucide-react';

export default function SalesPage() {
  const [sucursales, setSucursales] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [downloading, setDownloading] = useState(null);
  
  // History Filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyBranch, setHistoryBranch] = useState('ALL');
  const [historyMetodo, setHistoryMetodo] = useState('ALL');
  const [showHistoryFilters, setShowHistoryFilters] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchSucursales();
    fetchSalesHistory();
  }, []);

  const fetchSucursales = async () => {
    try {
      const userSucursalId = sessionStorage.getItem('user_sucursal_id');
      const userSucursalName = sessionStorage.getItem('user_sucursal_name');
      const userRole = sessionStorage.getItem('user_role');
      
      if (userRole !== 'OWNER' && userSucursalId) {
        setSucursales([{ id: userSucursalId, name: userSucursalName || 'Mi Sucursal' }]);
        return;
      }

      const { data } = await api.get('/sucursales');
      setSucursales(data.filter(s => s.isActive));
    } catch (err) {
      toast.error('Error al cargar sucursales');
    }
  };

  const fetchSalesHistory = async () => {
    try {
      const { data } = await api.get('/ventas');
      setSalesHistory(data);
    } catch (err) {
      toast.error('Error al cargar historial de comprobantes');
    }
  };

  const filteredSalesHistory = useMemo(() => {
    return salesHistory.filter(sale => {
      if (historySearch) {
        const term = historySearch.toLowerCase();
        const matchSearch = (sale.clienteNombre || '').toLowerCase().includes(term) ||
          (sale.numeroComprobante || '').toLowerCase().includes(term) ||
          (sale.vendedorNombre || '').toLowerCase().includes(term);
        if (!matchSearch) return false;
      }
      if (historyBranch !== 'ALL' && sale.sucursal_id !== historyBranch) return false;
      if (historyMetodo !== 'ALL' && sale.metodoPago !== historyMetodo) return false;
      if (historyStartDate && new Date(sale.fecha) < new Date(historyStartDate)) return false;
      if (historyEndDate) {
        const end = new Date(historyEndDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(sale.fecha) > end) return false;
      }
      return true;
    });
  }, [salesHistory, historySearch, historyBranch, historyMetodo, historyStartDate, historyEndDate]);

  const downloadPdf = async (id, numeroComprobante) => {
    setDownloading(id);
    try {
      const response = await api.get(`/ventas/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${numeroComprobante || 'comprobante'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Error al descargar el comprobante');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="full-width-container animate-fadein space-y-6">
      <div className="page-header-bar">
        <div>
          <h1>Historial de Ventas</h1>
          <p>Consulta la lista completa de comprobantes emitidos por el negocio.</p>
        </div>
        <button
          onClick={() => setShowHistoryFilters(!showHistoryFilters)}
          className={`py-2 px-4 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm border ${
            showHistoryFilters ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Filter size={16} />
          <span>{showHistoryFilters ? 'Ocultar Filtros' : 'Filtrar'}</span>
        </button>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        {/* Filters */}
        {showHistoryFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 animate-fadeIn">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Buscar cliente, comprobante..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <input
              type="date"
              value={historyStartDate}
              onChange={e => setHistoryStartDate(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              placeholder="Desde"
            />
            <input
              type="date"
              value={historyEndDate}
              onChange={e => setHistoryEndDate(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              placeholder="Hasta"
            />
            <select
              value={historyBranch}
              onChange={e => setHistoryBranch(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            >
              <option value="ALL">Todas las sucursales</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select
              value={historyMetodo}
              onChange={e => setHistoryMetodo(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            >
              <option value="ALL">Todos los métodos</option>
              <option value="Efectivo">Efectivo</option>
              <option value="QR">QR</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
        )}
        
        <div className="table-premium-wrapper">
          <div className="overflow-x-auto">
            <table className="table-premium">
              <thead>
                <tr>
                  <th style={{ width: '16%' }}>Nro Comprobante</th>
                  <th style={{ width: '12%' }}>Fecha</th>
                  <th style={{ width: '18%' }}>Cliente</th>
                  <th style={{ width: '12%' }}>Vendedor</th>
                  <th style={{ width: '12%' }}>Sucursal</th>
                  <th style={{ width: '10%' }}>Método Pago</th>
                  <th className="text-right" style={{ width: '12%' }}>Total</th>
                  <th className="text-center" style={{ width: '8%' }}>PDF</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalesHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                      {salesHistory.length === 0 ? 'Aún no se han registrado ventas en el sistema.' : 'No se encontraron ventas con los filtros seleccionados.'}
                    </td>
                  </tr>
                ) : (
                  filteredSalesHistory.map(sale => (
                    <tr key={sale.id}>
                      <td className="text-sm text-slate-800 whitespace-nowrap">
                        {sale.numeroComprobante || `V-${sale.id.slice(0, 8)}`}
                      </td>
                      <td className="text-sm text-slate-800 whitespace-nowrap">
                        {new Date(sale.fecha).toLocaleDateString()} {new Date(sale.fecha).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                      </td>
                      <td className="text-sm text-slate-800">
                        {sale.clienteNombre} <span className="text-slate-400 text-xs">({sale.clienteDocumento || 'S/D'})</span>
                      </td>
                      <td className="text-sm text-slate-800 whitespace-nowrap">
                        {sale.vendedorNombre || 'Sistema'}
                      </td>
                      <td className="text-sm text-slate-800 whitespace-nowrap">
                        {sale.sucursal?.name || 'Sucursal'}
                      </td>
                      <td className="text-sm text-slate-800 whitespace-nowrap">
                        {sale.metodoPago || 'Efectivo'}
                      </td>
                      <td className="text-right text-sm text-slate-800 whitespace-nowrap">
                        Bs {Number(sale.total || 0).toFixed(2)}
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => downloadPdf(sale.id, sale.numeroComprobante)}
                          disabled={downloading === sale.id}
                          className="btn-premium-icon"
                          title="Descargar PDF"
                        >
                          <Download size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
