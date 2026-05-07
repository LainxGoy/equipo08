import React, { useState, useEffect } from 'react';
import api from '../api';
import { Store, Plus, X, Loader2, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', isActive: true });
  const toast = useToast();

  const userRole = localStorage.getItem('user_role');
  const userPermissions = JSON.parse(localStorage.getItem('permissions') || '{}');
  const tenantName = localStorage.getItem('tenant_name') || 'Tienda';

  const hasPermission = (key) => {
    if (userRole === 'OWNER') return true;
    return !!userPermissions[key];
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/sucursales');
      setSucursales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (s) => {
    setEditingId(s.id);
    setFormData({ name: s.name, address: s.address || '', phone: s.phone || '', isActive: s.isActive });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const proceedDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/sucursales/${confirmDelete}`);
      toast.success('Sucursal eliminada del sistema');
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
      if (editingId) {
        await api.put(`/sucursales/${editingId}`, formData);
        toast.success('Sucursal actualizada correctamente');
      } else {
        await api.post('/sucursales', formData);
        toast.success('Nueva sucursal creada con éxito');
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', address: '', phone: '', isActive: true });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Store size={24} color="var(--primary-color)" /> Gestión de Sucursales
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Administra los puntos de venta y almacenes físicos de tu Pyme.</p>
        </div>
        {hasPermission('sucursales_crear') && (
          <button 
            onClick={showForm ? resetForm : () => setShowForm(true)} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              backgroundColor: showForm ? 'var(--text-secondary)' : 'var(--accent-blue)' 
            }}
          >
            {showForm ? <><X size={18} /> Cancelar</> : <><Plus size={18} /> Aperturar Sucursal</>}
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-container" style={{ animation: 'fadeIn 0.3s ease' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            {editingId ? 'Configurar Sucursal' : 'Alta de Nueva Sucursal'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre Identificador *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required pattern="^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]*[A-Za-záéíóúÁÉÍÓÚñÑ][A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]*$" title="El nombre no puede contener símbolos y debe tener al menos una letra." placeholder="Ej. Agencia Centro" />
              </div>
              <div className="form-group">
                <label>Dirección Física</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} pattern="^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s.,#\-]*$" title="La dirección contiene caracteres no permitidos." placeholder="Ej. Calle 123 esquina Avenida" />
              </div>
              <div className="form-group">
                <label>Teléfono / Contacto</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 8)})} required pattern="^[0-9]{8}$" title="El teléfono debe tener exactamente 8 dígitos numéricos." placeholder="Ej. 70001234" maxLength="8" />
              </div>
              <div className="form-group">
                <label>Estado de Operación</label>
                <select value={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})}>
                  <option value="true">Activa y Operando</option>
                  <option value="false">Clausurada / Inactiva</option>
                </select>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: '1.5rem' }}>
              <button type="submit">
                {editingId ? 'Guardar Cambios' : 'Crear Sucursal Físicamente'}
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
              <tr>
                <th>Sucursal / Almacén</th>
                <th>Dirección</th>
                <th>Contacto</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'right', width: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sucursales.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <Store size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} /><br/>
                    Aún no has registrado ninguna sucursal física.
                  </td>
                </tr>
              ) : sucursales.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '600', color: '#1f2937' }}>{tenantName} ({s.name})</td>
                  <td style={{ color: '#64748b' }}>{s.address || '---'}</td>
                  <td style={{ color: '#64748b' }}>{s.phone || '---'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${s.isActive ? 'success' : 'danger'}`}>
                      {s.isActive ? 'Operativa' : 'Inactiva'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {hasPermission('sucursales_editar') && (
                      <button onClick={() => handleEdit(s)} style={{ padding: '0.25rem', background: 'none', color: 'var(--accent-blue)' }} title="Editar">
                        <Edit2 size={16} />
                      </button>
                    )}
                    {hasPermission('sucursales_eliminar') && (
                      <button onClick={() => handleDelete(s.id)} style={{ padding: '0.25rem', background: 'none', color: 'var(--danger-color)', marginLeft: '0.5rem' }} title="Cerrar / Eliminar">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Eliminar Sucursal"
        message="¿Seguro que deseas eliminar esta sucursal permanentemente? Esto fallará si la sucursal tiene inventario dentro."
        onConfirm={proceedDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
