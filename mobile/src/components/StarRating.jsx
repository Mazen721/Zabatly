import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '@/theme/colors';
import typography from '@/theme/typography';

export default function StarRating({ rating = 0, count, size = 14 }) {
  const rounded = Math.round(rating);

  return (
    <View style={styles.row}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rounded ? 'star' : 'star-outline'}
            size={size}
            color={star <= rounded ? colors.amber.bright : colors.sand[300]}
            style={styles.star}
          />
        ))}
      </View>
      {count !== undefined && count > 0 && (
        <Text style={styles.count}>({count})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 1,
  },
  count: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginLeft: 4,
  },
});
