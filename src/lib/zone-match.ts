import { type Zone } from './zone-api';

/**
 * Best-effort match of a geocoded area/region to one of the zone names
 * (which are "LGA, State"). Returns the matching zone name, or null.
 */
export function matchZoneName(zones: Zone[], area: string | null, region: string | null): string | null {
  const areaTerm = area?.trim().toLowerCase();
  const regionTerm = region?.trim().toLowerCase();
  if (!areaTerm && !regionTerm) {
    return null;
  }

  if (areaTerm && regionTerm) {
    const exact = zones.find((zone) => zone.name.toLowerCase() === `${areaTerm}, ${regionTerm}`);
    if (exact) {
      return exact.name;
    }
    const both = zones.find((zone) => {
      const name = zone.name.toLowerCase();
      return name.includes(areaTerm) && name.includes(regionTerm);
    });
    if (both) {
      return both.name;
    }
  }

  if (areaTerm) {
    const byArea = zones.find((zone) => zone.name.toLowerCase().startsWith(`${areaTerm},`));
    if (byArea) {
      return byArea.name;
    }
  }

  return null;
}
