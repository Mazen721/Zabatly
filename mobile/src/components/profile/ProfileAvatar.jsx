import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { radius } from '@/theme/spacing';

function getInitials(name) {
  if (!name) return 'Z';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfileAvatar({
  name,
  photoUrl,
  size = 88,
  editable = false,
  onPress,
  loading = false,
}) {
  const [isLightboxVisible, setIsLightboxVisible] = useState(false);
  const initials = getInitials(name);
  const radiusValue = size / 2;

  const handleAvatarPress = () => {
    if (photoUrl) {
      setIsLightboxVisible(true);
    } else if (editable && onPress && !loading) {
      onPress();
    }
  };

  const handleEditPress = () => {
    if (editable && onPress && !loading) {
      onPress();
    }
  };

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <TouchableOpacity
        style={[styles.wrap, { width: size, height: size, borderRadius: radiusValue }]}
        onPress={handleAvatarPress}
        disabled={(!editable && !photoUrl) || loading}
        activeOpacity={0.85}
        accessibilityRole={photoUrl ? 'button' : (editable ? 'button' : 'image')}
        accessibilityLabel={photoUrl ? 'View profile photo' : (editable ? 'Change profile photo' : 'Profile photo')}
      >
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={[styles.image, { width: size, height: size, borderRadius: radiusValue }]}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              { width: size, height: size, borderRadius: radiusValue },
            ]}
          >
            <Text style={[styles.initials, { fontSize: size * 0.32 }]}>{initials}</Text>
          </View>
        )}
      </TouchableOpacity>

      {editable ? (
        photoUrl ? (
          <TouchableOpacity
            style={styles.editBadge}
            onPress={handleEditPress}
            disabled={loading}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.sandCream} />
            ) : (
              <Ionicons name="camera-outline" size={14} color={colors.sandCream} />
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.editBadge}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.sandCream} />
            ) : (
              <Ionicons name="camera-outline" size={14} color={colors.sandCream} />
            )}
          </View>
        )
      ) : null}

      <Modal
        visible={isLightboxVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setIsLightboxVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={() => setIsLightboxVisible(false)}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsLightboxVisible(false)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close photo viewer"
          >
            <Ionicons name="close" size={24} color={colors.sandCream} />
          </TouchableOpacity>
          <Image
            source={{ uri: photoUrl }}
            style={styles.modalImage}
            contentFit="contain"
          />
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    backgroundColor: colors.warmLinen,
  },
  image: {
    backgroundColor: colors.warmLinen,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warmLinen,
  },
  initials: {
    ...typography.headline,
    color: colors.navy.light,
    fontFamily: fontFamily.semiBold,
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.navy.default,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.sandCream,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(15, 22, 35, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '75%',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 45,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
