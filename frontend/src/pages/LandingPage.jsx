import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, AlertTriangle,
  Package2, ShoppingBag, Users2, Shield, BarChart3,
  Search, TrendingUp, Bell, ChevronRight, ClipboardList
} from 'lucide-react';

/* ─── hook ──────────────────────────────────────────────────────── */
function useInView(t = 0.1) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); ob.disconnect(); } }, { threshold: t });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return [ref, v];
}

/* ─── Marquee ───────────────────────────────────────────────────── */
const TICKER = ['Inventario', '·', 'Facturación POS', '·', 'Sourcing', '·', 'Multi-Sucursal', '·', 'Auditoría', '·', 'Empleados', '·'];
function Marquee() {
  const items = [...TICKER, ...TICKER];
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 0', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', gap: 40, animation: 'marqueeScroll 24s linear infinite', width: 'max-content' }}>
        {items.map((t, i) => (
          <span key={i} style={{ fontSize: 12, fontWeight: 700, color: t === '·' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── 3D Browser Frame ──────────────────────────────────────────── */
function BrowserFrame({ children, tiltY = 0, tiltX = 2, delay = 0, style = {} }) {
  const [ref, vis] = useInView(0.05);
  return (
    <div ref={ref} style={{ perspective: '1400px', ...style }}>
      <div style={{
        transform: vis ? `rotateY(${tiltY}deg) rotateX(${tiltX}deg)` : `rotateY(${tiltY * 1.8}deg) rotateX(${tiltX * 2}deg) translateY(24px)`,
        opacity: vis ? 1 : 0,
        transition: `transform 1.4s cubic-bezier(0.16,1,0.3,1) ${delay}s, opacity 0.9s ease ${delay}s`,
        borderRadius: 14, overflow: 'hidden',
        background: '#0d1e2e',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 48px 96px -24px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}>
        {/* chrome bar */}
        <div style={{ background: '#08131e', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {['#ff5f57', '#ffbd2e', '#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 7, padding: '3px 20px', fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'rgba(255,255,255,0.12)' }}>🔒</span> bolclick.app
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {['─', '□', '✕'].map(s => <span key={s} style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', cursor: 'pointer' }}>{s}</span>)}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Sidebar strip (reusable) ─────────────────────────────────── */
function AppSidebar({ active = 0 }) {
  const items = [Package2, ShoppingBag, BarChart3, Users2, Shield, Bell];
  return (
    <div style={{ width: 56, background: 'linear-gradient(180deg,#0a1624 0%,#184e77 100%)', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0', gap: 4, flexShrink: 0 }}>
      {/* logo */}
      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, flexShrink: 0 }}>
        <div style={{ width: 16, height: 16, borderRadius: 4, background: 'white', opacity: 0.9 }} />
      </div>
      {items.map((Icon, i) => (
        <div key={i} style={{ width: 40, height: 36, borderRadius: 9, background: i === active ? 'rgba(255,255,255,0.18)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderLeft: i === active ? '3px solid #38bdf8' : '3px solid transparent' }}>
          <Icon size={15} color={i === active ? 'white' : 'rgba(255,255,255,0.28)'} />
        </div>
      ))}
      {/* user at bottom */}
      <div style={{ marginTop: 'auto', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.7)' }}>JD</span>
      </div>
    </div>
  );
}

/* ─── Page header bar ──────────────────────────────────────────── */
function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{ background: 'linear-gradient(90deg,#0a1624,#184e77)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 900, color: 'white', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontWeight: 500 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

/* ─── DASHBOARD SCREENSHOT ──────────────────────────────────────── */
function DashboardScreen() {
  const bars = [32, 48, 38, 62, 52, 74, 88, 70, 95];
  const sales = [
    { prod: 'Coca-Cola 3L × 6u', loc: 'Suc. Central', amt: 'Bs 120', t: '2m', up: true },
    { prod: 'Arroz Premium 5kg', loc: 'Suc. Norte', amt: 'Bs 85', t: '8m', up: true },
    { prod: 'Aceite Fino 1L × 2', loc: 'Suc. Central', amt: 'Bs 56', t: '14m', up: true },
    { prod: 'Lavandina 2kg × 3', loc: 'Suc. Sur', amt: 'Bs 72', t: '21m', up: true },
  ];
  return (
    <div style={{ display: 'flex', height: 420, overflow: 'hidden' }}>
      <AppSidebar active={0} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#eef2f6' }}>
        <PageHeader title="Panel Principal" subtitle="Vista consolidada — todas las sucursales">
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 10px', fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={10} /> Exportar
            </div>
          </div>
        </PageHeader>
        <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { l: 'Ventas Hoy', v: 'Bs 4,820', d: '+18% vs ayer', c: '#34d399', bg: '#ecfdf5', border: '#a7f3d0' },
              { l: 'Stock Activo', v: '1,247 u.', d: '3 alertas activas', c: '#60a5fa', bg: '#eff6ff', border: '#bfdbfe' },
              { l: 'Facturas Emitidas', v: '43', d: 'hoy', c: '#8b5cf6', bg: '#faf5ff', border: '#ddd6fe' },
              { l: 'Pérdida Estimada', v: 'Bs 320', d: 'mes en curso', c: '#f87171', bg: '#fff1f2', border: '#fecdd3' },
            ].map(({ l, v, d, c, bg, border }) => (
              <div key={l} style={{ background: bg, borderRadius: 12, padding: '11px 13px', border: `1px solid ${border}` }}>
                <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{l}</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: c, fontFamily: 'Outfit, sans-serif', lineHeight: 1, marginBottom: 3 }}>{v}</div>
                <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 500 }}>{d}</div>
              </div>
            ))}
          </div>
          {/* chart + recent */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 10, flex: 1, overflow: 'hidden', minHeight: 0 }}>
            {/* chart */}
            <div style={{ background: 'white', borderRadius: 12, padding: '12px 14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>Ventas — últimos 9 días</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>Todas las sucursales</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['7d', '30d', '90d'].map((t, i) => (
                    <span key={t} style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: i === 0 ? '#184e77' : '#f1f5f9', color: i === 0 ? 'white' : '#94a3b8', cursor: 'pointer' }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 5, minHeight: 0 }}>
                {bars.map((h, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${h}%`, background: i === bars.length - 1 ? 'linear-gradient(to top,#184e77,#38bdf8)' : 'linear-gradient(to top,#e0f2fe,#7dd3fc)', borderRadius: '5px 5px 3px 3px', transition: 'height 0.5s' }} />
                    <span style={{ fontSize: 7, color: '#cbd5e1', fontWeight: 600 }}>{['L','M','X','J','V','S','D','L','H'][i]}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* recent sales */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#0f172a' }}>Últimas Ventas</span>
                <span style={{ fontSize: 9, color: '#184e77', fontWeight: 700, cursor: 'pointer' }}>Ver todas →</span>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {sales.map(({ prod, loc, amt, t }) => (
                  <div key={prod} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#34d399', display: 'inline-block', flexShrink: 0 }} /> {loc} · hace {t}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#059669', fontFamily: 'Outfit, sans-serif', marginLeft: 8, flexShrink: 0 }}>{amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── INVENTORY SCREENSHOT ──────────────────────────────────────── */
function InventoryScreen() {
  const rows = [
    { sku: 'COC-3L', name: 'Coca-Cola 3L', cat: 'Bebidas', stock: 48, min: 20, cost: '12.00', val: '576.00', ok: true },
    { sku: 'ARR-5K', name: 'Arroz Premium 5kg', cat: 'Granos', stock: 7, min: 15, cost: '17.00', val: '119.00', ok: false },
    { sku: 'ACE-1L', name: 'Aceite Fino 1L', cat: 'Aceites', stock: 33, min: 10, cost: '14.00', val: '462.00', ok: true },
    { sku: 'LAV-2K', name: 'Lavandina 2kg', cat: 'Limpieza', stock: 4, min: 12, cost: '20.00', val: '80.00', ok: false },
    { sku: 'PAN-KG', name: 'Pan de molde', cat: 'Panadería', stock: 22, min: 10, cost: '18.50', val: '407.00', ok: true },
  ];
  return (
    <div style={{ display: 'flex', height: 420, overflow: 'hidden' }}>
      <AppSidebar active={2} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#eef2f6' }}>
        <PageHeader title="Inventario y Valuación Física" subtitle="Control de stock por centro de costos">
          <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 10px', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Search size={9} /> Filtrar
            </div>
          </div>
        </PageHeader>
        {/* alert */}
        <div style={{ background: 'linear-gradient(90deg,#be123c,#e11d48)', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <AlertTriangle size={12} color="white" />
          <span style={{ fontSize: 10, fontWeight: 800, color: 'white', letterSpacing: '0.01em' }}>2 productos bajo el stock mínimo — requieren reposición</span>
        </div>
        {/* KPI mini strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, padding: '12px 16px', flexShrink: 0 }}>
          {[
            { l: 'Valuación Total', v: 'Bs 1,644', c: '#184e77', bg: '#eff6ff', border: '#bfdbfe' },
            { l: 'Pérdida Acumulada', v: 'Bs 320', c: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
            { l: 'Alertas Activas', v: '2', c: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          ].map(({ l, v, c, bg, border }) => (
            <div key={l} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '8px 12px' }}>
              <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: c, fontFamily: 'Outfit, sans-serif' }}>{v}</div>
            </div>
          ))}
        </div>
        {/* table */}
        <div style={{ flex: 1, overflow: 'hidden', background: 'white', margin: '0 16px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1.6fr 0.8fr 50px 45px 65px 65px 60px', padding: '8px 14px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            {['SKU', 'Producto', 'Categoría', 'Stock', 'Mín', 'Costo U.', 'Valuación', 'Acción'].map(h => (
              <span key={h} style={{ fontSize: 8, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
            ))}
          </div>
          {rows.map(r => (
            <div key={r.sku} style={{ display: 'grid', gridTemplateColumns: '70px 1.6fr 0.8fr 50px 45px 65px 65px 60px', padding: '9px 14px', borderBottom: '1px solid #f8fafc', background: r.ok ? 'white' : 'rgba(254,202,202,0.12)', alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '2px 5px', borderRadius: 4, display: 'inline-block' }}>{r.sku}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {!r.ok && <AlertTriangle size={9} color="#e11d48" />}
                <span style={{ fontSize: 10, fontWeight: 700, color: '#0f172a' }}>{r.name}</span>
              </div>
              <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, background: '#f8fafc', padding: '2px 6px', borderRadius: 5, display: 'inline-block' }}>{r.cat}</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: r.ok ? '#0f172a' : '#e11d48', fontFamily: 'Outfit, sans-serif' }}>{r.stock}</span>
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{r.min}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>Bs {r.cost}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#184e77' }}>Bs {r.val}</span>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 7px', fontSize: 8, fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
                <ClipboardList size={8} /> Auditar
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── POS SCREENSHOT ────────────────────────────────────────────── */
function POSScreen() {
  const products = [
    { n: 'Coca-Cola 3L', sku: 'COC-3L', price: 'Bs 20' },
    { n: 'Arroz 5kg', sku: 'ARR-5K', price: 'Bs 85' },
    { n: 'Aceite 1L', sku: 'ACE-1L', price: 'Bs 28' },
    { n: 'Lavandina', sku: 'LAV-2K', price: 'Bs 20' },
  ];
  const cart = [
    { n: 'Coca-Cola 3L', q: 2, u: 'Bs 20', t: 'Bs 40' },
    { n: 'Arroz Premium 5kg', q: 1, u: 'Bs 85', t: 'Bs 85' },
    { n: 'Aceite Fino 1L', q: 3, u: 'Bs 28', t: 'Bs 84' },
  ];
  return (
    <div style={{ display: 'flex', height: 420, overflow: 'hidden' }}>
      <AppSidebar active={1} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#eef2f6' }}>
        <PageHeader title="Facturación / Punto de Venta" subtitle="Turno: Juan Díaz · Suc. Central">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 0 3px rgba(52,211,153,0.25)' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>En línea</span>
          </div>
        </PageHeader>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 16px', overflow: 'hidden', minHeight: 0 }}>
          {/* Left: product catalog */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', minHeight: 0 }}>
            {/* search */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <Search size={11} color="#94a3b8" />
              <span style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 500 }}>Buscar por nombre o SKU...</span>
            </div>
            {/* product grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, overflow: 'hidden' }}>
              {products.map(({ n, sku, price }) => (
                <div key={sku} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 11px', cursor: 'pointer' }}>
                  <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#94a3b8', fontWeight: 700, marginBottom: 4, background: '#f8fafc', display: 'inline-block', padding: '1px 5px', borderRadius: 4 }}>{sku}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', marginBottom: 6, lineHeight: 1.2 }}>{n}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#184e77', fontFamily: 'Outfit, sans-serif' }}>{price}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Right: cart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', minHeight: 0 }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#0f172a' }}>Carrito actual</span>
                <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>3 ítems</span>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {cart.map(({ n, q, u, t }) => (
                  <div key={n} style={{ padding: '8px 12px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>{u} × {q}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#0f172a', fontFamily: 'Outfit, sans-serif', marginLeft: 8, flexShrink: 0 }}>{t}</span>
                  </div>
                ))}
              </div>
              {/* total section */}
              <div style={{ borderTop: '2px dashed #f1f5f9', padding: '10px 12px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Subtotal</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#0f172a' }}>Bs 209</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Descuento</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#059669' }}>- Bs 0</span>
                </div>
                <div style={{ background: 'linear-gradient(135deg,#0a1624,#184e77)', borderRadius: 9, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Total a Cobrar</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#34d399', fontFamily: 'Outfit, sans-serif', lineHeight: 1.1 }}>Bs 209</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 14px', fontSize: 10, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Cobrar <ChevronRight size={10} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Feature row ───────────────────────────────────────────────── */
function FeatureRow({ number, title, desc, tags = [] }) {
  const [ref, vis] = useInView(0.15);
  return (
    <div ref={ref} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', gap: 40, alignItems: 'start', padding: '40px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(16px)', transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.12)', fontFamily: 'Outfit, sans-serif', paddingTop: 4 }}>{number}</div>
      <div>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: 'white', margin: '0 0 10px', lineHeight: 1.1 }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7, margin: 0, maxWidth: 340 }}>{desc}</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, paddingTop: 4 }}>
        {tags.map(t => (
          <span key={t} style={{ fontSize: 10, fontWeight: 700, padding: '5px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.07)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── PAGE ──────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#0a1624', color: '#0f172a', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'rgba(10,22,36,0.97)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none', transition: 'all 0.4s ease', padding: '0 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#184e77,#1e6091)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" alt="" style={{ width: 20, objectFit: 'contain' }} />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 18, color: 'white', letterSpacing: '-0.03em' }}>BolClick</span>
          </div>
          <div style={{ display: 'flex', gap: 36 }}>
            {['Módulos', 'Precios', 'Ayuda'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}>{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to="/login" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', padding: '8px 16px' }}>Entrar</Link>
            <Link to="/register" style={{ fontSize: 13, fontWeight: 800, color: 'white', textDecoration: 'none', padding: '9px 20px', borderRadius: 10, background: '#184e77', border: '1px solid rgba(255,255,255,0.12)', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1a6291'} onMouseLeave={e => e.currentTarget.style.background = '#184e77'}>Registrar tienda</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', background: '#0a1624', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '55%', height: '65%', background: 'radial-gradient(ellipse at 80% 15%, rgba(24,78,119,0.28) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px', paddingTop: 140, width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(64px,9vw,136px)', lineHeight: 0.9, letterSpacing: '-0.05em', margin: '0 0 64px', color: 'white' }}>
            <span style={{ display: 'block' }}>Cada</span>
            <span style={{ display: 'block', color: 'transparent', WebkitTextStroke: '2px rgba(255,255,255,0.16)' }}>peso</span>
            <span style={{ display: 'block' }}>cuenta.</span>
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 48, alignItems: 'end', paddingBottom: 56, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 36 }}>
            <div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, margin: '0 0 24px', maxWidth: 280 }}>Control de inventario, ventas y equipo para tiendas que no pueden permitirse perder dinero.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 22px', borderRadius: 11, fontSize: 13, fontWeight: 800, background: 'white', color: '#0a1624', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'none'; }}>
                  Empezar <ArrowRight size={14} />
                </Link>
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 18px', borderRadius: 11, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.09)', transition: 'all 0.2s' }}>
                  Tengo cuenta
                </Link>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[{ l: 'Stock procesado hoy', v: 'Bs 4,820', up: true }, { l: 'Alertas activas', v: '2 productos', up: false }].map(({ l, v, up }) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontWeight: 600 }}>{l}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: up ? '#34d399' : '#f87171', fontFamily: 'Outfit, sans-serif' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[{ n: '500+', l: 'tiendas activas' }, { n: '25k+', l: 'facturas emitidas' }].map(({ n, l }) => (
                <div key={l}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 40, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', lineHeight: 1 }}>{n}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Marquee />
      </section>

      {/* ── SCREENSHOTS ── */}
      <section style={{ background: '#06101a', padding: '96px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>El sistema, en vivo</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(30px,4vw,52px)', fontWeight: 900, letterSpacing: '-0.04em', color: 'white', margin: 0, lineHeight: 1.05 }}>
              Así se ve BolClick <span style={{ color: 'rgba(255,255,255,0.2)' }}>desde adentro.</span>
            </h2>
          </div>
          <BrowserFrame tiltY={0} tiltX={1.5} delay={0}>
            <DashboardScreen />
          </BrowserFrame>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <BrowserFrame tiltY={3} tiltX={1.5} delay={0.1}>
              <InventoryScreen />
            </BrowserFrame>
            <BrowserFrame tiltY={-3} tiltX={1.5} delay={0.2}>
              <POSScreen />
            </BrowserFrame>
          </div>
        </div>
      </section>

      {/* ── BOLD STATEMENT ── */}
      <section style={{ padding: '96px 48px', background: '#0c1929' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(40px,6vw,88px)', letterSpacing: '-0.04em', lineHeight: 0.98 }}>
            <div style={{ color: 'white' }}>Inventario real.</div>
            <div style={{ color: 'rgba(255,255,255,0.18)' }}>No suposiciones.</div>
            <div style={{ color: 'white', marginTop: 8 }}>Ventas que cierra</div>
            <div style={{ color: 'rgba(255,255,255,0.18)' }}>tu equipo, no el sistema.</div>
          </div>
        </div>
      </section>

      {/* ── MODULES ── */}
      <section style={{ padding: '0 48px 80px', background: '#0c1929' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', gap: 40, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 0 }}>
            {['#', 'Módulo', 'Capacidades'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.12)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{h}</span>)}
          </div>
          <FeatureRow number="01" title="Inventario & Auditoría" desc="Conteo físico con delta firmado por operador, historial de variaciones y valoración de pérdida congelada." tags={['Conteo físico', 'Delta firmado', 'Historial']} />
          <FeatureRow number="02" title="Punto de Venta" desc="Terminal rápido de cobros. Busca, selecciona, cobra. El stock se descuenta automáticamente." tags={['Búsqueda rápida', 'Cierre de caja', 'Recibo']} />
          <FeatureRow number="03" title="Sourcing de Compras" desc="Registra compras por proveedor y lote. Costo promedio ponderado recalculado automáticamente." tags={['Por lote', 'NIT proveedor', 'CPPC']} />
          <FeatureRow number="04" title="Control de Equipo" desc="Roles diferenciados: Owner ve todo, Vendedor solo cobra, Supervisor solo revisa." tags={['Owner', 'Supervisor', 'Vendedor']} />
          <FeatureRow number="05" title="Multi-Sucursal" desc="Vista consolidada o por local. Cada sucursal tiene su stock, caja y equipo independientes." tags={['Por sucursal', 'Vista global', 'Filtros']} />
        </div>
      </section>

      {/* ── STATS — dark blue accent ── */}
      <section style={{ background: '#080f1a', padding: '96px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>Por qué importa</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(34px,4vw,58px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'white', margin: 0 }}>
              Sin control,<br />el dinero<br />
              <span style={{ color: '#f87171' }}>se pierde solo.</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
            {[
              { n: 'Bs 3,200', l: 'Pérdida mensual sin sistema', c: '#f87171' },
              { n: '−94%', l: 'Reducción tras implementar', c: '#34d399' },
              { n: '5 min', l: 'Setup inicial', c: '#60a5fa' },
              { n: '12k+', l: 'Ajustes auditados', c: 'rgba(255,255,255,0.5)' },
            ].map(({ n, l, c }) => (
              <div key={l} style={{ borderLeft: `3px solid ${c}`, paddingLeft: 18 }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 38, fontWeight: 900, letterSpacing: '-0.04em', color: c, lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', fontWeight: 600, marginTop: 6, lineHeight: 1.4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALERTS ── */}
      <section style={{ background: '#0a1624', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 32 }}>Alertas automáticas</p>
          {[
            { evt: 'Stock por debajo del mínimo configurado', when: 'En el momento exacto' },
            { evt: 'Pérdida detectada en auditoría física', when: 'Al confirmar el ajuste' },
            { evt: 'Conteo físico difiere del sistema', when: 'Al ingresar el conteo' },
            { evt: 'Compra sin proveedor registrado', when: 'Al guardar el lote' },
          ].map(({ evt, when }) => (
            <div key={evt} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{evt}</span>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0, marginLeft: 24 }}>{when}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA — slightly lighter dark ── */}
      <section style={{ background: '#111c2e', padding: '120px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 80 }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(48px,6vw,96px)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 0.95, margin: '0 0 40px', color: 'white' }}>
              Empieza hoy.<br />
              <span style={{ color: '#38bdf8' }}>Sin excusas.</span>
            </h2>
            <div style={{ display: 'flex', gap: 14 }}>
              <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 14, fontSize: 15, fontWeight: 800, background: 'white', color: '#0a1624', textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'none'; }}>
                Crear mi cuenta <ArrowUpRight size={16} />
              </Link>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700, border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', background: 'rgba(255,255,255,0.04)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}>
                Ya tengo cuenta
              </Link>
            </div>
          </div>
          <div style={{ textAlign: 'right', paddingBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Sin tarjeta · Setup en 5 min</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Soporte incluido desde el día 1</div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#060e16', padding: '48px 48px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#184e77', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/logo.png" alt="" style={{ width: 18, objectFit: 'contain' }} />
              </div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 16, color: 'white', letterSpacing: '-0.03em' }}>BolClick</span>
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              {['Módulos', 'Precios', 'Contacto', 'Privacidad'].map(l => (
                <a key={l} href="#" style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.18)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.55)'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.18)'}>{l}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.12)' }}>© {new Date().getFullYear()} BolClick</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.08)' }}>Gestión comercial · Bolivia</span>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes marqueeScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      `}</style>
    </div>
  );
}
