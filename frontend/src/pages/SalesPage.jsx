import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { ShoppingCart, User, MapPin, Printer, Trash2, Download, Receipt, Search } from 'lucide-react';

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Left Column: POS / Terminal */}
      <div className="lg:col-span-7 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col gap-6 min-h-[640px]">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart size={20} className="text-indigo-600" />
            <span>Terminal de Ventas</span>
          </h3>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-slate-400" />
            <select 
              value={selectedBranch} 
              onChange={e => { setSelectedBranch(e.target.value); setCart([]); }}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="" disabled>Seleccione Sucursal...</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="Buscar producto por nombre o SKU..." 
            value={searchProduct}
            onChange={e => setSearchProduct(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white transition-colors placeholder:text-slate-400"
            disabled={!selectedBranch}
          />
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto max-h-[420px] pr-1">
          {filteredStock.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-medium text-sm">
              {selectedBranch ? 'No hay productos disponibles en esta sucursal' : 'Por favor, selecciona una sucursal para cargar el stock'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredStock.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => addToCart(s)}
                  className="bg-slate-50 hover:bg-slate-100/60 border border-slate-200/50 hover:border-indigo-100 rounded-xl p-4 cursor-pointer transition-all duration-150 active:scale-[0.98] flex flex-col gap-1 hover:shadow-sm"
                >
                  <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.producto?.sku}</span>
                  <strong className="text-sm text-slate-800 font-semibold leading-tight line-clamp-1">{s.producto?.name}</strong>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200/30">
                    <span className="text-sm font-extrabold text-indigo-600">Bs {Number(s.producto?.precioVenta || 0).toFixed(2)}</span>
                    <span className="text-[10px] bg-slate-200/80 text-slate-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{s.cantidadTotal} Disp.</span>
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
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-50">
            <Receipt size={18} className="text-indigo-600" />
            <span>Detalle de Facturación</span>
          </h3>

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="client-name" className="flex items-center gap-1.5"><User size={12} className="text-slate-400" /> Cliente / Razón Social</label>
              <input 
                id="client-name"
                type="text" 
                value={clienteNombre} 
                onChange={e => setClienteNombre(e.target.value)} 
                className="py-2 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div className="form-group">
              <label htmlFor="client-doc">NIT / CI (Opcional)</label>
              <input 
                id="client-doc"
                type="text" 
                value={clienteDocumento} 
                onChange={e => setClienteDocumento(e.target.value)} 
                placeholder="Ej. 1234567" 
                className="py-2 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="h-px bg-dashed bg-slate-200" />

          {/* Cart Items List */}
          <div className="overflow-y-auto max-h-[220px] pr-1 min-h-[120px]">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm font-medium">
                No hay productos en el carrito. Añade algunos del catálogo.
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.producto_id} className="flex justify-between items-center py-2.5 px-3 bg-slate-50 border border-slate-200/50 rounded-xl gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Bs {item.precioUnitario.toFixed(2)} c/u</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input 
                        type="number" 
                        min="1" 
                        max={item.maxStock} 
                        value={item.cantidad} 
                        onChange={e => updateCartQty(item.producto_id, parseInt(e.target.value) || 1)}
                        className="w-12 text-center py-1 bg-white border border-slate-200 rounded-md text-xs font-bold focus:outline-none"
                      />
                      <span className="text-xs font-bold text-slate-700 w-16 text-right">
                        Bs {(item.cantidad * item.precioUnitario).toFixed(2)}
                      </span>
                      <button 
                        onClick={() => removeFromCart(item.producto_id)} 
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors hover:bg-rose-50"
                        title="Eliminar ítem"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Section */}
          <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200/50 rounded-xl">
            <span className="text-sm font-bold text-slate-500">Monto Total:</span>
            <span className="text-xl font-extrabold text-slate-900">Bs {cartTotal.toFixed(2)}</span>
          </div>

          <button 
            onClick={handleRegisterSale} 
            disabled={saving || cart.length === 0}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/10 transition-all duration-150 active:scale-[0.98]"
          >
            <Printer size={16} /> 
            <span>{saving ? 'Registrando venta...' : 'Cobrar y Emitir Comprobante'}</span>
          </button>
        </div>

        {/* History List */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
             Historial de Comprobantes Recientes
          </h4>
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {salesHistory.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-4 text-center">No hay registros de ventas anteriores.</p>
            ) : (
              salesHistory.map(sale => (
                <div key={sale.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{sale.numeroComprobante}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {new Date(sale.fecha).toLocaleDateString()} | {sale.clienteNombre}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">Bs {Number(sale.total).toFixed(2)}</span>
                    <button 
                      onClick={() => downloadPdf(sale.id, sale.numeroComprobante)}
                      disabled={downloading === sale.id}
                      title="Descargar PDF"
                      className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-lg hover:border-slate-300 transition-all"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
