import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Navigation,
  SlidersHorizontal,
  Map as MapIcon,
  List,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { esAR } from '../i18n/es-AR';
import { searchBathrooms, fetchHealth } from '../lib/api';
import { BathroomSearchResult, BathroomExtra } from '../types/bathroom';
import { BathroomMap } from '../components/map/BathroomMap';
import { BathroomDetailModal } from '../components/search/BathroomDetailModal';
import { BookingModal } from '../components/checkout/BookingModal';
import { formatARS } from '../lib/utils';

interface CityZone {
  name: string;
  lat: number;
  lng: number;
}

const CITY_ZONES: Record<string, CityZone[]> = {
  'Santa Fe': [
    { name: 'Peatonal San Martín', lat: -31.6515, lng: -60.7098 },
    { name: 'Costanera Setúbal', lat: -31.6305, lng: -60.6820 },
    { name: 'Bv. Gálvez / Candioti', lat: -31.6380, lng: -60.6935 },
    { name: 'Terminal / Puerto', lat: -31.6442, lng: -60.7015 },
    { name: 'Recoleta Santafesina', lat: -31.6392, lng: -60.7042 },
  ],
  'Buenos Aires': [
    { name: 'Obelisco / Centro', lat: -34.6037, lng: -58.3816 },
    { name: 'Palermo Soho', lat: -34.5884, lng: -58.4305 },
    { name: 'San Telmo', lat: -34.6212, lng: -58.3732 },
    { name: 'Recoleta CABA', lat: -34.5873, lng: -58.3916 },
    { name: 'Belgrano', lat: -34.5621, lng: -58.4562 },
  ],
};

const AMENITY_FILTERS = [
  'Ducha con agua caliente',
  'Accesible silla de ruedas',
  'Cambiador de bebés',
];

