/**
 * DEV_QUICK_ACCESS: Componente de accesos rápidos para desarrollo y testing.
 * Permite auto-completar credenciales o iniciar sesión directamente con un click
 * para los 3 roles: Usuario, Vendedor y Admin.
 * 
 * NOTA: Diseñado para ser removido o desactivado fácilmente en producción.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Store, ShieldAlert, KeyRound, LogIn, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface QuickDevAuthBarProps {
  highlightRole?: 'user' | 'vendor' | 'admin';
  compact?: boolean;
}

export const DEMO_CREDENTIALS = {
  user: {
    role: 'user' as const,
    label: 'Usuario',
    email: 'usuario.demo@tronno.com.ar',
    password: 'Usuario123!',
    path: '/usuario',
    description: 'Encuentra y reserva baños higiénicos con PIN y QR.',
    color: 'sky',
  },
  vendor: {
    role: 'vendor' as const,
    label: 'Vendedor',
    email: 'vendedor.santelmo@tronno.com.ar',
    password: 'Vendedor123!',
    path: '/vendedor',
    description: 'Publica baños, modifica características y gestiona turnos.',
    color: 'emerald',
  },
  admin: {
    role: 'admin' as const,
    label: 'Admin',
    email: 'admin@tronno.com.ar',
    password: 'Admin12345!',
    path: '/admin',
    description: 'Modera baños, aprueba vendors y audita liquidaciones.',
    color: 'purple',
  },
};

export const QuickDevAuthBar: React.FC<QuickDevAuthBarProps> = ({
  highlightRole,
  compact = false,
}) => {
  const { user, isAuthenticated, login, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleQuickLogin = async (roleKey: 'user' | 'vendor' | 'admin') => {
    const creds = DEMO_CREDENTIALS[roleKey];
    setLoadingRole(roleKey);
    try {
      await login({ email: creds.email, password: creds.password });
      navigate(creds.path);
    } catch (err: any) {
      alert(err.message || 'Error al iniciar sesión rápida.');
    } finally {
      setLoadingRole(null);
    }
  };

  const handleFillForm = (roleKey: 'user' | 'vendor' | 'admin') => {
    // Abre el modal con las credenciales cargadas
    openAuthModal('login');
    // Despachamos un evento o guardamos en session para que AuthModal lo capture
    sessionStorage.setItem('tronno_quick_fill', roleKey);
    window.dispatchEvent(new CustomEvent('tronno_quick_fill_event', { detail: roleKey }));
  };

  if (compact) {
    return (
      <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-amber-300">Accesos Rápidos Demo:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['user', 'vendor', 'admin'] as const).map((rKey) => {
            const item = DEMO_CREDENTIALS[rKey];
            const isCurrent = isAuthenticated && user?.role === item.role;
            return (
              <button
                key={rKey}
                type="button"
                disabled={loadingRole !== null}
                onClick={() => handleQuickLogin(rKey)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <span>{item.label}</span>
                {isCurrent && <CheckCircle2 className="w-3 h-3 text-slate-950" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                Accesos Rápidos Demo
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                Para testing / Fácil de remover
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Iniciá sesión o completá usuario y contraseña con un click para probar cada vista.
            </p>
          </div>
        </div>

        {/* Current user badge */}
        {isAuthenticated && user && (
          <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">Activo:</span>
            <span className="font-bold text-amber-300">{user.email}</span>
            <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-slate-700 rounded text-slate-200">
              {user.role}
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-[11px] text-rose-400 hover:text-rose-300 underline ml-1"
            >
              Salir
            </button>
          </div>
        )}
      </div>

      {/* Grid of 3 roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Usuario Card */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            highlightRole === 'user' || (isAuthenticated && user?.role === 'user')
              ? 'bg-sky-950/40 border-sky-500 shadow-md ring-1 ring-sky-500/40'
              : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-sky-300">Usuario</span>
            </div>
            {isAuthenticated && user?.role === 'user' && (
              <span className="text-[10px] font-bold bg-sky-500 text-slate-950 px-2 py-0.5 rounded-full">
                Sesión Actual
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-300 space-y-0.5 mb-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
            <div>
              <span className="text-slate-400">Email:</span>{' '}
              <code className="text-sky-300">{DEMO_CREDENTIALS.user.email}</code>
            </div>
            <div>
              <span className="text-slate-400">Pass:</span>{' '}
              <code className="text-sky-300">{DEMO_CREDENTIALS.user.password}</code>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loadingRole !== null}
              onClick={() => handleQuickLogin('user')}
              className="py-2 px-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{loadingRole === 'user' ? 'Entrando...' : 'Ingresar'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillForm('user')}
              className="py-2 px-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
            >
              <KeyRound className="w-3 h-3 text-sky-400" />
              <span>Auto-rellenar</span>
            </button>
          </div>
        </div>

        {/* Vendedor Card */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            highlightRole === 'vendor' || (isAuthenticated && user?.role === 'vendor')
              ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
              : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-emerald-300">Vendedor</span>
            </div>
            {isAuthenticated && user?.role === 'vendor' && (
              <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                Sesión Actual
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-300 space-y-0.5 mb-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
            <div>
              <span className="text-slate-400">Email:</span>{' '}
              <code className="text-emerald-300">{DEMO_CREDENTIALS.vendor.email}</code>
            </div>
            <div>
              <span className="text-slate-400">Pass:</span>{' '}
              <code className="text-emerald-300">{DEMO_CREDENTIALS.vendor.password}</code>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loadingRole !== null}
              onClick={() => handleQuickLogin('vendor')}
              className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{loadingRole === 'vendor' ? 'Entrando...' : 'Ingresar'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillForm('vendor')}
              className="py-2 px-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
            >
              <KeyRound className="w-3 h-3 text-emerald-400" />
              <span>Auto-rellenar</span>
            </button>
          </div>
        </div>

        {/* Admin Card */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            highlightRole === 'admin' || (isAuthenticated && user?.role === 'admin')
              ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/40'
              : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-purple-300">Admin</span>
            </div>
            {isAuthenticated && user?.role === 'admin' && (
              <span className="text-[10px] font-bold bg-purple-500 text-slate-950 px-2 py-0.5 rounded-full">
                Sesión Actual
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-300 space-y-0.5 mb-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
            <div>
              <span className="text-slate-400">Email:</span>{' '}
              <code className="text-purple-300">{DEMO_CREDENTIALS.admin.email}</code>
            </div>
            <div>
              <span className="text-slate-400">Pass:</span>{' '}
              <code className="text-purple-300">{DEMO_CREDENTIALS.admin.password}</code>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loadingRole !== null}
              onClick={() => handleQuickLogin('admin')}
              className="py-2 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{loadingRole === 'admin' ? 'Entrando...' : 'Ingresar'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillForm('admin')}
              className="py-2 px-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
            >
              <KeyRound className="w-3 h-3 text-purple-400" />
              <span>Auto-rellenar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
