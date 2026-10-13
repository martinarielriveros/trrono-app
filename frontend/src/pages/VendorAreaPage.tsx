import React, { useState } from 'react';
import {
  Store,
  Camera,
  Clock,
  DollarSign,
  AlertCircle,
  PlusCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esAR } from '../i18n/es-AR';
import { RoleBadge } from '../components/RoleBadge';
import { formatARS } from '../lib/utils';
import { fetchBathrooms, updateBathroom, deleteBathroom, getVendorReservations } from '../lib/api';
import { BathroomCard } from '../components/vendor/BathroomCard';
import { CreateBathroomModal } from '../components/vendor/CreateBathroomModal';
import { EditBathroomModal } from '../components/vendor/EditBathroomModal';
import { ConfirmDeleteModal } from '../components/vendor/ConfirmDeleteModal';
import { QuickDevAuthBar } from '../components/auth/QuickDevAuthBar';
import { Bathroom } from '../types/bathroom';
import { Reservation } from '../types/reservation';

export const VendorAreaPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBathroom, setEditingBathroom] = useState<Bathroom | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingBathroom, setDeletingBathroom] = useState<Bathroom | null>(null);

  // TanStack Query for Bathrooms list
  const {
    data: bathroomsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['vendorBathrooms'],
    queryFn: () => fetchBathrooms(),
    retry: 1,
  });

  // Query for incoming reservations
  const { data: vendorResData } = useQuery({
    queryKey: ['vendorReservations'],
    queryFn: () => getVendorReservations().catch(() => ({ items: [], total: 0 })),
    retry: 0,
    refetchInterval: 15000,
  });

  // Mutation to toggle pause/active status
  const toggleMutation = useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: boolean }) =>
      updateBathroom(id, { is_active: !currentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorBathrooms'] });
    },
  });

  // Mutation to delete a bathroom
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBathroom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorBathrooms'] });
      setIsDeleteModalOpen(false);
      setDeletingBathroom(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Error al eliminar el baño.');
    },
  });

  const bathrooms: Bathroom[] = bathroomsData?.items || [];
  const activeBathroomsCount = bathrooms.filter((b) => b.is_active).length;

  const vendorReservations: Reservation[] = vendorResData?.items || [];
  const validReservations = vendorReservations.filter((r) => r.status === 'paid' || r.status === 'used');
  const todayReservationsCount = validReservations.length;
  const pendingPayoutTotal = validReservations.reduce((sum, r) => sum + r.total_price * 0.85, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* DEV_QUICK_ACCESS: Barra de acceso rápido para pruebas */}
      <QuickDevAuthBar highlightRole="vendor" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{esAR.vendorArea.title}</h1>
            <RoleBadge role="vendor" />
          </div>
          <p className="text-sm text-slate-600 mt-1">{esAR.vendorArea.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Publicar nuevo baño
        </button>
      </div>

      {/* Account State Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <span className="font-semibold text-amber-800">
            Estado de cuenta: {esAR.accountStates.aprobado}
          </span>
          <p className="text-amber-700 text-xs mt-0.5">{esAR.vendorArea.approvalNotice}</p>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Check-in Express
          </span>
          <h2 className="text-xl font-bold">Recepción de usuarios</h2>
          <p className="text-xs text-emerald-100 max-w-md">
            Escaneá el código QR del usuario con la cámara de tu celular para validar su turno y cobrar automáticamente.
          </p>
        </div>
        <button
          type="button"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-emerald-800 font-bold hover:bg-emerald-50 transition-colors shadow-sm"
        >
          <Camera className="w-5 h-5" />
          {esAR.vendorArea.scanQrBtn}
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{esAR.vendorArea.activeBathrooms}</span>
            <Store className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{activeBathroomsCount}</span>
          <p className="text-xs text-slate-500 mt-1">Disponibles para reserva pública</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{esAR.vendorArea.todayReservations}</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{todayReservationsCount}</span>
          <p className="text-xs text-slate-500 mt-1">Turnos reservados hoy</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Saldo por cobrar</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{formatARS(pendingPayoutTotal)}</span>
          <p className="text-xs text-slate-500 mt-1">A transferir a tu CBU/CVU bancario</p>
        </div>
      </div>

      {/* Bathrooms Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Mis Baños Publicados</h2>
            <p className="text-xs text-slate-500">
              Administrá las características, precios y disponibilidad de cada uno de tus espacios.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Actualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Loading / Error / Empty / List state */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-sky-600" />
            <span className="text-xs">Cargando tus baños...</span>
          </div>
        ) : isError || bathrooms.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-2xs">
            <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto">
              <Store className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                Todavía no tenés baños publicados
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Publicá tu primer baño higiénico, configurá tus fotos, horarios semanales y empezá a rentabilizar tu espacio con Tronno.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Publicar mi primer baño
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bathrooms.map((bathroom) => (
              <BathroomCard
                key={bathroom.id}
                bathroom={bathroom}
                onToggleActive={(id, currentStatus) =>
                  toggleMutation.mutate({ id, currentStatus })
                }
                onEdit={(b) => {
                  setEditingBathroom(b);
                  setIsEditModalOpen(true);
                }}
                onDelete={(b) => {
                  setDeletingBathroom(b);
                  setIsDeleteModalOpen(true);
                }}
                isToggling={toggleMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal for creating a new bathroom */}
      <CreateBathroomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['vendorBathrooms'] });
        }}
      />

      {/* Modal for modifying bathroom characteristics */}
      <EditBathroomModal
        isOpen={isEditModalOpen}
        bathroom={editingBathroom}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBathroom(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['vendorBathrooms'] });
        }}
      />

      {/* Modal for confirming bathroom deletion */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        bathroomTitle={deletingBathroom?.title || ''}
        isDeleting={deleteMutation.isPending}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingBathroom(null);
        }}
        onConfirm={() => {
          if (deletingBathroom) {
            deleteMutation.mutate(deletingBathroom.id);
          }
        }}
      />
    </div>
  );
};
