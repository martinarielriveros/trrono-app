import React from 'react';
import {
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Bathroom } from '../../types/bathroom';
import { formatARS } from '../../lib/utils';

interface BathroomCardProps {
  bathroom: Bathroom;
  onToggleActive?: (id: string, currentStatus: boolean) => void;
  onEdit?: (bathroom: Bathroom) => void;
  onDelete?: (bathroom: Bathroom) => void;
  isToggling?: boolean;
}

export const BathroomCard: React.FC<BathroomCardProps> = ({
  bathroom,
  onToggleActive,
  onEdit,
  onDelete,
  isToggling = false,
}) => {
  const coverPhoto = bathroom.photos.find((p) => p.is_cover)?.url || bathroom.photos[0]?.url;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Photo header */}
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={bathroom.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
            <span className="text-sm font-medium">Sin foto de portada</span>
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {bathroom.is_active ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/90 text-white backdrop-blur-sm shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Activo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/90 text-white backdrop-blur-sm shadow-sm">
              <PauseCircle className="w-3.5 h-3.5" />
              Pausado
            </span>
          )}

          {bathroom.is_approved && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-900/75 text-white backdrop-blur-sm">
              <ShieldCheck className="w-3 h-3 text-sky-400" />
              Aprobado
            </span>
          )}
        </div>

        {/* Base price tag */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-xl shadow-sm text-slate-900 font-black text-sm">
          {formatARS(bathroom.price_base)} <span className="text-xs font-normal text-slate-500">/ turno</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <h3 className="font-bold text-slate-900 text-base line-clamp-1">{bathroom.title}</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            {bathroom.address}, {bathroom.city}
          </p>
        </div>

        {/* Turn info & Extras */}
        <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            {bathroom.turn_duration_minutes} min por turno
          </span>
          {bathroom.extras && bathroom.extras.length > 0 && (
            <span className="flex items-center gap-1 font-medium text-emerald-700">
              <Sparkles className="w-3.5 h-3.5" />
              {bathroom.extras.length} extra{bathroom.extras.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Amenities preview */}
        {bathroom.amenities && bathroom.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {bathroom.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md font-medium"
              >
                {amenity}
              </span>
            ))}
            {bathroom.amenities.length > 3 && (
              <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                +{bathroom.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action buttons: Modificar, Eliminar y Pausar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(bathroom)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                title="Modificar características"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Modificar</span>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(bathroom)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                title="Eliminar baño"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            )}
          </div>

          {onToggleActive && (
            <button
              type="button"
              disabled={isToggling}
              onClick={() => onToggleActive(bathroom.id, bathroom.is_active)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                bathroom.is_active
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {bathroom.is_active ? (
                <>
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Reanudar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
