import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  Navigation,
  ArrowRight,
} from 'lucide-react';
import { BathroomSearchResult, BathroomExtra } from '../../types/bathroom';
import { formatARS } from '../../lib/utils';

interface BathroomDetailModalProps {
  bathroom: BathroomSearchResult | null;
  onClose: () => void;
  onBookTurn?: (bathroom: BathroomSearchResult, selectedExtras: BathroomExtra[]) => void;
}

export const BathroomDetailModal: React.FC<BathroomDetailModalProps> = ({
  bathroom,
  onClose,
  onBookTurn,
}) => {
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!bathroom) return null;

  const toggleExtra = (extraId: string) => {
    setSelectedExtraIds((prev) =>
      prev.includes(extraId) ? prev.filter((id) => id !== extraId) : [...prev, extraId]
    );
  };

  const selectedExtras = (bathroom.extras || []).filter((ex) =>
    ex.id ? selectedExtraIds.includes(ex.id) : false
  );

  const extrasTotal = selectedExtras.reduce((sum, ex) => sum + ex.price, 0);
  const grandTotal = bathroom.price_base + extrasTotal;

  const handleBooking = () => {
    if (onBookTurn) {
      onBookTurn(bathroom, selectedExtras);
    }
  };

  const photos = bathroom.photos || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header photo gallery */}
        <div className="relative h-64 bg-slate-950 overflow-hidden flex-shrink-0">
          {photos.length > 0 ? (
            <img
              src={photos[activePhotoIdx]?.url || photos[0]?.url}
              alt={bathroom.title}
              className="w-full h-full object-cover opacity-95"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
              <span className="text-sm">Sin fotos cargadas</span>
            </div>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges on photo */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-900 shadow-sm">
              <Navigation className="w-3.5 h-3.5 text-sky-600" />
              {bathroom.distance_km < 1
                ? `a ${bathroom.distance_meters} m`
                : `a ${bathroom.distance_km} km`}
            </span>

            {bathroom.is_approved && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900/75 text-white backdrop-blur-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                Verificado
              </span>
            )}
          </div>

          {/* Gallery thumbnails */}
          {photos.length > 1 && (
            <div className="absolute bottom-3 left-4 right-4 flex gap-2 overflow-x-auto pb-1">
              {photos.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`w-14 h-10 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activePhotoIdx === idx ? 'border-white scale-105' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={p.url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900">{bathroom.title}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              {bathroom.address}, {bathroom.city}
            </p>
          </div>

          {bathroom.description && (
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {bathroom.description}
            </p>
          )}

          {/* Turn specs */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-sky-50/50 border border-sky-100 rounded-2xl flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-sky-600" />
              <div>
                <span className="font-bold text-slate-800 block">Duración de Turno</span>
                <span className="text-slate-500 text-[11px]">{bathroom.turn_duration_minutes} minutos exclusivos</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-bold text-slate-800 block">Higiene Garantizada</span>
                <span className="text-slate-500 text-[11px]">Desinfección previa al ingreso</span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {bathroom.amenities && bathroom.amenities.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800">Comodidades incluidas</h3>
              <div className="flex flex-wrap gap-1.5">
                {bathroom.amenities.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-xl font-medium inline-flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chargeable Extras */}
          {bathroom.extras && bathroom.extras.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-800">Extras opcionales disponibles</h3>
              <div className="space-y-2">
                {bathroom.extras.map((extra) => {
                  const isChecked = extra.id ? selectedExtraIds.includes(extra.id) : false;
                  return (
                    <button
                      key={extra.id || extra.name}
                      type="button"
                      onClick={() => extra.id && toggleExtra(extra.id)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-sky-500 bg-sky-50/50 text-sky-950 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-sky-600 border-sky-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold">{extra.name}</span>
                          {extra.description && (
                            <span className="text-[11px] text-slate-500 block">
                              {extra.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        +{formatARS(extra.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with grand total and action */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Total por el turno</span>
            <span className="text-2xl font-black text-slate-900">
              {formatARS(grandTotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleBooking}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-sm transition-all"
          >
            <span>Reservar Turno</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
