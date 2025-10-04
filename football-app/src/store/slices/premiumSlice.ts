import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Product } from 'react-native-iap';

export const PREMIUM_ENTITLEMENT_STORAGE_KEY = 'premium-entitlement';

interface PremiumState {
  products: Product[];
  loading: boolean;
  isPremium: boolean;
  error: string | null;
  lastTransactionId: string | null;
}

const initialState: PremiumState = {
  products: [],
  loading: false,
  isPremium: false,
  error: null,
  lastTransactionId: null,
};

const premiumSlice = createSlice({
  name: 'premium',
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setPremium: (state, action: PayloadAction<boolean>) => {
      state.isPremium = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLastTransactionId: (state, action: PayloadAction<string | null>) => {
      state.lastTransactionId = action.payload;
    },
    resetPremiumState: () => initialState,
  },
});

export const {
  setProducts,
  setLoading,
  setPremium,
  setError,
  setLastTransactionId,
  resetPremiumState,
} = premiumSlice.actions;

export default premiumSlice.reducer;
