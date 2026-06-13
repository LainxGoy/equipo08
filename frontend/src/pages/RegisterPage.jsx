import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Store, Globe, MousePointerClick } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [nit, setNit] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/register', { 
        name, 
        domain, 
        email, 
        password,
        phone,
        ubicacion,
        nit,
        razonSocial
      });
      alert('Tu solicitud de registro ha sido recibida con éxito.\n\nTu espacio comercial se encuentra en revisión. Te confirmaremos la aprobación por correo electrónico (Gmail) en las próximas horas.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar la tienda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" style={{ colorScheme: 'light', background: '#f8fafc', color: '#0f172a' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-8 md:p-10 z-10"
      >
        <div className="flex justify-center mb-8">
          <span className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
            BolCl
            <MousePointerClick size={28} className="text-slate-700 mx-0.5" strokeWidth={2.5} />
            ck
          </span>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Crea tu Espacio</h2>
          <p className="text-slate-500 text-sm font-medium">Digitaliza tu tienda física en minutos</p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Nombre Comercial</label>
              <div className="relative">
                <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  placeholder="Ej. Tienda Alpha"
                  pattern="^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$"
                  title="El nombre no puede contener números ni símbolos"
                  className="w-full bg-white border border-slate-300 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Dominio Único</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={domain} 
                  onChange={e => setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} 
                  required 
                  placeholder="tiendaalpha"
                  className="w-full bg-white border border-slate-300 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-medium"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Razón Social</label>
              <input 
                type="text" 
                value={razonSocial} 
                onChange={e => setRazonSocial(e.target.value)} 
                required 
                placeholder="Ej. Tienda Alpha S.R.L."
                className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-medium text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">NIT</label>
              <input 
                type="text" 
                value={nit} 
                onChange={e => setNit(e.target.value)} 
                required 
                placeholder="Ej. 1234567019"
                className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-medium text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Teléfono de Contacto</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                required 
                placeholder="Ej. 70001234"
                className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-medium text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Ubicación / Dirección</label>
              <input 
                type="text" 
                value={ubicacion} 
                onChange={e => setUbicacion(e.target.value)} 
                required 
                placeholder="Ej. Calle Principal #123"
                className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-medium text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="admin@tiendaalpha.com"
                className="w-full bg-white border border-slate-300 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-medium"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Contraseña Maestra</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                minLength="6"
                className="w-full bg-white border border-slate-300 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-medium"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 mt-4 shadow-sm"
          >
            {loading ? 'Enviando solicitud...' : 'Solicitar Registro de Tienda'} 
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 font-medium">
          ¿Ya tienes cuenta?{' '}
          <span className="text-blue-600 font-semibold cursor-pointer hover:text-blue-700 hover:underline transition-colors" onClick={() => navigate('/login')}>
            Inicia sesión
          </span>
        </div>
      </motion.div>
    </div>
  );
}
