export type ReservationStatus =
  | 'pending_payment'
  | 'paid'
  | 'used'
  | 'expired'
  | 'cancelled';

export interface SelectedExtraItem {
  id: string;
  name: string;
  price: number;
}

export interface ReservationBathroomSummary {
  id: string;
  title: string;
  address: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  photos: { url: string; is_cover?: boolean }[];
}

export interface Reservation {
  id: string;
  user_id: string;
  bathroom_id: string;
  turn_start: string;
  turn_end: string;
  turn_duration_minutes: number;
  status: ReservationStatus;
  price_base: number;
  price_extras: number;
  total_price: number;
  selected_extras: SelectedExtraItem[];
  qr_token: string;
  pin_code: string;
  checked_in_at: string | null;
  created_at: string;
  bathroom?: ReservationBathroomSummary;
}

export interface ReservationCreateInput {
  bathroom_id: string;
  extra_ids?: string[];
  turn_start?: string;
}

export interface PreferenceResponse {
  preference_id: string;
  init_point: string;
  sandbox_init_point: string;
  mode: 'mock' | 'live';
  total_amount: number;
}

export interface PaymentResult {
  id: string;
  reservation_id: string;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  payment_method: string;
  gross_amount: number;
  fee_tronno: number;
  net_vendor_amount: number;
  created_at: string;
}
