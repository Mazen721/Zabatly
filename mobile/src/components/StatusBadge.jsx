import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import shadows from '@/theme/shadows';
import { spacing, radius, touchTarget } from '@/theme/spacing';

const StatusBadge = React.memo(function StatusBadge({ status, style, textStyle, large = false }) {
  // Map 'confirmed' to 'pending'
  const mappedStatus = status === 'confirmed' ? 'pending' : status;

  // Retrieve the status configuration, fallback to cancelled if undefined
  const statusColorInfo = colors.status[mappedStatus] || colors.status.cancelled;
  const textColor = statusColorInfo.text;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.dot, large && styles.dotLarge, { backgroundColor: textColor }]} />
      <Text style={[styles.text, large && styles.textLarge, { color: textColor }, textStyle]}>
        {status}
      </Text>
    </View>
  );
});
export default StatusBadge;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotLarge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  text: {
    ...typography.labelSmall,
    textTransform: 'capitalize',
  },
  textLarge: {
    fontSize: 14,
    lineHeight: 18,
  },
});
