import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Store, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { esAR } from '../i18n/es-AR';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './RoleBadge';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Top Desktop/Tablet Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-black text-sky-600 tracking-tight">TRONNO</span>
            <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md border border-sky-200">
              Argentina
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/') ? 'text-sky-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {esAR.nav.home}
            </Link>
            <Link
              to="/usuario"
              className={`text-sm font-medium transition-colors ${
                isActive('/usuario') ? 'text-sky-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {esAR.nav.myBookings}
            </Link>
            <Link
              to="/vendedor"
              className={`text-sm font-medium transition-colors ${
                isActive('/vendedor') ? 'text-sky-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {esAR.nav.vendorArea}
            </Link>
            <Link
              to="/admin"
              className={`text-sm font-medium transition-colors ${
                isActive('/admin') ? 'text-purple-600 font-semibold' : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              {esAR.nav.adminArea}
            </Link>
            {/* DEV_QUICK_ACCESS: Enlace a accesos rápidos demo */}
            <Link
              to="/login"
              className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 border ${
                isActive('/login')
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
              title="Accesos Rápidos Demo"
            >
              <span>⚡ Roles Demo</span>
            </Link>
          </nav>

          {/* User Profile / Auth Action */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 line-clamp-1">
                    {user.full_name || user.email.split('@')[0]}
                  </span>
                  <div className="flex justify-end">
                    <RoleBadge role={user.role} />
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center border border-sky-200">
                  {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>

                <button
                  type="button"
                  onClick={logout}
                  title="Cerrar sesión"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 text-xs ${
            isActive('/') ? 'text-sky-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>{esAR.nav.home}</span>
        </Link>
        <Link
          to="/usuario"
          className={`flex flex-col items-center gap-1 text-xs ${
            isActive('/usuario') ? 'text-sky-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>{esAR.roles.user}</span>
        </Link>
        <Link
          to="/vendedor"
          className={`flex flex-col items-center gap-1 text-xs ${
            isActive('/vendedor') ? 'text-emerald-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <Store className="w-5 h-5" />
          <span>{esAR.roles.vendor}</span>
        </Link>
        <button
          type="button"
          onClick={() => (isAuthenticated ? logout() : openAuthModal('login'))}
          className="flex flex-col items-center gap-1 text-xs text-slate-500"
        >
          {isAuthenticated ? <LogOut className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
          <span>{isAuthenticated ? 'Salir' : 'Cuenta'}</span>
        </button>
      </div>
    </>
  );
};
