import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ProfileAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ProfileSocialLinks {
  twitter: string;
  instagram: string;
  facebook: string;
  twitch: string;
  youtube: string;
  website: string;
}

export type ProfilePaymentMethod = 'card' | 'cash' | 'paypal' | 'bank_transfer';

export const PROFILE_PAYMENT_METHODS: readonly ProfilePaymentMethod[] = [
  'card',
  'cash',
  'paypal',
  'bank_transfer',
];

export interface ProfileState {
  fullName: string;
  displayName: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  bio: string;
  address: ProfileAddress;
  social: ProfileSocialLinks;
  paymentMethods: ProfilePaymentMethod[];
}

export type ProfileUpdate = Partial<
  Omit<ProfileState, 'address' | 'social' | 'paymentMethods'>
> & {
  address?: Partial<ProfileAddress>;
  social?: Partial<ProfileSocialLinks>;
  paymentMethods?: ProfilePaymentMethod[];
};

const initialState: ProfileState = {
  fullName: '',
  displayName: '',
  email: '',
  mobileNumber: '',
  dateOfBirth: '',
  bio: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  },
  social: {
    twitter: '',
    instagram: '',
    facebook: '',
    twitch: '',
    youtube: '',
    website: '',
  },
  paymentMethods: [],
};

const mergeProfileState = (current: ProfileState, updates: ProfileUpdate): ProfileState => ({
  ...current,
  ...updates,
  address: {
    ...current.address,
    ...(updates.address ?? {}),
  },
  social: {
    ...current.social,
    ...(updates.social ?? {}),
  },
  paymentMethods: updates.paymentMethods
    ? [...updates.paymentMethods]
    : [...current.paymentMethods],
});

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    hydrateProfile: (_state, action: PayloadAction<ProfileState>) =>
      mergeProfileState(initialState, action.payload),
    updateProfile: (state, action: PayloadAction<ProfileUpdate>) =>
      mergeProfileState(state, action.payload),
    resetProfile: () => initialState,
  },
});

export const { hydrateProfile, updateProfile, resetProfile } = profileSlice.actions;
export { initialState as initialProfileState };

export default profileSlice.reducer;
