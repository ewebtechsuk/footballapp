export interface CreditPackage {
  id: string;
  name: string;
  description: string;
  credits: number;
  priceLabel: string;
  bestValue?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'credits_starter',
    name: 'Starter pack',
    description: 'Perfect for unlocking a single match or tournament entry.',
    credits: 35,
    priceLabel: '$1.49',
  },
  {
    id: 'credits_pro',
    name: 'Match day bundle',
    description: 'Extra credits to keep your team active throughout the week.',
    credits: 85,
    priceLabel: '$2.99',
    bestValue: true,
  },
  {
    id: 'credits_ultimate',
    name: 'Season pass',
    description: 'Stock up on credits for consistent tournament contenders.',
    credits: 190,
    priceLabel: '$5.99',
  },
];
