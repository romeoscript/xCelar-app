import { View } from 'react-native';

import { PhoneInput } from '@/components/ui/phone-input';
import { TextField } from '@/components/ui/text-field';
import { AddressField } from './address-field';
import { CountryField } from './country-field';

export type ImportSenderValues = {
  destinationCountry: string;
  destinationCountryName: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderLat: number | null;
  senderLng: number | null;
};

export type ImportSenderStepProps = {
  values: ImportSenderValues;
  onChange: (partial: Partial<ImportSenderValues>) => void;
  errors: Partial<Record<keyof ImportSenderValues, string>>;
};

/** Sender details for an import: the package originates abroad, so we collect
 *  the origin country plus the sender's contact and pickup address there. */
export function ImportSenderStep({ values, onChange, errors }: ImportSenderStepProps) {
  return (
    <View className="gap-4">
      <CountryField
        label="Origin country"
        required
        direction="IMPORT"
        error={errors.destinationCountry}
        value={values.destinationCountry}
        onChange={(country) =>
          onChange({ destinationCountry: country.code, destinationCountryName: country.name })
        }
        placeholder="Select origin country"
      />
      <TextField
        label="Sender's name"
        required
        error={errors.senderName}
        value={values.senderName}
        onChangeText={(value) => onChange({ senderName: value })}
        placeholder="Full name"
        autoCapitalize="words"
      />
      <PhoneInput
        label="Sender's phone"
        required
        error={errors.senderPhone}
        value={values.senderPhone}
        onChange={(value) => onChange({ senderPhone: value })}
      />
      <AddressField
        label="Pickup address"
        required
        error={errors.senderAddress}
        value={{ address: values.senderAddress, lat: values.senderLat, lng: values.senderLng }}
        onChange={(next) =>
          onChange({ senderAddress: next.address, senderLat: next.lat, senderLng: next.lng })
        }
      />
    </View>
  );
}
