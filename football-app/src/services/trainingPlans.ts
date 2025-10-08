import type { ProfileState } from '../store/slices/profileSlice';

export interface TrainingPlanRecommendation {
  id: string;
  title: string;
  summary: string;
  focus: 'fitness' | 'technical' | 'tactical' | 'wellness';
  premiumOnly?: boolean;
  tips: string[];
}

const determineAge = (profile: ProfileState): number | null => {
  if (!profile.dateOfBirth) {
    return null;
  }

  const segments = profile.dateOfBirth.split('/');
  if (segments.length !== 3) {
    return null;
  }

  const [day, month, year] = segments.map((segment) => Number(segment));
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return null;
  }

  const birthDate = new Date(year, month - 1, day);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const inferClimateFocus = (country: string): string => {
  const lowerCaseCountry = country.trim().toLowerCase();

  if (['england', 'scotland', 'ireland', 'wales', 'united kingdom', 'uk'].includes(lowerCaseCountry)) {
    return 'Expect wet weather: prioritise grip work and quick transitions on slick surfaces.';
  }

  if (['spain', 'portugal', 'italy', 'greece'].includes(lowerCaseCountry)) {
    return 'Prepare for heat management with hydration windows every 20 minutes.';
  }

  if (lowerCaseCountry.length === 0) {
    return 'Use general-purpose training with adjustable indoor and outdoor variations.';
  }

  return 'Adapt conditioning to your local climate and pitch availability.';
};

export const generateTrainingPlans = (
  profile: ProfileState,
  isPremium: boolean,
): { unlocked: TrainingPlanRecommendation[]; locked: TrainingPlanRecommendation[] } => {
  const age = determineAge(profile);
  const climateNote = inferClimateFocus(profile.address.country);

  const basePlans: TrainingPlanRecommendation[] = [
    {
      id: 'plan-fitness',
      title: 'Matchday Conditioning Routine',
      summary: 'High-intensity interval plan to keep legs fresh for 90 minutes.',
      focus: 'fitness',
      tips: [
        'Complete 4x4 minute tempo runs with 90 second recovery jogs.',
        'Add resisted sprints to mimic pressing triggers late in games.',
        climateNote,
      ],
    },
    {
      id: 'plan-technical',
      title: 'Small-sided Technical Circuit',
      summary: 'Sharpen your first touch, passing lanes, and under-pressure decision making.',
      focus: 'technical',
      tips: [
        'Set up 4-station rondos emphasising one-touch play for 90 seconds per station.',
        'Progress to 5v3 overload games encouraging forward runs from midfield.',
      ],
    },
    {
      id: 'plan-wellness',
      title: 'Recovery & Wellness Toolkit',
      summary: 'Regain freshness between fixtures with mobility, nutrition, and sleep anchors.',
      focus: 'wellness',
      tips: [
        'Log 10 minutes of guided mobility targeting hips and hamstrings every evening.',
        'Prioritise slow-release carbs and 25g protein in the two hours post match.',
      ],
    },
  ];

  if (age && age >= 32) {
    basePlans.push({
      id: 'plan-longevity',
      title: 'Longevity Primer',
      summary: 'Support joint health and reduce soft-tissue injuries.',
      focus: 'wellness',
      tips: [
        'Include twice-weekly eccentric strength blocks for hamstrings and calves.',
        'Schedule an extra low-impact conditioning day (pool or bike).',
      ],
    });
  }

  const premiumPlans: TrainingPlanRecommendation[] = [
    {
      id: 'plan-analytics',
      title: 'Premium Analytics Breakdown',
      summary: 'Unlock GPS workload comparisons against teams in your ladder tier.',
      focus: 'tactical',
      premiumOnly: true,
      tips: [
        'Overlay sprint maps from last three fixtures and identify fatigue drop-offs.',
        'Use positional heatmaps to rebalance workload across the midfield trio.',
        'Automate trend reports to coaching staff after each matchday.',
      ],
    },
    {
      id: 'plan-nutrition',
      title: 'Personalised Nutrition Windows',
      summary: 'Timed fuelling guidance aligned to your kickoff slots.',
      focus: 'wellness',
      premiumOnly: true,
      tips: [
        'Consume 30g of carbohydrates 30 minutes prior to training on late kickoffs.',
        'Utilise tart cherry supplementation during congested fixture weeks.',
      ],
    },
  ];

  const unlocked = [...basePlans];
  const locked: TrainingPlanRecommendation[] = [];

  premiumPlans.forEach((plan) => {
    if (isPremium) {
      unlocked.push(plan);
    } else {
      locked.push(plan);
    }
  });

  return { unlocked, locked };
};
