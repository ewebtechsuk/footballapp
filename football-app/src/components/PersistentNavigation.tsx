import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/slices/authSlice';
import type { RootStackParamList } from '../types/navigation';

export const NAVIGATION_HEIGHT = 72;

type NavKey = 'Home' | 'Team' | 'Tournaments' | 'Profile' | 'AdminDashboard';

interface NavItem {
  key: NavKey;
  label: string;
  route: keyof RootStackParamList;
  description: string;
}

const ROUTE_TO_KEY: Partial<Record<keyof RootStackParamList, NavKey>> = {
  Home: 'Home',
  Team: 'Team',
  CreateTeam: 'Team',
  ManageTeam: 'Team',
  Tournaments: 'Tournaments',
  Profile: 'Profile',
  AdminDashboard: 'AdminDashboard',
};

const PersistentNavigation: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const currentUser = useAppSelector(selectCurrentUser);

  const navItems = useMemo<NavItem[]>(() => {
    const baseItems: NavItem[] = [
      { key: 'Home', label: 'Home', route: 'Home', description: 'Overview' },
      { key: 'Team', label: 'Teams', route: 'Team', description: 'Manage squads' },
      { key: 'Tournaments', label: 'Tournaments', route: 'Tournaments', description: 'Compete' },
      { key: 'Profile', label: 'Profile', route: 'Profile', description: 'Account' },
    ];

    if (currentUser?.role === 'admin') {
      baseItems.splice(3, 0, {
        key: 'AdminDashboard',
        label: 'Admin',
        route: 'AdminDashboard',
        description: 'Operations',
      });
    }

    return baseItems;
  }, [currentUser?.role]);

  const activeKey = ROUTE_TO_KEY[route.name as keyof RootStackParamList] ?? 'Home';

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <TouchableOpacity
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => navigation.navigate(item.route)}
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
