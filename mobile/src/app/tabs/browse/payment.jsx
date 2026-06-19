import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius, touchTarget } from '@/theme/spacing';
import { getVehicleById, createBooking } from '@/api/client';
import {
  calculateRentalDays,
  formatDisplayDate,
  toDateKey,
} from '@/utils/bookingDates';
import CheckoutSkeleton from '@/components/CheckoutSkeleton';
import CreditCardPreview from '@/components/CreditCardPreview';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SERVICE_FEE_RATE = 0.05;
const VODAFONE_NUMBER = '01090923550';
const INSTAPAY_ID = 'mazen721@instapay';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit or debit card', icon: 'card-outline' },
  { id: 'vodafone_cash', label: 'Vodafone Cash', icon: 'phone-portrait-outline' },
  { id: 'instapay', label: 'InstaPay', icon: 'flash-outline' },
];

function parseDateParam(value) {
  if (!value || typeof value !== 'string') return null;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatCardNumber(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function detectCardBrand(number) {
  const digits = number.replace(/\D/g, '');
  if (!digits) return 'Card';
  if (digits.startsWith('4')) return 'Visa';
  if (digits.startsWith('5')) return 'Mastercard';
  const firstFour = Number(digits.slice(0, 4));
  if (digits.length >= 4 && firstFour >= 2221 && firstFour <= 2720) {
    return 'Mastercard';
  }
  return 'Card';
}

function formatExpiryInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function PaymentMethodRow({ method, selected, onSelect }) {
  return (
    <TouchableOpacity
      style={[styles.methodRow, selected && styles.methodRowSelected]}
      onPress={() => onSelect(method.id)}
      activeOpacity={0.85}
    >
      <View style={[styles.methodIcon, selected && styles.methodIconSelected]}>
        <Ionicons
          name={method.icon}
          size={20}
          color={selected ? colors.navy.default : colors.ashSecondary}
        />
      </View>
      <Text style={[styles.methodLabel, selected && styles.methodLabelSelected]}>
        {method.label}
      </Text>
      <View style={[styles.methodRadio, selected && styles.methodRadioSelected]}>
        {selected && <View style={styles.methodRadioDot} />}
      </View>
    </TouchableOpacity>
  );
}

export default function PaymentScreen() {
  const {
    vehicleId,
    startDate: startDateParam,
    endDate: endDateParam,
    needsDriver: needsDriverParam,
    routeDescription: routeDescriptionParam,
  } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState(null);

  const withDriver = needsDriverParam === 'true';
  const routeDescription =
    typeof routeDescriptionParam === 'string' ? routeDescriptionParam : '';

  const [startDate] = useState(() => {
    return parseDateParam(startDateParam) || new Date();
  });
  const [endDate] = useState(() => {
    return (
      parseDateParam(endDateParam) ||
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [proofImage, setProofImage] = useState(null);

  useEffect(() => {
    if (!vehicleId) return;

    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const { data } = await getVehicleById(vehicleId);
        setVehicle(data);
      } catch {
        setError('Could not load checkout. Go back and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId]);

  const selectPaymentMethod = (method) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPaymentMethod(method);
    setError(null);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Photo access is needed to upload payment proof.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setProofImage(result.assets[0]);
      setError(null);
    }
  };

  const toServerDateString = (date) => toDateKey(date);

  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);
  const days = calculateRentalDays(startKey, endKey);
  const pricePerDay = vehicle?.price_per_day || 0;
  const driverCostPerDay = vehicle?.driver_cost || 0;
  const rentalPrice = pricePerDay * days;
  const driverFee = withDriver ? driverCostPerDay * days : 0;
  const subtotal = rentalPrice + driverFee;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const totalPrice = subtotal + serviceFee;
  const cardBrand = detectCardBrand(cardNumber);

  const handleEditTrip = () => {
    router.push(`/tabs/browse/${vehicleId}`);
  };

  const handleConfirmBooking = async () => {
    if (endDate <= startDate) {
      setError('Return date must be after pickup date.');
      return;
    }

    setError(null);
    setBookingLoading(true);

    try {
      let response;

      if (paymentMethod === 'card') {
        const payload = {
          vehicle: vehicleId,
          startDate: toServerDateString(startDate),
          endDate: toServerDateString(endDate),
          totalPrice,
          rentalPrice,
          serviceFee,
          paymentMethod: 'card',
          withDriver,
          needsDriver: withDriver,
          routeDescription: withDriver ? routeDescription : 'Self-drive',
        };
        response = await createBooking(payload);
      } else if (proofImage) {
        const formData = new FormData();
        formData.append('vehicle', vehicleId);
        formData.append('startDate', toServerDateString(startDate));
        formData.append('endDate', toServerDateString(endDate));
        formData.append('totalPrice', totalPrice);
        formData.append('rentalPrice', rentalPrice);
        formData.append('serviceFee', serviceFee);
        formData.append('paymentMethod', paymentMethod);
        formData.append('withDriver', String(withDriver));
        formData.append('needsDriver', String(withDriver));
        formData.append(
          'routeDescription',
          withDriver ? routeDescription : 'Self-drive',
        );

        const fileUri = proofImage.uri;
        const fileName = fileUri.split('/').pop() || 'proof.jpg';

        formData.append('paymentProof', {
          uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
          name: fileName,
          type: 'image/jpeg',
        });

        response = await createBooking(formData);
      } else {
        const payload = {
          vehicle: vehicleId,
          startDate: toServerDateString(startDate),
          endDate: toServerDateString(endDate),
          totalPrice,
          rentalPrice,
          serviceFee,
          paymentMethod,
          withDriver,
          needsDriver: withDriver,
          routeDescription: withDriver ? routeDescription : 'Self-drive',
        };
        response = await createBooking(payload);
      }

      if (response?.data) {
        router.replace({
          pathname: '/tabs/browse/success',
          params: { bookingId: response.data._id },
        });
      }
    } catch (err) {
      setError(err.message || 'Booking could not be confirmed. Try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={22} color={colors.duskText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerSpacer} />
        </View>
        <CheckoutSkeleton />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error || 'Vehicle not found.'}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUrl = vehicle.images?.[0] || null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <View style={styles.container}>
        <View style={[styles.headerBar, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={22} color={colors.duskText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 108 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.recapBlock}>
            <View style={styles.recapTop}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.recapImage} contentFit="cover" />
              ) : (
                <View style={styles.recapImagePlaceholder}>
                  <Ionicons name="car-outline" size={24} color={colors.ashSecondary} />
                </View>
              )}
              <View style={styles.recapMeta}>
                <Text style={styles.recapTitle} numberOfLines={1}>
                  {vehicle.make} {vehicle.model}
                </Text>
                <Text style={styles.recapCity}>
                  Pickup in {vehicle.city || 'Egypt'}
                </Text>
              </View>
            </View>

            <View style={styles.tripDatesRow}>
              <View style={styles.tripDateCol}>
                <Text style={styles.tripDateLabel}>Pickup</Text>
                <Text style={styles.tripDateValue}>{formatDisplayDate(startKey)}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={colors.ashSecondary} />
              <View style={styles.tripDateCol}>
                <Text style={styles.tripDateLabel}>Return</Text>
                <Text style={styles.tripDateValue}>{formatDisplayDate(endKey)}</Text>
              </View>
            </View>

            <Text style={styles.tripDuration}>
              {days} {days === 1 ? 'day' : 'days'}
              {withDriver ? ' · with driver' : ''}
            </Text>

            {withDriver && !!routeDescription && (
              <Text style={styles.routeNote} numberOfLines={2}>
                Route: {routeDescription}
              </Text>
            )}

            <TouchableOpacity style={styles.editTripLink} onPress={handleEditTrip} activeOpacity={0.85}>
              <Text style={styles.editTripText}>Edit trip</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.navy.light} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price</Text>
            <View style={styles.priceSheet}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  Vehicle · {days} {days === 1 ? 'day' : 'days'}
                </Text>
                <Text style={styles.priceValue}>
                  {rentalPrice.toLocaleString('en-US')} EGP
                </Text>
              </View>
              {withDriver && driverFee > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Driver</Text>
                  <Text style={styles.priceValue}>
                    {driverFee.toLocaleString('en-US')} EGP
                  </Text>
                </View>
              )}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Service fee (5%)</Text>
                <Text style={styles.priceValue}>
                  {serviceFee.toLocaleString('en-US')} EGP
                </Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {totalPrice.toLocaleString('en-US')} EGP
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment method</Text>
            <View style={styles.methodList}>
              {PAYMENT_METHODS.map((method) => (
                <PaymentMethodRow
                  key={method.id}
                  method={method}
                  selected={paymentMethod === method.id}
                  onSelect={selectPaymentMethod}
                />
              ))}
            </View>
          </View>

          {paymentMethod === 'card' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Card details</Text>
              <CreditCardPreview
                brand={cardBrand}
                cardNumber={formatCardNumber(cardNumber)}
                cardName={cardName}
                cardExpiry={cardExpiry}
                cardCvv={cardCvv}
                isFlipped={cardFlipped}
              />
              <View style={styles.formStack}>
                <TextInput
                  style={styles.input}
                  placeholder="Card number"
                  placeholderTextColor={colors.ashSecondary}
                  keyboardType="number-pad"
                  value={formatCardNumber(cardNumber)}
                  onChangeText={(text) => setCardNumber(text.replace(/\D/g, '').slice(0, 16))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Name on card"
                  placeholderTextColor={colors.ashSecondary}
                  value={cardName}
                  onChangeText={setCardName}
                  autoCapitalize="words"
                />
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.inputHalf]}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.ashSecondary}
                    keyboardType="number-pad"
                    maxLength={5}
                    value={cardExpiry}
                    onChangeText={(text) => setCardExpiry(formatExpiryInput(text))}
                  />
                  <TextInput
                    style={[styles.input, styles.inputHalf]}
                    placeholder="CVV"
                    placeholderTextColor={colors.ashSecondary}
                    keyboardType="number-pad"
                    maxLength={4}
                    value={cardCvv}
                    onChangeText={(text) => setCardCvv(text.replace(/\D/g, '').slice(0, 4))}
                    onFocus={() => setCardFlipped(true)}
                    onBlur={() => setCardFlipped(false)}
                  />
                </View>
              </View>
              <Text style={styles.cardNote}>
                Card details are collected for this demo checkout flow.
              </Text>
            </View>
          )}

          {paymentMethod === 'vodafone_cash' && (
            <View style={styles.section}>
              <View style={styles.walletInstruction}>
                <Text style={styles.walletInstructionText}>
                  Send {totalPrice.toLocaleString('en-US')} EGP to Vodafone Cash
                </Text>
                <Text style={styles.walletAccount}>{VODAFONE_NUMBER}</Text>
              </View>
              <Text style={styles.uploadLabel}>Payment proof (optional)</Text>
              {proofImage ? (
                <View style={styles.proofPreview}>
                  <Image source={{ uri: proofImage.uri }} style={styles.proofImage} contentFit="cover" />
                  <TouchableOpacity
                    style={styles.proofRemove}
                    onPress={() => setProofImage(null)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="close" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadArea} onPress={handlePickImage} activeOpacity={0.85}>
                  <Ionicons name="image-outline" size={22} color={colors.navy.default} />
                  <Text style={styles.uploadText}>Upload screenshot</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {paymentMethod === 'instapay' && (
            <View style={styles.section}>
              <View style={styles.walletInstruction}>
                <Text style={styles.walletInstructionText}>
                  Send {totalPrice.toLocaleString('en-US')} EGP via InstaPay
                </Text>
                <Text style={styles.walletAccount}>{INSTAPAY_ID}</Text>
              </View>
              <Text style={styles.uploadLabel}>Payment proof (optional)</Text>
              {proofImage ? (
                <View style={styles.proofPreview}>
                  <Image source={{ uri: proofImage.uri }} style={styles.proofImage} contentFit="cover" />
                  <TouchableOpacity
                    style={styles.proofRemove}
                    onPress={() => setProofImage(null)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="close" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadArea} onPress={handlePickImage} activeOpacity={0.85}>
                  <Ionicons name="image-outline" size={22} color={colors.navy.default} />
                  <Text style={styles.uploadText}>Upload screenshot</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!!error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.status.error.text} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.bottomMeta}>
            <Text style={styles.bottomTotal}>
              {totalPrice.toLocaleString('en-US')}{' '}
              <Text style={styles.bottomTotalUnit}>EGP</Text>
            </Text>
            <Text style={styles.bottomHint}>Total for your trip</Text>
          </View>
          <TouchableOpacity
            style={[styles.confirmButton, bookingLoading && styles.confirmButtonDisabled]}
            onPress={handleConfirmBooking}
            disabled={bookingLoading}
            activeOpacity={0.85}
          >
            {bookingLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm booking</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.sandCream,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.stoneBorder,
  },
  backButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.title,
    fontSize: 18,
    color: colors.duskText,
  },
  headerSpacer: {
    width: touchTarget.min,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  recapBlock: {
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  recapTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recapImage: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.stoneBorder,
  },
  recapImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.sandCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recapMeta: {
    flex: 1,
    minWidth: 0,
  },
  recapTitle: {
    ...typography.bodyMedium,
    color: colors.duskText,
    fontFamily: fontFamily.semiBold,
  },
  recapCity: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: 2,
  },
  tripDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stoneBorder,
  },
  tripDateCol: {
    flex: 1,
  },
  tripDateLabel: {
    ...typography.overline,
    fontSize: 10,
    color: colors.ashSecondary,
  },
  tripDateValue: {
    ...typography.bodyMedium,
    color: colors.duskText,
    fontFamily: fontFamily.semiBold,
    marginTop: 2,
  },
  tripDuration: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: spacing.sm,
  },
  routeNote: {
    ...typography.bodySmall,
    color: colors.duskText,
    marginTop: spacing.xs,
  },
  editTripLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginTop: spacing.sm,
  },
  editTripText: {
    ...typography.label,
    color: colors.navy.light,
    fontFamily: fontFamily.semiBold,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 17,
    color: colors.duskText,
    marginBottom: spacing.sm,
  },
  priceSheet: {
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    padding: spacing.md,
    gap: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  priceLabel: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
  },
  priceValue: {
    ...typography.bodyMedium,
    color: colors.duskText,
    fontVariant: ['tabular-nums'],
  },
  priceDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.stoneBorder,
    marginVertical: spacing.xs,
  },
  totalLabel: {
    ...typography.bodyMedium,
    color: colors.duskText,
    fontFamily: fontFamily.semiBold,
  },
  totalValue: {
    ...typography.title,
    fontSize: 18,
    color: colors.navy.default,
    fontVariant: ['tabular-nums'],
  },
  methodList: {
    gap: spacing.sm,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: touchTarget.min,
  },
  methodRowSelected: {
    borderColor: colors.navy.default,
    backgroundColor: colors.sandCream,
  },
  methodIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.sandCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconSelected: {
    backgroundColor: colors.status.completed.bg,
  },
  methodLabel: {
    ...typography.bodyMedium,
    color: colors.duskText,
    flex: 1,
  },
  methodLabelSelected: {
    fontFamily: fontFamily.semiBold,
  },
  methodRadio: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.stoneBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodRadioSelected: {
    borderColor: colors.navy.default,
  },
  methodRadioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.navy.default,
  },
  formStack: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.sandCream,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget.input,
    ...typography.body,
    color: colors.duskText,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputHalf: {
    flex: 1,
  },
  cardNote: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
    marginTop: spacing.sm,
  },
  walletInstruction: {
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  walletInstructionText: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
  },
  walletAccount: {
    ...typography.title,
    fontSize: 20,
    color: colors.navy.default,
    marginTop: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  uploadLabel: {
    ...typography.label,
    color: colors.duskText,
    marginBottom: spacing.sm,
  },
  uploadArea: {
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    backgroundColor: colors.warmLinen,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  uploadText: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
  },
  proofPreview: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.stoneBorder,
  },
  proofImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.warmLinen,
  },
  proofRemove: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: 'rgba(26, 22, 19, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.status.error.bg,
    borderWidth: 1,
    borderColor: colors.status.error.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    ...typography.bodySmall,
    color: colors.status.error.text,
    flex: 1,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.sandCream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stoneBorder,
  },
  bottomMeta: {
    flex: 1,
    minWidth: 0,
  },
  bottomTotal: {
    ...typography.title,
    fontSize: 20,
    color: colors.navy.default,
    fontVariant: ['tabular-nums'],
  },
  bottomTotalUnit: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    fontFamily: fontFamily.regular,
  },
  bottomHint: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: colors.navy.default,
    borderRadius: radius.sm,
    minHeight: touchTarget.button,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
