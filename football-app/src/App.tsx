import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { AppRegistry, Platform, ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import TeamScreen from './screens/TeamScreen';
import CreateTeamScreen from './screens/CreateTeamScreen';
import ManageTeamScreen from './screens/ManageTeamScreen';
import TournamentScreen from './screens/TournamentScreen';
import ProfileScreen from './screens/ProfileScreen';
import CreateMatchScreen from './screens/CreateMatchScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import { store } from './store';
import { AuthenticatedTabParamList, RootStackParamList } from './types/navigation';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { hydratePremium } from './store/slices/premiumSlice';
import { loadPremiumEntitlement } from './services/premiumStorage';
import { initializeAuth, selectCurrentUser } from './store/slices/authSlice';
import { initializeAdmin, selectAdminInitialized } from './store/slices/adminSlice';
import { hydrateTeams } from './store/slices/teamsSlice';
import { loadStoredTeams, persistTeams as persistTeamsToStorage } from './services/teamStorage';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<AuthenticatedTabParamList>();

const AuthenticatedTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Dashboard" component={HomeScreen} options={{ tabBarLabel: 'Dashboard' }} />
    <Tab.Screen
      name="ManageTeams"
      component={TeamScreen}
      options={{ title: 'Manage Teams', tabBarLabel: 'Manage Teams' }}
    />
    <Tab.Screen
      name="CreateMatch"
      component={CreateMatchScreen}
      options={{ title: 'Create a Match', tabBarLabel: 'Create a Match' }}
    />
    <Tab.Screen
      name="Tournaments"
      component={TournamentScreen}
      options={{ tabBarLabel: 'Tournaments' }}
    />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
);

const PremiumBootstrapper = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const hydrate = async () => {
      const storedEntitlement = await loadPremiumEntitlement();
      if (storedEntitlement) {
        dispatch(hydratePremium(storedEntitlement));
      }
    };

    hydrate();
  }, [dispatch]);

  return null;
};

const TeamsBootstrapper = () => {
  const dispatch = useAppDispatch();
  const teams = useAppSelector((state) => state.teams.teams);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const hydrateTeamsFromStorage = async () => {
      try {
        const storedTeams = await loadStoredTeams();
        if (!mounted) {
          return;
        }

        if (storedTeams) {
          dispatch(hydrateTeams(storedTeams));
        }
      } finally {
        if (mounted) {
          hydratedRef.current = true;
        }
      }
    };

    hydrateTeamsFromStorage();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }

    const persist = async () => {
      try {
        await persistTeamsToStorage(teams);
      } catch (error) {
        console.warn('Unable to save teams to storage', error);
      }
    };

    persist();
  }, [teams]);

  return null;
};

const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const authInitialized = useAppSelector((state) => state.auth.initialized);
  const adminInitialized = useAppSelector(selectAdminInitialized);

  useEffect(() => {
    if (!authInitialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, authInitialized]);

  useEffect(() => {
    if (!adminInitialized) {
      dispatch(initializeAdmin());
    }
  }, [dispatch, adminInitialized]);

  if (!authInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Preparing your football experience…</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {currentUser ? (
        <>
          <Stack.Screen name="MainTabs" component={AuthenticatedTabs} options={{ headerShown: false }} />
          <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
          <Stack.Screen
            name="ManageTeam"
            component={ManageTeamScreen}
            options={{ title: 'Manage Team' }}
          />
          {currentUser.role === 'admin' && (
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboardScreen}
              options={{ title: 'Admin Centre' }}
            />
          )}
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Create Account' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const App = () => {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      (async () => {
        try {
          const adsModule = await import('react-native-google-mobile-ads');
          const mobileAdsInstance = adsModule.default;

          await mobileAdsInstance().setRequestConfiguration({
            maxAdContentRating: adsModule.MaxAdContentRating.T,
          });

          await mobileAdsInstance().initialize();
        } catch (error) {
          console.error('Failed to initialize mobile ads', error);
        }
      })();
    }
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <PremiumBootstrapper />
        <TeamsBootstrapper />
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
  },
});

if (Platform.OS === 'web') {
  const applicationName = 'main';

  if (!AppRegistry.getRunnable?.(applicationName)) {
    AppRegistry.registerComponent(applicationName, () => App);
  }

  const rootTag =
    typeof document !== 'undefined'
      ? document.getElementById('root') ?? document.getElementById('main')
      : null;

  if (rootTag && !rootTag.hasChildNodes()) {
    AppRegistry.runApplication(applicationName, {
      initialProps: {},
      rootTag,
    });
  }
}

export default App;
