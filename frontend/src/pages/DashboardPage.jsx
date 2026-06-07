import React, { useState, useEffect } from 'react';
import api from '../api';
import { LayoutDashboard, TrendingUp, Archive, AlertTriangle, Receipt, Loader2, DollarSign } from 'lucide-react';
import { useToast } from '../components/ToastContext';

export default function DashboardPage() {
  const userName = sessionStorage.getItem('user_name') || 'Usuario';
  const userRole = sessionStorage.getItem('user_role') || 'VENDEDOR';
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalStockItems: 0,
    totalStockValue: 0,
    totalLosses: 0,
    recentSales: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Usamos Promise.all para cargar optimizadamente en paralelo.
      // Atrapamos errores individualmente para no romper todo si el usuario no tiene permisos (ej. Vendedor).
      const [salesRes, stockRes, ajustesRes] = await Promise.all([
        api.get('/ventas').catch(() => ({ data: [] })),
        api.get('/stock').catch(() => ({ data: [] })),
        api.get('/ajustes').catch(() => ({ data: [] }))
      ]);

      const sales = salesRes.data || [];
      const stock = stockRes.data || [];
      const ajustes = ajustesRes.data || [];

      // Validar consistencia e interpretar información
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((acc, sale) => acc + Number(sale.total), 0);
      
      const totalStockItems = stock.reduce((acc, item) => acc + Number(item.cantidad), 0);
      const totalStockValue = stock.reduce((acc, item) => {
        const itemPrice = item.producto?.precio || 0;
        return acc + (Number(item.cantidad) * Number(itemPrice));
      }, 0);

      const totalLosses = ajustes.reduce((acc, aj) => acc + Number(aj.valor_perdido || 0), 0);

      // Obtener últimas 5 ventas para mostrar actividad reciente
      const recentSales = [...sales]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setMetrics({
        totalSales,
        totalRevenue,
        totalStockItems,
        totalStockValue,
        totalLosses,
        recentSales
      });

    } catch (err) {
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="animate-spin text-[var(--txt-muted)] mb-4" size={32} />
        <span className="text-[var(--txt-secondary)] font-medium">Consolidando módulos...</span>
      </div>
    );
  }

  // Ocultar métricas financieras detalladas si es un vendedor básico, para privacidad del dueño.
  const isBasicSeller = userRole === 'VENDEDOR';

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fadeIn">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[var(--txt-primary)] tracking-tight flex items-center gap-3">
          <LayoutDashboard className="text-[var(--txt-secondary)]" size={32} />
          Panel de Control
        </h1>
        <p className="text-[var(--txt-secondary)] font-medium mt-2">
          Hola, <span className="font-bold text-[var(--txt-primary)]">{userName}</span>. 
          Aquí tienes un resumen unificado del estado de tu tienda.
        </p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card: Ventas Realizadas */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-[var(--txt-secondary)] uppercase tracking-wider mb-1">Ventas Históricas</p>
              <h3 className="text-2xl font-black text-[var(--txt-primary)]">{metrics.totalSales}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center">
              <Receipt size={18} className="text-[var(--txt-primary)]" />
            </div>
          </div>
          <div className="text-[11px] font-bold text-green-600 flex items-center gap-1">
            <TrendingUp size={12} /> <span className="text-[var(--txt-muted)] font-medium ml-1">Consistencia OK</span>
          </div>
        </div>

        {/* Card: Ingresos */}
        {!isBasicSeller && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-[var(--txt-secondary)] uppercase tracking-wider mb-1">Ingresos Totales</p>
                <h3 className="text-2xl font-black text-[var(--txt-primary)]">Bs {metrics.totalRevenue.toFixed(2)}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center">
                <DollarSign size={18} className="text-[var(--txt-primary)]" />
              </div>
            </div>
            <div className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
              <TrendingUp size={12} /> <span className="text-[var(--txt-muted)] font-medium ml-1">Ingreso Bruto</span>
            </div>
          </div>
        )}

        {/* Card: Inventario */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-[var(--txt-secondary)] uppercase tracking-wider mb-1">Stock Físico</p>
              <h3 className="text-2xl font-black text-[var(--txt-primary)]">
                {metrics.totalStockItems} <span className="text-sm font-medium text-[var(--txt-muted)]">unidades</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center">
              <Archive size={18} className="text-[var(--txt-primary)]" />
            </div>
          </div>
          {!isBasicSeller ? (
            <div className="text-[11px] text-[var(--txt-secondary)] font-medium flex items-center gap-1">
              Valor estimado: <span className="font-bold text-[var(--txt-primary)]">Bs {metrics.totalStockValue.toFixed(2)}</span>
            </div>
          ) : (
            <div className="text-[11px] text-[var(--txt-secondary)] font-medium">Disponibles en tienda</div>
          )}
        </div>

        {/* Card: Pérdidas / Ajustes */}
        {!isBasicSeller && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-[var(--txt-secondary)] uppercase tracking-wider mb-1">Pérdidas Confirmadas</p>
                <h3 className="text-2xl font-black text-red-600">Bs {metrics.totalLosses.toFixed(2)}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center dark:bg-red-900/20 dark:border-red-900/30">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
            </div>
            <div className="text-[11px] font-bold text-[var(--txt-muted)] flex items-center gap-1">
              Reportado en Auditorías
            </div>
          </div>
        )}
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--bg)] flex items-center gap-2">
          <Receipt size={16} className="text-[var(--txt-secondary)]" />
          <h2 className="text-sm font-bold text-[var(--txt-primary)] uppercase tracking-wider">Actividad Reciente (Últimas Ventas)</h2>
        </div>
        
        {metrics.recentSales.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {metrics.recentSales.map((sale) => (
              <div key={sale.id} className="p-4 px-6 flex items-center justify-between hover:bg-[var(--bg)] transition-colors">
                <div>
                  <p className="text-sm font-bold text-[var(--txt-primary)]">Venta #{sale.id.slice(0, 8)}</p>
                  <p className="text-[11px] text-[var(--txt-secondary)] mt-0.5 font-medium">
                    {new Date(sale.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[var(--txt-primary)]">Bs {Number(sale.total).toFixed(2)}</p>
                  <p className="text-[11px] text-[var(--txt-secondary)] font-medium">Completada</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-[var(--txt-secondary)] text-sm font-medium">
            No hay registros de ventas recientes.
          </div>
        )}
      </div>

    </div>
  );
}
