import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Rocket } from 'lucide-react';

export default function LoginPage({ setAuthToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      
      // Guardar todo en localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user_id', user.id);
      localStorage.setItem('user_name', user.name);
      localStorage.setItem('user_role', user.role);
      localStorage.setItem('tenant_id', user.tenant_id);
      localStorage.setItem('tenant_name', user.tenant_name);
      localStorage.setItem('tenant_logo', user.tenant_logoUrl || '');
      localStorage.setItem('permissions', JSON.stringify(user.permissions || {}));
      
      setAuthToken(access_token);
      
      toast.success(`Bienvenido, ${user.name} (${user.tenant_name})`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg === 'PENDING_APPROVAL') {
        toast.error('Tu tienda está en proceso de revisión. Te notificaremos cuando sea aprobada.', { duration: 5000 });
      } else {
        toast.error(msg || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1624] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-sky-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#111c2e]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 md:p-10 relative z-10"
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
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Bienvenido</h2>
          <p className="text-white/50 text-sm font-medium">Ingresa a tu panel de control comercial</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="admin@mitienda.com"
                className="w-full bg-[#0a1624] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                className="w-full bg-[#0a1624] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 shadow-lg shadow-indigo-500/25"
          >
            {loading ? 'Verificando...' : 'Ingresar al Sistema'} 
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-white/40 font-medium">
          ¿No tienes una cuenta?{' '}
          <span className="text-sky-400 font-bold cursor-pointer hover:text-sky-300 transition-colors" onClick={() => navigate('/register')}>
            Registra tu tienda
          </span>
        </div>
      </motion.div>
    </div>
  );
}
