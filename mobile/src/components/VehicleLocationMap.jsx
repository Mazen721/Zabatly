import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';

const DEFAULT_COORDS = { latitude: 31.2001, longitude: 29.9187 };
const MAP_HEIGHT = 168;

function buildMapHtml(latitude, longitude) {
  const lat = latitude.toFixed(6);
  const lng = longitude.toFixed(6);
  const navy = colors.navy.default;
  const cream = colors.sandCream;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    crossorigin=""
  />
  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    crossorigin=""
  ></script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: ${colors.warmLinen};
    }
    #map {
      width: 100%;
      height: 100%;
    }
    .leaflet-control-container {
      display: none;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      touchZoom: false,
    }).setView([${lat}, ${lng}], 14);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.circleMarker([${lat}, ${lng}], {
      radius: 8,
      color: '${cream}',
      weight: 3,
      fillColor: '${navy}',
      fillOpacity: 1,
    }).addTo(map);
  </script>
</body>
</html>`;
}

function buildMapsUrl(latitude, longitude, label) {
  const query = encodeURIComponent(label || `${latitude},${longitude}`);
  if (Platform.OS === 'ios') {
    return `maps:0,0?q=${latitude},${longitude}(${query})`;
  }
  if (Platform.OS === 'android') {
    return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${query})`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export default function VehicleLocationMap({ vehicle }) {
  const latitude = Number(
    vehicle?.location?.lat ?? vehicle?.lat ?? DEFAULT_COORDS.latitude,
  );
  const longitude = Number(
    vehicle?.location?.lng ?? vehicle?.lng ?? DEFAULT_COORDS.longitude,
  );
  const label = vehicle?.city || vehicle?.address || 'Pickup location';

  const mapHtml = useMemo(
    () => buildMapHtml(latitude, longitude),
    [latitude, longitude],
  );

  const openInMaps = () => {
    Linking.openURL(buildMapsUrl(latitude, longitude, label));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.mapShell}>
        <WebView
          source={{ html: mapHtml }}
          style={styles.map}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={colors.navy.default} />
            </View>
          )}
        />
      </View>

      <TouchableOpacity
        style={styles.actionBar}
        onPress={openInMaps}
        activeOpacity={0.85}
      >
        <View style={styles.actionIcon}>
          <Ionicons name="location" size={16} color={colors.navy.default} />
        </View>
        <View style={styles.actionText}>
          <Text style={styles.actionTitle} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.actionHint}>Tap to open in Maps</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.ashSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.warmLinen,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
  },
  mapShell: {
    height: MAP_HEIGHT,
    backgroundColor: colors.warmLinen,
  },
  map: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warmLinen,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stoneBorder,
    backgroundColor: colors.sandCream,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.warmLinen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    minWidth: 0,
  },
  actionTitle: {
    ...typography.bodyMedium,
    color: colors.duskText,
    fontFamily: fontFamily.semiBold,
  },
  actionHint: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
    marginTop: 1,
  },
});
