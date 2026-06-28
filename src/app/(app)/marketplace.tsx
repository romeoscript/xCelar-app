import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  HeartFilledIcon,
  HeartIcon,
  SearchIcon,
  StarIcon,
  StorefrontIcon,
  VerifiedBadgeIcon,
} from '@/components/icons';
import { PromoCarousel } from '@/components/marketplace/promo-carousel';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { useFavoritesStore } from '@/lib/favorites-store';
import { tapFeedback } from '@/lib/haptics';
import { getVendors, type Vendor } from '@/lib/marketplace-api';

const categoryImage = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=200&q=80&auto=format&fit=crop`;

const ALL_IMAGE = categoryImage('1546069901-ba9599a7e63c');
const CATEGORY_IMAGE: Record<string, string> = {
  Restaurant: categoryImage('1504674900247-0877df9cc836'),
  Grocery: categoryImage('1542838132-92c53300491e'),
  Pharmacy: categoryImage('1587854692152-cbe660dbde88'),
};

type SortBy = 'recommended' | 'rating';

export default function MarketplaceScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recommended');
  const [openNow, setOpenNow] = useState(false);

  const vendorsQuery = useQuery({ queryKey: ['vendors'], queryFn: () => getVendors() });
  const vendors = vendorsQuery.data ?? [];
  const categories = Array.from(new Set(vendors.map((vendor) => vendor.category)));
  const featured = vendors.filter((vendor) => vendor.isFeatured);

  const term = search.trim().toLowerCase();
  const shown = vendors
    .filter(
      (vendor) =>
        (category === null || vendor.category === category) &&
        (term === '' || vendor.name.toLowerCase().includes(term)) &&
        (!openNow || vendor.isOpen),
    )
    .sort((a, b) => (sortBy === 'rating' ? (b.rating ?? 0) - (a.rating ?? 0) : 0));

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <View className="gap-3 px-6 pb-3 pt-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-extrabold text-brand-navy">Marketplace</Text>
          <Pressable onPress={() => router.push('/orders')} hitSlop={8} className="active:opacity-70">
            <Text className="text-sm font-semibold text-brand-blue">My orders</Text>
          </Pressable>
        </View>
        <View className="flex-row items-center gap-2 rounded-2xl bg-brand-surface px-4 py-3">
          <SearchIcon size={20} color={Brand.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search partners"
            placeholderTextColor={Brand.muted}
            className="flex-1 text-base text-gray-900"
          />
        </View>
      </View>
      <FlatList
        data={shown}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <View className="gap-4 pt-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 18 }}
            >
              <CategoryCircle image={ALL_IMAGE} label="All" active={category === null} onPress={() => setCategory(null)} />
              {categories.map((item) => (
                <CategoryCircle
                  key={item}
                  image={CATEGORY_IMAGE[item] ?? ALL_IMAGE}
                  label={item}
                  active={category === item}
                  onPress={() => setCategory(item)}
                />
              ))}
            </ScrollView>

            <PromoCarousel />

            {featured.length > 0 ? (
              <View className="gap-3">
                <Text className="px-6 text-lg font-bold text-brand-navy">Popular brands</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
                >
                  {featured.map((vendor) => (
                    <PopularCard
                      key={vendor.id}
                      vendor={vendor}
                      onPress={() => router.push(`/vendor/${vendor.id}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View className="flex-row items-center gap-2 px-6">
              <FilterChip
                label="Top rated"
                active={sortBy === 'rating'}
                onPress={() => setSortBy((current) => (current === 'rating' ? 'recommended' : 'rating'))}
              />
              <FilterChip label="Open now" active={openNow} onPress={() => setOpenNow((value) => !value)} />
            </View>

            <Text className="px-6 text-lg font-bold text-brand-navy">{category ?? 'All partners'}</Text>
          </View>
        }
        ListEmptyComponent={
          vendorsQuery.isLoading ? null : vendorsQuery.isError ? (
            <View className="mx-6 items-center gap-3 rounded-3xl border border-gray-100 bg-brand-surface px-6 py-12">
              <StorefrontIcon size={32} color={Brand.muted} />
              <Text className="font-semibold text-gray-700">Couldn’t load partners</Text>
              <View className="w-40">
                <Button label="Try again" variant="secondary" onPress={() => vendorsQuery.refetch()} />
              </View>
            </View>
          ) : (
            <View className="mx-6 items-center gap-2 rounded-3xl border border-gray-100 bg-brand-surface px-6 py-12">
              <StorefrontIcon size={32} color={Brand.muted} />
              <Text className="font-semibold text-gray-700">No partners found</Text>
              <Text className="text-center text-sm text-gray-500">Try a different search or filter.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <VendorCard vendor={item} onPress={() => router.push(`/vendor/${item.id}`)} />
        )}
      />
    </SafeAreaView>
  );
}

