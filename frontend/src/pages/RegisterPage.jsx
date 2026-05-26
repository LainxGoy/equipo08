import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from '../components/ToastContext';

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
    <div className="auth-container">
      <div className="auth-card max-w-lg">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center p-2">
            <img src="/logo.png" alt="BolClick Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <h2 className="auth-title">Registra tu Tienda</h2>
        <p className="auth-subtitle">Crea un espacio de trabajo para tu tienda</p>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="reg-name">Nombre Comercial</label>
              <input 
                id="reg-name"
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="Ej. Tienda Alpha"
                pattern="^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$"
                title="El nombre no puede contener números ni símbolos"
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-domain">Dominio Único</label>
              <input 
                id="reg-domain"
                type="text" 
                value={domain} 
                onChange={e => setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} 
                required 
                placeholder="tiendaalpha"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="reg-email">Correo Electrónico (Admin)</label>
            <input 
              id="reg-email"
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="admin@tiendaalpha.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="reg-password">Contraseña Maestra</label>
            <input 
              id="reg-password"
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              minLength="6"
            />
          </div>
          
          <button type="submit" disabled={loading} className="w-full h-11 mt-2 text-sm font-semibold">
            {loading ? 'Creando tienda...' : 'Comenzar a usar BolClick'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500 font-medium">
          ¿Ya tienes cuenta?{' '}
          <span className="auth-link cursor-pointer hover:text-indigo-700 transition-colors" onClick={() => navigate('/login')}>
            Inicia sesión
          </span>
        </div>
      </div>
    </div>
  );
}
