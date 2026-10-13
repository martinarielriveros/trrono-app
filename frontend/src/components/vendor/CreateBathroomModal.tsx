import React, { useState } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  MapPin,
  Clock,
  Sparkles,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { BathroomCreateInput, BathroomPhoto, OpeningHourDay } from '../../types/bathroom';
import { uploadImage, createBathroom } from '../../lib/api';

interface CreateBathroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_HOURS: OpeningHourDay[] = [
  { day_of_week: 0, day_name: 'Lunes', open_time: '08:00', close_time: '20:00', is_closed: false },
  { day_of_week: 1, day_name: 'Martes', open_time: '08:00', close_time: '20:00', is_closed: false },
  { day_of_week: 2, day_name: 'Miércoles', open_time: '08:00', close_time: '20:00', is_closed: false },
  { day_of_week: 3, day_name: 'Jueves', open_time: '08:00', close_time: '20:00', is_closed: false },
  { day_of_week: 4, day_name: 'Viernes', open_time: '08:00', close_time: '21:00', is_closed: false },
  { day_of_week: 5, day_name: 'Sábado', open_time: '09:00', close_time: '21:00', is_closed: false },
  { day_of_week: 6, day_name: 'Domingo', open_time: '10:00', close_time: '18:00', is_closed: false },
];

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

const BUENOS_AIRES_PRESETS = [
  { name: 'San Telmo (Defensa y Humberto 1°)', lat: -34.6212, lng: -58.3732, address: 'Defensa 1050, San Telmo' },
  { name: 'Palermo Soho (Plaza Serrano)', lat: -34.5884, lng: -58.4305, address: 'Honduras 4950, Palermo' },
  { name: 'Microcentro (Florida y Corrientes)', lat: -34.6037, lng: -58.3776, address: 'Florida 450, Microcentro' },
  { name: 'Recoleta (Junín y Vicente López)', lat: -34.5873, lng: -58.3916, address: 'Junín 1750, Recoleta' },
  { name: 'Belgrano (Cabildo y Juramento)', lat: -34.5621, lng: -58.4562, address: 'Av. Cabildo 2050, Belgrano' },
];

