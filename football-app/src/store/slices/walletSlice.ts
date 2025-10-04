import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type TransactionType = 'credit' | 'debit';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description?: string;
  timestamp: string;
  balanceAfter: number;
}

export interface WalletState {
  balance: number;
  transactions: WalletTransaction[];
}

const initialState: WalletState = {
  balance: 0,
  transactions: [],
};

interface WalletAdjustmentPayload {
  amount: number;
  description?: string;
  timestamp?: string;
}

const createTransaction = (
  type: TransactionType,
  amount: number,
  balanceAfter: number,
  description?: string,
  timestamp?: string,
): WalletTransaction => ({
  id: `${type}-${Date.now()}`,
  type,
  amount,
  description,
  timestamp: timestamp ?? new Date().toISOString(),
  balanceAfter,
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    credit: (state, action: PayloadAction<WalletAdjustmentPayload>) => {
      const { amount, description, timestamp } = action.payload;
      state.balance += amount;
      state.transactions = [
        createTransaction('credit', amount, state.balance, description, timestamp),
        ...state.transactions,
      ];
    },
    debit: (state, action: PayloadAction<WalletAdjustmentPayload>) => {
      const { amount, description, timestamp } = action.payload;

      if (amount > state.balance) {
        return;
      }

      state.balance -= amount;
      state.transactions = [
        createTransaction('debit', amount, state.balance, description, timestamp),
        ...state.transactions,
      ];
    },
    resetWallet: () => initialState,
  },
});

export const { credit, debit, resetWallet } = walletSlice.actions;

export default walletSlice.reducer;
