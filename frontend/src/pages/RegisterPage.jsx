import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Store, Globe, Rocket } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/register', { name, domain, email, password });
      toast.success('Cuenta comercial creada con éxito. Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar la tienda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1624] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-sky-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg bg-[#111c2e]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 md:p-10 relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="flex items-center justify-center">
            <span className="text-4xl font-black text-white tracking-tighter flex items-center">
              BolCl
              <div className="relative mx-0.5 flex flex-col items-center justify-center">
                <Rocket size={32} className="text-[#ff5100] -mt-2" fill="currentColor" />
                <div className="flex gap-1 mt-1">
                  <div className="w-1 h-2 bg-[#ff5100] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-3 bg-[#ff5100] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-2 bg-[#ff5100] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
              ck
            </span>
          </div>
        </div>
        
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Crea tu Espacio</h2>
          <p className="text-white/50 text-sm font-medium">Digitaliza tu tienda física en minutos</p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Nombre Comercial</label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  placeholder="Ej. Tienda Alpha"
                  pattern="^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$"
                  title="El nombre no puede contener números ni símbolos"
                  className="w-full bg-[#0a1624] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Dominio Único</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input 
                  type="text" 
                  value={domain} 
                  onChange={e => setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} 
                  required 
                  placeholder="tiendaalpha"
                  className="w-full bg-[#0a1624] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Correo Electrónico (Admin)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="admin@tiendaalpha.com"
                className="w-full bg-[#0a1624] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Contraseña Maestra</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                minLength="6"
                className="w-full bg-[#0a1624] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-indigo-500/25"
          >
            {loading ? 'Configurando espacio...' : 'Comenzar a usar BolClick'} 
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-white/40 font-medium">
          ¿Ya tienes cuenta?{' '}
          <span className="text-indigo-400 font-bold cursor-pointer hover:text-indigo-300 transition-colors" onClick={() => navigate('/login')}>
            Inicia sesión
          </span>
        </div>
      </motion.div>
    </div>
  );
}
