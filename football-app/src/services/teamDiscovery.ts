export type TeamDiscoveryScope = 'local' | 'national';

export interface DiscoveredTeam {
  id: string;
  name: string;
  city: string;
  region: string;
  distanceKm?: number;
  ranking: string;
  preferredMatchDay: string;
  recentForm: string;
}

const localTeams: DiscoveredTeam[] = [
  {
    id: 'local-1',
    name: 'Eastside United',
    city: 'Newcastle',
    region: 'Tyne and Wear',
    distanceKm: 4,
    ranking: 'County League Division 1',
    preferredMatchDay: 'Saturday afternoons',
    recentForm: 'W • W • D • L • W',
  },
  {
    id: 'local-2',
    name: 'Riverside Rovers',
    city: 'Gateshead',
    region: 'Tyne and Wear',
    distanceKm: 9,
    ranking: 'County League Division 2',
    preferredMatchDay: 'Sunday mornings',
    recentForm: 'D • W • W • W • L',
  },
  {
    id: 'local-3',
    name: 'Northern Spartans',
    city: 'Sunderland',
    region: 'Tyne and Wear',
    distanceKm: 17,
    ranking: 'County Cup contenders',
    preferredMatchDay: 'Friday evenings',
    recentForm: 'W • D • W • W • D',
  },
];

const nationalTeams: DiscoveredTeam[] = [
  {
    id: 'national-1',
    name: 'Capital City FC',
    city: 'London',
    region: 'Greater London',
    ranking: 'National Amateur Championship',
    preferredMatchDay: 'Saturday evenings',
    recentForm: 'W • W • W • D • W',
  },
  {
    id: 'national-2',
    name: 'Midlands Athletic',
    city: 'Birmingham',
    region: 'West Midlands',
    ranking: 'National Premier Amateurs',
    preferredMatchDay: 'Sunday afternoons',
    recentForm: 'L • W • W • D • W',
  },
  {
    id: 'national-3',
    name: 'Highland Wanderers',
    city: 'Inverness',
    region: 'Scottish Highlands',
    ranking: 'UK Cup finalists',
    preferredMatchDay: 'Saturday mornings',
    recentForm: 'D • D • W • W • W',
  },
  {
    id: 'national-4',
    name: 'Harbour City Mariners',
    city: 'Cardiff',
    region: 'South Wales',
    ranking: 'National Amateur Championship',
    preferredMatchDay: 'Friday nights',
    recentForm: 'W • L • W • W • D',
  },
];

const normalise = (value: string) => value.trim().toLowerCase();

export const searchTeams = async (
  scope: TeamDiscoveryScope,
  query: string,
): Promise<DiscoveredTeam[]> => {
  const dataset = scope === 'local' ? localTeams : nationalTeams;
  const normalisedQuery = normalise(query);

  return new Promise((resolve) => {
    setTimeout(() => {
      if (!normalisedQuery) {
        resolve(dataset);
        return;
      }

      resolve(
        dataset.filter((team) => {
          const terms = [team.name, team.city, team.region, team.ranking];
          return terms.some((term) => normalise(term).includes(normalisedQuery));
        }),
      );
    }, 250);
  });
};
