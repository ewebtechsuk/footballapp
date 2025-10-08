import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WalletState {
  credits: number;
}

const initialState: WalletState = {
  credits: 0,
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
  },
});

export const { creditWallet, debitWallet } = walletSlice.actions;

export default walletSlice.reducer;
