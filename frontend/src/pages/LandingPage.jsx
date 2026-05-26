import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  MapPin, 
  Smartphone, 
  BookOpen, 
  FileText, 
  Bell, 
  Globe,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      
      {/* Navigation Bar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 py-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center p-1.5 shadow-sm shadow-indigo-600/20">
                <img src="/logo.png" alt="BolClick Logo" className="w-full h-full object-contain filter invert brightness-200" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">BolClick</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-sm transition-all duration-150 active:scale-[0.97]">
                Registrar Tienda
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-36 bg-slate-950 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
          <div className="absolute -top-40 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl"></div>
          <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 font-semibold text-xs rounded-full border border-indigo-500/20 mb-6 uppercase tracking-wider">
              <Zap size={12} /> Gestión Comercial Multi-Sucursal
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
              Controla tu negocio <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">sin complicaciones</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 mb-10 font-medium max-w-xl mx-auto leading-relaxed">
              La plataforma administrativa SaaS definitiva para el control de inventario en tiempo real, alertas inteligentes y facturación electrónica.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto px-8 py-3.5 rounded-lg font-semibold text-base shadow-lg shadow-indigo-600/10 transition-all duration-150 active:scale-[0.98]">
                Comenzar gratis
              </Link>
              <a href="#features" className="text-slate-300 border border-slate-800 hover:bg-slate-900 w-full sm:w-auto px-8 py-3.5 rounded-lg font-semibold text-base transition-all">
                Ver Funcionalidades
              </a>
            </div>
          </div>

          {/* Simple Mockup Placeholder */}
          <div className="mt-16 lg:mt-24 relative max-w-5xl mx-auto">
            <div className="bg-slate-900 rounded-2xl p-2.5 shadow-2xl shadow-indigo-950/20 border border-slate-800 overflow-hidden">
              <div className="bg-slate-950 rounded-xl overflow-hidden aspect-video border border-slate-800 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                    <Zap size={32} className="text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">BolClick Dashboard</h3>
                  <p className="text-slate-500 text-sm max-w-sm">Haz login o regístrate para acceder al panel de facturación, lotes y sucursales en tiempo real.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Diseñado para dueños de múltiples locales
            </h2>
            <p className="text-lg text-slate-600 font-medium leading-relaxed">
              BolClick centraliza todas las operaciones críticas de tus sucursales en una interfaz unificada y fluida.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<TrendingUp size={24} className="text-indigo-600" />}
              title="Salud Financiera"
              description="Toma decisiones estratégicas basándote en márgenes brutos de venta, costos y rentabilidad en tiempo real."
            />
            <FeatureCard 
              icon={<Globe size={24} className="text-indigo-600" />}
              title="Vista Consolidada"
              description="Observa el desempeño global o aísla la información por sucursal específica con filtros dinámicos instantáneos."
            />
            <FeatureCard 
              icon={<Smartphone size={24} className="text-indigo-600" />}
              title="Terminal de Ventas POS"
              description="Una interfaz ágil construida para no detenerse nunca, permitiendo facturación y cobros rápidos en segundos."
            />
            <FeatureCard 
              icon={<BookOpen size={24} className="text-indigo-600" />}
              title="Catálogo Centralizado"
              description="Administra productos, variantes, precios de compra y venta desde un solo catálogo compartido para todas tus tiendas."
            />
            <FeatureCard 
              icon={<FileText size={24} className="text-indigo-600" />}
              title="Comprobantes Digitales"
              description="Genera recibos y facturas en formato PDF al instante, guardándolos localmente para auditorías seguras."
            />
            <FeatureCard 
              icon={<Bell size={24} className="text-indigo-600" />}
              title="Alertas de Stock"
              description="Alertas inteligentes automáticas que detectan el bajo stock por sucursal y facilitan órdenes de reabastecimiento."
            />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-slate-950 py-24 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-6">
            Lleva el control de tus tiendas al siguiente nivel
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Únete a cientos de comercios que optimizan su stock y facturación diariamente. Crea tu espacio de trabajo hoy mismo.
          </p>
          <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-lg font-semibold text-lg shadow-lg shadow-indigo-600/15 transition-all duration-150 active:scale-[0.98]">
            Crear espacio de trabajo
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-16 border-t border-slate-200/60 text-slate-500">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center p-1.5 shadow-sm shadow-indigo-600/20">
                  <img src="/logo.png" alt="BolClick Logo" className="w-full h-full object-contain filter invert brightness-200" />
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-900">BolClick</span>
              </div>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                La plataforma de gestión comercial SaaS diseñada para simplificar el retail de múltiples sucursales en Bolivia.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs tracking-wider uppercase mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">Funcionalidades</li>
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">Sucursales</li>
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">Seguridad</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs tracking-wider uppercase mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li>info@bolclick.com</li>
                <li>Soporte Técnico</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p>© {new Date().getFullYear()} BolClick. Todos los derechos reservados.</p>
            <div className="flex gap-4 font-semibold text-slate-400 uppercase tracking-wider">
              <span className="hover:text-slate-900 cursor-pointer transition-colors">PRIVACIDAD</span>
              <span className="hover:text-slate-900 cursor-pointer transition-colors">TÉRMINOS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Subcomponent: Simple Clean Feature Card
function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 transition-all duration-150 hover:border-slate-300 hover:shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center shadow-sm mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
