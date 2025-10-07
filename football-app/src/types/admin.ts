export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface PaymentRecord {
  id: string;
  userId: string | null;
  userEmail: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  recordedAt: string;
  notes?: string;
}

export type MarketingAudience = 'all' | 'premium' | 'free';

export type CampaignStatus = 'draft' | 'scheduled' | 'sent';

export interface MarketingCampaign {
  id: string;
  title: string;
  audience: MarketingAudience;
  status: CampaignStatus;
  createdAt: string;
  scheduledFor?: string;
  notes?: string;
  sentAt?: string;
}

export interface AdminSnapshot {
  payments: PaymentRecord[];
  marketingCampaigns: MarketingCampaign[];
}
