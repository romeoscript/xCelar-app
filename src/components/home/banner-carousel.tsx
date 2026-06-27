import { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Text, View, type ViewToken } from 'react-native';

import { Brand } from '@/constants/theme';
import { type Banner } from '@/lib/banner-api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AUTO_ADVANCE_MS = 4500;
const DEFAULT_BG = Brand.indigo;

export type BannerCarouselProps = {
  banners: Banner[];
};

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const listRef = useRef<FlatList<Banner>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef((info: { viewableItems: ViewToken[] }) => {
    const first = info.viewableItems[0];
    if (first?.index != null) {
      setActiveIndex(first.index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  useEffect(() => {
    if (banners.length <= 1) {
      return;
    }
    const timer = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % banners.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(banner) => banner.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => <BannerCard banner={item} />}
      />

      <View className="flex-row justify-center gap-1.5">
        {banners.map((banner, index) => (
          <View
            key={banner.id}
            className={`h-1.5 rounded-full ${index === activeIndex ? 'w-5 bg-brand-blue' : 'w-1.5 bg-gray-300'}`}
          />
        ))}
      </View>
    </View>
  );
}

function BannerCard({ banner }: { banner: Banner }) {
  return (
    <View style={{ width: SCREEN_WIDTH }} className="px-6">
      <View
        style={{ backgroundColor: banner.bgColor ?? DEFAULT_BG }}
        className="h-40 justify-between overflow-hidden rounded-3xl p-5"
      >
        {banner.imageUrl ? (
          <>
            <Image
              source={{ uri: banner.imageUrl }}
              resizeMode="cover"
              className="absolute inset-0 h-full w-full"
            />
            <View className="absolute inset-0 bg-black/30" />
          </>
        ) : null}

        {banner.badge ? (
          <View className="self-end rounded-full bg-white/20 px-3 py-1">
            <Text className="text-xs font-bold tracking-wide text-white">{banner.badge}</Text>
          </View>
        ) : (
          <View />
        )}

        <View className="gap-1">
          <Text className="text-2xl font-extrabold text-white">{banner.title}</Text>
          {banner.subtitle ? (
            <Text className="text-base text-white/80">{banner.subtitle}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
