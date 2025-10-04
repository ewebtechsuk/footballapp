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
  },
});

export const { creditWallet } = walletSlice.actions;

export default walletSlice.reducer;
