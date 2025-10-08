import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WalletState {
  credits: number;
  cosmeticTokens: number;
}

const initialState: WalletState = {
  credits: 0,
  cosmeticTokens: 0,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    creditWallet: (state: WalletState, action: PayloadAction<number>) => {
      state.credits += action.payload;
    },
    debitWallet: (state: WalletState, action: PayloadAction<number>) => {
      const amount = Math.max(0, action.payload);
      if (amount === 0) {
        return;
      }

      state.credits = Math.max(0, state.credits - amount);
    },
    creditCosmeticTokens: (state: WalletState, action: PayloadAction<number>) => {
      if (action.payload <= 0) {
        return;
      }

      state.cosmeticTokens += action.payload;
    },
    redeemCosmeticTokens: (state: WalletState, action: PayloadAction<number>) => {
      const amount = Math.max(0, action.payload);
      if (amount === 0) {
        return;
      }

      state.cosmeticTokens = Math.max(0, state.cosmeticTokens - amount);
    },
  },
});

export const { creditWallet, debitWallet, creditCosmeticTokens, redeemCosmeticTokens } = walletSlice.actions;

export default walletSlice.reducer;
