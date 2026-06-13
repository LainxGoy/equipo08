import React, { useState, useEffect } from 'react';
import api, { getBackendUrl } from '../api';
import { Settings, Store, Phone, Image as ImageIcon, Save, Loader2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: '', phone: '', logoUrl: '', bannerUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const toast = useToast();

  const getImageUrl = (url) => {
    return getBackendUrl(url);
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 600;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 800, 600);
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Image compression failed"));
            }
          }, 'image/webp', 0.7);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const fData = new FormData();
      fData.append('file', compressed);
      
      const { data } = await api.post('/productos/upload', fData);
      
      setProfile(prev => ({ ...prev, logoUrl: data.url }));
      toast.success('Logo comprimido (800x600 WebP 70%) y cargado con éxito');
    } catch (err) {
      toast.error('Error al procesar/subir el logo');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/tenant/profile');
      setProfile({
        name: res.data.name || '',
        phone: res.data.phone || '',
        logoUrl: res.data.logoUrl || '',
        bannerUrl: res.data.bannerUrl || ''
      });
    } catch (err) {
      toast.error('Error cargando perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleBannerFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const compressed = await compressImage(file);
      const fData = new FormData();
      fData.append('file', compressed);
      
      const { data } = await api.post('/productos/upload', fData);
      
      setProfile(prev => ({ ...prev, bannerUrl: data.url }));
      toast.success('Fondo de portada comprimido y cargado con éxito');
    } catch (err) {
      toast.error('Error al procesar/subir el fondo de portada');
      console.error(err);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/tenant/profile', profile);
      sessionStorage.setItem('tenant_logo', profile.logoUrl || '');
      sessionStorage.setItem('tenant_banner', profile.bannerUrl || '');
      window.dispatchEvent(new Event('tenant_logo_updated'));
      toast.success('Configuración guardada correctamente');
    } catch (err) {
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--txt-muted)] mb-4" size={32} />
        <span className="text-[var(--txt-secondary)] font-medium">Cargando ajustes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--txt-primary)] tracking-tight flex items-center gap-3">
          <Settings className="text-[var(--txt-secondary)]" size={32} />
          Ajustes del Negocio
        </h1>
        <p className="text-[var(--txt-secondary)] font-medium mt-2">Personaliza la información principal de tu tienda.</p>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--bg)]">
          <h2 className="text-base font-bold text-[var(--txt-primary)] flex items-center gap-2">
            <Store size={18} className="text-[var(--txt-secondary)]" /> Perfil Comercial
          </h2>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className="block text-xs font-bold text-[var(--txt-secondary)] uppercase tracking-wider mb-2">
                Teléfono de Contacto
              </label>
              <input 
                type="text" 
                value={profile.phone}
                onChange={e => setProfile({...profile, phone: e.target.value})}
                placeholder="+591 70000000"
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--txt-primary)] focus:ring-1 focus:ring-[var(--txt-primary)] focus:border-[var(--txt-primary)] outline-none transition-all"
              />
            </div>
             <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[var(--txt-secondary)] uppercase tracking-wider mb-2">
                Logo de la Empresa (Opcional)
              </label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
                id="logo-upload" 
                disabled={uploading}
              />
              <div className="flex gap-3 items-center mt-1">
                {profile.logoUrl && (
                  <img 
                    src={getImageUrl(profile.logoUrl)} 
                    alt="Logo Preview" 
                    className="w-16 h-16 object-cover rounded-xl border border-[var(--border)] bg-white" 
                  />
                )}
                <label 
                  htmlFor="logo-upload" 
                  className={`cursor-pointer py-2 px-4 border border-[var(--border)] text-xs font-bold text-[var(--txt-secondary)] rounded-xl flex items-center gap-1.5 transition-colors bg-[var(--bg)] ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  {uploading ? 'Procesando...' : 'Subir Logo'}
                </label>
                {profile.logoUrl && (
                  <button 
                    type="button" 
                    onClick={() => setProfile({...profile, logoUrl: ''})} 
                    className="text-xs text-red-500 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer h-auto"
                  >
                    Quitar Logo
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-2 mt-4">
              <label className="block text-xs font-bold text-[var(--txt-secondary)] uppercase tracking-wider mb-2">
                Imagen de Portada / Banner de la Tienda (Opcional)
              </label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleBannerFileChange} 
                className="hidden" 
                id="banner-upload" 
                disabled={uploadingBanner}
              />
              <div className="flex gap-3 items-center mt-1">
                {profile.bannerUrl && (
                  <img 
                    src={getImageUrl(profile.bannerUrl)} 
                    alt="Banner Preview" 
                    className="w-32 h-16 object-cover rounded-xl border border-[var(--border)] bg-white" 
                  />
                )}
                <label 
                  htmlFor="banner-upload" 
                  className={`cursor-pointer py-2 px-4 border border-[var(--border)] text-xs font-bold text-[var(--txt-secondary)] rounded-xl flex items-center gap-1.5 transition-colors bg-[var(--bg)] ${uploadingBanner ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  {uploadingBanner ? 'Procesando...' : 'Subir Banner de Portada'}
                </label>
                {profile.bannerUrl && (
                  <button 
                    type="button" 
                    onClick={() => setProfile({...profile, bannerUrl: ''})} 
                    className="text-xs text-red-500 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer h-auto"
                  >
                    Quitar Banner
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--border)] flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="flex items-center gap-2 bg-[var(--txt-primary)] hover:opacity-90 text-[var(--bg-card)] px-6 py-3 rounded-xl font-bold text-sm transition-opacity disabled:opacity-50"
            >
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