// Fallback bathrooms if local backend is freshly launched
const FALLBACK_BATHROOMS: BathroomSearchResult[] = [
  {
    id: 'demo-sf-1',
    vendor_id: 'vendor-sf',
    title: 'Café Peatonal San Martín - Confort y Accesibilidad',
    description: 'Baño impecable en pleno centro comercial y peatonal de Santa Fe. Limpieza permanente y adaptado para movilidad reducida.',
    address: 'San Martín 2340',
    city: 'Santa Fe',
    province: 'Santa Fe',
    latitude: -31.6515,
    longitude: -60.7098,
    price_base: 600,
    turn_duration_minutes: 15,
    cleaning_interval_minutes: 5,
    rules: ['Prohibido fumar', 'Mantener higiene'],
    amenities: ['Papel higiénico & jabón', 'Accesible silla de ruedas', 'Espejo amplio', 'Secador de manos'],
    opening_hours: [],
    photos: [{ url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', is_cover: true }],
    extras: [{ id: 'ex-sf-1', name: 'Toalla descartable premium', price: 200, is_active: true }],
    is_active: true,
    is_approved: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    distance_meters: 100,
    distance_km: 0.1,
  },
  {
    id: 'demo-sf-2',
    vendor_id: 'vendor-sf',
    title: 'Parador Costanera Setúbal - Ducha y Vestuario Deportivo',
    description: 'Frente a la Laguna Setúbal y el Puente Colgante. Ideal para deportistas con cabina de ducha con agua caliente.',
    address: 'Av. 7 de Jefes 3680',
    city: 'Santa Fe',
    province: 'Santa Fe',
    latitude: -31.6305,
    longitude: -60.6820,
    price_base: 850,
    turn_duration_minutes: 15,
    cleaning_interval_minutes: 5,
    rules: ['Cuidar las instalaciones'],
    amenities: ['Ducha con agua caliente', 'Secador de manos', 'Enchufe disponible', 'Papel higiénico & jabón'],
    opening_hours: [],
    photos: [{ url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800', is_cover: true }],
    extras: [
      { id: 'ex-sf-2', name: 'Ducha con agua caliente', price: 1000, is_active: true },
      { id: 'ex-sf-3', name: 'Kit jabón & shampoo', price: 450, is_active: true },
    ],
    is_active: true,
    is_approved: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    distance_meters: 1500,
    distance_km: 1.5,
  },
  {
    id: 'demo-1',
    vendor_id: 'vendor-1',
    title: 'Baño Café San Telmo - Higiénico y Seguro',
    description: 'Baño individual con limpieza permanente tras cada uso. A pasos de Plaza Dorrego.',
    address: 'Defensa 1050',
    city: 'San Telmo',
    province: 'CABA',
    latitude: -34.6212,
    longitude: -58.3732,
    price_base: 650,
    turn_duration_minutes: 15,
    cleaning_interval_minutes: 5,
    rules: ['Prohibido fumar', 'Mantener higiene'],
    amenities: ['Papel higiénico & jabón', 'Espejo amplio', 'Accesible silla de ruedas'],
    opening_hours: [],
    photos: [{ url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', is_cover: true }],
    extras: [{ id: 'ex-1', name: 'Toalla descartable premium', price: 250, is_active: true }],
    is_active: true,
    is_approved: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    distance_meters: 350,
    distance_km: 0.35,
  },
  {
    id: 'demo-2',
    vendor_id: 'vendor-2',
    title: 'Espacio Palermo Soho - Ducha y Vestuario',
    description: 'Cabina de ducha con agua caliente y vestuario impecable a pasos de Plaza Serrano.',
    address: 'Honduras 4950',
    city: 'Palermo Soho',
    province: 'CABA',
    latitude: -34.5884,
    longitude: -58.4305,
    price_base: 900,
    turn_duration_minutes: 15,
    cleaning_interval_minutes: 5,
    rules: ['Prohibido fumar', 'No arrojar residuos al piso'],
    amenities: ['Ducha con agua caliente', 'Secador de manos', 'Enchufe disponible'],
    opening_hours: [],
    photos: [{ url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800', is_cover: true }],
    extras: [
      { id: 'ex-2', name: 'Ducha con agua caliente', price: 1100, is_active: true },
      { id: 'ex-3', name: 'Kit jabón & shampoo', price: 500, is_active: true },
    ],
    is_active: true,
    is_approved: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    distance_meters: 1200,
    distance_km: 1.2,
  },
];

export const HomePage: React.FC = () => {
  // Active city
  const [selectedCity, setSelectedCity] = useState<'Santa Fe' | 'Buenos Aires'>('Santa Fe');

  // Search parameters (defaults to Santa Fe Capital - Peatonal San Martín)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: -31.6515,
    lng: -60.7098,
  });
  const [activeZoneName, setActiveZoneName] = useState('Peatonal San Martín');
  const [radiusKm, setRadiusKm] = useState(5.0);
  const [selectedAmenity, setSelectedAmenity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedBathroom, setSelectedBathroom] = useState<BathroomSearchResult | null>(null);
  const [bookingBathroom, setBookingBathroom] = useState<BathroomSearchResult | null>(null);
  const [bookingExtras, setBookingExtras] = useState<BathroomExtra[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);

  // System Health
  const { data: health, isLoading: isHealthLoading, isError: isHealthError } = useQuery({
    queryKey: ['system-health'],
    queryFn: fetchHealth,
    retry: 1,
    refetchInterval: 30000,
  });

  // Georeferenced Search Query
  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['bathrooms-search', userLocation.lat, userLocation.lng, radiusKm, selectedAmenity],
    queryFn: () =>
      searchBathrooms({
        lat: userLocation.lat,
        lng: userLocation.lng,
        radiusKm,
        amenity: selectedAmenity || undefined,
      }),
    retry: 1,
  });

  // Use search items or fallback sample
  const bathrooms: BathroomSearchResult[] =
    searchData?.items && searchData.items.length > 0
      ? searchData.items
      : FALLBACK_BATHROOMS;

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización GPS.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setActiveZoneName('Mi ubicación GPS');
        setGpsLoading(false);
      },
      () => {
        alert('No se pudo obtener la ubicación GPS. Por favor verificá los permisos.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSelectCity = (city: 'Santa Fe' | 'Buenos Aires') => {
    setSelectedCity(city);
    const firstZone = CITY_ZONES[city][0];
    if (firstZone) {
      setUserLocation({ lat: firstZone.lat, lng: firstZone.lng });
      setActiveZoneName(firstZone.name);
    }
  };

  const handleSelectZone = (zone: CityZone) => {
    setUserLocation({ lat: zone.lat, lng: zone.lng });
    setActiveZoneName(zone.name);
  };

  return (
    <div className="flex-1 flex flex-col space-y-8 pb-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-sky-600 via-sky-700 to-slate-900 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-sky-200" /> Búsqueda Georreferenciada PostGIS
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Encontrá un baño higiénico y seguro cerca tuyo
          </h1>
          <p className="text-sm sm:text-base text-sky-100 max-w-xl mx-auto leading-relaxed">
            Elegí en el mapa, reservá tu turno por 15 minutos en pesos argentinos y accedé con código QR al instante.
          </p>

          {/* Search Toolbar */}
          <div className="max-w-4xl mx-auto pt-4">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-3 shadow-2xl border border-white/40 flex flex-col sm:flex-row items-center gap-2">
              {/* GPS Button */}
              <button
                type="button"
                onClick={handleUseGps}
                disabled={gpsLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-sky-50 text-sky-700 font-bold text-xs hover:bg-sky-100 transition-colors flex-shrink-0"
              >
                <Navigation className={`w-4 h-4 text-sky-600 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>{gpsLoading ? 'Buscando GPS...' : 'Usar mi ubicación'}</span>
              </button>

              {/* City Switcher */}
              <div className="flex p-1 bg-sky-100/70 rounded-2xl flex-shrink-0 w-full sm:w-auto justify-center">
                {(['Santa Fe', 'Buenos Aires'] as const).map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleSelectCity(city)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedCity === city
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-sky-900 hover:text-sky-950 hover:bg-sky-200/50'
                    }`}
                  >
                    {city === 'Santa Fe' ? '📍 Santa Fe' : '📍 CABA'}
                  </button>
                ))}
              </div>

              {/* Zone Pills */}
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto w-full py-1 px-1">
                {(CITY_ZONES[selectedCity] || []).map((zone) => (
                  <button
                    key={zone.name}
                    type="button"
                    onClick={() => handleSelectZone(zone)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      activeZoneName === zone.name
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {zone.name}
                  </button>
                ))}
              </div>

              {/* View toggle */}
              <div className="flex p-1 bg-slate-100 rounded-2xl flex-shrink-0 w-full sm:w-auto justify-center">
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'map' ? 'bg-white text-sky-600 shadow-2xs' : 'text-slate-500'
                  }`}
                  title="Ver mapa"
                >
                  <MapIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Mapa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'list' ? 'bg-white text-sky-600 shadow-2xs' : 'text-slate-500'
                  }`}
                  title="Ver lista"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Lista</span>
                </button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 px-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-sky-200 text-xs font-medium flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Radio:
                </span>
                {[1, 3, 5, 10].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadiusKm(r)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      radiusKm === r
                        ? 'bg-white text-sky-900 shadow-2xs'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {AMENITY_FILTERS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setSelectedAmenity((prev) => (prev === item ? null : item))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      selectedAmenity === item
                        ? 'bg-emerald-400 text-emerald-950 font-bold'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10">
        {/* Results Counter & Zone info */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Baños disponibles en {activeZoneName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {bathrooms.length} espacio{bathrooms.length !== 1 ? 's' : ''} encontrado{bathrooms.length !== 1 ? 's' : ''} a menos de {radiusKm} km
            </p>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            {isSearchLoading ? 'Actualizando ubicación...' : 'Coordenadas PostGIS sincronizadas'}
          </div>
        </div>

        {/* View Mode Switch Content */}
        {viewMode === 'map' ? (
          <div className="space-y-4">
            <BathroomMap
              bathrooms={bathrooms}
              userLocation={userLocation}
              selectedBathroom={selectedBathroom}
              onSelectBathroom={(b) => setSelectedBathroom(b)}
            />

            {/* Quick Cards Below Map */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {bathrooms.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBathroom(b)}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-sky-400 shadow-2xs hover:shadow-sm cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-slate-900 text-xs line-clamp-1">{b.title}</h3>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {b.distance_km < 1 ? `${b.distance_meters} m` : `${b.distance_km} km`} · {b.city}
                    </span>
                  </div>
                  <span className="font-black text-slate-900 text-sm pl-2">
                    {formatARS(b.price_base)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* List Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bathrooms.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBathroom(b)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="h-40 bg-slate-100 overflow-hidden relative">
                  {b.photos && b.photos[0] ? (
                    <img src={b.photos[0].url} alt={b.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      Sin foto
                    </div>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl text-xs font-black text-slate-900 shadow-sm">
                    {formatARS(b.price_base)}
                  </span>
                  <span className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                    {b.distance_km < 1 ? `a ${b.distance_meters} m` : `a ${b.distance_km} km`}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{b.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" /> {b.address}, {b.city}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {(b.amenities || []).slice(0, 2).map((a, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {a}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">{b.turn_duration_minutes} min por turno</span>
                    <span className="text-sky-600 font-bold hover:underline">Ver detalles &rarr;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* System Health Section */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">{esAR.home.systemStatus}</h2>
              <p className="text-xs text-slate-500">Conexión en tiempo real con backend FastAPI y PostGIS</p>
            </div>
            <div className="flex items-center gap-2">
              {isHealthLoading ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-medium">
                  <Clock className="w-3.5 h-3.5 animate-spin" /> Conectando...
                </span>
              ) : isHealthError ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-1 rounded-full font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Servidor en modo local
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Operativo ({health?.environment})
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 block mb-1">API Backend</span>
              <p className="font-semibold text-slate-800">{health ? `v${health.version}` : 'FastAPI v0.1.0'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 block mb-1">Base de Datos / PostGIS</span>
              <p className="font-semibold text-slate-800">
                {health?.postgis_installed ? 'PostGIS 3.4 Activo' : 'PostGIS Espacial'}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 block mb-1">Modo de Pagos Mercado Pago</span>
              <p className="font-semibold text-slate-800">
                {health?.payments_mode === 'live' ? 'Producción (Live)' : 'Modo Simulado (Mock)'}
              </p>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 text-center">{esAR.home.featuresTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{esAR.home.feature1Title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{esAR.home.feature1Desc}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{esAR.home.feature2Title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{esAR.home.feature2Desc}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{esAR.home.feature3Title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{esAR.home.feature3Desc}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Bathroom Detail Modal */}
      <BathroomDetailModal
        bathroom={selectedBathroom}
        onClose={() => setSelectedBathroom(null)}
        onBookTurn={(b, extras) => {
          setSelectedBathroom(null);
          setBookingBathroom(b);
          setBookingExtras(extras);
        }}
      />

      {/* Booking & Checkout Modal */}
      {bookingBathroom && (
        <BookingModal
          isOpen={!!bookingBathroom}
          onClose={() => setBookingBathroom(null)}
          bathroom={bookingBathroom}
          selectedExtras={bookingExtras}
        />
      )}
    </div>
  );
};
