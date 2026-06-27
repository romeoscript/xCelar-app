import { useState } from 'react';
import {
  Dimensions,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';

import { StorefrontIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';

export type ProductImageCarouselProps = {
  images: string[];
  width?: number;
  height?: number;
};

/** Swipeable, paged product images with a dots indicator. */
export function ProductImageCarousel({
  images,
  width = Dimensions.get('window').width,
  height = 220,
}: ProductImageCarouselProps) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <View style={{ height }} className="w-full items-center justify-center bg-brand-surface">
        <StorefrontIcon size={28} color={Brand.muted} />
      </View>
    );
  }

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {images.map((uri) => (
          <Image key={uri} source={{ uri }} style={{ width, height }} resizeMode="cover" />
        ))}
      </ScrollView>
      {images.length > 1 ? (
        <View className="absolute bottom-2 left-0 right-0 flex-row justify-center gap-1.5">
          {images.map((uri, position) => (
            <View
              key={uri}
              className={`h-1.5 rounded-full ${position === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
