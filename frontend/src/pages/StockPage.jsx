import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { Archive, MapPin, ClipboardList, AlertTriangle, Save, X, History, TrendingDown } from 'lucide-react';

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

  const formatMotivo = (motivo) => {
    switch(motivo) {
      case 'ERROR_REGISTRO': return 'Error de Registro';
      case 'DANO_MERMA': return 'Artículo Dañado / Extraviado';
      case 'ROBO_O_PERDIDA': return 'Robo / No Habido';
      case 'CADUCIDAD': return 'Vencido';
      default: return motivo;
    }
  };

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

  return (
    <div className="glass-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ marginTop: 0, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Archive size={24} color="var(--primary-color)" /> Inventario y Valuación Física
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Operando bajo centros de costos segregados físicamente.</p>
        </div>

        {!auditItem && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Buscar por Nombre o SKU..." 
                value={searchProduct} 
                onChange={(e) => setSearchProduct(e.target.value)} 
                style={{ minWidth: '200px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="var(--accent-blue)" />
              <select 
                value={selectedBranch} 
                onChange={e => setSelectedBranch(e.target.value)}
                style={{ minWidth: '200px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem' }}
              >
                <option value="ALL">Consolidado Total (Todas las Sucursales)</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{tenantName} ({s.name})</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Audit Inline Form */}
      {auditItem && (
        <div style={{ padding: '1.5rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #fcd34d', paddingBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <AlertTriangle size={20} /> Acta de Auditoría de Stock (Ajuste Físico)
            </h4>
            <button onClick={handleCloseAudit} style={{ background: 'none', color: '#b45309', padding: '0.2rem' }}><X size={18} /></button>
          </div>

          <div style={{ marginBottom: '1.5rem', color: '#92400e', fontSize: '0.9rem' }}>
            Estás auditando <strong>{auditItem.producto?.name}</strong> en <strong>{auditItem.sucursal?.name}</strong>.
            Actualmente el sistema registra <strong style={{ fontSize: '1.1rem' }}>{auditItem.cantidadTotal}</strong> unidades.
          </div>

          <form onSubmit={handleSubmitAudit}>
            <div className="form-grid">
              <div className="form-group">
                <label style={{ color: '#92400e' }}>Conteo Físico Real (Unidades) *</label>
                <div className="input-with-icon">
                  <ClipboardList size={18} style={{ color: '#b45309' }} />
                  <input 
                    type="number" 
                    value={auditForm.cantidad_fisica} 
                    onChange={e => setAuditForm({...auditForm, cantidad_fisica: e.target.value})} 
                    placeholder="Ej: 9"
                    required 
                    min="0"
                    style={{ borderColor: '#fde68a' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ color: '#92400e' }}>Motivo Oficial (Obligatorio) *</label>
                <select 
                  value={auditForm.motivo} 
                  onChange={e => setAuditForm({...auditForm, motivo: e.target.value})}
                  required
                  style={{ borderColor: '#fde68a' }}
                >
                  <option value="ERROR_REGISTRO">Error de Registro Numérico</option>
                  <option value="DANO_MERMA">Artículo Dañado / Extraviado</option>
                  <option value="ROBO_O_PERDIDA">Robo / No Habido</option>
                  <option value="CADUCIDAD">Caducidad / Vencimiento</option>
                </select>
              </div>

              {delta !== null && delta < 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                  <strong>⚠️ Impacto Financiero Directo:</strong> La diferencia de {Math.abs(delta)} unidades resultará en una pérdida de valuación estimada de <strong>Bs. {getLostValue().toFixed(2)}</strong> para esta sucursal.
                </div>
              )}
              {delta !== null && delta > 0 && userRole !== 'OWNER' && (
                <div style={{ gridColumn: '1 / -1', padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                  <strong>❌ Excedente Anómalo Detectado:</strong> No puedes declarar una cantidad física ({auditForm.cantidad_fisica}) mayor a la registrada en sistema ({auditItem.cantidadTotal}).<br/>
                  Si ingresó mercancía nueva que no está en el sistema, debes hacerlo formalmente mediante el módulo de <a href="/sourcing" style={{color: '#7f1d1d', fontWeight: 'bold'}}>Lotes / Sourcing</a>.
                </div>
              )}
              {delta !== null && delta > 0 && userRole === 'OWNER' && (
                <div style={{ gridColumn: '1 / -1', padding: '1rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <strong>⚠️ Excepción de Dueño:</strong> Estás reportando un excedente anómalo (mercancía física mayor al sistema). Esta acción está restringida para empleados, pero habilitada para tu nivel.
                </div>
              )}

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ color: '#92400e' }}>Observaciones Cuantitativas (Opcional)</label>
                <input 
                  type="text" 
                  value={auditForm.observaciones} 
                  onChange={e => setAuditForm({...auditForm, observaciones: e.target.value})} 
                  placeholder="Detalles sobre el hallazgo de la diferencia de inventario..."
                  style={{ borderColor: '#fde68a' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleCloseAudit} style={{ backgroundColor: 'transparent', color: '#b45309', border: '1px solid #fde68a' }}>
                 Cancelar Vuelo
              </button>
              <button type="submit" disabled={saving || auditForm.cantidad_fisica === '' || (delta > 0 && userRole !== 'OWNER')} style={{ backgroundColor: (delta > 0 && userRole !== 'OWNER') ? '#d1d5db' : '#d97706', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={18} /> Procesar Acta y Ajustar (Síncrono)
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Resumen Financiero Top Bar */}
      {!auditItem && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {/* Tarjeta de Valuación Positiva */}
          <div style={{ backgroundColor: '#f1f5f9', padding: '1.25rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #cbd5e1' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>Inversión Física Activa (A Costo Promedio):</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                Bs. {totalValuation.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Tarjeta de Fugas/Déficit Acumulado */}
          <div style={{ backgroundColor: '#fef2f2', padding: '1.25rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #fecaca' }}>
            <div>
              <span style={{ color: '#991b1b', fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>Valuación de Déficit Acumulado:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingDown size={20} color="#b91c1c" />
                <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#b91c1c' }}>
                  Bs. {historicalLossValue.toFixed(2)}
                </span>
              </div>
            </div>
            <a 
              href="/audit-reports"
              style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', fontSize: '0.85rem', textDecoration: 'none', borderRadius: '6px' }}
            >
              <ClipboardList size={16} /> Ver Reportes
            </a>
          </div>
        </div>
      )}

      {/* Main Stock Table */}
      <div className="glass-container" style={{ padding: '0', overflow: 'x-auto', display: auditItem ? 'none' : 'block' }}>
        <table style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nombre del Producto</th>
              <th>Ubicación Física</th>
              <th style={{ textAlign: 'center' }}>Stock Total</th>
              <th style={{ textAlign: 'center' }}>Costo Promedio</th>
              <th style={{ textAlign: 'right' }}>Valuación Activo</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Operaciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.length === 0 ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Sin inventario físico en esta selección.</td></tr> : 
             filteredStock.map(s => {
               const valuation = Number(s.valorAdquisicion || 0);
               const costoPromedio = s.cantidadTotal > 0 ? (valuation / s.cantidadTotal) : 0;
               return (
                 <tr key={s.id}>
                   <td style={{ fontWeight: '500' }}><span style={{ backgroundColor: '#e2e8f0', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{s.producto?.sku}</span></td>
                   <td>{s.producto?.name}</td>
                   <td style={{ color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={14} /> 
                        <span>{tenantName} ({s.sucursal?.name})</span>
                      </div>
                   </td>
                   <td style={{ textAlign: 'center' }}>
                     <strong style={{ color: s.cantidadTotal <= 0 ? 'var(--danger-color)' : '#16a34a' }}>
                        {s.cantidadTotal} U
                     </strong>
                   </td>
                   <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Bs {costoPromedio.toFixed(2)}</td>
                   <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)' }}>Bs {valuation.toFixed(2)}</td>
                   <td style={{ textAlign: 'center' }}>
                      {hasPermission('inventario_crear') && (
                        <button 
                           onClick={() => handleOpenAudit(s)}
                           style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
                           title="Auditar Inventario / Ingresar Conteo Físico"
                        >
                          <ClipboardList size={14} /> Registrar Incidencia
                        </button>
                      )}
                   </td>
                 </tr>
               );
             })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
