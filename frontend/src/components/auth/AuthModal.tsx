import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
    login,
    register,
    loginWithGoogle,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'user' | 'vendor'>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const isLogin = authModalMode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password, full_name: fullName, role });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error. Verificá los datos ingresados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const demoEmail = email.includes('@') ? email : 'usuario.google@tronno.com.ar';
      await loginWithGoogle(demoEmail, role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al autenticar con Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // DEV_QUICK_ACCESS: Relleno rápido de credenciales
  const handleApplyDemoCreds = (type: 'user' | 'vendor' | 'admin') => {
    if (type === 'user') {
      setEmail('usuario.demo@tronno.com.ar');
      setPassword('Usuario123!');
      setRole('user');
    } else if (type === 'vendor') {
      setEmail('vendedor.santelmo@tronno.com.ar');
      setPassword('Vendedor123!');
      setRole('vendor');
    } else if (type === 'admin') {
      setEmail('admin@tronno.com.ar');
      setPassword('Admin12345!');
    }
  };

  React.useEffect(() => {
    const handleQuickFill = (e: any) => {
      if (e.detail) {
        handleApplyDemoCreds(e.detail);
      }
    };
    const stored = sessionStorage.getItem('tronno_quick_fill');
    if (stored) {
      handleApplyDemoCreds(stored as any);
      sessionStorage.removeItem('tronno_quick_fill');
    }
    window.addEventListener('tronno_quick_fill_event', handleQuickFill);
    return () => window.removeEventListener('tronno_quick_fill_event', handleQuickFill);
  }, [isAuthModalOpen]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 space-y-5">
          {/* Header */}
          <div className="text-center space-y-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">TRONNO</span>
            <h2 className="text-xl font-bold text-slate-900">
              {isLogin ? '¡Hola de nuevo!' : 'Creá tu cuenta gratis'}
            </h2>
            <p className="text-xs text-slate-500">
              {isLogin
                ? 'Ingresá a tu cuenta para gestionar reservas y baños.'
                : 'Empezá a usar o publicar baños seguros e higiénicos en Argentina.'}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                openAuthModal('login');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                isLogin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                openAuthModal('register');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                !isLogin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Registrarme
            </button>
          </div>

          {/* DEV_QUICK_ACCESS: Botones de acceso rápido para pruebas (fácil de remover) */}
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-amber-900 font-bold">
              <span>⚡ Completar datos de acceso rápido:</span>
              <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded">
                Demo
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyDemoCreds('user')}
                className="py-1 px-2 rounded-xl bg-white border border-amber-200 text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-800 font-semibold transition-colors text-center shadow-2xs"
              >
                👤 Usuario
              </button>
              <button
                type="button"
                onClick={() => handleApplyDemoCreds('vendor')}
                className="py-1 px-2 rounded-xl bg-white border border-amber-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 font-semibold transition-colors text-center shadow-2xs"
              >
                🏪 Vendedor
              </button>
              <button
                type="button"
                onClick={() => handleApplyDemoCreds('admin')}
                className="py-1 px-2 rounded-xl bg-white border border-amber-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-800 font-semibold transition-colors text-center shadow-2xs"
              >
                ⚡ Admin
              </button>
            </div>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* Role Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ¿Cómo vas a usar Tronno?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('user')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        role === 'user'
                          ? 'border-sky-500 bg-sky-50/50 text-sky-950 font-bold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span>Usuario</span>
                        {role === 'user' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Quiero encontrar y reservar baños
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('vendor')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        role === 'vendor'
                          ? 'border-sky-500 bg-sky-50/50 text-sky-950 font-bold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span>Vendedor</span>
                        {role === 'vendor' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Tengo un local y quiero publicar mi baño
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Martín Riveros"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@tronno.com.ar"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Registrarme'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold">
              o también
            </span>
          </div>

          {/* Google Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleGoogleAuth}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  );
};
