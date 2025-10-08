export type UserRole = 'user' | 'admin';

export type UserStatus = 'active' | 'suspended';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  marketingOptIn: boolean;
  status: UserStatus;
  createdAt: string;
  biometricEnabled: boolean;
}

export interface StoredUserAccount extends UserAccount {
  password: string;
}
