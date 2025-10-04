import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import HomeScreen from './screens/HomeScreen';
import TeamScreen from './screens/TeamScreen';
import CreateTeamScreen from './screens/CreateTeamScreen';
import TournamentScreen from './screens/TournamentScreen';
import ProfileScreen from './screens/ProfileScreen';
import { store } from './store';
import PremiumBootstrapper from './components/PremiumBootstrapper';
import type { RootStackParamList } from './navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <PremiumBootstrapper>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Team" component={TeamScreen} />
            <Stack.Screen name="TeamScreen" component={TeamScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Create Team" component={CreateTeamScreen} />
            <Stack.Screen
              name="CreateTeamScreen"
              component={CreateTeamScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Tournaments" component={TournamentScreen} />
            <Stack.Screen name="TournamentScreen" component={TournamentScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </PremiumBootstrapper>
      </NavigationContainer>
    </Provider>
  );
};

export default App;
