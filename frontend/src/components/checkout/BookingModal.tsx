import React, { useState } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { BathroomSearchResult, BathroomExtra } from '../../types/bathroom';
import { Reservation } from '../../types/reservation';
import { createReservation, createPaymentPreference, simulateMockPayment } from '../../lib/api';
import { formatARS } from '../../lib/utils';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bathroom: BathroomSearchResult;
  selectedExtras: BathroomExtra[];
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  bathroom,
  selectedExtras,
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'review' | 'paying' | 'success'>('review');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const extrasTotal = selectedExtras.reduce((acc, ex) => acc + ex.price, 0);
  const grandTotal = bathroom.price_base + extrasTotal;

  const handleStartPayment = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Crear reserva
      const validExtraIds = selectedExtras
        .map((e) => e.id)
        .filter((id): id is string => Boolean(id));

      const res = await createReservation({
        bathroom_id: bathroom.id,
        extra_ids: validExtraIds,
      });
      setReservation(res);

      // 2. Obtener preferencia de Mercado Pago
      const pref = await createPaymentPreference(res.id);

      if (pref.mode === 'live' && pref.init_point) {
        // Redirigir a checkout oficial de Mercado Pago
        window.location.href = pref.init_point;
      } else {
        // Modo mock local
        setStep('paying');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar el proceso de reserva.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockSimulation = async (status: 'approved' | 'rejected') => {
    if (!reservation) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const payResult = await simulateMockPayment(reservation.id, status);
      if (payResult.status === 'approved') {
        setStep('success');
      } else {
        setErrorMessage('El pago fue rechazado por la pasarela de prueba. Intentá nuevamente.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al simular el cobro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {step === 'success' ? '¡Turno Confirmado!' : 'Reservar y Pagar'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 'success'
                  ? 'Accedé con tu código QR o PIN'
                  : 'Cobro seguro vía Mercado Pago'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on step */}
        <div className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-5">
              {/* Bathroom Card summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Establecimiento
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{bathroom.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>
                    {bathroom.address}, {bathroom.city}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Turno de {bathroom.turn_duration_minutes || 15} minutos</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Detalle del costo
                </span>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Acceso base al baño</span>
                  <span className="font-semibold text-slate-900">{formatARS(bathroom.price_base)}</span>
                </div>

                {selectedExtras.map((extra) => (
                  <div key={extra.id} className="flex justify-between text-xs text-slate-600">
                    <span>+ {extra.name}</span>
                    <span className="font-semibold text-slate-900">{formatARS(extra.price)}</span>
                  </div>
                ))}

                <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Total a Pagar</span>
                  <span className="text-2xl font-black text-sky-700">{formatARS(grandTotal)}</span>
                </div>
              </div>

              {/* Security guarantee */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center gap-2.5 text-xs text-sky-800">
                <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <span>
                  Recaudación centralizada y garantía de higiene verificada por Tronno.
                </span>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleStartPayment}
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Generando orden de pago...</span>
                ) : (
                  <>
                    <span>Confirmar y Pagar {formatARS(grandTotal)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'paying' && (
            <div className="space-y-6 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mx-auto">
                <CreditCard className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">Pasarela de Pago (Modo Prueba)</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Estás operando en ambiente de desarrollo local. Simulá la respuesta de Mercado Pago para este turno de{' '}
                  <strong className="text-slate-800">{formatARS(grandTotal)}</strong>:
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleMockSimulation('approved')}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Procesando...' : 'Aprobar Pago (Simulación Exitosa)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMockSimulation('rejected')}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  Simular Pago Rechazado
                </button>
              </div>
            </div>
          )}

          {step === 'success' && reservation && (
            <div className="space-y-6 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">¡Tu baño está listo!</h3>
                <p className="text-xs text-slate-500">
                  Mostrale este código QR al comerciante al llegar al establecimiento:
                </p>
              </div>

              {/* QR Code Canvas */}
              <div className="p-4 bg-slate-50 rounded-3xl border border-slate-200 inline-block shadow-inner mx-auto">
                <QRCodeSVG
                  value={reservation.qr_token}
                  size={180}
                  level="H"
                  includeMargin={true}
                  className="rounded-xl mx-auto"
                />
              </div>

              {/* PIN Code Badge */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Código PIN de respaldo
                </span>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-50 text-sky-800 font-mono text-2xl font-black tracking-widest border border-sky-200">
                  {reservation.pin_code.slice(0, 3)} {reservation.pin_code.slice(3)}
                </div>
              </div>

              {/* Summary info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 text-left text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">{bathroom.title}</p>
                <p>
                  📍 {bathroom.address}, {bathroom.city}
                </p>
                <p className="text-[11px] text-slate-400">
                  Turno de {reservation.turn_duration_minutes} min • Total abonado:{' '}
                  {formatARS(reservation.total_price)}
                </p>
              </div>

              {/* Navigation Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/usuario');
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Ver en Mis Reservas</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
