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
  
  const [salesHistory, setSalesHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(null);

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
        items: cart.map(item => ({ producto_id: item.producto_id, cantidad: item.cantidad }))
      };

      const { data } = await api.post('/ventas', payload);
      
      toast.success('¡Venta registrada exitosamente!');
      setCart([]);
      setClienteNombre('Cliente Casual');
      setClienteDocumento('');
      
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
      <div className="lg:col-span-7 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col gap-6 min-h-[680px]">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingCart size={20} className="text-indigo-600" /> Terminal de Venta
            </h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">Selecciona la sucursal y añade productos al carrito.</p>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedBranch} 
              onChange={e => { setSelectedBranch(e.target.value); setCart([]); }}
              className="py-2 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
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
                  className="group bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 cursor-pointer transition-all duration-200 active:scale-[0.97] flex flex-col justify-between min-h-[140px] hover:shadow-lg hover:shadow-indigo-500/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div>
                    <div className="flex justify-between items-start gap-1 mb-2">
                      <span className="font-mono text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{s.producto?.sku}</span>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                        s.cantidadTotal <= 5 ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {s.cantidadTotal} DISP.
                      </span>
                    </div>
                    <strong className="text-sm font-extrabold text-slate-900 leading-snug mt-1 block line-clamp-2">{s.producto?.name}</strong>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <span className="text-lg font-black text-slate-900 tracking-tight">Bs {Number(s.producto?.precioVenta || 0).toFixed(2)}</span>
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Plus size={16} strokeWidth={3} />
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
        <div className="bg-white border-2 border-slate-200/60 rounded-3xl p-7 shadow-xl shadow-slate-200/40 flex flex-col gap-6 relative overflow-hidden">
          {/* Decorative Receipt Header */}
          <div className="absolute top-0 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDEwLDAgMjAsMTAiIGZpbGw9IiNmMThmYWQiLz48L3N2Zz4=')] opacity-50" />
          
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 mt-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt size={22} className="text-indigo-600" /> Resumen de Venta
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

          <div className="h-px bg-slate-100" />

          {/* Cart Items List */}
          <div className="overflow-y-auto max-h-[300px] pr-2 min-h-[150px] custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-60">
                <ShoppingCart size={40} className="text-slate-300 mb-4" strokeWidth={1.5} />
                <p className="text-slate-500 text-sm font-medium">No hay artículos en el carrito.<br/>Añade productos de la terminal.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.producto_id} className="flex justify-between items-center py-3 px-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl gap-3 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] transition-colors group">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold text-slate-900 truncate tracking-tight">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">Bs {item.precioUnitario.toFixed(2)} c/u</div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <input 
                        type="number" 
                        min="1" 
                        max={item.maxStock} 
                        value={item.cantidad} 
                        onChange={e => updateCartQty(item.producto_id, parseInt(e.target.value) || 1)}
                        className="w-14 text-center py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <span className="text-sm font-black text-slate-800 w-20 text-right font-mono">
                        Bs {(item.cantidad * item.precioUnitario).toFixed(2)}
                      </span>
                      <button 
                        onClick={() => removeFromCart(item.producto_id)} 
                        className="text-slate-300 hover:text-white bg-transparent hover:bg-rose-500 p-1.5 rounded-lg transition-colors"
                        title="Eliminar ítem"
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
          <div className="flex justify-between items-center p-5 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-2xl">
            <span className="text-sm font-extrabold text-slate-500 uppercase tracking-widest">Monto Total</span>
            <span className="text-3xl font-black text-indigo-700 font-mono tracking-tighter">Bs {cartTotal.toFixed(2)}</span>
          </div>

          <button 
            onClick={handleRegisterSale} 
            disabled={saving || cart.length === 0}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none text-white font-extrabold rounded-2xl text-base flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/30 transition-all duration-200 active:scale-[0.98]"
          >
            <Printer size={20} strokeWidth={2.5} /> 
            <span>{saving ? 'Registrando venta...' : 'Cobrar y Emitir Comprobante'}</span>
          </button>
        </div>

        {/* History List */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0">
               Historial de Comprobantes Recientes
            </h4>
          </div>
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {salesHistory.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-4 text-center">No hay registros de ventas anteriores.</p>
            ) : (
              salesHistory.map(sale => (
                <div key={sale.id} className="flex justify-between items-center p-3 border border-slate-150 rounded-lg bg-white hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-900">{sale.numeroComprobante}</div>
                    <div className="text-[10px] text-slate-450 font-medium mt-0.5">
                      {new Date(sale.fecha).toLocaleDateString()} &bull; {sale.clienteNombre}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-800">Bs {Number(sale.total).toFixed(2)}</span>
                    <button 
                      onClick={() => downloadPdf(sale.id, sale.numeroComprobante)}
                      disabled={downloading === sale.id}
                      title="Descargar PDF"
                      className="p-1.5 bg-slate-50 text-slate-600 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-all"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
    </div>
  );
}
