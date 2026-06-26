import { api } from './api';

export type Zone = {
  id: string;
  name: string;
};

export async function getZones(): Promise<Zone[]> {
  const { data } = await api.get<Zone[]>('/zones');
  return data;
}
