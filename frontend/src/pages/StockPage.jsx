import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { Archive, MapPin, ClipboardList, AlertTriangle, Save, X, TrendingDown, Search, Printer } from 'lucide-react';

export default function StockPage() {
  const [stock, setStock] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [ajustes, setAjustes] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [searchProduct, setSearchProduct] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Auditing Form State
  const [auditItem, setAuditItem] = useState(null);
  const [auditForm, setAuditForm] = useState({
    cantidad_fisica: '',
    motivo: 'ERROR_REGISTRO',
    observaciones: ''
  });
  const [saving, setSaving] = useState(false);

  const toast = useToast();

  const userRole = localStorage.getItem('user_role');
  const userPermissions = JSON.parse(localStorage.getItem('permissions') || '{}');
  const tenantName = localStorage.getItem('tenant_name') || 'Sucursal';

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
    }).catch(err => {
      console.error(err);
      toast.error('Error al cargar datos del inventario');
    });
  };

  const handleOpenAudit = (item) => {
    setAuditItem(item);
    setAuditForm({
      cantidad_fisica: item.cantidadTotal.toString(),
      motivo: 'ERROR_REGISTRO',
      observaciones: ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseAudit = () => {
    setAuditItem(null);
    setAuditForm({ cantidad_fisica: '', motivo: 'ERROR_REGISTRO', observaciones: '' });
  };

  const handleSubmitAudit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        sucursal_id: auditItem.sucursal_id,
        producto_id: auditItem.producto_id,
        cantidad_sistema: auditItem.cantidadTotal,
        cantidad_fisica: Number(auditForm.cantidad_fisica),
        motivo: auditForm.motivo,
        observaciones: auditForm.observaciones
      };

      await api.post('/ajustes', payload);
      toast.success('Acta de auditoría registrada y stock actualizado síncronamente.');
      handleCloseAudit();
      fetchStock(); // Reload updated stock map
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al procesar el ajuste de inventario');
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

  const getAuditDelta = () => {
    if (!auditItem || auditForm.cantidad_fisica === '') return null;
    return Number(auditForm.cantidad_fisica) - auditItem.cantidadTotal;
  };

  const getLostValue = () => {
    const delta = getAuditDelta();
    if (delta === null || delta >= 0 || !auditItem) return 0;
    const valuation = Number(auditItem.valorAdquisicion || 0);
    const avgCost = auditItem.cantidadTotal > 0 ? (valuation / auditItem.cantidadTotal) : 0;
    return Math.abs(delta) * avgCost;
  };

  const delta = getAuditDelta();

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

        {!auditItem && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`py-2 px-5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
                showFilters ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <Search size={18} /> {showFilters ? 'Ocultar Filtros' : 'Buscar / Filtrar'}
            </button>
            <button onClick={() => window.print()} className="py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm bg-white/20 hover:bg-white/30 text-white">
              <Printer size={16} /> Imprimir
            </button>
            {hasPermission('inventario_editar') && (
              <button 
                onClick={handleSimularBajoStock} 
                disabled={saving}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-2 shadow-sm shadow-rose-500/20 transition-all"
                title="Genera un ajuste para colocar 2 productos bajo su umbral mínimo"
              >
                Simular Baja
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && !auditItem && (
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
             <button onClick={() => { setSearchProduct(''); setSelectedBranch('ALL'); }} className="text-slate-400 hover:text-rose-600 text-xs font-bold uppercase tracking-wider mt-2 md:mt-0 transition-colors">
               Limpiar Filtros
             </button>
          </div>
        </div>
      )}

      {/* Alertas Automáticas Banner */}
      {!auditItem && alertasStock.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-rose-500 to-rose-600 border border-rose-600 rounded-2xl flex items-start gap-3 shadow-md">
          <div className="bg-white/20 p-2 rounded-full text-white backdrop-blur-sm">
             <AlertTriangle size={18} />
          </div>
          <div>
             <h4 className="font-black text-white text-sm m-0">Alertas de Inventario Bajo ({alertasStock.length})</h4>
             <p className="text-rose-50 text-xs mt-0.5 m-0 font-medium">Hay productos que se encuentran por debajo del stock mínimo configurado. Recomendamos generar reposiciones.</p>
          </div>
        </div>
      )}

      {/* Audit Inline Form */}
      {auditItem && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-fadeIn relative">
          <div className="flex justify-between items-center pb-4 border-b border-slate-105 mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
               <span>Registrar Acta de Auditoría (Ajuste Físico)</span>
            </h3>
            <button onClick={handleCloseAudit} className="btn-premium-icon btn-premium-icon-danger">
              <X size={15} />
            </button>
          </div>

          <div className="text-sm text-slate-600 mb-6 font-medium">
            Estás auditando el stock de <strong className="text-slate-900 font-bold">{auditItem.producto?.name}</strong> en la sucursal <strong className="text-slate-900 font-bold">{auditItem.sucursal?.name}</strong>.<br/>
            Unidades registradas actualmente en el sistema: <strong className="text-base font-extrabold text-slate-950">{auditItem.cantidadTotal}</strong>.
          </div>

          <form onSubmit={handleSubmitAudit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="text-slate-700">Conteo Físico Real (Unidades) *</label>
                <input 
                  type="number" 
                  value={auditForm.cantidad_fisica} 
                  onChange={e => setAuditForm({...auditForm, cantidad_fisica: e.target.value})} 
                  placeholder="Cantidad contada físicamente"
                  required 
                  min="0"
                  className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
                />
              </div>

              <div className="form-group">
                <label className="text-slate-700">Motivo de Incidencia *</label>
                <select 
                  value={auditForm.motivo} 
                  onChange={e => setAuditForm({...auditForm, motivo: e.target.value})}
                  required
                  className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 animate-none"
                >
                  <option value="ERROR_REGISTRO">Error de Registro Numérico</option>
                  <option value="DANO_MERMA">Artículo Dañado / Extraviado</option>
                  <option value="ROBO_O_PERDIDA">Robo / No Habido</option>
                  <option value="CADUCIDAD">Caducidad / Vencimiento</option>
                </select>
              </div>
            </div>

            {delta !== null && delta < 0 && (
              <div className="p-4 bg-rose-50/50 border border-rose-100 text-rose-800 rounded-xl text-xs leading-relaxed font-medium">
                <strong>⚠️ Impacto Financiero Directo:</strong> La pérdida declarada de {Math.abs(delta)} unidades resultará en un ajuste de valuación estimado de <strong className="font-bold">Bs. {getLostValue().toFixed(2)}</strong>.
              </div>
            )}
            
            {delta !== null && delta > 0 && userRole !== 'OWNER' && (
              <div className="p-4 bg-rose-50/50 border border-rose-100 text-rose-800 rounded-xl text-xs leading-relaxed font-medium">
                <strong>❌ Excedente Anómalo:</strong> No tienes permisos para declarar un excedente físico superior al del sistema ({auditItem.cantidadTotal}). Registra este reabastecimiento en la sección de Lotes (Sourcing).
              </div>
            )}
            
            {delta !== null && delta > 0 && userRole === 'OWNER' && (
              <div className="p-4 bg-amber-50/50 border border-amber-200 text-amber-800 rounded-xl text-xs leading-relaxed font-medium">
                <strong>⚠️ Excepción Habilitada:</strong> Declararás un excedente físico mayor al del sistema. Esta acción está restringida para el personal, pero habilitada para tu rol de Owner.
              </div>
            )}

            <div className="form-group">
              <label className="text-slate-755">Observaciones / Detalles</label>
              <input 
                type="text" 
                value={auditForm.observaciones} 
                onChange={e => setAuditForm({...auditForm, observaciones: e.target.value})} 
                placeholder="Indica observaciones específicas sobre la discrepancia..."
                className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={handleCloseAudit} 
                className="btn-premium"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={saving || auditForm.cantidad_fisica === '' || (delta > 0 && userRole !== 'OWNER')} 
                className="btn-premium btn-premium-indigo"
              >
                Procesar Ajuste de Stock
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Resumen Financiero Dash Cards */}
      {!auditItem && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center justify-between transition-transform hover:-translate-y-1">
            <div>
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] block">Valuación Activa (Costo Promedio)</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                Bs. {totalValuation.toFixed(2)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-650">
              <Archive size={20} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-rose-600 border border-rose-600 p-6 rounded-2xl shadow-md flex items-center justify-between transition-transform hover:-translate-y-1">
            <div>
              <span className="text-rose-100 font-bold uppercase tracking-wider text-[10px] block">Pérdida por Desajuste Acumulado</span>
              <span className="text-2xl font-black text-white mt-1 block drop-shadow-sm">
                Bs. {historicalLossValue.toFixed(2)}
              </span>
            </div>
            <a 
              href="/audit-reports"
              className="btn-premium btn-premium-sm border-rose-400 text-rose-700 hover:text-rose-800 hover:border-rose-500 bg-white shadow-sm"
            >
              <span>Ver Auditorías</span>
            </a>
          </div>
        </div>
      )}

      {/* Main Stock Table */}
      {!auditItem && (
        <div className="table-premium-wrapper">
          <div className="overflow-x-auto">
            <table className="table-premium">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>SKU</th>
                  <th style={{ width: '25%' }}>Producto</th>
                  <th style={{ width: '15%' }}>Ubicación</th>
                  <th className="text-right" style={{ width: '12%' }}>Stock Físico</th>
                  <th className="text-right" style={{ width: '15%' }}>Costo Unitario Promedio</th>
                  <th className="text-right" style={{ width: '10%' }}>Valuación Total</th>
                  {hasPermission('inventario_crear') && <th className="text-center" style={{ width: '8%' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={hasPermission('inventario_crear') ? 7 : 6} className="text-center py-12 text-slate-400 font-medium">
                      No hay productos registrados en el inventario.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map(s => {
                    const isAlerta = s.cantidadTotal < (s.producto?.stockMinimo || 10);
                    const valuation = Number(s.valorAdquisicion || 0);
                    const costoPromedio = s.cantidadTotal > 0 ? (valuation / s.cantidadTotal) : 0;
                    return (
                      <tr key={s.id} className={isAlerta ? 'bg-rose-50/10' : ''}>
                        <td>
                          <div className="flex items-center gap-2">
                            {isAlerta && <AlertTriangle size={14} className="text-rose-500" title="Bajo el stock mínimo" />}
                            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md uppercase tracking-wider">{s.producto?.sku}</span>
                          </div>
                        </td>
                        <td className="font-bold text-slate-900 text-lg">{s.producto?.name}</td>
                        <td>
                           <span className="text-base font-semibold text-slate-700">{s.sucursal?.name}</span>
                        </td>
                        <td className="text-right">
                           <strong className={`text-xl ${isAlerta ? 'text-rose-600 font-black' : 'text-slate-900 font-black'}`}>{s.cantidadTotal}</strong>
                           <div className="text-sm text-slate-500 font-bold mt-1">Min: {s.producto?.stockMinimo || 10}</div>
                        </td>
                        <td className="text-right text-slate-600 text-base font-mono font-bold">Bs {costoPromedio.toFixed(2)}</td>
                        <td className="text-right font-black text-indigo-700 font-mono text-xl">Bs {valuation.toFixed(2)}</td>
                        {hasPermission('inventario_crear') && (
                          <td className="text-center">
                            <button 
                               onClick={() => handleOpenAudit(s)}
                               className="btn-premium btn-premium-sm"
                            >
                              <ClipboardList size={13} />
                              <span>Auditar</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
