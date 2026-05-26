import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { Archive, MapPin, ClipboardList, AlertTriangle, Save, X, TrendingDown, Search } from 'lucide-react';

export default function StockPage() {
  const [stock, setStock] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [ajustes, setAjustes] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [searchProduct, setSearchProduct] = useState('');
  
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
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Archive size={22} className="text-indigo-600" /> 
            <span>Inventario y Valuación Física</span>
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Control y valuación de stock por centros de costos segregados físicamente.</p>
        </div>

        {!auditItem && (
          <div className="flex flex-wrap items-center gap-3">
            {hasPermission('inventario_editar') && (
              <button 
                onClick={handleSimularBajoStock} 
                disabled={saving}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 text-xs font-semibold py-2 px-4 rounded-xl transition-all"
                title="Genera un ajuste para colocar 2 productos bajo su umbral mínimo"
              >
                Simular Escenario Crítico
              </button>
            )}
            
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={14} />
              </span>
              <input 
                type="text" 
                placeholder="Buscar por SKU o nombre..." 
                value={searchProduct} 
                onChange={(e) => setSearchProduct(e.target.value)} 
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-48 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <MapPin size={14} className="text-indigo-600" />
              <select 
                value={selectedBranch} 
                onChange={e => setSelectedBranch(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none pr-4"
              >
                <option value="ALL">Todas las Sucursales</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{tenantName} ({s.name})</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Alertas Automáticas Banner */}
      {!auditItem && alertasStock.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
          <div className="bg-rose-100 p-2 rounded-full text-rose-600">
             <AlertTriangle size={18} />
          </div>
          <div>
             <h4 className="font-bold text-rose-800 text-sm">Alertas de Inventario Bajo ({alertasStock.length})</h4>
             <p className="text-rose-700 text-xs mt-0.5">Hay productos que se encuentran por debajo del stock mínimo configurado. Recomendamos generar reposiciones.</p>
          </div>
        </div>
      )}

      {/* Audit Inline Form */}
      {auditItem && (
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-amber-200/50 mb-4">
            <h3 className="text-base font-bold text-amber-800 flex items-center gap-2">
               <AlertTriangle size={18} /> 
               <span>Registrar Acta de Auditoría (Ajuste Físico)</span>
            </h3>
            <button onClick={handleCloseAudit} className="text-amber-800 hover:bg-amber-100 p-1.5 rounded-lg">
              <X size={16} />
            </button>
          </div>

          <div className="text-sm text-amber-900 mb-6">
            Estás auditando el stock de <strong className="text-slate-900">{auditItem.producto?.name}</strong> en la sucursal <strong className="text-slate-900">{auditItem.sucursal?.name}</strong>.<br/>
            Unidades registradas actualmente en el sistema: <strong className="text-base font-bold text-slate-900">{auditItem.cantidadTotal}</strong>.
          </div>

          <form onSubmit={handleSubmitAudit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="text-amber-900 font-bold">Conteo Físico Real (Unidades) *</label>
                <input 
                  type="number" 
                  value={auditForm.cantidad_fisica} 
                  onChange={e => setAuditForm({...auditForm, cantidad_fisica: e.target.value})} 
                  placeholder="Cantidad contada físicamente"
                  required 
                  min="0"
                  className="border-amber-200 focus:border-amber-500 focus:ring-amber-500/10"
                />
              </div>

              <div className="form-group">
                <label className="text-amber-900 font-bold">Motivo de Incidencia *</label>
                <select 
                  value={auditForm.motivo} 
                  onChange={e => setAuditForm({...auditForm, motivo: e.target.value})}
                  required
                  className="border-amber-200 focus:border-amber-500 focus:ring-amber-500/10"
                >
                  <option value="ERROR_REGISTRO">Error de Registro Numérico</option>
                  <option value="DANO_MERMA">Artículo Dañado / Extraviado</option>
                  <option value="ROBO_O_PERDIDA">Robo / No Habido</option>
                  <option value="CADUCIDAD">Caducidad / Vencimiento</option>
                </select>
              </div>
            </div>

            {delta !== null && delta < 0 && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs leading-relaxed">
                <strong>⚠️ Impacto Financiero Directo:</strong> La pérdida declarada de {Math.abs(delta)} unidades resultará en un ajuste de valuación estimado de <strong className="font-bold">Bs. {getLostValue().toFixed(2)}</strong>.
              </div>
            )}
            
            {delta !== null && delta > 0 && userRole !== 'OWNER' && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs leading-relaxed">
                <strong>❌ Excedente Anómalo:</strong> No tienes permisos para declarar un excedente físico superior al del sistema ({auditItem.cantidadTotal}). Registra este reabastecimiento en la sección de Lotes (Sourcing).
              </div>
            )}
            
            {delta !== null && delta > 0 && userRole === 'OWNER' && (
              <div className="p-4 bg-amber-100/80 border border-amber-200 text-amber-800 rounded-xl text-xs leading-relaxed">
                <strong>⚠️ Excepción Habilitada:</strong> Declararás un excedente físico mayor al del sistema. Esta acción está restringida para el personal, pero habilitada para tu rol de Owner.
              </div>
            )}

            <div className="form-group">
              <label className="text-amber-900 font-bold">Observaciones / Detalles</label>
              <input 
                type="text" 
                value={auditForm.observaciones} 
                onChange={e => setAuditForm({...auditForm, observaciones: e.target.value})} 
                placeholder="Indica observaciones específicas sobre la discrepancia..."
                className="border-amber-200 focus:border-amber-500 focus:ring-amber-500/10"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-amber-200/50">
              <button 
                type="button" 
                onClick={handleCloseAudit} 
                className="bg-transparent text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100/50 text-xs px-4 py-2 font-semibold"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={saving || auditForm.cantidad_fisica === '' || (delta > 0 && userRole !== 'OWNER')} 
                className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs px-4 py-2 font-bold transition-all"
              >
                Procesar Ajuste de Stock
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Resumen Financiero Dash Cards */}
      {!auditItem && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] block">Valuación Activa (Costo Promedio)</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                Bs. {totalValuation.toFixed(2)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Archive size={20} />
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] block">Pérdida por Desajuste Acumulado</span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">
                Bs. {historicalLossValue.toFixed(2)}
              </span>
            </div>
            <a 
              href="/audit-reports"
              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold border border-rose-150 py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <span>Ver Auditorías</span>
            </a>
          </div>
        </div>
      )}

      {/* Main Stock Table */}
      {!auditItem && (
        <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Ubicación</th>
                  <th className="text-center">Stock Físico</th>
                  <th className="text-center">Costo Unitario Promedio</th>
                  <th className="text-right">Valuación Total</th>
                  {hasPermission('inventario_crear') && <th className="text-center">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400 font-medium">
                      No hay productos registrados en el inventario.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map(s => {
                    const isAlerta = s.cantidadTotal < (s.producto?.stockMinimo || 10);
                    const valuation = Number(s.valorAdquisicion || 0);
                    const costoPromedio = s.cantidadTotal > 0 ? (valuation / s.cantidadTotal) : 0;
                    return (
                      <tr key={s.id} className={isAlerta ? 'bg-rose-50/20 hover:bg-rose-50/40' : ''}>
                        <td>
                          <div className="flex items-center gap-2">
                            {isAlerta && <AlertTriangle size={14} className="text-rose-500" title="Bajo el stock mínimo" />}
                            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{s.producto?.sku}</span>
                          </div>
                        </td>
                        <td className="font-semibold text-slate-800">{s.producto?.name}</td>
                        <td className="text-slate-500">
                           <div className="flex items-center gap-1">
                             <MapPin size={12} className="text-slate-400" />
                             <span className="text-xs">{s.sucursal?.name}</span>
                           </div>
                        </td>
                        <td className="text-center">
                           <strong className={`text-sm ${isAlerta ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>{s.cantidadTotal}</strong>
                           <div className="text-[10px] text-slate-400">Min: {s.producto?.stockMinimo || 10}</div>
                        </td>
                        <td className="text-center text-slate-500 text-xs">Bs {costoPromedio.toFixed(2)}</td>
                        <td className="text-right font-bold text-indigo-600">Bs {valuation.toFixed(2)}</td>
                        {hasPermission('inventario_crear') && (
                          <td className="text-center">
                            <button 
                               onClick={() => handleOpenAudit(s)}
                               className="py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/50 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            >
                              <ClipboardList size={12} />
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
