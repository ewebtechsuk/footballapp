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

const resolvedAppId = GOOGLE_MOBILE_ADS_APP_ID ?? GOOGLE_TEST_APP_ID;
const shouldUseTestAds = __DEV__ || resolvedAppId === GOOGLE_TEST_APP_ID;

const resolveAdUnitId = (maybeEnvValue: string | undefined, fallback: string) =>
  shouldUseTestAds ? fallback : maybeEnvValue ?? fallback;

export const googleMobileAdsAppId = resolvedAppId;
export const homeBannerAdUnitId = resolveAdUnitId(HOME_BANNER_AD_UNIT_ID, GOOGLE_TEST_BANNER_ID);
export const teamBannerAdUnitId = resolveAdUnitId(TEAM_BANNER_AD_UNIT_ID, GOOGLE_TEST_BANNER_ID);
export const tournamentRewardedAdUnitId = resolveAdUnitId(
  TOURNAMENT_REWARDED_AD_UNIT_ID,
  GOOGLE_TEST_REWARDED_ID,
);

export const defaultBannerSize = BannerAdSize.ANCHORED_ADAPTIVE_BANNER;
