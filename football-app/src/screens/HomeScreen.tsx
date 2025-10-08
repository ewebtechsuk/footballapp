import React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import BannerAdSlot from '../components/BannerAdSlot';
import { defaultBannerSize, homeBannerAdUnitId } from '../config/ads';
import { RootStackParamList } from '../types/navigation';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/slices/authSlice';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const greetingName =
    currentUser?.fullName?.trim().split(/\s+/)[0] ?? 'coach';
  const welcomeMessage = currentUser
    ? `Ready for another matchday, ${greetingName}?`
    : 'Sign in to unlock the full football experience.';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to the Football App!</Text>
        <Text style={styles.subtitle}>{welcomeMessage}</Text>
        <View style={styles.buttonGroup}>
          <View style={styles.buttonWrapper}>
            <Button title="Manage Teams" onPress={() => navigation.navigate('Team')} />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="Create a Team" onPress={() => navigation.navigate('CreateTeam')} />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="Join Tournaments" onPress={() => navigation.navigate('Tournaments')} />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
          </View>

        </View>
      </View>
      <BannerAdSlot unitId={homeBannerAdUnitId} size={defaultBannerSize} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonGroup: {
    width: '100%',
  },
  buttonWrapper: {
    marginBottom: 12,
  },
});

export default HomeScreen;
