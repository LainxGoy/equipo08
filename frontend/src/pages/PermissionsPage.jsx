import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { Save, Loader2, Info, Shield, Store, Tags, Inbox, Box, Users } from 'lucide-react';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/users/permissions');
      setPermissions(res.data);
    } catch (err) {
      toast.error('Error al cargar la configuración de permisos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (role, field) => {
    setPermissions(prev => prev.map(p => {
      if (p.role === role) {
        return { ...p, [field]: !p[field] };
      }
      return p;
    }));
  };

  const handleSave = async (role) => {
    setSaving(true);
    const data = permissions.find(p => p.role === role);
    try {
      await api.put('/users/permissions', data);
      toast.success(`Políticas de seguridad de ${role} actualizadas correctamente`);
    } catch (err) {
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-slate-500 text-sm p-8">
      <Loader2 className="animate-spin" size={20} />
      Cargando permisos...
    </div>
  );

  const permissionGroups = [
    { 
      title: 'Sucursales Físicas', 
      icon: Store,
      fields: [
        { key: 'sucursales_ver', label: 'Consultar Directorio Geográfico' },
        { key: 'sucursales_crear', label: 'Registrar Nuevas Sucursales' },
        { key: 'sucursales_editar', label: 'Editar Datos de Sucursales' },
        { key: 'sucursales_eliminar', label: 'Dar de Baja Sucursales' }
      ] 
    },
    { 
      title: 'Catálogo Central (Productos)', 
      icon: Tags,
      fields: [
        { key: 'catalogo_ver', label: 'Visualización Global de Productos' },
        { key: 'catalogo_crear', label: 'Añadir Nuevos Productos' },
        { key: 'catalogo_editar', label: 'Modificar Precios y Artículos' },
        { key: 'catalogo_eliminar', label: 'Eliminar Artículos del Catálogo' }
      ] 
    },
    { 
      title: 'Gestión de Proveedores', 
      icon: Tags,
      fields: [
        { key: 'proveedores_ver', label: 'Consultar Directorio de Proveedores' },
        { key: 'proveedores_crear', label: 'Registrar Nuevos Proveedores' },
        { key: 'proveedores_editar', label: 'Editar Datos de Proveedores' },
        { key: 'proveedores_eliminar', label: 'Dar de Baja Proveedores' }
      ] 
    },
    { 
      title: 'Auditoría Sourcing (Lotes)', 
      icon: Inbox,
      fields: [
        { key: 'sourcing_ver', label: 'Inspeccionar Historial de Accesos' },
        { key: 'sourcing_crear', label: 'Registrar Nuevos Lotes' },
        { key: 'sourcing_editar', label: 'Editar Lotes Existentes' },
        { key: 'sourcing_eliminar', label: 'Anular Lotes Ingresados' }
      ] 
    },
    { 
      title: 'Niveles de Inventario y Ajustes', 
      icon: Box,
      fields: [
        { key: 'inventario_ver', label: 'Visualización de Cantidades' },
        { key: 'inventario_crear', label: 'Registrar Incidencias / Ajustes' },
        { key: 'inventario_editar', label: 'Modificar Incidencias' },
        { key: 'inventario_eliminar', label: 'Eliminar Incidencias' }
      ] 
    },
    { 
      title: 'Recursos Humanos', 
      icon: Users,
      fields: [
        { key: 'usuarios_ver', label: 'Consultar Organigrama Interno' },
        { key: 'usuarios_crear', label: 'Contratar Personal' },
        { key: 'usuarios_editar', label: 'Editar Datos de Personal' },
        { key: 'usuarios_eliminar', label: 'Desvincular Personal' }
      ] 
    },
  ];

  const renderRoleColumn = (roleName) => {
    const roleData = permissions.find(p => p.role === roleName);
    if (!roleData) return null;

    return (
      <div className="permission-card">
        {/* Header */}
        <div className="permission-card-header">
          <div className="flex items-center gap-2">
            <Shield size={18} strokeWidth={1.75} className="text-blue-600" />
            <span className="font-bold text-sm text-slate-800 uppercase">{roleName}</span>
          </div>
          <button
            className="btn-sm"
            onClick={() => handleSave(roleName)}
            disabled={saving}
          >
            <Save size={14} />
            Guardar
          </button>
        </div>

        {/* Permission Groups */}
        <div className="permission-groups">
          {permissionGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.title} className="permission-group">
                <div className="group-title">
                  <Icon size={12} />
                  {group.title}
                </div>
                {group.fields.map((field) => (
                  <div key={field.key} className="permission-row">
                    <span>{field.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!!roleData[field.key]}
                        onChange={() => handleToggle(roleName, field.key)}
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="full-width-container animate-fadein space-y-5">
      {/* Page header */}
      <div className="page-header-bar">
        <div>
          <h1>Políticas de Acceso (ACL)</h1>
          <p>Configura los permisos para cada rol de tu equipo.</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
        <p className="text-sm text-blue-700 leading-relaxed m-0">
          <strong>Nota:</strong> El perfil <strong>OWNER</strong> tiene acceso total. Los cambios a continuación aplican al personal delegado y entran en rigor al renovar su sesión.
        </p>
      </div>

      {/* Two columns */}
      <div className="grid-2">
        {renderRoleColumn('SUPERVISOR')}
        {renderRoleColumn('VENDEDOR')}
      </div>
    </div>
  );
}
