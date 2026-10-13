import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Store,
  DollarSign,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Check,
  CreditCard,
  Send,
  MapPin,
} from 'lucide-react';
import { esAR } from '../i18n/es-AR';
import { RoleBadge } from '../components/RoleBadge';
import { formatARS } from '../lib/utils';
import {
  fetchAdminStats,
  fetchAdminBathrooms,
  updateAdminBathroom,
  fetchAdminVendors,
  updateAdminVendorStatus,
  fetchAdminReservations,
  settleVendorPayout,
} from '../lib/api';
import { QuickDevAuthBar } from '../components/auth/QuickDevAuthBar';

export const AdminAreaPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'bathrooms' | 'vendors' | 'payouts' | 'reservations'>('bathrooms');
  const [searchTerm, setSearchTerm] = useState('');
  const [settleModalVendor, setSettleModalVendor] = useState<any | null>(null);
  const [settleNote, setSettleNote] = useState('');
  const [settleSuccessMsg, setSettleSuccessMsg] = useState<string | null>(null);

  // Queries
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStats,
    refetchInterval: 15000,
  });

  const { data: bathroomsData, refetch: refetchBathrooms } = useQuery({
    queryKey: ['adminBathrooms'],
    queryFn: fetchAdminBathrooms,
  });

  const { data: vendorsData, refetch: refetchVendors } = useQuery({
    queryKey: ['adminVendors'],
    queryFn: fetchAdminVendors,
  });

  const { data: reservationsData, refetch: refetchReservations } = useQuery({
    queryKey: ['adminReservations'],
    queryFn: fetchAdminReservations,
  });

  // Mutations
  const bathroomStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { is_approved?: boolean; is_active?: boolean } }) =>
      updateAdminBathroom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBathrooms'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  const vendorStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'pending' | 'suspended' }) =>
      updateAdminVendorStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVendors'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  const settleMutation = useMutation({
    mutationFn: ({ vendorId, amount, note }: { vendorId: string; amount: number; note?: string }) =>
      settleVendorPayout(vendorId, amount, note),
    onSuccess: (data) => {
      setSettleSuccessMsg(data.message || 'Liquidación registrada con éxito.');
      queryClient.invalidateQueries({ queryKey: ['adminVendors'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setTimeout(() => {
        setSettleModalVendor(null);
        setSettleSuccessMsg(null);
        setSettleNote('');
      }, 2000);
    },
  });

  const handleRefreshAll = () => {
    refetchStats();
    refetchBathrooms();
    refetchVendors();
    refetchReservations();
  };

  const bathrooms = bathroomsData?.items || [];
  const vendors = vendorsData?.items || [];
  const reservations = reservationsData?.items || [];

  const filteredBathrooms = bathrooms.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVendors = vendors.filter(
    (v) =>
      v.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.bank_alias && v.bank_alias.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredReservations = reservations.filter(
    (r) =>
      r.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.bathroom_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.pin_code.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* DEV_QUICK_ACCESS: Barra de acceso rápido para pruebas */}
      <QuickDevAuthBar highlightRole="admin" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">{esAR.adminArea.title}</h1>
            <RoleBadge role="admin" />
          </div>
          <p className="text-sm text-slate-600 mt-1">{esAR.adminArea.subtitle}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefreshAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar datos</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            Super Administrador
          </span>
        </div>
      </div>

      {/* KPI Cards (vivas en tiempo real) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total recaudado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {esAR.adminArea.kpiTotalCollected}
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatARS(stats?.total_gross_collected || 0)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            {stats?.paid_reservations_count || 0} turnos cobrados vía Mercado Pago
          </div>
        </div>

        {/* Ganancias Tronno */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {esAR.adminArea.kpiAdminEarnings}
            </span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">
            {formatARS(stats?.total_admin_earnings || 0)}
          </div>
          <div className="text-[11px] text-purple-600 font-medium">
            15% comisión de plataforma retenida
          </div>
        </div>

        {/* Liquidaciones a vendedores */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {esAR.adminArea.kpiPendingPayouts}
            </span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">
            {formatARS(stats?.total_pending_payouts || 0)}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">
            85% a transferir a CBU/CVU de vendedores
          </div>
        </div>

        {/* Baños en el sistema */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {esAR.adminArea.kpiActiveBathrooms}
            </span>
            <Store className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.active_bathrooms_count || 0}{' '}
            <span className="text-sm font-normal text-slate-400">/ {stats?.total_bathrooms_count || 0}</span>
          </div>
          <div className="text-[11px] text-sky-600 font-medium">
            {stats?.total_vendors_count || 0} vendedores registrados
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('bathrooms')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'bathrooms'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            🏪 Baños y Moderación ({bathrooms.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vendors')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'vendors'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            👥 Vendedores ({vendors.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'payouts'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            💸 Liquidaciones CBU/CVU
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reservations')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'reservations'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            🧾 Ledger de Reservas ({reservations.length})
          </button>
        </nav>

        {/* Quick Search in tables */}
        <div className="relative w-full sm:w-64 pb-2 sm:pb-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o ciudad..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Tab 1: Bathrooms Moderation */}
      {activeTab === 'bathrooms' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Listado Maestro de Baños</h2>
            <span className="text-xs text-slate-500">{filteredBathrooms.length} establecimientos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Establecimiento</th>
                  <th className="p-4">Ciudad / Zona</th>
                  <th className="p-4">Vendedor</th>
                  <th className="p-4">Precio Base</th>
                  <th className="p-4">Estado Aprobación</th>
                  <th className="p-4">Estado Activo</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBathrooms.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {b.photos && b.photos[0] ? (
                          <img
                            src={b.photos[0].url}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <Store className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{b.title}</p>
                          <p className="text-[11px] text-slate-400">{b.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <MapPin className="w-3 h-3 text-sky-600" />
                        {b.city}, {b.province}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-slate-800">{b.vendor.full_name}</p>
                      <p className="text-[11px] text-slate-400">{b.vendor.email}</p>
                    </td>
                    <td className="p-4 font-black text-slate-900">{formatARS(b.price_base)}</td>
                    <td className="p-4">
                      {b.is_approved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {b.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                          Pausado
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            bathroomStatusMutation.mutate({
                              id: b.id,
                              data: { is_approved: !b.is_approved },
                            })
                          }
                          className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-colors ${
                            b.is_approved
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {b.is_approved ? 'Desaprobar' : 'Aprobar'}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            bathroomStatusMutation.mutate({
                              id: b.id,
                              data: { is_active: !b.is_active },
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                        >
                          {b.is_active ? 'Pausar' : 'Reanudar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Vendors List */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Vendedores Registrados</h2>
            <span className="text-xs text-slate-500">{filteredVendors.length} comerciantes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Comerciante</th>
                  <th className="p-4">Contacto</th>
                  <th className="p-4">CBU / CVU & Alias</th>
                  <th className="p-4">Baños</th>
                  <th className="p-4">Ventas Brutas</th>
                  <th className="p-4">Saldo a Cobrar</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Moderación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{v.full_name}</td>
                    <td className="p-4">
                      <p className="text-slate-800">{v.email}</p>
                      <p className="text-[11px] text-slate-400">{v.phone || 'Sin teléfono'}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-mono text-[11px] text-slate-700">{v.cbu_cvu}</p>
                      <p className="text-[11px] font-semibold text-purple-700">{v.bank_alias}</p>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{v.bathrooms_count}</td>
                    <td className="p-4 font-black text-slate-900">{formatARS(v.total_sales)}</td>
                    <td className="p-4 font-black text-amber-700">{formatARS(v.payout_due)}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          v.vendor_status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.vendor_status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {v.vendor_status === 'approved'
                          ? 'Aprobado'
                          : v.vendor_status === 'pending'
                          ? 'Pendiente'
                          : 'Suspendido'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {v.vendor_status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() =>
                              vendorStatusMutation.mutate({ id: v.id, status: 'approved' })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition-colors"
                          >
                            Aprobar
                          </button>
                        )}
                        {v.vendor_status !== 'suspended' && (
                          <button
                            type="button"
                            onClick={() =>
                              vendorStatusMutation.mutate({ id: v.id, status: 'suspended' })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] transition-colors"
                          >
                            Suspender
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Payout Settlements */}
      {activeTab === 'payouts' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-6 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Liquidaciones y Transferencias Bancarias a Vendedores
              </h2>
              <p className="text-xs text-slate-500">
                Tronno retiene el 100% de los fondos en su cuenta de Mercado Pago y liquida periódicamente el 85% neto a los CBU/CVU de los vendedores.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              Comisión fijada: 15%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Vendedor</th>
                  <th className="p-4">CBU / CVU</th>
                  <th className="p-4">Alias Bancario</th>
                  <th className="p-4">Total Ventas (100%)</th>
                  <th className="p-4">Comisión Tronno (15%)</th>
                  <th className="p-4">Monto Neto a Transferir (85%)</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map((v) => {
                  const comm = roundNum(v.total_sales * 0.15);
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{v.full_name}</p>
                        <p className="text-[11px] text-slate-400">{v.email}</p>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-700">{v.cbu_cvu}</td>
                      <td className="p-4 font-bold text-purple-700">{v.bank_alias}</td>
                      <td className="p-4 font-semibold text-slate-800">{formatARS(v.total_sales)}</td>
                      <td className="p-4 font-semibold text-purple-700">{formatARS(comm)}</td>
                      <td className="p-4 font-black text-emerald-700 text-sm">
                        {formatARS(v.payout_due)}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSettleModalVendor(v)}
                          disabled={v.payout_due <= 0}
                          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white font-bold text-xs shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Registrar Transferencia</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Reservations Ledger */}
      {activeTab === 'reservations' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Ledger Global de Reservas y Pagos</h2>
            <span className="text-xs text-slate-500">{filteredReservations.length} transacciones</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">ID Reserva</th>
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Baño & Ciudad</th>
                  <th className="p-4">Monto Cobrado</th>
                  <th className="p-4">PIN Acceso</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-mono text-[11px] text-slate-500">{r.id.slice(0, 8)}...</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{r.user_name}</p>
                      <p className="text-[11px] text-slate-400">{r.user_email}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-slate-800">{r.bathroom_title}</p>
                      <p className="text-[11px] text-slate-400">{r.city}</p>
                    </td>
                    <td className="p-4 font-black text-slate-900">{formatARS(r.total_price)}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-mono font-bold text-xs border border-sky-100">
                        {r.pin_code}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          r.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'used'
                            ? 'bg-purple-100 text-purple-800'
                            : r.status === 'pending_payment'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.status === 'paid'
                          ? 'Pagada'
                          : r.status === 'used'
                          ? 'Utilizada'
                          : r.status === 'pending_payment'
                          ? 'Pendiente'
                          : r.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(r.created_at).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settle Payout Modal */}
      {settleModalVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">Registrar Transferencia Bancaria</h3>
              </div>
              <button
                type="button"
                onClick={() => setSettleModalVendor(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {settleSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{settleSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destinatario:</span>
                    <span className="font-bold text-slate-900">{settleModalVendor.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CBU / CVU:</span>
                    <span className="font-mono font-semibold text-slate-800">{settleModalVendor.cbu_cvu}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Alias:</span>
                    <span className="font-bold text-purple-700">{settleModalVendor.bank_alias}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-700">Monto neto a transferir:</span>
                    <span className="text-base font-black text-emerald-700">
                      {formatARS(settleModalVendor.payout_due)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nota o Comprobante bancario:</label>
                  <input
                    type="text"
                    value={settleNote}
                    onChange={(e) => setSettleNote(e.target.value)}
                    placeholder="Ej. Transf. Banco Galicia #849102"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    settleMutation.mutate({
                      vendorId: settleModalVendor.id,
                      amount: settleModalVendor.payout_due,
                      note: settleNote,
                    })
                  }
                  disabled={settleMutation.isPending}
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {settleMutation.isPending
                      ? 'Registrando...'
                      : `Confirmar Liquidación de ${formatARS(settleModalVendor.payout_due)}`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function roundNum(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
