import React from 'react';
import { esAR } from '../i18n/es-AR';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-slate-900 text-slate-400 py-8 text-xs border-t border-slate-800 mb-14 md:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-bold text-white tracking-wide">TRONNO</span> — Marketplace de baños en Argentina.
          <p className="mt-1 text-slate-400">
            Precios expresados en Pesos Argentinos ({esAR.currency}). Zona horaria: {esAR.timezoneLabel}.
          </p>
        </div>
        <div className="flex gap-4 text-slate-400">
          <span>&copy; {new Date().getFullYear()} Tronno Argentina</span>
        </div>
      </div>
    </footer>
  );
};
