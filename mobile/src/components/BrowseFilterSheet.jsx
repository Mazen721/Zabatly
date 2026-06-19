import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius, touchTarget } from '@/theme/spacing';
import {
  AC_OPTIONS,
  DEFAULT_BROWSE_FILTERS,
  DRIVER_OPTIONS,
  PRICE_MAX,
  PRICE_MIN,
  TRANSMISSIONS,
  VEHICLE_TYPES,
} from '@/utils/browseFilters';

function FilterSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {children}
    </View>
  );
}

function RadioRow({ label, selected, onPress }) {
  return (
    <TouchableOpacity style={styles.radioRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{label}</Text>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
}

export default function BrowseFilterSheet({
  visible,
  filters,
  cities,
  onClose,
  onApply,
  onClearAll,
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
    }
  }, [visible, filters]);

  const setField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handlePriceChange = (key, text) => {
    const parsed = text.replace(/[^0-9]/g, '');
    const value = parsed === '' ? (key === 'priceMin' ? PRICE_MIN : PRICE_MAX) : Number(parsed);
    const clamped = Math.min(Math.max(value, PRICE_MIN), PRICE_MAX);
    setDraft((prev) => {
      const next = { ...prev, [key]: clamped };
      if (next.priceMin > next.priceMax) {
        if (key === 'priceMin') next.priceMax = clamped;
        else next.priceMin = clamped;
      }
      return next;
    });
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleClear = () => {
    setDraft({ ...DEFAULT_BROWSE_FILTERS });
    onClearAll();
    onClose();
  };

  const hasActive =
    draft.type !== 'all' ||
    draft.transmission !== 'all' ||
    draft.city !== 'all' ||
    draft.ac !== 'all' ||
    draft.driver !== 'all' ||
    draft.priceMin !== PRICE_MIN ||
    draft.priceMax !== PRICE_MAX;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.duskText} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            <FilterSection title="Vehicle type">
              {VEHICLE_TYPES.map((option) => (
                <RadioRow
                  key={option.value}
                  label={option.label}
                  selected={draft.type === option.value}
                  onPress={() => setField('type', option.value)}
                />
              ))}
            </FilterSection>

            <FilterSection title="Price range">
              <View style={styles.priceRow}>
                <View style={styles.priceField}>
                  <Text style={styles.priceFieldLabel}>Min (EGP)</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={String(draft.priceMin)}
                    onChangeText={(text) => handlePriceChange('priceMin', text)}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                <View style={styles.priceField}>
                  <Text style={styles.priceFieldLabel}>Max (EGP)</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={String(draft.priceMax)}
                    onChangeText={(text) => handlePriceChange('priceMax', text)}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              </View>
            </FilterSection>

            <FilterSection title="Transmission">
              {TRANSMISSIONS.map((option) => (
                <RadioRow
                  key={option.value}
                  label={option.label}
                  selected={draft.transmission === option.value}
                  onPress={() => setField('transmission', option.value)}
                />
              ))}
            </FilterSection>

            <FilterSection title="City">
              <RadioRow
                label="All cities"
                selected={draft.city === 'all'}
                onPress={() => setField('city', 'all')}
              />
              {cities.map((city) => (
                <RadioRow
                  key={city}
                  label={city}
                  selected={draft.city === city}
                  onPress={() => setField('city', city)}
                />
              ))}
            </FilterSection>

            <FilterSection title="Air conditioning">
              {AC_OPTIONS.map((option) => (
                <RadioRow
                  key={option.value}
                  label={option.label}
                  selected={draft.ac === option.value}
                  onPress={() => setField('ac', option.value)}
                />
              ))}
            </FilterSection>

            <FilterSection title="Driver included">
              {DRIVER_OPTIONS.map((option) => (
                <RadioRow
                  key={option.value}
                  label={option.label}
                  selected={draft.driver === option.value}
                  onPress={() => setField('driver', option.value)}
                />
              ))}
            </FilterSection>
          </ScrollView>

          <View style={styles.footer}>
            {hasActive && (
              <TouchableOpacity onPress={handleClear} style={styles.clearButton} activeOpacity={0.7}>
                <Text style={styles.clearButtonText}>Clear all filters</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleApply} style={styles.applyButton} activeOpacity={0.85}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.sandCream,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.stoneBorder,
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    ...typography.title,
    fontSize: 18,
    color: colors.duskText,
  },
  closeButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.overline,
    fontSize: 10,
    color: colors.ashSecondary,
    marginBottom: spacing.xs,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.stoneBorder,
  },
  radioLabel: {
    ...typography.body,
    color: colors.duskText,
  },
  radioLabelSelected: {
    fontFamily: fontFamily.medium,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.stoneBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.navy.default,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.navy.default,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  priceField: {
    flex: 1,
  },
  priceFieldLabel: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
    marginBottom: spacing.xxs,
  },
  priceInput: {
    ...typography.body,
    backgroundColor: colors.warmLinen,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.duskText,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  clearButtonText: {
    ...typography.buttonSmall,
    color: colors.navy.default,
    fontFamily: fontFamily.semiBold,
  },
  applyButton: {
    backgroundColor: colors.navy.default,
    borderRadius: radius.sm,
    minHeight: touchTarget.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