export const CreateBathroomModal: React.FC<CreateBathroomModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'rules'>('info');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Buenos Aires');
  const [province] = useState('CABA');
  const [latitude, setLatitude] = useState(-34.6037);
  const [longitude, setLongitude] = useState(-58.3816);
  const [priceBase, setPriceBase] = useState(600);
  const [turnDuration, setTurnDuration] = useState(15);
  const [cleaningInterval, setCleaningInterval] = useState(5);
  const [amenities, setAmenities] = useState<string[]>([
    'Papel higiénico & jabón',
    'Espejo amplio',
  ]);
  const [openingHours] = useState<OpeningHourDay[]>(DEFAULT_HOURS);
  const [photos, setPhotos] = useState<BathroomPhoto[]>([]);
  const [extras, setExtras] = useState<
    Array<{ name: string; price: number; description: string; is_active: boolean }>
  >([
    { name: 'Ducha con agua caliente', price: 900, description: 'Incluye jabón líquido y shampoo', is_active: true },
  ]);

  // Loading and error states
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: (typeof BUENOS_AIRES_PRESETS)[0]) => {
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setAddress(preset.address);
  };

  const handleToggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleAddExtra = () => {
    setExtras((prev) => [
      ...prev,
      { name: 'Toalla limpia', price: 400, description: 'Toalla de algodón desinfectada', is_active: true },
    ]);
  };

  const handleRemoveExtra = (idx: number) => {
    setExtras((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadImage(file);
        setPhotos((prev) => [
          ...prev,
          {
            url: res.url,
            public_id: res.public_id,
            is_cover: prev.length === 0, // First photo is cover
          },
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al subir la imagen.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetCoverPhoto = (idx: number) => {
    setPhotos((prev) =>
      prev.map((p, i) => ({
        ...p,
        is_cover: i === idx,
      }))
    );
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      if (filtered.length > 0 && !filtered.some((p) => p.is_cover)) {
        filtered[0].is_cover = true;
      }
      return filtered;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (priceBase < 300) {
      setErrorMsg('El precio base debe ser de al menos $ 300,00 ARS.');
      setActiveTab('rules');
      return;
    }

    if (!title.trim() || !address.trim()) {
      setErrorMsg('Por favor completá el título y la dirección.');
      setActiveTab('info');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: BathroomCreateInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        city,
        province,
        latitude,
        longitude,
        price_base: priceBase,
        turn_duration_minutes: turnDuration,
        cleaning_interval_minutes: cleaningInterval,
        rules: ['Prohibido fumar', 'Mantener la higiene', 'Cerrar la canilla al salir'],
        amenities,
        opening_hours: openingHours,
        photos,
        extras: extras.map((ex) => ({
          name: ex.name,
          price: ex.price,
          description: ex.description || undefined,
          is_active: ex.is_active,
        })),
      };

      await createBathroom(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el baño.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Publicar Nuevo Baño</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Completá los datos de tu baño para empezar a recibir usuarios y generar ingresos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'info'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MapPin className="w-4 h-4" />
            1. Datos & Ubicación
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'photos'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            2. Fotos ({photos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'rules'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            3. Precios & Extras
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: DATOS & UBICACIÓN */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre o Título del Baño *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Baño Café San Telmo - Impecable y Seguro"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contale a los usuarios qué comodidades tiene tu espacio..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dirección *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Defensa 1050"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ciudad / Barrio</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Coordinates & Presets */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  Geolocalización GPS (PostGIS)
                </span>
                <p className="text-[11px] text-slate-500">
                  Elegí un punto rápido de Buenos Aires o escribí las coordenadas exactas:
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {BUENOS_AIRES_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="text-xs bg-white border border-slate-200 hover:border-sky-500 hover:text-sky-600 px-2.5 py-1 rounded-lg transition-colors shadow-2xs font-medium"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Latitud</span>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Longitud</span>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FOTOS */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-sky-500 transition-colors bg-slate-50/50">
                <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <label className="cursor-pointer">
                  <span className="text-sm font-semibold text-sky-600 hover:text-sky-700">
                    Hacé clic acá para subir fotos
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Formatos JPG, PNG o WebP (se optimizan automáticamente en Cloudinary)
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
                {isUploading && (
                  <p className="text-xs text-sky-600 font-medium mt-2 animate-pulse">
                    Subiendo foto...
                  </p>
                )}
              </div>

              {/* Photo grid */}
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border border-slate-200 group aspect-video bg-slate-100"
                    >
                      <img
                        src={photo.url}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!photo.is_cover && (
                          <button
                            type="button"
                            title="Establecer como foto principal"
                            onClick={() => handleSetCoverPhoto(idx)}
                            className="p-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold hover:bg-sky-50 hover:text-sky-600"
                          >
                            Portada
                          </button>
                        )}
                        <button
                          type="button"
                          title="Eliminar foto"
                          onClick={() => handleRemovePhoto(idx)}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {photo.is_cover && (
                        <span className="absolute top-2 left-2 bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          Portada
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Aún no cargaste fotos. Las fotos claras aumentan las reservas.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REGLAS, HORARIOS Y EXTRAS */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              {/* Pricing & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Precio Base (ARS) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                    <input
                      type="number"
                      min={300}
                      step={50}
                      value={priceBase}
                      onChange={(e) => setPriceBase(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-white font-bold"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Mínimo: $ 300,00</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duración Turno
                  </label>
                  <select
                    value={turnDuration}
                    onChange={(e) => setTurnDuration(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value={10}>10 minutos</option>
                    <option value={15}>15 minutos (recomendado)</option>
                    <option value={20}>20 minutos</option>
                    <option value={30}>30 minutos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Limpieza entre turnos
                  </label>
                  <select
                    value={cleaningInterval}
                    onChange={(e) => setCleaningInterval(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value={0}>Sin intervalo</option>
                    <option value={5}>5 minutos</option>
                    <option value={10}>10 minutos</option>
                  </select>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Comodidades Incluidas
                </label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_AMENITIES.map((item, idx) => {
                    const isSelected = amenities.includes(item);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleAmenity(item)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-colors flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-sky-50 border-sky-300 text-sky-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Extras cobrables */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    Servicios Extras Cobrables
                  </label>
                  <button
                    type="button"
                    onClick={handleAddExtra}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar Extra
                  </button>
                </div>

                <div className="space-y-2">
                  {extras.map((extra, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Nombre del extra"
                        value={extra.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExtras((prev) =>
                            prev.map((ex, i) => (i === idx ? { ...ex, name: val } : ex))
                          );
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      />
                      <div className="w-24 relative">
                        <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          placeholder="Precio"
                          value={extra.price}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setExtras((prev) =>
                              prev.map((ex, i) => (i === idx ? { ...ex, price: val } : ex))
                            );
                          }}
                          className="w-full pl-5 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExtra(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex gap-2">
            {activeTab !== 'info' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'rules' ? 'photos' : 'info')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Anterior
              </button>
            )}
            {activeTab !== 'rules' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'info' ? 'photos' : 'rules')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Siguiente
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Publicar Baño'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
