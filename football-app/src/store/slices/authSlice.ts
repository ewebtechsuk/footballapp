import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { RootState } from '..';
import type { StoredUserAccount, UserAccount, UserStatus } from '../../types/user';
import { loadStoredUsers, persistCurrentUserId, persistUsers, loadStoredCurrentUserId } from '../../services/userStorage';

interface AuthState {
  users: StoredUserAccount[];
  currentUserId: string | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

const createId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const seedUsers = (): StoredUserAccount[] => [
  {
    id: 'admin-owner',
    fullName: 'Club Owner',
    email: 'owner@clubhouse.app',
    password: 'admin123',
    role: 'admin',
    marketingOptIn: false,
    status: 'active',
    createdAt: new Date('2023-01-15T09:00:00Z').toISOString(),
    biometricEnabled: false,
  },
  {
    id: 'fan-jane',
    fullName: 'Jane Fletcher',
    email: 'jane@supporters.club',
    password: 'football',
    role: 'user',
    marketingOptIn: true,
    status: 'active',
    createdAt: new Date('2023-02-02T13:30:00Z').toISOString(),
    biometricEnabled: false,
  },
];

const sanitizeUser = (user: StoredUserAccount): UserAccount => {
  const { password, ...rest } = user;
  return rest;
};

const initialState: AuthState = {
  users: [],
  currentUserId: null,
  initialized: false,
  loading: false,
  error: null,
};

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const storedUsers = await loadStoredUsers();
      let users = (storedUsers ?? []).map((user) => ({
        ...user,
        biometricEnabled: user.biometricEnabled ?? false,
      }));

      if (!users.length) {
        users = seedUsers();
        await persistUsers(users);
      }

      const storedCurrentUserId = await loadStoredCurrentUserId();
      const currentUserId = users.some((user) => user.id === storedCurrentUserId)
        ? storedCurrentUserId
        : null;

      if (!currentUserId && storedCurrentUserId) {
        await persistCurrentUserId(null);
      }

      return { users, currentUserId };
    } catch (error) {
      console.error('Failed to initialize auth state', error);
      return rejectWithValue('Unable to initialise authentication state');
    }
  },
);

export const registerUser = createAsyncThunk<
  StoredUserAccount,
  { fullName: string; email: string; password: string; marketingOptIn: boolean },
  { state: RootState; rejectValue: string }
>('auth/registerUser', async (payload, { getState, rejectWithValue }) => {
  const { fullName, email, password, marketingOptIn } = payload;
  const normalisedEmail = email.trim().toLowerCase();

  if (!normalisedEmail) {
    return rejectWithValue('Email is required');
  }

  const trimmedName = fullName.trim();
  if (!trimmedName) {
    return rejectWithValue('Full name is required');
  }

  if (!password.trim()) {
    return rejectWithValue('Password is required');
  }

  const { auth } = getState();

  if (
    auth.users.some((user) => user.email.trim().toLowerCase() === normalisedEmail)
  ) {
    return rejectWithValue('An account with this email already exists');
  }

  const newUser: StoredUserAccount = {
    id: createId('user'),
    fullName: trimmedName,
    email: normalisedEmail,
    password: password.trim(),
    role: 'user',
    marketingOptIn,
    status: 'active',
    createdAt: new Date().toISOString(),
    biometricEnabled: false,
  };

  const updatedUsers = [...auth.users, newUser];
  await persistUsers(updatedUsers);
  await persistCurrentUserId(newUser.id);

  return newUser;
});

export const loginUser = createAsyncThunk<
  StoredUserAccount,
  { email: string; password: string },
  { state: RootState; rejectValue: string }
>('auth/loginUser', async ({ email, password }, { getState, rejectWithValue }) => {
  const normalisedEmail = email.trim().toLowerCase();
  const providedPassword = password.trim();

  if (!normalisedEmail || !providedPassword) {
    return rejectWithValue('Email and password are required');
  }

  const { auth } = getState();
  const matchedUser = auth.users.find(
    (user) => user.email.trim().toLowerCase() === normalisedEmail,
  );

  if (!matchedUser) {
    return rejectWithValue('No account found with that email');
  }

  if (matchedUser.password !== providedPassword) {
    return rejectWithValue('Incorrect password');
  }

  if (matchedUser.status === 'suspended') {
    return rejectWithValue('This account has been suspended');
  }

  await persistCurrentUserId(matchedUser.id);
  return matchedUser;
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  await persistCurrentUserId(null);
});

export const toggleUserStatus = createAsyncThunk<
  { userId: string; status: UserStatus },
  { userId: string },
  { state: RootState; rejectValue: string }
>('auth/toggleUserStatus', async ({ userId }, { getState, rejectWithValue }) => {
  const { auth } = getState();
  const targetUser = auth.users.find((user) => user.id === userId);

  if (!targetUser) {
    return rejectWithValue('User not found');
  }

  if (targetUser.role === 'admin') {
    return rejectWithValue('Admin accounts cannot be suspended');
  }

  const nextStatus: UserStatus = targetUser.status === 'active' ? 'suspended' : 'active';
  const updatedUsers = auth.users.map((user) =>
    user.id === userId
      ? {
          ...user,
          status: nextStatus,
        }
      : user,
  );

  await persistUsers(updatedUsers);

  if (auth.currentUserId === userId && nextStatus === 'suspended') {
    await persistCurrentUserId(null);
  }

  return { userId, status: nextStatus };
});

