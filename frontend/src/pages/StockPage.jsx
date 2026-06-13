import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { Archive, MapPin, ClipboardList, AlertTriangle, Save, X, TrendingDown, Search, Printer, ArrowRightLeft, ChevronRight, ChevronDown } from 'lucide-react';

let lastAlertedCount = 0;

export default function StockPage() {
  const [stock, setStock] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [ajustes, setAjustes] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [searchProduct, setSearchProduct] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);
  
  // Transfer Form State
  const [transferItem, setTransferItem] = useState(null);
  const [transferForm, setTransferForm] = useState({
    to_sucursal_id: '',
    cantidad: ''
  });

  const [saving, setSaving] = useState(false);
  const [expandedStock, setExpandedStock] = useState({});

  const toggleExpandStock = (key) => {
    setExpandedStock(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toast = useToast();

  const userRole = sessionStorage.getItem('user_role');
  const userPermissions = JSON.parse(sessionStorage.getItem('permissions') || '{}');
  const tenantName = sessionStorage.getItem('tenant_name') || 'Sucursal';

  const hasPermission = (key) => {
    if (userRole === 'OWNER') return true;
    return !!userPermissions[key];
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = () => {
    Promise.all([
      api.get('/stock'),
      api.get('/sucursales'),
      api.get('/ajustes').catch(() => ({ data: [] })) // Fallback if user doesn't have permission
    ]).then(([resStock, resSuc, resAj]) => {
      setStock(resStock.data);
      setSucursales(resSuc.data);
      setAjustes(resAj.data);
      
      const alerts = resStock.data.filter(s => s.cantidadTotal < (s.producto?.stockMinimo || 10));
      if (alerts.length > 0 && alerts.length > lastAlertedCount) {
        toast.info(`Atención: Hay ${alerts.length} producto(s) por debajo del stock mínimo.`);
      }
      lastAlertedCount = alerts.length;
      setAlertsCount(alerts.length);
    }).catch(err => {
      console.error(err);
      toast.error('Error al cargar datos del inventario');
    });
  };

  const handleOpenTransfer = (item) => {
    setTransferItem(item);
    setTransferForm({
      to_sucursal_id: '',
      cantidad: ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseTransfer = () => {
    setTransferItem(null);
    setTransferForm({ to_sucursal_id: '', cantidad: '' });
  };

  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    if (!transferForm.to_sucursal_id) return toast.error('Selecciona una sucursal de destino');
    
    setSaving(true);
    try {
      const payload = {
        from_sucursal_id: transferItem.sucursal_id,
        to_sucursal_id: transferForm.to_sucursal_id,
        producto_id: transferItem.producto_id,
        cantidad: Number(transferForm.cantidad)
      };

      await api.post('/stock/transfer', payload);
      toast.success('Stock transferido con éxito a la nueva sucursal.');
      handleCloseTransfer();
      fetchStock(); 
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al transferir stock');
    } finally {
      setSaving(false);
    }
  };

  const filteredStock = stock.filter(s => {
    const matchBranch = selectedBranch === 'ALL' || s.sucursal_id === selectedBranch;
    const matchProduct = searchProduct === '' || 
      s.producto?.name?.toLowerCase().includes(searchProduct.toLowerCase()) || 
      s.producto?.sku?.toLowerCase().includes(searchProduct.toLowerCase());
    return matchBranch && matchProduct;
  });

  const filteredAjustes = selectedBranch === 'ALL'
    ? ajustes
    : ajustes.filter(a => a.sucursal_id === selectedBranch);

  const totalValuation = filteredStock.reduce((acc, curr) => acc + Number(curr.valorAdquisicion || 0), 0);

  const historicalLossValue = filteredAjustes.reduce((acc, a) => {
    let exactLoss = Number(a.valor_perdido || 0);
    // Backwards Compatibility: Si el registro es antiguo y no se congeló el valor_perdido en BD, estimarlo dinámicamente.
    if (exactLoss === 0 && a.cantidad_fisica < a.cantidad_sistema) {
        const unitsLost = a.cantidad_sistema - a.cantidad_fisica;
        const refStock = stock.find(s => s.producto_id === a.producto_id);
        const avgCost = refStock && refStock.cantidadTotal > 0 ? (Number(refStock.valorAdquisicion) / refStock.cantidadTotal) : 0;
        exactLoss = unitsLost * avgCost;
    }
    return acc + exactLoss;
  }, 0);

  const alertasStock = filteredStock.filter(s => s.cantidadTotal < (s.producto?.stockMinimo || 10));

  const handleSimularBajoStock = async () => {
    if (filteredStock.length === 0) return toast.error("No hay productos para simular");
    const numToModify = Math.min(2, filteredStock.length);
    const shuffled = [...filteredStock].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numToModify);
    
    setSaving(true);
    try {
      for (const s of selected) {
        const payload = {
          sucursal_id: s.sucursal_id,
          producto_id: s.producto_id,
          cantidad_fisica: Math.max(0, (s.producto?.stockMinimo || 10) - 1),
          motivo: 'DANO_MERMA',
          observaciones: 'Simulación de inventario bajo (E9)',
          valor_adquisicion_unitario: s.cantidadTotal > 0 ? (s.valorAdquisicion / s.cantidadTotal) : 0
        };
        await api.post('/ajustes', payload);
      }
      toast.success(`Escenario simulado en ${numToModify} productos`);
      fetchStock();
    } catch (err) {
      toast.error('Error al simular bajo stock');
    } finally {
      setSaving(false);
    }
  };  return (
    <div className="full-width-container animate-fadein space-y-8">
      
      {/* Header Panel */}
      <div className="page-header-bar">
        <div>
          <h1>Inventario y Valuación Física</h1>
          <p>Control y valuación de stock por centros de costos segregados físicamente.</p>
        </div>

        <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`py-2 px-5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
                showFilters ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <Search size={18} /> {showFilters ? 'Ocultar Filtros' : 'Buscar / Filtrar'}
            </button>
          </div>
      </div>

      {/* Filter Panel */}
      {showFilters && !transferItem && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-end md:items-center gap-4 animate-fadeIn">
          <div className="flex-1 w-full">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Buscar Producto</label>
             <div className="relative">
               <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                 <Search size={16} />
               </span>
               <input 
                 type="text" 
                 placeholder="Buscar por SKU o nombre de producto..." 
                 value={searchProduct} 
                 onChange={(e) => setSearchProduct(e.target.value)} 
                 className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
               />
             </div>
          </div>
          <div className="flex-1 w-full">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filtrar por Sucursal</label>
             <select 
               value={selectedBranch} 
               onChange={e => setSelectedBranch(e.target.value)}
               className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
             >
               <option value="ALL">-- Todas las Sucursales --</option>
               {sucursales.map(s => <option key={s.id} value={s.id}>{tenantName} ({s.name})</option>)}
             </select>
          </div>
          <div className="w-full md:w-auto flex justify-end">
              <span role="button" onClick={() => { setSearchProduct(''); setSelectedBranch('ALL'); }} className="text-slate-400 hover:text-rose-600 text-xs font-bold uppercase tracking-wider mt-2 md:mt-0 transition-colors cursor-pointer">
                Limpiar Filtros
              </span>
          </div>
        </div>
      )}


      {/* Transfer Inline Form */}
      {transferItem && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-fadeIn relative">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
               <ArrowRightLeft size={18} className="text-indigo-600" />
               <span>Traslado de Inventario a otra Sucursal</span>
            </h3>
            <button onClick={handleCloseTransfer} className="btn-premium-icon btn-premium-icon-danger">
              <X size={15} />
            </button>
          </div>

          <div className="text-sm text-slate-600 mb-6 font-medium">
            Moverás {transferItem.producto?.name} desde la sucursal origen {transferItem.sucursal?.name}.<br/>
            Unidades disponibles para transferir: {transferItem.cantidadTotal}.
          </div>

          <form onSubmit={handleSubmitTransfer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="text-slate-700">Sucursal de Destino *</label>
                <select 
                  value={transferForm.to_sucursal_id} 
                  onChange={e => setTransferForm({...transferForm, to_sucursal_id: e.target.value})}
                  required
                  className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
                >
                  <option value="">Selecciona la sucursal...</option>
                  {sucursales.filter(s => s.id !== transferItem.sucursal_id).map(s => (
                    <option key={s.id} value={s.id}>{tenantName} ({s.name})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="text-slate-700">Cantidad a Transferir (Unidades) *</label>
                <input 
                  type="number" 
                  value={transferForm.cantidad} 
                  onChange={e => setTransferForm({...transferForm, cantidad: e.target.value})} 
                  placeholder="Ej. 50"
                  required 
                  min="1"
                  max={transferItem.cantidadTotal}
                  className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={handleCloseTransfer} 
                className="btn-premium"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={saving || !transferForm.to_sucursal_id || !transferForm.cantidad} 
                className="btn-premium btn-premium-indigo"
              >
                Confirmar Traslado
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Resumen Financiero Dash Cards */}
      {!transferItem && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center justify-between transition-transform hover:-translate-y-1">
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 block">Valuación Activa (Costo Promedio)</span>
              <span className="text-2xl font-semibold text-slate-800 mt-1 block">
                Bs. {totalValuation.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center justify-between transition-transform hover:-translate-y-1">
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 block">Pérdida por Desajuste Acumulado</span>
              <span className="text-2xl font-semibold text-slate-800 mt-1 block">
                Bs. {historicalLossValue.toFixed(2)}
              </span>
            </div>
            <a 
              href="/audit-reports"
              className="py-2 px-4 rounded-lg font-bold text-sm border border-slate-200 text-slate-700 bg-white shadow-sm transition-colors hover:bg-slate-50"
            >
              <span>Ver Auditorías</span>
            </a>
          </div>
        </div>
      )}

      {/* Main Stock Table */}
      {!transferItem && (
        <div className="table-premium-wrapper">
          <div className="overflow-x-auto">
            <table className="table-premium">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Producto</th>
                  <th style={{ width: '15%' }}>Ubicación</th>
                  <th className="text-right" style={{ width: '12%' }}>Stock Físico</th>
                  <th className="text-right" style={{ width: '15%' }}>Costo Promedio</th>
                  <th className="text-right" style={{ width: '10%' }}>Valuación Total</th>
                  <th className="text-center" style={{ width: '8%' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  if (filteredStock.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                          No hay productos registrados en el inventario.
                        </td>
                      </tr>
                    );
                  }

                  const groups = {};
                  filteredStock.forEach(s => {
                    const key = `${s.producto?.name}_${s.sucursal_id}`;
                    if (!groups[key]) {
                      groups[key] = [];
                    }
                    groups[key].push(s);
                  });

                  return Object.keys(groups).map(key => {
                    const variants = groups[key];
                    const isExpanded = !!expandedStock[key];
                    
                    if (variants.length === 1) {
                      // Single stock item row (no variants)
                      const s = variants[0];
                      const isAlerta = s.cantidadTotal < (s.producto?.stockMinimo || 10);
                      const valuation = Number(s.valorAdquisicion || 0);
                      const costoPromedio = s.cantidadTotal > 0 ? (valuation / s.cantidadTotal) : 0;
                      return (
                        <tr key={s.id} className={isAlerta ? 'bg-rose-50/10' : ''}>
                          <td>
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="text-sm text-slate-800 font-semibold">{s.producto?.name}</span>
                              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">SKU: {s.producto?.sku}</span>
                              {s.producto?.attributes && Object.keys(s.producto.attributes).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {Object.entries(s.producto.attributes).map(([k, v]) => v ? (
                                    <span key={k} className="text-[9px] text-slate-400 font-bold border border-slate-200 px-1 py-0.5 rounded uppercase tracking-wider bg-slate-50">
                                      {k}: {v}
                                    </span>
                                  ) : null)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-sm text-slate-850">{s.sucursal?.name}</td>
                          <td className={`text-right text-sm font-semibold ${isAlerta ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>{s.cantidadTotal}</td>
                          <td className="text-right text-sm text-slate-800 font-mono">Bs {costoPromedio.toFixed(2)}</td>
                          <td className="text-right text-sm text-slate-800 font-mono">Bs {valuation.toFixed(2)}</td>
                          <td className="text-center">
                            <button onClick={() => handleOpenTransfer(s)} className="btn-premium btn-premium-sm" title="Trasladar a otra sucursal">
                              <ArrowRightLeft size={14} />
                              <span>Trasladar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    } else {
                      // Multi-variant stock parent row
                      const main = variants[0];
                      const totalQty = variants.reduce((sum, v) => sum + (v.cantidadTotal || 0), 0);
                      const totalValuation = variants.reduce((sum, v) => sum + (Number(v.valorAdquisicion) || 0), 0);
                      const avgCostoPromedio = totalQty > 0 ? (totalValuation / totalQty) : 0;
                      const hasAlert = variants.some(v => v.cantidadTotal < (v.producto?.stockMinimo || 10));

                      return (
                        <React.Fragment key={key}>
                          <tr className={`bg-slate-50/40 dark:bg-slate-900/20 font-bold border-l-4 border-indigo-500 ${hasAlert ? 'bg-rose-50/5' : ''}`}>
                            <td>
                              <div 
                                role="button" 
                                onClick={() => toggleExpandStock(key)} 
                                className="flex items-center gap-2 cursor-pointer select-none"
                              >
                                <span className="text-slate-400 hover:text-indigo-600 transition-colors">
                                  {isExpanded ? <ChevronDown size={16} strokeWidth={3} /> : <ChevronRight size={16} strokeWidth={3} />}
                                </span>
                                <div className="flex flex-col items-start gap-0.5">
                                  <span className="text-sm font-bold text-slate-800">{main.producto?.name}</span>
                                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">{variants.length} variantes</span>
                                </div>
                              </div>
                            </td>
                            <td className="text-sm text-slate-800">{main.sucursal?.name}</td>
                            <td className="text-right text-sm text-slate-850 font-bold">{totalQty}</td>
                            <td className="text-right text-sm text-slate-850 font-mono">Bs {avgCostoPromedio.toFixed(2)}</td>
                            <td className="text-right text-sm text-slate-850 font-mono">Bs {totalValuation.toFixed(2)}</td>
                            <td className="text-center">-</td>
                          </tr>

                          {isExpanded && variants.map(s => {
                            const isAlerta = s.cantidadTotal < (s.producto?.stockMinimo || 10);
                            const valuation = Number(s.valorAdquisicion || 0);
                            const costoPromedio = s.cantidadTotal > 0 ? (valuation / s.cantidadTotal) : 0;
                            return (
                              <tr key={s.id} className={`bg-slate-100/20 dark:bg-slate-900/10 border-l border-slate-200 ${isAlerta ? 'bg-rose-50/10' : ''}`}>
                                <td className="pl-8">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-300 dark:text-slate-750 font-mono">└─</span>
                                    <div className="flex flex-col items-start">
                                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">SKU: {s.producto?.sku}</span>
                                      {s.producto?.attributes && Object.keys(s.producto.attributes).length > 0 ? (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {Object.entries(s.producto.attributes).map(([k, v]) => v ? (
                                            <span key={k} className="text-[9px] text-slate-500 font-bold border border-slate-200/80 px-1.5 py-0.5 rounded uppercase tracking-wider bg-white dark:bg-slate-850 shadow-sm">
                                              {k}: {v}
                                            </span>
                                          ) : null)}
                                        </div>
                                      ) : <span className="text-xs text-slate-400 italic">Variante única</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="text-xs text-slate-500">{s.sucursal?.name}</td>
                                <td className={`text-right text-xs font-semibold ${isAlerta ? 'text-rose-600 font-bold font-mono' : 'text-slate-600 font-mono'}`}>{s.cantidadTotal}</td>
                                <td className="text-right text-xs text-slate-600 font-mono">Bs {costoPromedio.toFixed(2)}</td>
                                <td className="text-right text-xs text-slate-800 font-mono font-bold">Bs {valuation.toFixed(2)}</td>
                                <td className="text-center">
                                  <button onClick={() => handleOpenTransfer(s)} className="btn-premium btn-premium-sm" title="Trasladar a otra sucursal">
                                    <ArrowRightLeft size={14} />
                                    <span>Trasladar</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    }
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
