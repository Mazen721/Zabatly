import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius, touchTarget } from '@/theme/spacing';
import { useAuth } from '@/context/AuthContext';
import { getMyBookings, getUnreadCount, getVehicles } from '@/api/client';
import BookingSkeleton from '@/components/BookingSkeleton';
import FleetPreviewCard from '@/components/FleetPreviewCard';
import RecentBookingRow from '@/components/RecentBookingRow';

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PulsingStatusDot({ color }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.statusDot, { backgroundColor: color, opacity }]} />;
}

function StatusCard({ booking, loading, onPress }) {
  if (loading) {
    return (
      <View style={styles.statusCard}>
        <View style={styles.statusSkeleton} />
      </View>
    );
  }

  if (!booking) {
    return (
      <TouchableOpacity style={styles.statusCard} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.statusDot, { backgroundColor: colors.sand[400] }]} />
        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>No active trip</Text>
          <Text style={styles.statusLink}>Browse fleet</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.sand[400]} />
      </TouchableOpacity>
    );
  }

  const vehicle = booking.vehicle;
  const title = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Your booking';
  const isActive = booking.status === 'active';
  const isPending = booking.status === 'pending' || booking.status === 'confirmed';
  const dotColor = isActive ? colors.status.active.text : colors.status.pending.text;

  let subtitle = '';
  if (isActive) {
    subtitle = booking.endDate
      ? `Active until ${formatShortDate(booking.endDate)}`
      : 'Active now';
  } else if (isPending) {
    subtitle = 'Pending approval';
  }

  return (
    <TouchableOpacity
      style={[styles.statusCard, isPending && styles.statusCardPending]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {isActive ? (
        <PulsingStatusDot color={dotColor} />
      ) : (
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      )}
      <View style={styles.statusContent}>
        <Text style={styles.statusTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.statusSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.sand[400]} />
    </TouchableOpacity>
  );
}

function FleetSkeleton() {
  return (
    <View style={styles.fleetSkeletonRow}>
      <View style={styles.fleetSkeletonCard} />
      <View style={styles.fleetSkeletonCard} />
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [bookings, setBookings] = useState([]);
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [bookingsRes, unreadRes, vehiclesRes] = await Promise.all([
        getMyBookings(),
        getUnreadCount(),
        getVehicles(),
      ]);

      setBookings(bookingsRes.data || []);
      setUnreadCount(unreadRes.data?.count ?? unreadRes.data?.unreadCount ?? 0);

      const available = (vehiclesRes.data || []).filter((v) => v.isAvailable !== false);
      setFleetVehicles(available.slice(0, 6));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Could not load your home screen. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const activeBooking = bookings.find((b) => b.status === 'active');
  const pendingBooking = bookings.find(
    (b) => b.status === 'pending' || b.status === 'confirmed'
  );
  const statusBooking = activeBooking || pendingBooking;

  const recentBookings = bookings
    .filter((b) => b._id !== statusBooking?._id)
    .slice(0, 3);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const handleStatusPress = () => {
    if (statusBooking?.vehicle?._id) {
      router.push({
        pathname: '/tabs/browse/[id]',
        params: { id: statusBooking.vehicle._id },
      });
      return;
    }
    router.push('/tabs/browse');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.navy.light}
          />
        }
      >
        <View style={styles.topBar}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>
              {getGreeting()}, {firstName}
            </Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => router.push('/tabs/profile/notifications')}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={24} color={colors.duskText} />
            {unreadCount > 0 && <View style={styles.unreadBadge} />}
          </TouchableOpacity>
        </View>

        <StatusCard
          booking={statusBooking}
          loading={loading && !refreshing}
          onPress={handleStatusPress}
        />

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available near you</Text>
            <TouchableOpacity onPress={() => router.push('/tabs/browse')} activeOpacity={0.7}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <FleetSkeleton />
          ) : fleetVehicles.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fleetScroll}
            >
              {fleetVehicles.map((vehicle) => (
                <FleetPreviewCard key={vehicle._id} vehicle={vehicle} />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.sectionEmpty}>No vehicles available right now.</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.aiRow}
          onPress={() => router.push('/tabs/ai-chat')}
          activeOpacity={0.75}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.navy.default} />
          <Text style={styles.aiText}>Ask Zabatly</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.sand[400]} />
        </TouchableOpacity>

        {(loading && !refreshing) || recentBookings.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent bookings</Text>
              {recentBookings.length > 0 && (
                <TouchableOpacity onPress={() => router.push('/tabs/bookings')} activeOpacity={0.7}>
                  <Text style={styles.sectionLink}>View all</Text>
                </TouchableOpacity>
              )}
            </View>

            {loading && !refreshing ? (
              <View style={styles.recentCard}>
                <BookingSkeleton />
                <BookingSkeleton />
              </View>
            ) : (
              <View style={styles.recentCard}>
                {recentBookings.map((booking, index) => (
                  <RecentBookingRow
                    key={booking._id}
                    booking={booking}
                    isLast={index === recentBookings.length - 1}
                  />
                ))}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sandCream,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  greetingBlock: {
    flex: 1,
    paddingRight: spacing.md,
  },
  greeting: {
    ...typography.title,
    fontSize: 22,
    lineHeight: 28,
    color: colors.duskText,
    letterSpacing: -0.3,
  },
  date: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: spacing.xxs,
  },
  bellButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.status.error.text,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xxl,
  },
  statusCardPending: {
    backgroundColor: colors.status.pending.bg,
  },
  statusSkeleton: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.stoneBorder,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    marginRight: spacing.md,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    color: colors.duskText,
  },
  statusSubtitle: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: 3,
  },
  statusLink: {
    ...typography.bodySmall,
    color: colors.navy.default,
    fontFamily: fontFamily.medium,
    marginTop: 3,
  },
  errorBanner: {
    backgroundColor: colors.status.error.bg,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.status.error.text,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 17,
    color: colors.duskText,
  },
  sectionLink: {
    ...typography.bodySmall,
    color: colors.navy.default,
    fontFamily: fontFamily.medium,
  },
  sectionEmpty: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
  },
  fleetScroll: {
    paddingRight: spacing.md,
  },
  fleetSkeletonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fleetSkeletonCard: {
    width: 156,
    height: 100,
    borderRadius: radius.md,
    backgroundColor: colors.warmLinen,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  aiText: {
    ...typography.bodyMedium,
    flex: 1,
    color: colors.duskText,
  },
  recentCard: {
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
});
