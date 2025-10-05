import React, { useEffect, useImperativeHandle, useMemo } from 'react';

type MobileAdsRequestConfiguration = {
  maxAdContentRating?: string;
};

type MobileAdsController = {
  initialize: () => Promise<void>;
  setRequestConfiguration: (config: MobileAdsRequestConfiguration) => Promise<void>;
};

const MaxAdContentRating = {
  G: 'G',
  PG: 'PG',
  T: 'T',
  MA: 'MA',
};

const TestIds = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  APP_OPEN: 'ca-app-pub-3940256099942544/3419835294',
};

const BannerAdSize = {
  BANNER: 'BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  FULL_BANNER: 'FULL_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  SMART_BANNER: 'SMART_BANNER',
};

const AdEventType = {
  LOADED: 'loaded',
  CLOSED: 'closed',
  OPENED: 'opened',
  EARNED_REWARD: 'earned_reward',
};

const noopAsync = async () => {};
const noop = () => {};

function mobileAds(): MobileAdsController {
  return {
    initialize: noopAsync,
    setRequestConfiguration: noopAsync,
  };
}

const BannerAd = React.forwardRef<any, any>(function BannerAd(_props, ref) {
  useImperativeHandle(ref, () => ({}));

  useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(
        'react-native-google-mobile-ads stub: banner ads are not available in this offline build.'
      );
    }
  }, []);

  return null;
});

function useRewardedAd(_adUnitId: string, _options?: any) {
  const state = useMemo(
    () => ({
      isLoaded: false,
      isClosed: false,
      load: noop,
      show: noop,
      reward: null,
      error: null,
    }),
    []
  );

  return state;
}

class RewardedAd {
  static createForAdRequest(_adUnitId: string, _options?: any) {
    return new RewardedAd();
  }

  load() {}
  show() {}
  addAdEventListener() {
    return noop;
  }
}

export default mobileAds;
export { BannerAd, BannerAdSize, TestIds, MaxAdContentRating, useRewardedAd, AdEventType, RewardedAd };
