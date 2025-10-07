import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';


import HomeScreen from './screens/HomeScreen';
import TeamScreen from './screens/TeamScreen';
import CreateTeamScreen from './screens/CreateTeamScreen';
import TournamentScreen from './screens/TournamentScreen';
import ProfileScreen from './screens/ProfileScreen';
import { store } from './store';
import { RootStackParamList } from './types/navigation';
import { useAppDispatch } from './store/hooks';
import { hydratePremium } from './store/slices/premiumSlice';
import { loadPremiumEntitlement } from './services/premiumStorage';


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
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Team" component={TeamScreen} />
            <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
            <Stack.Screen name="Tournaments" component={TournamentScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>

    </Provider>
  );
};

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
