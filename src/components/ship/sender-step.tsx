import { Pressable, Text, View } from 'react-native';

import { PhoneInput } from '@/components/ui/phone-input';
import { TextField } from '@/components/ui/text-field';
import { tapFeedback } from '@/lib/haptics';
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
};

export type SenderStepProps = {
  values: SenderValues;
  onChange: (partial: Partial<SenderValues>) => void;
  defaultName: string;
  defaultPhone: string;
};

export function SenderStep({ values, onChange, defaultName, defaultPhone }: SenderStepProps) {
  const hasChosenSender = values.senderIsSelf !== null;

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
      </View>

      {hasChosenSender ? (
        <View className="gap-4">
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
          <TextField
            label="Sender's name"
            value={values.senderName}
            onChangeText={(value) => onChange({ senderName: value })}
            placeholder="Full name"
            autoCapitalize="words"
          />
          <PhoneInput
            label="Sender's phone"
            value={values.senderPhone}
            onChange={(value) => onChange({ senderPhone: value })}
          />
          <AddressField
            label="Pickup address"
            value={{ address: values.senderAddress, lat: values.senderLat, lng: values.senderLng }}
            onChange={(next) =>
              onChange({ senderAddress: next.address, senderLat: next.lat, senderLng: next.lng })
            }
          />
          <ZoneField
            label="Pickup zone"
            value={values.pickupZone}
            onChange={(zone) => onChange({ pickupZone: zone })}
            placeholder="Select pickup zone"
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
