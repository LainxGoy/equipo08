import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api, { getBackendUrl } from './api';
import ProvidersPage from './pages/ProvidersPage';
import SourcingPage from './pages/SourcingPage';
import StockPage from './pages/StockPage';
import SalesPage from './pages/SalesPage';
import AuditReportsPage from './pages/AuditReportsPage';
import ProductsPage from './pages/ProductsPage';
import SucursalesPage from './pages/SucursalesPage';
import UsersPage from './pages/UsersPage';
import PermissionsPage from './pages/PermissionsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import AdminConsolePage from './pages/AdminConsolePage';
import SettingsPage from './pages/SettingsPage';
import PublicCatalogPage from './pages/PublicCatalogPage';
import DashboardPage from './pages/DashboardPage';
import PosPage from './pages/PosPage';
import { ToastProvider } from './components/ToastContext';
import {
  Users, Package, ShoppingCart, LogOut, Tag, Archive,
  Store, ShieldCheck, UserPlus, BarChart2, Receipt, LayoutDashboard,
  Menu, ChevronLeft, Settings as SettingsIcon, ShieldAlert, Sun, Moon, MonitorSmartphone
} from 'lucide-react';
import './index.css';

/* ─── PAGE TRANSITION ────────────────────────────────────────────── */
function PageTransition({ children }) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

/* ─── NAV ITEM ─────────────────────────────────────────────────── */
function NavItem({ to, icon: Icon, label, active, isOpen }) {
  return (
    <Link to={to} className={`nav-link ${active ? 'active' : ''} ${!isOpen ? 'justify-center px-0' : ''}`} title={!isOpen ? label : undefined}>
      <Icon size={22} strokeWidth={2} className="flex-shrink-0" />
      {isOpen && <span className="font-semibold text-[1.05rem] tracking-tight">{label}</span>}
    </Link>
  );
}

