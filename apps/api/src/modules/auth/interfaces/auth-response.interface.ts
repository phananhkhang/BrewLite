export interface SafeUser {
  id: string;
  username: string;
  role: string;
  loyaltyBalance: number;
  isActive: boolean;
  createdAt: Date;
}

export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}
