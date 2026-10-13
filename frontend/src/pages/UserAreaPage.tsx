import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  QrCode,
  Search,
  Clock,
  MapPin,
  CheckCircle2,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { esAR } from '../i18n/es-AR';
import { RoleBadge } from '../components/RoleBadge';
import { getMyReservations, simulateMockPayment } from '../lib/api';
import { formatARS } from '../lib/utils';
import { Reservation } from '../types/reservation';
import { QuickDevAuthBar } from '../components/auth/QuickDevAuthBar';

export const UserAreaPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [payingId, setPayingId] = useState<string | null>(null);

  const {
    data: resData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: getMyReservations,
    refetchInterval: 15000,
  });

  const reservations = resData?.items || [];
  const activeReservation = reservations.find((r) => r.status === 'paid' || r.status === 'pending_payment');
  const pastReservations = reservations.filter((r) => r.id !== activeReservation?.id);

  const handlePayPending = async (resId: string) => {
    setPayingId(resId);
    try {
      await simulateMockPayment(resId, 'approved');
      await queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
    } catch (err: any) {
      alert(err.message || 'Error al procesar el pago.');
    } finally {
      setPayingId(null);
    }
  };

  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Pagada • Lista para ingresar
          </span>
        );
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pago Pendiente
          </span>
        );
      case 'used':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
            Turno Consumido
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            Expirada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* DEV_QUICK_ACCESS: Barra de acceso rápido para pruebas */}
      <QuickDevAuthBar highlightRole="user" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{esAR.userArea.title}</h1>
            <RoleBadge role="user" />
          </div>
          <p className="text-sm text-slate-600 mt-1">{esAR.userArea.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Active Ticket Hero Card */}
      {activeReservation ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Turno Activo
            </h2>
            {getStatusBadge(activeReservation.status)}
          </div>

          <div className="bg-gradient-to-b from-white to-slate-50 rounded-3xl border-2 border-sky-500/30 p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
            {/* Top info */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
                  Acceso Inmediato
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {activeReservation.bathroom?.title || 'Baño Reservado'}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  {activeReservation.bathroom?.address}, {activeReservation.bathroom?.city}
                </p>
              </div>

              <div className="text-right sm:text-right">
                <span className="text-xs text-slate-400 block">Total pagado</span>
                <span className="text-2xl font-black text-slate-900">
                  {formatARS(activeReservation.total_price)}
                </span>
              </div>
            </div>

            {/* QR and PIN Box */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-center gap-8 text-center md:text-left">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner flex-shrink-0">
                <QRCodeSVG
                  value={activeReservation.qr_token}
                  size={160}
                  level="H"
                  includeMargin={true}
                  className="rounded-xl mx-auto"
                />
              </div>

              <div className="space-y-3 flex-1">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                    Código PIN numérico de respaldo
                  </span>
                  <div className="inline-block px-5 py-2.5 rounded-2xl bg-sky-50 text-sky-800 font-mono text-3xl font-black tracking-widest border border-sky-200">
                    {activeReservation.pin_code.slice(0, 3)} {activeReservation.pin_code.slice(3)}
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Mostrale este código QR al encargado del establecimiento para escanear con su celular o dictale tu PIN de 6 dígitos.
                </p>

                {activeReservation.status === 'pending_payment' && (
                  <button
                    type="button"
                    onClick={() => handlePayPending(activeReservation.id)}
                    disabled={payingId === activeReservation.id}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {payingId === activeReservation.id
                        ? 'Procesando pago...'
                        : 'Abonar ahora con Mercado Pago'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Extras included */}
            {activeReservation.selected_extras && activeReservation.selected_extras.length > 0 && (
              <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">Servicios adicionales incluidos:</span>
                {activeReservation.selected_extras.map((ex) => (
                  <span
                    key={ex.id}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-medium"
                  >
                    ✓ {ex.name} (+{formatARS(ex.price)})
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
            <QrCode className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800">
              {isLoading ? 'Cargando reservas...' : esAR.userArea.emptyReservations}
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Cuando reserves un turno en el mapa, acá vas a tener tu código QR de acceso y el PIN de respaldo listos al instante.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Buscar baños en el mapa</span>
          </button>
        </div>
      )}

      {/* Past reservations history */}
      {pastReservations.length > 0 && (
        <section className="space-y-3 pt-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Historial de Reservas
          </h2>

          <div className="space-y-2.5">
            {pastReservations.map((res) => (
              <div
                key={res.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {res.bathroom?.title || 'Baño Tronno'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    📍 {res.bathroom?.address}, {res.bathroom?.city} •{' '}
                    {new Date(res.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-900">
                    {formatARS(res.total_price)}
                  </span>
                  {getStatusBadge(res.status)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feature cards footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <Compass className="w-4 h-4 text-sky-600" />
            Búsqueda Georreferenciada PostGIS
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Encontrá baños cercanos con distancias exactas en Santa Fe y CABA.
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <QrCode className="w-4 h-4 text-emerald-600" />
            Cobro Seguro Mercado Pago
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Aboná con Checkout Pro o simulá turnos en modo local con validación instantánea.
          </p>
        </div>
      </div>
    </div>
  );
};
