import { useRef, useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import shadows from '@/theme/shadows';
import { spacing, radius } from '@/theme/spacing';

const slides = [
  {
    title: 'Find Your Perfect Ride',
    subtitleArabic: 'المشوار عليك، والعربية المظبوطة علينا',
    body: 'Browse hundreds of verified vehicles across Egypt, sedans, SUVs, luxury, and more.',
    image: require('../../../assets/images/onboarding_car.png'),
  },
  {
    title: 'Book in Minutes, Drive Today',
    subtitleArabic: 'احجز في دقايق بأساليب دفع محلية مريحة',
    body: 'Simple booking flow, secure payments via Vodafone Cash or InstaPay.',
    image: require('../../../assets/images/onboarding_calendar.png'),
  },
  {
    title: 'Your Smart Rental Companion',
    subtitleArabic: 'اسأل زبطلي أي حاجة، الذكاء الاصطناعي هيلاقيلك أنسب عربية',
    body: 'Ask Zabatly anything, our AI finds the right car for your trip.',
    image: require('../../../assets/images/onboarding_chat.png'),
  },
];

export default function OnboardingSlidesScreen() {
  const listRef = useRef(null);
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = useWindowDimensions();

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('zabatly_onboarded', 'true');
    router.replace('/auth/login');
  };

  const goNext = () => {
    if (currentIndex === slides.length - 1) {
      void completeOnboarding();
      return;
    }

    listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
  };

  return (
    <View style={styles.screen}>
      <Pressable style={styles.skip} onPress={completeOnboarding}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <Animated.FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.title}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item, index }) => (
          <Slide item={item} index={index} scrollX={scrollX} width={width} />
        )}
      />

      <View style={styles.controls}>
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View
              key={slide.title}
              style={[styles.dot, currentIndex === index ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        <Pressable style={styles.nextButton} onPress={goNext}>
          <Text style={styles.nextText}>{currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Slide({ item, index, scrollX, width }) {
  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          scrollX.value,
          [(index - 1) * width, index * width, (index + 1) * width],
          [width * 0.21, 0, -width * 0.21],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.illustrationStage}>
        <View style={styles.stageGlow} />
        <Animated.Image
          source={item.image}
          style={[styles.illustrationImage, parallaxStyle]}
          resizeMode="cover"
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.headline}>{item.title}</Text>
        <Text style={styles.arabicSubtitle}>{item.subtitleArabic}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.navy.deep,
  },
  skip: {
    position: 'absolute',
    top: spacing.xxxl,
    right: spacing.xl,
    zIndex: 2,
    padding: spacing.xs,
  },
  skipText: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
  },
  slide: {
    flex: 1,
  },
  illustrationStage: {
    height: '55%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.navy.default,
  },
  stageGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: radius.full,
    backgroundColor: colors.transparent.navy20,
    transform: [{ scaleX: 1.5 }],
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  panel: {
    flex: 1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    backgroundColor: colors.sandCream,
  },
  headline: {
    ...typography.display,
    color: colors.duskText,
    fontFamily: fontFamily.extraBold,
  },
  arabicSubtitle: {
    color: colors.amber.default,
    fontFamily: fontFamily.arabicBold,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.sm,
    textAlign: 'left',
  },
  body: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.ashSecondary,
  },
  controls: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: radius.full,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.amber.default,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.stoneBorder,
  },
  nextButton: {
    ...shadows.ambient,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.amber.default,
  },
  nextText: {
    ...typography.button,
    color: colors.duskText,
  },
});
