import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  AlertCircle,
  Clock,
  DollarSign,
  MapPin,
  Sparkles,
  Save,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { Bathroom } from '../../types/bathroom';
import { updateBathroom } from '../../lib/api';

interface EditBathroomModalProps {
  isOpen: boolean;
  bathroom: Bathroom | null;
  onClose: () => void;
  onSuccess: () => void;
}

const POPULAR_AMENITIES = [
  'Ducha con agua caliente',
  'Accesible silla de ruedas',
  'Cambiador de bebés',
  'Papel higiénico & jabón',
  'Espejo amplio',
  'Toallas descartables',
  'Enchufe disponible',
  'Secador de manos',
];

export const EditBathroomModal: React.FC<EditBathroomModalProps> = ({
  isOpen,
  bathroom,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [priceBase, setPriceBase] = useState(600);
  const [turnDuration, setTurnDuration] = useState(15);
  const [cleaningInterval, setCleaningInterval] = useState(5);
  const [isActive, setIsActive] = useState(true);
  const [amenities, setAmenities] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync form state when bathroom changes
  useEffect(() => {
    if (bathroom) {
      setTitle(bathroom.title || '');
      setDescription(bathroom.description || '');
      setAddress(bathroom.address || '');
      setCity(bathroom.city || 'Buenos Aires');
      setPriceBase(bathroom.price_base || 600);
      setTurnDuration(bathroom.turn_duration_minutes || 15);
      setCleaningInterval(bathroom.cleaning_interval_minutes || 5);
      setIsActive(bathroom.is_active ?? true);
      setAmenities(bathroom.amenities || []);
      setErrorMsg(null);
    }
  }, [bathroom]);

  if (!isOpen || !bathroom) return null;

  const handleToggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await updateBathroom(bathroom.id, {
        title,
        description,
        address,
        city,
        price_base: Number(priceBase),
        turn_duration_minutes: Number(turnDuration),
        cleaning_interval_minutes: Number(cleaningInterval),
        is_active: isActive,
        amenities,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar las características del baño.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider block">
              Vendedor • Configuración
            </span>
            <h2 className="text-xl font-bold text-slate-900">Modificar características del baño</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Título & Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">Nombre del Baño / Local</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Café & Baño Premium San Telmo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Disponibilidad</label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  isActive
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-amber-300 bg-amber-50 text-amber-800'
                }`}
              >
                {isActive ? (
                  <>
                    <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Activo</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pausado</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dirección y Ciudad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Dirección
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. San Martín 2450"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Ciudad</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. Santa Fe / Buenos Aires"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          {/* Precios y Tiempos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Precio base (ARS)
              </label>
              <input
                type="number"
                min={200}
                step={50}
                required
                value={priceBase}
                onChange={(e) => setPriceBase(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                Duración turno (min)
              </label>
              <select
                value={turnDuration}
                onChange={(e) => setTurnDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value={10}>10 minutos</option>
                <option value={15}>15 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Limpieza entre turnos
              </label>
              <select
                value={cleaningInterval}
                onChange={(e) => setCleaningInterval(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value={0}>Sin intervalo</option>
                <option value={5}>5 minutos</option>
                <option value={10}>10 minutos</option>
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Descripción del espacio</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describí las comodidades de higiene, ambiente y ubicación dentro de tu local..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          {/* Características / Comodidades (Amenities) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Características & Equipamiento (Amenities)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POPULAR_AMENITIES.map((item) => {
                const isSelected = amenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleToggleAmenity(item)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-colors ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 text-sky-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-sky-600 border-sky-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando cambios...' : 'Guardar modificaciones'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
