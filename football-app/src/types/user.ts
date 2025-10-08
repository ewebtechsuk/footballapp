export type UserRole = 'user' | 'admin';

export type UserStatus = 'active' | 'suspended';

export type AuthProvider = 'email' | 'google' | 'facebook' | 'mobile';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  marketingOptIn: boolean;
  status: UserStatus;
  createdAt: string;
  biometricEnabled: boolean;
  authProvider: AuthProvider;
  phoneNumber: string | null;
}

export interface StoredUserAccount extends UserAccount {
  password: string;
}
