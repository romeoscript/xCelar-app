import { api } from './api';

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  imageUrl: string | null;
  bgColor: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
};

export async function getBanners(): Promise<Banner[]> {
  const { data } = await api.get<Banner[]>('/banners');
  return data;
}
