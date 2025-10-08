import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PersistentNavigation, { NAVIGATION_HEIGHT } from './PersistentNavigation';

interface AuthenticatedScreenContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

const AuthenticatedScreenContainer: React.FC<AuthenticatedScreenContainerProps> = ({
  children,
  style,
  contentStyle,
}) => {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
      <PersistentNavigation />
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
    paddingBottom: NAVIGATION_HEIGHT + 16,
  },
});

export default AuthenticatedScreenContainer;
