import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  bathroomTitle: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  bathroomTitle,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header decoration */}
        <div className="p-6 pb-4 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-100">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="text-lg font-bold text-slate-900">¿Eliminar este baño?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Esta acción no se puede deshacer. Se removerá del mapa y los usuarios no podrán reservarlo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bathroom info preview */}
        <div className="px-6 py-3 mx-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
          <span className="text-slate-400 block text-[11px] font-medium">Baño a eliminar:</span>
          <span className="font-bold text-slate-900 text-sm">{bathroomTitle}</span>
        </div>

        {/* Actions */}
        <div className="p-6 pt-5 flex items-center justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Eliminando...' : 'Sí, eliminar definitivamente'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
