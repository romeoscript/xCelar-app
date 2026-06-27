import { View } from 'react-native';

import { PhoneInput } from '@/components/ui/phone-input';
import { TextField } from '@/components/ui/text-field';
import { AddressField } from './address-field';
import { CountryField } from './country-field';
import { SavedAddresses } from './saved-addresses';

export type ExportRecipientValues = {
  receiverName: string;
  receiverEmail: string;
  receiverPhone: string;
  receiverAltPhone: string;
  destinationCountry: string;
  destinationCountryName: string;
  receiverAddress: string;
  receiverLat: number | null;
  receiverLng: number | null;
};

export type ExportRecipientStepProps = {
  values: ExportRecipientValues;
  onChange: (partial: Partial<ExportRecipientValues>) => void;
  errors: Partial<Record<keyof ExportRecipientValues, string>>;
};

export function ExportRecipientStep({ values, onChange, errors }: ExportRecipientStepProps) {
  return (
    <View className="gap-4">
      <TextField
        label="Full name"
        required
        error={errors.receiverName}
        value={values.receiverName}
        onChangeText={(value) => onChange({ receiverName: value })}
        placeholder="Recipient's full name"
        autoCapitalize="words"
      />
      <TextField
        label="Email"
        required
        error={errors.receiverEmail}
        value={values.receiverEmail}
        onChangeText={(value) => onChange({ receiverEmail: value })}
        placeholder="recipient@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <PhoneInput
        label="Phone number"
        required
        error={errors.receiverPhone}
        value={values.receiverPhone}
        onChange={(value) => onChange({ receiverPhone: value })}
      />
      <PhoneInput
        label="Alternative phone number"
        value={values.receiverAltPhone}
        onChange={(value) => onChange({ receiverAltPhone: value })}
      />
      <CountryField
        label="Destination country"
        required
        error={errors.destinationCountry}
        value={values.destinationCountry}
        onChange={(country) =>
          onChange({ destinationCountry: country.code, destinationCountryName: country.name })
        }
        placeholder="Select destination country"
      />
      <AddressField
        label="Recipient address"
        required
        error={errors.receiverAddress}
        value={{
          address: values.receiverAddress,
          lat: values.receiverLat,
          lng: values.receiverLng,
        }}
        onChange={(next) =>
          onChange({ receiverAddress: next.address, receiverLat: next.lat, receiverLng: next.lng })
        }
      />
      <SavedAddresses
        draft={{
          contactName: values.receiverName,
          contactPhone: values.receiverPhone,
          address: values.receiverAddress,
          lat: values.receiverLat,
          lng: values.receiverLng,
          zone: values.destinationCountryName,
        }}
        onSelect={(entry) =>
          onChange({
            receiverName: entry.contactName,
            receiverPhone: entry.contactPhone,
            receiverAddress: entry.address,
            receiverLat: entry.lat,
            receiverLng: entry.lng,
          })
        }
      />
    </View>
  );
}
