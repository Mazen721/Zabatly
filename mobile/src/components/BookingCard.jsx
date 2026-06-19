import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import shadows from '@/theme/shadows';
import { spacing, radius, touchTarget } from '@/theme/spacing';
import { cancelBooking } from '@/api/client';
import StatusBadge from './StatusBadge';

// Helper to format date in "May 15" style
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.toLocaleDateString('en-US', { day: 'numeric' });
  return `${month} ${day}`;
};

// Helper to format date range in "May 15 - May 20" style
const formatDateRange = (startStr, endStr) => {
  if (!startStr) return '—';
  if (!endStr) return formatDate(startStr);
  return `${formatDate(startStr)} - ${formatDate(endStr)}`;
};

// Helper to format booking registration date
const formatCreatedDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const BookingCard = React.memo(function BookingCard({ booking, onCancelSuccess }) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  if (!booking) return null;

  const vehicle = booking.vehicle;
  const isDriverOnly = !vehicle && booking.driver;

  const title = isDriverOnly
    ? 'Driver Service'
    : vehicle
    ? `${vehicle.make} ${vehicle.model}`
    : 'Unknown Vehicle';

  const imageUrl = vehicle?.images && vehicle.images.length > 0 ? vehicle.images[0] : null;

  const handleCardPress = () => {
    setModalVisible(true);
  };

  const navigateToVehicle = () => {
    setModalVisible(false);
    if (vehicle?._id) {
      router.push({
        pathname: '/tabs/browse/[id]',
        params: { id: vehicle._id },
      });
    }
  };

  const handleCancelPress = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking(booking._id);
              Alert.alert('Success', 'Your booking has been cancelled successfully.');
              if (onCancelSuccess) {
                onCancelSuccess();
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not cancel booking. Try again.');
            }
          },
        },
      ]
    );
  };

  // Show cancellation button for 'pending' or 'confirmed' status
  const showCancelButton = booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      disabled={!vehicle?._id}
      activeOpacity={0.85}
    >
      {/* Top: Full-Width Image */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <Ionicons
            name={isDriverOnly ? 'person-outline' : 'car-outline'}
            size={48}
            color={colors.ashSecondary}
          />
        </View>
      )}

      {/* Bottom: Booking Details */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <StatusBadge status={booking.status} />
        </View>

        <View style={styles.detailsRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.ashSecondary} />
          <Text style={styles.dates}>
            {formatDateRange(booking.startDate, booking.endDate)}
          </Text>
        </View>

        {booking.createdAt && (
          <View style={styles.detailsRow}>
            <Ionicons name="time-outline" size={16} color={colors.ashSecondary} />
            <Text style={styles.bookedOn}>
              Booked on {formatCreatedDate(booking.createdAt)}
            </Text>
          </View>
        )}

        {/* Pending verification alert */}
        {booking.status === 'pending' && (
          <View style={[styles.pendingAlert, { backgroundColor: colors.status.pending.bg, borderColor: colors.status.pending.border }]}>
            <Ionicons name="alert-circle" size={16} color={colors.status.pending.text} />
            <Text style={[styles.pendingVerification, { color: colors.status.pending.text }]}>
              Payment verification in progress
            </Text>
          </View>
        )}

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.priceLabel}>Total Price</Text>
            <Text style={styles.price}>
              {booking.totalPrice !== undefined && booking.totalPrice !== null
                ? `${booking.totalPrice.toLocaleString('en-US')} EGP`
                : '— EGP'}
            </Text>
          </View>

          {showCancelButton && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelPress}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Booking Details Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Booking Details</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.duskText} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Reference</Text>
                  <Text style={styles.modalValue}>{booking._id?.slice(-8).toUpperCase() || 'N/A'}</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <StatusBadge status={booking.status} />
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Payment</Text>
                  <Text style={[styles.modalValue, { textTransform: 'capitalize' }]}>{booking.paymentStatus || 'Unpaid'}</Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Price Breakdown</Text>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Rental</Text>
                  <Text style={styles.modalValue}>{booking.rentalPrice ? `${booking.rentalPrice.toLocaleString('en-US')} EGP` : '—'}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Service Fee</Text>
                  <Text style={styles.modalValue}>{booking.serviceFee ? `${booking.serviceFee.toLocaleString('en-US')} EGP` : '—'}</Text>
                </View>
                <View style={[styles.modalRow, { marginTop: spacing.xs }]}>
                  <Text style={[styles.modalLabel, { color: colors.duskText, fontWeight: '600' }]}>Total</Text>
                  <Text style={[styles.modalValue, { color: colors.amber.default, fontWeight: '700', fontSize: 18 }]}>
                    {booking.totalPrice ? `${booking.totalPrice.toLocaleString('en-US')} EGP` : '— EGP'}
                  </Text>
                </View>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.vehicleButton} onPress={navigateToVehicle} activeOpacity={0.85}>
                  <Ionicons name="car-sport-outline" size={20} color={colors.navy.default} />
                  <Text style={styles.vehicleButtonText}>View Vehicle Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    overflow: 'hidden',
    ...shadows.ambient,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.warmLinen,
  },
  placeholderContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.warmLinen,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: colors.stoneBorder,
  },
  content: {
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headline,
    fontSize: 20,
    color: colors.duskText,
    flex: 1,
    marginRight: spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  dates: {
    ...typography.body,
    color: colors.duskText,
  },
  bookedOn: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
  },
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pendingVerification: {
    ...typography.labelSmall,
    fontWeight: '600',
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.stoneBorder,
  },
  priceLabel: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  price: {
    ...typography.numeric,
    fontSize: 22,
    color: colors.duskText,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.status.error.bg,
    borderWidth: 1,
    borderColor: colors.status.error.border,
  },
  cancelButtonText: {
    ...typography.buttonSmall,
    color: colors.status.error.text,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 22, 35, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    ...shadows.ambient,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.headline,
    fontSize: 22,
    color: colors.duskText,
  },
  closeButton: {
    padding: spacing.xs,
    backgroundColor: colors.sandCream,
    borderRadius: radius.full,
  },
  modalBody: {
    gap: spacing.sm,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalLabel: {
    ...typography.body,
    color: colors.ashSecondary,
  },
  modalValue: {
    ...typography.body,
    color: colors.duskText,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.stoneBorder,
    marginVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.duskText,
    marginBottom: spacing.xxs,
  },
  vehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.sandCream,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  vehicleButtonText: {
    ...typography.button,
    color: colors.navy.default,
    fontWeight: '600',
  },
});

export default BookingCard;
