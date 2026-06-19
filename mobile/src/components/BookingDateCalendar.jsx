import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';
import { addDays, isWithinRange, toDateKey } from '@/utils/bookingDates';

const DAY_COUNT = 35;

export default function BookingDateCalendar({
  reservedRanges = [],
  startDate,
  endDate,
  onPickDate,
}) {
  const days = Array.from({ length: DAY_COUNT }, (_, index) => addDays(new Date(), index));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Reserved dates</Text>
        <Text style={styles.headerHint}>Next 35 days</Text>
      </View>
      <View style={styles.grid}>
        {days.map((day) => {
          const key = toDateKey(day);
          const reserved = reservedRanges.some((range) => isWithinRange(key, range));
          const selected = key === startDate || key === endDate;
          const inRange =
            startDate && endDate && key >= startDate && key <= endDate;

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.dayCell,
                reserved && styles.dayReserved,
                selected && styles.daySelected,
                inRange && !selected && styles.dayInRange,
              ]}
              disabled={reserved}
              onPress={() => onPickDate(key)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.dayText,
                  reserved && styles.dayTextReserved,
                  selected && styles.dayTextSelected,
                  inRange && !selected && styles.dayTextInRange,
                ]}
              >
                {day.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.legendReserved]} />
          <Text style={styles.legendText}>Reserved</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.legendAvailable]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLabel: {
    ...typography.overline,
    fontSize: 10,
    color: colors.ashSecondary,
  },
  headerHint: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
  },
  dayCell: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sandCream,
  },
  dayReserved: {
    backgroundColor: colors.status.error.bg,
  },
  daySelected: {
    backgroundColor: colors.navy.default,
  },
  dayInRange: {
    backgroundColor: colors.status.completed.bg,
  },
  dayText: {
    ...typography.labelSmall,
    color: colors.duskText,
    fontFamily: fontFamily.semiBold,
  },
  dayTextReserved: {
    color: colors.status.error.text,
  },
  dayTextSelected: {
    color: colors.white,
  },
  dayTextInRange: {
    color: colors.navy.default,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: radius.xs,
  },
  legendReserved: {
    backgroundColor: colors.status.error.bg,
    borderWidth: 1,
    borderColor: colors.status.error.border,
  },
  legendAvailable: {
    backgroundColor: colors.sandCream,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
  },
  legendText: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
  },
});
