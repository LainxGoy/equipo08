import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
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
import { ToastProvider } from './components/ToastContext';
import {
  Users, Package, ShoppingCart, LogOut, Tag, Archive,
  Store, ShieldCheck, UserPlus, BarChart2, Receipt, LayoutDashboard
} from 'lucide-react';
import './index.css';

/* ─── NAV ITEM ─────────────────────────────────────────────────── */
function NavItem({ to, icon: Icon, label, active }) {
  return (
    <Link to={to} className={`nav-link ${active ? 'active' : ''}`}>
      <Icon size={16} strokeWidth={1.75} />
      <span>{label}</span>
    </Link>
  );
}

/* ─── SIDEBAR ──────────────────────────────────────────────────── */
function Sidebar({ setAuthToken, permissions }) {
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
    <div className="sidebar">
      {/* ── Top scroll area ── */}
      <div className="flex flex-col gap-5 flex-1 overflow-y-auto p-4">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-1 pt-1">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-700 shadow-sm flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white leading-tight tracking-tight">BolClick</div>
            <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider leading-tight truncate">{tenantName}</div>
          </div>
        </div>

        {/* User chip */}
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-slate-900 border border-slate-800">
          <div className="user-avatar text-[11px]">{initials}</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-100 truncate leading-tight">{userName}</div>
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mt-0.5">{userRole}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5">

          {hasPerm('catalogo.ver') && (
            <NavItem to="/providers"   icon={Users}      label="Proveedores"        active={p === '/providers'} />
          )}
          {hasPerm('sucursales.ver') && (
            <NavItem to="/sucursales"  icon={Store}      label="Sucursales"         active={p === '/sucursales'} />
          )}
          {hasPerm('catalogo.ver') && (
            <NavItem to="/products"    icon={Tag}        label="Catálogo"           active={p === '/products'} />
          )}
          {hasPerm('sourcing.ver') && (
            <NavItem to="/sourcing"    icon={ShoppingCart} label="Entradas (Sourcing)" active={p === '/sourcing'} />
          )}

          <NavItem to="/sales" icon={Receipt} label="Facturación y Ventas" active={p === '/sales'} />

          {hasPerm('inventario.ver') && (
            <>
              <NavItem to="/stock"         icon={Archive}   label="Inventario Físico"   active={p === '/stock'} />
              <NavItem to="/audit-reports" icon={BarChart2} label="Auditoría"           active={p === '/audit-reports'} />
            </>
          )}

          {userRole === 'OWNER' && (
            <>
              <div className="h-px bg-slate-800 my-2" />
              <span className="nav-section-label">Administración</span>
              <NavItem to="/users"       icon={UserPlus}    label="Empleados"   active={p === '/users'} />
              <NavItem to="/permissions" icon={ShieldCheck} label="Permisos"    active={p === '/permissions'} />
            </>
          )}
        </nav>
      </div>

      {/* ── Logout ── */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 h-9 px-3 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 text-xs font-semibold transition-all duration-150"
        >
          <LogOut size={14} strokeWidth={2} />
          Cerrar Sesión
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

  useEffect(() => {
    if (authToken && localStorage.getItem('user_role') !== 'OWNER') {
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
            <Sidebar setAuthToken={setAuthToken} permissions={permissions} />
            <div className="main-content">
              <Routes>
                <Route path="/"              element={<DashboardHome />} />
                <Route path="/providers"     element={<ProvidersPage     key={authToken} />} />
                <Route path="/sucursales"    element={<SucursalesPage    key={authToken} />} />
                <Route path="/products"      element={<ProductsPage      key={authToken} />} />
                <Route path="/sourcing"      element={<SourcingPage      key={authToken} />} />
                <Route path="/sales"         element={<SalesPage         key={authToken} />} />
                <Route path="/stock"         element={<StockPage         key={authToken} />} />
                <Route path="/audit-reports" element={<AuditReportsPage  key={authToken} />} />
                <Route path="/users"         element={<UsersPage         key={authToken} />} />
                <Route path="/permissions"   element={<PermissionsPage   key={authToken} />} />
                <Route path="*"              element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        )}
      </Router>
    </ToastProvider>
  );
}

export default App;
