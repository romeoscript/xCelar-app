import { useQuery } from '@tanstack/react-query';

import { getMyRiderProfile, type VehicleType } from '@/lib/rider-api';

/**
 * The signed-in rider's vehicle type, read from the shared rider-profile cache.
 * Drives the map's routing profile and the rider marker icon so the route always
 * matches the vehicle they onboarded with — no manual travel-mode picker.
 */
export function useRiderVehicle(): VehicleType | undefined {
  const { data } = useQuery({ queryKey: ['rider-profile'], queryFn: getMyRiderProfile });
  return data?.vehicleType;
}
