import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import shadows from '@/theme/shadows';
import { spacing, radius, touchTarget } from '@/theme/spacing';
import { getMyBookings } from '@/api/client';
import BookingCard from '@/components/BookingCard';

// Reusable Spring-scaled Pill Tab Chip
function PressablePill({ label, active, onPress }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    // Springs down to 0.97 scale on press-in for physical tactile response
    scale.value = withSpring(0.97, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    // Snaps back to 1.0 scale on release
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.pill,
          active ? styles.pillActive : styles.pillInactive,
          animatedStyle,
        ]}
      >
        <Text
          style={[
            styles.pillText,
            active ? styles.pillTextActive : styles.pillTextInactive,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('All'); // "All", "Active", "Completed", "Pending", "Cancelled"
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookingsList = useCallback(async () => {
    try {
      setError(null);
      const { data } = await getMyBookings();
      setBookings(data || []);
    } catch (err) {
      setError('Could not retrieve bookings. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookingsList();
  }, [fetchBookingsList]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookingsList();
  }, [fetchBookingsList]);

  // Client-side category logic mapping web parameters
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return b.status === 'active';
    if (activeTab === 'Completed') return b.status === 'completed';
    if (activeTab === 'Pending') return b.status === 'pending' || b.status === 'confirmed';
    if (activeTab === 'Cancelled') return b.status === 'cancelled';
    return true;
  });

  const renderHeader = () => {
    return (
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.screenTitle}>My Bookings</Text>

        {/* Categories Horizontal Scroll Row */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
            style={styles.tabsScroll}
          >
            {['All', 'Active', 'Completed', 'Pending', 'Cancelled'].map((tab) => (
              <PressablePill
                key={tab}
                label={tab}
                active={activeTab === tab}
                onPress={() => setActiveTab(tab)}
              />
            ))}
          </ScrollView>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.status.error.text} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="car-sport" size={64} color={colors.amber.default} />
        </View>
        <Text style={styles.emptyTitle}>Your journey awaits</Text>
        <Text style={styles.emptySubtitle}>
          You don&apos;t have any upcoming bookings. Discover premium rides and start your next adventure today.
        </Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push('/tabs/browse')}
          activeOpacity={0.85}
        >
          <Text style={styles.exploreButtonText}>Browse Cars</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && bookings.length === 0 ? (
        <View style={styles.loadingContainer}>
          {renderHeader()}
          <View style={styles.centerSpinner}>
            <ActivityIndicator size="large" color={colors.amber.default} />
            <Text style={styles.loadingText}>Retrieving your rides...</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onCancelSuccess={fetchBookingsList}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.amber.default}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sandCream,
  },
  loadingContainer: {
    flex: 1,
  },
  centerSpinner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: spacing.md,
  },
  header: {
    backgroundColor: colors.sandCream,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  screenTitle: {
    ...typography.headline,
    color: colors.duskText,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  tabsWrapper: {
    marginBottom: spacing.xs,
  },
  tabsScroll: {
    overflow: 'visible',
  },
  tabsScrollContent: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  pillInactive: {
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: colors.amber.default,
  },
  pillText: {
    ...typography.buttonSmall,
  },
  pillTextInactive: {
    color: colors.ashSecondary,
  },
  pillTextActive: {
    color: colors.duskText,
    fontWeight: '700',
  },
  flatListContent: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.error.bg,
    borderWidth: 1,
    borderColor: colors.status.error.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.status.error.text,
    marginLeft: spacing.xs,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.transparent.amber15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    ...typography.headline,
    color: colors.duskText,
    marginBottom: spacing.sm,
    fontSize: 24,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.ashSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 24,
  },
  exploreButton: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.navy.default,
    borderRadius: radius.full,
    height: touchTarget.button + 8,
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.ambient,
  },
  exploreButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