/* ─── SIDEBAR ──────────────────────────────────────────────────── */
function Sidebar({ setAuthToken, permissions, isOpen, setIsOpen }) {
  const location = useLocation();
  const tenantName = sessionStorage.getItem('tenant_name') || 'Mi Empresa';
  const tenantDomain = sessionStorage.getItem('tenant_domain') || tenantName.toLowerCase().replace(/\s+/g, '-');
  const userName   = sessionStorage.getItem('user_name')   || 'Usuario';
  const userRole   = sessionStorage.getItem('user_role')   || 'VENDEDOR';
  
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  const [logoUrl, setLogoUrl] = useState(sessionStorage.getItem('tenant_logo') || '');

  useEffect(() => {
    const handleUpdate = () => setLogoUrl(sessionStorage.getItem('tenant_logo') || '');
    window.addEventListener('tenant_logo_updated', handleUpdate);
    return () => window.removeEventListener('tenant_logo_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    sessionStorage.clear();
    setAuthToken(null);
  };

  const hasPerm = (key) => {
    if (userRole === 'OWNER') return true;
    if (!permissions) return false;
    const p = permissions.find(p => p.role === userRole);
    return p ? p[key.replace('.', '_')] : false;
  };

  const p = location.pathname;

  const initials = userName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`sidebar transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'w-[280px]' : 'w-[88px] items-center'}`}>
      
      {/* ── Top scroll area ── */}
      <div className={`flex flex-col gap-6 flex-1 overflow-y-auto w-full ${isOpen ? 'p-5' : 'py-5 px-3'}`}>

        {/* Toggle and User Chip Area */}
        <div className="flex flex-col gap-4">
          <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} pt-2`}>
            {isOpen && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="bg-transparent text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors flex-shrink-0"
                title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              >
                {theme === 'dark' ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
              </button>
            )}
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="bg-transparent text-white hover:bg-white/20 p-2 rounded-xl transition-colors flex-shrink-0"
              title={isOpen ? 'Ocultar menú' : 'Mostrar menú'}
            >
              {isOpen ? <ChevronLeft size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
            </button>
          </div>

          {/* User chip */}
          <div className={`flex items-center gap-3 ${isOpen ? 'px-4 py-3' : 'justify-center py-3 px-0'} rounded-2xl bg-black/10 border border-white/10 backdrop-blur-md shadow-inner`}>
            {logoUrl ? (
              <img src={getBackendUrl(logoUrl)} alt="Logo" className="w-10 h-10 rounded-xl object-cover bg-white flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-xl text-[13px] bg-slate-100 text-slate-900 font-black flex items-center justify-center flex-shrink-0">
                {initials}
              </div>
            )}
            {isOpen && (
              <div className="min-w-0 flex-1 animate-fadeIn">
                <div className="text-[0.95rem] font-extrabold text-white truncate leading-tight">{userName}</div>
                <div className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mt-1">{userRole}</div>
              </div>
            )}
          </div>
        </div>
        <nav className={`flex flex-col gap-2 mt-2 w-full ${!isOpen ? 'items-center' : ''}`}>

          {userRole !== 'SUPER_ADMIN' && (
            <NavItem to="/" icon={LayoutDashboard} label="Resumen" active={p === '/'} isOpen={isOpen} />
          )}

          {hasPerm('catalogo.ver') && (
            <NavItem to="/providers"   icon={Users}      label="Proveedores"        active={p === '/providers'} isOpen={isOpen} />
          )}
          {hasPerm('sucursales.ver') && (
            <NavItem to="/sucursales"  icon={Store}      label="Sucursales"         active={p === '/sucursales'} isOpen={isOpen} />
          )}
          {hasPerm('catalogo.ver') && (
            <NavItem to="/products"    icon={Tag}        label="Catálogo"           active={p === '/products'} isOpen={isOpen} />
          )}
          {hasPerm('sourcing.ver') && (
            <NavItem to="/sourcing"    icon={ShoppingCart} label="Lotes"            active={p === '/sourcing'} isOpen={isOpen} />
          )}

          {hasPerm('ventas.ver') && (
            <>
              <NavItem to="/sales" icon={Receipt} label="Ventas" active={p === '/sales'} isOpen={isOpen} />
              <Link
                to="/pos"
                className={`nav-link text-indigo-400 hover:text-indigo-300 ${!isOpen ? 'justify-center px-0' : ''}`}
                title={!isOpen ? 'Terminal POS' : undefined}
              >
                <MonitorSmartphone size={22} strokeWidth={2} className="flex-shrink-0" />
                {isOpen && <span className="font-semibold text-[1.05rem] tracking-tight">Terminal POS</span>}
              </Link>
            </>
          )}

          {hasPerm('inventario.ver') && (
            <>
              <NavItem to="/stock"         icon={Archive}   label="Inventario"          active={p === '/stock'} isOpen={isOpen} />
              <NavItem to="/audit-reports" icon={BarChart2} label="Auditoría"           active={p === '/audit-reports'} isOpen={isOpen} />
            </>
          )}

          {userRole === 'OWNER' && (
            <>
              <div className="h-px w-full bg-white/10 my-4" />
              {isOpen && <span className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400 px-4 mb-2 animate-fadeIn">Administración</span>}
              <NavItem to="/users"       icon={UserPlus}    label="Empleados"   active={p === '/users'} isOpen={isOpen} />
              <NavItem to="/permissions" icon={ShieldCheck} label="Permisos"    active={p === '/permissions'} isOpen={isOpen} />
              <NavItem to="/settings"    icon={SettingsIcon} label="Ajustes"    active={p === '/settings'} isOpen={isOpen} />
            </>
          )}

          {userRole === 'SUPER_ADMIN' && (
            <>
              <div className="h-px w-full bg-white/10 my-4" />
              {isOpen && <span className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400 px-4 mb-2 animate-fadeIn">Sistema Global</span>}
              <NavItem to="/admin-console" icon={ShieldAlert} label="Consola Global" active={p === '/admin-console'} isOpen={isOpen} />
            </>
          )}
        </nav>
      </div>

      {/* ── Tienda Online & Logout ── */}
      <div className={`p-5 w-full border-t border-white/10 flex flex-col gap-3 items-center`}>
        {userRole !== 'SUPER_ADMIN' && (
          <a 
            href={`/tienda/${tenantDomain}`}
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-3 h-12 rounded-xl text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 font-bold transition-all duration-200 ${isOpen ? 'w-full px-4' : 'w-12 px-0'}`}
            title={!isOpen ? 'Ir a Tienda Online' : undefined}
          >
            <Store size={20} strokeWidth={2.5} />
            {isOpen && <span>Tienda Online</span>}
          </a>
        )}
        <button
          onClick={handleLogout}
          className={`bg-transparent flex items-center justify-center gap-3 h-12 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 hover:shadow-md border border-transparent font-bold transition-all duration-200 ${isOpen ? 'w-full px-4' : 'w-12 px-0'}`}
          title={!isOpen ? 'Cerrar Sesión' : undefined}
        >
          <LogOut size={20} strokeWidth={2.5} />
          {isOpen && <span className="text-[1rem] tracking-tight">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}


