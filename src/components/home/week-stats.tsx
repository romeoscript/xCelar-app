import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { CheckCircleIcon, PackageIcon, WalletIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { type WeekStats as Stats } from '@/lib/shipment-stats';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CHART_HEIGHT = 84;
const BAR_GROW_MS = 600;

function weekLabel(start: Date): string {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const day = (date: Date) => date.toLocaleDateString('en-GB', { day: 'numeric' });
  const month = (date: Date) => date.toLocaleDateString('en-GB', { month: 'short' });
  return start.getMonth() === end.getMonth()
    ? `${day(start)}–${day(end)} ${month(end)}`
    : `${day(start)} ${month(start)} – ${day(end)} ${month(end)}`;
}

function changeLabel(sent: number, lastWeek: number): string | null {
  if (lastWeek === 0) return null;
  const change = Math.round(((sent - lastWeek) / lastWeek) * 100);
  return `${change >= 0 ? '+' : ''}${change}%`;
}

/** This week at a glance: parcels sent by day, deliveries done, and spend. */
export function WeekStats({ stats }: { stats: Stats }) {
  const today = (new Date().getDay() + 6) % 7;
  const busiest = Math.max(1, ...stats.perDay);
  const change = changeLabel(stats.sent, stats.sentLastWeek);

  return (
    <View className="mx-5 flex-row gap-3">
      <View className="flex-1 rounded-3xl bg-brand-blue-tint p-4">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-white">
            <PackageIcon size={16} color={Brand.blue} />
          </View>
          <View>
            <Text className="text-sm font-bold text-brand-navy">Parcels sent</Text>
            <Text className="text-xs text-gray-500">{weekLabel(stats.weekStart)}</Text>
          </View>
        </View>
        <View className="mt-3 flex-row items-end justify-between">
          <Text className="text-4xl font-extrabold text-brand-navy">{stats.sent}</Text>
          {change ? (
            <View className="mb-1.5 rounded-full bg-white px-2 py-0.5">
              <Text className="text-xs font-bold text-brand-blue">{change}</Text>
            </View>
          ) : null}
        </View>
        <View className="mt-3 flex-row items-end justify-between" style={{ height: CHART_HEIGHT + 18 }}>
          {stats.perDay.map((count, index) => (
            <Bar key={index} count={count} max={busiest} index={index} label={DAY_LABELS[index]} isToday={index === today} />
          ))}
        </View>
      </View>

      <View className="w-[40%] gap-3">
        <Tile
          icon={<CheckCircleIcon size={16} color={Brand.blue} />}
          value={String(stats.delivered)}
          label="Delivered"
          note={stats.inProgress > 0 ? `${stats.inProgress} on the way` : 'All caught up'}
        />
        <Tile
          icon={<WalletIcon size={16} color={Brand.blue} />}
          value={formatNaira(stats.spentKobo / 100)}
          label="Spent this week"
        />
      </View>
    </View>
  );
}

function Bar({ count, max, index, label, isToday }: { count: number; max: number; index: number; label: string; isToday: boolean }) {
  const reduceMotion = useReducedMotion();
  const target = count === 0 ? 4 : Math.max(10, (count / max) * CHART_HEIGHT);
  const height = useSharedValue(reduceMotion ? target : 4);

  useEffect(() => {
    height.value = reduceMotion
      ? target
      : withDelay(150 + index * 50, withTiming(target, { duration: BAR_GROW_MS, easing: Easing.out(Easing.cubic) }));
  }, [height, index, reduceMotion, target]);

  const style = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <View className="items-center gap-1" accessibilityLabel={`${count} sent`}>
      {isToday && count > 0 ? <Text className="text-[10px] font-bold text-brand-navy">{count}</Text> : null}
      <Animated.View style={style} className={`w-3.5 rounded-full ${isToday ? 'bg-brand-blue' : count > 0 ? 'bg-brand-blue-light' : 'bg-white'}`} />
      <Text className={`text-[10px] ${isToday ? 'font-bold text-brand-navy' : 'text-gray-400'}`}>{label}</Text>
    </View>
  );
}

function Tile({ icon, value, label, note }: { icon: React.ReactNode; value: string; label: string; note?: string }) {
  return (
    <View className="flex-1 justify-between rounded-3xl bg-brand-surface p-4">
      <View className="h-8 w-8 items-center justify-center rounded-xl bg-white">{icon}</View>
      <View className="mt-2">
        <Text className="text-lg font-extrabold text-brand-navy" numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text className="text-xs font-semibold text-brand-navy">{label}</Text>
        {note ? <Text className="text-[11px] text-gray-500">{note}</Text> : null}
      </View>
    </View>
  );
}
