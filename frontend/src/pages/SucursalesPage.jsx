import React, { useState, useEffect } from 'react';
import api from '../api';
import { Store, Plus, X, Loader2, Edit2, Trash2, Clock, Phone, MapPin } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import DoomEasterEgg from '../components/DoomEasterEgg';
import { motion, AnimatePresence } from 'framer-motion';

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', horarios: '', isActive: true });
  const [horariosData, setHorariosData] = useState([]);
  const [showDoom, setShowDoom] = useState(false);
  const [viewingHorarios, setViewingHorarios] = useState(null);
  const toast = useToast();
  
  const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const handleAddHorario = () => {
    setHorariosData([...horariosData, { days: [], start: '08:00', end: '18:00' }]);
  };

  const handleUpdateHorarioDays = (index, day) => {
    const newH = [...horariosData];
    const days = newH[index].days;
    if (days.includes(day)) {
      newH[index].days = days.filter(d => d !== day);
    } else {
      newH[index].days = [...days, day];
    }
    setHorariosData(newH);
  };

  const userRole = sessionStorage.getItem('user_role');
  const userPermissions = JSON.parse(sessionStorage.getItem('permissions') || '{}');
  const tenantName = sessionStorage.getItem('tenant_name') || 'Tienda';

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
    try {
      setHorariosData(s.horarios ? JSON.parse(s.horarios) : []);
    } catch (e) {
      setHorariosData([]);
    }
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
    
    // Easter Egg Check: Lunes a Lunes de 07:00 a 08:00
    const isEasterEgg = horariosData.some(h => 
      h.days.length === 7 && h.start === '07:00' && h.end === '08:00'
    );
    if (isEasterEgg) {
      setShowDoom(true);
    }
    
    const submitData = { ...formData, horarios: JSON.stringify(horariosData) };
    try {
      if (editingId) {
        await api.put(`/sucursales/${editingId}`, submitData);
        toast.success('Sucursal actualizada correctamente');
      } else {
        await api.post('/sucursales', submitData);
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
    setHorariosData([]);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="full-width-container animate-fadein space-y-6">
      <div className="page-header-bar">
        <div>
          <h1>Gestión de Sucursales</h1>
          <p>Administra los puntos de venta y almacenes físicos de tu Pyme.</p>
        </div>
        {hasPermission('sucursales_crear') && (
          <button 
            onClick={showForm ? resetForm : () => setShowForm(true)} 
            className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
              showForm ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-white text-[#184e77] hover:bg-slate-50'
            }`}
          >
            {showForm ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Aperturar Sucursal</>}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm animate-fadeIn relative">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider m-0">
              {editingId ? 'Configurar Sucursal' : 'Alta de Nueva Sucursal'}
            </h3>
            <button 
              type="button" 
              onClick={resetForm} 
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors hover:bg-slate-50"
              title="Cerrar Formulario"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="branch-name">Nombre Identificador *</label>
                <input 
                  id="branch-name"
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                  pattern="^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]*[A-Za-záéíóúÁÉÍÓÚñÑ][A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]*$" 
                  title="El nombre no puede contener símbolos y debe tener al menos una letra." 
                  placeholder="Ej. Agencia Centro" 
                />
              </div>
              <div className="form-group">
                <label htmlFor="branch-address">Dirección Física</label>
                <input 
                  id="branch-address"
                  type="text" 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  pattern="^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s.,#\-]*$" 
                  title="La dirección contiene caracteres no permitidos." 
                  placeholder="Ej. Calle 123 esquina Avenida" 
                />
              </div>
              <div className="form-group">
                <label htmlFor="branch-phone">Teléfono / Contacto</label>
                <input 
                  id="branch-phone"
                  type="text" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 8)})} 
                  required 
                  pattern="^[0-9]{8}$" 
                  title="El teléfono debe tener exactamente 8 dígitos numéricos." 
                  placeholder="Ej. 70001234" 
                  maxLength="8" 
                />
              </div>
              <div className="form-group col-span-full">
                <label>Horarios de Atención</label>
                <div className="flex flex-col gap-4 mt-1">
                  {horariosData.map((h, i) => (
                    <div key={i} className="flex flex-col gap-3 p-4 rounded-xl relative" style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Días Aplicables:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {DAYS_OF_WEEK.map(day => {
                            const active = h.days.includes(day);
                            const isUsedElsewhere = horariosData.some((block, idx) => idx !== i && block.days.includes(day));
                            return (
                              <button 
                                key={day} 
                                type="button" 
                                disabled={isUsedElsewhere}
                                onClick={() => handleUpdateHorarioDays(i, day)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-all ${
                                  active 
                                    ? 'shadow-sm' 
                                    : isUsedElsewhere
                                      ? 'cursor-not-allowed opacity-30'
                                      : 'opacity-70 hover:opacity-100'
                                }`}
                                style={{
                                  backgroundColor: active ? 'var(--txt-primary)' : 'transparent',
                                  color: active ? 'var(--bg-card)' : 'var(--txt-primary)',
                                  borderColor: active ? 'var(--txt-primary)' : 'var(--border)'
                                }}
                              >
                                {day.slice(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 items-center mt-1">
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs font-semibold text-slate-500 m-0">Desde:</label>
                          <input 
                            type="time" 
                            value={h.start} 
                            onChange={e => { const newH = [...horariosData]; newH[i].start = e.target.value; setHorariosData(newH); }} 
                            className="py-1 px-2 border border-slate-250 rounded text-xs w-28 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs font-semibold text-slate-500 m-0">Hasta:</label>
                          <input 
                            type="time" 
                            value={h.end} 
                            onChange={e => { const newH = [...horariosData]; newH[i].end = e.target.value; setHorariosData(newH); }} 
                            className="py-1 px-2 border border-slate-250 rounded text-xs w-28 focus:outline-none"
                          />
                        </div>
                        
                        <button 
                          type="button" 
                          onClick={() => setHorariosData(horariosData.filter((_, idx) => idx !== i))} 
                          className="p-1.5 rounded-lg absolute top-4 right-4 transition-all"
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--danger)'
                          }}
                          title="Eliminar horario"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    type="button" 
                    onClick={handleAddHorario} 
                    className="self-start py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px dashed var(--border)',
                      color: 'var(--txt-primary)'
                    }}
                  >
                    <Plus size={14} /> 
                    <span>Agregar Bloque de Horario</span>
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="branch-status">Estado de Operación</label>
                <select id="branch-status" value={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})}>
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </select>
              </div>
            </div>
            <div className="form-actions pt-4 border-t border-slate-100 mt-6 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={resetForm} 
                className="btn-premium"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-premium btn-premium-indigo"
              >
                {editingId ? 'Guardar Cambios' : 'Aperturar Sucursal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Section */}
      <div className="table-premium-wrapper">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 mb-2" size={28} />
            <p className="text-xs text-slate-500 font-semibold">Cargando sucursales comercial...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-premium">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Sucursal / Almacén</th>
                  <th style={{ width: '30%' }}>Dirección</th>
                  <th style={{ width: '25%' }}>Teléfono</th>
                  <th className="text-center" style={{ width: '10%' }}>Estado</th>
                  {hasPermission('sucursales_editar') && <th className="text-center" style={{ width: '10%' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {sucursales.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-16 text-slate-450 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Store size={28} className="text-slate-300" />
                        <span>Aún no has registrado ninguna sucursal física.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sucursales.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div className="text-sm text-slate-800 font-medium">
                          {s.name}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{tenantName}</div>
                      </td>
                      <td className="text-sm text-slate-800">{s.address || '---'}</td>
                      <td className="text-sm text-slate-800 font-medium">{s.phone || '---'}</td>
                      <td className="text-center text-sm text-slate-800">
                        {s.isActive ? 'Activa' : 'Inactiva'}
                      </td>
                      {hasPermission('sucursales_editar') && (
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {s.horarios && (
                              <button 
                                onClick={() => setViewingHorarios(s)} 
                                className="btn-premium-icon"
                                title="Ver Horarios"
                              >
                                <Clock size={12} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleEdit(s)} 
                              className="btn-premium-icon"
                              title="Editar"
                            >
                              <Edit2 size={12} />
                            </button>
                            {hasPermission('sucursales_eliminar') && (
                              <button 
                                onClick={() => handleDelete(s.id)} 
                                className="btn-premium-icon btn-premium-icon-danger"
                                title="Cerrar / Eliminar"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
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
        title="Dar de Baja Sucursal"
        message="¿Estás seguro de que deseas eliminar permanentemente esta sucursal? Esta acción puede afectar a los productos y registros de stock físico asociados."
        onConfirm={proceedDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Modal para ver Horarios */}
      <AnimatePresence>
        {viewingHorarios && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingHorarios(null)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 p-6 z-10 text-slate-800 dark:text-slate-100"
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="text-indigo-600 dark:text-indigo-400" size={20} />
                  <h3 className="font-bold text-sm uppercase tracking-wide">Horarios de Atención</h3>
                </div>
                <button
                  onClick={() => setViewingHorarios(null)}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sucursal / Almacén</div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{viewingHorarios.name}</div>
              </div>

              <div className="space-y-2.5">
                {(() => {
                  try {
                    const parsed = JSON.parse(viewingHorarios.horarios);
                    if (!parsed || parsed.length === 0) {
                      return <p className="text-xs text-slate-500 italic">No hay horarios registrados.</p>;
                    }
                    return parsed.map((h, i) => (
                      <div key={i} className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {h.days.length === 7 ? 'Todos los días' : h.days.join(', ')}
                        </span>
                        <span className="text-[11px] font-medium text-slate-505 dark:text-slate-400 flex items-center gap-1.5">
                          <Clock size={12} className="opacity-60" /> {h.start} a {h.end}
                        </span>
                      </div>
                    ));
                  } catch (e) {
                    return <p className="text-xs text-slate-500">{viewingHorarios.horarios}</p>;
                  }
                })()}
              </div>

              <button
                onClick={() => setViewingHorarios(null)}
                className="w-full mt-6 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showDoom && <DoomEasterEgg onClose={() => setShowDoom(false)} />}
    </div>
  );
}
