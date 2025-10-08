import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthenticatedTabParamList = {
  Dashboard: undefined;
  ManageTeams: undefined;
  CreateMatch: undefined;
  Tournaments: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: NavigatorScreenParams<AuthenticatedTabParamList>;
  CreateTeam: undefined;
  ManageTeam: { teamId: string };
  AdminDashboard: undefined;
};
