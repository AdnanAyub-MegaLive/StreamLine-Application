import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { useAppStore } from '../store';
import { REGION_FILTERS } from '../data/regions';
import { scaleFont, scaleModerate } from '../utils';

// Shared by both the Live and Party tabs (see HomeScreen) — backed by the
// same store slice (useAppStore's regionFilter/setRegionFilter), so picking
// a region/country on one tab is still selected when switching to the
// other, instead of each tab keeping its own separate selection.
//
// Real filtering of room results by country isn't wired up yet — the
// discover API (see fetchDiscoverRooms) doesn't return a country field on
// rooms today. This is the selection UI, ready for that the moment it does.
const CHIP_TAP_MAX_MOVEMENT = 10;
const CHIP_TAP_MAX_DURATION = 300;

function FilterChip({ option, active, theme, onSelect }) {
  const touchStartRef = React.useRef(null);
  const handleTouchStart = event => {
    touchStartRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
      time: Date.now()
    };
  };
  const handleTouchEnd = event => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) {
      return;
    }
    const dx = Math.abs(event.nativeEvent.pageX - start.x);
    const dy = Math.abs(event.nativeEvent.pageY - start.y);
    const duration = Date.now() - start.time;
    if (dx < CHIP_TAP_MAX_MOVEMENT && dy < CHIP_TAP_MAX_MOVEMENT && duration < CHIP_TAP_MAX_DURATION) {
      onSelect(option.id);
    }
  };
  return <View
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartRef.current = null;
      }}
      style={[styles.filterChip, {
        backgroundColor: active ? theme.colors.teal700 : theme.surfaces.card,
        borderColor: active ? theme.colors.teal700 : theme.colors.cardBorder
      }]}
    >
      <Text style={[styles.filterChipText, {
      color: active ? theme.cta.primary.text : theme.text.secondary
    }]}>{option.flags ? `${option.flags} ${option.label}` : option.label}</Text>
    </View>;
}

export function RegionFilterRow({ onFilterRowScrolling }) {
  const theme = useTheme();
  const regionFilter = useAppStore(state => state.regionFilter);
  const setRegionFilter = useAppStore(state => state.setRegionFilter);
  const activeRegion = regionFilter?.region ?? 'all';
  const activeCountry = regionFilter?.country ?? 'all';

  const pausedRef = React.useRef(false);
  const handleRowTouchStart = () => {
    if (!pausedRef.current) {
      pausedRef.current = true;
      onFilterRowScrolling?.(true);
    }
  };
  const handleRowTouchEnd = () => {
    if (pausedRef.current) {
      pausedRef.current = false;
      onFilterRowScrolling?.(false);
    }
  };

  // Switching regions always resets the country sub-filter back to "All" —
  // a country selected under the previous region wouldn't even be in the
  // new region's list.
  const handleSelectRegion = regionId => setRegionFilter(regionId, 'all');
  const handleSelectCountry = countryId => setRegionFilter(activeRegion, countryId);

  // Selecting a region reveals its countries as a second row right below —
  // "All" plus whatever's in that region's `countries` list. Regions with
  // none (Russia is its own single-country region, etc.) just don't show a
  // second row at all.
  const activeRegionData = REGION_FILTERS.find(region => region.id === activeRegion);
  const countryOptions = activeRegionData?.countries ?? [];

  return <View>
      <View onTouchStart={handleRowTouchStart} onTouchEnd={handleRowTouchEnd} onTouchCancel={handleRowTouchEnd}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {REGION_FILTERS.map(region => <FilterChip key={region.id} option={region} active={region.id === activeRegion} theme={theme} onSelect={handleSelectRegion} />)}
        </ScrollView>
      </View>
      {countryOptions.length > 0 ? (
        <View onTouchStart={handleRowTouchStart} onTouchEnd={handleRowTouchEnd} onTouchCancel={handleRowTouchEnd}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterRow, styles.countryFilterRow]}>
            <FilterChip option={{ id: 'all', label: 'All', flags: '' }} active={activeCountry === 'all'} theme={theme} onSelect={handleSelectCountry} />
            {countryOptions.map(country => <FilterChip key={country.id} option={{ id: country.id, label: country.label, flags: country.flag }} active={country.id === activeCountry} theme={theme} onSelect={handleSelectCountry} />)}
          </ScrollView>
        </View>
      ) : null}
    </View>;
}

const styles = StyleSheet.create({
  filterRow: {
    alignItems: 'center',
    gap: scaleModerate(8),
    paddingHorizontal: scaleModerate(2),
    paddingBottom: scaleModerate(12)
  },
  countryFilterRow: {
    marginTop: -scaleModerate(4)
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(7)
  },
  filterChipText: {
    fontSize: scaleFont(12),
    fontWeight: '700'
  }
});

export default RegionFilterRow;
