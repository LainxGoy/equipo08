import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from '../components/ToastContext';

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
    <div className="auth-container">
      <div className="auth-card">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center p-2">
            <img src="/logo.png" alt="BolClick Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        
        <h2 className="auth-title">Iniciar Sesión</h2>
        <p className="auth-subtitle">Accede al panel de control de tu tienda</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="form-group">
            <label htmlFor="login-email">Correo Electrónico</label>
            <input 
              id="login-email"
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="admin@mitienda.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="login-password">Contraseña</label>
            <input 
              id="login-password"
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" disabled={loading} className="w-full h-11 mt-2 text-sm font-semibold">
            {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500 font-medium">
          ¿No tienes una cuenta?{' '}
          <span className="auth-link cursor-pointer hover:text-indigo-700 transition-colors" onClick={() => navigate('/register')}>
            Registrar mi tienda
          </span>
        </div>
      </div>
    </div>
  );
}
