/**
 * Textos centralizados en Español (Argentina, rioplatense con voseo "vos").
 * No escribir cadenas de texto para el usuario directamente en componentes.
 */

export const esAR = {
  appName: 'Tronno',
  tagline: 'Encontrá, reservá y usá baños limpios y seguros al instante',
  currency: 'ARS',
  timezoneLabel: 'Hora local de Buenos Aires',

  nav: {
    home: 'Inicio',
    search: 'Buscar baños',
    myBookings: 'Mis reservas',
    vendorArea: 'Espacio Vendedor',
    adminArea: 'Panel Admin',
    login: 'Ingresar',
    signup: 'Registrate',
    profile: 'Tu perfil',
  },

  roles: {
    user: 'Usuario',
    vendor: 'Vendedor',
    admin: 'Administrador',
  },

  accountStates: {
    revision: 'En revisión',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
    activo: 'Activo',
    inactivo: 'Inactivo',
  },

  reservationStates: {
    pendiente_pago: 'Pendiente de pago',
    pagada: 'Pagada (Listo para usar)',
    en_uso: 'En uso',
    completada: 'Completada',
    expirada_sin_uso: 'Expirada sin uso',
    cancelada_por_falta_de_pago: 'Cancelada por falta de pago',
  },

  home: {
    heroTitle: '¿Buscás un baño confiable cerca tuyo?',
    heroSubtitle: 'Olvidate de dar vueltas. Reservá un baño limpio verificado por la comunidad y pagá de forma segura en pesos.',
    ctaSearch: 'Buscar baños ahora',
    ctaVendor: 'Ofrecé tu baño y ganá plata',
    featuresTitle: '¿Por qué usar Tronno?',
    feature1Title: 'Cerca y disponible ya',
    feature1Desc: 'Mirá en el mapa los baños activos a tu alrededor con horarios reales y disponibilidad inmediata.',
    feature2Title: 'Pagos rápidos y en pesos',
    feature2Desc: 'Pagá con Mercado Pago sin efectivo ni complicaciones. Todo en moneda nacional con tarifas claras.',
    feature3Title: 'Acceso seguro con QR',
    feature3Desc: 'Llegás al lugar, mostrás tu código QR o código numérico desde el celu y entrás al instante.',
    systemStatus: 'Estado de los servicios',
    backendStatus: 'Servidor Backend',
    databaseStatus: 'Base de Datos (PostGIS)',
    paymentsModeStatus: 'Modo de Pagos',
  },

  userArea: {
    title: 'Área de Usuarios',
    subtitle: 'Acá vas a ver tus reservas activas, códigos QR y tu historial de uso.',
    emptyReservations: 'Todavía no tenés reservas activas.',
    findNearby: 'Buscar baños en el mapa',
  },

  vendorArea: {
    title: 'Espacio para Vendedores',
    subtitle: 'Administrá tus baños, escaneá códigos QR de usuarios y consultá tus liquidaciones.',
    approvalNotice: 'Tu cuenta está en revisión. El administrador la habilitará a la brevedad.',
    activeBathrooms: 'Tus baños publicados',
    todayReservations: 'Reservas de hoy',
    scanQrBtn: 'Escanear código QR',
  },

  adminArea: {
    title: 'Panel de Control - Administrador',
    subtitle: 'Gestión centralizada de la plataforma, liquidaciones a vendedores y catálogo.',
    badgeDesktopOnly: 'Vista optimizada para escritorio',
    kpiTotalCollected: 'Total recaudado',
    kpiPendingPayouts: 'Pendiente a liquidar',
    kpiAdminEarnings: 'Ganancias comisión',
    kpiActiveBathrooms: 'Baños activos',
  },

  common: {
    loading: 'Cargando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    accept: 'Aceptar',
    error: 'Ocurrió un error inesperado. Por favor, intentá de nuevo más tarde.',
    success: 'Operación realizada con éxito.',
    back: 'Volver',
    viewDetails: 'Ver detalles',
  },
} as const;

export type Translations = typeof esAR;
