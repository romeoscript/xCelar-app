import { Pressable, Text, View } from 'react-native';

import {
  type IconProps,
  BikeIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  DocumentIcon,
  HelpCircleIcon,
  MessageIcon,
  PackageIcon,
} from '@/components/icons';
import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import { type Shipment } from '@/lib/shipment-api';
import { shipmentStatusMeta, timeAgo } from '@/lib/shipment-status';

type Icon = (props: IconProps) => React.JSX.Element;

const HOW_IT_WORKS: { icon: Icon; title: string; body: string }[] = [
  { icon: PackageIcon, title: 'Book in a minute', body: 'Tell us what, where and when. Pay now or on delivery.' },
  { icon: BikeIcon, title: 'We pick it up', body: 'A vetted Xcelar rider collects it from your door.' },
  { icon: CheckCircleIcon, title: 'Follow it to the door', body: 'Live tracking at every stop until it’s signed for.' },
];

/** For people who haven't shipped yet: what happens after they book. */
export function HowItWorks() {
  return (
    <View className="mx-5 rounded-3xl bg-brand-surface p-5">
      {HOW_IT_WORKS.map((step, index) => (
        <View key={step.title} className="flex-row gap-4">
          <View className="items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
              <step.icon size={20} color={Brand.blue} />
            </View>
            {index < HOW_IT_WORKS.length - 1 ? <View className="my-1 w-0.5 flex-1 rounded-full bg-brand-mist" /> : null}
          </View>
          <View className={`flex-1 pt-1.5 ${index < HOW_IT_WORKS.length - 1 ? 'pb-5' : ''}`}>
            <Text className="text-base font-bold text-brand-navy">{step.title}</Text>
            <Text className="mt-0.5 text-sm leading-5 text-gray-500">{step.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Latest changes across your shipments, newest first, as a timeline. */
export function RecentActivity({ shipments, onOpen }: { shipments: Shipment[]; onOpen: (shipment: Shipment) => void }) {
  return (
    <View className="mx-5">
      {shipments.map((shipment, index) => {
        const status = shipmentStatusMeta(shipment);
        const route = [shipment.pickupZone, shipment.deliveryZone ?? shipment.destinationCountryName].filter(Boolean).join(' → ');
        const last = index === shipments.length - 1;
        return (
          <View key={shipment.id} className="flex-row gap-3">
            <Text className="w-16 pt-4 text-right text-xs text-gray-400">{timeAgo(shipment.updatedAt)}</Text>
            <View className="items-center">
              <View className={`mt-[18px] h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-brand-blue' : 'bg-brand-mist'}`} />
              {last ? null : <View className="w-0.5 flex-1 bg-brand-mist" />}
            </View>
            <Pressable
              onPress={() => {
                tapFeedback();
                onOpen(shipment);
              }}
              accessibilityRole="button"
              className="mb-2 flex-1 flex-row items-center rounded-2xl border border-gray-100 bg-white px-4 py-3 active:opacity-80"
            >
              <View className="flex-1">
                <Text className="text-sm font-bold text-brand-navy">{status.label}</Text>
                <Text className="mt-0.5 text-xs text-gray-500" numberOfLines={1}>
                  {[shipment.trackingCode, route].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <ChevronRightIcon size={16} color={Brand.muted} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/** Pitch for business accounts: monthly invoices on credit. */
export function BusinessCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      accessibilityRole="button"
      className="mx-5 flex-row items-center gap-4 overflow-hidden rounded-3xl bg-brand-navy p-5 active:opacity-90"
    >
      <View className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/5" />
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold">
        <DocumentIcon size={22} color={Brand.navy} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-white">Shipping for a business?</Text>
        <Text className="mt-0.5 text-sm leading-5 text-white/70">Book now, pay one invoice at the end of the month.</Text>
      </View>
      <ChevronRightIcon size={20} color="#FFFFFF" />
    </Pressable>
  );
}

/** Two ways to get an answer: the FAQ, or a person. */
export function HelpLinks({ onFaq, onContact }: { onFaq: () => void; onContact: () => void }) {
  return (
    <View className="mx-5 flex-row gap-3">
      <HelpTile icon={HelpCircleIcon} title="FAQs" body="Quick answers" onPress={onFaq} />
      <HelpTile icon={MessageIcon} title="Contact us" body="Talk to our team" onPress={onContact} />
    </View>
  );
}

function HelpTile({ icon: TileIcon, title, body, onPress }: { icon: Icon; title: string; body: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      accessibilityRole="button"
      className="flex-1 flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 active:opacity-80"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-blue-tint">
        <TileIcon size={20} color={Brand.blue} />
      </View>
      <View>
        <Text className="text-sm font-bold text-brand-navy">{title}</Text>
        <Text className="text-xs text-gray-500">{body}</Text>
      </View>
    </Pressable>
  );
}
