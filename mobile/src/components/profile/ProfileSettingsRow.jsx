import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, touchTarget } from '@/theme/spacing';

export default function ProfileSettingsRow({
  label,
  value,
  icon,
  onPress,
  destructive = false,
  showChevron = true,
  isLast = false,
}) {
  const content = (
    <>
      {icon ? (
        <View style={styles.iconWrap}>{icon}</View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={[styles.label, destructive && styles.destructiveLabel]}>{label}</Text>
        {value ? (
          <Text style={styles.value} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
      </View>
      {showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={16} color={colors.sand[400]} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.row, !isLast && styles.rowBorder]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.row, !isLast && styles.rowBorder]}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget.listItem,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.stoneBorder,
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    ...typography.body,
    color: colors.duskText,
    fontFamily: fontFamily.medium,
  },
  destructiveLabel: {
    color: colors.status.error.text,
  },
  value: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: 2,
  },
});
