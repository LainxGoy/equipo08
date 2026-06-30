import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getBackendUrl } from '../api';
import { Search, Loader2, PackageSearch, Tag, Info, ArrowLeft, Store, X, ShoppingCart, Plus, Minus, Send, Sun, Moon, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicCatalogPage() {
  const { domain } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const getImageUrl = (url) => {
    return getBackendUrl(url);
  };

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const getVariantLabel = (item) => {
    if (item.attributes && Object.keys(item.attributes).length > 0) {
      return Object.values(item.attributes).filter(Boolean).join(' - ');
    }
    if (item.description && item.description !== 'Item') {
      return item.description;
    }
    return '';
  };

  const addToCart = (product) => {
    setCart(prev => {
      const label = getVariantLabel(product);
      const cartName = label ? `${product.name} (${label})` : product.name;
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, name: cartName, quantity: 1 }];
    });
  };

  const removeFromCart = (productId, completely = false) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (completely || existing.quantity === 1) {
        return prev.filter(item => item.id !== productId);
      }
      return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.precioVenta * item.quantity), 0);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const sendWhatsApp = () => {
    let text = `Hola! Quisiera hacer un pedido de ${tienda.name}:\n\n`;
    cart.forEach(item => {
      text += `- ${item.quantity}x ${item.name} (Bs ${Number(item.precioVenta).toFixed(2)})\n`;
    });
    text += `\n*Total estimado: Bs ${cartTotal.toFixed(2)}*`;
    
    let phone = (tienda.phone || '').replace(/\D/g, '');
    if (phone.length === 8) phone = `591${phone}`; // Asumimos prefijo boliviano si solo hay 8 dígitos
    if (!phone) {
      alert("La tienda no tiene un número registrado para WhatsApp.");
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  useEffect(() => {
    if (selectedProduct) {
      const firstVariant = selectedProduct.items[0];
      setSelectedVariant(firstVariant);
      setSelectedAttributes(firstVariant?.attributes || {});
    } else {
      setSelectedVariant(null);
      setSelectedAttributes({});
    }
  }, [selectedProduct]);

  const allAttributesGrouped = useMemo(() => {
    if (!selectedProduct) return {};
    const grouped = {};
    selectedProduct.items.forEach(item => {
      if (item.attributes) {
        Object.entries(item.attributes).forEach(([key, val]) => {
          if (!grouped[key]) grouped[key] = new Set();
          if (val) grouped[key].add(val);
        });
      }
    });
    const result = {};
    Object.entries(grouped).forEach(([key, set]) => {
      result[key] = Array.from(set);
    });
    return result;
  }, [selectedProduct]);

  const handleSelectAttribute = (key, value) => {
    const nextAttrs = { ...selectedAttributes, [key]: value };
    let match = selectedProduct.items.find(item => 
      Object.entries(nextAttrs).every(([k, v]) => item.attributes?.[k] === v)
    );
    if (!match) {
      match = selectedProduct.items.find(item => item.attributes?.[key] === value);
    }
    if (match) {
      setSelectedVariant(match);
      setSelectedAttributes(match.attributes || {});
    }
  };

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get(`/catalog/${domain}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar el catálogo');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [domain]);

  const categorias = useMemo(() => {
    if (!data || !data.productos) return ['ALL'];
    return ['ALL', ...new Set(data.productos.map(p => p.category || 'Otros'))];
  }, [data]);

  const filteredProducts = useMemo(() => {
    if (!data || !data.productos) return [];
    return data.productos.filter(p => {
      if (filterCategory !== 'ALL' && (p.category || 'Otros') !== filterCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data, filterCategory, searchQuery]);

  const groupedProducts = useMemo(() => {
    const groups = {};
    filteredProducts.forEach(p => {
      const name = p.name;
      if (!groups[name]) {
        groups[name] = [];
      }
      groups[name].push(p);
    });

    return Object.keys(groups).map(name => {
      const items = groups[name];
      const mainItem = items[0];
      const totalStock = items.reduce((sum, item) => sum + (item.stockTotal || 0), 0);
      return {
        name,
        items,
        totalStock,
        category: mainItem.category,
        imagen_url: mainItem.imagen_url,
        precioVenta: mainItem.precioVenta,
        description: mainItem.description,
        available: totalStock > 0
      };
    });
  }, [filteredProducts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[var(--txt-secondary)] mb-4" size={40} />
        <h2 className="text-lg font-semibold text-[var(--txt-primary)] tracking-tight">Cargando Catálogo...</h2>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <Store className="text-rose-500" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-[var(--txt-primary)] tracking-tight mb-2">Tienda no encontrada</h2>
        <p className="text-[var(--txt-secondary)] mb-8 max-w-md">{error}</p>
        <Link to="/" className="px-6 py-2.5 bg-[var(--txt-primary)] text-[var(--bg-card)] font-semibold rounded-xl transition-transform hover:scale-105">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const { tienda } = data;

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-[var(--bg)] pb-24 font-sans text-[var(--txt-primary)] selection:bg-[var(--txt-primary)] selection:text-[var(--bg-card)]">
      {/* Portada / Banner de Fondo */}
      <div className="w-full h-48 sm:h-64 md:h-80 overflow-hidden relative bg-slate-100 dark:bg-slate-800 border-b border-[var(--border)]">
        {tienda.bannerUrl ? (
          <img 
            src={getBackendUrl(tienda.bannerUrl)} 
            alt="Portada de la Tienda" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900"></div>
        )}

        {/* Floating Actions on Top of Banner */}
        {/* Left: Volver al Mall (Flecha) */}
        <Link 
          to="/" 
          className="absolute top-4 left-4 md:left-6 flex items-center justify-center bg-slate-900/80 hover:bg-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-white transition-colors p-3 rounded-full shadow-lg z-10 border border-slate-800/20 backdrop-blur-sm"
          title="Volver al Mall"
        >
          <ArrowLeft size={24} />
        </Link>

        {/* Right: Theme Toggle */}
        <button 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="absolute top-4 right-4 md:right-6 flex items-center justify-center bg-slate-900/80 hover:bg-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-white transition-colors p-3 rounded-full shadow-lg z-10 border border-slate-800/20 backdrop-blur-sm"
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      {/* Logo Container (Overlapping the Banner like Facebook) */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center -mt-16 sm:-mt-20 z-20">
        <div className="relative">
          {tienda.logoUrl ? (
            <img 
              src={getBackendUrl(tienda.logoUrl)} 
              alt={tienda.name} 
              className="h-32 w-32 sm:h-36 sm:w-36 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl bg-white dark:bg-slate-900" 
            />
          ) : (
            <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 flex items-center justify-center font-extrabold text-4xl sm:text-5xl uppercase tracking-tighter text-slate-900 dark:text-white shadow-xl">
              {tienda.name.charAt(0)}
            </div>
          )}
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-[var(--txt-primary)] tracking-tight text-center">
          {tienda.name}
        </h1>
      </div>      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Buscador + Botón de Filtros */}
        <div className="flex gap-3 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-800 flex-1 flex items-center">
            <Search className="ml-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="¿QUÉ ESTÁS BUSCANDO? Ingresa nombre o SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-4 py-2 bg-transparent border-none text-xs font-semibold uppercase tracking-wider focus:ring-0 focus:outline-none placeholder:text-slate-400 text-slate-700 dark:text-slate-300"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm border border-transparent shrink-0"
          >
            <SlidersHorizontal size={16} />
            <span>Filtros</span>
          </button>
        </div>

        {/* Active Category Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
              {filterCategory === 'ALL' ? 'Catálogo Completo' : filterCategory}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Explora las últimas ofertas y novedades disponibles en stock.</p>
          </div>
        </div>

        {/* Cuadrícula de Productos */}
        {groupedProducts.length === 0 ? (
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-16 text-center flex flex-col items-center justify-center">
            <PackageSearch size={48} className="text-[var(--txt-muted)] mb-4" strokeWidth={1.5} />
            <h3 className="text-base font-semibold mb-1">No se encontraron productos</h3>
            <p className="text-[var(--txt-secondary)] text-xs">Intenta buscar con otros términos o cambia la categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupedProducts.map(group => (
               <div
                 key={group.name}
                 className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden flex flex-col group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                 onClick={() => setSelectedProduct(group)}
               >
                 <div className="aspect-square relative bg-[var(--bg)] overflow-hidden">
                   {group.imagen_url ? (
                     <img 
                       src={getImageUrl(group.imagen_url)} 
                       alt={group.name} 
                       className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                     />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-[var(--bg)]">
                       <Tag size={32} className="text-[var(--txt-muted)]" />
                     </div>
                   )}
                 </div>
                 
                 <div className="p-4 flex flex-col flex-grow">
                   <div className="flex-grow">
                     <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--txt-secondary)] block mb-1">
                       {group.category || 'Otros'}
                     </span>
                     <h3 className="font-semibold text-sm text-[var(--txt-primary)] leading-tight mb-2">
                       {group.name}
                     </h3>
                     <div className="text-xs text-[var(--txt-secondary)] line-clamp-2">
                       {group.items.length > 1 ? (
                         <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-[10px] uppercase tracking-wider block">
                           {group.items.length} variantes disponibles
                         </span>
                       ) : (
                         <span>{group.description || 'Sin descripción'}</span>
                       )}
                     </div>
                   </div>
                   <div className="flex items-end justify-between mt-4 pt-3 border-t border-[var(--border)]/40">
                     <span className="font-semibold text-base text-[var(--txt-primary)]">Bs {Number(group.precioVenta).toFixed(2)}</span>
                   </div>
                 </div>
               </div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer de Filtros (Lateral Izquierdo) */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-[100] flex justify-start">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative w-80 max-w-full bg-[var(--bg-card)] h-full shadow-2xl border-r border-[var(--border)] flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-[var(--txt-primary)]" />
                  <h2 className="text-base font-extrabold uppercase tracking-wider text-[var(--txt-primary)]">Filtros</h2>
                </div>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex items-center justify-center bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition-all p-2.5 rounded-full shadow-md border border-slate-800/20 hover:scale-105"
                  title="Cerrar Filtros"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 px-1">
                    Categorías
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {categorias.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setFilterCategory(cat);
                          setIsFilterOpen(false); // Close drawer on selection
                        }}
                        className={`text-left w-full px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                          filterCategory === cat
                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-sm'
                            : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {cat === 'ALL' ? 'Todos los productos' : cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              {tienda.phone && (
                <div className="p-6 border-t border-[var(--border)] bg-[var(--bg)]/50">
                  <h4 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Soporte</h4>
                  <div className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>WhatsApp: <strong className="text-slate-800 dark:text-slate-200">{tienda.phone}</strong></span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Detalle de Producto */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-[var(--border)]"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 flex items-center justify-center bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition-all p-2.5 rounded-full shadow-lg border border-slate-800/20 hover:scale-105"
                title="Cerrar"
              >
                <X size={18} />
              </button>

              <div className="md:w-1/2 bg-[var(--bg)] relative min-h-[300px]">
                {(selectedVariant?.imagen_url || selectedProduct.imagen_url) ? (
                  <img src={getImageUrl(selectedVariant?.imagen_url || selectedProduct.imagen_url)} alt={selectedProduct.name} className="w-full h-full object-cover absolute inset-0" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center absolute inset-0">
                     <Tag size={48} className="text-[var(--txt-muted)]" />
                  </div>
                )}
              </div>

              <div className="md:w-1/2 p-8 flex flex-col overflow-y-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--txt-secondary)] mb-2 block">
                  {selectedProduct.category || 'Otros'}
                </span>
                <h2 className="text-2xl font-bold mb-2 leading-tight">
                  {selectedProduct.name}
                </h2>
                <span className="font-mono text-[10px] font-bold bg-[var(--bg)] border border-[var(--border)] text-[var(--txt-secondary)] px-2 py-1 rounded-md w-max mb-6 block">
                  SKU: {selectedVariant?.sku || selectedProduct.items[0]?.sku}
                </span>

                {/* Selector de variantes */}
                {selectedProduct.items.length > 1 && (
                  <div className="mb-6 flex flex-col gap-4">
                    {Object.keys(allAttributesGrouped).length > 0 ? (
                      Object.entries(allAttributesGrouped).map(([key, values]) => (
                        <div key={key}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--txt-secondary)] mb-2 block">
                            {key}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {values.map(val => {
                              const isSelected = selectedAttributes[key] === val;

                              // Check if there is any variant in selectedProduct that has this attribute value
                              // AND matches the other selected attributes, AND has stock > 0.
                              // In PublicCatalogPage, stock is usually in 'stock' or 'cantidadTotal'. Let's check both 'stock' and 'cantidadTotal'.
                              const hasStock = selectedProduct.items.some(item => {
                                const attrs = item.attributes || {};
                                if (attrs[key] !== val) return false;

                                // Check other selected attributes
                                for (const [k, v] of Object.entries(selectedAttributes)) {
                                  if (k === key) continue; // ignore current attribute key
                                  if (attrs[k] !== v) return false;
                                }
                                const stockVal = item.stock !== undefined ? item.stock : (item.cantidadTotal !== undefined ? item.cantidadTotal : 0);
                                return stockVal > 0;
                              });

                              return (
                                <div
                                  key={val}
                                  role="button"
                                  onClick={() => handleSelectAttribute(key, val)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-sm'
                                      : !hasStock
                                        ? 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-500 opacity-60'
                                        : 'bg-transparent border-slate-200 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {val}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--txt-secondary)] mb-2 block">
                          Selecciona una variante
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.items.map(variant => {
                            const label = getVariantLabel(variant);
                            const isSelected = selectedVariant?.id === variant.id;
                            return (
                              <div
                                key={variant.id}
                                role="button"
                                onClick={() => setSelectedVariant(variant)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-sm'
                                    : 'bg-transparent border-slate-200 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {label || 'Única'} (Bs {Number(variant.precioVenta).toFixed(0)})
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-6 flex-grow">
                  <div className="text-sm leading-relaxed mb-4 text-[var(--txt-secondary)]">
                    {selectedVariant?.attributes && Object.keys(selectedVariant.attributes).length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {Object.entries(selectedVariant.attributes).map(([key, val]) => val ? (
                          <div key={key} className="flex items-center justify-between border-b border-[var(--border)] pb-2 last:border-0 last:pb-0">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--txt-muted)]">{key}</span>
                            <span className="text-sm font-medium text-[var(--txt-primary)]">{val}</span>
                          </div>
                        ) : null)}
                        {(selectedVariant?.description || selectedProduct.description) && (
                          <div className="mt-4 pt-4 border-t border-[var(--border)] text-xs text-[var(--txt-muted)]">
                            <span className="font-semibold block uppercase tracking-wider mb-1">Descripción:</span>
                            <span className="text-sm text-[var(--txt-secondary)]">{selectedVariant?.description || selectedProduct.description}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-semibold block uppercase tracking-wider text-[var(--txt-muted)] mb-1">Descripción:</span>
                        <p className="text-sm text-[var(--txt-secondary)]">{selectedVariant?.description || selectedProduct.description || 'Este producto no cuenta con especificaciones adicionales.'}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[var(--bg)] p-5 rounded-2xl border border-[var(--border)] mb-6 flex justify-between items-center">
                   <span className="text-sm font-semibold text-[var(--txt-secondary)]">Precio</span>
                   <span className="text-2xl font-black">
                     Bs {Number(selectedVariant?.precioVenta || selectedProduct.precioVenta).toFixed(2)}
                   </span>
                </div>

                <button 
                  onClick={() => { 
                    if (selectedVariant) {
                      addToCart(selectedVariant); 
                      setSelectedProduct(null); 
                      setIsCartOpen(true); 
                    }
                  }}
                  className="w-full bg-[var(--txt-primary)] text-[var(--bg-card)] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 mb-3 transition-transform hover:scale-[1.02] shadow-sm"
                >
                  <ShoppingCart size={18} /> Añadir al Pedido
                </button>

                <p className="text-[10px] text-center text-[var(--txt-muted)] font-medium uppercase tracking-wider">
                  Coordinarás el pedido por WhatsApp
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Botón flotante del carrito */}
      <AnimatePresence>
        {cartItemsCount > 0 && !isCartOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-[var(--txt-primary)] text-[var(--bg-card)] rounded-full p-4 shadow-xl flex items-center gap-3 transition-transform hover:scale-105"
          >
            <div className="relative">
              <ShoppingCart size={22} />
              <span className="absolute -top-2 -right-3 bg-rose-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-[var(--bg-card)]">
                {cartItemsCount}
              </span>
            </div>
            <span className="font-bold text-sm pr-1">Bs {cartTotal.toFixed(2)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal Carrito (Drawer Right) */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[var(--bg-card)] h-full shadow-2xl flex flex-col border-l border-[var(--border)]"
            >
              <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg)]">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShoppingCart size={20} /> Mi Pedido
                </h2>
                <button 
                  onClick={() => setIsCartOpen(false)} 
                  className="flex items-center justify-center bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition-all p-2.5 rounded-full shadow-md border border-slate-800/20 hover:scale-105"
                  title="Cerrar Pedido"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
                {cart.length === 0 ? (
                  <div className="text-center text-[var(--txt-muted)] my-auto pb-10 flex flex-col items-center justify-center h-full">
                    <ShoppingCart size={40} className="opacity-30 mb-4" strokeWidth={1.5} />
                    Tu pedido está vacío.
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)] flex gap-4 items-center">
                      <div className="w-14 h-14 bg-[var(--bg-card)] rounded-lg overflow-hidden flex-shrink-0 border border-[var(--border)]">
                        {item.imagen_url ? (
                          <img src={getImageUrl(item.imagen_url)} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Tag size={16} className="text-[var(--txt-muted)]"/></div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-sm leading-tight line-clamp-1 mb-1">{item.name}</h4>
                          <span className="font-bold text-xs text-[var(--txt-secondary)]">Bs {Number(item.precioVenta).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span 
                            role="button"
                            onClick={() => removeFromCart(item.id)} 
                            className="w-6 h-6 bg-slate-100 hover:bg-slate-900 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-white dark:hover:text-slate-900 border border-slate-300 dark:border-slate-700 rounded-md flex items-center justify-center transition-colors cursor-pointer text-slate-800"
                          >
                            <Minus size={12} strokeWidth={3} />
                          </span>
                          <span className="font-bold text-xs min-w-[12px] text-center">{item.quantity}</span>
                          <span 
                            role="button"
                            onClick={() => addToCart(item)} 
                            className="w-6 h-6 bg-slate-100 hover:bg-slate-900 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-white dark:hover:text-slate-900 border border-slate-300 dark:border-slate-700 rounded-md flex items-center justify-center transition-colors cursor-pointer text-slate-800"
                          >
                            <Plus size={12} strokeWidth={3} />
                          </span>
                        </div>
                      </div>
                      <div className="text-right pl-2 shrink-0">
                         <span className="font-bold text-sm whitespace-nowrap block">Bs {(item.precioVenta * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-[var(--border)] bg-[var(--bg)]">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[var(--txt-secondary)] font-semibold text-sm">Total estimado</span>
                    <span className="text-xl font-black">Bs {cartTotal.toFixed(2)}</span>
                  </div>
                  <button onClick={sendWhatsApp} className="w-full bg-[#0d1b2a] hover:bg-[#1a2e42] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-sm border-none cursor-pointer">
                    <Send size={18} /> Confirmar por WhatsApp
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center text-[var(--txt-muted)] text-xs font-semibold uppercase tracking-widest">
        Desarrollado en BolClick &copy; 2026
      </div>
      </div>
    </div>
  );
}
