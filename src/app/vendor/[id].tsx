import { useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ChevronLeftIcon,
  MinusIcon,
  PlusIcon,
  StarIcon,
  StorefrontIcon,
  VerifiedBadgeIcon,
} from '@/components/icons';
import { Brand } from '@/constants/theme';
import { cartCount, cartSubtotalKobo, useCartStore } from '@/lib/cart-store';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { getVendor, type Product, type Vendor } from '@/lib/marketplace-api';

const HEADER_HEIGHT = 280;

export default function VendorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollY = useRef(new Animated.Value(0)).current;

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
  const showCartBar = cartVendor?.id === id && lines.length > 0;

  if (vendorQuery.isLoading || !vendor) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <StatusBar style="dark" />
        <ActivityIndicator color={Brand.blue} />
      </View>
    );
  }

  const sections = groupBySection(vendor.products);

  // Parallax: drift the cover at half-speed on scroll up, stretch it on pull-down.
  const coverStyle = {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, HEADER_HEIGHT],
          outputRange: [0, HEADER_HEIGHT * 0.5],
          extrapolate: 'clamp' as const,
        }),
      },
      {
        scale: scrollY.interpolate({
          inputRange: [-HEADER_HEIGHT, 0],
          outputRange: [2, 1],
          extrapolateRight: 'clamp' as const,
        }),
      },
    ],
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <Animated.View style={[{ height: HEADER_HEIGHT, backgroundColor: '#F2F4F8' }, coverStyle]}>
          {vendor.coverImageUrl ? (
            <Image source={{ uri: vendor.coverImageUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <StorefrontIcon size={40} color={Brand.muted} />
            </View>
          )}
          {!vendor.isOpen ? (
            <View className="absolute inset-0 items-center justify-center bg-black/55">
              <Text className="text-lg font-bold text-white">Closed</Text>
            </View>
          ) : null}
        </Animated.View>

        <View className="-mt-8 gap-5 rounded-t-3xl bg-white px-6 pb-2 pt-6">
          <View className="gap-1.5">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-extrabold text-brand-navy">{vendor.name}</Text>
              {vendor.isVerified ? <VerifiedBadgeIcon size={20} color={Brand.blue} /> : null}
            </View>
            <View className="flex-row items-center gap-3">
              {vendor.rating != null ? (
                <View className="flex-row items-center gap-1">
                  <StarIcon size={15} color={Brand.gold} />
                  <Text className="text-sm font-semibold text-gray-700">{vendor.rating.toFixed(1)}</Text>
                </View>
              ) : null}
              {vendor.etaLabel ? <Text className="text-sm text-gray-500">{vendor.etaLabel}</Text> : null}
              <Text className="text-sm text-gray-400">· {vendor.category}</Text>
            </View>
            {vendor.description ? (
              <Text className="text-sm leading-5 text-gray-500">{vendor.description}</Text>
            ) : null}
          </View>

          {sections.map((section) => (
            <View key={section.title} className="gap-2">
              {section.title ? (
                <Text className="text-lg font-bold text-brand-navy">{section.title}</Text>
              ) : null}
              {section.products.map((product) => (
                <ProductRow key={product.id} vendor={vendor} product={product} />
              ))}
            </View>
          ))}
        </View>
      </Animated.ScrollView>

      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        style={{ top: insets.top + 8 }}
        className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-80"
      >
        <ChevronLeftIcon size={22} color={Brand.navy} />
      </Pressable>

      {showCartBar ? (
        <View
          style={{ paddingBottom: insets.bottom + 12 }}
          className="absolute inset-x-0 bottom-0 border-t border-gray-100 bg-white px-6 pt-3"
        >
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
    </View>
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
