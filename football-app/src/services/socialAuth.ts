export type SocialProvider = 'google' | 'facebook';

export interface SocialProviderProfile {
  provider: SocialProvider;
  fullName: string;
  email: string;
  marketingOptIn?: boolean;
}

const PROVIDER_PROFILES: Record<SocialProvider, SocialProviderProfile> = {
  google: {
    provider: 'google',
    fullName: 'Jordan Matthews',
    email: 'jordan.matthews@gmail.com',
    marketingOptIn: true,
  },
  facebook: {
    provider: 'facebook',
    fullName: 'Imani Clarke',
    email: 'imani.clarke@facebookmail.com',
    marketingOptIn: false,
  },
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchMockSocialProfile = async (
  provider: SocialProvider,
): Promise<SocialProviderProfile> => {
  await delay(600);
  return { ...PROVIDER_PROFILES[provider] };
};
