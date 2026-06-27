import { api } from './api';

export type Product = {
  id: string;
  name: string;
  description: string | null;
  priceKobo: number;
  imageUrl: string | null;
  section: string | null;
};

export type Vendor = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  isVerified: boolean;
  rating: number | null;
  etaLabel: string | null;
  isOpen: boolean;
  address: string;
  zone: string | null;
};

export type VendorDetail = Vendor & { products: Product[] };

export type OrderItem = {
  id: string;
  name: string;
  unitPriceKobo: number;
  quantity: number;
  lineTotalKobo: number;
};

export type Order = {
  id: string;
  vendorId: string;
  vendorName: string;
  status: string;
  subtotalKobo: number;
  deliveryFeeKobo: number;
  totalKobo: number;
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  paid: boolean;
  paymentMethod: string | null;
  shipmentId: string | null;
  createdAt: string;
  items: OrderItem[];
};

export type CreateOrderInput = {
  vendorId: string;
  items: { productId: string; quantity: number }[];
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryZone?: string;
  note?: string;
};

export async function getVendors(category?: string): Promise<Vendor[]> {
  const { data } = await api.get<Vendor[]>('/marketplace/vendors', {
    params: category ? { category } : {},
  });
  return data;
}

export async function getVendor(id: string): Promise<VendorDetail> {
  const { data } = await api.get<VendorDetail>(`/marketplace/vendors/${id}`);
  return data;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { data } = await api.post<Order>('/marketplace/orders', input);
  return data;
}

export async function getOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>('/marketplace/orders');
  return data;
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await api.get<Order>(`/marketplace/orders/${id}`);
  return data;
}

export async function payOrderWithBalance(id: string): Promise<Order> {
  const { data } = await api.post<{ order: Order }>(`/marketplace/orders/${id}/pay`, {
    method: 'balance',
  });
  return data.order;
}

export async function initPaystackForOrder(
  id: string,
): Promise<{ authorizationUrl: string; reference: string }> {
  const { data } = await api.post<{ authorizationUrl: string; reference: string }>(
    `/marketplace/orders/${id}/pay`,
    { method: 'paystack' },
  );
  return data;
}
