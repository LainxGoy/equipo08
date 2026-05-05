import React, { useState, useEffect } from 'react';
import api from '../api';
import { PackageSearch, Plus, X, Loader2, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', sku: '', proveedor_id: '', category: 'Otros', precioCosto: '', precioVenta: '', description: '' 
  });
  const toast = useToast();

  const userRole = localStorage.getItem('user_role');
  const userPermissions = JSON.parse(localStorage.getItem('permissions') || '{}');

  const hasPermission = (key) => {
    if (userRole === 'OWNER') return true;
    return !!userPermissions[key];
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, provRes] = await Promise.all([
        api.get('/productos'),
        api.get('/proveedores')
      ]);
      setProducts(prodRes.data);
      setProviders(provRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setFormData({ 
      name: p.name, 
      sku: p.sku, 
      proveedor_id: p.proveedor_id || '', 
      category: p.category || 'Otros',
      precioCosto: p.precioCosto || '',
      precioVenta: p.precioVenta || '',
      description: p.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const proceedDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/productos/${confirmDelete}`);
      toast.success('Producto eliminado del sistema');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setConfirmDelete(null);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        proveedor_id: formData.proveedor_id,
        category: formData.category,
        description: formData.description,
        precioCosto: parseFloat(formData.precioCosto),
        precioVenta: parseFloat(formData.precioVenta)
      };

      if (editingId) {
        await api.put(`/productos/${editingId}`, payload);
        toast.success('Producto actualizado correctamente');
      } else {
        await api.post('/productos', payload);
        toast.success('Producto ingresado al catálogo');
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', sku: '', proveedor_id: '', category: 'Otros', precioCosto: '', precioVenta: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const calculateMargin = (cost, price) => {
    const c = parseFloat(cost) || 0;
    const p = parseFloat(price) || 0;
    if (p === 0) return 0;
    return (((p - c) / p) * 100).toFixed(0);
  };

  const currentMargin = calculateMargin(formData.precioCosto, formData.precioVenta);
  const isLoss = currentMargin < 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Catálogo de Artículos</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Administra tu lista de productos e inventario disponible.</p>
        </div>
        {hasPermission('catalogo_crear') && (
          <button 
            onClick={showForm ? resetForm : () => setShowForm(true)} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              backgroundColor: showForm ? 'var(--text-secondary)' : 'var(--accent-blue)' 
            }}
          >
            {showForm ? <><X size={18} /> Cancelar</> : <><Plus size={18} /> Añadir al Catálogo</>}
          </button>
        )}
      </div>

      {/* Expandable Form Section */}
      {showForm && (
        <div className="glass-container" style={{ animation: 'fadeIn 0.3s ease' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            {editingId ? 'Editar Artículo' : 'Nuevo Artículo'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              
              <div className="form-group">
                <label>Nombre del Producto *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Ej. Coca-Cola, Zapatillas Nike" />
              </div>

              <div className="form-group">
                <label>Variante / Especificación (Opcional)</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ej. Zero 500ml, Talla M, etc." />
              </div>

              <div className="form-group">
                <label>SKU (Código Interno) *</label>
                <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})} required placeholder="ZAP-NK-01" />
              </div>

              <div className="form-group">
                <label>Categoría Global *</label>
                <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Abarrotes y Alimentos">Abarrotes y Alimentos</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Ropa y Moda">Ropa y Moda</option>
                  <option value="Zapatos y Calzado">Zapatos y Calzado</option>
                  <option value="Belleza y Cuidado Personal">Belleza y Cuidado Personal</option>
                  <option value="Joyería y Relojes">Joyería y Relojes</option>
                  <option value="Juguetes y Niños">Juguetes y Niños</option>
                  <option value="Hogar y Decoración">Hogar y Decoración</option>
                  <option value="Electrónica y Tecnología">Electrónica y Tecnología</option>
                  <option value="Ferretería y Construcción">Ferretería y Construcción</option>
                  <option value="Deportes y Aire Libre">Deportes y Aire Libre</option>
                  <option value="Entretenimiento y Ocio">Entretenimiento y Ocio</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className="form-group">
                <label>Precio Coste (Bs) *</label>
                <input type="number" step="0.01" min="0" value={formData.precioCosto} onChange={e => setFormData({...formData, precioCosto: e.target.value})} required placeholder="0.00" />
              </div>

              <div className="form-group">
                <label>Precio Venta Pública (Bs) *</label>
                <input type="number" step="0.01" min="0" value={formData.precioVenta} onChange={e => setFormData({...formData, precioVenta: e.target.value})} required placeholder="0.00" />
              </div>

              <div className="form-group">
                <label>Proveedor Habitual *</label>
                <select required value={formData.proveedor_id} onChange={e => setFormData({...formData, proveedor_id: e.target.value})}>
                  <option value="">-- Seleccione proveedor --</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Margen de Ganancia %</label>
                <div style={{ display: 'flex', alignItems: 'center', height: '40px', padding: '0 1rem', backgroundColor: isLoss ? '#fef2f2' : '#f1f5f9', color: isLoss ? '#dc2626' : 'var(--text-primary)', borderRadius: '6px', fontWeight: 'bold' }}>
                  {isLoss && <AlertTriangle size={16} style={{ marginRight: '0.5rem' }}/>}
                  {currentMargin}% {isLoss ? '(Pérdida Matemática)' : ''}
                </div>
              </div>

            </div>
            <div className="form-actions">
              <button type="submit" disabled={isLoss} style={isLoss ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                {editingId ? 'Guardar Cambios' : 'Anexar Artículo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Section */}
      <div className="glass-container" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '3rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--accent-blue)" style={{ margin: '0 auto' }} /></div> : (
          <table>
            <thead>
              <tr style={{ color: 'var(--text-secondary)' }}>
                <th>Nombre del artículo</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Coste</th>
                <th>Margen</th>
                <th style={{ textAlign: 'center' }}>En stock</th>
                <th style={{ textAlign: 'right', width: '80px' }}></th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <PackageSearch size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} /><br/>
                    Aún no hay productos en el catálogo.
                  </td>
                </tr>
              ) : products.map(p => {
                // Sum branches logically (or single total if no branches setup yet)
                const totalStock = p.stocks?.reduce((acc, curr) => acc + curr.cantidadTotal, 0) || 0;
                const margin = p.precioVenta > 0 ? (((p.precioVenta - p.precioCosto) / p.precioVenta) * 100).toFixed(0) : 0;
                
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '500', color: '#1f2937' }}>{p.name}</span>
                      {p.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: '2px' }}>
                          Variante: {p.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                        <span style={{ color: '#94a3b8' }}>SKU: {p.sku}</span>
                        <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>• {p.proveedor?.name || 'Prov. Indefinido'}</span>
                      </div>
                    </td>
                    <td style={{ color: '#64748b' }}>
                      <div>{p.category || 'Otros'}</div>
                    </td>
                    <td style={{ fontWeight: '500' }}>Bs.{Number(p.precioVenta).toFixed(2)}</td>
                    <td style={{ color: '#64748b' }}>Bs.{Number(p.precioCosto).toFixed(2)}</td>
                    <td><span style={{ color: margin < 0 ? '#dc2626' : 'inherit' }}>{margin}%</span></td>
                    <td style={{ textAlign: 'center' }}>
                      {totalStock === 0 ? <span style={{ color: '#94a3b8' }}>—</span> : <strong>{totalStock}</strong>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {hasPermission('catalogo_editar') && (
                        <button onClick={() => handleEdit(p)} style={{ padding: '0.25rem', background: 'none', color: '#64748b' }} title="Editar">
                          <Edit2 size={16} />
                        </button>
                      )}
                      {hasPermission('catalogo_eliminar') && (
                        <button onClick={() => handleDelete(p.id)} style={{ padding: '0.25rem', background: 'none', color: 'var(--danger-color)', marginLeft: '0.5rem' }} title="Dar de baja">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Dar de Baja Artículo"
        message="¿Estás seguro que deseas eliminar permanentemente este producto del catálogo? Esta acción no puede deshacerse."
        onConfirm={proceedDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
