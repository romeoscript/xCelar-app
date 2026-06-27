import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { PhoneInput } from '@/components/ui/phone-input';
import { TextField } from '@/components/ui/text-field';
import { getZones } from '@/lib/zone-api';
import { matchZoneName } from '@/lib/zone-match';
import { AddressField } from './address-field';
import { SavedAddresses } from './saved-addresses';
import { ZoneField } from './zone-field';

export type ReceiverValues = {
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverLat: number | null;
  receiverLng: number | null;
  deliveryZone: string;
};

export type ReceiverStepProps = {
  values: ReceiverValues;
  onChange: (partial: Partial<ReceiverValues>) => void;
};

export function ReceiverStep({ values, onChange }: ReceiverStepProps) {
  const zonesQuery = useQuery({ queryKey: ['zones'], queryFn: getZones });

  const suggestZone = (area: string | null, region: string | null) => {
    const match = matchZoneName(zonesQuery.data ?? [], area, region);
    if (match) {
      onChange({ deliveryZone: match });
    }
  };

  return (
    <View className="gap-4">
      <SavedAddresses
        draft={{
          contactName: values.receiverName,
          contactPhone: values.receiverPhone,
          address: values.receiverAddress,
          lat: values.receiverLat,
          lng: values.receiverLng,
          zone: values.deliveryZone,
        }}
        onSelect={(entry) =>
          onChange({
            receiverName: entry.contactName,
            receiverPhone: entry.contactPhone,
            receiverAddress: entry.address,
            receiverLat: entry.lat,
            receiverLng: entry.lng,
            deliveryZone: entry.zone ?? '',
          })
        }
      />
      <TextField
        label="Receiver's name"
        value={values.receiverName}
        onChangeText={(value) => onChange({ receiverName: value })}
        placeholder="Full name"
        autoCapitalize="words"
      />
      <PhoneInput
        label="Receiver's phone"
        value={values.receiverPhone}
        onChange={(value) => onChange({ receiverPhone: value })}
      />
      <AddressField
        label="Delivery address"
        value={{ address: values.receiverAddress, lat: values.receiverLat, lng: values.receiverLng }}
        onChange={(next) =>
          onChange({ receiverAddress: next.address, receiverLat: next.lat, receiverLng: next.lng })
        }
        onZoneHint={suggestZone}
      />
      <ZoneField
        label="Delivery zone"
        value={values.deliveryZone}
        onChange={(zone) => onChange({ deliveryZone: zone })}
        placeholder="Select delivery zone"
      />
    </View>
  );
}