function CategoryCircle({
  image,
  label,
  active,
  onPress,
}: {
  image: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="items-center gap-1.5 active:opacity-70" style={{ width: 68 }}>
      <View className={`h-16 w-16 overflow-hidden rounded-full ${active ? 'border-2 border-brand-blue' : ''}`}>
        <Image source={{ uri: image }} className="h-full w-full" resizeMode="cover" />
      </View>
      <Text
        className={`text-center text-xs font-medium ${active ? 'text-brand-blue' : 'text-gray-600'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      className={`rounded-full border px-4 py-2 active:opacity-70 ${
        active ? 'border-brand-blue bg-brand-blue-tint' : 'border-gray-200 bg-white'
      }`}
    >
      <Text className={`text-sm font-medium ${active ? 'text-brand-blue' : 'text-gray-600'}`}>{label}</Text>
    </Pressable>
  );
}

function PopularCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="w-44 active:opacity-90">
      <View className="h-28 overflow-hidden rounded-2xl bg-brand-surface">
        {vendor.coverImageUrl ? (
          <Image source={{ uri: vendor.coverImageUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <StorefrontIcon size={26} color={Brand.muted} />
          </View>
        )}
        {!vendor.isOpen ? (
          <View className="absolute inset-0 items-center justify-center bg-black/55">
            <Text className="text-sm font-bold text-white">Closed</Text>
          </View>
        ) : null}
      </View>
      <View className="mt-1.5 flex-row items-center gap-1">
        <Text className="flex-1 text-sm font-bold text-brand-navy" numberOfLines={1}>
          {vendor.name}
        </Text>
        {vendor.isVerified ? <VerifiedBadgeIcon size={14} color={Brand.blue} /> : null}
      </View>
      {vendor.rating != null ? (
        <View className="flex-row items-center gap-1">
          <StarIcon size={12} color={Brand.gold} />
          <Text className="text-xs text-gray-500">
            {vendor.rating.toFixed(1)} · {vendor.category}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function VendorCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  const favorited = useFavoritesStore((state) => state.ids.has(vendor.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggle);

  return (
    <Pressable onPress={onPress} className="mx-6 mb-5 active:opacity-90">
      <View className="h-44 overflow-hidden rounded-2xl bg-brand-surface">
        {vendor.coverImageUrl ? (
          <Image source={{ uri: vendor.coverImageUrl }} className="h-44 w-full" resizeMode="cover" />
        ) : (
          <View className="h-44 w-full items-center justify-center">
            <StorefrontIcon size={32} color={Brand.muted} />
          </View>
        )}

        {!vendor.isOpen ? (
          <View className="absolute inset-0 items-center justify-center bg-black/55">
            <Text className="text-base font-bold text-white">Closed</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => {
            tapFeedback();
            toggleFavorite(vendor.id);
          }}
          hitSlop={8}
          className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-white/90 active:opacity-80"
        >
          {favorited ? <HeartFilledIcon size={20} /> : <HeartIcon size={20} color={Brand.navy} />}
        </Pressable>
      </View>

      <View className="mt-2 flex-row items-center gap-1">
        <Text className="text-base font-bold text-brand-navy" numberOfLines={1}>
          {vendor.name}
        </Text>
        {vendor.isVerified ? <VerifiedBadgeIcon size={16} color={Brand.blue} /> : null}
      </View>

      <View className="mt-0.5 flex-row items-center gap-3">
        {vendor.rating != null ? (
          <View className="flex-row items-center gap-1">
            <StarIcon size={14} color={Brand.gold} />
            <Text className="text-sm font-medium text-gray-700">{vendor.rating.toFixed(1)}</Text>
          </View>
        ) : null}
        {vendor.etaLabel ? <Text className="text-sm text-gray-500">{vendor.etaLabel}</Text> : null}
        <Text className="text-sm text-gray-400">· {vendor.category}</Text>
      </View>
    </Pressable>
  );
}
