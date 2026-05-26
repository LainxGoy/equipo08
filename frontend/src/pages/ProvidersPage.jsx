import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, X, Loader2, Trash2, Search, Building2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', taxId: '', contactEmail: '' });
  const [searchingNit, setSearchingNit] = useState(false);
  const [isFound, setIsFound] = useState(false);
  const toast = useToast();

  const userRole = localStorage.getItem('user_role');
  const userPermissions = JSON.parse(localStorage.getItem('permissions') || '{}');

  const hasPermission = (key) => {
    if (userRole === 'OWNER') return true;
    return !!userPermissions[key];
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data } = await api.get('/proveedores');
      setProviders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNitSearch = async () => {
    if (!formData.taxId) {
      toast.error('Por favor, ingresa un NIT para buscar.');
      return;
    }
    setSearchingNit(true);
    try {
      const { data } = await api.get(`/proveedores/global/${formData.taxId}`);
      // Auto-fill and lock
      setFormData({
        ...formData,
        name: data.name,
        contactEmail: data.contactEmail,
      });
      setIsFound(true);
      toast.success('Proveedor Maestro encontrado y autocompletado.');
    } catch (err) {
      setIsFound(false);
      setFormData({ ...formData, name: '', contactEmail: '' });
      toast.error(err.response?.data?.message || 'Proveedor no encontrado. Contacta al administrador.');
    } finally {
      setSearchingNit(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const proceedDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/proveedores/${confirmDelete}`);
      toast.success('Proveedor quitado de tu catálogo local');
      fetchProviders();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!isFound) {
        toast.error('Debes buscar un NIT válido y registrado primero.');
        return;
      }
      if (!formData.name) return;
      
      await api.post('/proveedores', formData);
      toast.success('Proveedor anexado a tu directorio');
      
      resetForm();
      fetchProviders();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', taxId: '', contactEmail: '' });
    setIsFound(false);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Actions */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 size={22} className="text-indigo-600" />
            <span>Directorio de Proveedores</span>
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Añade proveedores registrados en el sistema central vinculándolos mediante su NIT.
          </p>
        </div>
        {hasPermission('proveedores_crear') && (
          <button 
            onClick={showForm ? resetForm : () => setShowForm(true)} 
            className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              showForm ? 'bg-slate-600 hover:bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {showForm ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Nuevo Proveedor</>}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm animate-fadeIn">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 mb-6">
            Importar Proveedor Maestro
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-grid">
              
              <div className="form-group">
                <label htmlFor="prov-tax-id">Buscador Maestro de NIT / RUT</label>
                <div className="flex gap-2">
                  <input 
                    id="prov-tax-id"
                    type="text" 
                    value={formData.taxId} 
                    onChange={e => setFormData({...formData, taxId: e.target.value})} 
                    pattern="^\d{8,12}$" 
                    title="Debe contener entre 8 y 12 números sin espacios ni símbolos" 
                    placeholder="Escribe el NIT..." 
                    className="flex-1"
                  />
                  {!isFound && (
                    <button 
                      type="button" 
                      onClick={handleNitSearch} 
                      disabled={searchingNit}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      {searchingNit ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 
                      Buscar
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                  NIT Sugerido para pruebas: 10002000 (Proveedor Maestro)
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="prov-name">Razón Social / Nombre Comercial *</label>
                <input 
                  id="prov-name"
                  type="text" 
                  value={formData.name} 
                  required 
                  readOnly 
                  placeholder="Esperando NIT válido..." 
                  className="bg-slate-50 cursor-not-allowed text-slate-500 border-slate-200"
                />
              </div>

              <div className="form-group">
                <label htmlFor="prov-email">Email de Contacto Comercial</label>
                <input 
                  id="prov-email"
                  type="email" 
                  value={formData.contactEmail} 
                  readOnly 
                  placeholder="Se autocompleta desde el NIT" 
                  className="bg-slate-50 cursor-not-allowed text-slate-500 border-slate-200"
                />
              </div>

            </div>
            
            <div className="form-actions pt-4 border-t border-slate-100 mt-6">
              <button 
                type="submit" 
                disabled={!isFound} 
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs py-2 px-4 font-bold"
              >
                Anexar Proveedor a la Tienda
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Table */}
      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 mb-2" size={28} />
            <p className="text-xs text-slate-500 font-semibold">Cargando directorio...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Razón Social Local</th>
                  <th>NIT / RUT</th>
                  <th>Correo de Contacto</th>
                  {hasPermission('proveedores_eliminar') && <th className="text-center w-24">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {providers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-16 text-slate-450 font-medium">
                      No hay proveedores registrados en tu Empresa. Importa uno usando su NIT.
                    </td>
                  </tr>
                ) : (
                  providers.map(p => (
                    <tr key={p.id}>
                      <td className="font-semibold text-slate-800">{p.name}</td>
                      <td className="font-mono text-xs text-slate-600">{p.taxId || '-'}</td>
                      <td className="text-slate-500 text-xs">{p.contactEmail || '-'}</td>
                      {hasPermission('proveedores_eliminar') && (
                        <td className="text-center">
                          <button 
                            onClick={() => handleDelete(p.id)} 
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                            title="Quitar proveedor"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Quitar Proveedor Local"
        message="¿Estás seguro de que deseas quitar a este proveedor de la vista local de tu empresa? Solo se eliminará de TU catálogo local, no del sistema maestro."
        onConfirm={proceedDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
