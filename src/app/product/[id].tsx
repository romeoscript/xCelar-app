import { useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon, MinusIcon, PlusIcon } from '@/components/icons';
import { ProductImageCarousel } from '@/components/marketplace/product-image-carousel';
import { Button } from '@/components/ui/button';
import { QueryError } from '@/components/ui/query-error';
import { Brand } from '@/constants/theme';
import { addToCartWithConfirm, useCartStore } from '@/lib/cart-store';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { getProduct } from '@/lib/marketplace-api';
import { toast } from '@/lib/toast-store';

export default function ProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);

  const add = useCartStore((state) => state.add);

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id as string),
    enabled: Boolean(id),
  });

  if (!id) {
    return <Redirect href="/marketplace" />;
  }

  if (productQuery.isError) {
    return (
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ top: insets.top + 8 }}
          className="absolute left-4 z-10 h-10 w-10 items-center justify-center rounded-full bg-brand-surface active:opacity-80"
        >
          <ChevronLeftIcon size={22} color={Brand.navy} />
        </Pressable>
        <QueryError message="Couldn’t load this product." onRetry={() => productQuery.refetch()} />
      </View>
    );
  }

  const data = productQuery.data;
  if (productQuery.isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <StatusBar style="dark" />
        <ActivityIndicator color={Brand.blue} />
      </View>
    );
  }

  const { product, vendor } = data;

  const addToCart = () => {
    tapFeedback();
    addToCartWithConfirm(vendor, () => {
      for (let count = 0; count < quantity; count += 1) {
        add(vendor, product);
      }
      toast(`Added ${quantity} to cart`);
      router.back();
    });
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        <ProductImageCarousel images={product.imageUrls} height={300} />

        <View className="-mt-6 gap-3 rounded-t-3xl bg-white px-6 pt-6">
          <Text className="text-xs font-medium text-brand-blue">{vendor.name}</Text>
          <Text className="text-2xl font-extrabold text-brand-navy">{product.name}</Text>
          <Text className="text-xl font-bold text-brand-navy">
            {formatNaira(product.priceKobo / 100)}
          </Text>
          {product.description ? (
            <Text className="text-base leading-6 text-gray-500">{product.description}</Text>
          ) : null}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        style={{ top: insets.top + 8 }}
        className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-80"
      >
        <ChevronLeftIcon size={22} color={Brand.navy} />
      </Pressable>

      <View
        style={{ paddingBottom: insets.bottom + 12 }}
        className="absolute inset-x-0 bottom-0 border-t border-gray-100 bg-white px-6 pt-3"
      >
        {vendor.isOpen ? (
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-3 rounded-full border border-gray-200 px-2 py-1.5">
              <Stepper icon={MinusIcon} onPress={() => setQuantity((value) => Math.max(1, value - 1))} />
              <Text className="w-5 text-center text-base font-bold text-brand-navy">{quantity}</Text>
              <Stepper icon={PlusIcon} onPress={() => setQuantity((value) => value + 1)} />
            </View>
            <View className="flex-1">
              <Button
                label={`Add · ${formatNaira((product.priceKobo * quantity) / 100)}`}
                onPress={addToCart}
              />
            </View>
          </View>
        ) : (
          <View className="items-center rounded-full bg-gray-100 py-4">
            <Text className="text-base font-semibold text-gray-400">{vendor.name} is closed</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function Stepper({ icon: Icon, onPress }: { icon: typeof PlusIcon; onPress: () => void }) {
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
