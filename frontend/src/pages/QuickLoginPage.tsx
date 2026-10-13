/**
 * DEV_QUICK_ACCESS: Vista centralizada de accesos rápidos para desarrollo y testing.
 * Permite ingresar o probar los 3 tipos de usuario: Usuario, Vendedor y Administrador.
 * 
 * NOTA: Este archivo y su ruta (/login) pueden removerse fácilmente en el futuro.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { QuickDevAuthBar } from '../components/auth/QuickDevAuthBar';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const QuickLoginPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Return back link */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      {/* Hero Title */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Ambiente de Pruebas & Demostración
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Accesos Rápidos por Rol de Usuario
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Seleccioná cualquiera de los 3 perfiles para ingresar automáticamente con usuario y contraseña preconfigurados.
        </p>
      </div>

      {/* Main Quick Access Component */}
      <QuickDevAuthBar />

      {/* Explanatory cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            👤
          </div>
          <h3 className="font-bold text-slate-900 text-base">Vista de Usuario</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Permite explorar el mapa, filtrar baños limpios con fotos reales, generar reservas, pagar con Mercado Pago y mostrar el código QR / PIN en recepción.
          </p>
          <Link
            to="/usuario"
            className="inline-block text-xs font-bold text-sky-600 hover:text-sky-700 pt-1"
          >
            Ir a Mi Cuenta (/usuario) →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            🏪
          </div>
          <h3 className="font-bold text-slate-900 text-base">Vista de Vendedor</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Panel para dueños de locales. Permite dar de alta nuevos baños, modificar sus características, pausar la recepción, eliminar baños con confirmación y escanear turnos.
          </p>
          <Link
            to="/vendedor"
            className="inline-block text-xs font-bold text-emerald-600 hover:text-emerald-700 pt-1"
          >
            Ir a Panel Vendedor (/vendedor) →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            ⚡
          </div>
          <h3 className="font-bold text-slate-900 text-base">Vista de Admin</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Supervisión integral de Tronno: métricas de facturación y comisión del 15%, moderación de baños en catálogo, cuentas bancarias CBU/CVU y liquidación de fondos.
          </p>
          <Link
            to="/admin"
            className="inline-block text-xs font-bold text-purple-600 hover:text-purple-700 pt-1"
          >
            Ir a Panel Admin (/admin) →
          </Link>
        </div>
      </div>
    </div>
  );
};
