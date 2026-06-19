import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius, touchTarget } from '@/theme/spacing';
import { getVehicles } from '@/api/client';
import {
  countActiveFilters,
  DEFAULT_BROWSE_FILTERS,
  filterVehicles,
  getCityOptions,
} from '@/utils/browseFilters';
import VehicleListCard from '@/components/VehicleListCard';
import VehicleListSkeleton from '@/components/VehicleListSkeleton';
import BrowseFilterSheet from '@/components/BrowseFilterSheet';

export default function VehicleListScreen() {
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_BROWSE_FILTERS);
  const [sheetVisible, setSheetVisible] = useState(false);

  const [allVehicles, setAllVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchListings = useCallback(async () => {
    try {
      setError(null);
      const { data } = await getVehicles();
      setAllVehicles(data || []);
    } catch {
      setError('Could not load vehicles. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchListings();
  }, [fetchListings]);

  const cities = useMemo(() => getCityOptions(allVehicles), [allVehicles]);

  const filteredVehicles = useMemo(
    () => filterVehicles(allVehicles, debouncedSearch, filters),
    [allVehicles, debouncedSearch, filters]
  );

  const activeFilterCount = countActiveFilters(filters);

  const clearAll = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearch('');
    setFilters({ ...DEFAULT_BROWSE_FILTERS });
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.screenTitle}>Browse fleet</Text>
      {!loading && !error && (
        <Text style={styles.resultCount}>
          {filteredVehicles.length}{' '}
          {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'}
        </Text>
      )}

      <View style={styles.searchRow}>
        <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
          <Ionicons name="search" size={18} color={colors.ashSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search make, model, or city"
            placeholderTextColor={colors.ashSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.ashSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filtersButton}
          onPress={() => setSheetVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={18} color={colors.navy.default} />
          <Text style={styles.filtersButtonText}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    const hasFilters = activeFilterCount > 0 || debouncedSearch.length > 0;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>
          {hasFilters ? 'No matches' : 'No vehicles available'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {hasFilters
            ? 'Try clearing a filter or broadening your search.'
            : 'Check back soon for new listings.'}
        </Text>
        {hasFilters && (
          <TouchableOpacity style={styles.clearButton} onPress={clearAll} activeOpacity={0.85}>
            <Text style={styles.clearButtonText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading && allVehicles.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {renderHeader()}
        <View style={styles.listContent}>
          <VehicleListSkeleton />
          <VehicleListSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={filteredVehicles}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <VehicleListCard vehicle={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.navy.light}
          />
        }
      />

      <BrowseFilterSheet
        visible={sheetVisible}
        filters={filters}
        cities={cities}
        onClose={() => setSheetVisible(false)}
        onApply={setFilters}
        onClearAll={() => {
          setFilters({ ...DEFAULT_BROWSE_FILTERS });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sandCream,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  screenTitle: {
    ...typography.title,
    fontSize: 22,
    color: colors.duskText,
    marginBottom: spacing.xxs,
  },
  resultCount: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmLinen,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget.input,
  },
  searchContainerFocused: {
    borderColor: colors.navy.default,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.duskText,
    paddingVertical: spacing.sm,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmLinen,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    minHeight: touchTarget.input,
    gap: 4,
  },
  filtersButtonText: {
    ...typography.buttonSmall,
    color: colors.navy.default,
    fontFamily: fontFamily.medium,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.navy.default,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  filterBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: colors.white,
  },
  errorBanner: {
    backgroundColor: colors.status.error.bg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.status.error.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.md,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 17,
    color: colors.duskText,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  clearButton: {
    backgroundColor: colors.navy.default,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    minHeight: touchTarget.button,
    justifyContent: 'center',
  },
  clearButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
