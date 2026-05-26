import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api from './api';
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
import { ToastProvider } from './components/ToastContext';
import {
  Users, Package, ShoppingCart, LogOut, Tag, Archive,
  Store, ShieldCheck, UserPlus, BarChart2, Receipt, LayoutDashboard,
  Menu, ChevronLeft, Settings as SettingsIcon, ShieldAlert
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
  const tenantName = localStorage.getItem('tenant_name') || 'Mi Empresa';
  const userName   = localStorage.getItem('user_name')   || 'Usuario';
  const userRole   = localStorage.getItem('user_role')   || 'VENDEDOR';

  const handleLogout = () => {
    localStorage.clear();
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
          <div className={`flex items-center ${isOpen ? 'justify-end' : 'justify-center'} pt-2`}>
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors flex-shrink-0"
              title={isOpen ? 'Ocultar menú' : 'Mostrar menú'}
            >
              {isOpen ? <ChevronLeft size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
            </button>
          </div>

          {/* User chip */}
          <div className={`flex items-center gap-3 ${isOpen ? 'px-4 py-3' : 'justify-center py-3 px-0'} rounded-2xl bg-black/10 border border-white/10 backdrop-blur-md shadow-inner`}>
            <div className="user-avatar text-[13px] bg-gradient-to-br from-white to-sky-50 text-[#184e77] font-black border-none shadow-sm flex-shrink-0">{initials}</div>
            {isOpen && (
              <div className="min-w-0 flex-1 animate-fadeIn">
                <div className="text-[0.95rem] font-extrabold text-white truncate leading-tight">{userName}</div>
                <div className="text-[0.65rem] font-black text-sky-300 uppercase tracking-widest mt-1">{userRole}</div>
              </div>
            )}
          </div>
        </div>
        <nav className={`flex flex-col gap-2 mt-2 w-full ${!isOpen ? 'items-center' : ''}`}>

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
            <NavItem to="/sourcing"    icon={ShoppingCart} label="Sourcing"         active={p === '/sourcing'} isOpen={isOpen} />
          )}

          <NavItem to="/sales" icon={Receipt} label="Facturación / POS" active={p === '/sales'} isOpen={isOpen} />

          {hasPerm('inventario.ver') && (
            <>
              <NavItem to="/stock"         icon={Archive}   label="Inventario"          active={p === '/stock'} isOpen={isOpen} />
              <NavItem to="/audit-reports" icon={BarChart2} label="Auditoría"           active={p === '/audit-reports'} isOpen={isOpen} />
            </>
          )}

          {userRole === 'OWNER' && (
            <>
              <div className="h-px w-full bg-white/10 my-4" />
              {isOpen && <span className="text-[0.65rem] font-black uppercase tracking-widest text-sky-300 px-4 mb-2 animate-fadeIn">Administración</span>}
              <NavItem to="/users"       icon={UserPlus}    label="Empleados"   active={p === '/users'} isOpen={isOpen} />
              <NavItem to="/permissions" icon={ShieldCheck} label="Permisos"    active={p === '/permissions'} isOpen={isOpen} />
              <NavItem to="/settings"    icon={SettingsIcon} label="Ajustes"    active={p === '/settings'} isOpen={isOpen} />
            </>
          )}

          {userRole === 'SUPER_ADMIN' && (
            <>
              <div className="h-px w-full bg-white/10 my-4" />
              {isOpen && <span className="text-[0.65rem] font-black uppercase tracking-widest text-rose-300 px-4 mb-2 animate-fadeIn">Sistema Global</span>}
              <NavItem to="/admin-console" icon={ShieldAlert} label="Consola Global" active={p === '/admin-console'} isOpen={isOpen} />
            </>
          )}
        </nav>
      </div>

      {/* ── Logout ── */}
      <div className={`p-5 w-full border-t border-white/10 flex justify-center`}>
        <button
          onClick={handleLogout}
          className={`flex items-center justify-center gap-3 h-12 rounded-xl text-sky-100 hover:text-white hover:bg-white/10 hover:shadow-md border border-transparent font-bold transition-all duration-200 ${isOpen ? 'w-full px-4' : 'w-12 px-0'}`}
          title={!isOpen ? 'Cerrar Sesión' : undefined}
        >
          <LogOut size={20} strokeWidth={2.5} />
          {isOpen && <span className="text-[1rem] tracking-tight">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}

/* ─── DASHBOARD HOME ────────────────────────────────────────────── */
function DashboardHome() {
  const userName = localStorage.getItem('user_name') || 'Usuario';
  const userRole = localStorage.getItem('user_role') || 'VENDEDOR';

  return (
    <div className="max-w-xl mx-auto mt-16">
      <div className="card text-center p-10">
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-5">
          <LayoutDashboard size={22} className="text-blue-600" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-1.5 tracking-tight">Panel de Control</h1>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
          Bienvenido, <span className="font-semibold text-slate-800">{userName}</span>.<br />
          Usa la barra lateral para navegar entre los módulos del sistema.
        </p>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 uppercase tracking-wider">
          Rol: {userRole}
        </span>
      </div>
    </div>
  );
}

/* ─── APP ROOT ──────────────────────────────────────────────────── */
function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('access_token'));
  const [permissions, setPermissions] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (authToken && role !== 'OWNER' && role !== 'SUPER_ADMIN') {
      fetchPermissions();
    }
  }, [authToken]);

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/users/permissions');
      setPermissions(res.data);
    } catch (err) {
      console.error('Error fetching permissions', err);
    }
  };

  return (
    <ToastProvider>
      <Router>
        {!authToken ? (
          <Routes>
            <Route path="/"         element={<LandingPage />} />
            <Route path="/login"    element={<LoginPage    setAuthToken={setAuthToken} />} />
            <Route path="/register" element={<RegisterPage setAuthToken={setAuthToken} />} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <div className="app-layout">
            <Sidebar setAuthToken={setAuthToken} permissions={permissions} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className={`main-content transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative`}>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/"              element={<PageTransition><DashboardHome /></PageTransition>} />
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
        )}
      </Router>
    </ToastProvider>
  );
}

export default App;
