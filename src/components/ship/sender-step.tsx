import { useQuery } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';

import { DateField } from '@/components/ui/date-field';
import { PhoneInput } from '@/components/ui/phone-input';
import { TextField } from '@/components/ui/text-field';
import { tapFeedback } from '@/lib/haptics';
import { getZones } from '@/lib/zone-api';
import { matchZoneName } from '@/lib/zone-match';
import { AddressField } from './address-field';
import { SavedAddresses } from './saved-addresses';
import { ZoneField } from './zone-field';

export type SenderValues = {
  senderIsSelf: boolean | null;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderLat: number | null;
  senderLng: number | null;
  pickupZone: string;
  pickupDate: Date | null;
};

export type SenderStepProps = {
  values: SenderValues;
  onChange: (partial: Partial<SenderValues>) => void;
  errors: Partial<Record<keyof SenderValues, string>>;
  defaultName: string;
  defaultPhone: string;
  /** Export collects the pickup date in its own step, so it hides it here. */
  showPickupDate?: boolean;
};

export function SenderStep({
  values,
  onChange,
  errors,
  defaultName,
  defaultPhone,
  showPickupDate = true,
}: SenderStepProps) {
  const hasChosenSender = values.senderIsSelf !== null;
  const zonesQuery = useQuery({ queryKey: ['zones'], queryFn: getZones });

  const suggestZone = (area: string | null, region: string | null) => {
    const match = matchZoneName(zonesQuery.data ?? [], area, region);
    if (match) {
      onChange({ pickupZone: match });
    }
  };

  const chooseSelf = () =>
    onChange({ senderIsSelf: true, senderName: defaultName, senderPhone: defaultPhone });

  const chooseOther = () =>
    onChange({
      senderIsSelf: false,
      ...(values.senderIsSelf === true ? { senderName: '', senderPhone: '' } : {}),
    });

  return (
    <View className="gap-6">
      <View className="gap-2">
        <Text className="text-base font-semibold text-brand-navy">Who is sending this package?</Text>
        <View className="flex-row gap-3">
          <ChoiceCard label="It's me" hint="Use my details" active={values.senderIsSelf === true} onPress={chooseSelf} />
          <ChoiceCard label="Someone else" hint="Enter details" active={values.senderIsSelf === false} onPress={chooseOther} />
        </View>
        {errors.senderIsSelf ? (
          <Text className="text-sm text-red-500">{errors.senderIsSelf}</Text>
        ) : null}
      </View>

      {hasChosenSender ? (
        <View className="gap-4">
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
            onZoneHint={suggestZone}
          />
          <ZoneField
            label="Pickup zone"
            required
            error={errors.pickupZone}
            value={values.pickupZone}
            onChange={(zone) => onChange({ pickupZone: zone })}
            placeholder="Select pickup zone"
          />
          {showPickupDate ? (
            <DateField
              label="Pickup date"
              required
              error={errors.pickupDate}
              value={values.pickupDate}
              onChange={(date) => onChange({ pickupDate: date })}
              placeholder="Select pickup date"
              minimumDate={new Date()}
            />
          ) : null}
          <SavedAddresses
            draft={{
              contactName: values.senderName,
              contactPhone: values.senderPhone,
              address: values.senderAddress,
              lat: values.senderLat,
              lng: values.senderLng,
              zone: values.pickupZone,
            }}
            onSelect={(entry) =>
              onChange({
                senderName: entry.contactName,
                senderPhone: entry.contactPhone,
                senderAddress: entry.address,
                senderLat: entry.lat,
                senderLng: entry.lng,
                pickupZone: entry.zone ?? '',
              })
            }
          />
        </View>
      ) : null}
    </View>
  );
}

function ChoiceCard({
  label,
  hint,
  active,
  onPress,
}: {
  label: string;
  hint: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      className={`flex-1 rounded-2xl border p-4 active:opacity-80 ${
        active ? 'border-brand-blue bg-brand-blue-tint' : 'border-gray-200 bg-white'
      }`}
    >
      <Text className={`text-base font-semibold ${active ? 'text-brand-blue' : 'text-gray-900'}`}>
        {label}
      </Text>
      <Text className="mt-0.5 text-xs text-gray-500">{hint}</Text>
    </Pressable>
  );
}
