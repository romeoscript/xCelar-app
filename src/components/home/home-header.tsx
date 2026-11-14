import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { JourneyProgress } from '@/components/home/journey-progress';
import { ChevronRightIcon, PlusIcon } from '@/components/icons';
import { TAB_HEADER_OVERLAP } from '@/components/tab-header';
import { Brand } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { type Shipment } from '@/lib/shipment-api';
import { areaName, journeyFor, shipmentStatusMeta } from '@/lib/shipment-status';

const courier = require('@/assets/images/courier-character.webp');

/** How far the tracking search overlaps the bottom of the header. */
export const SEARCH_OVERLAP = TAB_HEADER_OVERLAP;

export type HomeHeaderProps = {
  firstName: string;
  initials: string;
  avatarUrl?: string | null;
  balanceKobo: number;
  activeShipment?: Shipment;
  onAccount: () => void;
  onWallet: () => void;
  onTrack: (shipment: Shipment) => void;
  onBook: () => void;
};

/**
 * Blue header that answers "where's my package?" first: the delivery that's
 * moving now with its stops, or, when nothing is, a nudge to book one.
 */
export function HomeHeader(props: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const { activeShipment } = props;

  return (
    <LinearGradient
      colors={[Brand.blue, Brand.blueDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top + 10,
        paddingBottom: SEARCH_OVERLAP + 22,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
      }}
    >
      <View className="absolute -right-20 -top-16 h-64 w-64 rounded-full bg-white/10" />
      <GreetingRow {...props} />
      {activeShipment ? (
        <CurrentDelivery shipment={activeShipment} onTrack={() => props.onTrack(activeShipment)} />
      ) : (
        <NothingMoving onBook={props.onBook} />
      )}
    </LinearGradient>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

function GreetingRow({ firstName, initials, avatarUrl, balanceKobo, onAccount, onWallet }: HomeHeaderProps) {
  return (
    <View className="flex-row items-center justify-between">
      <Pressable
        onPress={onAccount}
        accessibilityRole="button"
        accessibilityLabel="Your account"
        className="flex-row items-center gap-3 active:opacity-80"
      >
        <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-brand-gold">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ width: 44, height: 44 }} contentFit="cover" />
          ) : (
            <Text className="text-base font-bold text-brand-navy">{initials}</Text>
          )}
        </View>
        <View>
          <Text className="text-xs text-white/75">{greeting()}</Text>
          <Text className="text-lg font-bold text-white">{firstName}</Text>
        </View>
      </Pressable>

      <Pressable
        onPress={() => {
          tapFeedback();
          onWallet();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Wallet, ${formatNaira(balanceKobo / 100)}. Top up`}
        className="flex-row items-center gap-2 rounded-full bg-white/15 py-1.5 pl-3.5 pr-1.5 active:opacity-80"
      >
        <Text className="text-sm font-bold text-white">{formatNaira(balanceKobo / 100)}</Text>
        <View className="h-7 w-7 items-center justify-center rounded-full bg-brand-gold">
          <PlusIcon size={14} color={Brand.navy} />
        </View>
      </Pressable>
    </View>
  );
}

function CurrentDelivery({ shipment, onTrack }: { shipment: Shipment; onTrack: () => void }) {
  const status = shipmentStatusMeta(shipment).label;
  const { steps } = journeyFor(shipment);
  const from = areaName(shipment.pickupZone);
  const to = areaName(shipment.deliveryZone) ?? shipment.destinationCountryName;

  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onTrack();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Track ${shipment.trackingCode ?? 'delivery'}, ${status}`}
      className="mt-7 active:opacity-90"
    >
      <View className="flex-row items-center gap-2">
        <Text className="text-sm text-white/80">Current delivery</Text>
        <View className="rounded-full bg-white px-2.5 py-0.5">
          <Text className="text-xs font-bold text-brand-blue">{status}</Text>
        </View>
      </View>

      <View className="mt-1 flex-row items-center justify-between">
        <Text className="text-[32px] font-extrabold tracking-tight text-white" numberOfLines={1} adjustsFontSizeToFit>
          {shipment.trackingCode ?? 'Booked'}
        </Text>
        <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-navy">
          <ChevronRightIcon size={22} color="#FFFFFF" />
        </View>
      </View>

      {from || to ? (
        <Text className="mt-1 text-sm text-white/80" numberOfLines={1}>
          {[from, to].filter(Boolean).join('  →  ')}
        </Text>
      ) : null}

      <View className="mt-5">
        <JourneyProgress steps={steps} />
      </View>
    </Pressable>
  );
}

function NothingMoving({ onBook }: { onBook: () => void }) {
  return (
    <View className="mt-4 flex-row items-end">
      <View className="flex-1 pb-1 pr-2">
        <Text className="text-2xl font-extrabold leading-8 text-white">Nothing on{'\n'}the move yet</Text>
        <Text className="mt-1.5 text-sm leading-5 text-white/80">
          Book a pickup and track it{'\n'}stop by stop.
        </Text>
        <Pressable
          onPress={() => {
            tapFeedback();
            onBook();
          }}
          accessibilityRole="button"
          className="mt-4 flex-row items-center self-start rounded-full bg-brand-gold py-2.5 pl-4 pr-3 active:opacity-90"
        >
          <Text className="text-sm font-bold text-brand-navy">Send a package</Text>
          <ChevronRightIcon size={16} color={Brand.navy} />
        </Pressable>
      </View>
      {/* Same courier as sign-in, at the image's own 540×675 proportions. */}
      <Image source={courier} style={{ width: 128, height: 160, marginBottom: -SEARCH_OVERLAP - 22 }} contentFit="contain" accessible={false} />
    </View>
  );
}
