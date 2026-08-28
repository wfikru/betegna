import type { GeoPoint } from '../models/types';

/** Addis Ababa sub-cities with approximate centers (for distance matching). */
export interface Subcity {
  id: string;
  name: string;
  nameAm: string;
  geo: GeoPoint;
}

export const SUBCITIES: Subcity[] = [
  { id: 'bole', name: 'Bole', nameAm: 'ቦሌ', geo: { lat: 8.9936, lng: 38.7871 } },
  { id: 'yeka', name: 'Yeka', nameAm: 'የካ', geo: { lat: 9.0156, lng: 38.7924 } },
  { id: 'kirkos', name: 'Kirkos', nameAm: 'ቂርቆስ', geo: { lat: 9.0108, lng: 38.7625 } },
  { id: 'arada', name: 'Arada', nameAm: 'አራዳ', geo: { lat: 9.035, lng: 38.7522 } },
  { id: 'gullele', name: 'Gullele', nameAm: 'ጉለሌ', geo: { lat: 9.05, lng: 38.7305 } },
  { id: 'lideta', name: 'Lideta', nameAm: 'ልደታ', geo: { lat: 9.02, lng: 38.7355 } },
  { id: 'addis-ketema', name: 'Addis Ketema', nameAm: 'አዲስ ከተማ', geo: { lat: 9.037, lng: 38.7383 } },
  { id: 'nifas-silk', name: 'Nifas Silk', nameAm: 'ንፋስ ስልክ', geo: { lat: 8.9886, lng: 38.7534 } },
  { id: 'kolfe', name: 'Kolfe Keranio', nameAm: 'ኮልፌ ቀራንዮ', geo: { lat: 9.0074, lng: 38.7021 } },
  { id: 'akaki', name: 'Akaki Kaliti', nameAm: 'አካኪ ቃሊቲ', geo: { lat: 8.9523, lng: 38.7708 } },
];

export const CITY = 'Addis Ababa';

export const CITY_CENTER: GeoPoint = { lat: 9.0192, lng: 38.7525 };

export function subcityByName(name: string): Subcity | undefined {
  return SUBCITIES.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

export function subcityById(id: string): Subcity | undefined {
  return SUBCITIES.find((s) => s.id === id);
}
