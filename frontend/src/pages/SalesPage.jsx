import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { ShoppingCart, User, MapPin, Printer, Trash2, Download, Receipt, Search, Plus } from 'lucide-react';

export default function SalesPage() {
  const [sucursales, setSucursales] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  
  const [stockInfo, setStockInfo] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  
  const [cart, setCart] = useState([]);
  const [clienteNombre, setClienteNombre] = useState('Cliente Casual');
  const [clienteDocumento, setClienteDocumento] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  
  const [salesHistory, setSalesHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const userRole = sessionStorage.getItem('user_role');
  const userSucursalId = sessionStorage.getItem('user_sucursal_id');
  const userSucursalName = sessionStorage.getItem('user_sucursal_name');
  const isBranchLocked = userRole !== 'OWNER' && !!userSucursalId;

  const toast = useToast();

  useEffect(() => {
    fetchSucursales();
    fetchSalesHistory();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchStock();
    } else {
      setStockInfo([]);
    }
  }, [selectedBranch]);

  const fetchSucursales = async () => {
    try {
      const userSucursalId = sessionStorage.getItem('user_sucursal_id');
      const userSucursalName = sessionStorage.getItem('user_sucursal_name');
      const userRole = sessionStorage.getItem('user_role');
      
      // Si es un empleado (Vendedor o Supervisor) y tiene una sucursal asignada, se auto-selecciona y bloquea
      if (userRole !== 'OWNER' && userSucursalId) {
        const myBranch = { id: userSucursalId, name: userSucursalName || 'Mi Sucursal' };
        setSucursales([myBranch]);
        setSelectedBranch(userSucursalId);
        return;
      }

      const { data } = await api.get('/sucursales');
      const activos = data.filter(s => s.isActive);
      setSucursales(activos);
      if (activos.length > 0) setSelectedBranch(activos[0].id);
    } catch (err) {
      toast.error('Error al cargar sucursales');
    }
  };

  const fetchStock = async () => {
    try {
      const { data } = await api.get('/stock');
      // Filter stock by selected branch
      setStockInfo(data.filter(s => s.sucursal_id === selectedBranch && s.cantidadTotal > 0));
    } catch (err) {
      toast.error('Error al cargar inventario');
    }
  };

  const fetchSalesHistory = async () => {
    try {
      const { data } = await api.get('/ventas');
      setSalesHistory(data);
    } catch (err) {
      toast.error('Error al cargar historial de comprobantes');
    }
  };

  const filteredStock = useMemo(() => {
    return stockInfo.filter(s => {
      const term = searchProduct.toLowerCase();
      return s.producto?.name?.toLowerCase().includes(term) || s.producto?.sku?.toLowerCase().includes(term);
    });
  }, [stockInfo, searchProduct]);

  const addToCart = (stockItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.producto_id === stockItem.producto_id);
      if (existing) {
        if (existing.cantidad >= stockItem.cantidadTotal) {
          toast.error('No hay suficiente stock físico');
          return prev;
        }
        return prev.map(item => item.producto_id === stockItem.producto_id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, {
        producto_id: stockItem.producto_id,
        name: stockItem.producto.name,
        sku: stockItem.producto.sku,
        precioUnitario: Number(stockItem.producto.precioVenta || 0),
        cantidad: 1,
        maxStock: stockItem.cantidadTotal
      }];
    });
  };

  const updateCartQty = (producto_id, cantidad) => {
    setCart(prev => prev.map(item => {
      if (item.producto_id === producto_id) {
        if (cantidad > item.maxStock) {
          toast.error(`Solo hay ${item.maxStock} unidades disponibles`);
          return { ...item, cantidad: item.maxStock };
        }
        return { ...item, cantidad: Math.max(1, cantidad) };
      }
      return item;
    }));
  };

  const removeFromCart = (producto_id) => {
    setCart(prev => prev.filter(item => item.producto_id !== producto_id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);

  const handleRegisterSale = async () => {
    if (!selectedBranch) return toast.error('Selecciona una sucursal');
    if (cart.length === 0) return toast.error('El carrito está vacío');
    if (!clienteNombre.trim()) return toast.error('Ingresa el nombre del cliente');

    setSaving(true);
    try {
      const payload = {
        sucursal_id: selectedBranch,
        clienteNombre,
        clienteDocumento,
        metodoPago,
        montoRecibido: Number(montoRecibido) || cartTotal,
        cambio: Math.max(0, (Number(montoRecibido) || cartTotal) - cartTotal),
        vendedorNombre: sessionStorage.getItem('user_name') || 'Cajero',
        items: cart.map(item => ({ producto_id: item.producto_id, cantidad: item.cantidad }))
      };

      const { data } = await api.post('/ventas', payload);
      
      toast.success('¡Venta registrada exitosamente!');
      setCart([]);
      setClienteNombre('Cliente Casual');
      setClienteDocumento('');
      setMetodoPago('Efectivo');
      setMontoRecibido('');
      
      fetchStock();
      fetchSalesHistory();
      
      // Auto-download the PDF
      downloadPdf(data.id, data.numeroComprobante);
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar la venta');
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async (id, numeroComprobante) => {
    setDownloading(id);
    try {
      const response = await api.get(`/ventas/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${numeroComprobante || 'comprobante'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Error al descargar el comprobante');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="full-width-container animate-fadein space-y-6">
      <div className="page-header-bar">
        <div>
          <h1>Punto de Venta (POS)</h1>
          <p>Facturación directa, búsqueda de productos y emisión de comprobantes de venta.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Left Column: POS / Terminal */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6 min-h-[680px]">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Terminal de Venta
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {isBranchLocked ? `Sucursal: ${userSucursalName || 'Asignada'}. Añade productos al carrito.` : 'Selecciona la sucursal y añade productos al carrito.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedBranch} 
              onChange={e => { setSelectedBranch(e.target.value); setCart([]); }}
              disabled={isBranchLocked}
              className={`py-2 px-4 border rounded-xl text-sm font-bold transition-all shadow-sm ${
                isBranchLocked 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
            >
              <option value="" disabled>-- Seleccione Sucursal --</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
            <Search size={20} />
          </span>
          <input 
            type="text" 
            placeholder="Buscar producto por nombre o SKU..." 
            value={searchProduct}
            onChange={e => setSearchProduct(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium focus:bg-white transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
            disabled={!selectedBranch}
          />
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto max-h-[460px] pr-2 custom-scrollbar">
          {filteredStock.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-slate-500 font-semibold text-sm">
              {selectedBranch ? 'No se encontraron productos disponibles en esta sucursal.' : 'Por favor, selecciona una sucursal para cargar el inventario.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredStock.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => addToCart(s)}
                  className="bg-white border border-slate-200 hover:border-indigo-400 rounded-xl p-4 cursor-pointer transition-colors flex flex-col justify-between min-h-[130px]"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-500 uppercase">{s.producto?.sku}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        s.cantidadTotal <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {s.cantidadTotal} Disp.
                      </span>
                    </div>
                    <strong className="text-sm font-semibold text-slate-800 block line-clamp-2">{s.producto?.name}</strong>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-900">Bs {Number(s.producto?.precioVenta || 0).toFixed(2)}</span>
                    <div className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                      <Plus size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Cart & Billing & History */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Cart Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800">
              Resumen de Venta
            </h3>
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])} 
                className="text-[11px] bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 py-1.5 px-3 rounded-lg font-bold uppercase tracking-wider transition-colors"
              >
                Vaciar Carrito
              </button>
            )}
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="form-group">
              <label htmlFor="client-name" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cliente</label>
              <input 
                id="client-name"
                type="text" 
                value={clienteNombre} 
                onChange={e => setClienteNombre(e.target.value)} 
                className="w-full py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="form-group">
              <label htmlFor="client-doc" className="text-xs font-bold text-slate-600 uppercase tracking-wider">NIT / CI (Opc.)</label>
              <input 
                id="client-doc"
                type="text" 
                value={clienteDocumento} 
                onChange={e => setClienteDocumento(e.target.value)} 
                placeholder="Ej. 1234567" 
                className="w-full py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
            <div className="form-group">
              <label htmlFor="metodo-pago" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Método de Pago</label>
              <select 
                id="metodo-pago"
                value={metodoPago} 
                onChange={e => setMetodoPago(e.target.value)} 
                className="w-full py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="QR">QR</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="monto-recibido" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Monto Recibido</label>
              <input 
                id="monto-recibido"
                type="number" 
                min="0"
                step="0.01"
                value={montoRecibido} 
                onChange={e => setMontoRecibido(e.target.value)} 
                placeholder={`Mín. Bs ${cartTotal.toFixed(2)}`} 
                className="w-full py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          {montoRecibido && Number(montoRecibido) >= cartTotal && cartTotal > 0 && (
            <div className="mt-2 text-right text-sm font-bold text-emerald-600 bg-emerald-50 py-2 px-4 rounded-lg flex justify-between">
              <span>Cambio / Vuelto:</span>
              <span>Bs {(Number(montoRecibido) - cartTotal).toFixed(2)}</span>
            </div>
          )}

          <div className="h-px bg-slate-100" />

          {/* Cart Items List */}
          <div className="overflow-y-auto max-h-[300px] pr-2 min-h-[150px] custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-60">
                <p className="text-slate-500 text-sm">No hay artículos en el carrito.<br/>Añade productos de la terminal.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.producto_id} className="flex justify-between items-center py-3 px-4 bg-white border border-slate-200 rounded-xl gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-800 truncate">{item.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Bs {item.precioUnitario.toFixed(2)} c/u</div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <input 
                        type="number" 
                        min="1" 
                        max={item.maxStock} 
                        value={item.cantidad} 
                        onChange={e => updateCartQty(item.producto_id, parseInt(e.target.value) || 1)}
                        className="w-16 text-center py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                      />
                      <span className="text-sm font-bold text-slate-800 w-20 text-right">
                        Bs {(item.cantidad * item.precioUnitario).toFixed(2)}
                      </span>
                      <button 
                        onClick={() => removeFromCart(item.producto_id)} 
                        className="text-red-500 hover:text-red-700 p-1.5 bg-transparent"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Section */}
          <div className="flex justify-between items-center py-4 border-t border-slate-200">
            <span className="text-base font-bold text-slate-600">Monto Total</span>
            <span className="text-xl font-bold">Bs {cartTotal.toFixed(2)}</span>
          </div>

          <button 
            onClick={handleRegisterSale}
            disabled={saving || cart.length === 0}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors disabled:opacity-50"
          >
            {saving ? 'Registrando...' : 'Confirmar Venta y Cobrar'}
          </button>
        </div>



      </div>
    </div>
    </div>
  );
}
