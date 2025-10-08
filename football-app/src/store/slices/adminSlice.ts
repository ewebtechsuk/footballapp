import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { RootState } from '..';
import type {
  AdminSnapshot,
  CampaignStatus,
  MarketingCampaign,
  MarketingAudience,
  PaymentRecord,
  PaymentStatus,
} from '../../types/admin';
import { loadAdminSnapshot, persistAdminSnapshot } from '../../services/adminStorage';

interface AdminState extends AdminSnapshot {
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

const createId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const defaultSnapshot = (): AdminSnapshot => ({
  payments: [
    {
      id: 'payment-1',
      userId: 'fan-jane',
      userEmail: 'jane@supporters.club',
      amount: 29.99,
      currency: 'USD',
      status: 'completed',
      recordedAt: new Date('2024-03-12T12:30:00Z').toISOString(),
      notes: 'Tournament entry fee',
    },
    {
      id: 'payment-2',
      userId: 'admin-owner',
      userEmail: 'owner@clubhouse.app',
      amount: 199,
      currency: 'USD',
      status: 'pending',
      recordedAt: new Date('2024-04-05T09:15:00Z').toISOString(),
      notes: 'Sponsorship package invoice',
    },
  ],
  marketingCampaigns: [
    {
      id: 'campaign-1',
      title: 'Spring Tournament Kick-off',
      audience: 'all',
      status: 'sent',
      createdAt: new Date('2024-02-28T08:00:00Z').toISOString(),
      sentAt: new Date('2024-03-01T08:30:00Z').toISOString(),
      notes: 'Email + push notification campaign',
    },
    {
      id: 'campaign-2',
      title: 'Premium Coaching Insights',
      audience: 'premium',
      status: 'scheduled',
      createdAt: new Date('2024-05-10T11:00:00Z').toISOString(),
      scheduledFor: '2024-05-20',
      notes: 'Exclusive content drip for premium users',
    },
  ],
});

const initialState: AdminState = {
  ...defaultSnapshot(),
  initialized: false,
  loading: false,
  error: null,
};

const persistSnapshot = async (snapshot: AdminSnapshot) => {
  await persistAdminSnapshot(snapshot);
};

export const initializeAdmin = createAsyncThunk(
  'admin/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const stored = await loadAdminSnapshot();
      if (stored) {
        return stored;
      }

      const seeded = defaultSnapshot();
      await persistSnapshot(seeded);
      return seeded;
    } catch (error) {
      console.error('Failed to initialise admin snapshot', error);
      return rejectWithValue('Unable to load admin centre data');
    }
  },
);

export const updatePaymentStatus = createAsyncThunk<
  PaymentRecord[],
  { paymentId: string; status: PaymentStatus },
  { state: RootState; rejectValue: string }
>('admin/updatePaymentStatus', async ({ paymentId, status }, { getState, rejectWithValue }) => {
  const { admin } = getState();
  const target = admin.payments.find((payment) => payment.id === paymentId);

  if (!target) {
    return rejectWithValue('Payment not found');
  }

  const updatedPayments = admin.payments.map((payment) =>
    payment.id === paymentId
      ? {
          ...payment,
          status,
        }
      : payment,
  );

  await persistSnapshot({ payments: updatedPayments, marketingCampaigns: admin.marketingCampaigns });

  return updatedPayments;
});

export const recordManualPayment = createAsyncThunk<
  PaymentRecord[],
  { userEmail: string; amount: number; currency: string; status?: PaymentStatus; notes?: string },
  { state: RootState; rejectValue: string }
