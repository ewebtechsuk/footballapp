import React from 'react';

// Apply web-only shim to strip deprecated `pointerEvents` prop which triggers
// DevTools warnings on web. We import dynamically so native builds aren't affected.
if (typeof document !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('./web/shims/pointerEventsShim');
}
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import TeamScreen from './screens/TeamScreen';
import CreateTeamScreen from './screens/CreateTeamScreen';
import TournamentScreen from './screens/TournamentScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getLocalDevUser } from './services/auth';
import { subscribeDevUser } from './services/devAuth';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import store from './store';
import { setUser as setUserAction } from './store/slices/userSlice';

const Stack = createNativeStackNavigator();

const App = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // If a local dev user is set, use it. Otherwise subscribe to Firebase auth.
    // ensure dev user exists when running locally with dev auth enabled
    try {
      // lazy import to avoid circular issues
      const { ensureDevUser, getLocalDevUser } = require('./services/auth');
      ensureDevUser();
      const dev = getLocalDevUser();
      if (dev) {
        // populate redux user slice for dev so UI that reads from the store sees the user
        store.dispatch(
          setUserAction({ id: dev.uid, name: (dev as any).name ?? null, email: dev.email ?? null, teams: [] })
        );
      }
      if (dev) {
        setUser(dev);
        return;
      }
    } catch (e) {
      // fall back to normal auth subscription
    }
    
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    // Also subscribe to devAuth changes so setting dev user flips UI immediately
    const unsubDev = subscribeDevUser((u) => setUser(u as any));
    return () => {
      unsub();
      unsubDev();
    };
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Team" component={TeamScreen} />
            <Stack.Screen name="Create Team" component={CreateTeamScreen} />
            <Stack.Screen name="Tournaments" component={TournamentScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

export default App;