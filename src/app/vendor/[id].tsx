import { useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MinusIcon, PlusIcon, StarIcon, StorefrontIcon, VerifiedBadgeIcon } from '@/components/icons';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand } from '@/constants/theme';
import { cartCount, cartSubtotalKobo, useCartStore } from '@/lib/cart-store';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { getVendor, type Product, type Vendor } from '@/lib/marketplace-api';

export default function VendorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const vendorQuery = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => getVendor(id as string),
    enabled: Boolean(id),
  });

  const cartVendor = useCartStore((state) => state.vendor);
  const lines = useCartStore((state) => state.lines);

  if (!id) {
    return <Redirect href="/marketplace" />;
  }

  const vendor = vendorQuery.data;
  const sections = groupBySection(vendor?.products ?? []);
  const showCartBar = cartVendor?.id === id && lines.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScreenHeader title={vendor?.name ?? 'Vendor'} />

      {vendorQuery.isLoading || !vendor ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Brand.blue} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, gap: 16 }}>
          <View className="h-40 overflow-hidden rounded-2xl bg-brand-surface">
            {vendor.coverImageUrl ? (
              <Image source={{ uri: vendor.coverImageUrl }} className="h-40 w-full" resizeMode="cover" />
            ) : (
              <View className="h-40 w-full items-center justify-center">
                <StorefrontIcon size={32} color={Brand.muted} />
              </View>
            )}
            {!vendor.isOpen ? (
              <View className="absolute inset-0 items-center justify-center bg-black/55">
                <Text className="text-base font-bold text-white">Closed</Text>
              </View>
            ) : null}
          </View>

          <View className="gap-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-xl font-extrabold text-brand-navy">{vendor.name}</Text>
              {vendor.isVerified ? <VerifiedBadgeIcon size={18} color={Brand.blue} /> : null}
            </View>
            <View className="flex-row items-center gap-3">
              {vendor.rating != null ? (
                <View className="flex-row items-center gap-1">
                  <StarIcon size={14} color={Brand.gold} />
                  <Text className="text-sm font-medium text-gray-700">{vendor.rating.toFixed(1)}</Text>
                </View>
              ) : null}
              {vendor.etaLabel ? <Text className="text-sm text-gray-500">{vendor.etaLabel}</Text> : null}
              <Text className="text-sm text-gray-400">· {vendor.category}</Text>
            </View>
            {vendor.description ? (
              <Text className="text-sm text-gray-500">{vendor.description}</Text>
            ) : null}
          </View>

          {sections.map((section) => (
            <View key={section.title} className="gap-2">
              {section.title ? (
                <Text className="text-base font-bold text-brand-navy">{section.title}</Text>
              ) : null}
              {section.products.map((product) => (
                <ProductRow key={product.id} vendor={vendor} product={product} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {showCartBar ? (
        <View className="absolute inset-x-0 bottom-0 border-t border-gray-100 bg-white px-6 pb-8 pt-3">
          <Pressable
            onPress={() => router.push('/cart')}
            className="flex-row items-center justify-between rounded-full bg-brand-blue px-5 py-4 active:opacity-90"
          >
            <Text className="text-base font-bold text-white">View cart ({cartCount(lines)})</Text>
            <Text className="text-base font-bold text-white">
              {formatNaira(cartSubtotalKobo(lines) / 100)}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function ProductRow({ vendor, product }: { vendor: Vendor; product: Product }) {
  const lines = useCartStore((state) => state.lines);
  const cartVendor = useCartStore((state) => state.vendor);
  const add = useCartStore((state) => state.add);
  const setQuantity = useCartStore((state) => state.setQuantity);

  const quantity = cartVendor?.id === vendor.id
    ? (lines.find((line) => line.product.id === product.id)?.quantity ?? 0)
    : 0;

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3">
      {product.imageUrl ? (
        <Image
          source={{ uri: product.imageUrl }}
          className="h-16 w-16 rounded-xl bg-brand-surface"
          resizeMode="cover"
        />
      ) : null}
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">{product.name}</Text>
        {product.description ? (
          <Text className="text-sm text-gray-500" numberOfLines={2}>
            {product.description}
          </Text>
        ) : null}
        <Text className="mt-1 text-sm font-bold text-brand-navy">
          {formatNaira(product.priceKobo / 100)}
        </Text>
      </View>

      {quantity > 0 ? (
        <View className="flex-row items-center gap-3">
          <Stepper icon={MinusIcon} onPress={() => setQuantity(product.id, quantity - 1)} />
          <Text className="w-5 text-center text-base font-bold text-brand-navy">{quantity}</Text>
          <Stepper icon={PlusIcon} onPress={() => add(vendor, product)} />
        </View>
      ) : (
        <Pressable
          onPress={() => {
            tapFeedback();
            add(vendor, product);
          }}
          className="rounded-full bg-brand-blue-tint px-4 py-2 active:opacity-70"
        >
          <Text className="text-sm font-bold text-brand-blue">Add</Text>
        </Pressable>
      )}
    </View>
  );
}

function Stepper({
  icon: Icon,
  onPress,
}: {
  icon: typeof PlusIcon;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      className="h-8 w-8 items-center justify-center rounded-full bg-brand-blue active:opacity-80"
    >
      <Icon size={16} color="#ffffff" />
    </Pressable>
  );
}

function groupBySection(products: Product[]): { title: string; products: Product[] }[] {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const key = product.section ?? '';
    const list = groups.get(key) ?? [];
    list.push(product);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).map(([title, items]) => ({ title, products: items }));
}
