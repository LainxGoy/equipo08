import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MousePointerClick } from 'lucide-react';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Nunito:wght@700&display=swap');

  .lp * { box-sizing: border-box; margin: 0; padding: 0; }

  .lp {
    font-family: 'Roboto', Arial, sans-serif;
    background: #ffffff;
    color: #2d2d2d;
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* ── OVERHEADER ─────────────────────────────────────────── */
  .lp-overheader {
    background: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 32px;
    gap: 20px;
  }
  .lp-overheader a {
    font-size: 13px;
    color: #555;
    text-decoration: none;
    font-weight: 400;
  }
  .lp-overheader a:hover { color: #111; }
  .lp-overheader-sep { color: #ccc; font-size: 13px; }

  /* ── NAVBAR ─────────────────────────────────────────────── */
  .lp-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #ffffff;
    border-bottom: 1px solid #e0e0e0;
    height: 64px;
    display: flex;
    align-items: center;
  }
  .lp-nav-inner {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
  }
  .lp-logo {
    font-family: 'Nunito', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #2d2d2d;
    text-decoration: none;
    letter-spacing: -0.3px;
    flex-shrink: 0;
  }
  .lp-logo span { color: #0d1b2a; }
  .lp-nav-links {
    display: flex;
    align-items: center;
    gap: 28px;
  }
  .lp-nav-links a {
    font-size: 14px;
    font-weight: 500;
    color: #444;
    text-decoration: none;
  }
  .lp-nav-links a:hover { color: #0d1b2a; }
  .lp-nav-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }
  .lp-nav-link {
    font-size: 14px;
    color: #444;
    text-decoration: none;
    font-weight: 400;
  }
  .lp-nav-link:hover { color: #0d1b2a; }
  .lp-btn-orange {
    display: inline-block;
    background: #0d1b2a;
    color: #ffffff !important;
    font-size: 14px;
    font-weight: 700;
    padding: 10px 22px;
    border-radius: 4px;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    transition: background 0.15s;
  }
  .lp-btn-orange:hover { background: #1a2e42; }
  .lp-btn-orange-outline {
    display: inline-block;
    background: transparent;
    color: #0d1b2a !important;
    font-size: 14px;
    font-weight: 700;
    padding: 9px 20px;
    border-radius: 4px;
    border: 2px solid #0d1b2a;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    transition: all 0.15s;
  }
  .lp-btn-orange-outline:hover { background: #f0f4f8; }

  /* ── HERO ───────────────────────────────────────────────── */
  .lp-hero {
    background: #f1f8e9;
    padding: 56px 0 0;
    overflow: hidden;
  }
  .lp-hero-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: flex-end;
  }
  .lp-hero-text { padding-bottom: 56px; }
  .lp-hero h1 {
    font-size: 38px;
    font-weight: 700;
    line-height: 1.2;
    color: #1a1a1a;
    margin-bottom: 20px;
  }
  .lp-hero-desc {
    font-size: 15px;
    color: #444;
    line-height: 1.7;
    margin-bottom: 32px;
    max-width: 460px;
  }
  .lp-hero-actions {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .lp-hero-img {
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .lp-hero-img img {
    max-width: 100%;
    max-height: 380px;
    object-fit: contain;
    display: block;
  }

  /* ── EMPOWERING ─────────────────────────────────────────── */
  .lp-empowering {
    background: #ffffff;
    padding: 72px 0;
    border-bottom: 1px solid #e0e0e0;
  }
  .lp-empowering-inner {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 32px;
    text-align: center;
  }
  .lp-empowering h2 {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 16px;
    line-height: 1.3;
  }
  .lp-empowering p {
    font-size: 15px;
    color: #555;
    line-height: 1.7;
    margin-bottom: 10px;
  }
  .lp-emp-imgs {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }
  .lp-emp-img {
    border-radius: 8px;
    overflow: hidden;
    aspect-ratio: 1;
    background: #f5f5f5;
  }
  .lp-emp-img-inner {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: #999;
    flex-direction: column;
    gap: 6px;
  }
  .lp-emp-img-box {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    margin-bottom: 4px;
  }

  /* ── TOOLS SECTION ──────────────────────────────────────── */
  .lp-tools {
    background: #ffffff;
    padding: 72px 0;
    border-bottom: 1px solid #e0e0e0;
  }
  .lp-tools-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
  }
  .lp-tools h2 {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 32px;
    text-align: center;
  }
  .lp-tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid #e0e0e0;
    margin-bottom: 48px;
    flex-wrap: wrap;
  }
  .lp-tab {
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    color: #555;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .lp-tab:hover { color: #0d1b2a; }
  .lp-tab.active { color: #0d1b2a; border-bottom-color: #0d1b2a; }
  .lp-tool-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    align-items: center;
  }
  .lp-tool-img {
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    aspect-ratio: 4/3;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .lp-tool-visual {
    padding: 24px;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .lp-tool-text h3 {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 10px;
  }
  .lp-tool-text p {
    font-size: 15px;
    color: #555;
    margin-bottom: 16px;
    line-height: 1.65;
  }
  .lp-tool-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }
  .lp-tool-list li {
    font-size: 14px;
    color: #444;
    padding-left: 20px;
    position: relative;
    line-height: 1.5;
  }
  .lp-tool-list li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #0d1b2a;
  }
  .lp-tool-link {
    font-size: 14px;
    color: #f57c00;
    text-decoration: none;
    font-weight: 500;
  }
  .lp-tool-link:hover { text-decoration: underline; }

  /* VISUAL MOCKS */
  .lp-mock-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    padding: 8px 12px;
    background: #fff;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
    font-size: 12px;
    color: #333;
    margin-bottom: 6px;
  }
  .lp-mock-header {
    font-size: 11px;
    font-weight: 700;
    color: #999;
    text-transform: uppercase;
    padding: 6px 12px;
    letter-spacing: 0.06em;
  }
  .lp-mock-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .lp-mock-bar-label { font-size: 12px; color: #555; width: 80px; flex-shrink: 0; }
  .lp-mock-bar-track { flex: 1; height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden; }
  .lp-mock-bar-fill { height: 100%; border-radius: 3px; background: #4caf50; }
  .lp-mock-bar-fill.low { background: #f44336; }
  .lp-mock-bar-val { font-size: 12px; color: #666; width: 40px; text-align: right; flex-shrink: 0; }
  .lp-mock-total {
    margin-top: auto;
    background: #4caf50;
    color: white;
    border-radius: 4px;
    padding: 10px 14px;
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 600;
  }
  .lp-mock-kpi {
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 8px;
  }
  .lp-mock-kpi-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.05em; }
  .lp-mock-kpi-val { font-size: 20px; font-weight: 700; color: #1a1a1a; }

  /* ── STATS ──────────────────────────────────────────────── */
  .lp-stats {
    background: #f5f5f5;
    padding: 56px 0;
    border-bottom: 1px solid #e0e0e0;
  }
  .lp-stats-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 64px;
    flex-wrap: wrap;
  }
  .lp-stat { text-align: center; }
  .lp-stat-num {
    font-size: 36px;
    font-weight: 700;
    color: #0d1b2a;
    display: block;
    line-height: 1;
    margin-bottom: 6px;
  }
  .lp-stat-label { font-size: 14px; color: #555; }
  .lp-stat-sep { width: 1px; height: 56px; background: #ddd; }

  /* ── FREE SECTION ───────────────────────────────────────── */
  .lp-free {
    background: #ffffff;
    padding: 72px 0;
    border-bottom: 1px solid #e0e0e0;
  }
  .lp-free-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
    text-align: center;
  }
  .lp-free h2 {
    font-size: 30px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 16px;
  }
  .lp-free p {
    font-size: 16px;
    color: #555;
    margin-bottom: 36px;
    max-width: 560px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.7;
  }

  /* ── FOOTER ─────────────────────────────────────────────── */
  .lp-footer {
    background: #2d2d2d;
    padding: 40px 0;
    color: #aaa;
  }
  .lp-footer-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
  }
  .lp-footer-logo {
    font-family: 'Nunito', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    text-decoration: none;
  }
  .lp-footer-logo span { color: #4a9eed; }
  .lp-footer-links { display: flex; gap: 24px; flex-wrap: wrap; }
  .lp-footer-links a { font-size: 13px; color: #aaa; text-decoration: none; }
  .lp-footer-links a:hover { color: #fff; }
  .lp-tool-link { color: #0d1b2a !important; }
  .lp-footer-copy { font-size: 13px; color: #777; }

  /* ── FEATURE ROWS ───────────────────────────────────────── */
  .lp-feat-row {
    max-width: 1200px;
    margin: 0 auto;
    padding: 72px 32px;
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 80px;
    align-items: center;
  }
  .lp-feat-row.reverse {
    grid-template-columns: 1fr 1.5fr;
  }
  .lp-feat-img-el {
    width: 100%;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.10);
    display: block;
  }

  /* ── RESPONSIVE ─────────────────────────────────────────── */
  @media (max-width: 800px) {
    .lp-overheader { display: none; }
    .lp-nav-links { display: none; }
    .lp-hero-inner {
      display: flex;
      flex-direction: column;
      text-align: center;
      padding: 40px 20px 0;
      gap: 20px;
    }
    .lp-hero-text {
      padding-bottom: 20px;
    }
    .lp-hero h1 {
      font-size: 28px;
    }
    .lp-hero-desc {
      margin-left: auto;
      margin-right: auto;
      font-size: 14px;
    }
    .lp-hero-actions {
      justify-content: center;
    }
    .lp-hero-img {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    .lp-hero-img img {
      max-height: 240px;
      width: auto;
    }
    .lp-empowering-inner {
      padding: 40px 20px;
    }
    .lp-empowering h2 {
      font-size: 22px;
    }
    .lp-emp-imgs { display: none; }
    .lp-tool-content { grid-template-columns: 1fr; }
    .lp-tool-img { display: none; }
    .lp-tabs { gap: 0; overflow-x: auto; }
    .lp-stats-inner { gap: 32px; }
    .lp-stat-sep { display: none; }
    .lp-footer-inner { flex-direction: column; align-items: flex-start; gap: 16px; }

    /* Stack sections: text always on top, image on bottom */
    .lp-feat-row {
      display: flex;
      flex-direction: column-reverse;
      gap: 24px;
      padding: 48px 20px;
    }
    .lp-feat-row.reverse {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 48px 20px;
    }
    .lp-feat-row h3 {
      font-size: 22px;
      text-align: center;
    }
    .lp-feat-row p {
      text-align: center;
    }
    .lp-tool-list {
      align-items: flex-start;
      max-width: 320px;
      margin: 0 auto;
    }
  }

  @media (max-width: 500px) {
    .lp-nav-inner { padding: 0 16px; }
    .lp-nav-actions { gap: 8px; }
    .lp-nav-link { font-size: 13px; }
    .lp-btn-orange { padding: 8px 14px; font-size: 12px; }
    .lp-logo { font-size: 18px; }
  }
`;

const TABS = [
  {
    id: 'pos',
    label: 'Punto de Venta',
    title: 'Punto de Venta',
    subtitle: 'Registra ventas desde cualquier dispositivo con total facilidad',
    items: [
      'Recibos de venta impresos o digitales',
      'Aplica descuentos y emite reembolsos',
      'Funciona sin conexión a internet',
      'Registro rápido con búsqueda por nombre',
    ],
    visual: 'pos',
  },
  {
    id: 'inventory',
    label: 'Gestión de Inventario',
    title: 'Gestión de Inventario',
    subtitle: 'Nunca te quedes sin existencias',
    items: [
      'Seguimiento de stock en tiempo real',
      'Alertas automáticas de stock mínimo',
      'Transferencias entre sucursales',
      'Historial completo de movimientos',
    ],
    visual: 'inventory',
  },
  {
    id: 'analytics',
    label: 'Análisis de Ventas',
    title: 'Análisis de Ventas',
    subtitle: 'Toma decisiones basadas en datos reales de tu negocio',
    items: [
      'Reportes por día, producto y sucursal',
      'Ventas por empleado y turno',
      'Comparación entre períodos',
      'Exportación de datos',
    ],
    visual: 'analytics',
  },
  {
    id: 'employees',
    label: 'Gestión del Personal',
    title: 'Gestión del Personal',
    subtitle: 'Administra tu equipo y controla el acceso al sistema',
    items: [
      'Roles diferenciados: Dueño, Supervisor, Vendedor',
      'Cada rol accede solo a lo que necesita',
      'Registro de ventas por empleado',
      'Control de acceso por sucursal',
    ],
    visual: 'employees',
  },
  {
    id: 'multistore',
    label: 'Múltiples Tiendas',
    title: 'Gestiona Múltiples Sucursales',
    subtitle: 'Haz crecer tu negocio de una tienda a varias',
    items: [
      'Todas las sucursales desde una sola cuenta',
      'Stock centralizado o independiente por local',
      'Transferencias de mercadería entre tiendas',
      'Reportes comparativos por sucursal',
    ],
    visual: 'multistore',
  },
];

function ToolVisual({ type }) {
  if (type === 'pos') {
    return (
      <div className="lp-tool-visual">
        <div className="lp-mock-header">Venta en curso — 26 Oct 2024</div>
        {[
          { name: 'Harina 1kg', qty: '×3', price: 'Bs 24,00' },
          { name: 'Aceite 1L', qty: '×2', price: 'Bs 36,00' },
          { name: 'Arroz 5kg', qty: '×1', price: 'Bs 35,00' },
          { name: 'Refresco 1.5L', qty: '×1', price: 'Bs 12,00' },
        ].map(r => (
          <div key={r.name} className="lp-mock-row">
            <span>{r.name}</span>
            <span style={{ textAlign: 'center', color: '#888' }}>{r.qty}</span>
            <span style={{ textAlign: 'right', fontWeight: 600 }}>{r.price}</span>
          </div>
        ))}
        <div style={{ fontSize: 12, color: '#999', textAlign: 'right', padding: '4px 2px' }}>Descuento: − Bs 5,00</div>
        <div className="lp-mock-total">
          <span>Total a cobrar</span>
          <span>Bs 102,00</span>
        </div>
      </div>
    );
  }
  if (type === 'inventory') {
    return (
      <div className="lp-tool-visual">
        <div className="lp-mock-header">Stock actual</div>
        {[
          { label: 'Harina 1kg', pct: '82%', val: '82 u.', low: false },
          { label: 'Aceite 1L', pct: '60%', val: '60 u.', low: false },
          { label: 'Arroz 5kg', pct: '40%', val: '40 u.', low: false },
          { label: 'Azúcar 2kg', pct: '8%', val: '8 u.', low: true },
        ].map(b => (
          <div key={b.label} className="lp-mock-bar">
            <span className="lp-mock-bar-label" style={b.low ? { color: '#f44336' } : {}}>{b.label}</span>
            <div className="lp-mock-bar-track">
              <div className={`lp-mock-bar-fill${b.low ? ' low' : ''}`} style={{ width: b.pct }} />
            </div>
            <span className="lp-mock-bar-val" style={b.low ? { color: '#f44336' } : {}}>{b.val}</span>
          </div>
        ))}
        <div style={{ fontSize: 12, color: '#f44336', background: '#ffebee', padding: '8px 12px', borderRadius: 4, border: '1px solid #ffcdd2', marginTop: 4 }}>
          Stock bajo en Azúcar 2kg — mínimo: 20 u.
        </div>
      </div>
    );
  }
  if (type === 'analytics') {
    return (
      <div className="lp-tool-visual">
        <div className="lp-mock-header">Resumen semanal</div>
        <div className="lp-mock-kpi"><div className="lp-mock-kpi-label">Ventas hoy</div><div className="lp-mock-kpi-val">Bs 4.280</div></div>
        <div className="lp-mock-kpi"><div className="lp-mock-kpi-label">Transacciones</div><div className="lp-mock-kpi-val">38</div></div>
        <div className="lp-mock-kpi"><div className="lp-mock-kpi-label">Utilidad neta</div><div className="lp-mock-kpi-val">Bs 1.712</div></div>
      </div>
    );
  }
  if (type === 'employees') {
    return (
      <div className="lp-tool-visual">
        <div className="lp-mock-header">Equipo de trabajo</div>
        {[
          { name: 'Carlos M.', role: 'Dueño', sales: 'Bs 4.200' },
          { name: 'Ana L.', role: 'Vendedora', sales: 'Bs 2.850' },
          { name: 'Pedro S.', role: 'Vendedor', sales: 'Bs 1.430' },
        ].map(e => (
          <div key={e.name} className="lp-mock-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <span style={{ fontWeight: 500 }}>{e.name}</span>
            <span style={{ color: '#888', textAlign: 'center' }}>{e.role}</span>
            <span style={{ textAlign: 'right', fontWeight: 600 }}>{e.sales}</span>
          </div>
        ))}
      </div>
    );
  }
  if (type === 'multistore') {
    return (
      <div className="lp-tool-visual">
        <div className="lp-mock-header">Mis sucursales</div>
        {[
          { name: 'Sucursal Central', status: 'Activa', sales: 'Bs 4.200' },
          { name: 'Sucursal Norte', status: 'Activa', sales: 'Bs 2.100' },
          { name: 'Sucursal Sur', status: 'Activa', sales: 'Bs 1.800' },
        ].map(s => (
          <div key={s.name} className="lp-mock-row" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
            <span style={{ fontWeight: 500 }}>{s.name}</span>
            <span style={{ color: '#4caf50', textAlign: 'center' }}>{s.status}</span>
            <span style={{ textAlign: 'right', fontWeight: 600 }}>{s.sales}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('pos');
  const tab = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <>
      <style>{styles}</style>
      <div className="lp">


        {/* NAV */}
        <nav className="lp-nav">
          <div className="lp-nav-inner">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                fontSize: 24, fontWeight: 900, color: '#0f172a',
                fontFamily: "'Nunito', sans-serif", letterSpacing: '-0.5px'
              }}>
                BolCl
                <MousePointerClick size={24} strokeWidth={2.5} style={{ color: '#0f172a', margin: '0 1px' }} />
                ck
              </span>
            </Link>
            <div className="lp-nav-links">
              <a href="#herramientas">Características</a>
              <a href="#ayuda">Ayuda</a>
            </div>
            <div className="lp-nav-actions">
              <Link to="/login" className="lp-nav-link">Iniciar Sesión</Link>
              <Link to="/register" className="lp-btn-orange">Comenzar</Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <div className="lp-hero-text">
              <h1>Punto de venta gratuito y Gestión de Inventario</h1>
              <p className="lp-hero-desc">
                Convierte tu computadora o celular en un potente sistema de ventas. Gestiona las ventas,
                el inventario y a los empleados con total facilidad. Aunque tengas una o múltiples
                sucursales, nuestras herramientas cubrirán toda necesidad de tu negocio.
              </p>
              <div className="lp-hero-actions">
                <Link to="/register" className="lp-btn-orange">Comenzar</Link>
                <Link to="/login" className="lp-btn-orange-outline">Iniciar Sesión</Link>
              </div>
            </div>
            <div className="lp-hero-img">
              <img src="/dashboard-hero.png" alt="Sistema POS BolClick - Dashboard" />
            </div>
          </div>
        </section>

        {/* EMPOWERING */}
        <section className="lp-empowering">
          <div className="lp-empowering-inner">
            <h2>Potenciando negocios en Bolivia con nuestro sistema POS</h2>
            <p>Cientos de comercios en Bolivia ya gestionan sus ventas e inventario con BolClick.</p>
            <p>Diseñado para tiendas, abarrotes, ferreterías, farmacias y negocios de todo tipo.</p>
          </div>
        </section>

        {/* FEATURES EXPANDIDAS */}
        <section style={{ background: '#fff', borderBottom: '1px solid #e0e0e0' }} id="herramientas">

          {/* 1 POS imagen izq texto der */}
          <div className="lp-feat-row">
            <img src="/feat-pos.png" alt="Punto de Venta BolClick" className="lp-feat-img-el" />
            <div className="lp-tool-text">
              <h3>Punto de Venta</h3>
              <p>Registra ventas desde cualquier dispositivo — computadora, tablet o celular Android — con total facilidad.</p>
              <ul className="lp-tool-list">
                <li>Recibos de venta impresos o digitales</li>
                <li>Aplica descuentos y emite reembolsos</li>
                <li>Funciona sin conexión a internet</li>
                <li>Registro rápido con búsqueda por nombre</li>
              </ul>
            </div>
          </div>

          {/* 2 INVENTARIO texto izq imagen der */}
          <div style={{ background: '#f9f9f9', borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>
            <div className="lp-feat-row reverse">
              <div className="lp-tool-text">
                <h3>Gestión de Inventario</h3>
                <p>Nunca te quedes sin existencias. Seguimiento en tiempo real de cada producto en cada sucursal.</p>
                <ul className="lp-tool-list">
                  <li>Seguimiento de stock en tiempo real</li>
                  <li>Alertas automáticas de stock mínimo</li>
                  <li>Transferencias entre sucursales</li>
                  <li>Historial completo de movimientos</li>
                </ul>
              </div>
              <img src="/feat-inventory.png" alt="Inventario BolClick" className="lp-feat-img-el" />
            </div>
          </div>

          {/* 3 ANÁLISIS imagen izq texto der */}
          <div className="lp-feat-row">
            <img src="/feat-analytics.png" alt="Análisis de Ventas BolClick" className="lp-feat-img-el" />
            <div className="lp-tool-text">
              <h3>Análisis de Ventas</h3>
              <p>Toma decisiones basadas en datos reales. Accede a tus reportes desde cualquier dispositivo.</p>
              <ul className="lp-tool-list">
                <li>Reportes por día, producto y sucursal</li>
                <li>Ventas por empleado y turno</li>
                <li>Comparación entre períodos</li>
                <li>Exportación de datos</li>
              </ul>
            </div>
          </div>

          {/* 4 PERSONAL texto izq imagen der */}
          <div style={{ background: '#f9f9f9', borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>
            <div className="lp-feat-row reverse">
              <div className="lp-tool-text">
                <h3>Gestión del Personal</h3>
                <p>Administra tu equipo con roles diferenciados. Cada empleado accede solo a lo que necesita.</p>
                <ul className="lp-tool-list">
                  <li>Roles: Administrador, Supervisor, Vendedor</li>
                  <li>Acceso por sucursal y módulo</li>
                  <li>Registro de ventas por empleado</li>
                  <li>Control de acceso seguro</li>
                </ul>
              </div>
              <img src="/feat-employees.png" alt="Personal BolClick" className="lp-feat-img-el" />
            </div>
          </div>

          {/* 5 MULTISUCURSAL imagen izq texto der */}
          <div className="lp-feat-row">
            <img src="/feat-multistore.png" alt="Sucursales BolClick" className="lp-feat-img-el" />
            <div className="lp-tool-text">
              <h3>Gestiona Múltiples Sucursales</h3>
              <p>Haz crecer tu negocio de una tienda a varias, todo desde una sola cuenta.</p>
              <ul className="lp-tool-list">
                <li>Todas las sucursales desde una cuenta</li>
                <li>Stock centralizado o independiente</li>
                <li>Transferencias entre tiendas</li>
                <li>Reportes comparativos por sucursal</li>
              </ul>
            </div>
          </div>

        </section>

        {/* STATS */}
        <section className="lp-stats">
          <div className="lp-stats-inner">
            <div className="lp-stat">
              <span className="lp-stat-num">Multi-sucursal</span>
              <span className="lp-stat-label">gestión centralizada</span>
            </div>
            <div className="lp-stat-sep" />
            <div className="lp-stat">
              <span className="lp-stat-num">Tiempo real</span>
              <span className="lp-stat-label">stock sincronizado</span>
            </div>
            <div className="lp-stat-sep" />
            <div className="lp-stat">
              <span className="lp-stat-num">100% Web</span>
              <span className="lp-stat-label">sin instalaciones</span>
            </div>
            <div className="lp-stat-sep" />
            <div className="lp-stat">
              <span className="lp-stat-num">En Bolivianos</span>
              <span className="lp-stat-label">hecho para Bolivia</span>
            </div>
          </div>
        </section>

        {/* FREE CTA */}
        <section className="lp-free" id="precios">
          <div className="lp-free-inner">
            <h2>Empieza a usar BolClick hoy, es gratis</h2>
            <p>
              Regista tu tienda en minutos. Sin tarjeta de crédito, sin compromisos.
              Comienza a vender y controlar tu inventario desde el primer día.
            </p>
            <Link to="/register" className="lp-btn-orange" style={{ fontSize: 15, padding: '12px 32px' }}>
              Comenzar ahora
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer" id="ayuda">
          <div className="lp-footer-inner">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                fontSize: 20, fontWeight: 900, color: '#ffffff',
                fontFamily: "'Nunito', sans-serif", letterSpacing: '-0.5px'
              }}>
                BolCl
                <MousePointerClick size={20} strokeWidth={2.5} style={{ color: '#ffffff', margin: '0 1px' }} />
                ck
              </span>
            </Link>
            <div className="lp-footer-links">
              <a href="#herramientas">Características</a>
              <Link to="/login">Iniciar Sesión</Link>
              <Link to="/register">Registrarse</Link>
            </div>
            <span className="lp-footer-copy">© {new Date().getFullYear()} BolClick. Hecho en Bolivia.</span>
          </div>
        </footer>

      </div>
    </>
  );
}
