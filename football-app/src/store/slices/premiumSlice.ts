import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PremiumEntitlementState {
  entitled: boolean;
  entitlementProductId: string | null;
  lastPurchaseDate: string | null;
}

const initialState: PremiumEntitlementState = {
  entitled: false,
  entitlementProductId: null,
  lastPurchaseDate: null,
};

const premiumSlice = createSlice({
  name: 'premium',
  initialState,
  reducers: {
    grantPremium: (
      state,
      action: PayloadAction<{ productId: string; purchaseDate?: string | null }>,
    ) => {
      state.entitled = true;
      state.entitlementProductId = action.payload.productId;
      state.lastPurchaseDate = action.payload.purchaseDate ?? null;
    },
    revokePremium: (state) => {
      state.entitled = false;
      state.entitlementProductId = null;
      state.lastPurchaseDate = null;
    },
    hydratePremium: (state, action: PayloadAction<PremiumEntitlementState>) => {
      state.entitled = action.payload.entitled;
      state.entitlementProductId = action.payload.entitlementProductId;
      state.lastPurchaseDate = action.payload.lastPurchaseDate;
    },
  },
});

export const { grantPremium, revokePremium, hydratePremium } = premiumSlice.actions;

export default premiumSlice.reducer;