/* ─── APP ROOT ──────────────────────────────────────────────────── */
function App() {
  const [authToken, setAuthToken] = useState(sessionStorage.getItem('access_token'));
  const [permissions, setPermissions] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [authError, setAuthError] = useState(null);
  const userRole = sessionStorage.getItem('user_role') || 'VENDEDOR';

  useEffect(() => {
    const handleAuthError = (e) => {
      setAuthError(e.detail.type);
    };
    window.addEventListener('auth_error', handleAuthError);
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, []);

  useEffect(() => {
    const role = sessionStorage.getItem('user_role');
    if (authToken && role !== 'OWNER' && role !== 'SUPER_ADMIN') {
      fetchPermissions();
    }
  }, [authToken]);

  const fetchPermissions = async () => {
    try {
      // 1. Obtener datos actualizados del usuario (ej: si le cambiaron la sucursal)
      try {
        const meRes = await api.get('/users/me');
        const currentSucursalId = sessionStorage.getItem('user_sucursal_id');
        
        // Si la sucursal cambió, actualizamos y recargamos para limpiar estado de componentes
        if (meRes.data.sucursal_id !== currentSucursalId && meRes.data.role !== 'OWNER' && meRes.data.role !== 'SUPER_ADMIN') {
          sessionStorage.setItem('user_sucursal_id', meRes.data.sucursal_id || '');
          sessionStorage.setItem('user_sucursal_name', meRes.data.sucursal_name || '');
          window.location.reload();
          return;
        }
      } catch(e) {
        // Ignorar si el endpoint falla (ej. versión antigua del backend)
      }

      // 2. Obtener permisos
      const res = await api.get('/users/permissions');
      setPermissions(res.data);
      
      const role = sessionStorage.getItem('user_role');
      const myPerms = res.data.find(p => p.role === role);
      if (myPerms) {
        sessionStorage.setItem('permissions', JSON.stringify(myPerms));
      }
    } catch (err) {
      console.error('Error fetching permissions', err);
    }
  };

  if (authError) {
    let msg = "Tu sesión ha expirado o hubo un problema de seguridad.";
    if (authError === 'BRANCH_CHANGED') msg = "Tu asignación de sucursal ha sido modificada por un administrador. Por favor, inicia sesión nuevamente para cargar el inventario de tu nueva sucursal.";
    if (authError === 'BRANCH_DISABLED') msg = "La sucursal actual ha sido desactivada. Por favor, inicia sesión nuevamente para cargar tu nueva sucursal.";
    if (authError === 'TENANT_BLOCKED') msg = "Tu tienda ha sido bloqueada por la administración central. Por favor, contacta a soporte.";
    if (authError === 'USER_DISABLED') msg = "Tu cuenta de usuario ha sido desactivada por un administrador.";

    return (
      <div className="fixed inset-0 bg-slate-900/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-slate-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 font-sans">Acceso Interrumpido</h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">{msg}</p>
          <button 
            onClick={() => {
              sessionStorage.clear();
              window.location.href = '/login';
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Ruta Pública Independiente (Sin Layout ni Autenticación Requerida) */}
          <Route path="/tienda/:domain" element={<PublicCatalogPage />} />
          
          {/* Rutas de la Aplicación */}
          <Route path="/*" element={
            !authToken ? (
              <Routes>
                <Route path="/"         element={<LandingPage />} />
                <Route path="/login"    element={<LoginPage    setAuthToken={setAuthToken} />} />
                <Route path="/register" element={<RegisterPage setAuthToken={setAuthToken} />} />
                <Route path="*"         element={<Navigate to="/" replace />} />
              </Routes>
            ) : (
              <Routes>
                <Route path="/pos" element={<PosPage key={authToken} />} />
                <Route path="/*" element={
                  <div className="app-layout">
                    <Sidebar setAuthToken={setAuthToken} permissions={permissions} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                    <div className={`main-content transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative`}>
                      <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                          <Route path="/"              element={<PageTransition>{userRole === 'SUPER_ADMIN' ? <Navigate to="/admin-console" replace /> : <DashboardPage key={authToken} />}</PageTransition>} />
                          <Route path="/providers"     element={<PageTransition><ProvidersPage     key={authToken} /></PageTransition>} />
                          <Route path="/sucursales"    element={<PageTransition><SucursalesPage    key={authToken} /></PageTransition>} />
                          <Route path="/products"      element={<PageTransition><ProductsPage      key={authToken} /></PageTransition>} />
                          <Route path="/sourcing"      element={<PageTransition><SourcingPage      key={authToken} /></PageTransition>} />
                          <Route path="/sales"         element={<PageTransition><SalesPage         key={authToken} /></PageTransition>} />
                          <Route path="/stock"         element={<PageTransition><StockPage         key={authToken} /></PageTransition>} />
                          <Route path="/audit-reports" element={<PageTransition><AuditReportsPage  key={authToken} /></PageTransition>} />
                          <Route path="/users"         element={<PageTransition><UsersPage         key={authToken} /></PageTransition>} />
                          <Route path="/permissions"   element={<PageTransition><PermissionsPage   key={authToken} /></PageTransition>} />
                          <Route path="/settings"      element={<PageTransition><SettingsPage      key={authToken} /></PageTransition>} />
                          <Route path="/admin-console" element={<PageTransition><AdminConsolePage  key={authToken} /></PageTransition>} />
                          <Route path="*"              element={<Navigate to="/" replace />} />
                        </Routes>
                      </AnimatePresence>
                    </div>
                  </div>
                } />
              </Routes>
            )
          } />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
