import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  NavigationState,
  PartialState,
  useNavigation,
  useNavigationState,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/slices/authSlice';
import type {
  AuthenticatedTabParamList,
  RootStackParamList,
} from '../types/navigation';

export const NAVIGATION_HEIGHT = 72;

type NavKey = 'Home' | 'Team' | 'Tournaments' | 'Profile' | 'AdminDashboard';

type NavTarget =
  | { type: 'tab'; screen: keyof AuthenticatedTabParamList }
  | { type: 'stack'; route: Exclude<keyof RootStackParamList, 'MainTabs'> };

interface NavItem {
  key: NavKey;
  label: string;
  description: string;
  target: NavTarget;
}

const deriveActiveTabName = (
  state: NavigationState | PartialState<NavigationState>,
): keyof AuthenticatedTabParamList | undefined => {
  const route = state.routes[state.index ?? 0];

  if (!route) {
    return undefined;
  }

  const childState = (route as {
    state?: NavigationState | PartialState<NavigationState>;
  }).state;

  if (childState) {
    return deriveActiveTabName(childState);
  }

  return route.name as keyof AuthenticatedTabParamList;
};

const deriveActiveKeyFromState = (
  state: NavigationState | PartialState<NavigationState>,
): NavKey => {
  const route = state.routes[state.index ?? 0];

  if (!route) {
    return 'Home';
  }

  if (route.name === 'MainTabs') {
    const childState =
      (route as {
        state?: NavigationState | PartialState<NavigationState>;
      }).state;
    const activeTab = childState ? deriveActiveTabName(childState) : undefined;

    switch (activeTab) {
      case 'ManageTeams':
      case 'CreateMatch':
        return 'Team';
      case 'Tournaments':
        return 'Tournaments';
      case 'Profile':
        return 'Profile';
      case 'Dashboard':
      default:
        return 'Home';
    }
  }

  if (route.name === 'CreateTeam' || route.name === 'ManageTeam') {
    return 'Team';
  }

  if (route.name === 'AdminDashboard') {
    return 'AdminDashboard';
  }

  return 'Home';
};

const PersistentNavigation: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const rootState = useNavigationState((state) => state);
  const currentUser = useAppSelector(selectCurrentUser);

  const navItems = useMemo<NavItem[]>(() => {
    const baseItems: NavItem[] = [
      {
        key: 'Home',
        label: 'Home',
        description: 'Overview',
        target: { type: 'tab', screen: 'Dashboard' },
      },
      {
        key: 'Team',
        label: 'Teams',
        description: 'Manage squads',
        target: { type: 'tab', screen: 'ManageTeams' },
      },
      {
        key: 'Tournaments',
        label: 'Tournaments',
        description: 'Compete',
        target: { type: 'tab', screen: 'Tournaments' },
      },
      {
        key: 'Profile',
        label: 'Profile',
        description: 'Account',
        target: { type: 'tab', screen: 'Profile' },
      },
    ];

    if (currentUser?.role === 'admin') {
      baseItems.splice(3, 0, {
        key: 'AdminDashboard',
        label: 'Admin',
        description: 'Operations',
        target: { type: 'stack', route: 'AdminDashboard' },
      });
    }

    return baseItems;
  }, [currentUser?.role]);

  const activeKey = useMemo(() => deriveActiveKeyFromState(rootState), [rootState]);

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <TouchableOpacity
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              if (item.target.type === 'tab') {
                navigation.navigate('MainTabs', { screen: item.target.screen });
                return;
              }

              navigation.navigate(item.target.route);
            }}
            style={[styles.navButton, isActive && styles.navButtonActive]}
          >
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
            <Text style={[styles.navDescription, isActive && styles.navDescriptionActive]}>
              {item.description}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: NAVIGATION_HEIGHT,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  navButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  navButtonActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  navLabelActive: {
    color: '#ffffff',
  },
  navDescription: {
    fontSize: 11,
    color: '#64748b',
  },
  navDescriptionActive: {
    color: '#bfdbfe',
  },
});

export default PersistentNavigation;
