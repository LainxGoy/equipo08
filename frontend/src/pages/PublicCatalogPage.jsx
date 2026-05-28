import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { Search, Loader2, PackageSearch, Tag, Info, ArrowLeft, Store, X, ShoppingCart, Plus, Minus, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicCatalogPage() {
  const { domain } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1624] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-400 mb-4" size={48} />
        <h2 className="text-xl font-bold text-white tracking-tight">Cargando Catálogo...</h2>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a1624] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
          <Store className="text-rose-400" size={48} />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Tienda no encontrada</h2>
        <p className="text-white/50 mb-8 max-w-md">{error}</p>
        <Link to="/" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const { tienda, productos } = data;

  // Extraer categorías únicas
  const categorias = ['ALL', ...new Set(productos.map(p => p.category || 'Otros'))];

  // Filtrado
  const filteredProducts = productos.filter(p => {
    if (filterCategory !== 'ALL' && (p.category || 'Otros') !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a1624] pb-20 font-sans text-white">
      {/* Navbar Minimalista */}
      <nav className="bg-[#0a1624]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors font-semibold text-sm">
            <ArrowLeft size={18} />
            <span>Volver al Mall</span>
          </Link>
          <div className="font-black text-xl text-white tracking-tighter">
            {tienda.name}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-[#0c1929] border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_15%,rgba(24,78,119,0.28)_0%,transparent_65%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 flex flex-col md:flex-row items-center gap-8">
          {tienda.logoUrl ? (
            <img src={tienda.logoUrl} alt={tienda.name} className="w-32 h-32 rounded-2xl object-cover shadow-xl border-4 border-[#111c2e]" />
          ) : (
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl border-4 border-[#111c2e] flex items-center justify-center text-white text-5xl font-black">
              {tienda.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
              {tienda.name}
            </h1>
            <p className="text-lg text-white/50 font-medium max-w-2xl">
              Explora nuestro catálogo digital y descubre los mejores productos que tenemos para ti.
            </p>
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#111c2e] rounded-2xl p-4 shadow-sm border border-white/5 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#0a1624] border border-white/10 rounded-xl text-sm font-semibold text-white focus:bg-[#111c2e] focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-white/30"
            />
          </div>
          <div className="w-full md:w-auto flex overflow-x-auto pb-2 md:pb-0 hide-scrollbar gap-2">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  filterCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat === 'ALL' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredProducts.length === 0 ? (
          <div className="bg-[#111c2e] rounded-3xl border border-white/5 p-16 text-center flex flex-col items-center justify-center">
            <PackageSearch size={64} className="text-white/20 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No se encontraron productos</h3>
            <p className="text-white/50">Intenta buscar con otros términos o cambia la categoría.</p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredProducts.map(p => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  className="bg-[#111c2e] rounded-3xl border border-white/5 shadow-sm overflow-hidden flex flex-col group cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30"
                  onClick={() => setSelectedProduct(p)}
                >
                  <div className="aspect-square relative bg-[#0a1624] overflow-hidden">
                    {p.imagen_url ? (
                      <img 
                        src={p.imagen_url} 
                        alt={p.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0c1929] to-[#111c2e] flex items-center justify-center">
                        <Tag size={48} className="text-white/10" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-black/60 backdrop-blur border border-white/10 px-2.5 py-1 rounded-lg text-xs font-black text-white shadow-sm">
                        {p.category || 'Otros'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex-grow">
                      <h3 className="font-black text-lg text-white leading-tight mb-1 group-hover:text-indigo-400 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs text-white/50 font-semibold mb-3 line-clamp-2">
                        {p.description || 'Sin descripción detallada'}
                      </p>
                    </div>
                    <div className="flex items-end justify-between mt-4">
                      <div>
                        <span className="text-xs font-bold text-white/40 block mb-0.5">Precio</span>
                        <span className="font-black text-xl text-indigo-400">Bs {Number(p.precioVenta).toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                         <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-lg block">
                           En Stock
                         </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Modal de Detalle de Producto */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-[#0c1929] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-white/10"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-md p-2 rounded-full text-white/60 hover:text-white transition-colors border border-white/10"
              >
                <X size={20} />
              </button>

              {/* Imagen Product Modal */}
              <div className="md:w-1/2 bg-[#0a1624] relative min-h-[300px]">
                {selectedProduct.imagen_url ? (
                  <img src={selectedProduct.imagen_url} alt={selectedProduct.name} className="w-full h-full object-cover absolute inset-0" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center absolute inset-0 bg-gradient-to-br from-[#0c1929] to-[#111c2e]">
                     <Tag size={64} className="text-white/10" />
                  </div>
                )}
              </div>

              {/* Contenido Modal */}
              <div className="md:w-1/2 p-8 flex flex-col overflow-y-auto">
                <span className="text-indigo-400 font-bold text-sm tracking-wider uppercase mb-2">
                  {selectedProduct.category || 'Otros'}
                </span>
                <h2 className="text-3xl font-black text-white mb-2 leading-tight">
                  {selectedProduct.name}
                </h2>
                <span className="font-mono text-xs font-bold bg-white/5 text-white/50 px-2 py-1 rounded w-max mb-6 border border-white/5">
                  SKU: {selectedProduct.sku}
                </span>

                <div className="mb-6 flex-grow">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Info size={16} className="text-indigo-400" /> Descripción
                  </h4>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {selectedProduct.description || 'Este producto no cuenta con una descripción detallada por el momento.'}
                  </p>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-6">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-bold text-white/50">Disponibilidad</span>
                     <span className="text-sm font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-lg">
                       Disponible
                     </span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm font-bold text-white/50">Precio Regular</span>
                     <span className="text-2xl font-black text-white">
                       Bs {Number(selectedProduct.precioVenta).toFixed(2)}
                     </span>
                   </div>
                </div>

                <button 
                  onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); setIsCartOpen(true); }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 mb-4 transition-transform hover:scale-[1.02] shadow-lg shadow-emerald-500/20"
                >
                  <ShoppingCart size={20} /> Añadir al Pedido
                </button>

                <p className="text-xs text-center text-white/30 font-medium">
                  Este es un catálogo puramente informativo. Al pedir, serás redirigido a WhatsApp para coordinar con la tienda.
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
            className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-4 shadow-lg shadow-emerald-500/30 flex items-center gap-4 transition-transform hover:scale-105"
          >
            <div className="relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-3 bg-rose-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-emerald-500">
                {cartItemsCount}
              </span>
            </div>
            <span className="font-black text-lg pr-2">Bs {cartTotal.toFixed(2)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal Carrito (Drawer Right) */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[#0c1929] h-full shadow-2xl flex flex-col border-l border-white/10"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <ShoppingCart className="text-emerald-400" /> Mi Pedido
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="text-white/50 hover:text-white p-2">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {cart.length === 0 ? (
                  <div className="text-center text-white/50 my-auto pb-10 flex flex-col items-center justify-center h-full">
                    <ShoppingCart size={48} className="opacity-20 mb-4" />
                    Tu carrito está vacío.
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="bg-[#111c2e] p-4 rounded-2xl border border-white/5 flex gap-4 items-center">
                      <div className="w-16 h-16 bg-[#0a1624] rounded-xl overflow-hidden flex-shrink-0">
                        {item.imagen_url ? (
                          <img src={item.imagen_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Tag size={20} className="text-white/20"/></div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-white font-bold text-sm leading-tight line-clamp-1">{item.name}</h4>
                          <span className="text-indigo-400 font-black text-sm">Bs {Number(item.precioVenta).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 rounded-full flex items-center justify-center text-white/70 transition-colors">
                            <Minus size={14} />
                          </button>
                          <span className="text-white font-bold text-sm min-w-[12px] text-center">{item.quantity}</span>
                          <button onClick={() => addToCart(item)} className="w-7 h-7 bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 rounded-full flex items-center justify-center text-white/70 transition-colors">
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="text-right pl-2">
                         <span className="font-black text-white block">Bs {(item.precioVenta * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-[#0a1624]">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-white/60 font-bold">Total estimado</span>
                    <span className="text-2xl font-black text-white">Bs {cartTotal.toFixed(2)}</span>
                  </div>
                  <button onClick={sendWhatsApp} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-lg shadow-emerald-500/20">
                    <Send size={20} /> Confirmar por WhatsApp
                  </button>
                  <p className="text-xs text-center text-white/30 mt-4">
                    Serás redirigido a WhatsApp para enviar el detalle de tu pedido a la tienda.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer minimalista */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center text-white/30 text-sm font-semibold">
        Desarrollado en MallLink &copy; 2026
      </div>
    </div>
  );
}
