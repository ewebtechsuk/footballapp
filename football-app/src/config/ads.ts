import { BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const GOOGLE_TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const GOOGLE_TEST_BANNER_ID = TestIds.BANNER;
const GOOGLE_TEST_REWARDED_ID = TestIds.REWARDED;

const {
  GOOGLE_MOBILE_ADS_APP_ID,
  HOME_BANNER_AD_UNIT_ID,
  TEAM_BANNER_AD_UNIT_ID,
  TOURNAMENT_REWARDED_AD_UNIT_ID,
} = process.env as Record<string, string | undefined>;

export const googleMobileAdsAppId = GOOGLE_MOBILE_ADS_APP_ID ?? GOOGLE_TEST_APP_ID;
export const homeBannerAdUnitId = HOME_BANNER_AD_UNIT_ID ?? GOOGLE_TEST_BANNER_ID;
export const teamBannerAdUnitId = TEAM_BANNER_AD_UNIT_ID ?? GOOGLE_TEST_BANNER_ID;
export const tournamentRewardedAdUnitId =
  TOURNAMENT_REWARDED_AD_UNIT_ID ?? GOOGLE_TEST_REWARDED_ID;

export const defaultBannerSize = BannerAdSize.ANCHORED_ADAPTIVE_BANNER;
