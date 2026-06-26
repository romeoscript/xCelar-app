import { Pressable, Text, View } from 'react-native';

type QuickAction = {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
  cardClassName: string;
};

const ACTIONS: QuickAction[] = [
  {
    key: 'ship-local',
    emoji: '🇳🇬',
    title: 'Ship locally',
    subtitle: 'Send within Nigeria',
    cardClassName: 'bg-brand-blue-tint',
  },
  {
    key: 'export',
    emoji: '✈️',
    title: 'Export',
    subtitle: 'Send from Nigeria',
    cardClassName: 'bg-brand-gold-tint',
  },
  {
    key: 'import',
    emoji: '📦',
    title: 'Import',
    subtitle: 'Send to Nigeria',
    cardClassName: 'bg-brand-indigo-tint',
  },
  {
    key: 'quote',
    emoji: '🧮',
    title: 'Quote',
    subtitle: 'Estimate shipment cost',
    cardClassName: 'bg-brand-surface',
  },
];

export function QuickActions() {
  return (
    <View className="flex-row flex-wrap justify-between">
      {ACTIONS.map((action) => (
        <QuickActionCard key={action.key} action={action} />
      ))}
    </View>
  );
}

function QuickActionCard({ action }: { action: QuickAction }) {
  // TODO: route each action to its booking flow once those screens exist.
  const handlePress = () => {};

  return (
    <Pressable
      onPress={handlePress}
      className={`mb-4 w-[48%] gap-6 rounded-3xl p-5 active:opacity-80 ${action.cardClassName}`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
        <Text className="text-lg">{action.emoji}</Text>
      </View>
      <View className="gap-1">
        <Text className="text-lg font-bold text-brand-navy">{action.title}</Text>
        <Text className="text-sm text-gray-500">{action.subtitle}</Text>
      </View>
    </Pressable>
  );
}
