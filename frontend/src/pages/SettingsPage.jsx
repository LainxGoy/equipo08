import React, { useState, useEffect } from 'react';
import api from '../api';
import { Settings, Store, Phone, Palette, Image as ImageIcon, Save } from 'lucide-react';
import { useToast } from '../components/ToastContext';

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: '', phone: '', brandColor: '#184e77', logoUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/tenant/profile');
      setProfile({
        name: res.data.name || '',
        phone: res.data.phone || '',
        brandColor: res.data.brandColor || '#184e77',
        logoUrl: res.data.logoUrl || ''
      });
    } catch (err) {
      toast.error('Error cargando perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/tenant/profile', profile);
      localStorage.setItem('tenant_logo', profile.logoUrl || '');
      window.dispatchEvent(new Event('tenant_logo_updated'));
      toast.success('Configuración guardada correctamente');
    } catch (err) {
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-400">Cargando ajustes...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Settings className="text-blue-500" size={32} />
          Ajustes del Negocio
        </h1>
        <p className="text-slate-500 font-medium mt-2">Personaliza la información y apariencia de tu tienda.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Store size={18} className="text-slate-400" /> Perfil y Marca
          </h2>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Store size={14} /> Nombre de la Tienda
              </label>
              <input 
                type="text" 
                value={profile.name}
                onChange={e => setProfile({...profile, name: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Phone size={14} /> Teléfono de Contacto
              </label>
              <input 
                type="text" 
                value={profile.phone}
                onChange={e => setProfile({...profile, phone: e.target.value})}
                placeholder="+591 70000000"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ImageIcon size={14} /> URL del Logo
              </label>
              <input 
                type="url" 
                value={profile.logoUrl}
                onChange={e => setProfile({...profile, logoUrl: e.target.value})}
                placeholder="https://ejemplo.com/logo.png"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Palette size={14} /> Color de Marca (HEX)
              </label>
              <div className="flex gap-3">
                <input 
                  type="color" 
                  value={profile.brandColor}
                  onChange={e => setProfile({...profile, brandColor: e.target.value})}
                  className="h-11 w-14 rounded-lg cursor-pointer border border-slate-200 p-1"
                />
                <input 
                  type="text" 
                  value={profile.brandColor}
                  onChange={e => setProfile({...profile, brandColor: e.target.value})}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
