import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { Trash2, Mail, Shield, User as UserIcon, Loader2, UserPlus, X, Store, Filter, Edit2, Save } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Show/Hide Inline Form (matching SourcingPage pattern)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'VENDEDOR',
    sucursal_id: ''
  });

  // Filters State
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterSucursal, setFilterSucursal] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, sucursalesRes] = await Promise.all([
        api.get('/users'),
        api.get('/sucursales')
      ]);
      setUsers(usersRes.data);
      setSucursales(usersRes.data); // Backwards compatibility if needed, but let's correct this line: it should be sucursalesRes.data!
      setSucursales(sucursalesRes.data);
    } catch (err) {
      toast.error('Error al cargar datos del personal');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '', // Password stays empty unless intentionally reset
      role: user.role,
      sucursal_id: user.sucursal_id || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setUserForm({ name: '', email: '', password: '', role: 'VENDEDOR', sucursal_id: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...userForm };
      if (!payload.sucursal_id) delete payload.sucursal_id;
      if (editingId && !payload.password) delete payload.password; // Don't send empty pass on edit

      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
        toast.success('Perfil de empleado actualizado exitosamente');
      } else {
        await api.post('/users', payload);
        toast.success('Empleado registrado correctamente en el sistema');
      }
      
      handleCancel();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al procesar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar a este empleado? Perderá acceso inmediato.')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Empleado desvinculado con éxito');
      fetchData();
    } catch (err) {
      toast.error('Error al eliminar usuario');
    }
  };

  const filteredUsers = users.filter(u => {
    if (filterRole !== 'ALL' && u.role !== filterRole) return false;
    if (filterSucursal !== 'ALL' && u.sucursal_id !== filterSucursal) return false;
    return true;
  });

  return (
    <div className="full-width-container animate-fadein space-y-6">
      
      {/* Header Section */}
      <div className="page-header-bar">
        <div>
          <h1>Personal y Empleados</h1>
          <p>Administra las cuentas de acceso y asigna sucursales operacionales a tus empleados.</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`py-2 px-5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
              showFilters ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            {showFilters ? 'Ocultar Filtros' : 'Buscar / Filtrar'}
          </button>
          <button 
            onClick={showForm ? handleCancel : () => setShowForm(true)} 
            className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
              showForm ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-white text-[#184e77] hover:bg-slate-50'
            }`}
          >
            {showForm ? <><X size={14} /> Cancelar</> : <><UserPlus size={14} /> Registrar Nuevo Empleado</>}
          </button>
        </div>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm animate-fadeIn relative">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider m-0">
               {editingId ? `Editar Perfil de Empleado` : 'Alta de Nuevo Empleado'}
            </h3>
            <button 
              type="button" 
              onClick={handleCancel} 
              className="text-slate-400 hover:text-slate-655 hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
              title="Cerrar Formulario"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-grid">
              
              <div className="form-group">
                <label htmlFor="usr-name">Nombre Completo *</label>
                <input 
                  id="usr-name"
                  type="text" 
                  value={userForm.name} 
                  onChange={e => setUserForm({...userForm, name: e.target.value})} 
                  placeholder="Ej. Juan Pérez"
                  pattern="^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$"
                  title="El nombre no puede contener números ni símbolos"
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="usr-email">Correo Electrónico *</label>
                <input 
                  id="usr-email"
                  type="email" 
                  value={userForm.email} 
                  onChange={e => setUserForm({...userForm, email: e.target.value})} 
                  placeholder="juan@mitienda.com"
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="usr-pass">{editingId ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso *'}</label>
                <input 
                  id="usr-pass"
                  type="password" 
                  value={userForm.password} 
                  onChange={e => setUserForm({...userForm, password: e.target.value})} 
                  placeholder={editingId ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
                  required={!editingId}
                  minLength={6}
                />
                {editingId && <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Deja el campo vacío si no deseas cambiar su contraseña actual.</span>}
              </div>

              <div className="form-group">
                <label htmlFor="usr-role">Rol de Privilegios *</label>
                <select 
                  id="usr-role"
                  value={userForm.role} 
                  onChange={e => setUserForm({...userForm, role: e.target.value})}
                  required
                >
                  <option value="VENDEDOR">Vendedor operativo</option>
                  <option value="SUPERVISOR">Supervisor administrativo</option>
                  {userForm.role === 'OWNER' && <option value="OWNER">Dueño (Original)</option>}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="usr-branch">Sucursal Asignada</label>
                <select 
                  id="usr-branch"
                  value={userForm.sucursal_id} 
                  onChange={e => setUserForm({...userForm, sucursal_id: e.target.value})}
                >
                  <option value="">- Acceso Completo (HQ / Administración) -</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions pt-4 border-t border-slate-100 mt-6 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={handleCancel} 
                className="btn-premium"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-premium btn-premium-indigo"
              >
                {editingId ? 'Guardar Cambios' : 'Confirmar Alta de Empleado'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Drawer */}
      {showFilters && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-end md:items-center gap-4 animate-fadeIn">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filtrar por Rol</label>
            <select 
              value={filterRole} 
              onChange={e => setFilterRole(e.target.value)} 
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="ALL">-- Todos los roles --</option>
              <option value="OWNER">Owner</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="VENDEDOR">Vendedor</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filtrar por Sucursal</label>
            <select 
              value={filterSucursal} 
              onChange={e => setFilterSucursal(e.target.value)} 
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="ALL">-- Todas las sucursales --</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="w-full md:w-auto flex justify-end">
            <button
              onClick={() => { setFilterRole('ALL'); setFilterSucursal('ALL'); }}
              className="text-slate-400 hover:text-rose-600 text-xs font-bold uppercase tracking-wider mt-2 md:mt-0 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="table-premium-wrapper">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 mb-2" size={28} />
            <p className="text-xs text-slate-500 font-semibold">Cargando personal...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-premium">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Nombre del Empleado</th>
                  <th style={{ width: '25%' }}>Acceso (Email)</th>
                  <th style={{ width: '15%' }}>Privilegios (Rol)</th>
                  <th style={{ width: '20%' }}>Sucursal Asignada</th>
                  <th className="text-center" style={{ width: '10%' }}>Estado</th>
                  <th className="text-center" style={{ width: '10%' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16 text-slate-400 font-medium">
                      No se encontraron registros de personal bajo estos filtros.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs uppercase">
                            {user.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-800 text-sm">{user.name}</span>
                        </div>
                      </td>
                      <td className="text-slate-650 text-xs">{user.email}</td>
                      <td>
                        <span className={`badge badge-${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {user.sucursal ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                            <Store size={12} className="text-slate-400" />
                            <span>{user.sucursal.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-455 italic font-medium">Acceso Global (HQ)</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`}></span>
                          <span className="text-xs font-semibold text-slate-700">{user.isActive ? 'Activo' : 'Inactivo'}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => handleEdit(user)} 
                            className="btn-premium-icon"
                            title="Editar / Reset Password"
                          >
                            <Edit2 size={12} />
                          </button>
                          {user.role !== 'OWNER' && (
                            <button 
                              onClick={() => handleDeleteUser(user.id)} 
                              className="btn-premium-icon btn-premium-icon-danger"
                              title="Dar de baja definitiva"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
