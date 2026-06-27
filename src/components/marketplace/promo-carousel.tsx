import { useState } from 'react';
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from 'react-native';

type Slide = {
  eyebrow: string;
  title: string;
  bg: string;
  textClass: string;
  eyebrowClass: string;
};

const SLIDES: Slide[] = [
  {
    eyebrow: 'Your welcome gift',
    title: 'Free delivery on your first order',
    bg: 'bg-brand-gold-tint',
    textClass: 'text-brand-navy',
    eyebrowClass: 'text-brand-navy/60',
  },
  {
    eyebrow: 'Handpicked for you',
    title: 'Top-rated partners near you',
    bg: 'bg-brand-blue-tint',
    textClass: 'text-brand-navy',
    eyebrowClass: 'text-brand-navy/60',
  },
  {
    eyebrow: 'Powered by Xcelar',
    title: 'Fast, tracked delivery every time',
    bg: 'bg-brand-navy',
    textClass: 'text-white',
    eyebrowClass: 'text-white/60',
  },
];

const SCREEN_WIDTH = Dimensions.get('window').width;

/** Full-bleed, swipeable promo banners with a dots indicator. */
export function PromoCarousel() {
  const [index, setIndex] = useState(0);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  };

  return (
    <View className="gap-2.5">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={{ width: SCREEN_WIDTH }} className="px-6">
            <View className={`h-28 justify-center rounded-3xl px-5 ${slide.bg}`}>
              <Text className={`text-xs font-medium ${slide.eyebrowClass}`}>{slide.eyebrow}</Text>
              <Text className={`mt-1 text-lg font-extrabold ${slide.textClass}`}>{slide.title}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row justify-center gap-1.5">
        {SLIDES.map((slide, position) => (
          <View
            key={slide.title}
            className={`h-1.5 rounded-full ${position === index ? 'w-4 bg-brand-blue' : 'w-1.5 bg-gray-300'}`}
          />
        ))}
      </View>
    </View>
  );
}
