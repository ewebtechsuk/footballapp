import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { AppRegistry, Platform, ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import TeamScreen from './screens/TeamScreen';
import CreateTeamScreen from './screens/CreateTeamScreen';
import ManageTeamScreen from './screens/ManageTeamScreen';
import TournamentScreen from './screens/TournamentScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import { store } from './store';
import { RootStackParamList } from './types/navigation';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { hydratePremium } from './store/slices/premiumSlice';
import { loadPremiumEntitlement } from './services/premiumStorage';
import { initializeAuth, selectCurrentUser } from './store/slices/authSlice';
import { initializeAdmin, selectAdminInitialized } from './store/slices/adminSlice';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Team" component={TeamScreen} />
          <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
          <Stack.Screen name="ManageTeam" component={ManageTeamScreen} options={{ title: 'Manage Team' }} />
          <Stack.Screen name="Tournaments" component={TournamentScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
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
