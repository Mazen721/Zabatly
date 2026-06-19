import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import DateTimePicker from '@react-native-community/datetimepicker';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius, touchTarget } from '@/theme/spacing';
import { useAuth } from '@/context/AuthContext';
import { getVehicleById, getVehicleReviews, checkAvailability } from '@/api/client';
import {
  calculateRentalDays,
  formatDisplayDate,
  pickCalendarDate,
  toDateKey,
} from '@/utils/bookingDates';
import StarRating from '@/components/StarRating';
import VehicleDetailSkeleton from '@/components/VehicleDetailSkeleton';
import BookingDateCalendar from '@/components/BookingDateCalendar';
import VehicleLocationMap from '@/components/VehicleLocationMap';

const { width: screenWidth } = Dimensions.get('window');
const HERO_HEIGHT = screenWidth * (9 / 16);

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SpecItem({ label, value }) {
  return (
    <View style={styles.specItem}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

function ReviewRow({ review }) {
  const authorName = review.author?.name || 'Guest';
  const initial = authorName.charAt(0).toUpperCase();

  return (
    <View style={styles.reviewRow}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          {review.author?.profilePicture ? (
            <Image
              source={{ uri: review.author.profilePicture }}
              style={styles.reviewAvatarImage}
              contentFit="cover"
            />
          ) : (
            <Text style={styles.reviewAvatarText}>{initial}</Text>
          )}
        </View>
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewAuthor}>{authorName}</Text>
          <View style={styles.reviewRatingRow}>
            <StarRating rating={review.rating} size={12} />
            <Text style={styles.reviewDate}>
              {formatDate(review.createdAt)}
            </Text>
          </View>
        </View>
      </View>
      {!!review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
    </View>
  );
}

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const galleryRef = useRef(null);

  const [vehicle, setVehicle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reservedRanges, setReservedRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const [startDateKey, setStartDateKey] = useState('');
  const [endDateKey, setEndDateKey] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [needsDriver, setNeedsDriver] = useState(false);
  const [routeDescription, setRouteDescription] = useState('');

  const startPickerDate = startDateKey
    ? new Date(`${startDateKey}T12:00:00`)
    : new Date();
  const endPickerDate = endDateKey
    ? new Date(`${endDateKey}T12:00:00`)
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  useEffect(() => {
    if (!id) return;

    const fetchVehicleDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const [vehicleRes, reviewsRes, availabilityRes] = await Promise.all([
          getVehicleById(id),
          getVehicleReviews(id).catch(() => ({ data: [] })),
          checkAvailability({ vehicleId: id }).catch(() => ({ data: { reservedRanges: [] } })),
        ]);

        setVehicle(vehicleRes.data);
        setReviews(reviewsRes.data || []);
        setReservedRanges(availabilityRes.data?.reservedRanges || []);
      } catch {
        setError('Could not load this vehicle. Go back and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleDetails();
  }, [id]);

  useEffect(() => {
    if (!id || !startDateKey || !endDateKey) {
      setAvailability(null);
      return;
    }

    let ignore = false;
    const runCheck = async () => {
      setAvailabilityLoading(true);
      try {
        const { data } = await checkAvailability({
          vehicleId: id,
          startDate: startDateKey,
          endDate: endDateKey,
        });
        if (!ignore) {
          setAvailability(data);
          if (data?.reservedRanges) setReservedRanges(data.reservedRanges);
        }
      } catch {
        if (!ignore) {
          setAvailability({
            available: false,
            message: 'Could not check availability. Try again.',
          });
        }
      } finally {
        if (!ignore) setAvailabilityLoading(false);
      }
    };

    const timer = setTimeout(runCheck, 200);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [id, startDateKey, endDateKey]);

  const handleCalendarPick = (dateKey) => {
    setBookingError('');
    const next = pickCalendarDate(dateKey, startDateKey, endDateKey);
    setStartDateKey(next.startDate);
    setEndDateKey(next.endDate);
  };

  const handleStartPickerChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (event?.type === 'dismissed' || !selectedDate) return;
    const key = toDateKey(selectedDate);
    setStartDateKey(key);
    setBookingError('');
    if (endDateKey && key > endDateKey) setEndDateKey('');
    if (Platform.OS === 'ios') setShowStartPicker(false);
  };

  const handleEndPickerChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (event?.type === 'dismissed' || !selectedDate) return;
    const key = toDateKey(selectedDate);
    if (startDateKey && key < startDateKey) {
      setBookingError('Return date must be after pickup date.');
      return;
    }
    setEndDateKey(key);
    setBookingError('');
    if (Platform.OS === 'ios') setShowEndPicker(false);
  };

  const handleGalleryScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setActiveSlide(index);
  };

  const goToSlide = useCallback((index) => {
    setActiveSlide(index);
    galleryRef.current?.scrollTo({ x: index * screenWidth, animated: true });
  }, []);

  const images = vehicle?.images?.length > 0 ? vehicle.images : [];
  const pricePerDay = vehicle?.price_per_day ?? 0;
  const isOwnVehicle =
    user && (vehicle?.owner?._id === user._id || vehicle?.owner === user._id);
  const isVerified = user?.kyc_status === 'verified';
  const needsLicenseCheck =
    user && isVerified && !vehicle?.has_driver &&
    (!user.driving_license || !user.driving_license.is_verified);

  const handleBookingPress = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (isOwnVehicle) return;
    if (!isVerified || needsLicenseCheck) {
      router.push('/tabs/profile/kyc');
      return;
    }
    if (!startDateKey || !endDateKey) {
      setBookingError('Select pickup and return dates.');
      return;
    }
    if (availabilityLoading) {
      setBookingError('Still checking availability. Wait a moment.');
      return;
    }
    if (availability?.available !== true) {
      setBookingError(availability?.message || 'Choose dates that are available.');
      return;
    }
    if (vehicle?.has_driver && needsDriver && !routeDescription.trim()) {
      setBookingError('Describe your trip route when booking with a driver.');
      return;
    }
    router.push({
      pathname: '/tabs/browse/payment',
      params: {
        vehicleId: id,
        startDate: startDateKey,
        endDate: endDateKey,
        needsDriver: needsDriver ? 'true' : 'false',
        routeDescription: needsDriver ? routeDescription.trim() : '',
      },
    });
  };

  const getBookLabel = () => {
    if (!user) return 'Sign in to book';
    if (isOwnVehicle) return 'Your listing';
    if (!isVerified) return 'Verify to book';
    if (needsLicenseCheck) return 'Verify license';
    return 'Book now';
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.duskText} />
        </TouchableOpacity>
        <VehicleDetailSkeleton />
      </View>
    );
  }

  if (error || !vehicle) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error || 'Vehicle not found.'}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Back to fleet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const specs = [
    {
      label: 'Transmission',
      value: vehicle.transmission === 'automatic' ? 'Automatic' : 'Manual',
    },
    {
      label: 'Seats',
      value: `${vehicle.capacity || 4} passengers`,
    },
    {
      label: 'Fuel',
      value: vehicle.fuel
        ? vehicle.fuel.charAt(0).toUpperCase() + vehicle.fuel.slice(1)
        : 'Petrol',
    },
    { label: 'AC', value: vehicle.ac ? 'Yes' : 'No' },
  ];

  const rentalDays = calculateRentalDays(startDateKey, endDateKey);
  const driverFee =
    needsDriver && vehicle ? (vehicle.driver_cost || 0) * rentalDays : 0;
  const estimatedTotal =
    rentalDays > 0 ? pricePerDay * rentalDays + driverFee : 0;

  const availabilityCardStyle = (() => {
    if (!startDateKey || !endDateKey) return styles.availabilityNeutral;
    if (availabilityLoading) return styles.availabilityPending;
    if (availability?.available === true) return styles.availabilityOpen;
    if (availability?.available === false) return styles.availabilityBlocked;
    return styles.availabilityNeutral;
  })();

  const availabilityTitle = (() => {
    if (!startDateKey && !endDateKey) return 'Choose your dates';
    if (startDateKey && !endDateKey) return 'Select return date';
    if (availabilityLoading) return 'Checking availability…';
    if (availability?.available === true) return 'Available for your dates';
    if (availability?.available === false) {
      return availability?.message || 'Not available';
    }
    return 'Review your dates';
  })();

  const availabilityBody = (() => {
    if (!startDateKey && !endDateKey) {
      return 'Tap the calendar or use the date fields below.';
    }
    if (startDateKey && !endDateKey) {
      return `Pickup ${formatDisplayDate(startDateKey)} — now pick your return date.`;
    }
    if (availabilityLoading) return 'Confirming this vehicle is free for your trip.';
    if (availability?.available === true && rentalDays > 0) {
      const parts = [
        `${rentalDays} ${rentalDays === 1 ? 'day' : 'days'}`,
        `${formatDisplayDate(startDateKey)} → ${formatDisplayDate(endDateKey)}`,
      ];
      if (driverFee > 0) {
        parts.push(`includes ${driverFee.toLocaleString('en-US')} EGP driver fee`);
      }
      return parts.join(' · ');
    }
    return availability?.message || 'Adjust your dates and try again.';
  })();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.gallerySection}>
          {images.length > 0 ? (
            <ScrollView
              ref={galleryRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleGalleryScroll}
              scrollEventThrottle={16}
            >
              {images.map((img, idx) => (
                <Image
                  key={`${img}-${idx}`}
                  source={{ uri: img }}
                  style={styles.galleryImage}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.galleryImage, styles.galleryPlaceholder]}>
              <Ionicons name="car-outline" size={48} color={colors.ashSecondary} />
              <Text style={styles.galleryPlaceholderText}>Photo unavailable</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.backButtonOverlay, { top: insets.top + spacing.sm }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color={colors.duskText} />
          </TouchableOpacity>

          {images.length > 1 && (
            <Text style={styles.imageCounter}>
              {activeSlide + 1} / {images.length}
            </Text>
          )}
        </View>

        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbStrip}
          >
            {images.map((img, idx) => (
              <TouchableOpacity
                key={`thumb-${idx}`}
                onPress={() => goToSlide(idx)}
                activeOpacity={0.85}
                style={[styles.thumbWrap, activeSlide === idx && styles.thumbWrapActive]}
              >
                <Image source={{ uri: img }} style={styles.thumb} contentFit="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.vehicleTitle}>
              {vehicle.make} {vehicle.model}
            </Text>
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{vehicle.type || 'Vehicle'}</Text>
            </View>
          </View>

          <Text style={styles.vehicleMeta}>
            {vehicle.year} · Listed by {vehicle.owner?.name || 'Zabatly partner'}
          </Text>

          {vehicle.rating > 0 && (
            <View style={styles.ratingRow}>
              <StarRating rating={vehicle.rating} count={vehicle.numReviews} />
            </View>
          )}

          <View style={styles.specsRow}>
            {specs.map((spec) => (
              <SpecItem key={spec.label} label={spec.label} value={spec.value} />
            ))}
          </View>

          {vehicle.has_driver && (
            <Text style={styles.driverNote}>
              Driver available · {vehicle.driver_cost?.toLocaleString('en-US') ?? '—'} EGP/day
            </Text>
          )}

          {vehicle.description ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>About this vehicle</Text>
              <Text style={styles.description}>{vehicle.description}</Text>
            </View>
          ) : null}

          <View style={styles.ownerRow}>
            <View style={styles.ownerAvatar}>
              {vehicle.owner?.profilePicture ? (
                <Image
                  source={{ uri: vehicle.owner.profilePicture }}
                  style={styles.ownerAvatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.ownerAvatarText}>
                  {vehicle.owner?.name?.charAt(0) || 'O'}
                </Text>
              )}
            </View>
            <View style={styles.ownerInfo}>
              <View style={styles.ownerNameRow}>
                <Text style={styles.ownerName}>{vehicle.owner?.name || 'Host'}</Text>
                {vehicle.owner?.is_verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                )}
              </View>
              {vehicle.owner?.rating > 0 ? (
                <StarRating rating={vehicle.owner.rating} count={vehicle.owner.numReviews} size={12} />
              ) : (
                <Text style={styles.ownerSubtext}>New on Zabatly</Text>
              )}
            </View>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Pickup location</Text>
            <Text style={styles.locationPrimary}>{vehicle.city || 'Egypt'}</Text>
            {!!vehicle.address && (
              <Text style={styles.locationSecondary}>{vehicle.address}</Text>
            )}
            <View style={styles.mapWrap}>
              <VehicleLocationMap vehicle={vehicle} />
            </View>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Your trip dates</Text>

            <View style={styles.dateFieldsRow}>
              <TouchableOpacity
                style={styles.dateField}
                onPress={() => setShowStartPicker(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.dateFieldLabel}>Pickup</Text>
                <Text style={styles.dateFieldValue}>
                  {formatDisplayDate(startDateKey)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateField}
                onPress={() => setShowEndPicker(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.dateFieldLabel}>Return</Text>
                <Text style={styles.dateFieldValue}>
                  {formatDisplayDate(endDateKey)}
                </Text>
              </TouchableOpacity>
            </View>

            {showStartPicker && (
              <DateTimePicker
                value={startPickerDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={handleStartPickerChange}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={endPickerDate}
                mode="date"
                display="default"
                minimumDate={startDateKey ? new Date(`${startDateKey}T12:00:00`) : new Date()}
                onChange={handleEndPickerChange}
              />
            )}

            <BookingDateCalendar
              reservedRanges={reservedRanges}
              startDate={startDateKey}
              endDate={endDateKey}
              onPickDate={handleCalendarPick}
            />

            <View style={[styles.availabilityCard, availabilityCardStyle]}>
              <View style={styles.availabilityTitleRow}>
                <Text style={styles.availabilityTitle}>{availabilityTitle}</Text>
                {availabilityLoading && (
                  <ActivityIndicator size="small" color={colors.navy.default} />
                )}
              </View>
              <Text style={styles.availabilityBody}>{availabilityBody}</Text>
            </View>

            {vehicle.has_driver && (
              <View style={styles.driverBlock}>
                <TouchableOpacity
                  style={styles.driverToggleRow}
                  onPress={() => {
                    setNeedsDriver((prev) => !prev);
                    setBookingError('');
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.driverCheckbox, needsDriver && styles.driverCheckboxOn]}>
                    {needsDriver && (
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    )}
                  </View>
                  <View style={styles.driverToggleText}>
                    <Text style={styles.driverToggleLabel}>Book with driver</Text>
                    <Text style={styles.driverToggleHint}>
                      {(vehicle.driver_cost || 0).toLocaleString('en-US')} EGP/day
                    </Text>
                  </View>
                </TouchableOpacity>

                {needsDriver && (
                  <TextInput
                    style={styles.routeInput}
                    placeholder="Describe your route (e.g. Alexandria → Cairo)"
                    placeholderTextColor={colors.ashSecondary}
                    value={routeDescription}
                    onChangeText={(text) => {
                      setRouteDescription(text);
                      setBookingError('');
                    }}
                    multiline
                  />
                )}
              </View>
            )}

            {!!bookingError && (
              <Text style={styles.bookingErrorText}>{bookingError}</Text>
            )}
          </View>

          <View style={styles.block}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.blockTitle}>Reviews</Text>
              {vehicle.rating > 0 && (
                <StarRating rating={vehicle.rating} count={vehicle.numReviews} size={12} />
              )}
            </View>
            {reviews.length === 0 ? (
              <Text style={styles.noReviews}>
                No reviews yet for this {vehicle.make}.
              </Text>
            ) : (
              reviews.map((review) => <ReviewRow key={review._id} review={review} />)
            )}
          </View>

          {user && !isVerified && (
            <TouchableOpacity
              style={styles.kycBanner}
              onPress={() => router.push('/tabs/profile/kyc')}
              activeOpacity={0.8}
            >
              <Text style={styles.kycText}>Verify your identity to book this vehicle</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.navy.default} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View>
          {rentalDays > 0 ? (
            <>
              <Text style={styles.bottomPrice}>
                {estimatedTotal.toLocaleString('en-US')}{' '}
                <Text style={styles.bottomPriceUnit}>EGP</Text>
              </Text>
              <Text style={styles.bottomSubtext}>
                {rentalDays} {rentalDays === 1 ? 'day' : 'days'}
                {driverFee > 0 ? ' · incl. driver' : ''}
              </Text>
            </>
          ) : (
            <Text style={styles.bottomPrice}>
              {pricePerDay.toLocaleString('en-US')}{' '}
              <Text style={styles.bottomPriceUnit}>EGP/day</Text>
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.bookButton, isOwnVehicle && styles.bookButtonMuted]}
          onPress={handleBookingPress}
          disabled={isOwnVehicle}
          activeOpacity={0.85}
        >
          <Text style={styles.bookButtonText}>{getBookLabel()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sandCream,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.sandCream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.status.error.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.navy.default,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    minHeight: touchTarget.button,
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  backButton: {
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
    width: touchTarget.min,
    height: touchTarget.min,
    justifyContent: 'center',
  },
  gallerySection: {
    position: 'relative',
    backgroundColor: colors.warmLinen,
  },
  galleryImage: {
    width: screenWidth,
    height: HERO_HEIGHT,
  },
  galleryPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryPlaceholderText: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: spacing.sm,
  },
  backButtonOverlay: {
    position: 'absolute',
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.sandCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCounter: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.lg,
    ...typography.labelSmall,
    color: colors.sandCream,
    backgroundColor: 'rgba(26, 22, 19, 0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.xs,
    overflow: 'hidden',
  },
  thumbStrip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  thumbWrap: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: spacing.sm,
  },
  thumbWrapActive: {
    borderColor: colors.navy.default,
  },
  thumb: {
    width: 72,
    height: 52,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  vehicleTitle: {
    ...typography.title,
    fontSize: 22,
    lineHeight: 28,
    color: colors.duskText,
    flex: 1,
  },
  typePill: {
    backgroundColor: colors.warmLinen,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  typePillText: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
    textTransform: 'capitalize',
  },
  vehicleMeta: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: spacing.xxs,
  },
  ratingRow: {
    marginTop: spacing.sm,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stoneBorder,
  },
  specItem: {
    minWidth: '40%',
  },
  specLabel: {
    ...typography.overline,
    fontSize: 10,
    color: colors.ashSecondary,
    marginBottom: 4,
  },
  specValue: {
    ...typography.bodyMedium,
    color: colors.duskText,
  },
  driverNote: {
    ...typography.bodySmall,
    color: colors.navy.default,
    fontFamily: fontFamily.medium,
    marginTop: spacing.sm,
  },
  block: {
    marginTop: spacing.xl,
  },
  blockTitle: {
    ...typography.title,
    fontSize: 17,
    color: colors.duskText,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.duskText,
    lineHeight: 24,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stoneBorder,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.warmLinen,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  ownerAvatarText: {
    ...typography.title,
    color: colors.duskText,
  },
  ownerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  ownerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  ownerName: {
    ...typography.bodyMedium,
    color: colors.duskText,
  },
  verifiedBadge: {
    backgroundColor: colors.status.active.bg,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  verifiedBadgeText: {
    ...typography.labelSmall,
    fontSize: 10,
    color: colors.status.active.text,
    fontFamily: fontFamily.semiBold,
  },
  ownerSubtext: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
  },
  locationPrimary: {
    ...typography.bodyMedium,
    color: colors.duskText,
  },
  locationSecondary: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: 4,
  },
  mapWrap: {
    marginTop: spacing.md,
  },
  dateFieldsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateField: {
    flex: 1,
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
  },
  dateFieldLabel: {
    ...typography.overline,
    fontSize: 10,
    color: colors.ashSecondary,
    marginBottom: 4,
  },
  dateFieldValue: {
    ...typography.bodyMedium,
    color: colors.duskText,
    fontFamily: fontFamily.semiBold,
  },
  availabilityCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  availabilityNeutral: {
    backgroundColor: colors.warmLinen,
  },
  availabilityOpen: {
    backgroundColor: colors.status.active.bg,
  },
  availabilityPending: {
    backgroundColor: colors.status.pending.bg,
  },
  availabilityBlocked: {
    backgroundColor: colors.status.error.bg,
  },
  availabilityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 4,
  },
  availabilityTitle: {
    ...typography.bodyMedium,
    color: colors.duskText,
    marginBottom: 4,
  },
  availabilityBody: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
  },
  driverBlock: {
    marginTop: spacing.md,
  },
  driverToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  driverCheckbox: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    borderColor: colors.stoneBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sandCream,
  },
  driverCheckboxOn: {
    backgroundColor: colors.navy.default,
    borderColor: colors.navy.default,
  },
  driverToggleText: {
    flex: 1,
  },
  driverToggleLabel: {
    ...typography.bodyMedium,
    color: colors.duskText,
  },
  driverToggleHint: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: 2,
  },
  routeInput: {
    marginTop: spacing.sm,
    backgroundColor: colors.sandCream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    padding: spacing.md,
    minHeight: 88,
    textAlignVertical: 'top',
    ...typography.bodySmall,
    color: colors.duskText,
  },
  bookingErrorText: {
    ...typography.bodySmall,
    color: colors.status.error.text,
    marginTop: spacing.sm,
    fontFamily: fontFamily.medium,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  noReviews: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    paddingVertical: spacing.md,
  },
  reviewRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.stoneBorder,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.warmLinen,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarImage: {
    width: '100%',
    height: '100%',
  },
  reviewAvatarText: {
    ...typography.label,
    color: colors.ashSecondary,
  },
  reviewMeta: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  reviewAuthor: {
    ...typography.bodyMedium,
    color: colors.duskText,
    marginBottom: 2,
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewDate: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
  },
  reviewComment: {
    ...typography.bodySmall,
    color: colors.duskText,
    lineHeight: 20,
  },
  kycBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.status.pending.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  kycText: {
    ...typography.bodySmall,
    color: colors.status.pending.text,
    flex: 1,
    fontFamily: fontFamily.medium,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.sandCream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stoneBorder,
  },
  bottomPrice: {
    ...typography.title,
    fontSize: 20,
    color: colors.navy.default,
    fontVariant: ['tabular-nums'],
  },
  bottomPriceUnit: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    fontFamily: fontFamily.regular,
  },
  bottomSubtext: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: colors.navy.default,
    borderRadius: radius.sm,
    minHeight: touchTarget.button,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonMuted: {
    opacity: 0.5,
  },
  bookButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