export const updateMarketingPreference = createAsyncThunk<
  { userId: string; marketingOptIn: boolean },
  { userId: string; marketingOptIn: boolean },
  { state: RootState; rejectValue: string }
>(
  'auth/updateMarketingPreference',
  async ({ userId, marketingOptIn }, { getState, rejectWithValue }) => {
    const { auth } = getState();
    const targetUser = auth.users.find((user) => user.id === userId);

    if (!targetUser) {
      return rejectWithValue('User not found');
    }

    const updatedUsers = auth.users.map((user) =>
      user.id === userId
        ? {
            ...user,
            marketingOptIn,
          }
        : user,
    );

    await persistUsers(updatedUsers);
    return { userId, marketingOptIn };
  },
);

export const updateBiometricPreference = createAsyncThunk<
  { userId: string; biometricEnabled: boolean },
  { userId: string; biometricEnabled: boolean },
  { state: RootState; rejectValue: string }
>(
  'auth/updateBiometricPreference',
  async ({ userId, biometricEnabled }, { getState, rejectWithValue }) => {
    const { auth } = getState();
    const targetUser = auth.users.find((user) => user.id === userId);

    if (!targetUser) {
      return rejectWithValue('User not found');
    }

    const updatedUsers = auth.users.map((user) =>
      user.id === userId
        ? {
            ...user,
            biometricEnabled,
          }
        : user,
    );

    await persistUsers(updatedUsers);

    return { userId, biometricEnabled };
  },
);

export const loginWithBiometrics = createAsyncThunk<
  StoredUserAccount,
  { userId: string },
  { state: RootState; rejectValue: string }
>('auth/loginWithBiometrics', async ({ userId }, { getState, rejectWithValue }) => {
  const { auth } = getState();
  const targetUser = auth.users.find((user) => user.id === userId);

  if (!targetUser) {
    return rejectWithValue('User not found');
  }

  if (!targetUser.biometricEnabled) {
    return rejectWithValue('Biometric login is not enabled for this account');
  }

  if (targetUser.status === 'suspended') {
    return rejectWithValue('This account has been suspended');
  }

  await persistCurrentUserId(targetUser.id);
  return targetUser;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.users = action.payload.users;
        state.currentUserId = action.payload.currentUserId;
        state.initialized = true;
        state.loading = false;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.error = (action.payload as string) ?? action.error.message ?? null;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
        state.currentUserId = action.payload.id;
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? action.error.message ?? null;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const existingIndex = state.users.findIndex((user) => user.id === action.payload.id);
        if (existingIndex !== -1) {
          state.users[existingIndex] = action.payload;
        }
        state.currentUserId = action.payload.id;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? action.error.message ?? null;
      })
      .addCase(loginWithBiometrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithBiometrics.fulfilled, (state, action) => {
        const existingIndex = state.users.findIndex((user) => user.id === action.payload.id);
        if (existingIndex !== -1) {
          state.users[existingIndex] = action.payload;
        }
        state.currentUserId = action.payload.id;
        state.loading = false;
      })
      .addCase(loginWithBiometrics.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? action.error.message ?? null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.currentUserId = null;
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        const target = state.users.find((user) => user.id === action.payload.userId);
        if (target) {
          target.status = action.payload.status;
        }
        if (state.currentUserId === action.payload.userId && action.payload.status === 'suspended') {
          state.currentUserId = null;
        }
      })
      .addCase(toggleUserStatus.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? null;
      })
      .addCase(updateMarketingPreference.fulfilled, (state, action) => {
        const target = state.users.find((user) => user.id === action.payload.userId);
        if (target) {
          target.marketingOptIn = action.payload.marketingOptIn;
        }
      })
      .addCase(updateMarketingPreference.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? null;
      })
      .addCase(updateBiometricPreference.fulfilled, (state, action) => {
        const target = state.users.find((user) => user.id === action.payload.userId);
        if (target) {
          target.biometricEnabled = action.payload.biometricEnabled;
        }
      })
      .addCase(updateBiometricPreference.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? null;
      });
  },
});

export const authReducer = authSlice.reducer;

export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;

export const selectUsers = (state: RootState): UserAccount[] =>
  state.auth.users.map(sanitizeUser);

export const selectCurrentUser = (state: RootState): UserAccount | null => {
  if (!state.auth.currentUserId) {
    return null;
  }

  const match = state.auth.users.find((user) => user.id === state.auth.currentUserId);
  return match ? sanitizeUser(match) : null;
};

export const selectBiometricEnabledUsers = (state: RootState): UserAccount[] =>
  state.auth.users.filter((user) => user.biometricEnabled).map(sanitizeUser);