>(
  'admin/recordManualPayment',
  async ({ userEmail, amount, currency, status = 'completed', notes }, { getState, rejectWithValue }) => {
    if (!userEmail.trim()) {
      return rejectWithValue('Email is required to record a payment');
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return rejectWithValue('Enter a valid payment amount');
    }

    const normalisedEmail = userEmail.trim().toLowerCase();
    const { auth, admin } = getState();
    const matchedUser = auth.users.find(
      (user) => user.email.trim().toLowerCase() === normalisedEmail,
    );

    const newPayment: PaymentRecord = {
      id: createId('payment'),
      userId: matchedUser ? matchedUser.id : null,
      userEmail: userEmail.trim(),
      amount,
      currency: currency.trim().toUpperCase() || 'USD',
      status,
      recordedAt: new Date().toISOString(),
      notes,
    };

    const updatedPayments = [newPayment, ...admin.payments];
    await persistSnapshot({ payments: updatedPayments, marketingCampaigns: admin.marketingCampaigns });

    return updatedPayments;
  },
);

export const addMarketingCampaign = createAsyncThunk<
  MarketingCampaign[],
  { title: string; audience: MarketingAudience; scheduledFor?: string; notes?: string },
  { state: RootState; rejectValue: string }
>('admin/addMarketingCampaign', async (payload, { getState, rejectWithValue }) => {
  const { title, audience, scheduledFor, notes } = payload;
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    return rejectWithValue('Campaign title is required');
  }

  const { admin } = getState();
  const nextStatus: CampaignStatus = scheduledFor?.trim() ? 'scheduled' : 'draft';

  const campaign: MarketingCampaign = {
    id: createId('campaign'),
    title: trimmedTitle,
    audience,
    status: nextStatus,
    createdAt: new Date().toISOString(),
    scheduledFor: scheduledFor?.trim() || undefined,
    notes: notes?.trim() || undefined,
  };

  const updatedCampaigns = [campaign, ...admin.marketingCampaigns];
  await persistSnapshot({ payments: admin.payments, marketingCampaigns: updatedCampaigns });

  return updatedCampaigns;
});

export const markCampaignAsSent = createAsyncThunk<
  MarketingCampaign[],
  { campaignId: string },
  { state: RootState; rejectValue: string }
>('admin/markCampaignAsSent', async ({ campaignId }, { getState, rejectWithValue }) => {
  const { admin } = getState();
  const target = admin.marketingCampaigns.find((campaign) => campaign.id === campaignId);

  if (!target) {
    return rejectWithValue('Campaign not found');
  }

  const updatedCampaigns = admin.marketingCampaigns.map((campaign) =>
    campaign.id === campaignId
      ? {
          ...campaign,
          status: 'sent',
          sentAt: new Date().toISOString(),
        }
      : campaign,
  );

  await persistSnapshot({ payments: admin.payments, marketingCampaigns: updatedCampaigns });

  return updatedCampaigns;
});

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAdmin.fulfilled, (state, action) => {
        state.payments = action.payload.payments;
        state.marketingCampaigns = action.payload.marketingCampaigns;
        state.initialized = true;
        state.loading = false;
      })
      .addCase(initializeAdmin.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.error = (action.payload as string) ?? action.error.message ?? null;
      })
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        state.payments = action.payload;
      })
      .addCase(updatePaymentStatus.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? null;
      })
      .addCase(recordManualPayment.fulfilled, (state, action) => {
        state.payments = action.payload;
      })
      .addCase(recordManualPayment.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? null;
      })
      .addCase(addMarketingCampaign.fulfilled, (state, action) => {
        state.marketingCampaigns = action.payload;
      })
      .addCase(addMarketingCampaign.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? null;
      })
      .addCase(markCampaignAsSent.fulfilled, (state, action) => {
        state.marketingCampaigns = action.payload;
      })
      .addCase(markCampaignAsSent.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? null;
      });
  },
});

export const adminReducer = adminSlice.reducer;

export const selectAdminLoading = (state: RootState) => state.admin.loading;
export const selectAdminError = (state: RootState) => state.admin.error;
export const selectAdminInitialized = (state: RootState) => state.admin.initialized;
export const selectPayments = (state: RootState) => state.admin.payments;
export const selectMarketingCampaigns = (state: RootState) => state.admin.marketingCampaigns;

