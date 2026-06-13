import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api, { getBackendUrl } from '../api';
import { useToast } from '../components/ToastContext';
import {
  Minus, Plus, Trash2, Bell, Receipt, Calculator, Store, LayoutGrid, Sun, Moon, Tag
} from 'lucide-react';

export default function PosPage() {
  const [sucursales, setSucursales] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [stockInfo, setStockInfo] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  
  const [cart, setCart] = useState([]);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [saving, setSaving] = useState(false);
  const [orderNumber, setOrderNumber] = useState('......');
  
  // Hold Orders State
  const [activeRightTab, setActiveRightTab] = useState('new');
  const [holdOrders, setHoldOrders] = useState([]);

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('Cliente Casual');
  const [clienteDocumento, setClienteDocumento] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  
  // Variant Selection State
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const toast = useToast();
  
  const userRole = sessionStorage.getItem('user_role');
  const userSucursalId = sessionStorage.getItem('user_sucursal_id');
  const userSucursalName = sessionStorage.getItem('user_sucursal_name');
  const tenantName = sessionStorage.getItem('tenant_name') || 'Mi Tienda';
  const isBranchLocked = userRole !== 'OWNER' && !!userSucursalId;

  useEffect(() => {
    fetchSucursales();
    
    // Check global theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const fetchNextOrderNumber = async (branchId) => {
    if (!branchId) return;
    try {
      const { data } = await api.get(`/ventas/siguiente-numero/${branchId}`);
      setOrderNumber(data.nextNumber);
    } catch (err) {
      console.error('Error al obtener siguiente número correlativo:', err);
    }
  };

  useEffect(() => {
    if (selectedBranch) {
      fetchStock();
      fetchNextOrderNumber(selectedBranch);
    } else {
      setStockInfo([]);
    }
  }, [selectedBranch]);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDarkMode(!isDarkMode);
  };

  const fetchSucursales = async () => {
    try {
      if (isBranchLocked) {
        setSucursales([{ id: userSucursalId, name: userSucursalName || 'Mi Sucursal' }]);
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
      const branchStock = data.filter(s => s.sucursal_id === selectedBranch);
      setStockInfo(branchStock);
    } catch (err) {
      toast.error('Error al cargar inventario');
    }
  };

  // Dinámicamente extraer la primera palabra del nombre como categoría si no hay category real
  const products = useMemo(() => {
    return stockInfo.map(s => {
      let catName = s.producto?.category;
      if (!catName) {
        // Fallback: usar la primera palabra del nombre del producto (ej: "Pantalón Jean" -> "Pantalón")
        catName = s.producto?.name?.split(' ')[0] || 'General';
      }
      
      return {
        ...s,
        category: catName,
        displayName: s.producto?.name,
        description: s.producto?.sku || 'Item',
        price: Number(s.producto?.precioVenta || 0),
        image: s.producto?.imagen_url 
          ? getBackendUrl(s.producto.imagen_url) 
          : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        available: s.cantidadTotal > 0
      };
    });
  }, [stockInfo]);

  // Obtener lista única de categorías dinámicas
  const dynamicCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats).map(c => ({ id: c, name: c, icon: Tag })).slice(0, 8); // Max 8 categories to fit sidebar
  }, [products]);

  const CATEGORIES = [
    { id: 'ALL', name: 'Todos', icon: LayoutGrid },
    ...dynamicCategories
  ];

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'ALL') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  const getVariantLabel = (item) => {
    if (item.producto?.attributes && Object.keys(item.producto.attributes).length > 0) {
      return Object.values(item.producto.attributes).filter(Boolean).join(' - ');
    }
    if (item.producto?.description && item.producto.description !== 'Item') {
      return item.producto.description;
    }
    return '';
  };

  const groupedProducts = useMemo(() => {
    const groups = {};
    filteredProducts.forEach(p => {
      const name = p.displayName;
      if (!groups[name]) {
        groups[name] = [];
      }
      groups[name].push(p);
    });
    
    return Object.keys(groups).map(name => {
      const items = groups[name];
      const mainItem = items[0];
      const totalStock = items.reduce((sum, item) => sum + (item.cantidadTotal || 0), 0);
      return {
        name,
        items,
        totalStock,
        category: mainItem.category,
        image: mainItem.image,
        price: mainItem.price,
        description: mainItem.description,
        available: totalStock > 0
      };
    });
  }, [filteredProducts]);

  const addToCart = (product) => {
    if (!product.available) return;
    setCart(prev => {
      const existing = prev.find(item => item.producto_id === product.producto_id);
      if (existing) {
        if (existing.cantidad >= product.cantidadTotal) {
          toast.error('No hay más stock disponible');
          return prev;
        }
        return prev.map(item => item.producto_id === product.producto_id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      const label = getVariantLabel(product);
      const cartName = label ? `${product.displayName} (${label})` : product.displayName;
      return [...prev, {
        producto_id: product.producto_id,
        name: cartName,
        image: product.image,
        precioUnitario: product.price,
        sku: product.producto?.sku || product.description,
        cantidad: 1,
        maxStock: product.cantidadTotal
      }];
    });
  };

  const updateCartQty = (producto_id, increment) => {
    setCart(prev => prev.map(item => {
      if (item.producto_id === producto_id) {
        const newQty = item.cantidad + increment;
        if (newQty > item.maxStock) {
          toast.error(`Solo hay ${item.maxStock} disponibles`);
          return item;
        }
        if (newQty < 1) return item; 
        return { ...item, cantidad: newQty };
      }
      return item;
    }));
  };

  const confirmRemove = (producto_id) => {
    setCart(prev => prev.filter(item => item.producto_id !== producto_id));
    setItemToRemove(null);
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
  const taxes = 0; // Removido tax estático
  const total = subtotal + taxes;

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    setHoldOrders(prev => [
      {
        id: Date.now().toString(),
        orderNumber,
        timestamp: new Date(),
        items: [...cart],
        total: total
      },
      ...prev
    ]);
    setCart([]);
    fetchNextOrderNumber(selectedBranch);
    toast.success('Orden guardada en historial');
  };

  const loadHoldOrder = (order) => {
    setCart(order.items);
    setOrderNumber(order.orderNumber);
    setHoldOrders(prev => prev.filter(o => o.id !== order.id));
    setActiveRightTab('new');
    toast.success('Orden recuperada');
  };

  const deleteHoldOrder = (orderId) => {
    setHoldOrders(prev => prev.filter(o => o.id !== orderId));
    toast.info('Orden descartada');
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      const payload = {
        sucursal_id: selectedBranch,
        clienteNombre,
        clienteDocumento,
        metodoPago,
        montoRecibido: Number(montoRecibido) || total,
        cambio: Math.max(0, (Number(montoRecibido) || total) - total),
        vendedorNombre: sessionStorage.getItem('user_name') || 'Cajero',
        items: cart.map(item => ({ producto_id: item.producto_id, cantidad: item.cantidad }))
      };

      await api.post('/ventas', payload);
      toast.success('Orden procesada con éxito');
      setCart([]);
      fetchNextOrderNumber(selectedBranch);
      setShowCheckoutModal(false);
      setClienteNombre('Cliente Casual');
      setClienteDocumento('');
      setMetodoPago('Efectivo');
      setMontoRecibido('');
      fetchStock();
    } catch (err) {
      toast.error('Error al procesar la orden');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR - Categories */}
      <div className="w-[110px] bg-white border-r border-slate-200 flex flex-col items-center py-6 shadow-sm z-10 flex-shrink-0 overflow-y-auto custom-scrollbar">
        <Link to="/" className="flex flex-col items-center mb-6 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-slate-900 dark:bg-indigo-500 rounded-full mb-2 flex items-center justify-center text-white shadow-md">
            <Store size={20} />
          </div>
          <span className="text-[11px] font-black tracking-tight text-slate-800 text-center px-1 truncate w-full">{tenantName}</span>
        </Link>

        <div 
          onClick={toggleTheme}
          role="button"
          className="mb-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="Cambiar Tema"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </div>

        <div className="flex flex-col gap-3 w-full px-3">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                role="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex flex-col items-center justify-center w-full py-3 rounded-2xl transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md' 
                    : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="mb-2" />
                <span className="text-[10px] font-bold text-center leading-tight px-1 truncate w-full">{cat.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER GRID - Products */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50 dark:bg-slate-950">
        {/* Top Header / Branch Selector */}
        <div className="h-[70px] flex items-center px-8 flex-shrink-0">
          {!isBranchLocked && sucursales.length > 1 && (
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm font-bold py-2 px-4 rounded-xl shadow-sm outline-none focus:border-blue-500"
            >
              <option value="" disabled>Seleccionar Sucursal</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>

        {/* Grid Scroll Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          {groupedProducts.length === 0 ? (
            <div className="text-center mt-20 text-slate-400">
              No hay productos disponibles en esta categoría.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {groupedProducts.map(group => (
                <div 
                  key={group.name}
                  onClick={() => {
                    if (!group.available) return;
                    if (group.items.length === 1) {
                      addToCart(group.items[0]);
                    } else {
                      setSelectedGroup(group);
                    }
                  }}
                  className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col relative transition-transform ${group.available ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : 'opacity-80'}`}
                  style={{ height: '260px' }}
                >
                  <div className="h-[140px] w-full bg-slate-100 relative">
                    <img src={group.image} alt={group.name} className="w-full h-full object-cover" />
                    {!group.available && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="text-white font-bold text-lg">Agotado</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{group.name}</h3>
                    {group.items.length > 1 ? (
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mb-auto">{group.items.length} variantes disponibles</p>
                    ) : (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mb-auto leading-relaxed">{group.description}</p>
                    )}
                    <div className="mt-3 flex justify-between items-end">
                      <span className="text-base font-black text-slate-900">
                        Bs {group.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Stock: {group.totalStock}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR - Cart */}
      <div className="w-[380px] bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-20 flex-shrink-0">
        
        {/* Cart Header */}
        <div className="p-6 pb-0 flex-shrink-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
              <Store size={20} />
              <span>Caja 01</span>
            </div>
            <span className="text-sm text-slate-500 font-medium">Orden: #{orderNumber}</span>
          </div>
          
          <div className="flex border-b border-slate-100 dark:border-slate-800 w-full mb-4">
            <div 
              role="button" 
              onClick={() => setActiveRightTab('new')}
              className={`flex-1 pb-3 text-sm font-bold transition-colors text-center cursor-pointer ${activeRightTab === 'new' ? 'text-slate-800 dark:text-white border-b-2 border-slate-900 dark:border-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              Nueva Orden ({cart.length})
            </div>
            <div 
              role="button" 
              onClick={() => setActiveRightTab('history')}
              className={`flex-1 pb-3 text-sm font-bold transition-colors text-center cursor-pointer ${activeRightTab === 'history' ? 'text-slate-800 dark:text-white border-b-2 border-slate-900 dark:border-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              Historial ({holdOrders.length})
            </div>
          </div>
        </div>

        {/* Right Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 relative custom-scrollbar">
          {activeRightTab === 'new' ? (
            cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm font-medium">
                Carrito vacío
                {holdOrders.length > 0 && (
                  <span className="mt-2 text-xs opacity-70">Tienes {holdOrders.length} orden(es) en espera</span>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-6 py-2">
                {cart.map((item, index) => (
                  <div key={`${item.producto_id}-${index}`} className="flex gap-4 relative">
                    {/* Remove Popover Overlay */}
                    {itemToRemove === item.producto_id && (
                      <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-fadeIn">
                        <Trash2 size={24} className="text-slate-400 mb-2" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">¿Quitar producto?</span>
                        <div className="flex gap-3">
                          <div role="button" onClick={() => setItemToRemove(null)} className="px-5 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">No</div>
                          <div role="button" onClick={() => confirmRemove(item.producto_id)} className="px-5 py-1.5 rounded text-white font-bold text-sm bg-red-600 hover:bg-red-700 cursor-pointer">Sí</div>
                        </div>
                      </div>
                    )}
                    <img src={item.image} alt={item.name} className="w-[60px] h-[60px] rounded-lg object-cover flex-shrink-0 bg-slate-100" />
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate pr-2 leading-tight">{item.name}</h4>
                        <span className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap shrink-0">Bs {item.precioUnitario.toFixed(2)}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mb-3 flex flex-col gap-0.5">
                        <span>SKU: {item.sku}</span>
                      </div>
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-3 bg-transparent">
                          <div role="button" onClick={() => updateCartQty(item.producto_id, -1)} className="w-8 h-8 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded flex items-center justify-center transition-colors cursor-pointer">
                            <Minus size={14} strokeWidth={3} />
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-white w-5 text-center">
                            {item.cantidad.toString().padStart(2, '0')}
                          </span>
                          <div role="button" onClick={() => updateCartQty(item.producto_id, 1)} className="w-8 h-8 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded flex items-center justify-center transition-colors cursor-pointer">
                            <Plus size={14} strokeWidth={3} />
                          </div>
                        </div>
                        <div role="button" onClick={() => setItemToRemove(item.producto_id)} className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
                          <Trash2 size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            holdOrders.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                No hay órdenes en espera
              </div>
            ) : (
              <div className="flex flex-col gap-4 py-2">
                {holdOrders.map(order => (
                  <div key={order.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-white text-sm">Orden #{order.orderNumber}</span>
                      <span className="text-xs font-semibold text-slate-500">{order.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {order.items.length} items • Bs {order.total.toFixed(2)}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <div role="button" onClick={() => loadHoldOrder(order)} className="flex-1 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold text-center hover:opacity-90 cursor-pointer">
                        Cargar
                      </div>
                      <div role="button" onClick={() => deleteHoldOrder(order.id)} className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold text-center hover:bg-red-200 cursor-pointer">
                        <Trash2 size={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Cart Summary & Actions */}
        <div className="p-6 pt-4 border-t border-slate-200 bg-white flex-shrink-0">
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="font-bold text-slate-800">Bs {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-3">
              <span className="text-slate-800 font-medium">Total a Cobrar</span>
              <span className="text-xl font-black text-slate-900">Bs {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 h-[52px]">
            <div role="button" className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
              <Bell size={18} className="mb-0.5" />
              <span className="text-[10px] font-bold">Aviso</span>
            </div>
            <div 
              role="button" 
              onClick={cart.length > 0 ? handleHoldOrder : undefined}
              className={`flex-1 rounded-xl flex flex-col items-center justify-center transition-colors border ${cart.length === 0 ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer'}`}
            >
              <Receipt size={18} className="mb-0.5" />
              <span className="text-[10px] font-bold">Ticket</span>
            </div>
            <div 
              role="button"
              onClick={!saving && cart.length > 0 ? () => setShowCheckoutModal(true) : undefined}
              className={`flex-[2] rounded-xl flex flex-col items-center justify-center transition-colors shadow-md border-none ${saving || cart.length === 0 ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-50' : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white cursor-pointer'}`}
            >
              <Calculator size={18} className="mb-0.5" />
              <span className="text-[10px] font-bold">Cobrar</span>
            </div>
          </div>
        </div>

      </div>

      {/* CHECKOUT MODAL OVERLAY */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Confirmar Pago</h2>
              <div role="button" onClick={() => setShowCheckoutModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer transition-colors">
                ✕
              </div>
            </div>
            <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</label>
                <input 
                  type="text" 
                  value={clienteNombre} 
                  onChange={e => setClienteNombre(e.target.value)} 
                  className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">NIT / CI (Opcional)</label>
                <input 
                  type="text" 
                  value={clienteDocumento} 
                  onChange={e => setClienteDocumento(e.target.value)} 
                  placeholder="Ej. 1234567" 
                  className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pago</label>
                  <select 
                    value={metodoPago} 
                    onChange={e => setMetodoPago(e.target.value)} 
                    className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-white"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="QR">QR</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monto Recibido</label>
                  <input 
                    type="number" 
                    min={total}
                    step="0.01"
                    value={montoRecibido} 
                    onChange={e => setMontoRecibido(e.target.value)} 
                    placeholder={`Bs ${total.toFixed(2)}`} 
                    className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
              
              {/* Resumen Final */}
              <div className="mt-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Total a Pagar</span>
                  <span className="font-bold text-slate-900 dark:text-white">Bs {total.toFixed(2)}</span>
                </div>
                {montoRecibido && Number(montoRecibido) > total && (
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Cambio / Vuelto</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Bs {(Number(montoRecibido) - total).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div 
                role="button"
                onClick={!saving ? handleCheckout : undefined}
                className={`w-full py-3.5 rounded-xl flex items-center justify-center font-bold transition-all shadow-md ${saving ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'}`}
              >
                {saving ? 'Procesando...' : `Confirmar Venta • Bs ${total.toFixed(2)}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VARIANT SELECTOR MODAL OVERLAY */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
            {/* Hero Product Image */}
            <div className="w-full h-44 bg-slate-100 relative">
              <img src={selectedGroup.image} alt={selectedGroup.name} className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4">
                <div 
                  role="button" 
                  onClick={() => setSelectedGroup(null)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer transition-colors text-sm font-bold"
                >
                  ✕
                </div>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white leading-tight">{selectedGroup.name}</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Selecciona una variante para añadir</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto custom-scrollbar pr-0.5">
                {selectedGroup.items.map(variant => {
                  const variantLabel = getVariantLabel(variant);
                  const hasStock = variant.cantidadTotal > 0;
                  
                  return (
                    <div
                      key={variant.producto_id}
                      role="button"
                      onClick={() => {
                        if (hasStock) {
                          addToCart(variant);
                          setSelectedGroup(null);
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all h-20 text-center ${
                        hasStock 
                          ? 'border-slate-100 hover:border-slate-900 dark:border-slate-800 dark:hover:border-white bg-slate-50 dark:bg-slate-950 cursor-pointer' 
                          : 'border-slate-100/50 bg-slate-50/20 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase truncate w-full px-1">
                        {variantLabel || 'UNICA'}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                        Bs {variant.price.toFixed(0)}
                      </span>
                      <span className={`text-[9px] font-bold uppercase mt-0.5 leading-none ${hasStock ? 'text-slate-400' : 'text-red-500'}`}>
                        {hasStock ? `${variant.cantidadTotal} disp.` : 'Agotado'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
