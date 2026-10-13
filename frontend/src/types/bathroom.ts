/**
 * TypeScript types for Bathrooms, Extras and Operating Hours.
 */

export interface BathroomPhoto {
  url: string;
  public_id?: string;
  is_cover: boolean;
}

export interface OpeningHourDay {
  day_of_week: number; // 0=Lunes, 6=Domingo
  day_name: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface BathroomExtra {
  id?: string;
  bathroom_id?: string;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
}

export interface Bathroom {
  id: string;
  vendor_id: string;
  title: string;
  description?: string;
  address: string;
  city: string;
  province: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  price_base: number;
  turn_duration_minutes: number;
  cleaning_interval_minutes: number;
  is_active: boolean;
  is_approved: boolean;
  rules: string[];
  amenities: string[];
  opening_hours: OpeningHourDay[];
  photos: BathroomPhoto[];
  extras: BathroomExtra[];
  created_at: string;
  updated_at: string;
}

export interface BathroomListResponse {
  items: Bathroom[];
  total: number;
}

export interface BathroomSearchResult extends Bathroom {
  distance_meters: number;
  distance_km: number;
}

export interface BathroomSearchResponse {
  items: BathroomSearchResult[];
  total: number;
  center_lat: number;
  center_lng: number;
  radius_km: number;
}

export interface BathroomCreateInput {
  title: string;
  description?: string;
  address: string;
  city: string;
  province: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  price_base: number;
  turn_duration_minutes: number;
  cleaning_interval_minutes: number;
  rules: string[];
  amenities: string[];
  opening_hours: OpeningHourDay[];
  photos: BathroomPhoto[];
  extras?: Array<{
    name: string;
    description?: string;
    price: number;
    is_active: boolean;
  }>;
}
