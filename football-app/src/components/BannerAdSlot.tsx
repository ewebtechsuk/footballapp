import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BannerAdSlotProps {
  unitId: string;
  size?: string;
}

const BannerAdSlot: React.FC<BannerAdSlotProps> = ({ unitId, size = BannerAdSize.BANNER }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <BannerAd unitId={unitId} size={size} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
  },
});

export default BannerAdSlot;
